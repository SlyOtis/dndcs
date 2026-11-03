DO $$ BEGIN
    CREATE TYPE catalog_kind AS ENUM ('classes', 'races');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE catalog_kind IS 'The kinds of shared catalog entries';

CREATE TABLE IF NOT EXISTS catalog_entry (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind           catalog_kind NOT NULL,
    slug           TEXT NOT NULL,
    name           TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    entry          JSONB NOT NULL DEFAULT '{}'::jsonb,
    digest         TEXT NOT NULL DEFAULT '',
    sa_owner_id    UUID NOT NULL,
    sa_created_by  UUID,
    sa_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_entry_kind_slug ON catalog_entry (kind, slug) WHERE sa_deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_entry_digest ON catalog_entry (digest);

COMMENT ON TABLE catalog_entry IS 'A class or race read from an uploaded source and shared with every signed in player beside the bundled catalog';
COMMENT ON COLUMN catalog_entry.id IS 'The entry id';
COMMENT ON COLUMN catalog_entry.kind IS 'classes or races';
COMMENT ON COLUMN catalog_entry.slug IS 'The address name of the entry';
COMMENT ON COLUMN catalog_entry.name IS 'The display name';
COMMENT ON COLUMN catalog_entry.description IS 'What the entry is';
COMMENT ON COLUMN catalog_entry.entry IS 'The entry as the rules engine reads it';
COMMENT ON COLUMN catalog_entry.digest IS 'The digest of the source the entry was read from, so one source is read once';
COMMENT ON COLUMN catalog_entry.sa_owner_id IS 'The owning organization';
COMMENT ON COLUMN catalog_entry.sa_created_by IS 'The user_claim of the player who read it';
COMMENT ON COLUMN catalog_entry.sa_created_at IS 'When the row was created';
COMMENT ON COLUMN catalog_entry.sa_updated_at IS 'When the row last changed';
COMMENT ON COLUMN catalog_entry.sa_deleted_at IS 'When the row was soft deleted';

SELECT claimius.upsert_table_info('public.catalog_entry');
