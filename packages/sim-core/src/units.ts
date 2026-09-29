import { toFixed } from './math'

/**
 * Die Ausgangswerte der Einheiten — der eine Ort, an dem sie stehen.
 *
 * **Warum diese Datei außerhalb von `combat` liegt:** Der Nullpunkt der
 * Monsterwerte ist zwischen zwei Domänen geteilt. `genome/stats.ts` liest ihn,
 * um aus den Elementen Kampfwerte zu rechnen, und `combat/rules.ts` braucht
 * ihn für Helden, Monster und Boss. Solange er in `combat/rules.ts` stand,
 * importierte `genome` dorthin — und als `combat/rules.ts` anfing, über
 * `genome` die Art des Monsters zu holen, schloss sich der Kreis:
 * `combat/rules` → `genome/stats` → `combat/rules`. Beim Modulimport war
 * `PROVISIONAL_RULES` dann noch nicht fertig, und der erste Zugriff warf
 * `Cannot read properties of undefined (reading 'monster')`.
 *
 * Eine Datei, die beide Domänen importieren, ohne selbst eine davon zu sein,
 * bricht den Zyklus strukturell und nicht durch eine Importreihenfolge, die
 * heute trägt und morgen nicht. Sie enthält nur Werte und keine Regel: was
 * aus ihnen wird, entscheidet `combat`, wie es die Rechnung schon immer
 * entschieden hat.
 *
 * **Die Zahlen sind `[K]`.** Sie sind nicht abgenommen; die Kampfbalance ist
 * laut `docs/VISUAL_GRUNDSATZ.md` offen. Sie stammen aus der Spieldesign-
 * Aussage vom 2026-09-29 und stehen hier als Startbasis.
 *
 * Die Werte der Boss-Eigenheiten stehen nicht hier, sondern in `combat/boss.ts`:
 * er ist ein eigenes Wesen mit eigenen Verstärkungen, kein dritter Monsterwert.
 */
export const UNIT_BASE = {
  hero: {
    maxHp: toFixed(60),
    attack: toFixed(12),
    defense: toFixed(3),
    initiative: 500,
    moveCooldown: 2,
    attackCooldown: 3,
  },
  monster: {
    maxHp: toFixed(40),
    attack: toFixed(8),
    defense: toFixed(2),
    initiative: 300,
    moveCooldown: 3,
    attackCooldown: 4,
  },
} as const
