import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { api, type SessionOut } from "@/api/client";
import AppHeader from "@/components/AppHeader";
import { formatCountdown, formatEnergy, formatNaira, formatWhen } from "@/lib/format";

function reasonLabel(reason: SessionOut["end_reason"]): string {
  switch (reason) {
    case "time_expired":
      return "Your booked time ran out.";
    case "user_ended":
      return "You ended this session.";
    case "energy_cap":
      return "You used all the energy in your plan.";
    case "power_cap":
      return "The outlet tripped — the device drew more than the plan allows.";
    case "idle_timeout":
      return "Nothing was drawing power, so the outlet was released.";
    case "fault":
      return "The session stopped because of a fault at the hub.";
    case "operator_ended":
      return "An operator ended this session.";
    default:
      return "This session has ended.";
  }
}

export default function SessionEndedPage() {
  const { sessionId = "" } = useParams();

  const session = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.getSession(sessionId),
    enabled: Boolean(sessionId),
  });

  if (session.isLoading) {
    return (
      <>
        <AppHeader title="Session ended" backTo="/bookings" />
        <div className="screen">
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </>
    );
  }

  if (session.error || !session.data) {
    return (
      <>
        <AppHeader title="Session" backTo="/bookings" />
        <div className="screen">
          <p className="error">{(session.error as Error)?.message ?? "Session not found"}</p>
        </div>
      </>
    );
  }

  const s = session.data;

  return (
    <>
      <AppHeader title="Session ended" backTo="/bookings" />

      <div className="screen">
        <section className="card center confirmed">
          <div className="confirmed-tick" aria-hidden="true">
            ✓
          </div>
          <h2>Thank you</h2>
          <p className="muted">{reasonLabel(s.end_reason)}</p>
        </section>

        <section className="card">
          <h2>Receipt</h2>
          <dl className="deflist">
            <div className="defrow">
              <dt>Hub</dt>
              <dd>{s.station.name}</dd>
            </div>
            <div className="defrow">
              <dt>Outlet</dt>
              <dd>{s.outlet.label ?? s.outlet.index}</dd>
            </div>
            <div className="defrow">
              <dt>Plan</dt>
              <dd>{s.plan_name}</dd>
            </div>
            <div className="defrow">
              <dt>Started</dt>
              <dd>{formatWhen(s.started_at)}</dd>
            </div>
            <div className="defrow">
              <dt>Ended</dt>
              <dd>{s.ended_at ? formatWhen(s.ended_at) : "—"}</dd>
            </div>
            <div className="defrow">
              <dt>Duration</dt>
              <dd>{formatCountdown(s.elapsed_seconds)}</dd>
            </div>
            <div className="defrow">
              <dt>Energy used</dt>
              <dd>{formatEnergy(s.energy_wh)}</dd>
            </div>
            <div className="defrow defrow-total">
              <dt>Paid</dt>
              <dd>{formatNaira(s.cost_kobo)}</dd>
            </div>
          </dl>

          {/* Flat prepaid: the plan price is the price, whatever the meter
              says. The Figma shows ₦1,000 charged and a ₦425 "total cost",
              which would imply metered billing with a refund — a different
              product, and a P4 decision. Stating it plainly beats implying a
              refund that isn't coming. */}
          <p className="faint note">
            You paid a flat price for this plan. Energy used is shown for your
            information and doesn’t change what you were charged.
          </p>
          {s.simulated && (
            <p className="faint note">
              Energy figures are simulated — no station hardware is connected yet.
            </p>
          )}
        </section>
      </div>

      <div className="stickybar stack">
        <Link to="/" className="btn btn-primary btn-block">
          Book another outlet
        </Link>
        <Link to="/bookings" className="btn btn-ghost btn-block">
          View My Bookings
        </Link>
      </div>
    </>
  );
}
