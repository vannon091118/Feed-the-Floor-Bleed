---
name: fuenf-perspektiven-audit
description: "Verbindet die vier schreibgeschützten Custom-Agenten (LEX, Kritischer Adversarial Reviewer, Contexti, Mia) und die Grafik-Agentin Camilla zu einem festen 5-Perspektiven-Audit über Repository-Tree, Diff oder Pull Request. USE FOR: fuenf-perspektiven-audit, 5-Perspektiven-Audit, vier-perspektiven-audit, 4-Perspektiven-Audit, komplettes Audit, Gesamt-Review, LEX+Reviewer+Contexti+Mia+Camilla zusammen, vor Merge / vor Release / bei strittigen Entscheidungen prüfen, ganzheitliche Prüfung. DO NOT USE FOR: isolierte Einzel-Reviews (dafür den jeweiligen Agenten direkt), implementierende Aufgaben, Commits oder Pushes."
---

# Fünf-Perspektiven-Audit

Führt fünf Profile zu einem festen, reproduzierbaren Gesamturteil über einen Scope (Repository-Tree, Git-Diff oder Pull Request) zusammen. Die Reihenfolge ist fix: Kontext → Governance → Deletion → Beleg-Prüfung → Grafik → Spieler. Jede Perspektive liefert nur ihren Teil; der abschließende Bericht setzt alle fünf übereinander — er erfindet keinen sechsten Befund.

## Eingaben

- **Scope**: Ohne Angabe = aktueller vollständiger Repository-Tree. Alternativ: ein Git-Diff (staged und ungestaged getrennt) oder ein Pull Request. Eine explizite Basisangabe (Commit, Ref, PR-Nummer) wird unverändert verwendet; es wird keine Basis erfunden.
- **Soll-Scope** (optional): Ein ausdrücklich genannter Plan, Task oder Ziel. Fehlt er, bleiben Scope-Drift-Befunde bei allen Agenten als „nicht verifizierbar" markiert.

## Ausführung — feste Reihenfolge

1. **Contexti** (Kontext) — sammelt neutrale Fakten: Hotspots, neue Areas, LOC gegen Caps, Ressourcen, Architekturentwicklung. Keine Bewertung, keine Empfehlung. Liefert das Fundament, auf dem die anderen urteilen, ohne selbst zu urteilen.
2. **LEX** (Governance & Deletion) — prüft den Scope gegen Repo-Regeln, Ownership-Grenzen, Contracts und LLM-Slop-Muster; jeder Code-Befund trägt eine Deletion-First-Einstufung ([ENTFERNBAR] / [ERSETZBAR] / [VEREINFACHBAR] / [RESSOURCENSPARBAR] / [KEINE OPTION]).
3. **Kritischer Adversarial Reviewer** (Beleg-Prüfung) — verifiziert die LEX-Befunde und sucht zusätzlich eigene, unabhängige Governance- und Contract-Verstöße. Trennt strikt Beobachtung, Beleg und Auswirkung; unterdrückt Spekulation.
4. **Camilla** (Grafik & Sichtbarkeit) — prüft das, was der Spieler sieht: liest die Oberfläche in die Richtung des Datenflusses, sucht Schreibversuche in Zustände aus `render/`, `visual/`, `ui/` und `showcase/`, verletzte Naht-Signaturen (zweite Wahrheit statt Ableitung, Kopie statt Lesezugriff, vorberechnete Regel statt Kommando), Spieler-technische Klartextverletzungen (IDs, Ticks, Hashes, `undefined`) und sichtbare Regressionsfolgen (Text im Ticker, unterbrochene Batch-Reihenfolge, Filter pro Sprite, zerstörte Objekte im Rebuild). Sie urteilt im Audit **schreibgeschützt** und nennt kein Repo-Urteil über Spielerwirkung — das gehört Mia.
5. **Mia** (Spieler & Vision) — prüft den Scope auf den Ebenen Vision → Produkt → Spieler → Ausdruck: Reibung, Leere, Rauschen, Brüche, fehlende Rückkopplung, unsichtbare Qualität, Vision Drift. Jede Beobachtung wird gegen die bestehende Doku (`Agents.md`, `docs/VISUAL_GRUNDSATZ.md`, `docs/FUNKTIONSGRAPH.md`, `docs/GOLDFORMEL.md`) abgeglichen.

Wichtig: Die Agenten laufen **sequenziell, nicht parallel** — jeder nachfolgende Agent sieht die Ausgabe des vorherigen. Contexti liefert Fakten, die LEX, Reviewer, Camilla und Mia als Belegbasis nutzen dürfen, aber nicht müssen. Camilla sieht zusätzlich, was die drei vorherigen als belegt ausgewiesen haben, und bestätigt oder widerspricht mit eigenem Befund.

Camilla ist als einziges Profil schreibfähig. **Im Audit ist sie trotzdem schreibgeschützt**: Sie liefert Befunde mit Fundstelle, keine Patches. Wird sie zum Implementieren gerufen, ist das ein eigener Task außerhalb dieses Verfahrens.

## Abschlussbericht (Fix-Format)

```
=== 5-PERSPEKTIVEN-AUDIT ===
Scope: [Tree | Diff (staged/ungestaged) | PR #]
Basis: [explizit genannt | aktueller HEAD]
Soll-Scope: [angegeben | fehlt — Scope-Drift nicht verifizierbar]

--- 1. KONTEXT (Contexti) ---
[neutrale Fakten: Hotspots, LOC, Ressourcen, Architektur]

--- 2. GOVERNANCE & DELETION (LEX) ---
[Befunde nach Schwere; jeder mit Deletion-First-Tag]

--- 3. BELEG-PRÜFUNG (Adversarial Reviewer) ---
[unabhängig verifizierte Befunde + Bestätigung/Widerlegung von LEX-Befunden]

--- 4. GRAFIK & SICHTBARKEIT (Camilla) ---
[Naht-Verstöße, Klartextverletzungen, sichtbare Regressionsfolgen; jede Beobachtung mit Fundstelle und Vorschlag]

--- 5. SPIELER & VISION (Mia) ---
[Beobachtung → Problem → Wirkung → konkrete Änderung, mit Bezug zur Doku]

=== KREUZLAGE ===
- [Perspektiven, die sich decken: z.B. LEX + Reviewer belegen denselben Contract-Bruch]
- [Perspektiven, die kollidieren: z.B. Camilla sagt „Filter pro Sprite", LEX sagt „entfernbar" — beides ausweisen, nicht auflösen]
- [Sichere Lücken: welche Perspektive hat im Scope nichts belegt gefunden]

=== FOLGE ===
[Nur Fakten, keine Priorisierung: was der nächste Schritt ist, wenn der User entscheidet. Keine Empfehlung, kein „sollte".]
```

## Regeln

- Kollisionen zwischen den Perspektiven **nicht** auflösen oder gewichten — ausweisen. Das Gesamturteil fällt der User, nicht der Skill.
- Ein fehlender Agent (nicht ausführbar, Scope blockiert) wird namentlich benannt, statt seine Perspektive still zu lassen oder zu ersetzen.
- Keine Commits, Pushes, Dateiänderungen — das Audit ist vollständig schreibgeschützt, auch für Camilla.
- Sprache: Deutsch, direkt, ohne Füllsätze.
