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
| Runde Schadensbilanz | `summary.ts:56` summiert `damage` **global**, nicht pro Einheit | ⚠️ muss pro Urheber |
| Boss-Raum als Zone | `grid/zones.ts:4` kennt `'boss-chamber'`, vergibt in `:73/75` | ✅ erkannt, **niemand liest es** |
| Boss als Platzhalter | `combat/rules.ts:196` `units.push(bossSpec(lastIndex))` | ✅ eine Einheit in derselben Liste |
| Generation am Slot | `contracts/src/raid-snapshot.ts:29` `generation` (min 1, optional) | ✅ vorhanden |
| EP, Level, Statuspunkte, Steine | Durchlauf über `packages/*/src` | ❌ **existieren nicht** |

**Der wichtigste Befund:** Das `attack`-Event trägt **bereits** `actorId` und
`amount`. Eine Schadensbilanz pro Urheber braucht **keine** Änderung an der
Simulation — sie ist eine Aggregation über den Log, wie `summarizeCombat` sie
heute schon für die Gesamtzahl macht.

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

## 4. Offene Entscheidungen, die ich nicht treffen kann

### 4.1 Was kostet das Opfern, und was kommt zurück?

Du hast „Aussteigen bezahlt man durch Opfern gelevelter Monster" gesagt. Offen
bleibt, **womit** und **wofür**:

- Wird ein Material pro Opfer gutgeschrieben, und das Material ist die Währung
  für den Weg durch die Bosskammer?
- Oder ist das Opfer selbst der Weg — es verändert den Kampf?

Beides ist baubar, aber es sind zwei verschiedene Mechaniken. Ich rate nicht.

### 4.2 Was zählt als „gelevelt"?

`monsterSlotSchema` trägt `monsterId` und `generation` (min 1). **Level fehlt im
Slot** — es existiert im Repo noch gar nicht (Slice C). Ohne Level im
eingefrorenen Stand kann der Core **nicht prüfen**, ob ein Opfer wirklich ein
geleveltes Monster war; das wäre eine Zahl, die der Client behauptet und der
Server nicht nachrechnen kann. Determinismus verlangt hier eine **Identität**,
nicht ein Gold.

Mein Vorschlag, als `[K]`: `generation ≥ 2` — nachweislich gezüchtet, nicht nur
erzeugt. Sonst opfert man Wegwerf, und die Mechanik ist wertlos.

### 4.3 Der eine Statuspunkt

Siehe Slice D: Was er bewirkt, ist offen.

### 4.4 Die Stärke-Schwellen (aus dem T2.3-Block)

`BUDGET_THRESHOLDS = [12000, 14000, 15000, 16500, 18500]` in
`genome/strength.ts:39`, `[K]`. Sie liegen in den Lücken der gemessenen
Verteilung. Bestätigen und auf `[N]` setzen, oder neu messen?

## 5. Reihenfolge und Abhängigkeiten

```
A  Schadensbilanz pro Urheber     ─┐
B  Erfahrung + Material          ─┴─→ braucht A

C  Level-Kurven + HP-Skalierung   ────→ braucht B (EP speisen das Level)

D  Statuspunkte                   ────→ eigener Contract-Sprung, offen (4.3)

E  Bosskampf getrennt             ────→ eigener Contract-Sprung, unabhängig
                                    von A–D, aber derselbe Sprung wie T2.4
```

**A ist der einzige Slice ohne offene Frage.** Er kann sofort gebaut werden und
trägt alle anderen. B und C folgen paarweise. D und E brauchen jeweils einen
eigenen Contract-Sprung und gehören in dieselbe Entscheidung.

**Nicht in diesem Block:** Monster-Steine. Sie sind `[N]` als späteres Ziel
beschrieben, und der MVP soll beim Platzhalter-Boss bleiben. Der Tauschweg aus
Slice B/4.1 ist derselbe, in dem sie später fließen — die Naht ist damit bereit,
ohne dass etwas gebaut wird.

## 6. Ein Widerspruch, der vor Slice E zu klären ist

`docs/LORE.md:39` beschreibt den Boss als Wesen **ohne** Genetik: *„Ein Boss
entsteht so nicht. Er entsteht gar nicht. Er steht einfach da, seit jemand ihn
hingestellt hat, und er ist so alt wie die Etage, auf der er steht."*

Das steht gegen zwei `[N]`-Entscheidungen aus diesem Plan:

- **Individuelle Bosse** — mehr als eine Identität mit Namen, Werten und Bild.
  Ein Wesen, das „gar nicht entsteht", hat keine.
- **Monster-Steine zum Verstärken** — das setzt einen Tausch mit dem Wesen
  voraus. Ein Wesen ohne Erbgut ist kein Zuchtprodukt.

Die Frage ist nicht, welche Aussage schöner klingt, sondern welche das Spiel trägt.
Drei Lesarten, jede mit einer echten Folge:

| Lesart | Folge für Slice E | Folge für die Steine |
|---|---|---|
| **Der Boss ist ein Wesen wie jedes andere** | Zuchtsystem gilt auch für ihn; `genome/` bekommt Boss-Arten | Steine sind Zuchtmaterial, Passt zur Mechanik |
| **Der Boss ist ein einzigartiges Wesen** | Eine Identität, kein Genom; Zucht betrifft nur die Wächter | Steine sind eine Opfer-Währung **für** ihn, nicht **von** ihm |
| **Der Boss ist ein Platzhalter-Narrativ** | `BOSS_RULES` bleibt eine Konstante, Slice E nur Mechanik | Steine bleiben `[O]`, bis das geklärt ist |

**Empfehlung: die mittlere Lesart.** Sie braucht kein Zuchtsystem für Bosse,
passt zu „`boss` ist ein Platzhalter" und lässt die Steine als Währung zu. Sie
ist mit dem geringsten Aufwand zu belegen, weil sie den bestehenden
`BOSS_RULES`-Sonderfall nur um eine Identität ergänzt.

`docs/LORE.md` wird **nicht** geändert, bis das entschieden ist: Die Datei
beschreibt den heutigen Stand, und der heutige Stand ist ein Platzhalter. Sie
wird erst mit dem Bau von Slice E angefasst, und dann im selben Commit.
