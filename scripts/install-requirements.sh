#!/usr/bin/env bash
# Installiert und prüft die Toolchain-Voraussetzungen.
# Siehe docs/DEV_REQUIREMENTS.md §1. Erwartet Bash und Node bereits vorhanden.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NODE_MIN_MAJOR=22
PNPM_VERSION="$(node -p "require('./package.json').packageManager.split('@')[1]" 2>/dev/null || echo 9.12.3)"

fail=0

note() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32mok\033[0m    %s\n' "$1"; }
bad()  { printf '  \033[31mfehlt\033[0m %s\n' "$1"; fail=1; }

check_node() {
  note 'Node.js'
  if ! command -v node >/dev/null 2>&1; then
    bad "node fehlt — installiere Node >= ${NODE_MIN_MAJOR}, dann erneut starten"
    return
  fi
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt "$NODE_MIN_MAJOR" ]; then
    bad "node $(node -v) ist aelter als ${NODE_MIN_MAJOR}"
  else
    ok "node $(node -v)"
  fi
}

check_pnpm() {
  note 'pnpm'
  if ! command -v pnpm >/dev/null 2>&1; then
    bad "pnpm fehlt — aktiviere es mit: corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate"
    return
  fi
  local current
  current="$(pnpm --version)"
  if [ "$current" != "$PNPM_VERSION" ]; then
    printf '  \033[33mweicht\033[0m pnpm %s, packageManager verlangt %s\n' "$current" "$PNPM_VERSION"
  else
    ok "pnpm $current"
  fi
}

check_git() {
  note 'Git'
  if ! command -v git >/dev/null 2>&1; then
    bad 'git fehlt'
    return
  fi
  ok "git $(git --version | awk '{print $3}')"
}

check_python() {
  note 'Python (optional)'
  if command -v python3 >/dev/null 2>&1; then
    ok "python3 $(python3 --version | awk '{print $2}')"
  else
    printf '  \033[33mskip\033[0m python3 fehlt — nur Helfer-Skripte brauchen es, der Build nie\n'
  fi
}

install_deps() {
  note 'Workspace-Dependencies'
  pnpm install --frozen-lockfile
  ok 'pnpm install --frozen-lockfile durch'
}

final_gate() {
  note 'Gate'
  pnpm run check
}

check_node
check_pnpm
check_git
check_python

if [ "$fail" -ne 0 ]; then
  printf '\n\033[31mVoraussetzungen fehlen. Behebe die Punkte oben und starte erneut.\033[0m\n'
  exit 1
fi

install_deps
final_gate
printf '\n\033[32mToolchain komplett, alle Gates gruen.\033[0m\n'
