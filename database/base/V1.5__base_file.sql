CREATE TABLE IF NOT EXISTS file (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    campaign_id    UUID REFERENCES campaign(id),
    path           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL DEFAULT '',
    type           TEXT NOT NULL DEFAULT '',
    size           BIGINT NOT NULL DEFAULT 0,
    etag           TEXT NOT NULL DEFAULT '',
    count          INTEGER NOT NULL DEFAULT 0,
    block_size     INTEGER NOT NULL DEFAULT 65536,
    blocks         TEXT[] NOT NULL DEFAULT '{}',
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
COMMENT ON COLUMN file.size IS 'The size of the original in bytes';
COMMENT ON COLUMN file.etag IS 'The entity tag of the original';
COMMENT ON COLUMN file.count IS 'How many pieces the shown copy is cut into, none for audio and video';
COMMENT ON COLUMN file.block_size IS 'The size of each hashed block of the original';
COMMENT ON COLUMN file.blocks IS 'The SHA-256 of each block of the original, base64';
COMMENT ON COLUMN file.storage_key IS 'Where the original sits in blob storage';
COMMENT ON COLUMN file.sa_owner_id IS 'The owning organization';
COMMENT ON COLUMN file.sa_created_by IS 'The user_claim of the uploader';
COMMENT ON COLUMN file.sa_created_at IS 'When the row was created';
COMMENT ON COLUMN file.sa_updated_at IS 'When the row last changed';
COMMENT ON COLUMN file.sa_deleted_at IS 'When the row was soft deleted';

CREATE TABLE IF NOT EXISTS file_piece (
    file_id  UUID NOT NULL REFERENCES file(id),
    index    INTEGER NOT NULL,
    data     TEXT NOT NULL,
    PRIMARY KEY (file_id, index)
);

COMMENT ON TABLE file_piece IS 'A piece of the downscaled copy of a picture, read through the file''s access';
COMMENT ON COLUMN file_piece.file_id IS 'The file the piece belongs to';
COMMENT ON COLUMN file_piece.index IS 'Where the piece sits in the copy';
COMMENT ON COLUMN file_piece.data IS 'The bytes of the piece, base64';

SELECT claimius.upsert_table_info('public.file');
