package handler

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/SlyOtis/dndcs/internal/storage"
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
	CampaignID *uuid.UUID `json:"campaign_id"`
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
	file := db.File{
		UserID:     actorID,
		CampaignID: body.CampaignID,
		Path:       body.Path,
		Name:       body.Name,
		Type:       body.Type,
		StorageKey: body.Path,
		OwnerID:    w.OwnerID,
		CreatedBy:  w.Access.UserClaimID,
	}
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&file).ExcludeColumn("id", "sa_created_at", "sa_updated_at", "sa_deleted_at").Returning("*").Exec(tctx); err != nil {
			return err
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
		if _, err := tx.NewUpdate().Model(&file).Set("sa_deleted_at = NOW()").Set("path = ?", file.Path+"#"+file.ID.String()).WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "DeleteFile", "delete", db.OBJECT_TYPE_FILE, file.ID, file.OwnerID, ac.UserClaimID, file.Name)
	}); err != nil {
		ctx.Logger().Errorf("DeleteFile: %v", err)
		return respond.ErrorInternal(ctx)
	}
	if file.StorageKey != "" {
		if err := storage.Delete(rctx, file.StorageKey); err != nil {
			ctx.Logger().Errorf("DeleteFile blob: %v", err)
		}
	}
	return respond.NoContent(ctx, http.StatusOK)
}

func PutFileData(ctx echo.Context) error {
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
		ctx.Logger().Errorf("PutFileData: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ac, err := sdb.Instance().MutationAccess(rctx, actorID, file.ID, db.OBJECT_TYPE_FILE, sdb.ACCESS_WRITE)
	if err != nil || ac == nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	limit, err := strconv.ParseInt(os.Getenv("FILE_MAX_BYTES"), 10, 64)
	if err != nil || limit <= 0 {
		limit = 256 << 20
	}
	if ctx.Request().ContentLength > limit {
		return respond.Error(ctx, http.StatusRequestEntityTooLarge, "The file is larger than "+strconv.FormatInt(limit>>20, 10)+" MB")
	}
	body := http.MaxBytesReader(ctx.Response(), ctx.Request().Body, limit)
	digest := sha256.New()
	counted := &countReader{reader: io.TeeReader(body, digest)}
	if err := storage.Upload(rctx, file.StorageKey, counted, file.Type); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			return respond.Error(ctx, http.StatusRequestEntityTooLarge, "The file is larger than "+strconv.FormatInt(limit>>20, 10)+" MB")
		}
		ctx.Logger().Errorf("PutFileData: %v", err)
		return respond.ErrorInternal(ctx)
	}
	file.Size = counted.count
	file.Etag = base64.RawURLEncoding.EncodeToString(digest.Sum(nil))
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(&file).Column("size", "etag").Set("sa_updated_at = NOW()").WherePK().Exec(tctx); err != nil {
			return err
		}
		return sdb.Write(tctx, tx, "PutFileData", "update", db.OBJECT_TYPE_FILE, file.ID, file.OwnerID, ac.UserClaimID, file.Name)
	}); err != nil {
		ctx.Logger().Errorf("PutFileData: %v", err)
		return respond.ErrorInternal(ctx)
	}
	ctx.Response().Header().Set("ETag", `"`+file.Etag+`"`)
	return respond.JSON(ctx, http.StatusOK, file, 1)
}

func GetFileData(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return ctx.NoContent(http.StatusUnauthorized)
	}
	path := ctx.QueryParam("path")
	if path == "" {
		return ctx.NoContent(http.StatusBadRequest)
	}
	rctx := ctx.Request().Context()
	var file db.File
	if err := db.Instance().NewSelect().Model(&file).Where("path = ?", path).Scan(rctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.NoContent(http.StatusNotFound)
		}
		ctx.Logger().Errorf("GetFileData: %v", err)
		return ctx.NoContent(http.StatusInternalServerError)
	}
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, file.ID, db.OBJECT_TYPE_FILE, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return ctx.NoContent(http.StatusNotFound)
		}
		return ctx.NoContent(http.StatusForbidden)
	}
	if file.Etag == "" {
		return ctx.NoContent(http.StatusNotFound)
	}
	header := ctx.Response().Header()
	etag := `"` + file.Etag + `"`
	header.Set("ETag", etag)
	header.Set("Accept-Ranges", "bytes")
	header.Set("Cache-Control", "private, max-age=0, must-revalidate")
	if match := ctx.Request().Header.Get("If-None-Match"); match == etag || match == file.Etag {
		return ctx.NoContent(http.StatusNotModified)
	}
	start, end, ranged, ok := getRange(ctx.Request().Header.Get("Range"), file.Size)
	if !ok {
		header.Set("Content-Range", "bytes */"+strconv.FormatInt(file.Size, 10))
		return ctx.NoContent(http.StatusRequestedRangeNotSatisfiable)
	}
	status := http.StatusOK
	if ranged {
		status = http.StatusPartialContent
		header.Set("Content-Range", "bytes "+strconv.FormatInt(start, 10)+"-"+strconv.FormatInt(end, 10)+"/"+strconv.FormatInt(file.Size, 10))
	}
	header.Set("Content-Length", strconv.FormatInt(end-start+1, 10))
	if ctx.Request().Method == http.MethodHead {
		header.Set("Content-Type", file.Type)
		return ctx.NoContent(status)
	}
	reader, err := storage.Download(rctx, file.StorageKey, start, end-start+1)
	if err != nil {
		if storage.IsMissing(err) {
			return ctx.NoContent(http.StatusNotFound)
		}
		ctx.Logger().Errorf("GetFileData: %v", err)
		return ctx.NoContent(http.StatusInternalServerError)
	}
	defer reader.Close()
	return ctx.Stream(status, file.Type, reader)
}

type countReader struct {
	reader io.Reader
	count  int64
}

func (c *countReader) Read(p []byte) (int, error) {
	n, err := c.reader.Read(p)
	c.count += int64(n)
	return n, err
}

func getRange(value string, size int64) (int64, int64, bool, bool) {
	if size <= 0 {
		return 0, -1, false, value == ""
	}
	if value == "" {
		return 0, size - 1, false, true
	}
	spec, found := strings.CutPrefix(value, "bytes=")
	if !found || strings.Contains(spec, ",") {
		return 0, 0, false, false
	}
	first, last, found := strings.Cut(spec, "-")
	if !found {
		return 0, 0, false, false
	}
	if first == "" {
		suffix, err := strconv.ParseInt(last, 10, 64)
		if err != nil || suffix <= 0 {
			return 0, 0, false, false
		}
		if suffix > size {
			suffix = size
		}
		return size - suffix, size - 1, true, true
	}
	start, err := strconv.ParseInt(first, 10, 64)
	if err != nil || start < 0 || start >= size {
		return 0, 0, false, false
	}
	end := size - 1
	if last != "" {
		end, err = strconv.ParseInt(last, 10, 64)
		if err != nil || end < start {
			return 0, 0, false, false
		}
		if end > size-1 {
			end = size - 1
		}
	}
	return start, end, true, true
}
