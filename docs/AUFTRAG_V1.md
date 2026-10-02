# Auftrag V1 — die Dorf-Befehle bekommen einen Aufrufer

> Stand: 2026-10-02. Grundlage sind `docs/ENTSCHEIDUNGEN.md`, `docs/ROADMAP.md` und die
> Gegenproben aus `git merge-base main fix/prng-und-nachbarschaft`.
> Dieser Auftrag löst V1 aus der Blocktabelle der ROADMAP. Er baut **nur** V1.

## Der Befund

`buildBuilding`, `upgradeBuilding` und `extendLand` sind in `packages/client/src/village/commands.ts`
vollständig implementiert, getestet und haben trotzdem **keinen Aufrufer** außerhalb der eigenen
Tests. Der Klickpfad `ui/stage.tsx` öffnet nur ein Fenster über `building:<index>` und rechnet
nichts; `packages/client/src/ui/scene-switch.ts` reicht den Dorfbestand als `villagePlots()` an die
Szene. Das Dorf sieht in Rauten aus und kann nicht bebaut werden.

Ein zweiter Befund gehört in denselben Auftrag: Der Kampf nimmt seine Verteidiger aus
`fixture.monsterSlots`, einer Konstante. Der Wunsch des Spielers, *welche* Monster er aufstellt,
existiert im Datenmodell (`Monster-Slot`, `slotBase`) und in der Anzeige, hat aber keinen Weg von
der Oberfläche in den Auftrag hinein.

## Zwei Linien, ein Versionszähler

`main` und der Zweig `fix/prng-und-nachbarschaft` sind nicht linear aufeinander gefolgt:

| Beleg | Ergebnis |
|---|---|
| `git merge-base main fix/prng-und-nachbarschaft` | `979abf9` |
| Commits auf `main` nach der Basis | 12 |
| Commits auf dem Zweig nach der Basis | 6 |
| `VERSION` auf `main` | 0.0.93 |
| `VERSION` auf dem Zweig | 0.0.94 |

**`main` ist die Wahrheit für `packages/sim-core` und `packages/contracts`.** Dort liegt Contract v9
(`CONTRACT_VERSION = 9` in `packages/contracts/src/version.ts`), dort liegt der Boss-Fix.

### Der Boss-Fix ist nicht verhandelbar

| Ort | `maxHp` | `attack` | `defense` |
|---|---|---|---|
| `origin/main` | 132 | 12 | 1 |
| Zweig `fix/prng-und-nachbarschaft` | 200 | 16 | 5 |

Die Werte 200/16/5 sind der Stand **vor** dem Fix; sie führten dazu, dass das Dreierteam in 0 von
32 Seeds gewann. `git diff 979abf9 fix/prng-und-nachbarschaft -- packages/sim-core/src/combat/boss.ts`
ist **leer** — der Zweig hat die Datei nie angefasst und „überschreibt" sie deshalb auch nicht. Er
trägt keinen neuen Bosswert, er trägt schlicht keinen. Wer aus dem Zweig nach `main` überträgt,
übernimmt die alten Werte nur, wenn er die Datei ausdrücklich mitnimmt.

**Verboten ist deshalb jede Änderung an `packages/sim-core/src/combat/boss.ts` in diesem Auftrag.**

Gegenprobe nach jedem Schritt: Der Referenzkampf aus `docs/CONCEPT_REVIEW.md` Abschnitt 0b muss im
Band 80 bis 95 Prozent liegen. Fällt er auf 0, ist der Boss-Fix zurückgenommen worden — nicht der Test
ist falsch. Auf `main` liegt zusätzlich ein Hash-Golden-Pin in
`packages/sim-core/src/combat/combat-pin.test.ts`; ändert sich der Hash, ohne dass eine Kampfregel
gedacht wurde, ist derselbe Fehler durch die Hintertür gekommen.

## Geparkt bis V1 fertig ist

Das Dorf-Rendering des Zweigs (`village/render/` mit Rauten, Pixel-Art und Fackelschein) ist
**geparkt**. Es ist gute Arbeit, aber sie verschiebt fünf Dateien von `render/` nach `village/render/`,
und `main` hat an genau diesen Pfaden weitergebaut. Ein Merge jetzt wäre eine Entscheidung über den
Umzug und keine über V1.

Ebenso geparkt: der `player-path`-Umzug des Zweigs. Er berührt `combat/resolve.ts`,
`combat/rules.ts` und `combat/types.ts`, die `main` mit `behavior` und `conditions` umgebaut hat.

Beides wird nach V1 als eigener Block aufgenommen, mit `main` als Basis.

## Was V1 baut

### Erlaubt

1. **UI-Aufrufer für die drei Dorf-Befehle.** Der Weg vom Klick zum Befehl wird geschlossen, ohne
   neue Befehle und ohne einen zweiten Sätze.
2. **Monster-Slot-Auswahl.** Der Spieler wählt, welche Art auf welchem Platz steht; `fixture.monsterSlots`
   verschwindet aus dem Spielerpfad und bleibt höchstens als Vorgabe für den ersten Lauf und für Tests.
3. **Lesen aus dem Store.** Das Team und der Dorfname kommen aus dem Store, nicht aus einer
   zweiten Kopie in der Szene.
4. Tests, die **rot sind, bevor sie grün sind**, und die gegen den echten Bestand prüfen.

### Verboten

- Jede Änderung an `packages/sim-core/` und `packages/contracts/`. Der Kampf wird in V1 nicht berührt.
- Rendering: kein Pixel-Art-Umbau, keine Rauten, kein Verschieben von Modulen.
- Eine neue Contract-Version. V9 bleibt V9.
- Refactoring ohne Auftrag, Umbenennungen, neue Doku-Typen, neue Agent-Profile.
- Ein zweites Baurecht: Wenn ein Befehl fehlt, wird der Aufrufer gesucht, nicht eine neue Schicht.
- Ein Zahlenwert, der nicht am Messwächter steht.

### Stoppregel

**Wenn etwas anderes gebraucht wird als in diesem Auftrag steht: anhalten und melden.**

Nicht umgehen, nicht nebenbei erweitern, nicht die Zahl anpassen, damit sie passt. Die Fälle, in
denen das ausdrücklich gilt:

- Ein Dorf-Befehl braucht eine Regel, die in `docs/ENTSCHEIDUNGEN.md` nicht steht.
- Der Slot-Pfad braucht eine Contract-Änderung, um sauber zu sein.
- Ein Test bleibt rot, obwohl der Aufbau stimmt.
- Ein Gate meldet etwas, das nicht aus diesem Auftrag stammt.
- Der Referenzkampf liegt nach einem Schritt außerhalb 80 bis 95 Prozent, ohne dass eine Kampfregel
  angefasst wurde.

Gemeldet wird, welcher Beleg die Stoppregel ausgelöst hat und welcher Entscheid der Auftraggeber
treffen muss. Nicht gemeldet wird ein Workaround.

## Reihenfolge

Ein Block zur Zeit, in dieser Reihenfolge. Jeder Schritt endet grün; ein roter Schritt wird nicht
übersprungen.

1. Roter Test für `buildBuilding` aus der Oberfläche.
2. Aufrufer für `buildBuilding`.
3. Roter Test für `upgradeBuilding`, dann der Aufrufer.
4. Roter Test für `extendLand`, dann der Aufrufer — inklusive der Land-Erweiterung im Dorfbild,
   weil der Boden dem Raster folgen muss.
5. Roter Test für die Slot-Auswahl, dann ihr Weg von der Oberfläche in den Auftrag.
6. `fixture.monsterSlots` aus dem Spielerpfad entfernen.
7. Abschlusslauf und Fünf-Zeilen-Report.

## Abschlussnachweis

Der Auftrag gilt als fertig, wenn alle Punkte zugleich gelten:

- `./node_modules/.bin/tsc --noEmit` meldet 0 Fehler.
- Die Testsuite läuft grün, mit den neuen Fällen drin.
- `npx biome check .` meldet 0 Fehler.
- LOC-Caps, Hygiene- und Reichweiten-Gate sind grün.
- `git diff 979abf9 -- packages/sim-core/src/combat/boss.ts` ist leer.
- Der Referenzkampf liegt zwischen 80 und 95 Prozent.
- `git status` zeigt keine Änderung unter `packages/sim-core/` und `packages/contracts/`.

## Was der Auftraggeber liefern muss

Zwei Dinge, mehr nicht: eine Umgebung mit Browser für die Abnahme T2.6, und für V7 die
Firebase-Projektwerte. Für V1 wird nichts gebraucht — V1 ist ohne beides fertig.