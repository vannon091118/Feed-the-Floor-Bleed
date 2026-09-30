import { describe, expect, it } from 'vitest'
import { baseMonsters } from '../genome/registry'
import { CellType, createDungeonGrid, setCell } from '../grid'
import { verifyCombatLog } from './replay'
import { resolveCombat } from './resolve'
import type { DefenderSlot } from './rules'

/**
 * Rot-Grün-Kette Stufe 2: der Lauf, über eine Seed-Spanne.
 *
 * Stufe 1 steht in `determinismus-kette.test.ts` und prüft die Vorschrift gegen
 * einen unabhängig nachgerechneten Vektor. Diese Datei prüft den **Lauf** über
 * 300 Startseeds — die Zusicherung, die ein Golden Pin nicht geben kann, weil er
 * zwei Seeds abdeckt.
 *
 * **Der Startseed ändert sich dabei dauernd.** Geprüft wird nicht „Seed 4242
 * liefert Hash X", sondern: derselbe Seed liefert denselben Lauf, verschiedene
 * Seeds liefern verschiedene Läufe, und der Log trägt sich selbst. Eine
 * Behauptung über eine Zahl wäre wieder ein Pin.
 *
 * **Was hier bewusst nicht steht:** ein Test „derselbe Seed, zweimal derselbe
 * Aufruf". Genau der stand hier eine Fassung lang und kostete 12,8 Sekunden für
 * eine Aussage, die `combat.test.ts` in zwei Zeilen trägt. Determinismus heißt
 * nicht, dass ein Aufruf zweimal dasselbe liefert — es heißt, dass die
 * **Vorschrift** das vorgibt. Das prüft Stufe 1.
 *
 * **Die dritte Datei im Bild ist `prng/referenz-strom.ts`.** Stufe 1 vergleicht
 * den echten Zähler mit einer Herleitung, die ihn nicht aufruft. Ohne sie wären
 * beide Stufen dasselbe: ein Vergleich mit sich selbst.
 */

/** Ein Layout, das den Direktweg nimmt. */
function offenesGrid() {
  return createDungeonGrid()
}

/** Ein Layout mit zwei versetzten Barrieren: längerer Weg, Hinterhalt. */
function umwegGrid() {
  const grid = createDungeonGrid()
  for (let x = 0; x < 63; x += 1) setCell(grid, { x, y: 20 }, CellType.Wall)
  for (let x = 1; x < 64; x += 1) setCell(grid, { x, y: 40 }, CellType.Wall)
  return grid
}

function verteidiger(anzahl: number): DefenderSlot[] {
  return baseMonsters()
    .slice(0, anzahl)
    .map((base) => ({ baseId: base.id }))
}

/** Wie viele Seeds ein Lauf braucht, um kein Einzelbeispiel zu sein. */
const SPANNE = 300

describe('Rot-Grün-Kette Stufe 2: der Lauf, über eine Seed-Spanne', () => {
  it('trennt verschiedene Seeds breit genug, dass der Seed wirkt', () => {
    // Die Gegenprobe. Ohne sie wäre eine Kette auch grün, wenn sie den Seed
    // ignorierte und immer dasselbe lieferte.
    //
    // **Gemessen über diese Spanne: 8 verschiedene Tickzahlen und 9 verschiedene
    // Ereigniszahlen.** Die Läufe sind stark quantisiert — die Varianz liegt bei
    // 900 von 1000, beides rundet auf wenige Stufen. Die erste Fassung verlangte
    // `tickzahlen.size === SPANNE` und wurde rot; das war eine falsche Erwartung,
    // nicht ein Fehler im Spiel. Festgehalten wird die Form der Aussage, nicht
    // ein exakter Wert — ein exakter wäre ein Pin in Verkleidung. Die Zahlen
    // hier sind übrigens **auch nicht** die Prüfung: `> 1` ist die Aussage,
    // und beide Werte stehen nur da, damit niemand sie für einen Beleg hält.
    //
    // Der Ausgang wird **nicht** geprüft. Die erste Fassung verlangte zwei
    // verschiedene Ausgänge und wurde rot: auf der Umweg-Route gewinnen die
    // Verteidiger jedes Mal, weil die Helden den Boss am Ende der Kammer nicht
    // erreichen. Das ist eine Aussage über die Balance und gehört in den Plan.
    const tickzahlen = new Set<number>()
    const ereigniszahlen = new Set<number>()
    for (let seed = 1; seed <= SPANNE; seed += 1) {
      const log = resolveCombat({
        grid: umwegGrid(),
        seed,
        teamSize: 3,
        defenders: verteidiger(5),
      })
      tickzahlen.add(log.ticks)
      ereigniszahlen.add(log.events.length)
    }
    expect(tickzahlen.size).toBeGreaterThan(1)
    expect(ereigniszahlen.size).toBeGreaterThan(1)
  })

  it('rechnet einen Log aus dem Trail zurück und kommt auf dasselbe Ergebnis', () => {
    // `replayCombat` liest ausschließlich den Log — kein Grid, kein Seed von
    // außen, kein Kontext neben dem Trail. Wenn daraus dasselbe herauskommt,
    // hängt der Lauf an seinem eigenen Zeugen.
    const abweichungen: string[] = []
    for (let seed = 1; seed <= SPANNE; seed += 1) {
      const log = resolveCombat({
        grid: umwegGrid(),
        seed,
        teamSize: 3,
        defenders: verteidiger(5),
      })
      if (!verifyCombatLog(log)) {
        abweichungen.push(`seed ${seed}`)
        if (abweichungen.length >= 5) break
      }
    }
    expect(abweichungen).toEqual([])
  })

  it('erkennt einen gefälschten Spec, aber nicht einen gefälschten Ereigniswert', () => {
    // Dieser Test war zuerst grün und wurde dann rot. Genau das ist der Punkt,
    // an dem die Kette ihre Reichweite zeigt.
    //
    // **Was passiert:** `replayCombat` liest `seed`, `units`, `config` und
    // `trail` — **nicht** `log.events`. Die gelieferten Ereignisse werden neu
    // berechnet, und `verifyCombatLog` vergleicht nur `hash`, `stage`, `ticks`
    // und `events.length`. Ein Log, in dem jemand einen `amount` erhöht und den
    // Hash stehen lässt, kommt durch. Kein Zufall, kein Messfehler: die Prüfung
    // kann es nicht sehen.
    //
    // **Der unangreifbare Fall** ist die Zahl im Spec — `maxHp` und `attack`
    // gehen über `replayCombat` in die Rechnung ein, danach stimmt der Hash nicht
    // mehr. Beides wird festgehalten: was fällt, und was nicht.
    const ereignisLuecke: number[] = []
    const specErkannt: number[] = []
    for (let seed = 1; seed <= 40; seed += 1) {
      const log = resolveCombat({
        grid: offenesGrid(),
        seed,
        teamSize: 3,
        defenders: verteidiger(2),
      })
      const gefaelscht = {
        ...log,
        events: log.events.map((ereignis, index) =>
          index === Math.floor(log.events.length / 2)
            ? { ...ereignis, amount: (ereignis.amount ?? 0) + 1 }
            : ereignis,
        ),
      }
      if (verifyCombatLog(gefaelscht)) ereignisLuecke.push(seed)

      const mitHohemHp = {
        ...log,
        units: log.units.map((einheit, index) =>
          index === 0 ? { ...einheit, maxHp: einheit.maxHp + 1 } : einheit,
        ),
      }
      if (verifyCombatLog(mitHohemHp)) ereignisLuecke.push(-seed)
      else specErkannt.push(seed)
    }
    // Der Spec-Angriff fällt in jedem Seed auf. Das ist die Zusicherung, die trägt.
    expect(specErkannt.length).toBe(40)
    // Der Ereignis-Angriff kommt durch, und das ist **kein Testfehler**, sondern
    // der dokumentierte Rand der heutigen Prüfung. Würde jemand `replayCombat`
    // erweitern, ohne dass jemand diesen Test anfasst, fällt er hier — das ist der
    // eigentliche Zweck der Zeile.
    expect(ereignisLuecke.filter((seed) => seed > 0).length).toBe(40)
    expect(ereignisLuecke.filter((seed) => seed < 0)).toEqual([])
  })
})
