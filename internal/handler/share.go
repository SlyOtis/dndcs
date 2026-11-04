package handler

import (
	"context"
	"errors"
	"os"

	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/google/uuid"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
	"github.com/uptrace/bun"
)

var errNoOwner = errors.New("SERVER_OWNER_ID is not a UUID")

type Writer struct {
	ActorID uuid.UUID
	OwnerID uuid.UUID
	Access  *sdb.AccessClaim
}

func postWriter(ctx context.Context, actorID uuid.UUID) (*Writer, error) {
	ownerID, err := uuid.Parse(os.Getenv("SERVER_OWNER_ID"))
	if err != nil {
		return nil, errNoOwner
	}
	ac, err := sdb.Instance().MutationAccess(ctx, actorID, ownerID, sdb.OBJECT_TYPE_ORGANIZATION, sdb.ACCESS_EXECUTE)
	if err != nil {
		return nil, err
	}
	if ac == nil || ac.UserClaimID == nil || ac.ClaimID == nil {
		return nil, sdb.ErrNoAccess
	}
	stamp := *ac
	stamp.OwnerID = ownerID
	return &Writer{ActorID: actorID, OwnerID: ownerID, Access: &stamp}, nil
}

func postOwnerBinding(ctx context.Context, tx bun.Tx, w *Writer, objectType string, objectID uuid.UUID, access sdb.ClaimAccess) error {
	t := sdb.ObjectType(objectType)
	binding := sdb.ClaimObject{
		ClaimID:    *w.Access.ClaimID,
		ObjectID:   &objectID,
		ObjectType: &t,
		Access:     &access,
		OwnerID:    w.OwnerID,
		RootID:     w.Access.RootID,
		CreatedBy:  w.Access.UserClaimID,
		Inherits:   true,
	}
	return sdb.Instance().NewInsert().Model(&binding).Access(w.Access).Conn(tx).Scan(ctx, &binding)
}

func postClaim(ctx context.Context, tx bun.Tx, w *Writer, name, description string, access sdb.ClaimAccess) (uuid.UUID, error) {
	claim := sdb.Claim{
		Name:        name,
		Description: &description,
		Access:      access,
		Inherits:    false,
		Type:        sdb.CLAIM_TYPE_USER,
		OwnerID:     w.OwnerID,
	}
	if err := sdb.Instance().NewInsert().Model(&claim).Access(w.Access).Conn(tx).Scan(ctx, &claim); err != nil {
		return uuid.Nil, err
	}
	return claim.ID, nil
}

func putBindings(ctx context.Context, tx bun.Tx, w *Writer, objectType string, objectID uuid.UUID, want map[uuid.UUID]sdb.ClaimAccess, managed []uuid.UUID) error {
	if len(managed) > 0 {
		existing, err := sdb.Instance().GetBindings(ctx, sdb.BindingFilters{
			ObjectType: sdb.ObjectType(objectType),
			ObjectIDs:  []uuid.UUID{objectID},
			ClaimIDs:   managed,
		})
		if err != nil {
			return err
		}
		for _, binding := range existing {
			if binding.DeletedAt != nil {
				continue
			}
			access, wanted := want[binding.ClaimID]
			if wanted && binding.Access != nil && *binding.Access == access {
				delete(want, binding.ClaimID)
				continue
			}
			gone := sdb.ClaimObject{ID: binding.ID, ClaimID: binding.ClaimID}
			if err := sdb.Instance().NewDelete().Model(&gone).Access(w.Access).Conn(tx).Scan(ctx, &gone); err != nil {
				return err
			}
		}
	}
	t := sdb.ObjectType(objectType)
	for claimID, access := range want {
		a := access
		binding := sdb.ClaimObject{
			ClaimID:    claimID,
			ObjectID:   &objectID,
			ObjectType: &t,
			Access:     &a,
			OwnerID:    w.OwnerID,
			RootID:     w.Access.RootID,
			CreatedBy:  w.Access.UserClaimID,
			Inherits:   true,
		}
		if err := sdb.Instance().NewInsert().Model(&binding).Access(w.Access).Conn(tx).Scan(ctx, &binding); err != nil {
			return err
		}
	}
	return nil
}

func getHolders(ctx context.Context, claimID *uuid.UUID) ([]uuid.UUID, error) {
	holders := make([]uuid.UUID, 0)
	if claimID == nil {
		return holders, nil
	}
	grants, err := sdb.Instance().GetGrants(ctx, sdb.GrantFilters{ClaimIDs: []uuid.UUID{*claimID}, NoClients: true})
	if err != nil {
		return nil, err
	}
	for _, grant := range grants {
		if grant.DeletedAt == nil {
			holders = append(holders, grant.UserID)
		}
	}
	return holders, nil
}

func putGrants(ctx context.Context, tx bun.Tx, w *Writer, claimID uuid.UUID, users []uuid.UUID) error {
	grants, err := sdb.Instance().GetGrants(ctx, sdb.GrantFilters{ClaimIDs: []uuid.UUID{claimID}, NoClients: true})
	if err != nil {
		return err
	}
	want := map[uuid.UUID]bool{}
	for _, user := range users {
		want[user] = true
	}
	for _, grant := range grants {
		if grant.DeletedAt != nil {
			continue
		}
		if want[grant.UserID] {
			delete(want, grant.UserID)
			continue
		}
		gone := sdb.UserClaim{ID: grant.ID, ClaimID: claimID}
		if err := sdb.Instance().NewDelete().Model(&gone).Access(w.Access).Conn(tx).Scan(ctx, &gone); err != nil {
			return err
		}
	}
	for user := range want {
		grant := sdb.UserClaim{ClaimID: claimID, UserID: user}
		if err := sdb.Instance().NewInsert().Model(&grant).Access(w.Access).Conn(tx).Scan(ctx, &grant); err != nil {
			return err
		}
	}
	return nil
}

func postGrant(ctx context.Context, tx bun.Tx, w *Writer, claimID, userID uuid.UUID) (uuid.UUID, error) {
	grant := sdb.UserClaim{ClaimID: claimID, UserID: userID}
	err := sdb.Instance().NewInsert().Model(&grant).Access(w.Access).Conn(tx).Scan(ctx, &grant)
	return grant.ID, err
}

func deleteGrant(ctx context.Context, tx bun.Tx, w *Writer, claimID, userID uuid.UUID) error {
	grants, err := sdb.Instance().GetGrants(ctx, sdb.GrantFilters{ClaimIDs: []uuid.UUID{claimID}, UserIDs: []uuid.UUID{userID}, NoClients: true})
	if err != nil {
		return err
	}
	for _, grant := range grants {
		if grant.DeletedAt != nil {
			continue
		}
		gone := sdb.UserClaim{ID: grant.ID, ClaimID: claimID}
		if err := sdb.Instance().NewDelete().Model(&gone).Access(w.Access).Conn(tx).Scan(ctx, &gone); err != nil {
			return err
		}
	}
	return nil
}

func putShare(ctx context.Context, tx bun.Tx, w *Writer, objectType string, objectID uuid.UUID, share *db.Share, fixed map[uuid.UUID]sdb.ClaimAccess, fixedManaged []uuid.UUID) error {
	want := map[uuid.UUID]sdb.ClaimAccess{}
	managed := append([]uuid.UUID{}, fixedManaged...)
	for claimID, access := range fixed {
		want[claimID] = access
	}
	read := sdb.ACCESS_READ
	if len(share.ShareCampaigns) > 0 {
		campaigns := make([]db.Campaign, 0)
		if err := tx.NewSelect().Model(&campaigns).Where("id IN (?)", bun.In(share.ShareCampaigns)).Scan(ctx); err != nil {
			return err
		}
		for _, campaign := range campaigns {
			for _, claimID := range []*uuid.UUID{campaign.DmClaimID, campaign.PlayerClaimID} {
				if claimID == nil {
					continue
				}
				managed = append(managed, *claimID)
				want[*claimID] = want[*claimID] | read
			}
		}
	}
	if len(share.ShareParties) > 0 {
		parties := make([]db.Party, 0)
		if err := tx.NewSelect().Model(&parties).Where("id IN (?)", bun.In(share.ShareParties)).Scan(ctx); err != nil {
			return err
		}
		for _, party := range parties {
			if party.MemberClaimID == nil {
				continue
			}
			managed = append(managed, *party.MemberClaimID)
			want[*party.MemberClaimID] = want[*party.MemberClaimID] | read
		}
	}
	if share.ReaderClaimID == nil && len(share.ShareUsers) > 0 {
		claimID, err := postClaim(ctx, tx, w, "Readers", "Read on one shared page", sdb.ACCESS_READ)
		if err != nil {
			return err
		}
		share.ReaderClaimID = &claimID
		if _, err := tx.NewUpdate().Table(objectTypeTable(objectType)).Set("reader_claim_id = ?", claimID).Where("id = ?", objectID).Exec(ctx); err != nil {
			return err
		}
	}
	if share.ReaderClaimID != nil {
		managed = append(managed, *share.ReaderClaimID)
		if len(share.ShareUsers) > 0 {
			want[*share.ReaderClaimID] = want[*share.ReaderClaimID] | read
		}
		if err := putGrants(ctx, tx, w, *share.ReaderClaimID, share.ShareUsers); err != nil {
			return err
		}
	}
	previous := make([]uuid.UUID, 0)
	if err := tx.NewRaw("SELECT unnest(share_campaigns) FROM ? WHERE id = ?", bun.Ident(objectTypeTable(objectType)), objectID).Scan(ctx, &previous); err == nil {
		campaigns := make([]db.Campaign, 0)
		if len(previous) > 0 {
			if err := tx.NewSelect().Model(&campaigns).Where("id IN (?)", bun.In(previous)).Scan(ctx); err != nil {
				return err
			}
		}
		for _, campaign := range campaigns {
			for _, claimID := range []*uuid.UUID{campaign.DmClaimID, campaign.PlayerClaimID} {
				if claimID != nil {
					managed = append(managed, *claimID)
				}
			}
		}
	}
	previousParties := make([]uuid.UUID, 0)
	if err := tx.NewRaw("SELECT unnest(share_parties) FROM ? WHERE id = ?", bun.Ident(objectTypeTable(objectType)), objectID).Scan(ctx, &previousParties); err == nil && len(previousParties) > 0 {
		parties := make([]db.Party, 0)
		if err := tx.NewSelect().Model(&parties).Where("id IN (?)", bun.In(previousParties)).Scan(ctx); err != nil {
			return err
		}
		for _, party := range parties {
			if party.MemberClaimID != nil {
				managed = append(managed, *party.MemberClaimID)
			}
		}
	}
	return putBindings(ctx, tx, w, objectType, objectID, want, managed)
}

func objectTypeTable(objectType string) string {
	switch objectType {
	case db.OBJECT_TYPE_RESOURCE:
		return "resource"
	case db.OBJECT_TYPE_SONG:
		return "song"
	case db.OBJECT_TYPE_ENCOUNTER:
		return "encounter"
	}
	return ""
}
