package handler

import (
	"context"
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

const peerStale = 60 * time.Second

type BodySignal struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Kind    string `json:"kind"`
	Payload string `json:"payload"`
}

func GetPeers(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	campaignID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	rctx := ctx.Request().Context()
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, campaignID, db.OBJECT_TYPE_CAMPAIGN, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	peers := make([]db.Peer, 0)
	if err := db.Instance().NewSelect().Model(&peers).Where("campaign_id = ?", campaignID).Where("seen_at > ?", time.Now().Add(-peerStale)).Scan(rctx); err != nil {
		ctx.Logger().Errorf("GetPeers: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, peers, len(peers))
}

func PutPeer(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	campaignID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	peerID := ctx.Param("peer_id")
	if !strings.HasPrefix(peerID, actorID.String()+".") {
		return respond.Error(ctx, http.StatusForbidden, "A seat is your own user id and a suffix")
	}
	rctx := ctx.Request().Context()
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, campaignID, db.OBJECT_TYPE_CAMPAIGN, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	peer := db.Peer{ID: peerID, CampaignID: campaignID, UserID: actorID, SeenAt: time.Now()}
	if _, err := db.Instance().NewInsert().Model(&peer).On("CONFLICT (id) DO UPDATE").Set("seen_at = EXCLUDED.seen_at").Exec(rctx); err != nil {
		ctx.Logger().Errorf("PutPeer: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.CampaignTopic(campaignID), broker.KindPeer, peer.ID, broker.OpUpdate)
	return respond.JSON(ctx, http.StatusOK, peer, 1)
}

func DeletePeer(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	campaignID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	peerID := ctx.Param("peer_id")
	if !strings.HasPrefix(peerID, actorID.String()+".") {
		return respond.Error(ctx, http.StatusForbidden, "A seat is your own user id and a suffix")
	}
	rctx := ctx.Request().Context()
	if err := db.Instance().RunInTx(rctx, nil, func(tctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewDelete().Model((*db.Peer)(nil)).Where("id = ?", peerID).Where("campaign_id = ?", campaignID).Exec(tctx); err != nil {
			return err
		}
		_, err := tx.NewDelete().Model((*db.Signal)(nil)).Where("campaign_id = ?", campaignID).Where("to_peer = ?", peerID).Exec(tctx)
		return err
	}); err != nil {
		ctx.Logger().Errorf("DeletePeer: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.CampaignTopic(campaignID), broker.KindPeer, peerID, broker.OpDelete)
	return respond.NoContent(ctx, http.StatusOK)
}

func PostSignal(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	campaignID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	var body BodySignal
	if err := ctx.Bind(&body); err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid JSON body")
	}
	if !strings.HasPrefix(body.From, actorID.String()+".") {
		return respond.Error(ctx, http.StatusForbidden, "A signal comes from your own seat")
	}
	if body.Kind != "offer" && body.Kind != "answer" && body.Kind != "ice" {
		return respond.Error(ctx, http.StatusBadRequest, "kind must be offer, answer or ice")
	}
	rctx := ctx.Request().Context()
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, campaignID, db.OBJECT_TYPE_CAMPAIGN, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	signal := db.Signal{CampaignID: campaignID, FromPeer: body.From, ToPeer: body.To, Kind: body.Kind, Payload: body.Payload}
	if _, err := db.Instance().NewInsert().Model(&signal).ExcludeColumn("id", "created_at").Returning("*").Exec(rctx); err != nil {
		ctx.Logger().Errorf("PostSignal: %v", err)
		return respond.ErrorInternal(ctx)
	}
	broker.Post(rctx, broker.CampaignTopic(campaignID), broker.KindSignal, signal.ToPeer, broker.OpCreate)
	return respond.JSON(ctx, http.StatusCreated, signal, 1)
}

func DeleteSignals(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	campaignID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid id, expected UUID")
	}
	peerID := ctx.Param("peer_id")
	if !strings.HasPrefix(peerID, actorID.String()+".") {
		return respond.Error(ctx, http.StatusForbidden, "A seat is your own user id and a suffix")
	}
	rctx := ctx.Request().Context()
	if _, err := sdb.Instance().MutationAccess(rctx, actorID, campaignID, db.OBJECT_TYPE_CAMPAIGN, sdb.ACCESS_READ); err != nil {
		if errors.Is(err, sdb.ErrNotFound) {
			return respond.Error(ctx, http.StatusNotFound, "Not found")
		}
		return respond.Error(ctx, http.StatusForbidden, "Forbidden")
	}
	signals := make([]db.Signal, 0)
	if _, err := db.Instance().NewDelete().Model(&signals).Where("campaign_id = ?", campaignID).Where("to_peer = ?", peerID).Returning("*").Exec(rctx, &signals); err != nil {
		ctx.Logger().Errorf("DeleteSignals: %v", err)
		return respond.ErrorInternal(ctx)
	}
	return respond.JSON(ctx, http.StatusOK, signals, len(signals))
}
