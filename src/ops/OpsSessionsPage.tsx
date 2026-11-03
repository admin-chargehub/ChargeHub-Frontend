import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api, type OpsSessionOut } from "@/api/client";
import { formatCountdown, formatEnergy, formatNaira, formatWhen } from "@/lib/format";
import { OpsPage } from "@/ops/OpsDashboardPage";

export default function OpsSessionsPage() {
  const [activeOnly, setActiveOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "sessions", activeOnly],
    queryFn: () => api.opsSessions({ activeOnly }),
    refetchInterval: 10_000,
  });

  const endSession = useMutation({
    mutationFn: (id: string) => api.opsEndSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops"] }),
  });

  const live = (data ?? []).filter((s) => s.status === "active").length;

  return (
    <OpsPage
      title="Sessions"
      subtitle={data ? `${live} running now` : undefined}
      action={
        <div className="chips">
          <button
            type="button"
            className={activeOnly ? "chip" : "chip chip-on"}
            onClick={() => setActiveOnly(false)}
          >
            All
          </button>
          <button
            type="button"
            className={activeOnly ? "chip chip-on" : "chip"}
            onClick={() => setActiveOnly(true)}
          >
            Running
          </button>
        </div>
      }
    >
      {isLoading && <div className="skeleton" style={{ height: 160 }} />}
      {error && <p className="error">{(error as Error).message}</p>}

      {data && data.length === 0 && (
        <p className="muted">No sessions {activeOnly ? "running" : "yet"}.</p>
      )}

      <div className="ops-list">
        {(data ?? []).map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            onEnd={() => endSession.mutate(s.id)}
            ending={endSession.isPending && endSession.variables === s.id}
          />
        ))}
      </div>
    </OpsPage>
  );
}

function SessionRow({
  session: s,
  onEnd,
  ending,
}: {
  session: OpsSessionOut;
  onEnd: () => void;
  ending: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const running = s.status === "active";

  // Remaining time is derived from the server's clock, not the browser's, so
  // a laptop with a wrong time does not show an operator the wrong countdown.
  const remainingMs =
    new Date(s.ends_at).getTime() - new Date(s.server_now).getTime();

  return (
    <div className="card ops-row ops-session">
      <span className={`pill pill-${running ? "ok" : "off"}`}>
        {running ? "Running" : (s.end_reason ?? "ended").replace(/_/g, " ")}
      </span>

      <span className="grow">
        <strong>
          {s.station_name} · {s.outlet_label}
        </strong>
        <span className="muted small block">
          {s.customer_name} · {s.customer_email}
          {s.customer_phone && ` · ${s.customer_phone}`}
        </span>
        <span className="faint small block">
          Started {formatWhen(s.started_at)}
          {s.ended_at && ` · ended ${formatWhen(s.ended_at)}`}
        </span>
      </span>

      <span className="ops-session-stats">
        {running && (
          <span className="ops-session-clock">
            {remainingMs > 0 ? formatCountdown(remainingMs / 1000) : "overdue"}
          </span>
        )}
        <span className="muted small">
          {formatEnergy(s.energy_wh)}
          {running && s.power_w != null && ` · ${s.power_w} W`}
        </span>
        <span className="muted small block">{formatNaira(s.cost_kobo)}</span>
      </span>

      {running &&
        (confirming ? (
          <span className="row ops-confirm">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={ending}
              onClick={onEnd}
            >
              {ending ? "Ending…" : "Confirm"}
            </button>
          </span>
        ) : (
          // Two taps, because this cuts power to something somebody is using
          // and there is no undo.
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirming(true)}
          >
            End
          </button>
        ))}
    </div>
  );
}
