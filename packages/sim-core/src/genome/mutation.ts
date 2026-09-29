import { hashStart, hashText } from '../hash'
import { clampInt } from '../math'
import {
  createRng,
  deriveSeed,
  nextBelow,
  nextRange,
  type RngState,
} from '../prng'
import { baseMonster } from './registry'
import {
  BONUS_IDS,
  type BonusId,
  ELEMENT_MAX,
  ELEMENT_MIN,
  type Genome,
  TRAIT_IDS,
  type TraitId,
} from './types'

/**
 * Die Zuchtkette.
 *
 * Drei Schritte in fester Reihenfolge, alle drei vom internen PRNG gespeist:
 * die Elemente werden vererbt, die vererbten Werte werden gekoppelt, zuletzt
 * mutiert das Ergebnis. Der Seed kommt von außen und ist die einzige
 * Zufallsquelle — dieselben Eltern mit demselben Seed ergeben bitweise dasselbe
 * Kind.
 *
 * **Die Kopplung ist der Grund, warum hier ein Spektrum und kein Zufallsnebel
 * entsteht.** Jedes Element, das steigt, zieht ein anderes runter: Masse
 * kostet Tempo, Tempo kostet Härte, Härte kostet Masse. Ein Kind kann deshalb
 * nicht „alles stark" sein, und nach einer Mutation trägt es nicht immer
 * dieselbe Sache mit.
 *
 * **Die Zahlen sind `[K]`.** Kopplungsstärke, Mutationsdrift und Zahl der
 * vererbten Eigenschaften sind nicht abgenommen; die Kampfbalance ist laut
 * `docs/VISUAL_GRUNDSATZ.md` offen. Die Mechanik steht, die Zahlen nicht.
 */

/** Wie stark ein Element das gekoppelte Gegenstück bewegt, in Promille. */
const COUPLING_PERMILLE = 260

/** Element 0 (Masse) ↔ Element 1 (Tempo) ↔ Element 2 (Härte). */
const COUNTERPART: readonly [number, number, number] = [1, 2, 0]

/** Wie weit eine Mutation ein Element pro Zucht verschiebt, in Promille. */
const MUTATION_DRIFT = 120

/** Wie viele Eigenschaften ein Kind erbt, bevor mutiert wird. */
const INHERITED_PROPERTIES = 2

/**
 * Wendet die Kopplung auf die drei Elemente an.
 *
 * Sie läuft einmal über alle Achsen und benutzt dabei jeweils den Wert, der
 * nach der eigenen Korrektur dasteht. Dadurch begrenzt sich ein starker Vektor
 * selbst: Masse hoch zieht Tempo runter, und das nun niedrige Tempo lässt die
 * Härte nicht mehr so stark nach, wie sie es ohne die Kette täte.
 */
function couple(
  elements: readonly [number, number, number],
): [number, number, number] {
  const out: [number, number, number] = [elements[0], elements[1], elements[2]]
  for (let axis = 0; axis < 3; axis += 1) {
    const counter = COUNTERPART[axis]
    const delta = Math.trunc(
      ((out[axis] - ELEMENT_MIN) * COUPLING_PERMILLE) / 1000,
    )
    out[counter] = clampInt(out[counter] - delta, ELEMENT_MIN, ELEMENT_MAX)
  }
  return out
}

function mutateElements(
  elements: readonly [number, number, number],
  rng: RngState,
): [number, number, number] {
  const out: [number, number, number] = [elements[0], elements[1], elements[2]]
  for (let axis = 0; axis < 3; axis += 1) {
    const drift = nextRange(rng, -MUTATION_DRIFT, MUTATION_DRIFT)
    out[axis] = clampInt(out[axis] + drift, ELEMENT_MIN, ELEMENT_MAX)
  }
  return out
}

/** Die Achse, auf der ein Basis-Monster am stärksten ist. */
function strongestAxis(elements: readonly [number, number, number]): number {
  if (elements[0] >= elements[1] && elements[0] >= elements[2]) return 0
  return elements[1] >= elements[2] ? 1 : 2
}

/**
 * Mendelische Vererbung: das Kind zieht Eigenschaften aus dem Pool beider
 * Eltern und kann dabei von beiden Seiten etwas erben. Der Pool wird vorher
 * dedupliziert, damit ein Eltenteil mit derselben Eigenschaft doppelt keinen
 * doppelten Platz beansprucht.
 */
function inherit<T extends string>(
  rng: RngState,
  poolA: readonly T[],
  poolB: readonly T[],
): T[] {
  const all = [...new Set([...poolA, ...poolB])]
  const count = Math.min(INHERITED_PROPERTIES, all.length)
  const picked: T[] = []
  for (let i = 0; i < count; i += 1) {
    picked.push(all[nextBelow(rng, all.length)])
  }
  return [...new Set(picked)]
}

/** Züchtet ein Kind aus zwei Eltern. */
export function breed(
  parents: readonly [Genome, Genome],
  seed: number,
): Genome {
  const [a, b] = parents
  const rng = createRng(deriveSeed(seed, a.generation + b.generation, 0x9e37))
  const pick = (index: 0 | 1 | 2): number =>
    nextBelow(rng, 2) === 0 ? a.elements[index] : b.elements[index]

  let elements: [number, number, number] = [pick(0), pick(1), pick(2)]
  elements = couple(elements)
  elements = mutateElements(elements, rng)

  // Die Basisart folgt dem Eltenteil mit der stärkeren Leitachse. Das hält die
  // Palette erkennbar: ein Kind aus Frostwolf und Glutkolos wird nicht zu
  // einem Wesen ohne Eltern, sondern zu dem der beiden, das die Richtung
  // vorgibt.
  const axisA = strongestAxis(baseMonster(a.baseId).elements)
  const axisB = strongestAxis(baseMonster(b.baseId).elements)
  const parent =
    axisA === axisB ? (nextBelow(rng, 2) === 0 ? a : b) : axisA > axisB ? a : b

  return {
    baseId: parent.baseId,
    generation: Math.max(a.generation, b.generation) + 1,
    elements,
    traits: inherit<TraitId>(rng, a.traits, b.traits),
    bonuses: inherit<BonusId>(rng, a.bonuses, b.bonuses),
  }
}

/**
 * Mutiert ein bestehendes Genom ohne Kreuzung — der Weg, über den ein
 * Einzelmonster seine Eigenschaften weiterentwickelt.
 *
 * Höchstens eine Eigenschaft wird ersetzt. Wenn jede Zucht mehrere Bausteine
 * austauscht, zerfällt das Wesen über die Generationen hinweg in eine Sammlung
 * beliebiger Teile; der Ersatz bleibt selten genug, damit der Elternteil am
 * Ende noch erkennbar ist.
 *
 * Der Ersatz nimmt einen Wert, den das Genom **noch nicht** führt. Ohne diese
 * Bedingung wäre der Zufall der häufigste Auslöser für den Verlust einer
 * Eigenschaft — das Wesen hätte sie schon einmal verloren und gewinnt sie nie
 * zurück. Der Austausch ist damit eine Änderung, keine Reduktion.
 */
export function mutate(genome: Genome, seed: number): Genome {
  // Die Basisart geht als Salz in den Seed ein: dieselbe Basisart mutiert
  // gleich, zwei verschiedene Basisarten mit demselben Seed nicht.
  const salt = hashText(hashStart(), genome.baseId)
  const rng = createRng(deriveSeed(seed, genome.generation, salt))
  const elements = mutateElements(couple(genome.elements), rng)
  const roll = nextBelow(rng, 4)
  const traits = [...genome.traits]
  const bonuses = [...genome.bonuses]

  if (roll === 0) {
    const fresh = untaken(TRAIT_IDS, traits)
    if (fresh.length > 0 && traits.length > 0) {
      traits[nextBelow(rng, traits.length)] =
        fresh[nextBelow(rng, fresh.length)]
    }
  } else if (roll === 1) {
    const fresh = untaken(BONUS_IDS, bonuses)
    if (fresh.length > 0 && bonuses.length > 0) {
      bonuses[nextBelow(rng, bonuses.length)] =
        fresh[nextBelow(rng, fresh.length)]
    }
  }

  return {
    ...genome,
    generation: genome.generation + 1,
    elements,
    traits,
    bonuses,
  }
}

/**
 * Die Kandidaten, die das Genom noch nicht führt.
 *
 * Trägt das Genom bereits alle Werte, ist das Ergebnis leer — und dann wird
 * nichts getauscht, statt eine Eigenschaft zu verdoppeln oder zu löschen.
 */
function untaken<T extends string>(
  pool: readonly T[],
  current: readonly T[],
): readonly T[] {
  return pool.filter((id) => !current.includes(id))
}

/**
 * Das startklingende Genom eines Basis-Monsters: Generation 1, mit seiner
 * Basisart, seinen Basiswerten, Trait und Bonus.
 */
export function baseGenome(baseId: string): Genome {
  const base = baseMonster(baseId)
  return {
    baseId,
    generation: 1,
    elements: [base.elements[0], base.elements[1], base.elements[2]],
    traits: [base.trait],
    bonuses: [base.bonus],
  }
}
