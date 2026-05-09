#!/usr/bin/env bash
#
# Runs the SQL-level RLS test suite against the database pointed to by
# $DATABASE_URL. Each test file BEGINs a transaction and ROLLBACKs at
# the end, so it's safe to run against staging — *do not* run against
# production unless you know what you're doing.
#
# Usage:
#   DATABASE_URL=postgres://... ./scripts/test-rls.sh
#   DATABASE_URL=postgres://... ./scripts/test-rls.sh 01_rls_lockdown
#
# Exit code is non-zero if any test file fails.
#
# Requires: psql in $PATH. Tested against PostgreSQL 15+ (Supabase).

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "       Pass a STAGING (not prod) database URL — tests do BEGIN/ROLLBACK"
  echo "       but mistakes happen. Use a throwaway database."
  exit 2
fi

# Refuse to run against URLs that look like production.
if [[ "${DATABASE_URL}" == *"prod"* || "${DATABASE_URL}" == *"production"* ]]; then
  echo "ERROR: DATABASE_URL appears to point at a production database."
  echo "       Refusing to run. Use a staging DATABASE_URL."
  exit 3
fi

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TESTS_DIR="${SCRIPT_DIR}/../supabase/tests/rls"

if [[ ! -d "${TESTS_DIR}" ]]; then
  echo "ERROR: tests dir not found at ${TESTS_DIR}"
  exit 2
fi

# Always load helpers first.
HELPERS="${TESTS_DIR}/_helpers.sql"

# Pick which tests to run.
if [[ $# -gt 0 ]]; then
  TEST_FILES=()
  for arg in "$@"; do
    f="${TESTS_DIR}/${arg}.sql"
    if [[ ! -f "${f}" ]]; then
      echo "ERROR: ${f} not found"
      exit 2
    fi
    TEST_FILES+=("${f}")
  done
else
  # Run every test file (alphabetical), excluding the helpers.
  mapfile -t TEST_FILES < <(find "${TESTS_DIR}" -maxdepth 1 -type f -name '[0-9]*.sql' | sort)
fi

echo ">>> Loading helpers: ${HELPERS}"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q -f "${HELPERS}"

failures=0
for test_file in "${TEST_FILES[@]}"; do
  name="$(basename "${test_file}")"
  echo
  echo ">>> Running ${name}"
  if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q -f "${test_file}"; then
    echo "    PASS: ${name}"
  else
    echo "    FAIL: ${name}"
    failures=$(( failures + 1 ))
  fi
done

echo
if [[ ${failures} -eq 0 ]]; then
  echo "All RLS tests passed."
  exit 0
else
  echo "${failures} RLS test file(s) failed."
  exit 1
fi
