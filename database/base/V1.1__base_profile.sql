CREATE TABLE IF NOT EXISTS profile (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL UNIQUE,
    email          TEXT NOT NULL DEFAULT '',
    display_name   TEXT NOT NULL DEFAULT '',
    photo_url      TEXT NOT NULL DEFAULT '',
    preferences    JSONB NOT NULL DEFAULT '{}'::jsonb,
    friends        UUID[] NOT NULL DEFAULT '{}',
    key_claim_id   UUID,
    sa_owner_id    UUID NOT NULL,
    sa_created_by  UUID,
    sa_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sa_deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profile_email ON profile (lower(email));

COMMENT ON TABLE profile IS 'A player''s own dndcs settings beside the Samna Auth user: name shown at the table, portrait, preferences and friends';
COMMENT ON COLUMN profile.id IS 'The profile id';
COMMENT ON COLUMN profile.user_id IS 'The human the profile belongs to, samna_user.user_id';
COMMENT ON COLUMN profile.email IS 'The address the player signs in with, the one a dungeon master invites by';
COMMENT ON COLUMN profile.display_name IS 'The name shown at the table';
COMMENT ON COLUMN profile.photo_url IS 'The stored address of the portrait';
COMMENT ON COLUMN profile.preferences IS 'Theme, sound, animations, recent characters and shortcuts';
COMMENT ON COLUMN profile.friends IS 'The user ids the player has added as friends';
COMMENT ON COLUMN profile.key_claim_id IS 'The claim held by the player alone that their integration keys, stored as Samna Auth secrets, are bound to';
COMMENT ON COLUMN profile.sa_owner_id IS 'The owning organization';
COMMENT ON COLUMN profile.sa_created_by IS 'The user_claim of the creator';
COMMENT ON COLUMN profile.sa_created_at IS 'When the row was created';
COMMENT ON COLUMN profile.sa_updated_at IS 'When the row last changed';
COMMENT ON COLUMN profile.sa_deleted_at IS 'When the row was soft deleted';

SELECT claimius.upsert_table_info('public.profile');
