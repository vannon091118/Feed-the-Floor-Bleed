export interface StatsProps {
  rows: ReadonlyArray<readonly [string, string]>
}

/**
 * Beschriftete Wertzeilen.
 *
 * Ersetzt die offene Label-Wert-Liste der Fenster: feste Breite, Haarlinie
 * zwischen den Zeilen, tabellarische Ziffern. Reihenfolge bleibt Sache des
 * Aufrufers, das Layout nicht.
 */
export function Stats({ rows }: StatsProps) {
  return (
    <dl class="stats">
      {rows.map(([key, value]) => (
        <div class="stats__row" key={key}>
          <dt class="stats__key">{key}</dt>
          <dd class="stats__value">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
