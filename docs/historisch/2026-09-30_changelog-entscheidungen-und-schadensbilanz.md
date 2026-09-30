# docs/CHANGELOG.md — Global

## 2026-09-30 — Vier Unsicherheiten sind entschieden, und die Schadensbilanz ist gebaut

**Scope:** geändert `docs/PLAN_T2_3.md` (Abschnitt 4 komplett neu), neu `packages/sim-core/src/combat/summary-damage.test.ts`, geändert `packages/sim-core/src/combat/summary.ts`, `packages/contracts/src/combat-summary.ts` und zwei Test-Fixtures. Ein Contract-Sprung steht **aus** — die Felder sind neu, aber kein Leser Existierte.

**Vier Entscheidungen, gegen den Code geprüft.** Der eine Statuspunkt ist **dauerhaft und sitzt am Wesen**, nicht am Helden: `activeTeam` trägt nur `heroId` und zwei temporäre Zahlen, es gibt keinen Heldenbestand, der einen Punkt über den Lauf hinaus halten könnte. „Gelevelt" heißt **`level ≥ 2`, nicht `generation ≥ 2`** — und hier hat die Prüfung den ersten Vorschlag gekippt: `CONCEPT_REVIEW.md:132` sagt als `[N]`, ein Gezüchteter starte auf Level 1, das opferbarste Wesen wäre damit ausgerechnet das frisch gezüchtete. Das Extraktionsmaterial ist eine **dritte Ressource** im Escrow, nicht im Materialfeld — sonst zöge es eine zweite Quelle in die `[N]`-Festlegung, Material komme aus Werkstätten. Und der Boss ist ein **einzigartiges Wesen, das an der Etage gefunden wird**: so halten „er entsteht gar nicht" und „individuelle Bosse" gleichzeitig stand.

**Zwei weitere Widersprüche sind aufgetaucht und offen.** `CONCEPT_REVIEW.md:131` sagt als `[N]`, das Level-Cap skaliere mit der Generation — die Festlegung vom 30.09. sagt kein Cap. Das ist ein Widerspruch zwischen zwei `[N]`, und keiner ist der spätere. Und Moral (`CONCEPT_REVIEW.md:127`, ebenfalls `[N]`) ist im Code **nicht gebaut**; die EP-Regel für die Toten ist damit heute vollständig, die Wiederbelebung nicht.

**Die Schadensbilanz ist der erste Slice und der billigste.** `damage` wurde global summiert; wer den Schaden verursacht hat, ging verloren. Für die Erfahrung zählt genau das, und der Verursacher stand die ganze Zeit im Log. Die Änderung liest den Log, sie schreibt ihn nicht — der Golden Pin ist unangetastet (`261cd39a`, `ee21afc5`).

**Beleg:** 540 Tests in 81 Dateien (+6), typecheck 0, Lint 0, LOC-Caps ok, Hygiene ok, Shinon PASS.
