package handler

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/nimling/nimbody/respond"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
	"github.com/uptrace/bun"
)

type BodyFile struct {
	Path       string     `json:"path"`
	Name       string     `json:"name"`
	Type       string     `json:"type"`
	Size       int64      `json:"size"`
	Etag       string     `json:"etag"`
	BlockSize  int        `json:"block_size"`
	Blocks     []string   `json:"blocks"`
	CampaignID *uuid.UUID `json:"campaign_id"`
	Pieces     []string   `json:"pieces"`
}

func GetFile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	path := ctx.QueryParam("path")
	if path == "" {
		return respond.Error(ctx, http.StatusBadRequest, "path required")
	}
	rctx := ctx.Request().Context()
	var file db.File
	if err := db.Instance().NewSelect().Model(&file).Where("path = ?", path).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetFile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, file.ID, db.OBJECT_TYPE_FILE, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	return respond.JSON(ctx, http.StatusOK, file, 1)
}

func GetFilePieces(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	path := ctx.QueryParam("path")
	if path == "" {
		return respond.Error(ctx, http.StatusBadRequest, "path required")
	}
	rctx := ctx.Request().Context()
	var file db.File
	if err := db.Instance().NewSelect().Model(&file).Where("path = ?", path).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("GetFilePieces: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, file.ID, db.OBJECT_TYPE_FILE, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	pieces := make([]db.FilePiece, 0)
	if err := db.Instance().NewSelect().Model(&pieces).Where("file_id = ?", file.ID).OrderExpr("index").Scan(rctx); err != nil {
		ctx.Logger().Errorf("GetFilePieces: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, pieces, len(pieces))
}

func PostFile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	var body BodyFile
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	rctx := ctx.Request().Context()
	var campaign *db.Campaign
	if body.CampaignID != nil {
		if _, err := sdb.Instance().MutationAccess(rctx, actorID, *body.CampaignID, db.OBJECT_TYPE_CAMPAIGN, sdb.ACCESS_READ); err != nil {
			if errors.Is(err, sdb.ErrNotFound) {
				return respond.Error(ctx, http.StatusNotFound, "Not found")
			}
			return respond.Error(ctx, http.StatusForbidden, "Forbidden")
		}
		campaign = &db.Campaign{ID: *body.CampaignID}
		if err := db.Instance().NewSelect().Model(campaign).WherePK().Scan(rctx); err != nil {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		if !strings.HasPrefix(body.Path, "campaigns/"+campaign.ID.String()+"/files/") {
			return respond.Error(ctx, http.StatusBadRequest, "path must sit under the campaign's files")
		}
	} else if !strings.HasPrefix(body.Path, "users/"+actorID.String()+"/files/") {
		return respond.Error(ctx, http.StatusBadRequest, "path must sit under your own files")
	}
	w, err := postWriter(rctx, actorID)
	if err != nil {
		if errors.Is(err, errNoOwner) {
			ctx.Logger().Error(err)
			return respond.ErrorInternal(ctx)
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	if body.Blocks == nil {
		body.Blocks = []string{}
	}
	if body.BlockSize == 0 {
		body.BlockSize = 65536
	}
	file := db.File{
		UserID:     actorID,
		CampaignID: body.CampaignID,
		Path:       body.Path,
		Name:       body.Name,
		Type:       body.Type,
		Size:       body.Size,
		Etag:       body.Etag,
		Count:      len(body.Pieces),
		BlockSize:  body.BlockSize,
		Blocks:     body.Blocks,
		OwnerID:    w.OwnerID,
		CreatedBy:  w.Access.UserClaimID,
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&file).ExcludeColumn("id", "sa_created_at", "sa_updated_at", "sa_deleted_at").Returning("*").Exec(tctx); err != nil {
			return err
		}
		for index, data := range body.Pieces {
			piece := db.FilePiece{FileID: file.ID, Index: index, Data: data}
			if _, err := tx.NewInsert().Model(&piece).Exec(tctx); err != nil {
				return err
			}
		}
		if err := sdb.Write(tctx, tx, "PostFile", "create", db.OBJECT_TYPE_FILE, file.ID, file.OwnerID, w.Access.UserClaimID, file.Name); err != nil {
			return err
		}
		if campaign == nil {
			return postOwnerBinding(tctx, tx, w, db.OBJECT_TYPE_FILE, file.ID, sdb.ACCESS_MEMBER|sdb.ACCESS_READ)
		}
		if err := postOwnerBinding(tctx, tx, w, db.OBJECT_TYPE_FILE, file.ID, sdb.ACCESS_MEMBER); err != nil {
			return err
		}
		want := map[uuid.UUID]sdb.ClaimAccess{}
		if campaign.DmClaimID != nil {
			want[*campaign.DmClaimID] = sdb.ACCESS_ALL
		}
		if campaign.PlayerClaimID != nil {
			want[*campaign.PlayerClaimID] = sdb.ACCESS_READ
		}
		return putBindings(tctx, tx, w, db.OBJECT_TYPE_FILE, file.ID, want, nil)
	}); err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return respond.Error(ctx, http.StatusConflict, "A file is stored at that path")
		}
		ctx.Logger().Errorf("PostFile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusCreated, file, 1)
}

func DeleteFile(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	path := ctx.QueryParam("path")
	if path == "" {
		return respond.Error(ctx, http.StatusBadRequest, "path required")
	}
	rctx := ctx.Request().Context()
	var file db.File
	if err := db.Instance().NewSelect().Model(&file).Where("path = ?", path).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		ctx.Logger().Errorf("DeleteFile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, file.ID, db.OBJECT_TYPE_FILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewDelete().Model((*db.FilePiece)(nil)).Where("file_id = ?", file.ID).Exec(tctx); err != nil {
			return err
		}
		if _, err := tx.NewUpdate().Model(&file).Set("sa_deleted_at = NOW()").Set("path = ?", file.Path+"#"+file.ID.String()).WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "DeleteFile", "delete", db.OBJECT_TYPE_FILE, file.ID, file.OwnerID, ac.UserClaimID, file.Name)
	}); err != nil {
		ctx.Logger().Errorf("DeleteFile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.NoContent(ctx, http.StatusOK)
}
