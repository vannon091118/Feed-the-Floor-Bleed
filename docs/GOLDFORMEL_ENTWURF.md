# docs/GOLDFORMEL_ENTWURF.md — Die Goldformel der Run-Beute als Freigabeentwurf

**Status: offener `[K]`-Entwurf, nichts hiervon ist freigegeben oder beschlossen.** Der Entwurf rechnet eine Entscheidungsfrage zu Ende, damit sie mit einer Aussage beantwortbar ist; bis zur Freigabe bleibt die Goldseite der Run-Beute ohne Code, wie `docs/VISUAL_GRUNDSATZ.md` es für `[K]`-Werte verlangt.

## Die Frage, die T2.3 offen hält

„Escrow für ungesicherte Beute" braucht einen Betrag, und der Betrag braucht eine Formel. Festgelegt ist bisher nur die Quelle: Gold stammt aus besiegten Raid-Gegnern, abhängig von Stärke und Generation (`docs/CONCEPT_REVIEW.md`, Abschnitt 0a), bei jeder Rückkehr wird genau einmal abgerechnet, und eine Niederlage verliert nur die ungesicherte Beute. Nicht festgelegt ist die Abbildung von Gegner auf Gold.

## Variante A — pauschal je Gegner, ohne neue Daten

`goldJeGegner = G₁` mit `G₁ = 40` `[K]`, multipliziert mit der Zahl der gefallenen Gegner.

Die Zahl der Gefallenen ist seit Contract v4 ohne den Kampflog berechenbar (`CombatSummary.defendersTotal` minus `monstersAlive` minus dem lebenden Boss). Kein Contract-Sprung, sofort baubar.

| Fall | Gefallene | Gold |
|------|-----------|------|
| Nur der Boss fällt | 0 | 0 |
| Eine Etage mit fünf Monstern geräumt | 5 | 200 |
| Zwei Etagen mit je fünf Monstern geräumt | 10 | 400 |

Nachteil: Stärke und Generation spielen keine Rolle, obwohl die Regelquelle sie nennt. Der Boss zählt wie jeder andere Gegner.

## Variante B — je Gegner mit Stärke und Generation (Contract-Sprung nötig)

`goldJeGegner = G₁ · Stärke · (1 + 0,25 · (Generation − 1))` mit `G₁ = 40` `[K]`, summiert über die gefallenen Gegner, gerundet auf ganze Goldstücke (`floor`).

Beispielzahlen des Entwurfs, ausdrücklich zur Veranschaulichung und nicht als Festlegung:

| Stärke | Gen 1 | Gen 2 | Gen 3 | Gen 5 | Gen 9 |
|--------|-------|-------|-------|-------|-------|
| 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 40 | 50 | 60 | 80 | 120 |
| 2 | 80 | 100 | 120 | 160 | 240 |
| 3 | 120 | 150 | 180 | 240 | 360 |
| 5 | 200 | 250 | 300 | 400 | 600 |

Ein geräumter Run aus fünf Gegnern Stärke 1, Gen 1 plus einem Boss Stärke 2, Gen 2 liefert nach dieser Rechnung `5 · 40 + 100 = 300` Gold.

Grenzfälle, die der Entwurf benennt:

- Stärke 0 trägt 0 bei; ein gefallener Gegner ohne Stärkenangabe ebenso.
- Generation 0 oder negativ ist kein gültiger Gegner; die Formel weist ab. Dieselbe Ganzzahlgrenze fängt negative oder gebrochene Stärke.
- Gebrochene Stärke oder Generation ergibt keinen Gegnerwert; gerechnet wird `floor` auf ganze Goldstücke, damit es keine Goldbruchteile gibt.
- Ein leeres Ergebnis (keine Gegner gefallen) liefert 0 Gold, auch bei Sieg über den Boss allein.

Nachteil: `monsterSlot` trägt heute nur `monsterId` — Stärke und Generation je Gegner führt kein Schema, der Contract müsste sie neu aufnehmen (Sprung v5 auf v6), und die Zahlengrundlage dafür ist nicht freigegeben.

## Empfehlung `[K]`, ohne Festlegung

Variante A als T2.3-Schnitt, Variante B als spätere Erweiterung, sobald die Stärke- und Generationsangabe je Gegner freigegeben ist. Begründung: Der Escrow-Mechanismus (sichern, riskieren, bei Niederlage verlieren) ist von der Formel unabhängig und mit Fixtures prüfbar; die Formel lässt sich später in einem einzigen Skalar tauschen, wenn die Daten im Contract stehen. Wer jetzt B nimmt, verpflichtet sich zu einem Contract-Sprung ohne freigegebene Zahlen dahinter.

## Rendite-Kontext für die Entscheidung

Der Startbestand sind 120 Gold; der Etage-Kauf kostet 1000 Gold für Etage 2 und 2250 für Etage 3 (freigegeben, `docs/VISUAL_GRUNDSATZ.md`). Mit 40 Gold je Gegner und fünf Plätzen je Etage liegt der Ertrag einer komplett geräumten Etage bei bis zu 200 Gold — der Etage-2-Kauf ist also etwa fünf geräumte Etagen entfernt, ohne Materialertrag aus dem Dorf. Das ist die Größenordnung, über die hier entschieden wird; nichts davon ist eine Zusicherung, bevor der Auftraggeber zahlt.

## Was bei Freigabe zu tun wäre

Die Formel wandert als reine Funktion in `village/economy.ts` (oder in eine neue Gold-Datei der Domäne), die Konstante nach `balance.ts` als eingefrorene Zahl, die Grenzfälle als Tests ihrer Invarianten — dieselbe Form wie die übrigen Preisfunktionen. Die Datenquelle (die Zahl der Gefallenen oder die neue Contract-Angabe) entscheidet sich mit der gewählten Variante.
