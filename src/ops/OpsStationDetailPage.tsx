import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, type OpsOutletOut, type OutletStatus } from "@/api/client";
import { OpsPage } from "@/ops/OpsDashboardPage";
import { PowerPanel, relativeTime } from "@/ops/PowerBadge";

/** Only the statuses the server will accept by hand — see Outlet.OPERATOR_SETTABLE. */
const SETTABLE: { value: OutletStatus; label: string; help: string }[] = [
  { value: "available", label: "Back in service", help: "Clears the recorded reason" },
  { value: "fault", label: "Faulty", help: "Broken — needs a technician" },
  { value: "maintenance", label: "Maintenance", help: "Deliberately out of service" },
  { value: "offline", label: "Offline", help: "Not responding to the gateway" },
];

export default function OpsStationDetailPage() {
  const { stationId = "" } = useParams();
  const [editing, setEditing] = useState<OpsOutletOut | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops", "station", stationId],
    queryFn: () => api.opsStation(stationId),
    enabled: Boolean(stationId),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <OpsPage title="Hub">
        <div className="skeleton" style={{ height: 200 }} />
      </OpsPage>
    );
  }
  if (error || !data) {
    return (
      <OpsPage title="Hub">
        <p className="error">{(error as Error)?.message ?? "Not found"}</p>
      </OpsPage>
    );
  }

  return (
    <OpsPage
      title={data.name}
      subtitle={data.address ?? undefined}
      action={
        <Link to="/ops/stations" className="btn btn-ghost btn-sm">
          All hubs
        </Link>
      }
    >
      <section className="card">
        <h2>Power</h2>
        <PowerPanel telemetry={data.telemetry} />
      </section>

      <section className="ops-section">
        <div className="row-between">
          <h2>
            Outlets{" "}
            <span className="muted">
              — {data.outlets_available} of {data.outlets_total} available
            </span>
          </h2>
        </div>

        <div className="ops-outlets">
          {data.outlets.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`opsoutlet opsoutlet-${o.status}`}
              onClick={() => setEditing(o)}
            >
              <span className="opsoutlet-label">{o.label ?? o.index}</span>
              <span className="opsoutlet-status">{o.status.replace("_", " ")}</span>
              {o.fault_reason && (
                <span className="opsoutlet-reason" title={o.fault_reason}>
                  {o.fault_reason}
                </span>
              )}
              {o.status_changed_at && (
                <span className="opsoutlet-since faint">
                  {relativeTime(o.status_changed_at)}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="faint small">Select an outlet to change its status.</p>
      </section>

      {editing && (
        <OutletDialog outlet={editing} onClose={() => setEditing(null)} />
      )}
    </OpsPage>
  );
}

function OutletDialog({
  outlet,
  onClose,
}: {
  outlet: OpsOutletOut;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OutletStatus>(
    outlet.status === "available" ? "fault" : "available",
  );
  const [reason, setReason] = useState(outlet.fault_reason ?? "");
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const outOfService = status !== "available";

  const save = useMutation({
    mutationFn: (force: boolean) =>
      api.opsSetOutlet(outlet.id, { status, reason: reason || null, force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops"] });
      onClose();
    },
    onError: (err) => {
      const text = err instanceof Error ? err.message : "Could not update";
      // A 409 means a live session is in the way. That is not a failure to
      // report and dismiss — it is a second, heavier decision to offer, so
      // the dialog stays open and changes what it is asking.
      if (/session is running/i.test(text)) {
        setConflict(true);
        setMessage(null);
      } else {
        setMessage(text);
      }
    },
  });

  return (
    <div
      className="ops-modal-wrap"
      role="dialog"
      aria-modal="true"
      aria-label={`Change status of ${outlet.label ?? outlet.index}`}
    >
      <div className="ops-modal card">
        <h2>Outlet {outlet.label ?? outlet.index}</h2>
        <p className="muted small">
          Currently <strong>{outlet.status.replace("_", " ")}</strong>
          {outlet.fault_reason && ` — ${outlet.fault_reason}`}
        </p>

        <div className="stack ops-modal-options">
          {SETTABLE.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={status === opt.value ? "plan plan-on" : "plan"}
              aria-pressed={status === opt.value}
              onClick={() => {
                setStatus(opt.value);
                setConflict(false);
              }}
            >
              <span className="grow">
                <span className="plan-name">{opt.label}</span>
                <span className="plan-sub muted">{opt.help}</span>
              </span>
            </button>
          ))}
        </div>

        {outOfService && (
          <label className="field">
            <span className="field-label">Reason</span>
            <input
              className="input"
              value={reason}
              maxLength={200}
              placeholder="What is wrong with it?"
              onChange={(e) => setReason(e.target.value)}
            />
            <span className="faint small">
              Required. The next person to look at this outlet sees only what you write
              here.
            </span>
          </label>
        )}

        {conflict && (
          <div className="ops-conflict" role="alert">
            <strong>Someone is charging on this outlet.</strong>
            <p className="small">
              Taking it out of service will end their session now. They paid a flat
              price, so ending early does not refund them — tell them first if you can.
            </p>
          </div>
        )}

        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}

        <div className="row ops-modal-actions">
          <button type="button" className="btn btn-ghost grow" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={conflict ? "btn btn-danger grow" : "btn btn-primary grow"}
            disabled={save.isPending || (outOfService && !reason.trim())}
            onClick={() => save.mutate(conflict)}
          >
            {save.isPending
              ? "Saving…"
              : conflict
                ? "End session and take offline"
                : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
