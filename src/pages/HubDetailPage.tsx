import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, type OutletOut } from "@/api/client";
import AppHeader from "@/components/AppHeader";
import { writeDraft } from "@/booking/draft";
import { formatDuration, formatNaira } from "@/lib/format";

/** Only an outlet that is free right now can be picked. */
function isSelectable(o: OutletOut): boolean {
  return o.status === "available";
}

function outletClass(o: OutletOut, selected: boolean): string {
  const state =
    o.status === "available"
      ? "outlet-free"
      : o.status === "in_use" || o.status === "reserved"
        ? "outlet-busy"
        : o.status === "fault" || o.status === "offline"
          ? "outlet-fault"
          : "outlet-maint";
  return `outlet ${state}${selected ? " outlet-on" : ""}`;
}

export default function HubDetailPage() {
  const { stationId = "" } = useParams();
  const navigate = useNavigate();

  const [outletId, setOutletId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  const station = useQuery({
    queryKey: ["station", stationId],
    queryFn: () => api.getStation(stationId),
    enabled: Boolean(stationId),
    // Outlet status changes as people plug in. Polling is the placeholder
    // until the IoT Core feed exists; the design doc targets <2 s.
    refetchInterval: 10_000,
  });

  const plans = useQuery({ queryKey: ["plans"], queryFn: api.listPlans });

  if (station.isLoading) {
    return (
      <>
        <AppHeader backTo="/" />
        <div className="screen">
          <div className="skeleton" style={{ height: 140 }} />
        </div>
      </>
    );
  }

  if (station.error || !station.data) {
    return (
      <>
        <AppHeader backTo="/" title="Hub" />
        <div className="screen">
          <p className="error">{(station.error as Error)?.message ?? "Hub not found"}</p>
        </div>
      </>
    );
  }

  const s = station.data;
  const ready = outletId !== null && planId !== null;

  function onContinue() {
    if (!outletId || !planId) return;
    writeDraft({ stationId, outletId, planId });
    navigate("/book/confirm");
  }

  return (
    <>
      <AppHeader backTo="/" title={s.name} />

      <div className="screen screen-split">
        <div className="split-head">
          <h1 className="split-title">{s.name}</h1>
          {s.address && <p className="muted">{s.address}</p>}
          <p className="stat">
            <strong>{s.outlets_free_now}</strong> of <strong>{s.outlets_total}</strong>{" "}
            outlets available
          </p>
        </div>

        <section className="card">
          <h2>Select outlet</h2>
          <div className="outlets">
            {s.outlets.map((o) => {
              const selectable = isSelectable(o);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={outletClass(o, o.id === outletId)}
                  disabled={!selectable}
                  aria-pressed={o.id === outletId}
                  onClick={() => setOutletId(o.id)}
                >
                  <span className="outlet-label">{o.label ?? o.index}</span>
                  <span className="outlet-status">{o.status.replace("_", " ")}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="split-side">
          <section className="card">
            <h2>Select plan</h2>

            {plans.isLoading && <div className="skeleton" style={{ height: 160 }} />}
            {plans.error && <p className="error">{(plans.error as Error).message}</p>}

            <div className="stack">
              {(plans.data ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={p.id === planId ? "plan plan-on" : "plan"}
                  aria-pressed={p.id === planId}
                  onClick={() => setPlanId(p.id)}
                >
                  <span className="grow">
                    <span className="plan-name">{p.name}</span>
                    {p.recommended_devices && (
                      <span className="plan-sub muted">{p.recommended_devices}</span>
                    )}
                  </span>
                  <span className="plan-price">
                    {formatNaira(p.price_kobo)}
                    <span className="plan-per muted">
                      /{formatDuration(p.max_duration_minutes)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="stickybar">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!ready}
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
