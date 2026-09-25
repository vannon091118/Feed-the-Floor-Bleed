# Konzeptreview — kanonischer v1-Entscheidungsstand

> Diese Datei ist die einzige kanonische Quelle für allgemeine Sync-, Snapshot-, Matching-, Backend-, Wett-, XP- und Pathfinding-Regeln.
> Sicherheitsprüfungen und die manuelle `Invalid request /purge account`-Marke stehen ausschließlich in `CONCEPT_REVIEW_SECURITY.md`.
> `BESTÄTIGT` = Nutzerfestlegung; `SUPERSEDIERT` = durch eine neuere Festlegung abgelöst; `OFFEN` = noch nicht entschieden. Diese Datei autorisiert keine Implementierung.

## 1. Asynchroner Raid, Upload-Commit und Job-Lebenszyklus

### BESTÄTIGT

- Das Spiel ist asynchron und kein Echtzeit-MMO.
- Jeder Spieler hat genau eine offene Anfrage: seinen aktiven Angriffs-Slot.
- Es gibt keine dynamische Live-Warteschlange, kein Warten auf Gegner und keine Verdrängung laufender Jobs.
- Der Angreifer muss während der serverseitigen Simulation nicht online bleiben.
- Der Upload-Commit friert **zuerst den eigenen Snapshot** ein: Gold, Materialien, Monster-Slots, aktive Team-Zusammenstellung, temporäre Müdigkeit/Verletzung und Dungeon-Snapshot.
- **Danach** startet das Ziel-Matching. Der Einsatz wird beim ausgehenden Request geloggt.
- Der Raid läuft gegen einen zum Startzeitpunkt serverseitig eingefrorenen Snapshot des ausgewählten Pool-Ziels.
- Der Client darf das Ergebnis nicht bestimmen; ein gültiges Resultat ist ausschließlich das serverseitig berechnete Ergebnis.

### Backend-Entscheidung

- D1 speichert den dauerhaften Raid-Jobstatus und die 15-Minuten-Frist.
- Cloudflare Queues übergeben den Job an den Headless-Worker.
- Es gibt kein externes Redis und kein zusätzliches Durable Object für diesen ersten Schnitt.
- Der Job besitzt eine harte fachliche TTL von 15 Minuten ab Upload-Commit.
- Login innerhalb von 15 Minuten stellt den Jobstatus bereit und stößt die serverseitige Berechnung beziehungsweise Wiederaufnahme an.
- Liegt bis zum Ablauf kein gültiges serverseitiges Ergebnis vor, wird der Job als harter Abbruch gewertet: Niederlage, kein Einsatz zurück, lokaler Cooldown aktiv.
- Ein Disconnect ist kein gültiges Resultat und darf keinen offenen Job unendlich weiterleben lassen.
- Der implementierte D1-Statusautomat lautet `accepted → queued → running → completed`; `failed` ist aus jeder aktiven Phase und `expired` aus jeder aktiven Phase erreichbar. Terminale Zustände sind unveränderlich.
- Der Upload-Commit persistiert den vollständigen Contract-v2-Raid-Freeze und `accepted`-Job atomar. Der Freeze umfasst genau Ressourcen, fünf Monster-Slots, aktive Helden mit temporärer Müdigkeit/Verletzung und Dungeon; Taktiken sind kein persistierter Freeze-Bestandteil. Derselbe Idempotenzschlüssel mit denselben Daten liefert denselben Job; abweichende Daten werden abgewiesen.
- Der Job hält den Angreifer-Freeze direkt und einen anfangs leeren Ziel-Snapshot-Verweis. Der Ziel-Verweis darf später genau einmal auf einen unveränderlichen Ziel-Freeze gesetzt werden; Auswahl und Verknüpfung sind noch nicht implementiert.

### OFFEN

- Ob die Queue-Nachricht beim Reconnect neu erzeugt wird oder nur anhand der D1-Job-ID idempotent bestätigt wird.

## 2. MMR-Matching und Ghost-Dungeon

### BESTÄTIGT

- Matching verwendet exakt ein DB-Query für den Zielkandidaten.
- Gesucht wird im Bereich von ±10 % des aktuellen MMR.
- Der Query hat eine harte Grenze von 2 Sekunden.
- Bei 1 bis N Treffern wählt der Server per deterministischem Seed aus der Job-ID genau einen Gegner.
- Bei leerer Liste oder Query-Überschreitung von 2 Sekunden greift sofort der Ghost-Fallback; es wird nicht gewartet.
- Ein Ghost wird mit `Seed = MMR + Daily Timestamp` erzeugt.
- Der Daily Timestamp ist ein deterministischer UTC-Tageswert; die konkrete Seed-Zusammensetzung muss als Integer-Contract festgeschrieben werden.
- Ghost-Monsterstats und Etagenanzahl entsprechen exakt dem MMR-Band.
- Der Ghost-Loot-Pool wird vom System subventioniert; dafür werden Essenzen systemseitig erzeugt.
- Die ältere Aussage „global zuerst, MMR später“ ist **SUPERSEDIERT**: Es gibt keine globale Start-Warteschlange.

### OFFEN

- Konkrete Datenbank-Implementierung des Ein-Query-Ziels.
- Daily-Timestamp-Format und Vermeidung von Seed-Kollisionen.
- Ob ein Ghost pro Tag, MMR und Version wiederverwendet oder pro Job neu materialisiert wird.

## 3. Wetteinsatz, Erfolg und Verlust

### BESTÄTIGT

- Beim Upload-Commit wird der aktuelle Besitz eingefroren, aber nicht vollständig als Wetteinsatz riskiert.
- Im Raid werden ausschließlich das geschickte Abenteurer-Team und dessen temporäre Müdigkeit/Verletzung als Teilbetrag bewertet.
- Dorf-Gold, Materialreserven und Monster-Slots bleiben unangetastet; es gibt kein Full-Loot-Frust-Risiko.
- Loot ist eine **Phantom-Kopie**: Der Angreifer erhält systemseitig erzeugten Loot, aber der Verteidiger verliert keine Live-Ressourcen aus Gold, Materialien, Slots oder Dungeonsicherungen.
- Der Boss-Slot auf 0 HP bedeutet Raid-Erfolg und die Bonusregel der Wette.
- Sterben die Helden vor dem Boss, ist es ein vollständiger Wipe; die Verteidiger holen den Raid-Sieg.
- Es gibt kein Refund und kein magisches Restore bei Abbruch, Tab-Schließung, Timeout oder fehlerhaftem Raid.
- Ein abgebrochener oder fehlerhafter Raid zählt vollständig für die lokale Sperre.
- Der Angriffs-Slot ist nach einem solchen Raid gesperrt; Helden gehen verletzt ins Lazarett.

### OFFEN

- Wie die Ziel-Etage ausgewählt und wie ihr Erfolg technisch an den Job gebunden wird.
- Dauer des lokalen Cooldowns nach einem Abbruch.

## 4. Raidbeitrag und Monster-XP

### BESTÄTIGT

- Der Integerbeitrag eines Monsters ist `3 × Schaden + 1 × überlebte Ticks`.
- Für den Raid-Score zählt `Schaden` ausschließlich als **Post-Mitigation-Schaden** nach Rüstung und Verteidigung.
- `RawDamage` bleibt der Pre-Mitigation-Wert aus `BaseStat + ItemStat`; der ausgehende Multiplikator auf RawDamage ist insgesamt auf Faktor 3 begrenzt.
- Das entspricht 75 % Post-Mitigation-Schaden und 25 % überlebte Ticks, anschließend als verhältnisbasierter Beitrag auf 100 % normiert.
- Alle Werte werden in Fixed-Point gerechnet; Client-Schäden und Client-Hashes sind nicht autoritativ.
- Monster erhalten XP für jeden Kampf, einschließlich Loss-XP bei Niederlage.
- Nur tatsächlich gekämpfte beziehungsweise aktiv rotierte Monster erhalten Anteile; Urlaubs- oder nicht aktive Monster erhalten nichts.
- Ganzzahlige Anteile werden hart abgerundet.
- Der verbleibende Rest-XP geht an das Monster mit dem aktuell wenigsten XP im Raum; er verfällt nicht.
- Bei exakt gleichem XP-Stand gewinnt das Monster mit der niedrigeren internen Datenbank-ID.
- Die Mindest-Loss-XP beträgt 10 % der Standard-XP eines regulären Kills.
- Bei null Gesamtbeitrag erhalten die Monster die Mindest-Loss-XP.
- `RawDamage = BaseStat + ItemStat`; Multiplikatoren auf den Vor-Mitigations-Schaden sind insgesamt auf Faktor 3 begrenzt.
- Bei der Zucht werden 10 % der kumulierten Eltern-XP als Systemsteuer kassiert; die übrigen 90 % werden in Ressourcen/Seelen umgewandelt.
- Ein im Raid gestorbenes Monster verliert 10 % der XP seines aktuellen Levels, ohne zu deleveln.

### SUPERSEDIERT

- Die frühere Formel „Boss-Schaden + besiegte Monster auf dem Weg + verbleibende Helden-HP“ ist nicht mehr aktiv.
- Die frühere Formel ohne 3:1-Gewichtung ist nicht mehr aktiv.

### OFFEN

- Exakte Definition des Beitrags-Damage: Der Score verwendet Post-Mitigation-Schaden; `RawDamage` selbst ist bereits durch den Faktor-3-Cap definiert.
- Definition und Wert der Standard-XP eines regulären Kills.
- Umrechnung der 90 % Zucht-XP in Ressourcen/Seelen.
- Genaue Definition der aktiven Rotation während eines Raids.

## 5. Shield und Lazarett

### BESTÄTIGT

- Ein angegriffener Spieler erhält einen globalen Vier-Stunden-Shield gegen weitere eingehende Raids.
- Der Schutz gilt gegen alle Angreifer, nicht nur lokal gegen einen bestimmten Angreifer.
- Ein eigener Angriff bricht den Shield des Spielers; danach ist er wieder angreifbar.
- Helden heilen im Lazarett mit 1 HP pro Minute.
- Ein toter Held benötigt maximal 2 Stunden bis zur vollständigen Einsatzbereitschaft.

### BESTÄTIGT — Moral-Schutz und Bau-Lock

- Der Moral-Schutz ist ein separater, aktionsbasierter globaler Schutzstatus ohne Timer.
- Er endet, wenn der Spieler selbst einen Raid startet oder auf „Nächster Tag“ klickt.
- Der Angriffs-/Anti-Farming-Schild und der Moral-Schutz bleiben getrennte Zustände.
- Der Bau-Lock gilt nur für die aktive eigene Client-Session: Ein Spieler kann nicht gleichzeitig im Editor bauen und selbst einen Angriff steuern.
- Ein angegriffener Verteidiger darf in seiner eigenen Session weiterbauen; die Raid-Berechnung verwendet trotzdem nur den zu Jobbeginn eingefrorenen Snapshot.
- Die serverseitige Aktion muss die Commit-Reihenfolge serialisieren: ein Build vor dem Angriffs-Commit darf live greifen; ein Build nach dem Angriffs-Commit für denselben Angreifer wird abgelehnt und nicht in eine Bau-Queue gelegt.

### OFFEN

- Die 1-HP-pro-Minute-Regel und die 2-Stunden-Regel sind nur gemeinsam erfüllbar, wenn maximale Helden-HP ≤120 sind oder eine separate Wiederbelebungs-/Vollheilungsregel gilt. Der Wert muss entschieden werden.
- Ob der Angriffs-Shield bei einem eigenen Angriff bereits beim Upload-Commit oder erst bei erfolgreichem Jobabschluss bricht.
- Ob der Moral-Schutz alle eingehenden Raids blockiert oder nur die maximale Raidzahl pro Nacht begrenzt.

## 6. Pathfinding, Umweg und Tile-Typen

### BESTÄTIGT

- Der Einmal-Umweg gilt pro Heldengruppe und Etage.
- Die Gruppe läuft als ein logischer Blob.
- Ein leeres Tile kostet 1 Bewegungspunkt.
- Eine Falle verursacht Schaden und kostet 3 Extrapunkte.
- Wände sind Block; KI zerstört sie nicht.
- Der direkte Weg wird nach der wenigsten Tile-Anzahl bevorzugt.
- Bei einem blockierenden Hindernis darf A* auf dieser Etage genau einmal eine Ausweichroute berechnen.
- Die Ausweichroute darf maximal 5 zusätzliche Bewegungspunkte inklusive Fallenkosten kosten.
- Reicht das Budget nicht, läuft die Gruppe im laufenden Raid durch die Falle und erleidet Schaden.
- Beim Bauen wird ein Upload mit keiner validen Start-zu-Boss-Route als Hard-Block abgelehnt.
- Für v1 existieren exakt fünf Tile-Typen: Leer, Wand, Falle, Spawn-Punkt und Boss-Slot.

### OFFEN

- Genaue Passierbarkeit und Kostenrolle von Spawn-Punkt und Boss-Slot im Grid-Contract.
- Verhalten, wenn die Runtime nach dem einmaligen Budget keine Route mit akzeptabler Kosten hat.

## 7. ODT-Spielsysteme und Kernökonomie

### BESTÄTIGTE ODT-REGELN

- Das Spiel ist persistent und asynchron, ohne künstliches Energie-System.
- Der Spieler wechselt manuell per Button zwischen Tag und Nacht.
- Tag: Bürgermeister, Dorfwirtschaft, 10×10-Startdorf, horizontales Wachstum durch Landkauf, Shops, Gilden und Verkauf von Beute.
- Nacht: Dungeon Master, vertikales Wachstum, jede Etage als eigene Map.
- Das interne Dungeon-Daten-Grid hat 64×64 Logikzellen und wird visuell auf 16×16 Tiles interpoliert; 4×4 Logikzellen entsprechen einem sichtbaren Tile.
- Dorf und Dungeon sind ko-abhängig: Das Dorf braucht Gold und Dungeon-Materialien; der Dungeon benötigt Arbeiter, die durch Dorfattraktivität angezogen werden.
- Eine Abenteurer-Gruppe besteht aus maximal fünf Helden.
- Ein Angriffs-Commit übermittelt den eigenen Dungeon in den globalen Raid-Pool; der eigene Dungeon wird nie angegriffen.
- Freies Graben im Daten-Grid, Boss-Platzierung in einer Aktion und serverseitige A*-Erreichbarkeitsprüfung beim Commit sind Bestandteil des Dungeons.
- Der Basispool umfasst 25 kaufbare Monster in fünf genetischen Clustern.
- Zucht verbraucht die XP beider Eltern; jedes neue Monster startet auf Level 1.
- Monster leveln auch nach Niederlagen; das Level-Cap skaliert mit der Generation.
- Pro Etage gibt es initial fünf Monster-Slots; der Boss zählt nicht mit. Ein visueller Schwarm belegt nur einen Slot.
- Ab Etage 2 werden zusätzliche Slots mit Monster-Seelen gekauft; Seelen entstehen durch Zerlegen ungewollter Zuchten.
- Das Moral-System erzwingt taktische Monster-Rotation.
- Aktive Spells gibt es nur durch Klasse und Ausrüstung sowie ausschließlich als Unique Items.
- Blaue und epische Items können passive Procs mit sichtbarem Feedback auslösen.
- Der Etagen-Boss besitzt maximal fünf Monstersteine; besiegt der Angreifer den Boss, erhält er 50 % der für den Stein benötigten Essenzen.
- Zum Launch gibt es keine Monetarisierung. Spätere Premium-Währungen dürfen nur Deko, Skins oder RNG-Rerolls kaufen; Paywalls, garantierte Erfolgsrolls, Roll-Caps, künstliche Progress-Gates und Pay-to-Win sind ausgeschlossen.
- Der Client darf lokal optional simulieren oder eine Vorschau liefern. Fortschritt wird nur nach exakt übereinstimmendem serverseitigem Input-Replay geschrieben; Formel-Geheimhaltung und Client-Hashes sind kein Anti-Cheat.
- Seeds und Präfixe dürfen Abenteurer, Ausrüstung, Monsterstats und Events kompakt transportieren; das handgebaute Dungeon bleibt ein serialisiertes Grid-Array.

### ODT-KONFLIKTE UND ABGRENZUNG

- Die Formulierung „Dungeon hat 64×64 Tiles“ ist **SUPERSEDIERT** durch 64×64 Logikzellen und 16×16 sichtbare Tiles.
- „Zufälliger CPU-Dungeon“ wird durch den deterministischen Ghost mit MMR- und Tages-Seed ersetzt.
- Die ODT-Formulierung „nach einem Raid lokal für den Angreifer gesperrt“ steht neben dem aktuellen globalen Vier-Stunden-Shield. Die lokale Sperre ist nicht eigenständig bestätigt.
- Der ODT-Schutz bei Moral null wird durch die aktionsbasierte kanonische Regel ersetzt; der Vier-Stunden-Shield bleibt davon getrennt.
- Das ODT-Verbot „bauen ODER raiden/geraidet werden“ wird nicht als globaler Session-Lock verwendet: Der Angreifer wird in seiner aktiven Session gesperrt, während der angegriffene Verteidiger weiterbauen darf.
- Die ODT-Formulierung „der Client berechnet alle Simulationen“ gilt als lokale Vorschau/Playback-Semantik; autoritativ bleibt ausschließlich das serverseitige Replay.

## 8. Abnahmegrenze

- Die allgemeine Sync-/Snapshot-/Matching-/Backend-/Wett-/XP-/Pathfinding-Semantik gehört ausschließlich in diese Datei.
- `docs/CONCEPT_REVIEW_SECURITY.md` besitzt nur die Sicherheits- und Prüfmarkensemantik.
- `BESTÄTIGT` ist nicht gleich implementiert; die reine `sim-core`-Grid-/Pathfinding-Schnittstelle und die D1-Snapshot-/Job-Persistenz sind implementiert. HTTP, Queue, Matching, Replay und Client-/Server-End-to-End-Flows bestehen weiterhin nicht.
- `SUPERSEDIERT` bleibt nur zur Nachvollziehbarkeit sichtbar und ist keine aktuelle Regel.
- Alle nicht ausdrücklich als `BESTÄTIGT` bezeichneten Details bleiben offen.
