package db

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

const (
	OBJECT_TYPE_PROFILE       = "public.profile"
	OBJECT_TYPE_CAMPAIGN      = "public.campaign"
	OBJECT_TYPE_PARTY         = "public.party"
	OBJECT_TYPE_CAMPAIGN_MAP  = "public.campaign_map"
	OBJECT_TYPE_ENCOUNTER     = "public.encounter"
	OBJECT_TYPE_CHAT_ENTRY    = "public.chat_entry"
	OBJECT_TYPE_SONG          = "public.song"
	OBJECT_TYPE_CHARACTER     = "public.character"
	OBJECT_TYPE_RESOURCE      = "public.resource"
	OBJECT_TYPE_FILE          = "public.file"
	OBJECT_TYPE_CATALOG_ENTRY = "public.catalog_entry"
)

type Profile struct {
	bun.BaseModel `bun:"table:profile"`

	ID          uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"-"`
	UserID      uuid.UUID       `bun:"user_id" json:"uid"`
	Email       string          `bun:"email" json:"email"`
	DisplayName string          `bun:"display_name" json:"display_name"`
	PhotoURL    string          `bun:"photo_url" json:"photo_url"`
	Preferences json.RawMessage `bun:"preferences,type:jsonb" json:"preferences"`
	Friends     []uuid.UUID     `bun:"friends,array" json:"friends"`
	Details     json.RawMessage `bun:"details,type:jsonb" json:"-"`
	OwnerID     uuid.UUID       `bun:"sa_owner_id" json:"-"`
	CreatedBy   *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt   time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt   time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt   bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Campaign struct {
	bun.BaseModel `bun:"table:campaign"`

	ID            uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID       `bun:"user_id" json:"dm_id"`
	Name          string          `bun:"name" json:"name"`
	Description   string          `bun:"description" json:"description"`
	IsActive      bool            `bun:"is_active" json:"is_active"`
	Settings      json.RawMessage `bun:"settings,type:jsonb" json:"settings"`
	PartyIDs      []uuid.UUID     `bun:"party_ids,array" json:"party_ids"`
	DmClaimID     *uuid.UUID      `bun:"dm_claim_id" json:"-"`
	PlayerClaimID *uuid.UUID      `bun:"player_claim_id" json:"-"`
	PlayerIDs     []uuid.UUID     `bun:"-" json:"player_ids"`
	CharacterIDs  []uuid.UUID     `bun:"-" json:"character_ids"`
	OwnerID       uuid.UUID       `bun:"sa_owner_id" json:"-"`
	CreatedBy     *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt     time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt     time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt     bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Party struct {
	bun.BaseModel `bun:"table:party"`

	ID            uuid.UUID    `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID    `bun:"user_id" json:"owner_id"`
	Name          string       `bun:"name" json:"name"`
	Description   string       `bun:"description" json:"description"`
	ImageURL      string       `bun:"image_url" json:"image_url"`
	CharacterIDs  []uuid.UUID  `bun:"character_ids,array" json:"character_ids"`
	MemberClaimID *uuid.UUID   `bun:"member_claim_id" json:"-"`
	MemberIDs     []uuid.UUID  `bun:"-" json:"member_ids"`
	OwnerID       uuid.UUID    `bun:"sa_owner_id" json:"-"`
	CreatedBy     *uuid.UUID   `bun:"sa_created_by" json:"-"`
	CreatedAt     time.Time    `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt     time.Time    `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt     bun.NullTime `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type CampaignMap struct {
	bun.BaseModel `bun:"table:campaign_map"`

	ID          uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	CampaignID  uuid.UUID       `bun:"campaign_id" json:"campaign_id"`
	UserID      uuid.UUID       `bun:"user_id" json:"owner_id"`
	Title       string          `bun:"title" json:"title"`
	ImageURL    string          `bun:"image_url" json:"image_url"`
	Layers      json.RawMessage `bun:"layers,type:jsonb" json:"layers"`
	Markers     json.RawMessage `bun:"markers,type:jsonb" json:"markers"`
	IsVisible   bool            `bun:"is_visible" json:"is_visible"`
	MinZoom     float64         `bun:"min_zoom" json:"min_zoom"`
	MaxZoom     float64         `bun:"max_zoom" json:"max_zoom"`
	ParentMapID *uuid.UUID      `bun:"-" json:"parent_map_id,omitempty"`
	OwnerID     uuid.UUID       `bun:"sa_owner_id" json:"-"`
	ParentID    uuid.UUID       `bun:"sa_parent_id" json:"-"`
	RootID      uuid.UUID       `bun:"sa_root_id" json:"-"`
	CreatedBy   *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt   time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt   time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt   bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Share struct {
	ShareUsers     []uuid.UUID `bun:"share_users,array" json:"share_users"`
	ShareCampaigns []uuid.UUID `bun:"share_campaigns,array" json:"share_campaigns"`
	ShareParties   []uuid.UUID `bun:"share_parties,array" json:"share_parties"`
	ReaderClaimID  *uuid.UUID  `bun:"reader_claim_id" json:"-"`
}

type Encounter struct {
	bun.BaseModel `bun:"table:encounter"`

	ID         uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID       `bun:"campaign_id" json:"campaign_id"`
	UserID     uuid.UUID       `bun:"user_id" json:"owner_id"`
	Title      string          `bun:"title" json:"title"`
	Combatants json.RawMessage `bun:"combatants,type:jsonb" json:"combatants"`
	Round      int             `bun:"round" json:"round"`
	Turn       int             `bun:"turn" json:"turn"`
	IsActive   bool            `bun:"is_active" json:"is_active"`
	Share
	OwnerID   uuid.UUID    `bun:"sa_owner_id" json:"-"`
	CreatedBy *uuid.UUID   `bun:"sa_created_by" json:"-"`
	CreatedAt time.Time    `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt time.Time    `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt bun.NullTime `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type ChatEntry struct {
	bun.BaseModel `bun:"table:chat_entry"`

	ID         uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID       `bun:"campaign_id" json:"campaign_id"`
	AuthorID   uuid.UUID       `bun:"author_id" json:"author_id"`
	AuthorName string          `bun:"author_name" json:"author_name"`
	Kind       string          `bun:"kind" json:"kind"`
	Body       string          `bun:"body" json:"body"`
	Query      string          `bun:"query" json:"query"`
	IsHidden   bool            `bun:"is_hidden" json:"is_hidden"`
	CardKind   string          `bun:"card_kind" json:"card_kind"`
	RollKind   string          `bun:"roll_kind" json:"roll_kind"`
	Formula    string          `bun:"formula" json:"formula"`
	Dice       json.RawMessage `bun:"dice,type:jsonb" json:"dice"`
	Roll       float64         `bun:"roll" json:"roll"`
	Total      float64         `bun:"total" json:"total"`
	OwnerID    uuid.UUID       `bun:"sa_owner_id" json:"-"`
	CreatedBy  *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt  time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt  time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt  bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Song struct {
	bun.BaseModel `bun:"table:song"`

	ID         uuid.UUID `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID `bun:"campaign_id" json:"campaign_id"`
	UserID     uuid.UUID `bun:"user_id" json:"owner_id"`
	Title      string    `bun:"title" json:"title"`
	Address    string    `bun:"address" json:"address"`
	Duration   float64   `bun:"duration" json:"duration"`
	Share
	OwnerID   uuid.UUID    `bun:"sa_owner_id" json:"-"`
	CreatedBy *uuid.UUID   `bun:"sa_created_by" json:"-"`
	CreatedAt time.Time    `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt time.Time    `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt bun.NullTime `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Character struct {
	bun.BaseModel `bun:"table:character"`

	ID           uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID       `bun:"user_id" json:"owner_id"`
	CampaignID   *uuid.UUID      `bun:"campaign_id" json:"campaign_id,omitempty"`
	Sheet        json.RawMessage `bun:"sheet,type:jsonb" json:"character"`
	Metadata     json.RawMessage `bun:"metadata,type:jsonb" json:"-"`
	Sources      json.RawMessage `bun:"sources,type:jsonb" json:"-"`
	IsPublic     bool            `bun:"is_public" json:"-"`
	LastPlayedAt *time.Time      `bun:"last_played_at" json:"-"`
	OwnerID      uuid.UUID       `bun:"sa_owner_id" json:"-"`
	CreatedBy    *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt    time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"-"`
	UpdatedAt    time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"-"`
	DeletedAt    bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Resource struct {
	bun.BaseModel `bun:"table:resource"`

	ID         uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	Kind       string          `bun:"kind" json:"kind"`
	UserID     uuid.UUID       `bun:"user_id" json:"owner_id"`
	CampaignID *uuid.UUID      `bun:"campaign_id" json:"campaign_id,omitempty"`
	Title      string          `bun:"title" json:"title"`
	Fields     json.RawMessage `bun:"fields,type:jsonb" json:"-"`
	Share
	OwnerID   uuid.UUID    `bun:"sa_owner_id" json:"-"`
	ParentID  uuid.UUID    `bun:"sa_parent_id" json:"-"`
	RootID    uuid.UUID    `bun:"sa_root_id" json:"-"`
	CreatedBy *uuid.UUID   `bun:"sa_created_by" json:"-"`
	CreatedAt time.Time    `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt time.Time    `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt bun.NullTime `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type ResourceUpdate struct {
	bun.BaseModel `bun:"table:resource_update"`

	ID         uuid.UUID `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	ResourceID uuid.UUID `bun:"resource_id" json:"resource_id"`
	AuthorID   uuid.UUID `bun:"author_id" json:"by"`
	Body       string    `bun:"body" json:"body"`
	CreatedAt  time.Time `bun:"created_at,nullzero,default:now()" json:"at"`
}

type File struct {
	bun.BaseModel `bun:"table:file"`

	ID         uuid.UUID    `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID    `bun:"user_id" json:"owner_id"`
	CampaignID *uuid.UUID   `bun:"campaign_id" json:"campaign_id,omitempty"`
	Path       string       `bun:"path" json:"path"`
	Name       string       `bun:"name" json:"name"`
	Type       string       `bun:"type" json:"type"`
	Size       int64        `bun:"size" json:"size"`
	Etag       string       `bun:"etag" json:"etag"`
	Count      int          `bun:"count" json:"count"`
	BlockSize  int          `bun:"block_size" json:"block_size"`
	Blocks     []string     `bun:"blocks,array" json:"blocks"`
	StorageKey string       `bun:"storage_key" json:"-"`
	OwnerID    uuid.UUID    `bun:"sa_owner_id" json:"-"`
	CreatedBy  *uuid.UUID   `bun:"sa_created_by" json:"-"`
	CreatedAt  time.Time    `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt  time.Time    `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt  bun.NullTime `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type FilePiece struct {
	bun.BaseModel `bun:"table:file_piece"`

	FileID uuid.UUID `bun:"file_id,pk" json:"-"`
	Index  int       `bun:"index,pk" json:"index"`
	Data   string    `bun:"data" json:"data"`
}

type CatalogEntry struct {
	bun.BaseModel `bun:"table:catalog_entry"`

	ID          uuid.UUID       `bun:"id,pk,default:gen_random_uuid()" json:"-"`
	Kind        string          `bun:"kind" json:"kind"`
	UserID      uuid.UUID       `bun:"user_id" json:"owner_id"`
	Slug        string          `bun:"slug" json:"id"`
	Name        string          `bun:"name" json:"name"`
	Description string          `bun:"description" json:"description"`
	Entry       json.RawMessage `bun:"entry,type:jsonb" json:"-"`
	Digest      string          `bun:"digest" json:"digest"`
	OwnerID     uuid.UUID       `bun:"sa_owner_id" json:"-"`
	CreatedBy   *uuid.UUID      `bun:"sa_created_by" json:"-"`
	CreatedAt   time.Time       `bun:"sa_created_at,nullzero,default:now()" json:"created_at"`
	UpdatedAt   time.Time       `bun:"sa_updated_at,nullzero,default:now()" json:"updated_at"`
	DeletedAt   bun.NullTime    `bun:"sa_deleted_at,soft_delete,nullzero" json:"-"`
}

type Peer struct {
	bun.BaseModel `bun:"table:peer"`

	ID         string    `bun:"id,pk" json:"id"`
	CampaignID uuid.UUID `bun:"campaign_id" json:"campaign_id"`
	UserID     uuid.UUID `bun:"user_id" json:"uid"`
	SeenAt     time.Time `bun:"seen_at,nullzero,default:now()" json:"seen_at"`
}

type Signal struct {
	bun.BaseModel `bun:"table:signal"`

	ID         uuid.UUID `bun:"id,pk,default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID `bun:"campaign_id" json:"campaign_id"`
	FromPeer   string    `bun:"from_peer" json:"from"`
	ToPeer     string    `bun:"to_peer" json:"to"`
	Kind       string    `bun:"kind" json:"kind"`
	Payload    string    `bun:"payload" json:"payload"`
	CreatedAt  time.Time `bun:"created_at,nullzero,default:now()" json:"created_at"`
}
