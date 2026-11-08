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

  const extend = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      api.opsExtendSession(id, minutes),
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
            onExtend={(minutes) => extend.mutate({ id: s.id, minutes })}
            extendError={
              extend.variables?.id === s.id && extend.error
                ? (extend.error as Error).message
                : null
            }
          />
        ))}
      </div>
    </OpsPage>
  );
}

/**
 * What to show as a way of contacting this customer.
 *
 * Walk-ins booked at the counter get a synthetic address on .invalid, which
 * exists only to satisfy the unique-email constraint. Printing it would show
 * the operator a mailbox that cannot receive anything and looks like a bug.
 */
function contactFor(s: OpsSessionOut): string {
  if (s.customer_phone) return ` · ${s.customer_phone}`;
  if (s.customer_email.endsWith(".invalid")) return " · booked at the counter";
  return ` · ${s.customer_email}`;
}

function SessionRow({
  session: s,
  onEnd,
  ending,
  onExtend,
  extendError,
}: {
  session: OpsSessionOut;
  onEnd: () => void;
  ending: boolean;
  onExtend: (minutes: number) => void;
  extendError: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [extending, setExtending] = useState(false);
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
          {s.customer_name}
          {contactFor(s)}
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

      {running && !confirming && !extending && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setExtending(true)}
        >
          Extend
        </button>
      )}

      {running && extending && (
        <span className="row ops-confirm">
          {/* Fixed amounts rather than a free-text field: at a counter with
              somebody waiting, "+15" is one tap and a typed number is three
              and a mistake. */}
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              className="chip"
              onClick={() => {
                onExtend(m);
                setExtending(false);
              }}
            >
              +{m}m
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExtending(false)}
          >
            Cancel
          </button>
        </span>
      )}

      {extendError && (
        <span className="error small ops-extend-error" role="alert">
          {extendError}
        </span>
      )}

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
          !extending && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirming(true)}
            >
              End
            </button>
          )
        ))}
    </div>
  );
}
