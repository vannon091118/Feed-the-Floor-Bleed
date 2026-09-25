export interface VillagePanelProps {
  village: string
  day: number
  workers: number
  attractiveness: number
  materials: number
}

export function VillagePanel({
  village,
  day,
  workers,
  attractiveness,
  materials,
}: VillagePanelProps) {
  return (
    <section className="panel village-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tag {day} · Bürgermeister</p>
          <h2>{village} wartet auf dich</h2>
        </div>
        <span className="status-pill status-pill--warm">Dorfplanung</span>
      </div>
      <div className="village-grid">
        <div className="village-card">
          <span className="metric-label">Arbeiter</span>
          <strong>{workers}</strong>
          <span>bereit für den nächsten Schichtwechsel</span>
        </div>
        <div className="village-card">
          <span className="metric-label">Attraktivität</span>
          <strong>{attractiveness}%</strong>
          <span>genug, um weitere Helden anzulocken</span>
        </div>
        <div className="village-card">
          <span className="metric-label">Material</span>
          <strong>{materials}</strong>
          <span>für Wände, Fallen und den nächsten Ausbau</span>
        </div>
      </div>
      <div className="briefing">
        <span className="briefing-mark">✦</span>
        <div>
          <strong>Abends wartet der Floor.</strong>
          <p>
            Stelle eine Route, locke die Helden hinein und entscheide, was du
            riskierst.
          </p>
        </div>
      </div>
    </section>
  )
}
