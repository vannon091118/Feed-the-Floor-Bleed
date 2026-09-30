# Plan T2.3 — Erfahrung, Level-Kurven und die Bosskammer

> Arbeitsstand vom 2026-09-30. **Kein Bestand, sondern ein Plan.** Alles hier ist
> Vorschlag, bis es in `docs/CONCEPT_REVIEW.md` als `[N]` abgenickt ist.
> `[N]` = Nutzerfestlegung, `[K]` = Vorschlag, unbestätigt, `[O]` = offen.
> Belegt ist jede Zeile mit Dateipfad oder Messwert; unbelegte Zahlen stehen als
> `[K]` **an der Quelle, wo sie später gepflegt werden**, nicht in einer Sammelnote.

## 1. Die Entscheidungen, die getroffen sind

Aus dem Chat vom 2026-09-30, hier festgehalten, weil sie nirgends im Repo standen:

- **Erfahrung** bekommen Monster **und** Helden, beide aus dem Kampf. Monster
  erfahrten nach dem **verursachten Schaden**, Helden genauso — und zwar auch dann,
  wenn sie dabei sterben. `[N]`
- **Level werden nicht gecappt.** Die Level-Kurve beginnt flach und nimmt
  kallierend exponentiell zu. `[N]`
- **Statuspunkte** gibt es immer genau einen; den verteilt der Spieler. `[N]`
- **Die HP-Kurve** skaliert automatisch mit dem Level. `[N]`
- **4 Erfahrungspunkte ergeben 1 Extraktionsmaterial.** `[N]`
- Der **Boss** wartet am Ende der Etage und wird **getrennt von den normalen
  Monstern** behandelt. `[N]`
- `"boss"` ist ein **Platzhalter** und wird durch eigene, individuelle Bosse
  ersetzt. `[N]`
- Aussteigen bezahlt man durch **Opfern gelevelter normaler Monster**. `[K]` —
> die Lesart ist aus einer Folgefrage nicht abschließend geklärt (siehe 4.3).
- **Monster-Steine** verstärken den Boss später; man bekommt sie, wenn man
  gelevelte normale Monster opfert. **MVP: nur der Platzhalter-Boss.** `[N]`

## 2. Was der Code heute hergibt — gemessen, nicht behauptet

| Baustein | Beleg | Zustand |
|---|---|---|
| Schaden pro Urheber | `sim-core/src/combat/actions.ts:109` schreibt `eventBase(actor, target, tick)` mit `amount` | ✅ **berechenbar** |
| Sterbende werden identifiziert | `actions.ts:113` schreibt `type: 'death'` mit `targetId` | ✅ vorhanden |
| **Bilanz je Einheit** | `summary.ts` führt `damageByHero` und `damageByMonster`, getrennt nach Seite, sortiert nach `unitId` | ✅ **gebaut** (Slice A) |
| Größenordnung des Schadens | 20 Seeds, 7 Einheiten, **Ø 63 540** je Einheit und Lauf, **keine Einheit ohne Schaden** | ✅ **gemessen** (Abschnitt 5) |
| Seite mit dem größeren Anteil | Helden 5 408 120 (60,8 %) gegen Monster 3 490 637 (39,2 %) | ✅ **gemessen** (Abschnitt 5) |
| Trail-Hash auf 32 Bit | `hash/fnv1a.ts:8` `>>> 0` war Formerlaubnis | ✅ **behoben**, `sim_version 0.0.10` |
| Boss-Raum als Zone | `grid/zones.ts:4` kennt `'boss-chamber'`, vergibt in `:73/75` | ✅ erkannt, **niemand liest es** |
| Boss als Platzhalter | `combat/rules.ts:196` `units.push(bossSpec(lastIndex))` | ✅ eine Einheit in derselben Liste |
| Generation am Slot | `contracts/src/raid-snapshot.ts:29` `generation` (min 1, optional) | ✅ vorhanden |
| Escrow-Schema | `raid-snapshot.ts:49` `escrowSchema` mit `gold` und `materials` | ✅ im Contract, **kein Leser** |
| **Level am Slot** | `monsterSlotSchema` trägt **kein** Level | ❌ **fehlt** (4.2) |
| EP, Statuspunkte, Steine | Durchlauf über `packages/*/src` | ❌ **existieren nicht** |
| Moral | Durchlauf über `packages/*/src` | ❌ **nicht gebaut** (4.5) |

**Der wichtigste Befund:** Das `attack`-Event trägt **bereits** `actorId` und
`amount`. Eine Schadensbilanz pro Urheber brauchte **keine** Änderung an der
Simulation — sie war eine Aggregation über den Log, wie `summarizeCombat` sie für
die Gesamtzahl schon machte. Das ist getan, mit sechs Fällen in
`sim-core/src/combat/summary-damage.test.ts` und ohne Hash-Sprung: der Golden Pin
steht unverändert.

## 3. Die Slices in Reihenfolge

### Slice A — Schadensbilanz pro Urheber (ohne Verhaltensänderung)

`summary.ts` rechnet heute eine Zahl für den ganzen Kampf. Für die EP brauchen wir
pro Einheit: Summe des `amount` aller `attack`-Events, getrennt nach `actorId`.

- **Kein Contract-Sprung**: `actorId` und `amount` stehen schon im Event.
- **Kein Hash-Sprung**: Es ist eine Aggregation über einen unveränderten Log.
- **Kein Bestandsvergleich**: Der Golden Pin bleibt stehen.
- Neue Felder in der Summary, getrennt nach `side`, damit der Client nicht
  selber zählt — dieselbe Regel wie bei `monstersAlive`.

**Warum zuerst:** Jeder weitere Slice braucht diese Zahl. Ohne sie ist die
Erfahrung nicht berechenbar, und die Level-Kurven hängen daran.

**Beleg, wenn fertig:** Ein Test mit einem Kampf, in dem zwei Einheiten
 unterschiedlichen Schaden verursachen, prüft, dass die Bilanz stimmt; ein
`replayCombat` auf demselben Log liefert dieselbe Bilanz.

### Slice B — Erfahrung und Extraktionsmaterial

```
epProEinheit(unit)      = verursachterSchaden / schadenJeEp   `[K]`
extraktionsmaterial     = floor(epGesamt / 4)
```

- **Sterbende zählen mit.** Das ist deine Festlegung und sie ist umsetzbar: der
  `death`-Event nennt den Urheber im selben Log, in dem auch der Schaden steht.
  Wer stirbt, hat seinen Anteil bereits verursacht.
- **Die 4** sind `[N]`. `schadenJeEp` ist `[K]` — eine Größenordnung, die niemand
  genannt hat. Sie steht in `sim-core/src/genome/balance.ts` **an der Quelle**,
  nicht in diesem Plan.
- Der Client bucht das Material bei `setPhase('tag', fallen)`, dem einzigen
  vorhandenen Rückkehrweg. Der Escrow (`contracts/src/raid-snapshot.ts:49`,
  `escrowSchema`, heute von niemandem gelesen) ist der natürliche Ort für den
  unterwegs gesammelten Anteil.

**Offen `[O]`:** Gehört das Extraktionsmaterial ins Dorf oder in den Rucksack?
Der Escrow trägt Gold **und** Material, aber die Bestandsquelle ist
`village/state.ts`. Das ist eine Bestandsentscheidung, keine Formelentscheidung.

### Slice C — Level-Kurven und HP-Skalierung

Die Kurve ist `[N]` in ihrer Form: **flach am Anfang, kallierend exponentiell**,
**ohne Cap**. Nicht `[N]` ist die Zahl.

- **Kein Cap** heißt: die Kurve ist eine Funktion, keine Tabelle. Eine Tabelle
  bräuchte irgendwann eine letzte Zeile — genau das Cap, das nicht sein soll.
- **Kallierend exponentiell** heißt: die Steigung selbst wächst, nicht der
  Aufwand linear. Ein Ansatz `f(level) = base · r^(level-1)` mit
  `r > 1` erfüllt das; `r` und `base` sind `[K]`.
- **HP skaliert automatisch mit.** Heute kommen die Werte aus
  `genome/stats.ts` über das Elementbudget. Level müsste **ein Faktor** auf diesem
  Weg sein, nicht ein zweiter Zahlenweg — sonst entstehen zwei Wahrheiten über
  die Gesundheit eines Wesens, und das hat das Repo schon einmal teuer
  gekostet.

**Wo die Zahlen stehen:** `sim-core/src/genome/strength.ts` trägt heute die
Stufe 0 bis 5 aus dem Elementbudget (`BUDGET_THRESHOLDS`, `[K]`, Zeile 39). Level
gehört **neben** diese Datei, nicht hinein: eine ist eine gemessene Eigenschaft
der Art, die andere ein Zustand des Individuums. Beide in einer Datei hieße, das
Level-`[K]` und das Stärke-`[K]` gemeinsam zu pflegen, und sie sind unabhängig.

**Beleg, wenn fertig:** Ein Test pinnt drei Levelpunkte (flach, Mitte, Ende) und
prüft, dass die Steigung zwischen ihnen wächst. Ein zweiter prüft, dass HP und
Level dieselbe Quelle lesen — keine eigene Formel in `stats.ts`.

### Slice D — Statuspunkte

`[N]`: Es gibt **immer genau einen**, und **der Spieler verteilt** ihn.

- Das ist eine Entscheidung über den Snapshot: `activeTeamMemberSchema`
  (`raid-snapshot.ts:32`) trägt heute `heroId`, `temporaryFatigue`,
  `temporaryInjury` — `.strict()`, also **kein Feld für einen Punkt**.
- Ein zusätzliches Feld ist ein **Contract-Sprung**.
- **Die Mechanik des einen Punktes ist nicht spezifiziert** `[O]`: Erhöht er
  dauerhaft eine Eigenschaft, gilt er nur für die Expedition, oder wird er
  beim Rückschritt verbraucht? Ohne diese Antwort ist Slice D nicht baubar.

### Slice E — Der Bosskampf als eigener Kampf

Das ist der Kern deiner Aussage „getrennt von normalen Monstern behandelt", und
es ist der teuerste Slice.

**Der Bruch, der aufgelöst wird:** `rules.ts:196` schiebt den Boss mit
`units.push(bossSpec(lastIndex))` in **dieselbe** Einheitenliste wie die
Platzmonster. Dieselbe Initiative, dieselbe Runde, dieselbe Tick-Schleife. Der
Boss ist heute ein Sonderfall in einer Menge — kein getrennter Kampf.

**Ziel:** zwei Kampfaufrufe.

```
Etagenraum  →  resolveCombat(...)  →  Log A   (ohne Boss)
Bosskammer  →  resolveCombat(...)  →  Log B   (nur Boss + Restteam)
```

Ergebnis B entscheidet, ob die Etage gilt.

**Was das kostet:**
- **Ein Contract-Sprung.** `RaidLogPayload` trägt heute **einen** Log. Zwei
  Aufträge sind zwei Logs.
- **Der Golden Pin wandert.** Ein Etagenraum ohne Boss endet anders als mit ihm.
  Das ist diesmal **notwendig** und nicht nebenbei — der Unterschied zu
  `9394880`, dessen Pins nebenbei gewandert sind.
- **Empfehlung:** den Sprung mit T2.4 (Fähigkeiten) zusammenlegen. Zwei
  parallele Sprünge auf dieselbe Version kollidieren; zwei Commits mit je einem
  Sprung sind teurer als einer.

**Das gute Zeichen:** `'boss-chamber'` existiert bereits als Zonentyp und wird
vergeben. Die Trennstelle im Raster ist da — es fehlt nur, dass der Kampf sie
benutzt.

## 4. Die Entscheidungen vom 2026-09-30

Diese vier Punkte sind entschieden. Sie wurden gegen den Code geprüft, nicht gegen
eine Vermutung. Wo eine Zahl fehlt, steht sie weiter als `[K]` an ihrer Quelle.

### 4.1 Der eine Statuspunkt: dauerhaft, am Wesen, nie am Helden

**Entschieden:** ein dauerhafter Punkt am `monsterSlot`, ganzzahlig, als
Attribut-Bonus, im eingefrorenen Stand und im Log sichtbar. Nicht temporär, nicht
verbraucht.

**Warum dauerhaft:** HP skaliert mit dem Level, die Stärke gehört der Art und kommt
aus dem Elementbudget (`CONCEPT_REVIEW.md` 0b). Zwei der drei Achsen sind besetzt,
bevor der Spieler wählt. Übrig bleibt genau eine Größe, die **nur dem Individuum
gehört** — und das ist der einzige Ort, an dem der Spieler entscheidet, *woraus*
ein Wesen wird. „Gilt nur für diese Expedition" wäre ein drittes temporäres Feld
neben `temporaryFatigue` und `temporaryInjury` am `activeTeamMemberSchema`:
dieselbe Funktion, zweite Wahrheit, und der Spieler verteilt vor jedem Lauf neu,
weil nichts bleibt.

**Warum am Wesen, nicht am Helden:** `activeTeam` trägt nur `heroId` und zwei
temporäre Zahlen. Es gibt **keinen Heldenbestand**, der einen Punkt über den Lauf
hinaus halten könnte — Helden sind Gäste (`LORE.md:63`). Der Ort, an dem der Punkt
dauerhaft und nachrechenbar existiert, ist der Slot.

**Offen bleiben die Zahl und die achse.** Angriff ist die Achse, die mit dem Level
mitwächst und den Bogen schließt (Level → Punkt → Schaden → EP → Level); Rüstung
skaliert gegen eine Trefferverteilung, Initiative ist Timing, das der Spieler nicht
liest. Das ist eine Begründung, **keine Freigabe** — Betrag und Kürzung sind `[K]`
an `sim-core/src/genome/balance.ts`.

### 4.2 „Gelevelt" heißt `level ≥ 2`, nicht `generation ≥ 2`

**Entschieden: nein zu `generation`.** Der Plan hatte `generation ≥ 2` vorgeschlagen;
das ist **umgedreht** und wird hiermit verworfen.

**Der Beleg, der das kippt:** `CONCEPT_REVIEW.md:132` führt als `[N]`: *„Zucht
kombiniert 2 Monster, verbraucht deren XP; das neue Monster startet auf Level
1."* Ein Gezüchteter ist damit per Festlegung genau die Sorte Wesen, das **nicht**
gelevelt ist. `generation ≥ 2` als Opferkriterium machte das billigste Wesen im
Bestand zum opferbarsten: frisch gezüchtet, Level 1, keine Kampfep. Die Ausnutzung
ist nicht „alle opfern dasselbe", sie ist „der Spieler opfert gezielt die
schwächsten".

**Das Level ist auch keine Zutat.** Erfahrung entsteht aus verursachtem Schaden, auch
im verlorenen Kampf — das Level ist damit ein Zustand, der sich **im Kampf**
bewegt. Der Snapshot muss den Startlevel tragen und das Ergebnis den Endlevel,
sonst ist das Level eine Zahl, die der Client behauptet.

**Folge für den Plan:** Slice C verliert seine Unabhängigkeit. Das Level kann nicht
rein lokal rechnen, es wird Teil des eingefrorenen Standes.

### 4.3 Das Extraktionsmaterial ist eine dritte Ressource

**Entschieden:** Escrow während der Expedition, eigene Dorf-Ressource bei Rückkehr.
Nicht ins Materialfeld des Dorfs, nicht in den Rucksack.

**Der stärkere Grund ist ein Festlegungskonflikt:** `CONCEPT_REVIEW.md` 0a setzt
als `[N]`: *„Ressourcen im Epic sind nur Gold und Materialien. Material stammt aus
ausgebauten Gebäuden/Werkstätten."* Extraktionsmaterial ins Materialfeld zu
schreiben hieße, eine zweite Quelle in eine `[N]`-Festlegung zu ziehen, und die
Werkstatt verlöre ihre Aussage — der Spieler könnte nicht mehr unterscheiden, ob
er arbeitet oder gräbt.

**Der Name ist der zweite Grund.** Die Festlegung heißt „**Extraktions**material",
nicht „Material". Man hätte „Material" schreiben können. Ein eigener Stoff mit
eigenem Namen ist eine eigene Sache.

**Der Ort ist der Escrow, weil er die einzige Contract-Stelle ist, die dem
Push-Your-Luck-Spiel entspricht.** `escrowSchema` (`raid-snapshot.ts:49`) trägt
`gold` und `materials` und hat heute keinen Leser. Das Feld `escrow.materials` ist
damit wörtlich „noch nicht gebuchtes Material aus der Tiefe" und kollidiert mit
nichts, weil niemand liest.

**Was die Regel aus einem Feld eine Mechanik macht:** die `[N]`-Festlegung aus 0a —
gesicherte Etagenbeute bleibt beim Angreifer, ungesicherte geht bei Niederlage
verloren. Genau das gibt dem Escrow seinen ersten Leser.

**Der Rucksack ist keine Option:** neun globale Slots plus Unique-Slot je Held sind
für Hero-Gegenstände. Ein zweiter Bestand mit eigener Zahl ohne Besitzer wäre eine
zweite Wahrheit über Material.

### 4.4 Lesart (b): der Boss ist ein einzigartiges Wesen, die Steine sind Währung **für** ihn

**Entschieden: (b).** Die Brücke, die das mit „er entsteht gar nicht" zusammenhält,
ist derselbe Satz aus `LORE.md`: *„so alt wie die Etage, auf der er steht"*. Die
Identität des Bosses hängt an der **Etage im eingefrorenen Verteidigerstand**, nicht
am Spieler. Er wird nicht gezüchtet und nicht erzeugt — er wird **gefunden**. Das
ist mit einem deterministischen Snapshot vereinbar und der einzige Weg, auf dem
„keine Genetik" und „individuelle Bosse" gleichzeitig wahr sind.

**Lesart (a) löscht den stärksten Satz der Weltbeschreibung** — Vision Drift, und
zwar die Sorte, die man später nicht mehr reparieren kann. **Lesart (c) ist kein
Ergebnis, sondern ein Aufschub:** „`boss` ist Platzhalter" beschreibt den
**heutigen Code** (`rules.ts:196`), nicht die Welt.

**Drei Folgen für Slice E, nicht zwei:**

1. Neben den zwei Logs braucht Slice E eine **Boss-Identität am eingefrorenen
   Stand** (Id, Name, Werte). Ohne sie bleibt der Boss ein Platzhalter mit
   Sonderregeln und (b) ist behauptet, nicht gebaut. Bewusst **nicht** in
   `genome/` — dort wäre er ein Wesen mit Erbgut, das keines hat.
2. Die Bosswerte dürfen **nicht** aus `BOSS_RULES` kommen, sonst ist jeder Boss
   derselbe und „individuell" ist ein Wort ohne Deckung.
3. Der getrennte Etagenraum ohne Boss lässt die gemessene Kurve aus 0b nicht mehr
   für den Etagenraum gelten. Der 88-%-Pin gehört dann dem **Bosskampf**, nicht mehr
   dem Run. Das gehört in denselben Commit, sonst behauptet die Doku etwas Falsches.

**Noch offen:** die Quelle der Boss-Identität — aus Etage plus eingefrorenem Stand
berechnet, oder vom Spieler beim Bauen gewählt. Das entscheidet die Boss-Domäne,
nicht Slice E.

### 4.5 Zwei weitere `[N]`-Festlegungen, die gegen den Plan stehen

Beim Nachprüfen von `CONCEPT_REVIEW.md` Abschnitt 3 sind zwei Widersprüche
aufgefallen. Beide brauchen eine Nutzerentscheidung.

**Das Level-Cap.** `CONCEPT_REVIEW.md:131` führt als `[N]`: *„Monster leveln bei
jedem Kampf, auch bei Niederlage; **das Level-Cap skaliert mit der Generation**."*
Die Festlegung vom 2026-09-30 sagt **kein Cap**. Das ist ein direkter Widerspruch
zwischen zwei `[N]`. **Offen.**

**Moral statt Tod.** `CONCEPT_REVIEW.md:127` führt als `[N]`: *„Besiegte
Dungeon-Monster sterben nicht permanent; sie verlieren Moral und werden inaktiv."*
Die Festlegung vom 2026-09-30 zählt Erfahrung „auch wenn sie sterben". Beides ist
vereinbar — ein Wesen mit aufgebrauchter Moral ist tot, bis es reaktiviert wird, und
seine Erfahrung ist verbucht. **Aber:** Moral ist im Code **nicht gebaut** (ein
Durchlauf über `packages/*/src` findet keinen Treffer). Die EP-Regel für die Toten
ist damit heute vollständig, die Wiederbelebung ist es nicht. Kein Widerspruch im
Plan, sondern eine Lücke im Bestand, und sie gehört zu einem anderen Block.

### 4.6 Die Stärke-Schwellen (aus dem T2.3-Block, weiter offen)

`BUDGET_THRESHOLDS = [12000, 14000, 15000, 16500, 18500]` in
`genome/strength.ts:39`, `[K]`. Sie liegen in den Lücken der gemessenen
Verteilung. Bestätigen und auf `[N]` setzen, oder neu messen?

## 5. Die erarbeiteten Größen — und ein Rechenfehler, den die Prüfung fand

Slice B braucht zwei Zahlen: **wieviel Erfahrung ein Schaden wert** und **wieviel
Extraktionsmaterial 4 EP ergeben**. Die zweite ist `[N]` festgegeben.

**Die erste Fassung dieser Zahlen war falsch, und zwar derselbe Fehlertyp, vor dem
`Agents.md` warnt.** Der erste Entwurf teilte die Summe des Schadens **über 20
Seeds** durch die Einheitenzahl **eines** Seeds. Das ergibt eine Zahl um das
Zwanzigfache zu groß. Wer einer Menge einen Wert aus einer anderen Menge
zurechnet, erhält eine Zahl, die größer aussieht als das Spiel.

### Die Messung

20 Seeds, 3 Helden gegen 3 echte Basisarten auf dem Standardraster, Summe des
verursachten Schadens je Einheit und Lauf:

| Größe | Wert |
|---|---|
| Einheiten je Lauf | 7 |
| Läufe | 20 |
| **Summe über alle Läufe** | **8 895 604** |
| **Ø je Einheit und Lauf** | **63 540** |
| Einheiten mit null Schaden | **0** |

Die Division lautet `8 895 604 / (7 × 20)`. Die erste Fassung hatte den Nenner `7`.

**Keine Einheit blieb ohne Schaden.** Das stützt die Entscheidung aus 4.1, jede
Einheit in die Bilanz aufzunehmen — die Null-Fälle gibt es im Bestand, aber sie
sind nicht der Normalfall.

### Was daran neu ist: Helden sind nicht die kleinere Seite

Die erste Fassung behauptete, ein Held verursache „in derselben Summe den kleineren
Teil". Getrennt gemessen:

| Seite | Summe über 20 Seeds | Anteil | Ø je Einheit und Lauf |
|---|---|---|---|
| Helden | 5 408 120 | 60,8 % | 90 135 |
| Monster | 3 490 637 | 39,2 % | 43 633 |

**Ein Held verursacht pro Einheit rund das Doppelte eines Monsters.** Die
Begründung für einen gemeinsamen Divisor trug damit nicht in der Form, in der sie
geschrieben war.

**Nebenbefund mit eigener Sprengkraft:** Die drei Helden sind identisch
(`class: 'none'`, `combat/rules.ts:46-68`), ihre Schadenssumme streut aber dennoch
um den Faktor 4,6 — hero-2 Ø 148 907 gegen hero-0 Ø 32 554. Drei gleich
aussehende Wesen im Parteibild, von denen eines den Lauf trägt. Das ist kein
Balanceproblem, das ist fehlende Rückkopplung, und es gehört vor die Balance.

### Der Divisor

| Divisor | EP je Einheit und Lauf |
|---|---|
| 100 | 635 |
| **125** | **508** |
| 250 | 254 |

**`[K]`, nicht `[N]`.** Der Vorschlag 125 stammt aus der Absicht, dass ein Wesen
nach einem Kampf im niedrigen dreistelligen Bereich Erfahrung sammelt; die
exponentielle Kurve aus Slice C soll danach noch etwas zu leisten haben, statt vom
Startpunkt überholt zu werden. **Ob 125 die richtige Größenordnung ist, ist damit
nicht entschieden** — die Kurvenform aus Slice C bestimmt sie, und die ist nicht
gebaut. Die Zahl gehört an ihre Quelle, `sim-core/src/genome/balance.ts`, **mit
diesem Messprotokoll im Kommentar**.

## 5a. Der Blocker, den die zweite Messung fand — und was die Behebung offen lässt

**Das ist kein Zahlenthema, das ist eine Löfflichkeit im Replay.**

`packages/sim-core/src/hash/fnv1a.ts:8` schneidet mit `>>> 0` auf 32 Bit. Alles
oberhalb 2³² fällt auf denselben Wert zurück, und `combat/fingerprint.ts:17-25`
hasht damit Zahlen aus dem Kampf. Ein `maxHp` von 60 000 und eines von
4 295 027 296 erzeugen **denselben** Trail-Hash — zwei verschiedene Kämpfe, ein
Hash. Der Server akzeptiert einen gefälschten Log, weil der Hash stimmt.

**BEHOBEN am 2026-09-30.** `hashWord` in `packages/sim-core/src/hash/fnv1a.ts`
mischt jetzt über alle Bytes der Zahl und trägt das Vorzeichen als eigenes Byte;
der Vergleich in `packages/sim-core/src/combat/state.ts` teilt durch das jeweilige
`maxHp` statt zu kreuzen. `sim_version 0.0.9 → 0.0.10`, `CONTRACT_VERSION` bleibt 9,
weil kein Feld entsteht oder verschwindet. Der Beleg ist der Golden Pin: **nur die
Hash-Werte wanderten** von `261cd39a` auf `092932b7` und von `ee21afc5` auf
`a49899d7`, während 196 Ticks, 396 Ereignisse, 127 Trail-Einträge und beide
Ausgänge zeichengleich blieben.

**Was die Behebung offen lässt, gehört daneben:** Der Hashzustand bleibt 32 Bit und
das Wire-Format bei acht Hex-Stellen. Ein Geburtstagsangriff auf den Fingerprint
bleibt damit möglich; beseitigt ist die rechnerische Vorschrift, nicht die Wahl der
Länge. Ob daraus später 16 Hex-Stellen werden, ist eine eigene Entscheidung mit
eigenem Contract-Sprung.

Die vier Tests in `packages/sim-core/src/hash/hash-kappung.test.ts` verbieten die
Kollision jetzt. Der erste davon war vor der Behebung **grün**, weil er die
Kollision erwartete — ein Beleg, der den Fehler festgeschrieben hätte.

**Wie weit war der Weg bis zur Kollision?** `packages/sim-core/src/combat/state.ts`
verglich das Kreuzprodukt `candidate.hp * best.maxHp`. Das bricht bei
`maxHp ≈ 3 001 199` ganzen HP — Faktor 73 über einem heutigen Monster. Mit einem
exponentiellen Faktor r = 1,2 ist Faktor 73 bei **Level 25** erreicht, bei r = 1,15
bei 32. Auch diese Stelle ist mitbehoben.

**Was das für die Level-Festlegung heißt — und was jetzt noch offen ist.** „Kein
Cap" ist inhaltlich haltbar, ein Cap nimmt dem Wächter genau das, was ihn zum
Wächter macht. Zu bauen ist aber **keine Obergrenze auf das Level, sondern eine
Grenze darauf, was ein Level einer Zahl antun darf**, und die existiert im
Datenmodell nicht.

Die Behebung von heute nimmt Druck aus dieser Frage, aber sie beantwortet sie
nicht: Sie hat die rechnerische Vorschrift entfernt, die ein Level gefährlich
machte, nicht das Level selbst. Wie weit ein Level eine Zahl skalieren darf, ist
weiterhin `[N]` oder `[K]` offen und gehört an den Feldern entschieden, die
`specHash` liest — nicht am Level-Feld. **Das Level darf dieselben Felder nicht
skalieren, die in den Hash gehen.**


## 6. Reihenfolge und Abhängigkeiten

```
A  Schadensbilanz pro Urheber     ─┐   ✅ gebaut (1a2caf2)
B  Erfahrung + Material          ─┴─→ braucht A, Zahl aus Abschnitt 5

A0 Trail-Hash ohne 32-Bit-Schnitt  ────→ ✅ BEHOBEN, sim_version 0.0.10;
                                    nur die Hash-Werte wandern
C  Level-Kurven + HP-Skalierung   ────→ braucht jetzt nur noch B; Level

C  Level-Kurven + HP-Skalierung   ────→ braucht jetzt nur noch B; Level
                                    eingefrorenen Stand (4.2)

D  Statuspunkte                   ────→ eigener Contract-Sprung, offen (4.1)
                                    und 4.5 (Level-Cap)

E  Bosskampf getrennt             ────→ eigener Contract-Sprung, unabhängig
                                    von A–D, aber derselbe Sprung wie T2.4
```

**A ist gebaut.** B ist der nächste und braucht nur die Freigabe der Zahl aus
Abschnitt 5 — kein weiterer Konflikt.

**A0 ist behoben.** Der 32-Bit-Schnitt ist weg und das Kreuzprodukt in
`combat/state.ts` auch; `sim_version` 0.0.9→0.0.10. C hängt damit nur
noch an B und an der Cap-Frage aus 4.5.

D und E brauchen jeweils einen Contract-Sprung, und **C, D und die Level-Identität
aus 4.2 teilen sich denselben**: ein Level am `monsterSlot` plus ein Statuspunkt am
selben Ort. Das ist ein Sprung, nicht drei.


**Nicht in diesem Block:** Monster-Steine. Sie sind `[N]` als späteres Ziel
beschrieben, und der MVP soll beim Platzhalter-Boss bleiben. Der Tauschweg aus
Slice B ist derselbe, in dem sie später fließen — die Naht ist damit bereit, ohne
dass etwas gebaut wird.

## 7. Was mit `docs/LORE.md` geschieht

`docs/LORE.md:39` beschreibt den Boss als Wesen **ohne** Genetik: *„Ein Boss
entsteht so nicht. Er entsteht gar nicht. Er steht einfach da, seit jemand ihn
hingestellt hat."* Das stand gegen „individuelle Bosse" und „Steine aus Zucht" —
die Frage ist in **4.4** zugunsten der mittleren Lesart entschieden: der Boss
wird an der Etage **gefunden**, nicht gezüchtet.

**Die Datei wird nicht geändert.** Sie beschreibt den heutigen Stand, und der
heutige Stand ist ein Platzhalter. Sie wird erst mit dem Bau von Slice E
angefasst, und dann im selben Commit, in dem die Boss-Identität entsteht — sonst
würde die LORE eine Identität beschreiben, die es noch nicht gibt.
