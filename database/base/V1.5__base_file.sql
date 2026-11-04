CREATE TABLE IF NOT EXISTS file (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    campaign_id    UUID REFERENCES campaign(id),
    path           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL DEFAULT '',
    type           TEXT NOT NULL DEFAULT '',
    size           BIGINT NOT NULL DEFAULT 0,
    etag           TEXT NOT NULL DEFAULT '',
    storage_key    TEXT NOT NULL DEFAULT '',
    sa_owner_id    UUID NOT NULL,
    sa_created_by  UUID,
    sa_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_file_campaign ON file (campaign_id);

COMMENT ON TABLE file IS 'An uploaded picture, recording or document, the original kept in blob storage';
COMMENT ON COLUMN file.id IS 'The file id';
COMMENT ON COLUMN file.user_id IS 'The player who uploaded it';
COMMENT ON COLUMN file.campaign_id IS 'The campaign the file was uploaded to, empty for a player''s own';
COMMENT ON COLUMN file.path IS 'The stored address of the file, what a file: address names';
COMMENT ON COLUMN file.name IS 'The name the file was uploaded under';
COMMENT ON COLUMN file.type IS 'The media type';
COMMENT ON COLUMN file.size IS 'The byte length of the original, set when its bytes are stored';
COMMENT ON COLUMN file.etag IS 'The SHA-256 of the original, base64url, set when its bytes are stored';
COMMENT ON COLUMN file.storage_key IS 'Where the original sits in blob storage';
COMMENT ON COLUMN file.sa_owner_id IS 'The owning organization';
COMMENT ON COLUMN file.sa_created_by IS 'The user_claim of the uploader';
COMMENT ON COLUMN file.sa_created_at IS 'When the row was created';
COMMENT ON COLUMN file.sa_updated_at IS 'When the row last changed';
COMMENT ON COLUMN file.sa_deleted_at IS 'When the row was soft deleted';



SELECT claimius.upsert_table_info('public.file');
