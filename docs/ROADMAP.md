# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden. Die vollständige Fassung bis zum 2026-09-28 liegt wortgleich in `docs/historisch/2026-09-29_roadmap-altfassung.md`; dieses Fenster führt den laufenden Stand, die offenen Blöcke und die offenen Prüfpunkte.

## Neunummerierung — 2026-09-29: T1 ist der aktive Track

T1 (Spielbarer Kern und reproduzierbarer Raid-Loop) ist abgeschlossen. Die Prioritätsregel weiter unten verlangt für genau diesen Moment die Neupriorisierung: **Das bisherige T2 (Alltagstiefe und Visual-Epic) ist jetzt T1, das bisherige T3 (Autorität und asynchroner Multiplayer) ist jetzt T2.** Die Block-IDs bleiben bei ihren historischen Nummern (`T2.2` bis `T2.6`, `T3.1` bis `T3.4`), weil die Changelogs und die archivierten Statusupdates unter genau diesen Nummern zitieren; die Abschnittsüberschriften tragen den neuen Rang und nennen die alte Bezeichnung.

**Der direkte Followup ist T1 mit dem Block T2.2.** Dort sind zwei Punkte offen und keiner davon ist eine Zahl: die Verdrahtung der Platzierungsgeometrie an die Dorfszene und der Rückkehr-Toast über `daySettlement`.

**Das Begegnungsmodell ist die eigentliche Design-Bremse.** Zonen, Gruppen, sequenzielle Begegnungen und dynamische Patrouillen sind entschieden und in `docs/CONCEPT_REVIEW.md` Abschnitt 0b festgehalten, aber noch nicht gebaut; sie ändern, was ein Raid ist — und damit auch, wie viele Verteidiger überhaupt gleichzeitig kämpfen. Das Zielband der Kampfbalance hängt daran und wird deshalb erst danach verhandelt.

## Statusupdate — 2026-09-29 (Die Dorfszene liest den Dorfbestand)

**Der dritte Punkt des Dreiteilers ist gebaut, und die Kette endet jetzt am Bildschirm.** `render/village-layout.ts` führt keine Ortsliste mehr; `VILLAGE_BUILDINGS` und `VillageBuilding` sind entfallen. Die Szene liest den Bestand als Funktion, und die Ableitung steht als `villagePlots()` in `ui/scene-switch.ts` (Spalten aus dem Bestand, Zeilen aus der Config, Gebäude direkt aus dem Store). Die Projektion liegt in `render/village-layout.ts`: Plotseite gleich Welthöhe durch Zeilenzahl — 64 Pixel bei zehn Zeilen —, Feld waagerecht mittig, und damit fällt der Weg des Untergrunds genau in die freie Zeile 5 zwischen Rathaus (3,1) und Gilde (3,6). Der Klick meldet den Listenplatz, dieselbe Kennung wie `upgradeBuilding(index)`. Ein über `buildBuilding` gebautes Haus steht nach einem Takt an seiner Plot-Zelle; die drei festen Präsentationsorte sind ohne Ersatzdarstellung verschwunden.

**Beleg.** `test/world-presentation.test.ts` prüft die Naht der App statt einer statischen Liste, `test/window-routing.test.ts` liest das Werkstattfenster unter `building:2`. **Gates:** typecheck 0, 365 Tests in 54 Dateien, Lint 0, LOC-Caps ok (247 Quellen), Hygiene ok, Shinon PASS, Client-Build und Worker-Dry-Run ok.

**Offen bleibt aus T2.2 nur noch der Rückkehr-Toast über `daySettlement`.**

## Statusupdate — 2026-09-29 (Die Dorfszene ist geteilt, die beiden Startorte stehen fest)

**Zwei Vorarbeiten für die Verdrahtung sind durch, und beide sind Client-Arbeit ohne Contract-Bezug.** `render/village-scene.ts` stand bei 149 von 150 erlaubten Codelinien; der unbewegliche Untergrund liegt jetzt in `render/village-ground.ts`, die Szene steht bei 75 Codelinien und hat damit den Platz, den der Store braucht. Und die beiden festen Startorte sind freigegeben: `BALANCE.start.fixedSites` führt Rathaus (3,1) und Gilde (3,6) mit je 3×3 Zellen, der Startbestand legt sie daraus an, und weil sie damit im selben Bestand liegen wie alles Gebaute, weist `buildBuilding` jede Baustelle auf ihnen als `overlaps` mit genanntem Grundriss ab; vorher prüfte das Kommando nur gegen das, was der Store selbst führte.

**Bewegt hat sich genau das und keine Regel darüber hinaus.** Die Saat ändert weder Arbeiterbasis noch Werkstattertrag, weil Rathaus und Gilde weder Wohnhaus noch Werkstatt sind, und ihr `maxLevel: 1` weist einen Ausbau mit `above-max-level` ab. Der Golden-Pin ist unverändert; neu freigegeben sind allein die beiden Zellen.

**Offen blieb der Rest von T2.2:** die Verdrahtung ist mit dem Statusupdate oben erledigt, der Rückkehr-Toast über `daySettlement` fehlt weiterhin.

## Statusupdate — 2026-09-29 (Placement Tile und die Angreifer-Fassade, Plan für das Begegnungsmodell)

**S5a und S5a2 sind gebaut.** Die Falle ist eine **Platzierungsmarkierung** geworden: Zellnummer 2 bleibt, aber sie macht keinen Schaden mehr und kostet keine Bewegungspunkte — damit ist ihr ganzes Kostenmodell entfallen (`path-search.ts`, `min-heap.ts`, das Umwegbudget und die drei `PathResult`-Modi). `grid/path.ts` fährt jetzt eine Breitensuche; der **Golden-Pin blieb wortgleich grün**, weil kein Fixture eine Platzierungszelle führt. Neu ist außerdem die Trennung von privatem Stand und **öffentlicher Angreifer-Sicht**: `RaidPublicViewSchema` mit `toPublicView` maskiert Platzierungszellen zu Boden, und `MatchResponse.snapshot` trägt diese Sicht statt des vollen Stands — eine Match-Antwort mit `monsterSlots` scheitert im Test. `CONTRACT_VERSION 4→5`, `sim_version 0.0.3→0.0.4`, Migration `003_contract_v5.sql`. Der direkte Followup bleibt **T2.2**; das Begegnungsmodell hängt an den zwei Vorbedingungen unten.

**Das Begegnungsmodell ist zerlegt und noch nicht gebaut.** Reihenfolge und Schnitte: K1 Contract v5-Zonen (Zonen, Gruppen und Patrouillen im privaten Stand, geordnete Begegnungskette im Ergebnis), K2 Core (Einheiten aus einer Zone statt aus Slot-Ratio, noch genau eine Begegnung), K3 Core (Sequenz mit persistentem Heldenzustand, Boss als letzte Begegnung, Ketten-Hash), K4 Core (dynamische Patrouille, Bewegung rekonstruierbar aus Patrouillenweg und Seed — ohne neuen Payload), K5 Client (Editor markiert Zonen und zieht den Weg, Pfeil zeigt die Richtung, Playback zeigt die Begegnungen). **Vorbedingungen vor K1:** die Zonenform (gemalte Zellen oder nur der Patrouillenweg?) und die Engagement-Regel (wann trifft eine Gruppe?) — beide bestimmen den Payload und keine ist entschieden. Offen bleibt aus 0b außerdem die Zählung der Heilfähigkeit (`1/2/3 je Etage` gegen `einmal je Expedition`).

## Statusupdate — 2026-09-29 (Der Typecheck läuft einmal, die Roadmap übergibt)

Der Typecheck lief lokal viermal und im Remote-Gate-Job dreimal über dieselben 245 Quelldateien: als eigener Schritt von `pnpm run -s gate`, erneut in `check`, erneut im Plugin `dead-code-gate` und erneut im `pre-push`-Hook, der die Plugin-Suite fährt. `tsconfig.json` trägt `noUnusedLocals` und `noUnusedParameters` seither selbst — bis dahin standen sie nur auf der Kommandozeile des Plugins, weshalb `pnpm run -s typecheck` und die Engine zwei verschiedene Programme fuhren. `dead-code-gate` ist danach die einzige Stelle, die den Compiler startet, `check` und `gate` rufen ihn nicht mehr zusätzlich, und der `gate`-Job im Workflow hat keinen eigenen Typecheck-Schritt mehr; der Windows-Job behält seinen, weil er `check` nicht fährt. `scripts/shinon/tests/typecheck-owner.test.mjs` hält den Vertrag fest. Beleg: 353 Tests in 52 Dateien, Lint 0, Hygiene ok, Shinon PASS, Worker-Dry-Run 138,70 KiB.

Die Roadmap selbst ist übergeben: Die Altfassung mit den Statusupdates vom 2026-09-25 bis 2026-09-28 liegt wortgleich in `docs/historisch/2026-09-29_roadmap-altfassung.md`.

## Offene Punkte aus dem Ist-Stand, jeder mit Besitzer

- **Kampfbalance (`sim-core`).** Reproduziert am 2026-09-28 mit 500 Seeds je Belegung bei Teamgröße 3: 90 % / 65 % / 81 % Siegquote bei 0 / 1 / 2 belegten Plätzen und 0 % ab drei, ohne Zeitlimit. Werkzeug ist `sim-core/src/combat/balance-report.test.ts`, der Golden-Pin `combat-pin.test.ts`. **Das Zielband hat noch niemand genannt**; jede Anpassung verschiebt den Hash und gehört darum mit der Pin-Aktualisierung in denselben Slice.
- **Loot-Naht (`contracts` + `sim-core`).** Der Zahlengrundlage-Teil ist durch: `CONTRACT_VERSION 3→4`, `sim_version 0.0.2→0.0.3`, `CombatSummary.defendersTotal` und `packages/server/migrations/002_contract_v4.sql`. Offen sind die **freigegebene Goldformel** und, falls E1 sie verlangt, die **Stärke- und Generationsangabe je Gegner** — `monsterSlot` trägt nur `monsterId`.
- **Dorf (`client`).** Die Dorfszene liest seit dem 2026-09-29 den Store: `ui/scene-switch.ts` reicht ihn als `villagePlots()` durch, `render/village-layout.ts` projiziert die Zellen, und der Klick ist der Listenplatz. Offen ist nur der Rückkehr-Toast über `daySettlement`. Die Zellpositionen von Rathaus und Gilde (beide 3×3) sind freigegeben und liegen als `BALANCE.start.fixedSites` in der Config; das Baukommando prüft Überlappung seither auch gegen sie.
- **Attraktivität (`client`).** Steht als angezeigte Startbasis in `BALANCE.attraction.base`, hat einen Abnehmer in der Anzeige, aber keine Ableitung und keinen Regelabnehmer.
- **Worker-Kapazität (`client`).** Bindet nicht: Sieben Werkstätten kosten zusammen 560 Gold und 42 Material, und es gibt keine Beute, aus der das Gold käme.
- **Etagen und Plätze (`client`).** `floorBase` und `slotBase` sind freigegeben und geprüft, haben aber wie die übrigen Preisfunktionen erst mit T2.3 einen Aufrufer im Spiel.
- **Browser-Abnahme.** T2.6 steht aus; in der Arbeitsumgebung gibt es weiterhin weder Chrome noch ein DOM-Testsetup.
- **D1 (`server`).** Nicht provisioniert. `002_contract_v4.sql` beschreibt den Fall und ist nur gegen den In-Memory-SQLite geprüft; sie lief nie gegen eine echte Datenbank.
- **Toolchain-Pins (`shinon`).** Die vier geschlossenen Dependabot-PRs sind in `docs/DEV_REQUIREMENTS.md` Abschnitt 6 begründet. Offen ist die Entscheidung, ob die Grenzen als `ignore` in `.github/dependabot.yml` festgeschrieben werden und ob Vitest und Biome als eigene Slices nachgezogen werden.
- **Reviewer-Profil.** `Agents.md` und `docs/ARCHITEKTUR.md` beschreiben `.github/agents/critical-adversarial-reviewer.agent.md` weiterhin als schreibgeschützt, während die Werkzeugliste seit der freigegebenen Erweiterung `edit` enthält. Die Beschreibung ist bei der nächsten Konsistenzprüfung nachzuziehen.
- **Lücke im Gate-Bau.** Kein Gate prüft, ob ein `@floor/*`-Import in den Deklarationen des importierenden Pakets steht. Belegt ist der Fall: `packages/client` und `packages/sim-core` deklarieren ihre Workspace-Abhängigkeiten erst seit dem 2026-09-28, vorher löste nur `tsconfig` sie auf.

## Prioritätsregel

- **T1 ist exklusiv:** Während T1 läuft, wird kein T2- oder T3-Feature begonnen.
- **Nach T1:** T2 wird zu T1 und T3 wird zu T2. Die Roadmap wird unmittelbar nach dem Abschluss von T1 neu priorisiert — eingelöst am 2026-09-29, siehe Neunummerierung oben. Die Abschnittsüberschriften bezeichnen weiterhin den Inhalt, nicht die Zielnummer.
- Nach jedem Arbeitspaket werden Status, Evidenz, offene Punkte und Folgeschritte in dieser Datei aktualisiert.
- Ein Statuswechsel ist erst nach grünem `pnpm run -s typecheck`, `pnpm test -- --run`, `pnpm run -s lint` und `pnpm run -s check` zulässig.
- Neue Erkenntnisse werden nicht nur hier, sondern auch im betroffenen Domain-Changelog dokumentiert.

## T1 — Alltagstiefe und Visual-Epic (bis 2026-09-29 als T2 geführt)

**Ziel:** Das Dorf wird bewirtschaftet, die Expedition geht über mehrere Etagen, Heldenfähigkeiten sind Simulationsinputs, und Beute landet in einem Inventar. Verbindliche Regeln, `[K]`-Grenzen und Abhängigkeiten stehen in `docs/VISUAL_GRUNDSATZ.md`.

**T2.1 ist abgeschlossen** (Ressourcenicons, Asset-Loader mit Fallback, drei Render-Modi, Tastaturzugang); der Abnahme-Beleg liegt in `docs/historisch/2026-09-27_roadmap-t2-1.md`, die Freigabetabelle in `docs/VISUAL_GRUNDSATZ.md`.

| ID | Ergebnis | Abhängigkeit | LOC ca. | Fertig, wenn |
|----|----------|--------------|---------|---------------|
| T2.2 | 10×10-Dorf, Platzierung/Upgrade von Häusern und Werkstätten, horizontales Land, Rückkehrabrechnung/Toast | T2.1, ausdrückliche Balancefreigabe ✅, Zellpositionen Rathaus/Gilde ✅ | 320–500 | Einziger Dorf-Owner, keine Überlappung/Überziehung, Werkstattertrag und Tagesabrechnung deterministisch und höchstens einmal pro Expedition |
| T2.3 | Expedition über mehrere Etagen, Boss-Aussteigen/Weitergehen, Escrow für ungesicherte Beute | T2.2, Kostenfreigabe | 300–470 | Derselbe eingefrorene Verteidiger, Etagen separat geprüft; Etage 2+ null bis fünf gekaufte Slots; quadratische Kosten ohne künstliches Etagenlimit |
| T2.4 | Deterministische Klassenfähigkeiten als Simulationsinputs und Replay-Events | T2.3, Contract-/Hash-Entwurf | 440–680 | Heal/Buff/Direktschaden am nächsten ganzzahligen Tick, je Held einmal pro Expedition; gleicher Snapshot/Seed/Input ergibt identischen Hash; ein Contract-Sprung abgestimmt (v5, nicht v4) |
| T2.5 | 9 Inventarplätze, Unique-Slots, seeded Bossdrops, Duplikatschutz und vorgemerkter Drop | T2.4, Drop-Balancefreigabe | 230–390 | Drop kann nicht dupliziert oder durch volles Inventar verloren werden; Unique-Aktionen bleiben bis Folgefreigabe inaktiv |
| T2.6 | Browser- und Spielzug-Abnahme von T2.1–T2.5 | T2.1–T2.5 | 100–180 | Accessibility, Asset-Fallback, Stadtbau, Ausstieg/Niederlage und Einmalabrechnung im Browser geprüft; passende Gates grün |

**Gebaut und belegt in T2.2:** Dorf-Owner (`village/state.ts`), Zahlenquelle (`balance.ts`), reine Rechnung (`economy.ts`), Geometrie (`plot.ts`), Bau-/Ausbau-/Landkommandos (`village/commands.ts`), der Upload mit dem echten Dorfbestand und seit dem 2026-09-29 die beiden festen Startorte, die der Startbestand aus `BALANCE.start.fixedSites` anlegt.

## T2 — Autorität und asynchroner Multiplayer (bis 2026-09-29 als T3 geführt)

**Ziel:** Online-Autorität und persistierter Fortschritt. Startet erst, wenn der serielle T1-Track durch ist; Online-Belohnungen bleiben gesperrt, bis Authentifizierung und Replay-Prüfung vollständig durchgesetzt sind.

| ID | Ergebnis | Abhängigkeit | LOC ca. | Fertig, wenn |
|----|----------|--------------|---------|---------------|
| T3.1 | Firebase Google-/E-Mail-Auth und isolierte Dev-Umgebung samt Dev-Wipe-Sperre | T2.5, Firebase-Projektwerte durch Nutzer | 300–460 | Firebase-UID ist Identität; falsche Claims und clientgewählte UID werden verworfen; Wipe ausschließlich in isolierter Dev-Datenbank |
| T3.2 | Profil-/Stadt-/Run-Persistenz und serverseitiges Replay-/Belohnungs-Gate | T3.1, lokale D1-Migrationstests | 420–670 | Server replayt Freeze, Seed und Input vor jedem atomaren Reward-Commit; Retry ist idempotent; fremde Identität/Manipulation bringt keinen Fortschritt |
| T3.3 | Pool, fremde Zielauswahl, Self-Match-Sperre und deterministischer Ghost-Fallback | T3.2, Match-Balancefreigabe | 300–510 | Ziel bleibt während der Expedition unverändert; Selbstmatch unmöglich; leerer Pool ergibt reproduzierbaren Ghost; MMR-Band nicht erraten |
| T3.4 | Ende-zu-Ende-/Betriebsabnahme für Auth, Persistenz und Multiplayer | T3.1–T3.3 | 100–180 | Emulator-/Testdaten, Security-Fälle und vollständige Gates grün; echte Cloud-/D1-Provisionierung bleibt separat freigegeben |

## Nächster konkreter Schritt

T1 mit dem Block **T2.2**: die Platzierungsgeometrie wird an die Dorfszene verdrahtet und der Rückkehr-Toast an `daySettlement` gehängt. Beides ist Client-Arbeit ohne Contract-Bezug; die Szene ist dafür in `render/village-ground.ts` und `render/village-scene.ts` geteilt und hat den Cap jetzt deutlich unter sich, und die beiden festen Startorte stehen mit ihren freigegebenen Zellen in der Config. Danach folgen die Etagen (T2.3), die Fähigkeiten (T2.4, mit eigenem Contract-Sprung), das Inventar (T2.5, blockiert durch die Drop-Freigabe) und die Browser-Abnahme (T2.6). Vor dem Tuning der Kampfbalance muss das Zielband ausdrücklich genannt sein; der Golden-Pin wandert dabei mit. Jeder Slice wird einzeln geprüft, dokumentiert und gegatet; es gibt keine Parallelimplementierung.

## Offene Prüfpunkte aus dem Befund-Review vom 2026-09-26

Diese Punkte stammen aus einer reinen Lese- und Mess-Session. Sie sind **keine** Spielregelentscheidungen und gehören nicht automatisch zum nächsten Block; die Zuordnung ist beim Start des jeweiligen Blocks zu treffen.

- **Kandidat gegen T1-Exklusivität — geklärt am 2026-09-26, entschieden am 2026-09-28:** Beide damals strittigen Branches existieren nicht mehr; die Dorfwirtschaft liegt als nicht mergebarer Tag `t2-1-dorfwirtschaft` vor und ist auf `main` neu gebaut, `ui/sidebar.tsx` ist entfallen, und der Editor-Gate aus dem Panels-Branch ist mit `ui/window-launcher.tsx:53` bereits auf `main`. Belege in der Altfassung unter `docs/historisch/2026-09-29_roadmap-altfassung.md`.
- **Idempotenz-Testlücke:** Der Fall „abgeschlossener Job plus Wiederholung mit gleichem `idempotencyKey`\" ist in `raid-checkpoint.test.ts` ungedeckt. Gemessen wurde: Rückgabe mit identischem `result_json` und unveränderter Revision, `IDEMPOTENCY_CONFLICT` bei abweichendem Payload und bei fremdem Angreifer.
- **Sweep am Checkpoint-Pfad:** Der Expire-Sweep hängt an `checkpointRaid` statt an einem Cron. Ein Job, den niemand wiederholt, bleibt unbegrenzt `accepted`. Gehört zur Queue-Semantik in T2.
- **Hash-Semantik:** `CombatHashSchema` ist formstreng, aber bindet nicht, worüber der Hash gebildet wurde. Eine semantische Bindung wäre robuster als die heutige indirekte Trage durch `sim_version` und `CONTRACT_VERSION`. Relevant, sobald der Hash als Inhaltsadresse dienen soll; für die aktuelle Replay-Prüfung ist die Breite ausreichend.
- **Nicht beantwortet:** Die Byte-Determinismus-Annahme hinter dem `payloadJson`-Vergleich in `raid-checkpoint.ts` wurde nicht abschließend geprüft. Offen bleibt, ob Zod die Shape-Reihenfolge oder die Eingabereihenfolge der Keys im Ausgabeobjekt wahrt und wie `undefined` sowie Zahlformate dort wirken.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen Punkt eintragen, nicht stillschweigend verschieben. Wächst das Fenster über 200 Zeilen, wandert der älteste Statusblock wortgleich nach `docs/historisch/`.
