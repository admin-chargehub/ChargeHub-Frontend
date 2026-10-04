import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "@/api/client";
import AppHeader from "@/components/AppHeader";
import { formatWhen } from "@/lib/format";

export default function BookingConfirmedPage() {
  const { bookingId = "" } = useParams();
  const navigate = useNavigate();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const booking = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api.getBooking(bookingId),
    enabled: Boolean(bookingId),
  });

  // Stands in for typing the PIN on the hub keypad. The endpoint it calls is
  // the station's, not the customer's — when the HGC exists this button goes
  // away and the firmware makes the same call.
  const redeem = useMutation({
    mutationFn: () => {
      const b = booking.data!;
      return api.redeemCode(b.station.slug, b.access_code!);
    },
    onSuccess: (session) => navigate(`/sessions/${session.id}`, { replace: true }),
    onError: (err) =>
      setRedeemError(err instanceof Error ? err.message : "Could not start the session"),
  });

  if (booking.isLoading) {
    return (
      <>
        <AppHeader title="Booking confirmed" backTo="/bookings" />
        <div className="screen">
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </>
    );
  }

  if (booking.error || !booking.data) {
    return (
      <>
        <AppHeader title="Booking" backTo="/bookings" />
        <div className="screen">
          <p className="error">{(booking.error as Error)?.message ?? "Booking not found"}</p>
        </div>
      </>
    );
  }

  const b = booking.data;

  async function sendPin() {
    if (!b.access_code) return;
    const text = `Your ChargeHub access code for outlet ${b.outlet.label ?? b.outlet.index} at ${b.station.name} is ${b.access_code}`;
    // navigator.share is a stopgap until an SMS gateway exists — it at least
    // makes the button real on day one. Both APIs need a secure context, so
    // over plain http on a LAN address this falls through to the notice.
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(b.access_code);
      setShareNote("Code copied to clipboard.");
    } catch {
      setShareNote("Couldn’t share automatically — note the code down.");
    }
  }

  return (
    <>
      <AppHeader title="Booking confirmed" backTo="/bookings" />

      <div className="screen">
        <section className="card center confirmed">
          <div className="confirmed-tick" aria-hidden="true">
            ✓
          </div>
          <h2>You’re booked</h2>
          <p className="muted">
            {b.station.name} · Outlet {b.outlet.label ?? b.outlet.index}
          </p>
        </section>

        <section className="card center">
          <p className="muted pin-label">Access PIN</p>
          {b.access_code ? (
            <p className="pin" aria-label={`Access code ${b.access_code.split("").join(" ")}`}>
              {b.access_code}
            </p>
          ) : (
            <p className="muted">This code has expired.</p>
          )}
          <p className="muted pin-help">Enter this on the hub keypad to start your session.</p>
        </section>

        <section className="card">
          <dl className="deflist">
            <div className="defrow">
              <dt>Start time</dt>
              <dd>{formatWhen(b.starts_at)}</dd>
            </div>
            <div className="defrow">
              <dt>End time</dt>
              <dd>{formatWhen(b.ends_at)}</dd>
            </div>
          </dl>
        </section>

        {shareNote && <p className="muted center note">{shareNote}</p>}
        {redeemError && (
          <p className="error center" role="alert">
            {redeemError}
          </p>
        )}
      </div>

      <div className="stickybar stack">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!b.access_code || redeem.isPending}
          onClick={() => {
            setRedeemError(null);
            redeem.mutate();
          }}
        >
          {redeem.isPending ? "Starting…" : "Start session at hub"}
        </button>
        <div className="row stickybar-row">
          <Link to="/bookings" className="btn btn-ghost grow">
            View My Booking
          </Link>
          <button
            type="button"
            className="btn btn-ghost grow"
            onClick={sendPin}
            disabled={!b.access_code}
          >
            Send PIN
          </button>
        </div>
        <p className="faint center stickybar-note">
          Stands in for entering the PIN on the hub keypad.
        </p>
      </div>
    </>
  );
}
