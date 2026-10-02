# packages/client/docs/CHANGELOG.md — Archiv

Am 2026-10-02 aus dem aktiven Changelog gewandert, weil die Zeilengrenze der
Domänendoku (200 Zeilen) erreicht war.

## 2026-09-28 — Contract v4: die Summary trägt den Verteidiger-Roster

**Scope:** Fixture-Summary in `test/raid-fixtures.ts` um `defendersTotal` ergänzt; Kommentare in `src/raid/fixture-raid.ts`, `src/raid/raid-panel.tsx` und `src/village/state.ts` sowie der Testname in `test/raid-job.test.ts` auf Contract v4 gezogen. `package.json` führt `@floor/contracts` und `@floor/sim-core` jetzt als `workspace:*`; die Importe in `src/` lösten bis dahin nur über `tsconfig`-Pfade und den Vite-Alias auf, `node_modules/@floor` gab es im Client nicht. Kein Clientverhalten geändert.

**Was der Sprung für den Client bedeutet.** `CONTRACT_VERSION 3→4` und `sim_version 0.0.2→0.0.3`; Upload und Ergebnis des Fixture-Laufs tragen die neuen Werte von selbst, weil beide aus den Contract-Konstanten kommen. Neu ist `summary.defendersTotal` — die Zahl der Verteidiger im eingefrorenen Snapshot, Boss inklusive. Der Client liest sie noch nicht; der Dorf-Abrechnung fehlt weiterhin die freigegebene Goldformel. Belegt ist damit die Zahl der Gefallenen, nicht mehr: E1 verlangt „abhängig von Stärke/Generation", und beides je Gegner führt kein Feld — `monsterSlot` trägt nur `monsterId`.

**Der Dorf-Kommentar ist korrigiert.** `village/state.ts` führte das fehlende Rosterfeld als Grund, warum `DaySettlement` nur Materialien nennt. Das Feld existiert jetzt. Geblieben sind zwei echte Gründe: Die Formel ist nicht freigegeben, und das einzige lokal verfügbare Roster wäre das eigene Fixture. **Korrigierte Aussage:** Eine frühere Fassung dieses Eintrags und die Kommentare nannten die Datenlage der Formel „geschlossen". Belegt ist nur die Zahl der Gefallenen; ob die Formel nach E1 zusätzlich Stärke und Generation je Gegner braucht, ist offen. Zwei Kommentare waren zudem auf einem alten Stand und nannten den Upload noch „Contract-v2" beziehungsweise die Payloads „Contract-v3".

**Platz geschaffen.** Der aktive Changelog stand nach diesem Eintrag bei 204 Zeilen; der älteste Eintrag, der Tote-Code-Nachgang vom 2026-09-27, ist wortgleich nach `historisch/2026-09-27_client-tote-code-reste.md` gewandert.
