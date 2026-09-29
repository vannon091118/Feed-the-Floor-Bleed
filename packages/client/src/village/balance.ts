import type { Resources } from '../fixture-data'

/**
 * Jede Stellschraube des Dorfes an genau einer Stelle.
 *
 * Diese Datei ist der einzige Ort im Repository, an dem eine Kosten-, Ertrags-,
 * Kapazitäts- oder Preisgröße steht. Die Regelmodule `economy.ts` rechnen
 * ausschließlich mit der Config, die ihnen ausdrücklich übergeben wird; kein
 * Aufrufer bekommt einen stillen Standardwert. Wer ein Spielgefühl ändern
 * will, ändert hier eine Zahl und sonst nichts.
 *
 * Die Zahlen sind am 2026-09-28 vom Auftraggeber freigegeben und mit einer
 * Grenzfallzeile je Wert in `docs/VISUAL_GRUNDSATZ.md` begründet. Die
 * Grundrisse sind gemessen: Rathaus und Gilde 3×3, Wohnhaus 2×2, Werkstatt
 * 2×3 Rasterzellen auf dem 10×10-Feld. Die Zellpositionen der beiden festen
 * Startorte sind am 2026-09-29 nachgezogen: Rathaus (3,1), Gilde (3,6).
 */

/** Die Baugegenstand-Arten des Dorfes. Der Renderer leiht sich diese Union. */
export type BuildingKind = 'hall' | 'guild' | 'house' | 'workshop'

/** Ein Betrag in beiden Währungen; Bauen und Ausbau kosten nie nur Gold. */
export interface Cost {
  gold: number
  materials: number
}

/** Grundriss eines Baus in Rasterzellen, nicht in Weltpixeln. */
export interface FootprintCells {
  width: number
  height: number
}

/**
 * Ein fester Startort des Dorfes: die Gebäudeart und ihre linke obere Zelle.
 *
 * Die Breite und die Höhe stehen ausdrücklich nicht hier, sondern am Grundriss
 * derselben Art unter `buildings`. Eine zweite Zahl daneben wäre eine zweite
 * Wahrheit: Sie könnte von der Freigabetabelle wegdriften, ohne dass ein Gate
 * es merkte.
 *
 * Der Ort ist gesetzt, wenn das Dorf beginnt, und wird nie gebaut. Weil er im
 * selben Bestand liegt wie alles Gebaute, schützt die Platzierungsprüfung der
 * Kommandos ihn, ohne dass ein Kommando die festen Orte eigens kennt.
 */
export interface FixedSite {
  kind: BuildingKind
  x: number
  y: number
}

/**
 * Tiefenunveränderlichkeit, auch für verschachtelte Objekte.
 *
 * `Object.freeze` greift nur zur Laufzeit, und `readonly` nur eine Ebene
 * tief: `BALANCE.dungeon` wäre bei `readonly` auf `BALANCE` selbst noch
 * schreibbar. Diese Abbildung schließt die Lücke, damit ein Schreibversuch
 * schon im Typecheck scheitert und nicht erst als Wurf in einer Regel
 * auffällt.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

/** Alles, was je Gebäudeart eingestellt werden kann. */
export interface BuildingBalance {
  /**
   * Darf diese Art überhaupt gebaut werden?
   *
   * Rathaus und Gilde sind feste Startorte: ihre Nullkosten allein sagten das
   * nicht, denn ein Preis von 0 könnte auch ein kostenloses Angebot sein. Ohne
   * dieses Feld stünde die Regel „sie werden nie gebaut" nur im Kommentar.
   */
  buildable: boolean
  /** Einmaliger Preis des Baus. */
  buildCost: Cost
  /**
   * Koeffizient der quadratischen Ausbaukurve: Der Preis der Zielstufe `n`
   * ist `upgradeCoefficient · n²`. Höher heißt sparsamer beim Ausbau.
   */
  upgradeCoefficient: number
  /** Letzte erreichbare Stufe. Eine Zielstufe darüber ist eine Ablehnung. */
  maxLevel: number
  /** Belegte Rasterzellen auf dem Dorfgrundriss. */
  footprint: FootprintCells
}

export interface BalanceConfig {
  /** Startbestand, Startarbeiterbasis und Maße des Dorfrasters. */
  start: {
    resources: Resources
    workerBase: number
    landColumns: number
    /**
     * Höhe des Rasters in Zellen. Sie wächst nie: die Landerweiterung ist
     * ausdrücklich horizontal, also gibt es für Zeilen auch keinen Preis. Der
     * Wert steht hier, weil die Rastergrenze beim Bauen geprüft wird und keine
     * Zahl außerhalb dieser Datei liegen darf.
     */
    landRows: number
    /**
     * Die festen Startorte, die beim Anlegen des Dorfes gesetzt werden.
     *
     * Sie stehen hier und nicht im Store: Zellpositionen sind freigegebene
     * Zahlen, und der Store leitet sie nur daraus ab. Ein Rathaus ohne Zelle
     * wäre kein Startort, sondern ein ungeschützter Fleck Raster.
     */
    fixedSites: readonly FixedSite[]
  }
  buildings: Record<BuildingKind, BuildingBalance>
  /** Werkstattertrag: Materialien je Tag für Stufe 1 und je weiterer Stufe. */
  workshop: {
    yieldBase: number
    yieldStepPerLevel: number
  }
  /** Baukapazität: höchstens `floor(Arbeiterbasis / capacityDivisor)` Werkstätten. */
  workers: {
    capacityDivisor: number
    /** Arbeiter, die ein Wohnhaus je Stufe zur Basis beisteuert. */
    houseWorkerPerLevel: number
  }
  /**
   * Attraktivität des Ortes. Sie ist freigegeben und wird angezeigt, hat aber
   * bis heute keine Ableitung und keinen Regelabnehmer: die Arbeiterwirkung
   * läuft ausschließlich über `workers.houseWorkerPerLevel`. Als Stellschraube
   * steht sie hier, damit die Anzeige keine eigene Zahl führt — verstellen
   * darf erst jemand, der die Ableitung gebaut hat.
   */
  attraction: {
    base: number
  }
  /** Horizontale Landerweiterung, quadratisch in Gold und linear in Material. */
  land: {
    columnsPerStep: number
    goldCoefficient: number
    materialCoefficient: number
  }
  /** Etagen und Slots des Dungeons: Etagen kosten Gold, Slots Material. */
  dungeon: {
    floorBase: number
    slotBase: number
    slotsPerFloor: number
    /** Erste kaufbare Etage. Etage 1 gehört zum Ausgang dazu. */
    firstPaidFloor: number
  }
}

/**
 * Die Balancerechnung rechnet mit einer eingefrorenen Config und schreibt
 * niemals hinein; sie bekommt deshalb diesen Typ statt der beschreibbaren
 * Form. Ein Aufrufer kann die Regel also auch dann nicht durch eine
 * Manipulation seiner Config täuschen, wenn er sie selbst gebaut hat.
 */
export type FrozenBalance = DeepReadonly<BalanceConfig>

const CONFIG = {
  start: {
    resources: { gold: 120, materials: 7 },
    workerBase: 12,
    landColumns: 10,
    landRows: 10,
    fixedSites: [
      { kind: 'hall', x: 3, y: 1 },
      { kind: 'guild', x: 3, y: 6 },
    ],
  },
  buildings: {
    // Rathaus und Gilde sind feste Startorte: Sie werden nie gebaut und nie
    // ausgebaut. Ihre Nullwerte halten die Tabelle vollständig, damit eine
    // Regelfunktion je Gebäudeart eine Antwort liefern kann.
    hall: {
      buildable: false,
      buildCost: { gold: 0, materials: 0 },
      upgradeCoefficient: 0,
      maxLevel: 1,
      footprint: { width: 3, height: 3 },
    },
    guild: {
      buildable: false,
      buildCost: { gold: 0, materials: 0 },
      upgradeCoefficient: 0,
      maxLevel: 1,
      footprint: { width: 3, height: 3 },
    },
    house: {
      buildable: true,
      buildCost: { gold: 30, materials: 4 },
      upgradeCoefficient: 8,
      maxLevel: 5,
      footprint: { width: 2, height: 2 },
    },
    workshop: {
      buildable: true,
      buildCost: { gold: 80, materials: 6 },
      upgradeCoefficient: 20,
      maxLevel: 5,
      footprint: { width: 2, height: 3 },
    },
  },
  workshop: {
    yieldBase: 3,
    yieldStepPerLevel: 2,
  },
  workers: {
    capacityDivisor: 2,
    houseWorkerPerLevel: 2,
  },
  attraction: {
    base: 74,
  },
  land: {
    columnsPerStep: 2,
    goldCoefficient: 60,
    materialCoefficient: 5,
  },
  dungeon: {
    floorBase: 250,
    slotBase: 40,
    slotsPerFloor: 5,
    firstPaidFloor: 2,
  },
} as const satisfies BalanceConfig

function freezeDeep(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  for (const part of Object.values(value)) freezeDeep(part)
  Object.freeze(value)
}

freezeDeep(CONFIG)

/**
 * Die freigegebene Dorfbalance. Jede Regelfunktion bekommt sie übergeben.
 *
 * `as const satisfies` hält die Zahlen als Literale, ohne die Form zu
 * verlieren; der Typ ist trotzdem `FrozenBalance`, damit `BALANCE.dungeon
 * .floorBase = 1` ein Typecheck-Fehler ist und nicht ein Wurf auf das
 * eingefrorene Objekt. Die Laufzeit-Einfrierung bleibt unverändert dieselbe.
 */
export const BALANCE: FrozenBalance = CONFIG
