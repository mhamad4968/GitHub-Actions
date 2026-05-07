#!/usr/bin/env bash
# Echo the NVM `.../bin` directory for the Node version required by repo `.nvmrc`.
# Used by install-morning-cron.sh, morning-prep-ensure (PATH), and daily-morning-prep RAG npx.
# Supports .nvmrc = major only (e.g. 22) or full semver (e.g. 22.22.2).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RAW="$(tr -d '\r\n ' < "${REPO_ROOT}/.nvmrc" || true)"
if [ -z "${RAW}" ]; then
  echo "ERROR: empty .nvmrc at ${REPO_ROOT}/.nvmrc" >&2
  exit 1
fi
NVM_BASE="${HOME}/.nvm/versions/node"
if [ ! -d "${NVM_BASE}" ]; then
  echo "ERROR: NVM node dir missing: ${NVM_BASE}" >&2
  exit 1
fi
if [ -d "${NVM_BASE}/v${RAW}" ] && [ -x "${NVM_BASE}/v${RAW}/bin/node" ]; then
  echo "${NVM_BASE}/v${RAW}/bin"
  exit 0
fi
LAST="$(ls -d "${NVM_BASE}/v${RAW}"* 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "${LAST}" ] && [ -x "${LAST}/bin/node" ]; then
  echo "${LAST}/bin"
  exit 0
fi
echo "ERROR: no NVM node for .nvmrc '${RAW}' under ${NVM_BASE}" >&2
echo "  → nvm install ${RAW}" >&2
exit 1
