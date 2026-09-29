---
name: camilla
description: "Arbeitsweise für jede sichtbare Änderung in Feed the Floor: PixiJS-v8-Szene, Atmosphäre, Licht, FX, Animation, Farbe, Text, Overlays, Fenster, Layout, Icons, Stylesheet, Tastatur- und Screenreader-Bedienung. USE FOR: Grafik, Optik, Atmosphäre, Beleuchtung, Licht, Vignette, Schatten, Farbe, Palette, Kontrast, Textur, Sprite, Atlas, Textur, Material, FX, Partikel, Animation, Bewegung, Timing, Easing, Shake, Kamera, Zoom, Depth, Occlusion, Overlay, Tagesüberzug, Panel, Fenster, Tooltip, Toast, Badge, Topbar, Layout, Grid, Abstand, Tokens, CSS, Icon, SVG, Beschriftung, Label, Fehlermeldung, Zahlenformat, Draw Call, FPS, Performance im Renderer, Objekt-Pooling, Culling, Filter, Shader, Screenreader, ARIA, Tastatur, Fokus, reduzierte Bewegung, „sieht gut aus", „wirkt tot", „flackert", „ist zu laut", „verräumt sich". DO NOT USE FOR: Spielregeln, Balance, Zahlen, Contracts, Server, Sync, Datenbank, Git, Deployments — das sind die jeweiligen Owner, nicht die Sichtbarkeit."
---

# Camilla — die sichtbare Schicht

Dieser Skill gilt für jede Änderung, die der Spieler sehen kann. Er sagt, **wie** du baust, nicht **was** das Spiel entscheidet. Die Trennung ist hart: `village`, `dungeon-editor` und `sim-core` besitzen die Spielentscheidung, `server` und `contracts` besitzen Daten und Protokoll. Du besitzt, was davon ankommt.

Das Agentenprofil dazu ist `.github/agents/camilla.agent.md`. Dieser Skill ist die Arbeitsweise, die auch für jeden anderen Agenten gilt, der Sichtbares anfasst.

## Gesetz eins: Alles Sichtbare ist ein Beobachter

> Sichtbares liest. Sichtbares schreibt nie in einen Zustand.

Das ist die eine Regel, aus der fast alles andere folgt. Siehe [references/beobachter.md](references/beobachter.md) für die vollständige Begründung, die Naht-Signaturen dieses Repos und die Frage „und wenn ich etwas ändern muss?".

Praktisch heißt das:

- Eine Anzeige liest ihren Zustand aus dem Owner und leitet daraus ab, was zu sehen ist. Sie speichert keine Kopie.
- Was der Spieler auslöst, geht als **Kommando** an den Owner. Die Oberfläche hält die Absicht, nicht das Ergebnis.
- Eine Regel, die nur an der Oberfläche geprüft wird, ist eine zweite Wahrheit. Sperr-Knopf, Fehlergrund und Kommandoentscheidung kommen aus derselben Quelle — so wie `ui/village-build.tsx` `plans.ts` fragt, statt selbst zu rechnen.
- Willst du Zustand ändern und findest keinen Kommando, **fehlt dem Spiel ein Kommando**. Das ist ein Befund für den Auftraggeber, kein Anlass, in der Ansicht zu schreiben.

## Gesetz zwei: Der Spieler wird nie mit Technik belästigt

Er sieht **Gold**, nicht `resources.gold`; **Rathaus**, nicht `BuildingKind.hall`; **Material fehlt**, nicht `plan.kind === 'materials'`. Zahlen erscheinen mit Einheit und Kontext, Fehler als Satz, nicht als Fehlercode.

Was auf die Bühne darf, entscheidet eine Frage: **Kann der Spieler das in den Worten des Spiels lesen?** Wenn nein, gehört es in ein Log, in einen Test oder in ein Panel für die Entwicklung — nicht in die Spieleransicht. Diagnose-Overlays, FPS-Zähler, Draw-Call-Anzeigen und Objekt-IDs haben im Spiel nichts verloren; wenn du sie zum Prüfen brauchst, sind sie temporär und fliegen vor der Übergabe raus.

Das Gegenstück: Wenn eine Zahl technisch notwendig und für den Spieler trotzdem interessant ist (Schaden, Zeit, Beute), gehört sie **formatiert** in die Anzeige, nicht roh. Formatierung gehört an die Quelle, nicht in jeden Aufrufer.

## Gesetz drei: Ein Bild hat eine Absicht

Bevor du etwas zeichnest, beantworte drei Fragen. Ohne Antworten ist es Dekoration, und Dekoration wird gelöscht.

1. **Was erzählt das Bild?** Wenn die Antwort „nichts" lautet, gehört es nicht auf die Bühne.
2. **Woran erkennt der Spieler die Zustandsänderung?** Bewegung, Licht, Farbe, Silhouette, Ton — irgendetwas, das ohne Text funktioniert. Fehlende Rückkopplung ist der teuerste Fehler: Der Spieler handelt, und das Spiel schweigt.
3. **Wie steht es zum Rest?** Silhouette, Materialität, Kontrast, Farbrolle. Eine Szene, die aussieht wie ein anderes Spiel, ist ein Bruch — siehe `docs/VISUAL_GRUNDSATZ.md` und die bestehenden Atlanten in `render/`.

## Arbeitsablauf

1. **Ansehen, bevor du urteilst.** Dev-Server starten (`pnpm dev`), die betroffene Ansicht öffnen, Screenshot. Befunde über Bilder, die du nie gesehen hast, sind geraten. Für den Audit-Pfad steht die Browser-Bedienung zur Verfügung.
2. **Den Owner lesen.** Wer besitzt den Zustand, den du anzeigen willst? Lies dessen Datei und die Kommentare darüber — die Repo-Regeln haben dort Absichten festgehalten, die du sonst rückgängig machst.
3. **Vorhandenes suchen.** `rg` nach dem Muster, das du brauchst. Neun von zehn Mal gibt es eine bestehende Owner-Lösung, die du aufrufen kannst.
4. **Klein bauen, an einer Naht.** Eine Datei, ein Job, unter 150 Codelinien (Caps in `docs/REGELWERK_ARCHITEKTUR.md`).
5. **Doku mitziehen.** Jede neue oder geänderte Grafikdatei kommt in `docs/REPOINDEX.md`; jede Verhaltensänderung in den Domain-`CHANGELOG.md`. Eine sichtbare Änderung wird im Changelog ausgesprochen, auch wenn ein Gate sie verlangt hat.
6. **Prüfen.** `pnpm typecheck`, passende Tests, `pnpm run -s lint`. Für Sichtbares zusätzlich: erneut ansehen, auf Resize, auf Dunkelmodus, auf Tastatur und Screenreader.

## Zwei Fallgruben, die in diesem Stack teuer waren

**Ein Index aus einer anderen Menge.** Arrays werden nach Rolle sortiert aufgebaut; ein Index 0 ist nicht zwingend das erste Element einer gefilterten Liste. Wer einem Array einen Index aus einer anderen Menge zuweist, zählt die gefilterte Menge — und niemand sieht den Fehler, außer jemand prüft die Naht.

**Eine Änderung, die ein Gate verlangt, ist trotzdem sichtbar.** Eine extrahierte Zeichenhelfer verschob die Augenposition jedes Actors. Der Typecheck war grün. Die Spieleransicht hatte trotzdem ein anderes Gesicht. Wenn eine Änderung optisch wirkt, wird das im Changelog gesagt — nicht als „unverändert" behauptet.

## Referenzen

Lies die, die zur Aufgabe gehört, nicht alle:

| Datei | Wann |
|-------|------|
| [references/beobachter.md](references/beobachter.md) | Immer, wenn du Zustand anzeigen, ändern oder ableiten willst. Enthält die Naht-Signaturen dieses Repos und die Antwort auf „was, wenn die Anzeige etwas ändern muss?" |
| [references/pixijs.md](references/pixijs.md) | Bei jeder Arbeit an der PixiJS-Szene: Aufbau, Ebenen, Depth, Texturen, Draw Calls, Zerstörung, Performance, die v8-Fallen |
| [references/oberflaeche.md](references/oberflaeche.md) | Bei DOM-Arbeit: Tokens, Layout, Fenster, Overlays, Text, Zahlen, Icons, Tastatur, Screenreader, reduzierte Bewegung |

Für die API-Details selbst liegen die `pixijs-*-Skills` bereit (`pixijs-application`, `pixijs-scene-sprite`, `pixijs-scene-text`, `pixijs-scene-graphics`, `pixijs-scene-particle-container`, `pixijs-color`, `pixijs-filters`, `pixijs-custom-rendering`, `pixijs-performance`, `pixijs-scene-dom-container`, `pixijs-events`, `pixijs-accessibility`, `pixijs-blend-modes`, `pixijs-ticker`, `pixijs-assets`, `pixijs-core-concepts`). Lade den passenden, statt die API zu raten.

## Was du nicht prüfst

Spieler- und Produktverständnis (das ist Mia), Löschkandidaten und LOC-Caps (LEX und der Kritische Adversarial Reviewer), Governance und Contract-Konformität (ebenso). Wenn dein Befund dort liegt, benennst du es und gibst ihn weiter.
