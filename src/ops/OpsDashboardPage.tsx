import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "@/api/client";
import { WarnIcon } from "@/components/icons";
import { formatEnergy, formatNaira, formatWhen } from "@/lib/format";
import { formatMinutes, PowerBadge, relativeTime } from "@/ops/PowerBadge";

export default function OpsDashboardPage() {
  // One request, polled. The dashboard is a wall display as much as a page —
  // somebody leaves it open on a second monitor — so it refreshes itself
  // rather than waiting to be reloaded.
  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "dashboard"],
    queryFn: api.opsDashboard,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <OpsPage title="Dashboard">
        <div className="ops-kpis">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 92 }} />
          ))}
        </div>
      </OpsPage>
    );
  }

  if (error || !data) {
    return (
      <OpsPage title="Dashboard">
        <p className="error">{(error as Error)?.message ?? "Could not load"}</p>
      </OpsPage>
    );
  }

  const o = data.overview;
  const generatorSites = data.stations.filter(
    (s) => s.telemetry?.generator_running,
  ).length;

  return (
    <OpsPage
      title="Dashboard"
      subtitle={`${o.stations_online} of ${o.stations_total} hubs reporting`}
    >
      <div className="ops-kpis">
        <Kpi label="Active sessions" value={String(o.sessions_active)} />
        <Kpi
          label="Outlets available"
          value={`${o.outlets_available}/${o.outlets_total}`}
          sub={`${o.outlets_in_use} in use`}
        />
        <Kpi label="Revenue today" value={formatNaira(o.revenue_today_kobo)} />
        <Kpi label="Energy today" value={formatEnergy(o.energy_today_wh)} />
      </div>

      {/* Generator runtime is the number that turns into a fuel bill, so it
          gets its own line rather than sitting in a grid of four. */}
      {o.generator_minutes_today > 0 && (
        <div className="card ops-alert">
          <WarnIcon className="ops-alert-icon" />
          <span>
            <strong>
              {formatMinutes(o.generator_minutes_today)} of generator runtime today
            </strong>
            {/* Runtime is cumulative for the day; generatorSites is right now.
                Saying "across 0 hubs" of a non-zero total reads as a bug, so
                the two facts are stated separately. */}
            <span className="muted">
              {generatorSites > 0
                ? ` · ${generatorSites} ${generatorSites === 1 ? "hub is" : "hubs are"} running one now.`
                : " · none running right now."}{" "}
              Every minute here is diesel the solar array did not cover.
            </span>
          </span>
        </div>
      )}

      {data.attention.length > 0 && (
        <section className="ops-section">
          <h2>Needs attention</h2>
          <div className="ops-list">
            {data.attention.map((a) => (
              <Link
                key={a.outlet_id}
                to={`/ops/stations/${a.station_id}`}
                className="card card-link ops-row"
              >
                <span className={`pill pill-${a.status === "fault" ? "bad" : "warn"}`}>
                  {a.status}
                </span>
                <span className="grow">
                  <strong>
                    {a.station_name} · {a.outlet_label}
                  </strong>
                  <span className="muted small block">
                    {a.reason ?? "No reason recorded"}
                    {a.since && ` · since ${relativeTime(a.since)}`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="ops-section">
        <h2>Hubs</h2>
        <div className="ops-grid">
          {data.stations.map((s) => (
            <Link key={s.id} to={`/ops/stations/${s.id}`} className="card card-link">
              <div className="row-between">
                <h3 className="ops-card-title">{s.name}</h3>
                {s.telemetry && <PowerBadge source={s.telemetry.source} />}
              </div>
              <p className="muted small">{s.address}</p>

              <div className="ops-meters">
                <Meter
                  label="Available"
                  value={s.outlets_available}
                  total={s.outlets_total}
                />
                <span className="muted small">
                  {s.outlets_in_use} in use
                  {s.outlets_faulty > 0 && ` · ${s.outlets_faulty} faulty`}
                </span>
              </div>

              {s.telemetry && !s.telemetry.is_online && (
                <p className="pill pill-bad ops-offline">
                  Offline · last seen {relativeTime(s.telemetry.last_seen_at)}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="ops-section">
        <h2>Expected next</h2>
        {data.upcoming.length === 0 ? (
          <p className="muted">No confirmed bookings waiting to be redeemed.</p>
        ) : (
          <div className="ops-list">
            {data.upcoming.slice(0, 6).map((b) => (
              <div key={b.id} className="card ops-row">
                <span className="grow">
                  <strong>{b.customer_name}</strong>
                  <span className="muted small block">
                    {b.station_name} · {b.outlet_label}
                  </span>
                </span>
                <span className="ops-row-right">
                  <span className="small">{formatWhen(b.starts_at)}</span>
                  <span className="muted small block">{formatNaira(b.amount_kobo)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </OpsPage>
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

function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="meterline">
      <span className="small">
        {label} <strong>{value}</strong>/{total}
      </span>
      <span className="meterbar" aria-hidden="true">
        <span className="meterbar-fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

export function OpsPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="ops-head">
        <span>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </span>
        {action}
      </header>
      {children}
    </>
  );
}
