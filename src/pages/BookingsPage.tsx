import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api, type BookingOut } from "@/api/client";
import { BookingsIcon } from "@/components/icons";
import { formatNaira, formatWhen } from "@/lib/format";

function statusPill(status: BookingOut["status"]): { cls: string; label: string } {
  switch (status) {
    case "confirmed":
      return { cls: "pill pill-ok", label: "Ready" };
    case "active":
      return { cls: "pill pill-ok", label: "In progress" };
    case "pending":
      return { cls: "pill pill-busy", label: "Awaiting payment" };
    case "completed":
      return { cls: "pill", label: "Completed" };
    default:
      return { cls: "pill pill-off", label: status };
  }
}

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.listBookings,
  });

  return (
    <div className="screen screen-tabbed">
      <h1>Bookings</h1>

      {isLoading && (
        <div className="stack" aria-hidden="true">
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
        </div>
      )}

      {error && <p className="error">{(error as Error).message}</p>}

      {!isLoading && !error && (data ?? []).length === 0 && (
        <div className="card empty">
          <div className="empty-art" aria-hidden="true">
            <BookingsIcon />
          </div>
          <h2>No bookings yet</h2>
          <p className="muted">Find a hub and book an outlet to get started.</p>
          <Link to="/" className="btn btn-primary">
            Find a Hub
          </Link>
        </div>
      )}

      <div className="stack">
        {(data ?? []).map((b) => {
          const pill = statusPill(b.status);
          return (
            <Link
              key={b.id}
              to={`/bookings/${b.id}/confirmed`}
              className="card card-link"
            >
              <div className="row-between">
                <h2 className="hubcard-name">{b.station.name}</h2>
                <span className={pill.cls}>{pill.label}</span>
              </div>
              <p className="muted hubcard-addr">
                Outlet {b.outlet.label ?? b.outlet.index} · {b.plan.name}
              </p>
              <div className="row-between hubcard-foot">
                <span className="muted">{formatWhen(b.starts_at)}</span>
                <strong>{formatNaira(b.amount_kobo)}</strong>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
