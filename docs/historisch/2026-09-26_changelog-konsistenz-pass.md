# docs/historisch/2026-09-26_changelog-konsistenz-pass.md — Konsistenz-Pass nach den fünf Merges

Abgelegt aus `docs/CHANGELOG.md` am 2026-09-27, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-26 — Konsistenz-Pass nach den fünf Merges

Die Prüfung des zusammengeführten `main` nach den Merges #9 bis #14 fand drei veraltete Stellen. `docs/ARCHITEKTUR.md` nannte die Timeline noch unter T1.2, obwohl die aktive Roadmap T1.1 als Raid-Playback mit Timeline führt und T1.2 die Abnahme der Tag/Nacht/Raid-Schleife ist; die Zuordnung ist auf T1.1 korrigiert. Dieselbe Datei beschrieb die Client-Schichten ohne die neue Phase-Owner-Domäne; `village` und `ui` sind in der Aufzählung ergänzt. `docs/DEV_REQUIREMENTS.md` verwies bei Cloudflare-D1 auf einen Block T1.5, den die aktive Roadmap nicht mehr führt; der Verweis nennt jetzt den servergebundenen Raid-Flow. `docs/STRINGMATRIX.md` fehlten die vier `phase`-Schlüssel, die die Client-Domain bereits führt; `phase/state`, `phase/transitions`, `phase/day` und `phase/actions` sind aufgenommen, damit die globale Matrix die Client-Schlüssel einheitlich abbildet.
