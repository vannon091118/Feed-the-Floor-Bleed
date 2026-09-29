# Konzeptreview — ODT-Realignment (2026-09-25)

> Einzige kanonische Quelle für allgemeine Spiel-, Sync-, Snapshot-, Matching-, Beute- und Pathfinding-Regeln.
> Sicherheits-/Prüfmarkensemantik: `docs/CONCEPT_REVIEW_SECURITY.md`.
> Quellen: ODT `Unbenannt_2` (Gemini-Export plus eingeschobene Nutzerkorrekturen) und die drei Festlegungen der Session vom 2026-09-25.
> Status: `[N]` = Nutzerfestlegung (im ODT belegt oder in dieser Session bestätigt). `[K]` = KI-/Assistentenvorschlag, nicht abgenickt. `[O]` = offen.
> Nur `[N]` ist fix. Technische Umsetzung, Stack und Detailzahlen sind niemals Spielregeln.

## 0. In dieser Session bestätigt

- Grid: 64×64 Logikzellen, sichtbar 16×16, also 4×4 Logikzellen pro sichtbarem Tile. Die ODT-Formulierung „4 Logiken pro sichtbarem Tile“ ist damit **SUPERSEDIERT**. `[N]`
- Beute: Phantom-Kopie. Der Angreifer erhält System-Loot, der Verteidiger verliert keine Live-Ressourcen. `[N]`
- Doku-Regel: KI-Vorschläge dürfen nicht mehr als bestätigte Regeln geführt werden. `[N]`

## 0a. Visual- und Expeditionsentscheidungen vom 2026-09-27

Die vollständige Detail- und Sprintquelle ist `docs/VISUAL_GRUNDSATZ.md`; die folgenden neueren Nutzerfestlegungen übersteuern widersprechende alte Notizen:

- Ressourcen im Epic sind nur Gold und Materialien. Gold stammt aus besiegten Gegnern, abhängig von Stärke/Generation; Material stammt aus ausgebauten Gebäuden/Werkstätten. Keine dynamischen Ressourcen-Plugins und keine zusätzliche Ressource. `[N]`
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
- **Der Angreifer sieht nur den Maze-Weg und die Bonus-Schätze.** Sichtbar sind der Maze-Weg (Labyrinth, Spawn, Boss) und die Bonus-Schätze, sonst nichts — auch nicht die Anzahl der Monster. Seine einzige Eingabe ist die Heldenauswahl. Monsterplatzierungen, Gruppen, Patrouillen und die Platzierungsmarkierungen selbst bleiben für ihn unsichtbar; sichtbar wird eine Begegnung erst, wenn der Run läuft. Die Route bestimmt immer das Pathfinding, nie eine Spielentscheidung; den Umweg wählt der Angreifer nur mittelbar über markierte Schätze. Umgesetzt am 2026-09-29 als `RaidPublicViewSchema` mit `toPublicView` in `packages/contracts/src/raid-public.ts`: Die Match-Antwort trägt diese Sicht, der volle Stand bleibt beim Server. `[N]`
- **Platzierungsmarkierung statt Falle.** Eine Placement Tile markiert den Bereich, in dem eine Monster-Gruppe steht. Sie macht keinen Schaden; die bisherige Optik darf vorerst bleiben. `[N]`
- **Patrouille ist ein Weg.** Ein Bereich trägt eine Zellenliste als Weg; der angezeigte Pfeil nennt Startpunkt und erste Richtung. Gruppen laufen diesen Weg während des Raids. `[N]`
- **Begegnung sequenziell.** Jede Zone ist eine eigene Begegnung; danach zieht die Gruppe weiter. `[N]`
- **Status ist vollständig persistent.** HP und übrige Zustände bleiben über Zonen und Etagen erhalten, es gibt keine Erholung zwischen Zonen. Vorgesehen ist eine aktive Fähigkeit `Heilen`, die **nach Abschluss einer Etage** bis zu 1/2/3 mal und um 20/40/60 % der Gruppe wirkt; die Stufenzahlen sind damit freigegeben, die Fähigkeit selbst gehört in den Fähigkeiten-Block mit eigenem Contract-Sprung. **Offen:** `[N]` in Abschnitt 0a nennt Fähigkeiten „je Held einmal pro Expedition" — mit 1/2/3 je Etage steht daneben eine zweite Zählung, die vor dem Fähigkeiten-Block entschieden werden muss. `[N/O]`
- **Schätze legt der Verteidiger.** Der Angreifer markiert nur, welche davon er plündern will; ob ein Umweg gegangen wird, hängt an dieser Markierung. Wie viel Mehrweg ein Schatz wert ist, bleibt `[K]`. `[N/K]`
- **Zwei Fassungen desselben Stands.** Der Stand, der den Angreifer erreicht, trägt nur das Sichtbare (Raster, Spawn, Boss, später sichtbare Schätze). Roster, Gruppen und Patrouillen laufen in der privaten Fassung und werden serverseitig gerechnet; eine Kampfauflösung im Client wäre bei verborgenen Platzierungen nur Optik. `[N]`

**Erledigt mit dem 2026-09-29:** Der `[K]`-Vorschlag „Falle kostet 3 Extrapunkte; Ausweichroute maximal 5 zusätzliche Bewegungspunkte" aus Abschnitt 4 ist gegenstandslos, ebenso „Gruppe läuft als ein Blob" für den Kampf — eine Gruppe läuft ihren Weg als Patrouille.

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
- Globaler Vier-Stunden-Shield als Standardantwort sowie ein Bau-/Raid-Session-Lock nur für den Angreifer. Das ODT nennt stattdessen lokale Sperre plus Moral-Schutz; beides bleibt `[O]`.

## 3. Moral, Rotation und Zucht `[N]`

- Besiegte Dungeon-Monster sterben nicht permanent; sie verlieren Moral und werden inaktiv.
- Reaktivierung per Gold oder „Beurlauben“ für 1–5 Runden.
- Ist die Moral vollständig aufgebraucht, greift ein globaler Schutzstatus.
- Monster leveln bei jedem Kampf, auch bei Niederlage; das Level-Cap skaliert mit der Generation.
- Zucht kombiniert 2 Monster, verbraucht deren XP; das neue Monster startet auf Level 1.
- Initial 5 Monster-Slots pro Etage; der Boss zählt nicht. Visuelle Schwärme belegen nur einen Slot.
- Ab Etage 2 werden zusätzliche Slots mit Monster-Seelen gekauft; Seelen entstehen durch Zerlegen ungewollter Zuchten.
- Startpool: 25 mit Gold kaufbare Basis-Monster.

### Offen / Fremdsession `[O]`

- Die konkrete 25er-Liste, Cluster, Traits und Elemente stammen laut Nutzer aus einer kontextfreien Fremdsession und müssen erst gegen dieses Projekt geprüft werden.
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
- Stack, Hosting, DB, Queue und Protokollversionen. `[O/K]` — der Stack ist nicht entschieden.

## 8. Arbeitsregel `[N]`

- Nutzeraussagen und KI-Vorschläge bleiben getrennt; nur abgenickte Punkte sind fix.
- Scope Creep ist erlaubt, aber nichts wird stillschweigend zum Konzept.

## 9. Abnahmegrenze

- Implementiert: 64×64-Grid, Pathfinding ohne Zusatzkosten, Placement Tile, Contract v5 mit öffentlicher Angreifer-Sicht (`toPublicView`) und privatem Stand, D1-Jobstatus, Trail-Hash, deterministischer Combat- und Replay-Core sowie lokale Tag/Nacht/Raid-Schleife (T1 abgeschlossen). Nicht implementiert: echtes HTTP-Netzwerk/Auth, Queue, Remote-Matching, Ghost-Fallback, Moral-Verlustfolgen, Zucht-UI, Items und Dorf-Ökonomie (T2/T3).
- Alle `[K]`-Punkte sind keine Implementierungsfreigabe.
