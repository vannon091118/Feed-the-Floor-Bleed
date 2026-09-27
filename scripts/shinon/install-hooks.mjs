#!/usr/bin/env node
import { execSync } from 'node:child_process'
/**
 * Installiert Husky + Shinon Hooks. Läuft via `pnpm prepare`.
 * Kette: pre-commit (slice) → prepare-commit-msg (Integration) → commit-msg (gate) →
 *        post-commit (bump+push) → pre-push (full)
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

/** @param {string} file */
function ensureExecutable(file) {
  try {
    fs.chmodSync(file, 0o755)
  } catch {}
}

/**
 * @param {string} name
 * @param {string} content
 */
function writeHook(name, content) {
  const dir = path.join(ROOT, '.husky')
  fs.mkdirSync(dir, { recursive: true })
  const fp = path.join(dir, name)
  fs.writeFileSync(fp, content, 'utf8')
  ensureExecutable(fp)
  console.log(`  ✓ Hook ${name}`)
}

try {
  execSync('npx husky init 2>&1 || true', { cwd: ROOT, stdio: 'pipe' })
} catch {}

writeHook(
  'pre-commit',
  `#!/usr/bin/env sh
# Shinon pre-commit — Slice Test-Suite (sicher + performant)
# Globale Base-Gates laufen IMMER: loc, global-loc, hygiene, version, commit, contracts, modularity, dead-code, redundancy
# Core-Tests laufen nur bei relevantem Slice: core-determinism, false-positive
# Full-Run ist NICHT der Standard — nur der Slicer entscheidet
set -e
echo "🦊 Shinon pre-commit — Slice Test-Suite läuft..."
node scripts/shinon/engine.mjs
`,
)

writeHook(
  'commit-msg',
  `#!/usr/bin/env sh
# Shinon commit-msg — Commit-Gate (Prosa + Footer + Bullet + Datei-Nennung)
set -e
node scripts/shinon/commit-msg.mjs "$1"
`,
)

writeHook(
  'prepare-commit-msg',
  `#!/usr/bin/env sh
# Shinon prepare-commit-msg — füllt Merge-/Squash-Bodies gate-konform auf
set -e
node scripts/shinon/prepare-commit-msg.mjs "$1" "$2"
`,
)

writeHook(
  'post-commit',
  `#!/usr/bin/env sh
# Shinon post-commit — Version bump (mechanisch) + Auto-Push auf den Feature-Branch
# Der Auto-Push schiebt niemals den Default-Branch. Der Weg nach main ist der
# Job promote nach einem grünen Gate; siehe docs/REGELWERK_GIT.md.
set -e
if [ "\${SHINON_SKIP_BUMP:-0}" = "1" ]; then
  echo "🦊 Shinon post-commit — Bump übersprungen (SHINON_SKIP_BUMP=1)"
elif [ "$(git rev-list --count HEAD 2>/dev/null || echo 0)" -le 1 ]; then
  echo "🦊 Shinon post-commit — Initial commit erkannt (Version bleibt 0.0.1)"
else
  echo "🦊 Shinon post-commit — Version bump..."
  if ! node scripts/bump-version.mjs; then
    echo "💥 Bump fehlgeschlagen — amend/push abgebrochen"
    exit 1
  fi
  NEW_VER=$(cat VERSION | tr -d ' \\n\\r')
  echo "🦊 Neue Version: $NEW_VER"
  if ! node scripts/shinon/plugins/version-gate.mjs; then
    echo "💥 Version-Gate nach Bump fehlgeschlagen — amend/push abgebrochen"
    exit 1
  fi
  if ! git add VERSION package.json packages/*/package.json; then
    echo "💥 Versionsdateien konnten nicht staged werden — amend/push abgebrochen"
    exit 1
  fi
  PREV_MSG=$(git log -1 --pretty=%B)
  AMEND_MSG="\${PREV_MSG}

Automatisch synchronisierte Versionsdateien: VERSION, package.json, packages/contracts/package.json, packages/sim-core/package.json, packages/client/package.json und packages/server/package.json."
  # Der Amend läuft mit aktiven Hooks; SHINON_SKIP_BUMP verhindert nur die Rekursion.
  if ! SHINON_SKIP_BUMP=1 git commit --amend -m "$AMEND_MSG" 2>&1; then
    echo "💥 Amend fehlgeschlagen — Auto-Push abgebrochen"
    exit 1
  fi
  if [ "\${SHINON_AUTO_PUSH:-1}" = "1" ]; then
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    main_branch="\${SHINON_MAIN_BRANCH:-$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||' || true)}"
    main_branch="\${main_branch:-main}"
    if [ "$branch" = "$main_branch" ]; then
      echo "🦊 Shinon post-commit — kein Auto-Push auf $branch. Der Job promote schiebt nach main, erst nach grünem Gate."
    elif [ -n "$branch" ] && [ "$branch" != "HEAD" ]; then
      echo "🦊 Shinon post-commit — Auto-Push $branch @ $NEW_VER..."
      if ! git push 2>&1; then
        echo "💥 Auto-Push fehlgeschlagen — Push muss manuell wiederholt werden"
        exit 1
      fi
    fi
  fi
fi
`,
)

writeHook(
  'pre-push',
  `#!/usr/bin/env sh
# Shinon pre-push — Full Test-Suite (alle Plugins, letzte Sicherung)
# Davor die Sperre auf den Default-Branch. Branch-Protection prüft einen
# Status-Check auf einem SHA, nicht den Weg dorthin, und strict wirkt nur auf
# Merges: Ein lokaler Push auf einen SHA, dessen Shinon Gate aus dem PR-Lauf
# schon grün ist, wird akzeptiert. Die Sperre sitzt deshalb hier.
set -e

main_branch="\${SHINON_MAIN_BRANCH:-$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||' || true)}"
main_branch="\${main_branch:-main}"
main_ref="refs/heads/$main_branch"

# git übergibt die Refspecs auf stdin: lokaler Ref, lokale SHA, entfernter Ref, entfernte SHA.
while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [ "$remote_ref" = "$main_ref" ]; then
    if [ "\${SHINON_ALLOW_MAIN_PUSH:-0}" = "1" ]; then
      echo "🦊 Shinon pre-push — Push auf $remote_ref freigegeben (SHINON_ALLOW_MAIN_PUSH=1, nur mit break-glass-Lock)."
    else
      echo "💥 Shinon pre-push — Push auf $remote_ref verweigert."
      echo "   Nach main schiebt nur der Job promote, und zwar nach grünem Gate."
      echo "   Notfallweg: node scripts/break-glass-main.mjs lock, dann SHINON_ALLOW_MAIN_PUSH=1 git push, dann restore."
      exit 1
    fi
  fi
done

echo "🦊 Shinon pre-push — Full Test-Suite..."
node scripts/shinon/engine.mjs --full
`,
)

console.log(
  '✅ Shinon Hooks installiert (.husky/pre-commit, prepare-commit-msg, commit-msg, post-commit, pre-push)',
)
console.log(
  '   Kette: pre-commit (slice) → prepare-commit-msg (Integration) → commit-msg (gate) → post-commit (bump+push) → pre-push (full)',
)
