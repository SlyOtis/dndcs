DO $$ BEGIN
    CREATE TYPE resource_kind AS ENUM ('entries', 'npcs', 'heroes', 'items', 'weapons', 'armor', 'locations', 'maps', 'sessions', 'quests');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE resource_kind IS 'The ten kinds of lore a player or a campaign keeps';

CREATE TABLE IF NOT EXISTS resource (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind           resource_kind NOT NULL,
    campaign_id    UUID REFERENCES campaign(id),
    title          TEXT NOT NULL DEFAULT '',
    name           TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    tags           TEXT[] NOT NULL DEFAULT '{}',
    facts          JSONB NOT NULL DEFAULT '[]'::jsonb,
    images         JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url      TEXT NOT NULL DEFAULT '',
    frame          JSONB NOT NULL DEFAULT '{}'::jsonb,
    body           JSONB NOT NULL DEFAULT '{}'::jsonb,
    group_name     TEXT NOT NULL DEFAULT '',
    group_id       TEXT NOT NULL DEFAULT '',
    fields         JSONB NOT NULL DEFAULT '{}'::jsonb,
    sa_owner_id    UUID NOT NULL,
    sa_parent_id   UUID NOT NULL,
    sa_root_id     UUID NOT NULL,
    sa_created_by  UUID,
    sa_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resource_campaign_kind ON resource (campaign_id, kind);
CREATE INDEX IF NOT EXISTS idx_resource_root ON resource (sa_root_id);

COMMENT ON TABLE resource IS 'A piece of lore kept by a player or a campaign, of one of the ten kinds, with its block document and pictures, nested under a parent resource';
COMMENT ON COLUMN resource.id IS 'The resource id';
COMMENT ON COLUMN resource.kind IS 'Which of the ten kinds the resource is';
COMMENT ON COLUMN resource.campaign_id IS 'The campaign that keeps the resource, empty for a player''s own';
COMMENT ON COLUMN resource.title IS 'The title shown at the head';
COMMENT ON COLUMN resource.name IS 'The name of the thing described';
COMMENT ON COLUMN resource.description IS 'The lede under the title';
COMMENT ON COLUMN resource.tags IS 'The tags that link resources together';
COMMENT ON COLUMN resource.facts IS 'The label and value pairs of the head';
COMMENT ON COLUMN resource.images IS 'The stored addresses of the gallery pictures';
COMMENT ON COLUMN resource.image_url IS 'The stored address of the main picture';
COMMENT ON COLUMN resource.frame IS 'The traced frame drawn around the main picture';
COMMENT ON COLUMN resource.body IS 'The block document of the page';
COMMENT ON COLUMN resource.group_name IS 'The group the resource is listed under';
COMMENT ON COLUMN resource.group_id IS 'The id of the group the resource is listed under';
COMMENT ON COLUMN resource.fields IS 'The fields of the resource''s own kind, such as rarity, disposition or quest state';
COMMENT ON COLUMN resource.sa_owner_id IS 'The owning organization';
COMMENT ON COLUMN resource.sa_parent_id IS 'The resource this one is a sub page of, itself for a top resource';
COMMENT ON COLUMN resource.sa_root_id IS 'The top resource of the tree';
COMMENT ON COLUMN resource.sa_created_by IS 'The user_claim of the creator';
COMMENT ON COLUMN resource.sa_created_at IS 'When the row was created';
COMMENT ON COLUMN resource.sa_updated_at IS 'When the row last changed';
COMMENT ON COLUMN resource.sa_deleted_at IS 'When the row was soft deleted';

CREATE TABLE IF NOT EXISTS resource_update (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id  UUID NOT NULL REFERENCES resource(id),
    author_id    UUID NOT NULL,
    body         BYTEA NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_update_resource ON resource_update (resource_id, created_at);

COMMENT ON TABLE resource_update IS 'A merged Yjs update of a resource being edited live, read by everyone who reads the resource and folded into one past forty';
COMMENT ON COLUMN resource_update.id IS 'The update id';
COMMENT ON COLUMN resource_update.resource_id IS 'The resource the update edits';
COMMENT ON COLUMN resource_update.author_id IS 'The user id of the editor';
COMMENT ON COLUMN resource_update.body IS 'The encoded Yjs update';
COMMENT ON COLUMN resource_update.created_at IS 'When the update was written';

SELECT claimius.upsert_table_info('public.resource');
