import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/api/client";
import AppHeader from "@/components/AppHeader";
import { formatCountdown, formatEnergy, formatNaira, formatWhen } from "@/lib/format";
import { useCountdown } from "@/lib/useCountdown";

export default function ActiveSessionPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.getSession(sessionId),
    enabled: Boolean(sessionId),
    // Energy and status come from the server; the countdown runs locally so it
    // stays smooth between polls. Placeholder until the IoT Core feed exists.
    refetchInterval: 5_000,
  });

  const s = session.data;

  // Local tick, corrected against the server clock.
  const remaining = useCountdown(s?.ends_at ?? null, s?.server_now ?? null);

  const endSession = useMutation({
    mutationFn: () => api.endSession(sessionId),
    onSuccess: (ended) => {
      // Seed the cache with the response. Without this the receipt screen
      // renders the still-cached *running* session and shows a blank end time
      // and a generic reason until the next refetch.
      queryClient.setQueryData(["session", sessionId], ended);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["station"] });
      navigate(`/sessions/${sessionId}/ended`, { replace: true });
    },
  });

  // The server is the authority on whether it is over; if it ended while we
  // were watching, move on rather than showing a dead countdown.
  useEffect(() => {
    if (s && s.status === "completed") {
      navigate(`/sessions/${sessionId}/ended`, { replace: true });
    }
  }, [s, sessionId, navigate]);

  if (session.isLoading) {
    return (
      <>
        <AppHeader title="Active session" backTo="/bookings" />
        <div className="screen">
          <div className="skeleton" style={{ height: 260 }} />
        </div>
      </>
    );
  }

  if (session.error || !s) {
    return (
      <>
        <AppHeader title="Session" backTo="/bookings" />
        <div className="screen">
          <p className="error">{(session.error as Error)?.message ?? "Session not found"}</p>
        </div>
      </>
    );
  }

  const total = Math.max(
    1,
    (new Date(s.ends_at).getTime() - new Date(s.started_at).getTime()) / 1000,
  );
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));

  return (
    <>
      <AppHeader title="Active session" backTo="/bookings" />

      <div className="screen">
        <section className="card center">
          <div
            className="dial"
            style={{ ["--p" as string]: `${progress * 360}deg` }}
            role="timer"
            aria-label={`${formatCountdown(remaining)} remaining`}
          >
            <div className="dial-inner">
              <span className="dial-time">{formatCountdown(remaining)}</span>
              <span className="dial-cap muted">remaining</span>
            </div>
          </div>
          <p className="muted session-where">
            {s.station.name} · Outlet {s.outlet.label ?? s.outlet.index}
          </p>
        </section>

        <section className="card">
          <div className="metrics">
            <div className="metric">
              <span className="metric-value">{formatEnergy(s.energy_wh)}</span>
              <span className="metric-label muted">Energy used</span>
            </div>
            <div className="metric">
              <span className="metric-value">{s.power_w ?? 0} W</span>
              <span className="metric-label muted">Drawing now</span>
            </div>
            <div className="metric">
              <span className="metric-value">{formatNaira(s.cost_kobo)}</span>
              <span className="metric-label muted">Paid</span>
            </div>
          </div>
          {s.simulated && (
            <p className="faint note sim-note">
              Energy figures are simulated — no station hardware is connected yet.
            </p>
          )}
        </section>

        <section className="card">
          <dl className="deflist">
            <div className="defrow">
              <dt>Plan</dt>
              <dd>{s.plan_name}</dd>
            </div>
            <div className="defrow">
              <dt>Started</dt>
              <dd>{formatWhen(s.started_at)}</dd>
            </div>
            <div className="defrow">
              <dt>Ends</dt>
              <dd>{formatWhen(s.ends_at)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="stickybar">
        <button
          type="button"
          className="btn btn-danger btn-block"
          disabled={endSession.isPending}
          onClick={() => endSession.mutate()}
        >
          {endSession.isPending ? "Ending…" : "End Session"}
        </button>
        <p className="faint center stickybar-note">
          Ending early doesn’t refund — you paid a flat plan price.
        </p>
      </div>
    </>
  );
}
