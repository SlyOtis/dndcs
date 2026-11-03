CREATE OR REPLACE FUNCTION public.prune(p_settings JSONB)
    RETURNS BIGINT AS $$
DECLARE
    v_rule    JSONB;
    v_days    INTEGER;
    v_limit   BIGINT;
    v_n       BIGINT;
    v_deleted BIGINT := 0;
BEGIN
    FOR v_rule IN
        SELECT jsonb_array_elements('[
            {"table": "peer",   "column": "seen_at",    "kind": "log", "days": 1},
            {"table": "signal", "column": "created_at", "kind": "log", "days": 1}
        ]'::jsonb)
    LOOP
        v_days := coalesce((p_settings ->> ((v_rule ->> 'table') || '_days'))::INTEGER,
                           (p_settings ->> ((v_rule ->> 'kind') || '_days'))::INTEGER,
                           (v_rule ->> 'days')::INTEGER);
        v_limit := coalesce((p_settings ->> ((v_rule ->> 'kind') || '_size_mb'))::BIGINT,
                            (p_settings ->> 'size_mb')::BIGINT, 4096) * 1024 * 1024;
        CONTINUE WHEN v_days <= 0 OR pg_total_relation_size(('public.' || (v_rule ->> 'table'))::REGCLASS) < v_limit;
        EXECUTE format('DELETE FROM public.%I WHERE %I < now() - make_interval(days => $1)',
                       v_rule ->> 'table', v_rule ->> 'column')
            USING v_days;
        GET DIAGNOSTICS v_n = ROW_COUNT;
        v_deleted := v_deleted + v_n;
    END LOOP;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.prune(JSONB) IS 'Retention of this service''s runtime rows, run by claimius.prune after its own tables with the same settings: the seats players hold at a campaign and the signals between them, as kind log. Days per table (<table>_days) or per kind (<kind>_days), a size per kind (<kind>_size_mb) or for all (size_mb). A table under its size is left alone; over it, every row whose time column is older than its days is deleted. Characters, campaigns, resources, files and every other application table are never aged.';
