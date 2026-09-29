import { MONSTER_BEHAVIORS, type MonsterBehavior } from '@floor/contracts'
import type { TraitId } from './types'

/**
 * Das Verhaltensprofil eines Verteidigers.
 *
 * Das Profil ist **abgeleitet und nicht gesetzt**: es entsteht aus dem Trait der
 * Art, und der Trait ist Teil des vererbten Genoms. Wer eine Kreuzung züchtet,
 * deren Erbgut den Trait wechselt, erhält damit ein anderes Verhalten — das ist
 * der Unterschied zu einer festen Rollentabelle pro Spezies, die neben das Genom
 * gelegt würde und beim nächsten Mutationsschritt still danebenliefe.
 *
 * Die Profile ändern ausschließlich die **Zielentscheidung**, keine einzige
 * Kampfzahl. Damit hält sich der neue Slice an dieselbe Grenze, die die
 * Effektdateien einhalten: ein Trait, der gibt, nimmt dagegen. Die Zahlen der
 * Kampfbalance bleiben `[K]` und unberührt.
 *
 * `none` ist der Grundfall und nicht ein Platzhalter: Helden, Boss und Arten
 * ohne Profil greifen das nächste Ziel an — dieselbe Regel wie vor diesem
 * Slice. Ein Profil ohne Wirkung wäre ein Feld ohne Leser, deshalb steht hier
 * nur, was im Kampf wirklich einen anderen Zug wählt.
 *
 * **Die Liste selbst gehört dem Wire-Vertrag.** `MONSTER_BEHAVIORS` und der
 * daraus abgeleitete Typ kommen aus `@floor/contracts`, weil dieselben Werte
 * `CombatUnitSpecSchema` strikt prüft: zwei Definitionen wären zwei Wahrheiten,
 * und die Drift würde erst beim Upload auffallen. Die Kante `genome →
 * contracts` ist erlaubt (`modularity.allowed`); umgekehrt gilt sie nicht — der
 * Contract darf vom Core nicht abhängen.
 */
export { MONSTER_BEHAVIORS, type MonsterBehavior }

/**
 * Zuordnung Trait zu Verhalten — `[K]` und noch nicht abgenommen.
 *
 * Sie steht als Regel und nicht als Wertetabelle pro Art, weil die sechs Traits
 * genau sechs Verhaltenstypen sind und eine zweite Zuordnung daneben (etwa in
 * `roster-a.ts`) eine zweite Wahrheit über denselben Monstertypen wäre. Die
 * Prozentzahlen der Traits selbst sind unverändert `[K]` in ihren Dateien.
 *
 * Offen und bewusst **nicht** vergeben, solange die Mechanik dahinter fehlt:
 * `ambush` (der Hinterhalt hängt an der Platzierung in der Zone und nicht am
 * Erbgut, siehe `combat/actions.ts`), `support` (braucht die Fähigkeiten aus
 * T2.4) und `swarm` (braucht die Gruppe aus K4). Sobald eine dieser Mechaniken
 * gebaut ist, bekommt sie hier ihren Trait und ihren Eintrag im Log.
 */
const BEHAVIOR_BY_TRAIT: Record<TraitId, MonsterBehavior> = {
  // Die Haut hält und das Wesen bleibt stehen: es übernimmt die Fläche.
  toughHide: 'tank',
  heavyTread: 'tank',
  // Der scharfe Angriff sucht das schwache Glied der Kette.
  keenEdge: 'hunter',
  // Der ruhige, genaue Zug wählt das gefährlichste Ziel.
  focused: 'control',
  // Ungeduld und Ausdauer verändern das Tempo, nicht die Wahl.
  restless: 'none',
  deepLungs: 'none',
}

export function behaviorForTrait(trait: TraitId): MonsterBehavior {
  return BEHAVIOR_BY_TRAIT[trait]
}
