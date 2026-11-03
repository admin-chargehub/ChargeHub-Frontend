import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "@/api/client";
import { OpsPage } from "@/ops/OpsDashboardPage";
import { PowerPanel } from "@/ops/PowerBadge";

export default function OpsStationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "stations"],
    queryFn: api.opsStations,
    refetchInterval: 20_000,
  });

  return (
    <OpsPage title="Stations" subtitle={data ? `${data.length} hubs` : undefined}>
      {isLoading && <div className="skeleton" style={{ height: 180 }} />}
      {error && <p className="error">{(error as Error).message}</p>}

      <div className="ops-list">
        {(data ?? []).map((s) => (
          <Link key={s.id} to={`/ops/stations/${s.id}`} className="card card-link">
            <div className="row-between ops-station-head">
              <span>
                <h2 className="ops-card-title">{s.name}</h2>
                <p className="muted small">{s.address}</p>
              </span>
              <span className="ops-counts">
                <strong>{s.outlets_available}</strong>
                <span className="muted small"> of {s.outlets_total} free</span>
                {s.outlets_faulty > 0 && (
                  <span className="pill pill-bad ops-count-pill">
                    {s.outlets_faulty} faulty
                  </span>
                )}
              </span>
            </div>
            <PowerPanel telemetry={s.telemetry} />
          </Link>
        ))}
      </div>
    </OpsPage>
  );
}
