DO $$
DECLARE
    player_id uuid := '1d0c0000-0000-4000-8000-000000000002'::uuid;
    org_id uuid := 'aba6e96e-8ee9-4410-958b-60bcc235de5e'::uuid;
    member_claim_id uuid;
    player_grant_id uuid;
    profile_id uuid := '1d0c0000-0000-4000-8000-0000000000a2'::uuid;
BEGIN
    SELECT c.id INTO member_claim_id
      FROM claimius.claim c
     WHERE c.name = 'Member' AND c.sa_owner_id = org_id AND c.sa_deleted_at IS NULL
     LIMIT 1;

    SELECT uc.id INTO player_grant_id
      FROM claimius.user_claim uc
     WHERE uc.claim_id = member_claim_id AND uc.user_id = player_id AND uc.sa_deleted_at IS NULL
     LIMIT 1;

    INSERT INTO public.profile (id, user_id, email, display_name, sa_owner_id, sa_created_by)
    VALUES (profile_id, player_id, 'pip@dndcs.local', 'Pip', org_id, player_grant_id)
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name;

    IF NOT EXISTS (
        SELECT 1 FROM claimius.claim_object co
         WHERE co.claim_id = member_claim_id AND co.object_id = profile_id AND co.sa_deleted_at IS NULL
    ) THEN
        PERFORM claimius.insert_claim_object(
            p_claim_id      => member_claim_id,
            p_sa_owner_id   => org_id,
            p_sa_root_id    => org_id,
            p_sa_created_by => player_grant_id,
            p_object_id     => profile_id,
            p_object_type   => 'public.profile',
            p_sa_access     => 36,
            p_inherits      => TRUE,
            p_reason        => 'Debug player profile read by every member'
        );
    END IF;

    RAISE NOTICE 'Debug player profile seeded for %', player_id;
END $$;
