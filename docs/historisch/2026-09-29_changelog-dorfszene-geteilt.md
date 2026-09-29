# docs/historisch/2026-09-29_changelog-dorfszene-geteilt.md

Aus `docs/CHANGELOG.md` ausgelagert am 2026-09-29, weil die aktive Datei an ihre 200-Zeilen-Grenze stiess. Wortgleich übernommen.

## 2026-09-29 — Die Dorfszene wird zweigeteilt, damit die Verdrahtung hineinpasst

**Der Befund.** `packages/client/src/render/village-scene.ts` stand bei 149 von 150 erlaubten Codelinien, und die Verdrahtung des Dorfbestands an die Szene — der nächste offene Punkt in T2.2 — hätte dort keinen Platz mehr gefunden. Die Datei führte außerdem zwei Jobs in einer: Sie malte den unbeweglichen Untergrund und leitete daneben Gebäude, Bewohner und ihre Bewegung.

**Der Schnitt trennt Bild von Bewegung.** Neu ist `packages/client/src/render/village-ground.ts` mit `drawVillageGround(container, textures)` für Wiese, Bodenkacheln, Weg und Bäume sowie `placeSprite`, der gemeinsamen Sprite-Anlage, die vorher in der Szene lag und die beide Teile brauchen. `packages/client/src/render/village-scene.ts` behält `VillageTextures`, `VillageScene`, `WALKERS`, die Gebäudeschleife mit Klickverdrahtung, die Bewohner und `update`. Der öffentliche Aufruf `createVillageScene(textures, onBuildingClick)` ist unverändert, die Zeichenreihenfolge Wiese, Boden, Weg, Bäume, Gebäude, Bewohner ebenfalls — deshalb bleibt `packages/client/test/world-presentation.test.ts` ohne eine Zeile Änderung grün.

**Doku und Gates.** `packages/client/docs/REPOINDEX.md` führt das neue Modul, `packages/client/docs/FUNKTIONSGRAPH.md` und `packages/client/docs/ARCHITEKTUR.md` nennen beide Dateien, und `docs/ROADMAP.md` hält den neuen Stand der Szene fest. **Gates:** typecheck 0, 360 Tests in 54 Dateien, Lint 0, LOC-Caps ok (`village-scene.ts` 149 auf 75 Codelinien, `village-ground.ts` 88), Hygiene ok, Shinon PASS.
