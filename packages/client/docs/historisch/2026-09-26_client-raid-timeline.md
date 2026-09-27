# packages/client/docs/historisch/2026-09-26_client-raid-timeline.md — Raid-Timeline verdrahtet

Abgelegt aus `packages/client/docs/CHANGELOG.md` am 2026-09-27, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert. Am 2026-09-28 kam der Oberflächen-Rebase-Eintrag dazu, aus demselben Grund.

## 2026-09-26 — Raid-Timeline verdrahtet

Die Timeline war gebaut, aber nicht angeschlossen: `ui/shell.tsx` hat sie nie gerendert, `showcase/scene.ts` hat einen eigenen `playback`-Zähler geführt, und für die elf Klassen der Timeline gab es kein CSS. Die Shell rendert jetzt `<RaidTimeline />` in der Raid-Phase neben dem Probelauf-Panel; `styles.css` trägt die elf Klassen `raid-timeline`, `timeline-phase-nav`, `timeline-phase-step`, `timeline-scrubber`, `timeline-scrub-step`, `timeline-scrub-readout`, `timeline-phase`, `timeline-trail`, `timeline-clusters`, `timeline-cluster-type`, `timeline-facts` und `timeline-hint` in den bestehenden Farbtokens.

Der zweite Teil war wichtiger als der erste. Die Szene hat den Tick lokal über `playback += deltaMs / (1000 / tickRate)` fortgeschrieben und dabei `stepPlayback` sowie `playbackPaused` ignoriert; ein Scrubber-Stand wäre sofort wieder überschrieben worden, die Anzeige wäre wirkungslos gewesen. `scene.ts` ruft jetzt `stepPlayback` auf und lässt den Store den Tick halten. Die Routenposition liest `playbackRouteIndex` und fällt nur dann auf die Helmenposition des Observers zurück, wenn noch kein Log vorliegt; damit ist der bisher ungenutzte Store-Wert an der Stelle verdrahtet, für die sein Kommentar ihn vorsah.

`test/raid-timeline.test.ts` deckt die Verdrahtung jetzt ab: ohne Log steht der Tick, im Spiel läuft er, ein gesetzter Scrubber-Stand wird übernommen und läuft ohne Pause weiter, mit Pause bleibt er exakt stehen, und die Routenposition folgt dem Scrubber-Tick statt der Helmenposition.

## 2026-09-26 — Oberflächen-Rebase: Raid-Timeline und Editor-Sichtbarkeit erhalten

Der UI-Slice wurde per Rebase auf den aktuellen `main` gezogen, weil er fünf Commits und zwei Toolchain-Migrationen zurücklag und deshalb allein rot war. Die Konflikte waren nicht mechanisch, deshalb ist das Ergebnis dokumentiert.

**Die Raid-Timeline war der eigentliche Verlust.** Der Branch kannte die Timeline nicht: `sidebar.tsx` montierte sie nicht, und die sechzehn Timeline-Regeln aus `styles.css` fehlten im aufgeteilten Stylesheet. `sidebar.tsx` rendert sie jetzt in der Raid-Phase über dem Raid-Panel, und die Regeln sind nach `styles/raid.css` überführt. Die Selektormenge wurde gegen `main` geprüft: alle fünfzehn Timeline-Selektoren sind vorhanden, es fehlt keiner.

**Der Editor bleibt an die Phase gebunden.** Der Branch koppelte das Editorwerkzeug zusätzlich an den Dungeon-Blick, obwohl sein eigener Kommentar das Gegenteil behauptet. Übernommen ist die phase-gebundene Variante aus `main`, damit die im Browser abgenommene T1.2-Schleife nicht stillschweigend verliert, dass der Editor in Nacht und Raid offen ist. Der ungenutzte `stageView`-Import ist damit entfallen.

**Der Domain-Barrel ist eine Vereinigung.** `village/index.ts` exportiert jetzt die Phase-Owner aus `main` und die Settlement-Typen des Branches gemeinsam; `settlement.ts` bleibt die reine Funktion des Dorfblicks und trägt weiterhin keine Wirtschaftsregel.

**Was bewusst offen bleibt.** Die Klassenbindung `app is-day` aus `main` ist nicht wiederhergestellt: Die Shell des Branchs kennt bewusst keine Phase, und sie zurückzuholen hieße, genau die Entkopplung wieder aufzubrechen, die der Slice herstellt. Das ist eine Design-Entscheidung und als offener Punkt in `docs/ROADMAP.md` vermerkt. Die Browser-Abnahme steht weiterhin aus.
