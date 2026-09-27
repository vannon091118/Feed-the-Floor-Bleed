# docs/historisch/2026-09-26_changelog-client-oberflaeche.md — Client-Oberfläche

Abgelegt aus `docs/CHANGELOG.md` am 2026-09-28, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-26 — Client-Oberfläche: Dorfblick, Blickumschalter, modularer Schnitt

Der Client hatte kein Dorf, sondern vier Fixture-Zahlen in einer offenen Label-Wert-Liste, und zeigte in jeder Phase das Dungeon-Raster im Viewport. Die Kopfleiste führte Debug-Rückmeldung mit Rohkoordinaten, `styles.css` war eine 630-zeilige Datei mit drei erfundenen Panel-Optiken und einem `is-night`-Theming, das die Shell nie setzte, und `shell.tsx` stand bei 96 von 120 erlaubten LOC — ohne Raum für weitere Arbeit am Layout.

`packages/client/src/village/settlement.ts` leitet den Dorfblick jetzt als reine Funktion aus dem Phase-Owner und den Fixture-Daten ab: Gebiete, Gildenroster, Verteidigerplätze und die Bilanz der letzten Nacht. Das ist aus dem Loop abgeleitet, nicht erfunden; Dorfwirtschaft mit Arbeitern, Gold- und Materialausgaben, Landkauf und Beute-Verkauf bleibt unverändert T2 und wurde nicht angefasst. Die Fenster- und Kennungsdarstellung nutzt jetzt Namen statt interner IDs.

`packages/client/src/ui/view.ts` führt den Blick `village | dungeon` als Navigation getrennt von der Spielphase; `test/stage-view.test.ts` pinnt, dass der Wechsel weder Phase noch Grid berührt. Die Shell ist nur noch Layout, Topbar, Bühne und Sidebar lesen ihre Stores selbst, und `styles.css` ist durch `ui/styles/` mit acht Modulen auf gemeinsamen Gestaltungs-Tokens ersetzt. `test/village-settlement.test.ts` prüft die Ableitung gegen echten Loop-Zustand.

Grenze dieses Blocks: `typecheck`, 148 Tests, Lint und alle Shinon-Gates sind grün und der Build löst die Style-Kette auf, aber die Abnahme im Browser steht aus — in der Arbeitsumgebung gab es weder Chrome noch ein DOM-Testsetup. Grüne Gates belegen Korrektheit, nicht Aussehen. Details in `packages/client/docs/CHANGELOG.md`.
