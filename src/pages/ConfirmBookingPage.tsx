import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { api } from "@/api/client";
import AppHeader from "@/components/AppHeader";
import { clearDraft, readDraft } from "@/booking/draft";
import { formatDuration, formatNaira, formatWhen } from "@/lib/format";

export default function ConfirmBookingPage() {
  const draft = readDraft();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const station = useQuery({
    queryKey: ["station", draft?.stationId],
    queryFn: () => api.getStation(draft!.stationId),
    enabled: Boolean(draft?.stationId),
  });

  const plans = useQuery({ queryKey: ["plans"], queryFn: api.listPlans });

  const plan = plans.data?.find((p) => p.id === draft?.planId);
  const outlet = station.data?.outlets.find((o) => o.id === draft?.outletId);

  // Pinned on first render so the displayed window doesn't creep while the
  // user reads. The server derives the real one from the plan on submit.
  const startsAt = useMemo(() => new Date(), []);
  const endsAt = plan
    ? new Date(startsAt.getTime() + plan.max_duration_minutes * 60_000)
    : null;

  const checkout = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nothing to book");
      // Two calls, deliberately: a real gateway confirms out of band, so the
      // flow is shaped for that from the start rather than assuming payment
      // is synchronous. The mock provider just happens to answer immediately.
      const booking = await api.createBooking(
        { outlet_id: draft.outletId, plan_id: draft.planId },
        draft.idempotencyKey,
      );
      return api.payBooking(booking.id);
    },
    onSuccess: (booking) => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["station"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate(`/bookings/${booking.id}/confirmed`, { replace: true });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Payment failed"),
  });

  if (!draft) return <Navigate to="/" replace />;

  if (station.isLoading || plans.isLoading) {
    return (
      <>
        <AppHeader title="Confirm booking" />
        <div className="screen">
          <div className="skeleton" style={{ height: 220 }} />
        </div>
      </>
    );
  }

  if (!plan || !outlet || !station.data) {
    return (
      <>
        <AppHeader title="Confirm booking" backTo="/" />
        <div className="screen">
          <p className="error">That outlet or plan is no longer available.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Confirm booking" backTo={`/hubs/${draft.stationId}`} />

      <div className="screen screen-split">
        <div className="split-head">
          <h1 className="split-title">Confirm booking</h1>
          <p className="muted">Check the details, then pay to reserve the outlet.</p>
        </div>

        <section className="card">
          <h2>Booking summary</h2>
          <dl className="deflist">
            <div className="defrow">
              <dt>Hub</dt>
              <dd>{station.data.name}</dd>
            </div>
            <div className="defrow">
              <dt>Outlet</dt>
              <dd>{outlet.label ?? outlet.index}</dd>
            </div>
            <div className="defrow">
              <dt>Plan</dt>
              <dd>
                {plan.name} ({formatDuration(plan.max_duration_minutes)})
              </dd>
            </div>
            <div className="defrow">
              <dt>Start time</dt>
              <dd>{formatWhen(startsAt.toISOString())}</dd>
            </div>
            <div className="defrow">
              <dt>End time</dt>
              <dd>{endsAt && formatWhen(endsAt.toISOString())}</dd>
            </div>
            <div className="defrow defrow-total">
              <dt>Total</dt>
              <dd>{formatNaira(plan.price_kobo)}</dd>
            </div>
          </dl>
        </section>

        <div className="split-side">
          <section className="card">
            <h2>Payment method</h2>
            <div className="row paymethod">
              <span className="paymethod-badge" aria-hidden="true">
                TEST
              </span>
              <span className="grow">
                <span className="paymethod-name">Demo payment</span>
                <span className="muted paymethod-sub">
                  No card is charged. Card payment arrives with Paystack.
                </span>
              </span>
            </div>
          </section>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="stickybar">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={checkout.isPending}
              onClick={() => {
                setError(null);
                checkout.mutate();
              }}
            >
              {checkout.isPending
                ? "Processing…"
                : `Pay ${formatNaira(plan.price_kobo)} & Book`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
