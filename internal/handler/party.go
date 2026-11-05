package handler

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/SlyOtis/quillborne/internal/broker"
	"github.com/SlyOtis/quillborne/internal/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/nimling/nimbody/respond"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
	"github.com/uptrace/bun"
)

type BodyParty struct {
	Name         *string      `json:"name"`
	Description  *string      `json:"description"`
	ImageURL     *string      `json:"image_url"`
	MemberIDs    *[]uuid.UUID `json:"member_ids"`
	CharacterIDs *[]uuid.UUID `json:"character_ids"`
}

func getPartyView(ctx context.Context, parties []db.Party) error {
	for i := range parties {
		members, err := getHolders(ctx, parties[i].MemberClaimID)
		if err != nil {
			return err
		}
		seen := false
		for _, member := range members {
			if member == parties[i].UserID {
				seen = true
			}
		}
		if !seen {
			members = append([]uuid.UUID{parties[i].UserID}, members...)
		}
		parties[i].MemberIDs = members
		if parties[i].CharacterIDs == nil {
			parties[i].CharacterIDs = []uuid.UUID{}
		}
	}
	return nil
}

func GetParties(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	rctx := ctx.Request().Context()
	parties := make([]db.Party, 0)
	q := db.Instance().NewSelect().Model(&parties)
	q = sdb.ObjectWhere(q, actorID, db.OBJECT_TYPE_PARTY, sdb.ACCESS_READ, nil, nil, 0)
	if err := q.Scan(rctx); err != nil {
		ctx.Logger().Errorf("GetParties: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if err := getPartyView(rctx, parties); err != nil {
		ctx.Logger().Errorf("GetParties: %v", err)
		return respond.ErrorInternal(ctx)
	}
	sort.Slice(parties, func(a, b int) bool { return parties[a].Name < parties[b].Name })
	return respond.JSON(ctx, http.StatusOK, parties, len(parties))
}

func GetParty(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	partyID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	rctx := ctx.Request().Context()
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, partyID, db.OBJECT_TYPE_PARTY, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	party := db.Party{ID: partyID}
	if err := db.Instance().NewSelect().Model(&party).WherePK().Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	parties := []db.Party{party}
	if err := getPartyView(rctx, parties); err != nil {
		ctx.Logger().Errorf("GetParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, parties[0], 1)
}

func PostParty(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var body BodyParty
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	if body.Name == nil || strings.TrimSpace(*body.Name) == "" {
		return respond.Error(ctx, http.StatusBadRequest, "name required")
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
	party := db.Party{
		UserID:       actorID,
		Name:         strings.TrimSpace(*body.Name),
		CharacterIDs: []uuid.UUID{},
		OwnerID:      w.OwnerID,
		CreatedBy:    w.Access.UserClaimID,
	}
	if body.Description != nil {
		party.Description = *body.Description
	}
	if body.ImageURL != nil {
		party.ImageURL = *body.ImageURL
	}
	if body.CharacterIDs != nil {
		party.CharacterIDs = *body.CharacterIDs
	}
	members := []uuid.UUID{actorID}
	if body.MemberIDs != nil {
		members = append(members, *body.MemberIDs...)
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&party).ExcludeColumn("id", "sa_created_at", "sa_updated_at", "sa_deleted_at").Returning("*").Exec(tctx); err != nil {
			return err
		}
		if err := sdb.Write(tctx, tx, "PostParty", "create", db.OBJECT_TYPE_PARTY, party.ID, party.OwnerID, w.Access.UserClaimID, party.Name); err != nil {
			return err
		}
		if err := postOwnerBinding(tctx, tx, w, db.OBJECT_TYPE_PARTY, party.ID, sdb.ACCESS_MEMBER); err != nil {
			return err
		}
		memberClaimID, err := postClaim(tctx, tx, w, "Party members", "Travels with "+party.Name, sdb.ACCESS_READ)
		if err != nil {
			return err
		}
		if err := putBindings(tctx, tx, w, db.OBJECT_TYPE_PARTY, party.ID, map[uuid.UUID]sdb.ClaimAccess{memberClaimID: sdb.ACCESS_READ}, nil); err != nil {
			return err
		}
		if err := putGrants(tctx, tx, w, memberClaimID, getUnique(members)); err != nil {
			return err
		}
		party.MemberClaimID = &memberClaimID
		_, err = tx.NewUpdate().Model(&party).Column("member_claim_id").WherePK().Exec(tctx)
		return err
	}); err != nil {
		ctx.Logger().Errorf("PostParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	party.MemberIDs = getUnique(members)
	return respond.JSON(ctx, http.StatusCreated, party, 1)
}

func PutParty(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	partyID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	var body BodyParty
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	rctx := ctx.Request().Context()
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, partyID, db.OBJECT_TYPE_PARTY, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	party := db.Party{ID: partyID}
	if err := db.Instance().NewSelect().Model(&party).WherePK().Scan(rctx); err != nil {
		return respond.Error(ctx, http.StatusNotFound, "Not found")
	}
	columns := []string{"sa_updated_at"}
	if body.Name != nil {
		if strings.TrimSpace(*body.Name) == "" {
			return respond.Error(ctx, http.StatusBadRequest, "name cannot be empty")
		}
		party.Name = strings.TrimSpace(*body.Name)
		columns = append(columns, "name")
	}
	if body.Description != nil {
		party.Description = *body.Description
		columns = append(columns, "description")
	}
	if body.ImageURL != nil {
		party.ImageURL = *body.ImageURL
		columns = append(columns, "image_url")
	}
	if body.CharacterIDs != nil {
		party.CharacterIDs = *body.CharacterIDs
		columns = append(columns, "character_ids")
	}
	party.UpdatedAt = time.Now()
	var w *Writer
	if body.MemberIDs != nil {
		w, err = postWriter(rctx, actorID)
		if err != nil || party.MemberClaimID == nil {
			return respond.Error(ctx, http.StatusForbidden, "Forbidden")
		}
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&party).Column(columns...).WherePK().Exec(tctx); err != nil {
			return err
		}
		if w != nil {
			members := append([]uuid.UUID{party.UserID}, *body.MemberIDs...)
			if err := putGrants(tctx, tx, w, *party.MemberClaimID, getUnique(members)); err != nil {
				return err
			}
		}
		return sdb.Write(tctx, tx, "PutParty", "update", db.OBJECT_TYPE_PARTY, party.ID, party.OwnerID, ac.UserClaimID, party.Name)
	}); err != nil {
		ctx.Logger().Errorf("PutParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.PartyTopic(party.ID), broker.KindParty, party.ID.String(), broker.OpUpdate)
	parties := []db.Party{party}
	if err := getPartyView(rctx, parties); err != nil {
		ctx.Logger().Errorf("PutParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, parties[0], 1)
}

func DeleteParty(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	partyID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	rctx := ctx.Request().Context()
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, partyID, db.OBJECT_TYPE_PARTY, sdb.ACCESS_OWNER)
	if err != nil || ac == nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	party := db.Party{ID: partyID}
	if err := db.Instance().NewSelect().Model(&party).WherePK().Scan(rctx); err != nil {
		return respond.Error(ctx, http.StatusNotFound, "Not found")
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&party).Set("sa_deleted_at = NOW()").WherePK().Exec(tctx); err != nil {
			return err
		}
		if _, err := tx.NewUpdate().Table("campaign").Set("party_ids = array_remove(party_ids, ?::uuid)", partyID).Where("? = ANY(party_ids)", partyID).Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "DeleteParty", "delete", db.OBJECT_TYPE_PARTY, party.ID, party.OwnerID, ac.UserClaimID, party.Name)
	}); err != nil {
		ctx.Logger().Errorf("DeleteParty: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.PartyTopic(party.ID), broker.KindParty, party.ID.String(), broker.OpDelete)
	return respond.NoContent(ctx, http.StatusOK)
}

func PostPartyCharacter(ctx echo.Context) error {
	return putPartyCharacter(ctx, true)
}

func DeletePartyCharacter(ctx echo.Context) error {
	return putPartyCharacter(ctx, false)
}

func putPartyCharacter(ctx echo.Context, joins bool) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	partyID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	characterID, err := uuid.Parse(ctx.Param("character_id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid character_id, expected UUID")
	}
	rctx := ctx.Request().Context()
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, partyID, db.OBJECT_TYPE_PARTY, sdb.ACCESS_READ)
	if err != nil || ac == nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	party := db.Party{ID: partyID}
	if err := db.Instance().NewSelect().Model(&party).WherePK().Scan(rctx); err != nil {
		return respond.Error(ctx, http.StatusNotFound, "Not found")
	}
	set := "character_ids = array_remove(character_ids, ?::uuid)"
	if joins {
		set = "character_ids = array_append(array_remove(character_ids, ?0::uuid), ?0::uuid)"
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&party).Set(set, characterID).Set("sa_updated_at = NOW()").WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "PutPartyCharacter", "update", db.OBJECT_TYPE_PARTY, party.ID, party.OwnerID, ac.UserClaimID, "Changed who travels with "+party.Name)
	}); err != nil {
		ctx.Logger().Errorf("PutPartyCharacter: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.PartyTopic(party.ID), broker.KindParty, party.ID.String(), broker.OpUpdate)
	return respond.NoContent(ctx, http.StatusOK)
}

func getUnique(ids []uuid.UUID) []uuid.UUID {
	seen := map[uuid.UUID]bool{}
	unique := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if id == uuid.Nil || seen[id] {
			continue
		}
		seen[id] = true
		unique = append(unique, id)
	}
	return unique
}

func getUUID(raw string) (uuid.UUID, bool) {
	id, err := uuid.Parse(raw)
	return id, err == nil
}
