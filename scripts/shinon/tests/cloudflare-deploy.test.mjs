import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Der Deploy von `feed-the-floor-bleed.vannon-fs.workers.dev`.
 *
 * Vorher stand `Workers Builds: feed-the-floor-bleed` bei jedem Push rot,
 * weil das Repository keine Worker-Konfiguration hatte: kein `wrangler.jsonc`
 * und `packages/server` war eine Bibliothek ohne HTTP-Rand. Der Fehler war
 * unsichtbar, weil der Check nicht `required` ist und nichts blockiert —
 * dieselbe Klasse wie der tote `push`-Trigger.
 *
 * Der Deploy selbst liegt nicht in diesem Repository: Die installierte App
 * `cloudflare-workers-and-pages` baut den Worker bei jedem Push auf `main` aus
 * `wrangler.jsonc` und legt den Check selbst an. Deshalb prüft dieser Test
 * ausdrücklich auch das Fehlen eines eigenen Deploy-Schritts. Die kostenfreien
 * Runner prüft `gate-parity.test.mjs` für dieselbe Datei bereits, das wird hier
 * nicht wiederholt.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const WORKFLOW = path.join(ROOT, '.github/workflows/shinon.yml')
const ENTRY = './packages/server/src/worker.ts'

/** `wrangler.jsonc` ist JSONC: die auskommentierte D1-Bindung fällt weg. */
function config() {
  const raw = fs
    .readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  return JSON.parse(raw)
}

function workflow() {
  return fs.readFileSync(WORKFLOW, 'utf8')
}

describe('Der Cloudflare-Deploy liefert das ganze Spiel aus', () => {
  it('nennt einen Worker-Einstieg, der auch wirklich existiert', () => {
    // Ein reiner Asset-Worker wäre die halbe Wahrheit: Die Dateien kämen
    // ausgeliefert, aber es gäbe keinen Ort für Sync-Checkpoints.
    expect(config().main).toBe(ENTRY)
    expect(fs.existsSync(path.join(ROOT, ENTRY))).toBe(true)
  })

  it('zeigt die Assets auf das Verzeichnis, das der gate-Job gebaut hat', () => {
    const { assets } = config()
    expect(assets.directory).toBe('./packages/client/dist')
    // Das Verzeichnis muss wirklich das sein, was vite schreibt — sonst
    // deployt der Worker einen Ordner, den es nicht gibt.
    expect(fs.existsSync(path.join(ROOT, 'packages/client/index.html'))).toBe(
      true,
    )
  })

  it('behaelt den Namen, an dem die installierte Cloudflare-App haengt', () => {
    // Ein anderer Name erzeugt einen zweiten Worker; der bestehende Check
    // bliebe rot und niemand wuesste warum.
    expect(config().name).toBe('feed-the-floor-bleed')
  })

  it('liefert die Wildcard aus, damit ein Link ohne 404 funktioniert', () => {
    expect(config().assets.not_found_handling).toBe('single-page-application')
  })

  it('holt den Worker nur fuer /api/* vor die Assets', () => {
    // Ohne diesen Eintrag laeuft der Worker bei jedem einzelnen Asset-Request
    // mit. Nur so bleibt er wirklich auf Aufruf und Sync-Checkpoints.
    expect(config().assets.run_worker_first).toEqual(['/api/*'])
  })

  it('haelt den Deploy frei von einer Datenbank, die es noch nicht gibt', () => {
    // Eine aktive, aber ungueltige `database_id` laesst `wrangler deploy`
    // scheitern. Dann waere das Spiel gar nicht erst erreichbar, nur weil der
    // Sync noch nicht steht. Bewusst als Kommentar im Config.
    expect(config().d1_databases).toBeUndefined()
  })

  it('buendelt den Worker bei jedem Lauf, nicht erst beim Build', () => {
    // Ohne diese Probe faellt ein kaputter Import erst auf main auf, wenn der
    // Cloudflare-Build scheitert. Als Pull Request sieht man ihn vorher.
    const wf = workflow()
    const start = wf.search(/- name: Worker-Bundle prüfen/)
    expect(
      start,
      'Schritt "Worker-Bundle prüfen" fehlt im Workflow',
    ).toBeGreaterThan(-1)
    const schritt = wf.slice(start, wf.indexOf('\n      - name:', start))
    expect(schritt).toContain('wrangler@4 deploy --dry-run')
    expect(schritt).not.toContain('if:')
  })

  it('überlässt den Deploy der Cloudflare-App statt einem eigenen Schritt', () => {
    // Belegt am Repo, nicht behauptet: `Workers Builds: feed-the-floor-bleed`
    // wird von der App `cloudflare-workers-and-pages` erzeugt, die das
    // Repository selbst baut. Ein eigener Deploy-Schritt wäre eine zweite
    // Wirkung nach aussen und würde zwei Secrets brauchen, die es nicht gibt.
    // Kommentare sind kein Schritt: sie dürfen das Verbot benennen, ohne es zu
    // brechen, deshalb wird der Rohtext ohne `#`-Zeilen geprüft.
    const code = workflow()
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n')
    expect(code).not.toContain('wrangler-action')
    expect(code).not.toMatch(/secrets\.CLOUDFLARE/)
    // Und die einzige `wrangler deploy`-Zeile darf kein Upload sein.
    const uploads = code
      .split('\n')
      .filter((line) => /wrangler@?\S*\s+deploy/.test(line))
    expect(uploads.length).toBeGreaterThan(0)
    for (const line of uploads) expect(line).toContain('--dry-run')
  })
})
