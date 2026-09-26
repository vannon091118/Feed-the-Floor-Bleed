# docs/ARCHITEKTUR.md — Global

## Ziel

Deterministisches Async-Spiel mit geteiltem Core. Der Server nutzt `sim-core` (Fixed-Point, PRNG, Grid, Kampf, Zucht) für Berechnung und Validierung; der Client rendert und spielt serverseitig validierte Ergebnisse ab.

Die aktive Arbeitsreihenfolge besitzt ausschließlich `docs/ROADMAP.md`. T1 (Kern und reproduzierbarer Raid-Loop) ist mit T1.1 Raid-Playback und T1.2 Schleifenabnahme abgeschlossen; T2 ist damit der aktive Bereich, T3 folgt danach. Die Prioritätsregel „T1 ist exklusiv“ steht dort.

## Schichten

- `contracts` besitzt Zod-Schemas, Protokoll-Versionen (`sim_version`), Hash-Verträge, Ergebnislog und den Auftragsautomaten. Keine Logik.
- `sim-core` besitzt reine Funktionen ohne I/O/Zeit/Zufall von außen. PRNG via Seed, A* mit festem Tie-Break, Combat-Ticks, kanonischer Log-Hash, Replay und die lokale Fixture-Ausführung eines Auftrags.
- `client` besitzt UI (Preact/Signals) und die laufende Szene (PixiJS 8). Die visuelle Basis ist geschichtet: `world` definiert Tiles, Materialien und Deskriptoren, `visual` übersetzt Spielzustand in Präsentationsdeskriptoren, `render` besitzt die Pixi-Szene, `input` den Pointer-Pfad, `window` die Kontextfenster, `village` den Phase-Zustand der Tag/Nacht/Raid-Schleife und `ui` die Shell samt Phasen-Panels. PWA, Dexie und Net bleiben Zielmodule. Der Client entscheidet nichts selbst.
- `server` besitzt D1, Queues, Pool, Defender-State und Replay-Validierung; MMR-Matching und Ghost-Fallback sind geplante Zielmodule, aber keine bestätigten Spielregeln (siehe `docs/CONCEPT_REVIEW.md`).
- `scripts/shinon` besitzt Commit-Gate + Test-Suite, slice-basiert nach `git diff`. Full-Run nur in `pre-push`.
- `.github/agents/critical-adversarial-reviewer.agent.md` prüft angefragte Trees und Diffs schreibgeschützt gegen `Agents.md`, die dort verlinkten Regelwerke und betroffene Contracts, Domänendokus sowie Tests. Ohne engeren Scope gilt der gesamte Checkout. Governance-Grundsätze liegen in `Agents.md`, Detailregeln in den dort verlinkten Regelwerken; das Profil kopiert sie nicht.
- `.github/agents/berater.agent.md` liest denselben Stoff, gibt aber ein Urteil statt eines Befundkatalogs: höchstens drei Absätze aus Urteil, einem Beleg und dem Fix, Ton bewusst rau an der Arbeit statt an der Person. Ohne `edit`-Werkzeug; `execute` ist auf lesende Befehle und die Gate-Kommandos `pnpm run -s lint` und `pnpm test` beschränkt. Auch dieses Profil verweist auf `Agents.md`, statt Regeln zu duplizieren.

## Datenfluss Trail-Hash (belegter Ist-Stand)

Editor-Grid plus Fixture-Aufstellung → `buildFixtureUpload` erzeugt einen Contract-v3-Upload → `toDungeonGrid` übersetzt die 4096 Zellen in das Laufzeit-Grid → `runFixtureRaid` prüft Schema, Auftragsfrist und Route, rechnet den Kampf über `resolveCombat` mit Trail (`x/y/cell` je Schritt), hasht den vollständigen Trail in `fingerprintCombatLog`, replayt den geparsten Log inklusive Trail-Prüfung und gibt einen durch `RaidJobSchema` validierten Auftrag zurück → `RaidPanel` rendert Stufe, Hash und Kennzahlen. Kein Netz, keine Uhr, kein Serverentscheid.

Ergebnis und vollständiger Log sind zwei Payloads: `ResultPayloadSchema` trägt `token`, `floor`, `hash` und die typisierte Summary, `RaidLogPayloadSchema` zusätzlich den Log inklusive `trail`. Das hält die D1-Zeile klein und lässt den Log bei Bedarf nachladen.

## Datenfluss Visual Foundation (belegter Ist-Stand)

`dungeon-editor/state` hält `grid` und die daraus abgeleitete `route`. Der `visual/observer` liest beide und erzeugt Deskriptoren; er kopiert das Grid nicht, sondern meldet Terrain nur bei geänderter Grid-Referenz. `render` konsumiert die Deskriptoren als persistente Pixi-Views. `worldToScreen` und `screenToWorld` existieren genau einmal in `render/camera` und werden von Renderer, Hit-Test, Drag und Kamera gemeinsam genutzt. `showcase` baut die sichtbare Referenzszene aus `grid`, `route.value.path` und dem echten Core-Log aus `resolveSnapshotRaid`; die Combat-Positionen entstehen aus `routeIndex`/`fromIndex`/`toIndex` abgebildet auf die Route. `render/route` zeichnet depth-sortierte Marker aus derselben Route und markiert den aktiven Heldenindex, ohne eine zweite Positionsquelle einzuführen. `visual/route-index` teilt das boundsafe Route-Mapping für Actors und FX; `visual/variant` sorgt für gleiche ID-basierte Actor-Varianten in Leerlauf und Combat. Der Render-Atlas trennt Canvas-Helfer, Boden-/Wand-/Routentexturen sowie Actor-/Atmosphärentexturen. FX-Seeds werden pro Combat-Event stabil abgeleitet. Der Log trägt seit T1.1 einen Trail-Hash, deshalb steht die Timeline in T1.1 auf fertigem Grund.

## Datenfluss Etagen-Loop (geplanter Zielpfad, technisch)

Client `Upload(v2-Raid-Freeze + Taktiken)` → Server friert den vollständigen eigenen Snapshot in D1 ein → Server wählt MMR-Band-Ziel oder Ghost → Queue übergibt den Job → Headless-Worker berechnet den Kampf serverseitig → D1 speichert Ergebnis oder Timeout-Verlust → Client erhält Status/Playback. Kein Pre-Leak tieferer Etagen.

## Versionierung

`VERSION` im Root ist Single Source of Truth (`X.Y.Z`, PATCH 0..99 → MINOR 0..99 → MAJOR). `scripts/bump-version.mjs` bumped mechanisch nach jedem erfolgreichen Commit (amend mit aktiven Hooks, Loop-Schutz `SHINON_SKIP_BUMP=1`) und schreibt `VERSION` + alle `package.json` synchron. Der erste Root-Commit bleibt `0.0.1`; `version-gate` prüft Sync. GitHub Actions wiederholt den vollständigen Check `Shinon Gate` bei jedem Push auf `main` und bei jedem Pull Request; der lokale Pre-Push-Gate bleibt die erste Sperre. Ist der PR-Gate grün, schiebt der Job `promote` den geprüften Kopf per Fast-Forward nach `main`.

## Owner-Grenzen

Siehe `docs/REGELWERK_ARCHITEKTUR.md`. `village` ↔ `dungeon` isoliert, `raid-sim` kein I/O, `sync` keine Spielregeln. Der Auftragsstatus liegt seit T1.3 im Contract; Server und D1 dürfen ihn nur durchsetzen, nicht neu erfinden.
