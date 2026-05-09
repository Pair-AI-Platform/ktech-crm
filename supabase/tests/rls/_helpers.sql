-- Shared helpers for RLS tests.
--
-- Each test file BEGINs a transaction, calls these helpers to seed two
-- agents + one admin + their leads, runs assertions while flipping the
-- JWT context, then ROLLBACKs so nothing persists.
--
-- Auth simulation: PostgREST/Supabase derives auth.uid() from the
-- request.jwt.claim.sub setting. We set that with set_config() and
-- assume the tested role is `authenticated` (RLS policies are written
-- against TO authenticated).

CREATE OR REPLACE FUNCTION public.test_set_authenticated_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.test_clear_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
END;
$$;

-- Assert helpers — fail the transaction with a clear message on mismatch.

CREATE OR REPLACE FUNCTION public.test_assert_eq(
  actual anyelement,
  expected anyelement,
  msg text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'ASSERT FAIL: % — expected %, got %', msg, expected, actual;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.test_assert_throws(
  sql_to_run text,
  msg text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE sql_to_run;
    RAISE EXCEPTION 'ASSERT FAIL: % — expected exception, got success', msg;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'OK (threw as expected): %', msg;
  END;
END;
$$;
