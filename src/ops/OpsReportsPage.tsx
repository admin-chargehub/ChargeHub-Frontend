import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/api/client";
import { formatEnergy, formatNaira } from "@/lib/format";
import { OpsPage } from "@/ops/OpsDashboardPage";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export default function OpsReportsPage() {
  const [days, setDays] = useState(7);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "reports", days],
    queryFn: () => api.opsReports(days),
  });

  return (
    <OpsPage
      title="Reports"
      action={
        <div className="chips">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={days === r.days ? "chip chip-on" : "chip"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading && <div className="skeleton" style={{ height: 240 }} />}
      {error && <p className="error">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="ops-kpis">
            <Kpi label="Sessions" value={String(data.sessions)} />
            <Kpi label="Energy delivered" value={formatEnergy(data.energy_wh)} />
            <Kpi label="Revenue" value={formatNaira(data.revenue_kobo)} />
            <Kpi
              label="CO₂ avoided"
              value={`${data.impact.kg_co2_avoided.toFixed(1)} kg`}
              sub="estimate"
            />
          </div>

          <section className="card">
            <h2>Against a generator</h2>
            <p className="muted small">
              What this much energy would have cost to produce with a petrol generator.
            </p>
            <div className="ops-impact">
              <Figure
                value={`${data.impact.litres_displaced.toFixed(1)} L`}
                label="Fuel not burned"
              />
              <Figure
                value={formatNaira(data.impact.naira_fuel_avoided * 100)}
                label="Fuel cost avoided"
              />
              <Figure
                value={`${data.impact.kg_co2_avoided.toFixed(1)} kg`}
                label="CO₂ avoided"
              />
            </div>
            {/* The assumptions travel with the figures from the API, so the
                number cannot be screenshotted into a deck without them. */}
            <p className="faint small ops-assumptions">{data.impact.assumptions}</p>
          </section>

          <section className="ops-section">
            <h2>Daily</h2>
            <DailyChart series={data.series} />
            <p className="faint small">{data.timezone_note}</p>
          </section>

          <section className="ops-section">
            <h2>By hub</h2>
            <div className="ops-table" role="table">
              <div className="ops-tr ops-th" role="row">
                <span role="columnheader">Hub</span>
                <span role="columnheader">Sessions</span>
                <span role="columnheader">Energy</span>
                <span role="columnheader">Revenue</span>
              </div>
              {data.by_station.map((s) => (
                <div key={s.station_id} className="ops-tr" role="row">
                  <span role="cell">{s.name}</span>
                  <span role="cell">{s.sessions}</span>
                  <span role="cell">{formatEnergy(s.energy_wh)}</span>
                  <span role="cell">{formatNaira(s.revenue_kobo)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </OpsPage>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <span className="ops-figure">
      <span className="ops-figure-value">{value}</span>
      <span className="muted small">{label}</span>
    </span>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card kpi">
      <span className="kpi-value">{value}</span>
      <span className="kpi-label muted">{label}</span>
      {sub && <span className="kpi-sub faint">{sub}</span>}
    </div>
  );
}

/**
 * Revenue per day as plain divs rather than a charting library.
 *
 * Four bars of CSS do not justify 40 KB of dependency, and this one has a
 * table underneath it: the chart is the glance, the numbers are the answer.
 */
function DailyChart({
  series,
}: {
  series: { day: string; sessions: number; energy_wh: number; revenue_kobo: number }[];
}) {
  const peak = Math.max(1, ...series.map((d) => d.revenue_kobo));

  return (
    <div className="chart" role="img" aria-label="Revenue per day">
      {series.map((d) => (
        <span key={d.day} className="chart-col">
          <span className="chart-bar-track">
            <span
              className={d.revenue_kobo ? "chart-bar" : "chart-bar chart-bar-zero"}
              style={{ height: `${(d.revenue_kobo / peak) * 100}%` }}
              title={`${d.day}: ${d.sessions} sessions, ${formatNaira(d.revenue_kobo)}`}
            />
          </span>
          <span className="chart-label faint">{d.day.slice(5)}</span>
        </span>
      ))}
    </div>
  );
}
