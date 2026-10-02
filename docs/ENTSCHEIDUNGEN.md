# Entscheidungen — delegiert beschlossen

> Enthält die Fragen, die der Nutzer am 2026-10-02 zur Entscheidung abgegeben hat.
> Jede Antwort trägt das Kennzeichen `[N-del]` und wird in `docs/CONCEPT_REVIEW.md` an der
> Stelle vermerkt, an der die Frage stand. Allgemeine Spielregeln besitzt ausschließlich
> `docs/CONCEPT_REVIEW.md`; diese Datei besitzt die Entscheidung und ihre Begründung.
> Diese Datei autorisiert keine Implementierung ohne die zugehörige Umsetzung.

## Was hier steht und was nicht

Der Nutzer hat die Entscheidung über alle zum Zeitpunkt offenen `[K]`- und `[O]`-Punkte
abgegeben und den Auftrag dazu erteilt. Damit ist eine Frage beantwortet und keine Zahl
freigegeben worden: Eine freigegebene Zahl muss am Messwächter stehen, sonst ist sie eine
Behauptung. Die Umsetzung folgt in den Blöcken V1 bis V7 der `docs/ROADMAP.md`.

**Messwächter für jede Zahl dieser Tabelle.** Der Referenzkampf aus `docs/CONCEPT_REVIEW.md`
Abschnitt 0b — drei Helden gegen Boss plus drei Platzmonster — bleibt im Band von 80 bis 95
Prozent. Eine Zahl, die das Band verlässt, ist falsch, nicht der Test.

## Die Entscheidungen

| # | Frage | Entscheidung | Fundstelle |
|---|---|---|---|
| D1 | Zählregel der Klassenfähigkeiten | Je Held **einmal pro Etage**. Die Stufe 1, 2 oder 3 bestimmt die Stärke, nicht die Anzahl. „Einmal pro Expedition" entfällt, weil eine Expedition sonst nach der ersten Etage leer liefe. | Abschnitt 0a, 0b |
| D2 | Zwei Rollenvokabulare `archetype` und `behavior` | **Zwei Begriffe bleiben.** Die Taktik liest `behavior` aus dem Genom, `archetype` bleibt Art-Eigenschaft für Anzeige und Messung. Der Namenskonflikt `tank` in beiden Listen löst sich im Taktik-Slice durch Umbenennung des Archetyps, nicht vorher. | Abschnitt 0b |
| D3 | Zuordnung Held zu Klasse | Aus `role`: Späherin `scout`, Brecher `breaker`, Heilerin `medic`, weitere Rollen nach gleichem Muster (`vanguard`, `controller`, `guardian`). Klassen ändern in v1 **keine Statzahl**, nur die Fähigkeit. | Abschnitt 0b |
| D4 | Fähigkeitsstärken | `mend` 20/40/60 Prozent der Gruppen-HP je Stufe, `shatter` 200 Prozent des Heldenangriffs einmalig, `reveal` setzt `revealed` ohne Kampfwert. Startwerte gemessen am Wächter. | Abschnitt 0a |
| D5 | Stärke-Schwellen | Abgenommen wie in `packages/sim-core/src/genome/strength.ts`: `12000, 14000, 15000, 16500, 18500`. Sie liegen in den Lücken der gemessenen Verteilung; kein Ändern ohne Neumessung. | Goldformel |
| D6 | Beute für die drei schwächsten Arten | **Nein, Stärke 0 ergibt 0 Gold.** Ihr Wert ist die Auflösung zu Material, nicht der Raid. Deckt sich mit dem Grenzfall der Goldformel. | Abschnitt 5 |
| D7 | Nach dem Etagen-Boss: Aussteigen oder weitergehen | Weitergehen ist **immer** erlaubt, kein Schwellen-Gate. Das Gate ist das Risiko, nicht eine Zahl. | Roadmap T2.3 |
| D8 | Escrow ungesicherter Beute | Nach Niederlage im Weitergehen verfallen **50 Prozent** der Escrow-Beute, 50 Prozent bleiben. Kein Full-Loot-Risiko. | Roadmap T2.3 |
| D9 | Drop-Pool und Gewichte | Fünf Seltenheitsstufen mit **60/25/10/4/1**. Pool v1: 15 Items, je 3 pro Stufe. Ein Bossdrop-Wurf pro Sieg, serverseitig geseedet. Duplikat: bis zu 3 Neuwürfe, dann vormerken. Unique-Aktionen bleiben inaktiv. | Abschnitt 0a |
| D10 | Contract-Sprünge | **Genau ein** Sprung auf v10 für Moral im Snapshot **und** Fähigkeits-Events. Keine Einzelsprünge pro Feature. | Roadmap T2.4 |
| D11 | Globaler Vier-Stunden-Shield | **Entfällt.** Es bleiben lokale Sperre je Angreifer-Verteidiger-Paar und der Moral-Schutz. | Abschnitt 2 |
| D12 | Match-Band, TTL, Slot | Übernommen: ±10 Prozent MMR, 2-Sekunden-Query, Ghost-Seed aus MMR plus UTC-Tag, 15-Minuten-TTL, ein offener Angriffs-Slot. | Abschnitt 2 |
| D13 | Stack | **Entschieden:** Cloudflare Worker, D1 und Queues, Firebase Auth. Die Aussage „Stack nicht entschieden" ist überholt. | Abschnitt 7 |
| D14 | Mutation, Dominanz, Zucht-XP zu Seelen | Der Ist-Stand in `packages/sim-core/src/genome/mutation.ts` ist **abgenommen**, Änderung nur durch Messung. Zerlegen gibt Seelen in der Generation des zerlegten Monsters; der Slot-Kauf läuft über `slotBase`. | Abschnitt 3 |
| D15 | Attraktivität und Worker-Kapazität | Bewusst **ohne Regelabnehmer** bis zum Multiplayer-Slice. Die Anzeige bleibt, ein Eingriff findet nicht statt. | Roadmap offene Punkte |
| D16 | Dependabot-Pins | `ignore` in `.github/dependabot.yml` wird festgeschrieben. Vitest und Biome bekommen keine eigenen Slices. | Roadmap offene Punkte |
| D17 | Hash-Semantik und Byte-Determinismus von `payloadJson` | Kein Redesign. Ein Test zur Schlüsselreihenfolge sowie zu `undefined`- und Zahlenformaten vor T3.2. | Befundreview |

## Warum getrennt von `[N]`

`docs/CONCEPT_REVIEW.md` Abschnitt 8 trennt Nutzeraussagen von Assistentenvorschlägen, weil ein
Vorschlag ohne Freigabe keine Regel ist. `[N-del]` ist freigegeben, aber nicht vom Nutzer formuliert.
Beide Kennzeichen stehen deshalb nebeneinander: `[N-del]` sagt **wer** entschieden hat, `[N]` sagt
**dass** entschieden wurde. Wer nur nach `[N]` sucht, findet die Nutzerfestlegungen; wer nach
offenen Punkten sucht, findet `[K]` und `[O]` — und diese Tabelle ist der Ort, an dem daraus `[N-del]` wurde.

## Umsetzungsreihenfolge

Die Blöcke V1 bis V7 stehen in `docs/ROADMAP.md`. Jeder Block ist ein eigener Auftrag nach dem
V1-Muster, ein Block zur Zeit. Was nur der Nutzer liefern kann, steht dort als eigene Zeile.