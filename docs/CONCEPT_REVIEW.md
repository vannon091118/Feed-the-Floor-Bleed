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
- Nur der eigene Angriff übermittelt etwas an den Server; der Zustand bleibt bis zum nächsten Commit fix. Beim Dungeon-Speichern erinnert ein Toast an den nötigen Angriff.

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
- Beim Bau/Commit muss immer eine Route frei sein, sonst Hard-Block.
- Man darf neue Wege graben und alte zumauern.

### Technische Korrektur `[N]`

- Ein handgebautes Dungeon ist Nutzerdaten und wird als serialisiertes Grid übertragen; Seeds erfassen nur prozedurale Anteile. Das ODT formulierte zuerst Seeds für alle Maps, das ist technisch nicht haltbar.

### KI-Vorschläge zu Kosten/Budget `[K]`

- Falle kostet 3 Extrapunkte; Ausweichroute maximal 5 zusätzliche Bewegungspunkte.
- Einmal-Umweg pro Gruppe und Etage; Gruppe läuft als ein Blob.
- Wände werden von der KI nicht zerstört; exakt fünf Tile-Typen als v1-Contract.

## 5. Boss, Beute und Items `[N]`

- Boss besiegt: Der Boss verliert 1 von maximal 5 ausrüstbaren Monstersteinen; der Angreifer erhält 50 % der Herstellungs-Essenzen.
- Beute ist eine Phantom-Kopie (Session 2026-09-25).
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

- Implementiert: 64×64-Grid, Pathfinding, Contract-v2-Freeze und D1-Jobstatus. Nicht implementiert: HTTP, Queue, Matching, Ghost, Combat, Replay, Client-End-to-End, Moral, Zucht, Items und Dorf-Ökonomie.
- Alle `[K]`-Punkte sind keine Implementierungsfreigabe.
