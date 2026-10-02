# Konzeptreview — ODT-Realignment (2026-09-25)

> Einzige kanonische Quelle für allgemeine Spiel-, Sync-, Snapshot-, Matching-, Beute- und Pathfinding-Regeln.
> Sicherheits-/Prüfmarkensemantik: `docs/CONCEPT_REVIEW_SECURITY.md`.
> Quellen: ODT `Unbenannt_2` (Gemini-Export plus eingeschobene Nutzerkorrekturen) und die drei Festlegungen der Session vom 2026-09-25.
> Status: `[N]` = Nutzerfestlegung (im ODT belegt oder in dieser Session bestätigt). `[N-del]` = delegiert entschieden; die Fragen und Antworten stehen in `docs/ENTSCHEIDUNGEN.md`. `[K]` = KI-/Assistentenvorschlag, nicht abgenickt. `[O]` = offen.
> Nur `[N]` ist fix. Technische Umsetzung, Stack und Detailzahlen sind niemals Spielregeln.

## 0. In dieser Session bestätigt

- Grid: 64×64 Logikzellen, sichtbar 16×16, also 4×4 Logikzellen pro sichtbarem Tile. Die ODT-Formulierung „4 Logiken pro sichtbarem Tile“ ist damit **SUPERSEDIERT**. `[N]`
- Beute: Phantom-Kopie; der Verteidiger verliert keine Live-Ressourcen. `[N]`
- Doku-Regel: KI-Vorschläge dürfen nicht mehr als bestätigte Regeln geführt werden. `[N]`

## 0a. Visual- und Expeditionsentscheidungen vom 2026-09-27

Die vollständige Detail- und Sprintquelle ist `docs/VISUAL_GRUNDSATZ.md`; die folgenden neueren Nutzerfestlegungen übersteuern widersprechende alte Notizen:

- Ressourcen im Epic sind nur Gold und Materialien. Gold stammt aus besiegten Gegnern, abhängig von Stärke/Generation; Material stammt aus ausgebauten Gebäuden/Werkstätten. Keine dynamischen Ressourcen-Plugins und keine zusätzliche Ressource. **Nachgezogen am 2026-09-29:** die Goldformel ist freigegeben (`docs/GOLDFORMEL.md`) und beide Größen sind definiert — die Stärke als Stufe 0 bis 5 aus dem gemessenen Elementbudget in `sim-core/src/genome/strength.ts`, die Generation als `Genome.generation`. **Auch der Rückweg ist seit dem 2026-09-29 geschlossen:** `packages/client/src/raid/loot-source.ts` leitet die gefallenen Verteidiger aus dem Log des Laufs ab, und `setPhase('tag', fallen)` bucht ihre Beute genau einmal je Rückkehr in den Dorfbestand — vorher hatte die Formel im Spielerpfad keinen Leser. `[N]`
- Eine Expedition ist ein Turn über beliebig viele Etagen desselben unveränderlichen Verteidigers. Nach jedem Boss ist Ausstieg (Run-Beute sichern) oder Weitergehen (ungesicherte Beute riskieren) möglich. Bei jeder Rückkehr, auch nach Niederlage, wird Dorfwirtschaft genau einmal abgerechnet. Niederlage kostet nur ungesicherte Run-Beute. HP, Buffs und verbrauchte Fähigkeiten bleiben über Etagen erhalten. `[N]`
- Etage 1 startet mit fünf Monsterplätzen; jede spätere Etage mit null und kann bis zu fünf Material-Slots freischalten. Etagen- und Slotkosten wachsen quadratisch; **nachgezogen am 2026-09-28:** die Basiswerte sind freigegeben — `floorBase` 250 Gold ab Etage 2, `slotBase` 40 Material, mit Grenzfällen in `docs/VISUAL_GRUNDSATZ.md`. `[N]`
- Aktive Heldenbewegung/-zielwahl bleibt automatisch. Jede Klasse hat eine feste Fähigkeit; Heal, Direktschaden und Team-Buff sind manuelle Eingaben am nächsten ganzzahligen Simulationstick und je Held einmal pro Expedition. Freigegebene Basiswirkungen: 25 % Max-HP Heilung, 25 % Max-HP Direktschaden, +20 % Angriff bis Rückkehr. Unique Items erhalten später einen getrennten Fähigkeitskatalog; sie aktivieren im ersten Epic keine Extraaktion. `[N]`
- Inventar: neun globale Plätze plus separater Unique-Slot je Held. Bossdrop wird deterministisch serverseitig gerollt, Duplikate werden vermieden; bei vollem Rucksack wird die Belohnung sicher vorgemerkt. Drop-Pool und Gewichte sind `[K]`. `[N/K]`
- Visual-Assets sind selbst erstellte Pixel-Art-Rastergrafik plus handgeschriebene SVG-Icons. Referenzbilder sind keine Assets. Eine Pixi-Runtime zeigt Dorf, flachen Editor und atmosphärischen Raid aus gemeinsamem World-/Grid-Owner; Tastaturzugang bleibt über DOM-Controls erhalten. `[N]`
- Google- und E-Mail/Passwort-Anmeldung über Firebase Auth; Firebase-UID ist Kontoschlüssel. Dev-Identität/-Datenbank/-Wipe bleiben von Live getrennt. Anbieterwerte und externe Projektanlage werden nicht ins Repository hardcodiert oder durch Implementierung provisioniert. `[N]`
- Online-Fortschritt gilt erst nach serverseitiger Authentifizierung, deterministischer Replayprüfung und idempotentem Persistenz-Commit als autoritativ. Der Client darf lokal rechnen und rendern. `[N]`
- Gold-/Materialmengen, Startbestände, Bau-/Upgrade-/Landkosten, Haus-/Werkstatteffekte, Drop-Weights und Matchband bleiben gesperrte Balancewerte. Vorschläge `[K]` brauchen ausdrückliche Nutzerfreigabe, bevor sie Simulation oder Fortschritt beeinflussen. **Nachgezogen am 2026-09-28:** die Dorf- und Preisfreigaben dieser Aufzählung sind erteilt; welche Werte noch gesperrt sind, steht in `docs/VISUAL_GRUNDSATZ.md`. `[N]`

## 0b. Begegnungsmodell, verborgenes Layout und Placement Tile — Entscheidungen vom 2026-09-29

- **Basisreferenz.** Kämpfe rechnen mit allen Einheiten auf Level 1, ohne Ausrüstung, mit Grundwerten. Der Held ist in Basisform pro Einheit ein Ticken schwächer als ein Monster; das genaue Delta ist `[K]` und noch nicht genannt. Referenzkampf sind mindestens drei Helden gegen Boss plus drei Platzmonster, verstanden als Summe der Zonen auf ihrer Route. `[N]`
- **Gemessene Balance vom 2026-09-29, 500 Seeds je Zeile, Teamgröße 3, offenes Fixture-Grid, Standardregeln.** Die Zahlen sind gemessen, nicht gesetzt; Quelle ist `packages/sim-core/src/combat/balance-report.test.ts`, reproduzierbar mit `BALANCE_SEEDS=500`.

  | Plätze | Helden | Boss | Zeitlimit | Ø Ticks |
  |--------|--------|------|-----------|---------|
  | 0 | 90 % | 10 % | 0 % | 217 |
  | 1 | 65 % | 35 % | 0 % | 222 |
  | 2 | 81 % | 19 % | 0 % | 224 |
  | 3 | 0 % | 100 % | 0 % | 223 |
  | 4 | 0 % | 100 % | 0 % | 228 |
  | 5 | 0 % | 100 % | 0 % | 227 |

  **Der Befund ist eine Wand, kein Band.** Zwischen zwei und drei Plätzen kippt die Quote von 81 % auf 0 %; dort liegt kein justierbarer Zielbereich, sondern ein Bruch. Ein Zielband über die Plätze hinweg ist mit diesen Werten nicht benennbar, und der Bruch ist vor jeder Feinabstimmung zu klären. Ob die Ursache in der Besetzung, der Gruppenstärke oder der Wegführung liegt, ist offen und durch eine Messung zu beantworten, die den Faktor einzeln variiert. Die Prozentzahlen sind gerundet und deshalb nicht summierbar. `[K]`

- **Neumessung vom 2026-09-29, nachdem der Kampf die Art des Verteidigers kennt.** Dieselbe Werkzeugkette, 500 Seeds je Verteidigerplatz, jetzt mit den echten Basisarten statt einer Anzahl gleich starker Kopien:

  | Plätze | 0 | 1 | 2 | 3 | 4 | 5 |
  |---|---|---|---|---|---|---|
  | Helden | 90 % | 0 % | 0 % | 0 % | 0 % | 0 % |
  | Boss | 10 % | 100 % | 100 % | 100 % | 100 % | 100 % |
  | Ø Ticks | 217 | 217 | 219 | 214 | 211 | 104 |

  **Die alte Wand war ein Artefakt, der echte Befund ist schärfer.** Vorher bekam jeder Verteidiger-Slot dieselben Basiswerte, weil `resolveCombat` nur die **Anzahl** belegter Plätze entgegennahm und `fixture-job.ts` die `monsterId` vorher zu einer Zahl zusammenzählte. Fünf Slots waren fünf Kopien; gemessen wurde damit eine Kopie-Sackgasse, nicht das Spiel. Seit `resolveCombat` die Art entgegennimmt, rechnet der Kampf die Werte aus `genome/stats` — und **ein einziges Monster schlägt drei Helden zuverlässig**.

  **Die Ursache ist eine Größenordnung, keine Abstimmung.** Gemessen: ein Held hat 60000 Gesundheit und 12000 Angriff, ein echtes Monster rund 41000 und rund 9000. Die `HP_GAIN`/`ATTACK_GAIN` des Genoms sind auf einen 40000er-Nullpunkt gerechnet, während die Heldenbasis mit 60000 nie gegen einen echten Monsterwert gemessen wurde. Der zweite Golden-Pin bestätigt es: fünf Monster beenden den Kampf in 180 statt 401 Ticks. **Die Zahl, die das richtet, ist eine `[K]`-Größe und wird hier nicht erfunden.** Zu entscheiden ist, ob die Heldenbasis steigt, die Monsterbasis sinkt oder die Elementgewichte neu gesetzt werden — jede dieser drei Wege verschiebt die Goldformel nicht, aber den Golden-Pin. `[K]`

- **Der Boss war die eigentliche Wand — freigegeben und gebaut am 2026-09-29.** Der Befund der dritten Messung war: das Dreierteam gewann in **0 von 32 Seeds**, auch ohne einen einzigen Platzmonster. Nicht die Heldenbasis war daran schuld, sondern `BOSS_RULES`. Mit 200000 Gesundheit, 16000 Angriff und 5000 Rüstung stand der Boss gegen 144000 Leben für das ganze Team, und seine Rüstung drückte jeden Heldenangriff von 12000 auf rund 4070. **Freigegebene Werte (`[N]`, gemessen und nicht geschätzt), jetzt in `packages/sim-core/src/combat/boss.ts`:** 132000 / 12000 / 1000 / 500 bei gleichbleibenden Cooldowns.

  **Die Form, die daraus folgt, ist eine Aussage über das Spiel, nicht nur eine Zahl:** der Boss ist ein Koloss, der nicht gepanzert, sondern groß ist. Seine Bedrohung kommt aus der Lebensleiste und nicht aus der Rüstung, damit der Kampf lang genug dauert, bis Schwankung und die Platzmonster eine echte Niederlage erzeugen. Er ist nicht unfair, er ist ausdauernd.

  **Gemessene Kurve nach der Freigabe**, 48 Seeds je Verteidigerplatz, offenes Fixture-Grid, Standardregeln, Quelle `packages/sim-core/src/combat/balance-report.test.ts`:

  | Plätze | 0 | 1 | 2 | 3 | 4 | 5 |
  |---|---|---|---|---|---|---|
  | 3 Helden | 100 % | 100 % | 100 % | **88 %** | 0 % | 0 % |
  | 4 Helden | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
  | 5 Helden | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |

  **Der Referenzkampf ist damit erreicht:** drei Helden gegen Boss plus drei Platzmonster liegen bei 88 % und damit im Band 80–95 %. Die Tabelle oben mit dem „Bruch zwischen zwei und drei Plätzen" ist durch diese Zeile ersetzt.

  **Die verbleibende Wand ist eine Entscheidung, keine Fehlmessung.** Ab vier belegten Plätzen verliert das Dreierteam, und ab vier Plätzen gewinnt es. Das ist der Hebel, an dem die Heldenzahl wirkt: wer eine voll bestückte Etage angreift, braucht vier oder fünf Helden. `docs/CONCEPT_REVIEW.md` Abschnitt 2 nennt „Heldengruppe maximal 5" und Abschnitt 0b als Referenz mindestens drei — beides ist mit dieser Kurve vereinbar, und die Kurve macht die Teambeschaffung zu einer echten Entscheidung statt zu einer Nebensache. `[N]`

- **Der Angreifer sieht nur den Maze-Weg und die Bonus-Schätze.** Sichtbar sind der Maze-Weg (Labyrinth, Spawn, Boss) und die Bonus-Schätze, sonst nichts — auch nicht die Anzahl der Monster. Seine einzige Eingabe ist die Heldenauswahl. Monsterplatzierungen, Gruppen, Patrouillen und die Platzierungsmarkierungen selbst bleiben für ihn unsichtbar; sichtbar wird eine Begegnung erst, wenn der Run läuft. Die Route bestimmt immer das Pathfinding, nie eine Spielentscheidung; den Umweg wählt der Angreifer nur mittelbar über markierte Schätze. Umgesetzt am 2026-09-29 als `RaidPublicViewSchema` mit `toPublicView` in `packages/contracts/src/raid-public.ts`: Die Match-Antwort trägt diese Sicht, der volle Stand bleibt beim Server. `[N]`
- **Platzierungsmarkierung statt Falle.** Eine Placement Tile markiert den Bereich, in dem eine Monster-Gruppe steht. Sie macht keinen Schaden; die bisherige Optik darf vorerst bleiben. `[N]`
- **Patrouille ist ein Weg.** Ein Bereich trägt eine Zellenliste als Weg; der angezeigte Pfeil nennt Startpunkt und erste Richtung. Gruppen laufen diesen Weg während des Raids. `[N]`
- **Zonenform entschieden am 2026-09-29: die Zone ist die gemalte Fläche.** Ein Bereich ist die Zellenliste seiner zusammenhängenden Platzierungszellen — genau das, was `packages/sim-core/src/grid/zones.ts` heute schon als Platzierungsgruppe liefert. Es wird kein zweiter Weg gezeichnet: die Fläche ist der Weg, ihre Zellen in Routenreihenfolge sind die Stationen, und der Pfeil nennt Startpunkt und erste Richtung. Damit bleibt der Payload das, was der Verteidiger ohnehin malt, und die bestehende Klassifikation wird zur Zonenform statt ein Vorschlag neben ihr zu bleiben. `[N]`
- **Engagement-Regel, Vorschlag für K1: die Begegnungskette läuft in Betretungsreihenfolge.** Die erste Fläche, die die Heldenroute streift, ist die erste Begegnung, danach die nächste. Die Reihenfolge kommt damit aus Route und Flächen des eingefrorenen Stands und braucht keine zweite Wahrheit in der Anzeige. Verbindlich wird sie vor K3, dem Slice mit der Sequenz; bis dahin ordnet sie nur die Kette im Ergebnis. `[K]`
- **Zwei Rollenvokabulare, und das ist vor der Taktik zu entscheiden.** `BaseMonster.archetype` (`tank`, `damage`, `support`, `ambusher`, `controller`, `swarm`) ist eine Eigenschaft der Art und wird heute von keiner Regel gelesen; `CombatUnitSpec.behavior` (`none`, `tank`, `hunter`, `control`) entsteht aus dem Trait, steht im Log und entscheidet die Zielwahl. Beide beschreiben eine Rolle, und `tank` steht in beiden Listen. Der Archetyp sitzt an der Basis-Art, weil er die Art kennzeichnet und ein zweites Feld im Genom eine zweite Wahrheit wäre; das Verhalten sitzt am Genom-Trait, weil es sich mit dem Erbgut ändern soll — die Kopplung ist damit der Unterschied, nicht der Name. **Zu entscheiden vor dem Taktik-Slice:** ob die Taktik den Archetyp liest und das Verhalten daraus abgeleitet wird (ein Vokabular), oder ob der Archetyp die Rolle der Art und das Verhalten die Handlung im Kampf bleibt (zwei Begriffe, dann gehören die Wörter getrennt). Bis dahin ist keine der beiden Seiten verbindlich für die andere. `[K]`
- **Klassen und Taktikregeln stehen seit dem 2026-09-29 im Wire-Format, ihre Zahlen nicht.** `CONTRACT_VERSION 9` führt `HERO_CLASSES` (`none`, `vanguard`, `breaker`, `scout`, `medic`, `controller`, `guardian`), `ABILITY_IDS` und `TacticRuleSchema` in `packages/contracts/src/abilities.ts`, `class` als Pflichtfeld am Log-Spec, `revealed` in der Angreifer-Sicht, den optionalen `escrow` im Freeze und die Stufe `extracted`. Das ist Form ohne Rechnung: die Engine schreibt bis zum Klassen-Slice ausschließlich `none`, `toPublicView` reicht `revealed` durch, und kein Lauf endet `extracted`. **Offen und vor dem Klassen-Slice zu beantworten** sind die Klassenboni und Fähigkeitsstärken (`[K]`, gehören an ihre Quelle im Core), die Zuordnung Held → Klasse aus dem eingefrorenen Stand und die Entscheidung über die zwei Rollenvokabulare darunter. Die Kampfbalance-Wand aus diesem Abschnitt verschärft sich dadurch nicht: die Klassen bewegen heute keine Zahl.
- **Verhaltensprofil aus dem Trait, entschieden und gebaut am 2026-09-29.** Jeder Verteidiger leitet sein Profil aus dem Trait seiner Art ab: `toughHide` und `heavyTread` werden zum `tank`, `keenEdge` zum `hunter`, `focused` zum `control`, `restless` und `deepLungs` bleiben beim Grundfall `none`. Die Profile ändern ausschließlich die **Zielentscheidung** — `tank` das höchste Lebensverhältnis, `hunter` das niedrigste, `control` die höchste Initiative, `none` wie früher das nächste Ziel — und nie eine Kampfzahl. Ob diese Rollenverteilung die richtige ist, bleibt `[K]`; die Zuordnung selbst steht mit ihrem Vermerk in `packages/sim-core/src/genome/behavior.ts`. `ambush`, `support` und `swarm` sind bewusst nicht vergeben, solange die Mechanik dahinter fehlt: der Hinterhalt hängt an der Zone, `support` braucht T2.4, `swarm` braucht K4. Das Profil steht als `behavior` im Log (`CONTRACT_VERSION 8`), weil ein Replay nur den Log liest und die Zielwahl sonst neu erfinden müsste. `[K]`
- **Status ist vollständig persistent.** HP und übrige Zustände bleiben über Zonen und Etagen erhalten, es gibt keine Erholung zwischen Zonen. Vorgesehen ist eine aktive Fähigkeit `Heilen`, die **nach Abschluss einer Etage** bis zu 1/2/3 mal und um 20/40/60 % der Gruppe wirkt; die Stufenzahlen sind damit freigegeben, die Fähigkeit selbst gehört in den Fähigkeiten-Block mit eigenem Contract-Sprung. **Offen:** `[N]` in Abschnitt 0a nennt Fähigkeiten „je Held einmal pro Expedition" — mit 1/2/3 je Etage steht daneben eine zweite Zählung, die vor dem Fähigkeiten-Block entschieden werden muss. `[N/O]`
- **Schätze legt der Verteidiger.** Der Angreifer markiert nur, welche davon er plündern will; ob ein Umweg gegangen wird, hängt an dieser Markierung. Wie viel Mehrweg ein Schatz wert ist, bleibt `[K]`. `[N/K]`
- **Zwei Fassungen desselben Stands.** Der Stand, der den Angreifer erreicht, trägt nur das Sichtbare (Raster, Spawn, Boss, später sichtbare Schätze). Roster, Gruppen und Patrouillen laufen in der privaten Fassung und werden serverseitig gerechnet; eine Kampfauflösung im Client wäre bei verborgenen Platzierungen nur Optik. `[N]`

**Erledigt mit dem 2026-09-29:** Der `[K]`-Vorschlag „Falle kostet 3 Extrapunkte; Ausweichroute maximal 5 zusätzliche Bewegungspunkte" aus Abschnitt 4 ist gegenstandslos, ebenso „Gruppe läuft als ein Blob" für den Kampf — eine Gruppe läuft ihren Weg als Patrouille.

## 0c. Nachwirkung, Erholung und Moral — Freigabe vom 2026-09-29

- **Erschöpfung und Verletzung sind verkettete Multiplikatoren auf die Initiative.** Je Wunde ×0,8, je Stufe Erschöpfung ×0,9, nacheinander gerechnet und nicht addiert; je Nachwirkung zählen höchstens fünf Stufen. Die Wirkung steht am Kampf-Spec und damit im Log, weil ein Replay nur den Log liest. Gebaut am 2026-09-29 in `packages/sim-core/src/combat/conditions.ts` (Werte `[K]`, Vermerk an der Quelle); die Zahlen „z. B. 5" nennt die freigegebene Option selbst. `[N]`
- **Dieselbe Einheit gilt in Dorf und Kampf.** Es gibt keine zweite, dorfinterne Skala für Erschöpfung und Verletzung; beide Seiten lesen denselben ganzzahligen Zustand. `[N]`
- **Erholung im Dorf (freigegeben, ungebaut).** Regeneration von `5 + Anzahl Wohnhäuser` HP je Tag, Erschöpfung −1 je Tag, Verletzung −1 alle zwei Tage. Eine **Wunde** entsteht, wenn ein Held einen Kampf unter 30 % Restleben beendet. Diese Hälfte braucht die Naht `result → tag`, an der bisher nur `dailyYield` in den Materialbestand schreibt. `[N]`
- **Gilde und Zucht (freigegeben, ungebaut).** Die Gilde ist auf Stufe 3 ausbaubar (Kostenkoeffizient 40); die Zuchtkapazität ist `Stufe − 1`, und die Rostergröße ist `floor(Arbeiterbasis / 2)`. `[N]`
- **Auflösung eines Monsters (freigegeben, ungebaut).** Stärke 0 bis 1 ergibt ein Material je Stufe. `[N]`
- **Monster-Moral (freigegeben, ungebaut).** Moral 0 bis 3; eine Niederlage erhöht sie um 1, ein Sieg senkt sie um 1; je Stufe +15 % Initiative und +10 % Angriff. Der Wert würde optional im `RaidSnapshot` reisen, und weil der v9-Stand bereits belegt ist, wäre das ein eigener Contract-Sprung mit eigener Migration. `[N]`
- **Held-Heilung gehört nicht hierher, sondern ins Inventar.** Tränke in vier Stufen (K/M/G/XL), höchstens drei je Held, Preise 500/1200/2000 Gold in steigender Staffelung — das ist T2.5 und bleibt bis zur Drop-Freigabe gesperrt. `[N]`

## 1. Spielform und Kernloop `[N]`

- Persistentes Webspiel, asynchroner Multiplayer, kein Echtzeit-MMO.
- Wechsel Tag/Nacht manuell per Button. Kein Energie-System.
- Tag: Bürgermeister; Dorf, Gilde, Shops, Verkauf der Nacht-Beute.
- Nacht: Dungeon Master; Dungeon verwalten und bauen.
- Dorf startet bei 10×10 Tiles und wächst horizontal per Landkauf.
- Dungeon hat pro Etage 64×64 Logikzellen und wächst nur vertikal; jede Etage ist eine eigene Map.
- Ko-Abhängigkeit: Dorf braucht Gold und Dungeon-Materialien; Dungeon braucht Arbeiter, die über Dorfattraktivität und Gebäude angezogen werden.
- Dorfgebäude bestimmen mit, welche Art von Abenteurern angelockt wird.

## 2. Helden, Raid und Matching `[N]`

- Heldengruppe maximal 5; der Spieler stellt sie zusammen.
- Helden sind zu keinem Zeitpunkt spielergesteuert; der Raid läuft automatisch. Ziel ist immer: Boss besiegen.
- Man greift nie den eigenen Dungeon an.
- Ein eigener Angriff stellt automatisch den eigenen Dungeon in den globalen Pool.
- Matching über einen internen Stärke-/MMR-Wert; zufällige Zuweisung statt freier Pool-Auswahl.
- Kein passender Spieler: CPU-/prozedural generierter Gegner auf eigener Stärke.
- Nach vollständigem **oder abgebrochenem** Raid wird der angegriffene Spieler nur lokal für diesen Angreifer aus dessen Player-ID-Pool gesperrt; ein Abbruch zählt mit.
- Nur der eigene Angriff übermittelt etwas an den Server; der Zustand bleibt bis zum nächsten Sync-Checkpoint fix. Beim Dungeon-Speichern erinnert ein Toast an den nötigen Angriff.

### KI-Vorschläge zu Raid/Backend `[K]`

- ±10-%-MMR-Band, 2-Sekunden-Query, Ghost-Seed = MMR + UTC-Tag, 15-Minuten-Job-TTL.
- Genau ein offener Angriffs-Slot, D1 als Job-Store, Queues zum Headless-Worker.
- Reihenfolge „erst eigener Freeze, dann Ziel-Matching“; Taktiken nicht im Freeze.
- **Der globale Vier-Stunden-Shield entfällt** (D11). Es bleiben lokale Sperre je Angreifer-Verteidiger-Paar und der Moral-Schutz. `[N-del]`

## 3. Moral, Rotation und Zucht `[N]`

- Besiegte Dungeon-Monster sterben nicht permanent; sie verlieren Moral und werden inaktiv.
- Reaktivierung per Gold oder „Beurlauben“ für 1–5 Runden.
- Ist die Moral vollständig aufgebraucht, greift ein globaler Schutzstatus.
- Monster leveln bei jedem Kampf, auch bei Niederlage; das Level-Cap skaliert mit der Generation.
- Zucht kombiniert 2 Monster, verbraucht deren XP; das neue Monster startet auf Level 1.
- Initial 5 Monster-Slots pro Etage; der Boss zählt nicht. Visuelle Schwärme belegen nur einen Slot.
- Ab Etage 2 werden zusätzliche Slots mit Monster-Seelen gekauft; Seelen entstehen durch Zerlegen ungewollter Zuchten.
- Startpool: **20** mit Gold kaufbare Basis-Monster. Die Zahl ist am 2026-09-29 entschieden; der Pool liegt als `packages/sim-core/src/genome/roster-a.ts` und `roster-b.ts` im Code. Diese Sektion führte zuvor „25" — die Zahl ist ersetzt, nicht die Liste umgedeutet.

### Offen / Fremdsession `[O]`

- Die konkrete Liste, Cluster, Traits und Elemente stammen laut Nutzer aus einer kontextfreien Fremdsession. Am 2026-09-29 ist die **Zahl** entschieden (20) und als Startbasis implementiert; die **Werte** der Basis-Monster sowie Kopplungsstärke, Mutationsdrift und Effektprozente sind weiterhin `[K]` und nicht abgenommen. Die Goldformel der Run-Beute ist an demselben Tag freigegeben (Variante B, G₁ = 40, Generationsfaktor 0,25) und steht damit nicht mehr in dieser Liste.
- Mutationsformel, Dominanzregeln und Umrechnung von Zucht-XP in Ressourcen/Seelen.

## 4. Dungeon-Bau und Pathfinding `[N]`

- Freies Graben auf dem 64×64-Raster; Boss in einer Aktion frei platzierbar.
- Helden nehmen den Weg mit den wenigsten Tiles.
- Beim Bau/Sync-Checkpoint muss immer eine Route frei sein, sonst Hard-Block.
- Man darf neue Wege graben und alte zumauern.

### Technische Korrektur `[N]`

- Ein handgebautes Dungeon ist Nutzerdaten und wird als serialisiertes Grid übertragen; Seeds erfassen nur prozedurale Anteile. Das ODT formulierte zuerst Seeds für alle Maps, das ist technisch nicht haltbar.

### KI-Vorschläge zu Kosten/Budget `[K]`

- **SUPERSEDIERT am 2026-09-29 (siehe 0b):** Falle kostet 3 Extrapunkte; Ausweichroute maximal 5 zusätzliche Bewegungspunkte. Die Placement Tile macht keinen Schaden und bestimmt keine Kosten mehr.
- **SUPERSEDIERT am 2026-09-29 (siehe 0b):** Einmal-Umweg pro Gruppe und Etage; Gruppe läuft als ein Blob. Eine Gruppe läuft als Patrouille über einen Weg aus mehreren Zellen.
- Wände werden von der KI nicht zerstört; exakt fünf Tile-Typen als v1-Contract.

## 5. Boss, Beute und Items `[N]`

- Boss besiegt: Beute ist eine Phantom-Kopie (Session 2026-09-25); der Angreifer erhält eine System-Kopie von 1 von maximal 5 Monstersteinen sowie 50 % der Herstellungs-Essenzen. Der Verteidiger verliert keine Live-Ressourcen oder Steine.
- Items: 9 Slots, 5 Seltenheitsstufen.
- Helden im MVP rein menschlich, Fokus auf Portrait-Ansicht.
- Spells nur über Klasse und Ausrüstung; aktive Spells ausschließlich über Unique Items.
- Blaue und epische Items können passive Procs mit sichtbarem Feedback auslösen.

### KI-Vorschläge `[K]`

- Beitragsformel 3×Post-Mitigation-Schaden + 1×überlebte Ticks; 10 % Zucht-XP-Steuer; 10 % XP-Verlust beim Tod; Mindest-Loss-XP 10 %; Rest-XP an das Monster mit dem wenigsten XP.
- Teilbetrag-Wetteinsatz ohne Full-Loot-Risiko; Lazarett 1 HP pro Minute und 2 Stunden Wiederbelebung.
- Mutatoren-Bonus 1–4 (Farbe/Glow, Edelsteine, Hintergrundmuster, animiertes Muster).

## 6. Wirtschaft und Monetarisierung `[N]`

- Es gibt noch keinen Handel; dadurch entsteht keine Inflation über Systemessenzen. Bei späterem Handel braucht es Grenzen.
- Launch ohne Monetarisierung. Später nur Kosmetik oder RNG-Rerolls der Statuswerte.
- Keine Paywalls, keine sicheren Rolls, keine Roll-Caps, keine künstlichen Progress-Gates, kein Pay-to-Win.

## 7. Technische Leitplanken

- Owner Contracts, strikte Domänentrennung und absolute Determinismus-Vorgabe. `[N]`
- Kein `Math.random`/`Date` in der Simulation; Ganzzahlen beziehungsweise Fixed-Point statt Float. `[N]`
- Der Client rendert und zeigt nur; Fortschritt entsteht ausschließlich nach serverseitigem Gate/Replay. `[N]`
- Schlanker Headless-Worker rechnet den Trail mit demselben Seed nach. `[N]`
- Seeds/Präfixe für prozedurale Heldendaten, Ausrüstung, Monsterstats und Events. `[N]`
- Stack, Hosting, DB, Queue und Protokollversionen. `[N-del]` — **entschieden** nach D13: Cloudflare Worker, D1, Queues, Firebase Auth. Die frühere Aussage „nicht entschieden" ist überholt.

## 8. Arbeitsregel `[N]`

- Nutzeraussagen und KI-Vorschläge bleiben getrennt; nur abgenickte Punkte sind fix.
- Scope Creep ist erlaubt, aber nichts wird stillschweigend zum Konzept.

## 9. Abnahmegrenze

- Implementiert: 64×64-Grid, Pathfinding ohne Zusatzkosten, Placement Tile, Contract **v9** mit öffentlicher Angreifer-Sicht (`toPublicView`) und privatem Stand, D1-Jobstatus, Trail-Hash, deterministischer Combat- und Replay-Core, lokale Tag/Nacht/Raid-Schleife sowie die Core-Seite der Zucht mit 20 Basis-Monstern, gekoppelter Mutation und Kreuzung über den internen PRNG (`packages/sim-core/src/genome/`). Nicht implementiert: echtes HTTP-Netzwerk/Auth, Queue, Remote-Matching, Ghost-Fallback, Moral-Verlustfolgen, Zucht-UI, Items und Dorf-Ökonomie (T2/T3).
- Die Monsterzahl ist entschieden (**20**); dieser Abschnitt führte zuvor „Startpool: 25" und die Zahl ist ersetzt. Offen bleiben die **Werte**: Elementzahlen, Kopplungsstärke, Mutationsdrift und Effektprozente sind `[K]` und nicht abgenommen.
- Kein `[K]`- oder `[O]`-Punkt ist eine Implementierungsfreigabe.
