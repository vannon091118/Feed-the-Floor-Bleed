import type { BuildingKind, Cost, FrozenBalance } from './balance'

/**
 * Die Spielregeln des Dorfes, ohne jeden Zustand.
 *
 * Jede Funktion nimmt ihre Eingaben und ihre Balance ausdrücklich entgegen.
 * Keine importiert `BALANCE` als versteckten Standardwert, keine hält Zustand,
 * keine wirft: Was abgewiesen werden kann, ist eine Entscheidung des Aufrufers
 * und kommt als unterscheidbares Ergebnis zurück. Die Zahlen selbst liegen
 * ausschließlich in `balance.ts`.
 *
 * Jede Zahl, die als Stufe, Etage, Platz oder Spaltenzahl hier ankommt, muss
 * eine Ganzzahl ab 1 sein — und `landStepCost` zusätzlich mindestens so breit
 * wie der Ausgang. Ein Bereichsvergleich allein genügt dafür nicht: `NaN` ist
 * weder kleiner noch größer als eine Grenze, fällt also durch jeden `x < n`,
 * und `Number.isInteger` fällt für `NaN` und für beide Unendlichkeiten
 * falsch. Eine gebrochene Zahl käme sonst als nicht ganzer Goldbetrag in den
 * Bestand, eine Stufe `NaN` als NaN in die Topbar.
 */

/** Die eine Form, die eine Stufe, eine Etage oder ein Platz haben darf. */
function istGanzzahlAbEins(wert: number): boolean {
  return Number.isInteger(wert) && wert >= 1
}

/** Ein platziertes Dorfgebäude. Der Träger von Art und Ausbaustufe. */
export interface PlacedBuilding {
  kind: BuildingKind
  level: number
}

/** Warum ein Ausbau abgewiesen wurde. */
export type UpgradeRejection =
  | { ok: false; reason: 'below-first-level' }
  | { ok: false; reason: 'above-max-level'; maxLevel: number }
  | { ok: true; cost: number }

/** Warum eine weitere Werkstatt nicht gebaut werden darf. */
export type CapacityRejection =
  | { ok: false; reason: 'worker-capacity'; capacity: number }
  | { ok: true }

/** Warum eine Landerweiterung abgewiesen wurde. */
export type LandRejection =
  | { ok: false; reason: 'below-start-columns'; landColumns: number }
  | { ok: false; reason: 'not-wider' }
  | { ok: false; reason: 'not-a-whole-step'; columnsPerStep: number }
  | { ok: true; cost: Cost }

/** Warum eine Etage nicht freigeschaltet werden kann. */
export type FloorRejection =
  | { ok: false; reason: 'below-first-paid-floor'; firstPaidFloor: number }
  | { ok: true; cost: number }

/** Warum ein Monsterplatz nicht freigeschaltet werden kann. */
export type SlotRejection =
  | { ok: false; reason: 'below-first-paid-floor'; firstPaidFloor: number }
  | { ok: false; reason: 'slot-out-of-range'; slotsPerFloor: number }
  | { ok: true; cost: number }

/**
 * Der einmalige Preis, ein Gebäude der Art zu bauen, in Gold und Material.
 *
 * Eine Kopie und nicht die Config selbst: die eingefrorene Tabelle gehört
 * niemandem als Schreibziel, und ein Aufrufer, der an ihr drehte, bekäme
 * keinen Betrag, sondern einen Wurf aus einer Regel heraus.
 */
export function buildCost(kind: BuildingKind, config: FrozenBalance): Cost {
  const { gold, materials } = config.buildings[kind].buildCost
  return { gold, materials }
}

/**
 * Der Goldpreis, ein Gebäude auf die Zielstufe `targetLevel` auszubauen.
 *
 * Die freigegebene Form ist die quadratische Kurve `Koeffizient · n²` über der
 * Zielstufe. Stufe 1 ist der Bestand jedes Gebäudes — dieser Zählungsbeginn ist
 * keine Balancegröße und steht deshalb nicht in der Config. Über der letzten
 * Stufe ist der Ausbau eine Ablehnung mit genannter Grenze und kein Fehler: zu
 * hoch bauen entscheidet der Aufrufer am Kartenrand, nicht die Regel.
 *
 * Der Betrag ist Gold. E1 in `docs/VISUAL_GRUNDSATZ.md` nennt Materialien auch
 * als Quelle aus Upgrades; dafür steht in der freigegebenen Tabelle kein Wert,
 * und eine Materialauszahlung beim Ausbau bleibt offen.
 *
 * Eine Zielstufe, die keine Ganzzahl ab 1 ist, wird mit demselben Grund
 * abgewiesen wie Stufe 0: beide bedeuten „diese Stufe gibt es nicht". Ohne das
 * nähme `upgradeCost(art, 2.5)` einen nicht ganzen Goldbetrag an und
 * `upgradeCost(art, NaN)` einen, der nirgends als Zahl darstellbar ist.
 */
export function upgradeCost(
  kind: BuildingKind,
  targetLevel: number,
  config: FrozenBalance,
): UpgradeRejection {
  const building = config.buildings[kind]
  if (!istGanzzahlAbEins(targetLevel))
    return { ok: false, reason: 'below-first-level' }
  if (targetLevel > building.maxLevel)
    return { ok: false, reason: 'above-max-level', maxLevel: building.maxLevel }
  return {
    ok: true,
    cost: building.upgradeCoefficient * targetLevel * targetLevel,
  }
}

/**
 * Der Materialertrag einer Werkstatt auf der angegebenen Stufe, je Tag.
 *
 * Eine Stufe, die keine Ganzzahl ab 1 ist, ergibt 0 — und keine Ablehnung.
 * Diese Funktion ist eine Summe über die vorhandenen Werkstätten, kein Befehl:
 * der Tagesabschluss bucht ihr Ergebnis ohne weitere Prüfung gut, und eine
 * kaputte Stufe darf ihn deshalb weder mit `NaN` füllen noch Materialien
 * abbuchen. Ein Fehlgriff im Aufrufer ist hier nicht sichtbar zu machen — er
 * entsteht erst am Kartenrand. Die Befehlsfunktionen (`upgradeCost`,
 * `floorCost`, `slotCost`, `landStepCost`) kennen dagegen einen Absender, der
 * die Ablehnung sehen kann, und antworten deshalb mit einem genannten Grund.
 */
export function workshopYield(level: number, config: FrozenBalance): number {
  if (!istGanzzahlAbEins(level)) return 0
  const { yieldBase, yieldStepPerLevel } = config.workshop
  return yieldBase + yieldStepPerLevel * (level - 1)
}

/**
 * Der Werkstattertrag des ganzen Dorfes für einen Tag. Eine leere Dorfliste ist
 * ein Dorf ohne Ertrag und kein Fehler: sie ergibt null.
 */
export function dailyYield(
  buildings: readonly PlacedBuilding[],
  config: FrozenBalance,
): number {
  return buildings
    .filter((building) => building.kind === 'workshop')
    .reduce((sum, building) => sum + workshopYield(building.level, config), 0)
}

/**
 * Die Arbeiterbasis: Startbasis plus der Beitrag aller Wohnhäuser.
 *
 * Ein Wohnhaus, dessen Stufe keine Ganzzahl ab 1 ist, steuert nichts bei. Die
 * Basis kann dadurch nur wachsen, nie schrumpfen: eine kaputte Stufe verfälscht
 * keine Kapazität und macht aus einem Dorf mit Wohnhaus kein Dorf mit
 * Arbeitern im Minus.
 */
export function workerBase(
  buildings: readonly PlacedBuilding[],
  config: FrozenBalance,
): number {
  const houses = buildings.filter((building) => building.kind === 'house')
  const beitrag = houses.reduce(
    (sum, house) =>
      istGanzzahlAbEins(house.level)
        ? sum + config.workers.houseWorkerPerLevel * house.level
        : sum,
    0,
  )
  return config.start.workerBase + beitrag
}

/**
 * Darf eine weitere Werkstatt gebaut werden?
 *
 * Die Kapazität ist `floor(Arbeiterbasis / Divisor)`. Sie hängt an der
 * Arbeiterbasis und nicht am Land, deshalb bindet sie erst spät: mit der
 * Startbasis 12 und dem Divisor 2 sind es sechs Werkstätten, die siebte wird
 * abgewiesen — ein Wohnhaus hebt die Basis und damit die Grenze wieder an.
 */
export function canBuildWorkshop(
  buildings: readonly PlacedBuilding[],
  config: FrozenBalance,
): CapacityRejection {
  const workshops = buildings.filter(
    (building) => building.kind === 'workshop',
  ).length
  const capacity = Math.floor(
    workerBase(buildings, config) / config.workers.capacityDivisor,
  )
  if (workshops >= capacity)
    return { ok: false, reason: 'worker-capacity', capacity }
  return { ok: true }
}

/**
 * Der Preis der Landerweiterung von `from` auf `to` Spalten.
 *
 * Gezählt wird die Zahl der Schritte, nicht die Zahl der Spalten; der Schritt
 * kostet quadratisch Gold und linear Material. Eine Erweiterung muss die
 * Spaltenzahl erhöhen und ein ganzes Vielfaches der Schrittweite sein — ein
 * halber Schritt ergäbe einen nicht ganzzahligen Betrag.
 *
 * Dazu kommt eine Untergrenze für `from`: das Dorf kann nur von einer Breite
 * aus erweitert werden, die es hat, also mindestens von `start.landColumns` aus.
 * Ohne sie wäre `landStepCost(0, 10)` ein günstiger Fünf-Schritt-Kauf, weil der
 * quadratische Zähler dann schon am günstigsten Punkt beginnt. `Number.isInteger`
 * weist dabei zugleich gebrochene Werte, `NaN` und beide Unendlichkeiten ab.
 *
 * Dafür gibt es einen eigenen Grund, und das ist die Begründung: `not-wider`
 * wäre falsch, denn das Land wird breiter, und `not-a-whole-step` beschreibt
 * eine Zahl, die geometrisch keinen Sinn hat. Beide auszusuchen hieße, dem
 * Aufrufer eine fremde Ursache zu nennen.
 */
export function landStepCost(
  from: number,
  to: number,
  config: FrozenBalance,
): LandRejection {
  const { columnsPerStep, goldCoefficient, materialCoefficient } = config.land
  if (!Number.isInteger(from) || from < config.start.landColumns)
    return {
      ok: false,
      reason: 'below-start-columns',
      landColumns: config.start.landColumns,
    }
  if (to <= from) return { ok: false, reason: 'not-wider' }
  const steps = (to - from) / columnsPerStep
  if (!Number.isInteger(steps))
    return { ok: false, reason: 'not-a-whole-step', columnsPerStep }
  return {
    ok: true,
    cost: {
      gold: goldCoefficient * steps * steps,
      materials: materialCoefficient * steps,
    },
  }
}

/**
 * Der Goldpreis der Etage `floor`.
 *
 * Etage 1 gehört zum Ausgang und ist nicht kaufbar; die Guarde beginnt
 * deshalb bei `firstPaidFloor`. Ohne sie wäre auch Etage 0 ein kaufbares Angebot
 * zum Preis von `floorBase · 0²` — also umsonst, und eine Etage dazu.
 *
 * Die erste Bedingung ist eine Ganzzahlprüfung und kein Vergleich. `NaN` ist
 * nicht kleiner als `firstPaidFloor` und fiele durch einen reinen `<`-Test hindurch
 * mit einem Preis `floorBase · NaN²`; dasselbe gilt für eine gebrochene Etage,
 * die sonst nicht ganzes Gold als Betrag nähme. Beides fällt unter denselben
 * Grund, weil beides bedeutet: diese Etage gibt es nicht.
 */
export function floorCost(
  floor: number,
  config: FrozenBalance,
): FloorRejection {
  const { floorBase, firstPaidFloor } = config.dungeon
  if (!Number.isInteger(floor) || floor < firstPaidFloor)
    return { ok: false, reason: 'below-first-paid-floor', firstPaidFloor }
  return { ok: true, cost: floorBase * floor * floor }
}

/**
 * Der Materialpreis des `slot`-ten Monsterplatzes auf der Etage `floor`.
 *
 * Zwei Grenzen, beide aus der Config: die Etage muss kaufbar sein, und der Platz
 * muss zwischen dem ersten und dem `slotsPerFloor`-ten liegen. Ohne die
 * Platzgrenze lieferte `slotCost(etage, 0)` nichts und jede größere Zahl
 * unbegrenzte Plätze — beides verschenkte Kapazität für kein Material.
 *
 * Beide Prüfungen sind Ganzzahlprüfungen mit je einem Bereich daneben, aus
 * demselben Grund wie bei `floorCost`: `NaN` und die Unendlichkeiten kommen an
 * keiner Grenze vorbei, und `slotCost(2, 2.5)` wäre sonst ein halber Materialbetrag
 * für einen Platz, den es nicht gibt.
 */
export function slotCost(
  floor: number,
  slot: number,
  config: FrozenBalance,
): SlotRejection {
  const { slotBase, slotsPerFloor, firstPaidFloor } = config.dungeon
  if (!Number.isInteger(floor) || floor < firstPaidFloor)
    return { ok: false, reason: 'below-first-paid-floor', firstPaidFloor }
  if (!Number.isInteger(slot) || slot < 1 || slot > slotsPerFloor)
    return { ok: false, reason: 'slot-out-of-range', slotsPerFloor }
  return { ok: true, cost: slotBase * floor * floor * slot }
}
