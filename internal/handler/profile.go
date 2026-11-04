package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/SlyOtis/dndcs/internal/broker"
	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/nimling/nimbody/respond"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
	"github.com/uptrace/bun"
)

type BodyProfile struct {
	Email       *string          `json:"email"`
	DisplayName *string          `json:"display_name"`
	PhotoURL    *string          `json:"photo_url"`
	Preferences *json.RawMessage `json:"preferences"`
	Friends     *[]uuid.UUID     `json:"friends"`
}

type BodyFriend struct {
	Email string `json:"email"`
}

const defaultPreferences = `{"theme":"medieval","sound_enabled":true,"sound_volume":0.7,"animations_enabled":true,"recent_characters":[]}`

func GetProfile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetProfile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	return respond.JSON(ctx, http.StatusOK, profile, 1)
}

func GetProfiles(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	profiles := make([]db.Profile, 0)
	q := db.Instance().NewSelect().Model(&profiles)
	if email := strings.TrimSpace(strings.ToLower(ctx.QueryParam("email"))); email != "" {
		q = q.Where("lower(email) = ?", email).Limit(1)
	}
	if raw := ctx.QueryParam("ids"); raw != "" {
		ids := make([]uuid.UUID, 0)
		for _, part := range strings.Split(raw, ",") {
			id, err := uuid.Parse(strings.TrimSpace(part))
			if err != nil {
				return respond.Error(ctx, http.StatusBadRequest, "Invalid ids, expected UUIDs")
			}
			ids = append(ids, id)
		}
		q = q.Where("user_id IN (?)", bun.In(ids))
	}
	if ctx.QueryParam("email") == "" && ctx.QueryParam("ids") == "" {
		return respond.Error(ctx, http.StatusBadRequest, "email or ids required")
	}
	q = sdb.ObjectWhere(q, actorID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_READ, nil, nil, 0)
	if err := q.Scan(ctx.Request().Context()); err != nil {
		ctx.Logger().Errorf("GetProfiles: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, profiles, len(profiles))
}

func GetProfileUser(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	userID, err := uuid.Parse(ctx.Param("user_id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid user_id, expected UUID")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", userID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetProfileUser: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_READ); err != nil {
		return respond.Error(ctx, http.StatusNotFound, "Not found")
	}
	return respond.JSON(ctx, http.StatusOK, profile, 1)
}

func PostProfile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var body BodyProfile
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	rctx := ctx.Request().Context()
	w, err := postWriter(rctx, actorID)
	if err != nil {
		if errors.Is(err, errNoOwner) {
			ctx.Logger().Error(err)
			return respond.ErrorInternal(ctx)
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	exists, err := db.Instance().NewSelect().Model((*db.Profile)(nil)).Where("user_id = ?", actorID).Exists(rctx)
	if err != nil {
		ctx.Logger().Errorf("PostProfile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if exists {
		return respond.Error(ctx, http.StatusConflict, "The profile exists")
	}
	profile := db.Profile{
		UserID:      actorID,
		Preferences: json.RawMessage(defaultPreferences),
		Friends:     []uuid.UUID{},
		Details:     json.RawMessage(`{}`),
		OwnerID:     w.OwnerID,
		CreatedBy:   w.Access.UserClaimID,
	}
	if body.Email != nil {
		profile.Email = strings.TrimSpace(strings.ToLower(*body.Email))
	}
	if body.DisplayName != nil {
		profile.DisplayName = *body.DisplayName
	}
	if body.PhotoURL != nil {
		profile.PhotoURL = *body.PhotoURL
	}
	if body.Preferences != nil {
		profile.Preferences = *body.Preferences
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&profile).ExcludeColumn("id", "sa_created_at", "sa_updated_at", "sa_deleted_at").Returning("*").Exec(tctx); err != nil {
			return err
		}
		if err := sdb.Write(tctx, tx, "PostProfile", "create", db.OBJECT_TYPE_PROFILE, profile.ID, profile.OwnerID, w.Access.UserClaimID, profile.DisplayName); err != nil {
			return err
		}
		return postOwnerBinding(tctx, tx, w, db.OBJECT_TYPE_PROFILE, profile.ID, sdb.ACCESS_MEMBER|sdb.ACCESS_READ)
	}); err != nil {
		ctx.Logger().Errorf("PostProfile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(ctx.Request().Context(), broker.ProfileTopic(actorID), broker.KindProfile, actorID.String(), broker.OpCreate)
	return respond.JSON(ctx, http.StatusCreated, profile, 1)
}

func PutProfile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var body BodyProfile
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("PutProfile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	columns := []string{"sa_updated_at"}
	if body.Email != nil {
		profile.Email = strings.TrimSpace(strings.ToLower(*body.Email))
		columns = append(columns, "email")
	}
	if body.DisplayName != nil {
		profile.DisplayName = *body.DisplayName
		columns = append(columns, "display_name")
	}
	if body.PhotoURL != nil {
		profile.PhotoURL = *body.PhotoURL
		columns = append(columns, "photo_url")
	}
	if body.Preferences != nil {
		profile.Preferences = *body.Preferences
		columns = append(columns, "preferences")
	}
	if body.Friends != nil {
		profile.Friends = *body.Friends
		columns = append(columns, "friends")
	}
	profile.UpdatedAt = time.Now()
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&profile).Column(columns...).WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "PutProfile", "update", db.OBJECT_TYPE_PROFILE, profile.ID, profile.OwnerID, ac.UserClaimID, profile.DisplayName)
	}); err != nil {
		ctx.Logger().Errorf("PutProfile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(ctx.Request().Context(), broker.ProfileTopic(actorID), broker.KindProfile, actorID.String(), broker.OpUpdate)
	return respond.JSON(ctx, http.StatusOK, profile, 1)
}

func PostProfileFriend(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var body BodyFriend
	if err := ctx.Bind(&body); err != nil || strings.TrimSpace(body.Email) == "" {
		return respond.Error(ctx, http.StatusBadRequest, "email required")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("PostProfileFriend: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	var found db.Profile
	q := db.Instance().NewSelect().Model(&found).Where("lower(email) = ?", strings.TrimSpace(strings.ToLower(body.Email))).Limit(1)
	q = sdb.ObjectWhere(q, actorID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_READ, nil, nil, 0)
	if err := q.Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Nobody signs in with that address.")
		}
		ctx.Logger().Errorf("PostProfileFriend: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if found.UserID == actorID {
		return respond.Error(ctx, http.StatusBadRequest, "That address is your own.")
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&profile).
			Set("friends = array_append(array_remove(friends, ?::uuid), ?::uuid)", found.UserID, found.UserID).
			Set("sa_updated_at = NOW()").
			WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "PostProfileFriend", "update", db.OBJECT_TYPE_PROFILE, profile.ID, profile.OwnerID, ac.UserClaimID, "Added a friend")
	}); err != nil {
		ctx.Logger().Errorf("PostProfileFriend: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(ctx.Request().Context(), broker.ProfileTopic(actorID), broker.KindProfile, actorID.String(), broker.OpUpdate)
	return respond.JSON(ctx, http.StatusCreated, found, 1)
}

func DeleteProfileFriend(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	friendID, err := uuid.Parse(ctx.Param("user_id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid user_id, expected UUID")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("DeleteProfileFriend: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&profile).
			Set("friends = array_remove(friends, ?::uuid)", friendID).
			Set("sa_updated_at = NOW()").
			WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "DeleteProfileFriend", "update", db.OBJECT_TYPE_PROFILE, profile.ID, profile.OwnerID, ac.UserClaimID, "Removed a friend")
	}); err != nil {
		ctx.Logger().Errorf("DeleteProfileFriend: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(ctx.Request().Context(), broker.ProfileTopic(actorID), broker.KindProfile, actorID.String(), broker.OpDelete)
	return respond.NoContent(ctx, http.StatusOK)
}

func GetProfileDetails(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetProfileDetails: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_WRITE); err != nil {
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	return respond.JSON(ctx, http.StatusOK, profile.Details, 1)
}

func PutProfileDetails(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var details map[string]any
	if err := ctx.Bind(&details); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	rctx := ctx.Request().Context()
	var profile db.Profile
	if err := db.Instance().NewSelect().Model(&profile).Where("user_id = ?", actorID).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("PutProfileDetails: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, profile.ID, db.OBJECT_TYPE_PROFILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	merged := map[string]any{}
	_ = json.Unmarshal(profile.Details, &merged)
	for key, value := range details {
		merged[key] = value
	}
	encoded, err := json.Marshal(merged)
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	profile.Details = encoded
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&profile).Column("details").Set("sa_updated_at = NOW()").WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "PutProfileDetails", "update", db.OBJECT_TYPE_PROFILE, profile.ID, profile.OwnerID, ac.UserClaimID, "Changed the integration keys")
	}); err != nil {
		ctx.Logger().Errorf("PutProfileDetails: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, profile.Details, 1)
}
