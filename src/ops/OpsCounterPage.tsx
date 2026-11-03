import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api, type PaymentMethod, type WalkInOut } from "@/api/client";
import { CheckIcon } from "@/components/icons";
import { formatAccessCode, formatDuration, formatNaira, formatWhen } from "@/lib/format";
import { OpsPage } from "@/ops/OpsDashboardPage";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "ussd", label: "USSD" },
  { value: "card", label: "Card" },
];

/**
 * The counter: booking somebody in who is standing in front of you.
 *
 * This is the screen the console was missing. Everything else an operator
 * had could only watch what the app was already doing; the pilot is a kiosk
 * on a campus where people turn up with cash and a phone that has no data,
 * and until this existed there was no way to serve them at all.
 */
export default function OpsCounterPage() {
  const queryClient = useQueryClient();
  const [stationId, setStationId] = useState<string>("");
  const [outletId, setOutletId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [receipt, setReceipt] = useState<WalkInOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stations = useQuery({ queryKey: ["ops", "stations"], queryFn: api.opsStations });
  const plans = useQuery({ queryKey: ["plans"], queryFn: api.listPlans });
  const station = useQuery({
    queryKey: ["ops", "station", stationId],
    queryFn: () => api.opsStation(stationId),
    enabled: Boolean(stationId),
  });

  const book = useMutation({
    mutationFn: () =>
      api.opsWalkIn({
        outlet_id: outletId,
        plan_id: planId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: null,
        payment_method: method,
      }),
    onSuccess: (result) => {
      setReceipt(result);
      setError(null);
      setName("");
      setPhone("");
      setOutletId("");
      queryClient.invalidateQueries({ queryKey: ["ops"] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not take this booking"),
  });

  const freeOutlets = (station.data?.outlets ?? []).filter(
    (o) => o.status === "available",
  );
  const ready = outletId && planId && name.trim();

  if (receipt) {
    return (
      <OpsPage title="Counter">
        <section className="card receipt">
          <span className="receipt-tick" aria-hidden="true">
            <CheckIcon />
          </span>
          <h2>Booked</h2>
          <p className="muted">
            {receipt.customer_name}
            {receipt.customer_phone && ` · ${receipt.customer_phone}`}
            {receipt.new_customer && " · new customer"}
          </p>

          {/* The operator reads this out or writes it on a slip. It is shown
              once — there is no screen that can show it again, by design. */}
          <div className="receipt-code">
            <span className="receipt-code-label muted">Access PIN</span>
            <strong>{formatAccessCode(receipt.access_code)}</strong>
          </div>

          <dl className="deflist">
            <div className="defrow">
              <dt>Hub</dt>
              <dd>
                {receipt.station_name} · {receipt.outlet_label}
              </dd>
            </div>
            <div className="defrow">
              <dt>Valid until</dt>
              <dd>{formatWhen(receipt.ends_at)}</dd>
            </div>
            <div className="defrow defrow-total">
              <dt>Taken ({receipt.payment_method})</dt>
              <dd>{formatNaira(receipt.amount_kobo)}</dd>
            </div>
          </dl>

          <p className="faint small">
            Write this PIN down before leaving this screen. It cannot be shown again.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => setReceipt(null)}
          >
            Next customer
          </button>
        </section>
      </OpsPage>
    );
  }

  return (
    <OpsPage title="Counter" subtitle="Book someone in and take payment">
      <section className="card counter">
        <label className="field">
          <span className="field-label">Hub</span>
          <select
            className="input"
            value={stationId}
            onChange={(e) => {
              setStationId(e.target.value);
              setOutletId("");
            }}
          >
            <option value="">Choose a hub…</option>
            {(stations.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.outlets_available} free
              </option>
            ))}
          </select>
        </label>

        {stationId && (
          <div className="field">
            <span className="field-label">Outlet</span>
            {freeOutlets.length === 0 ? (
              <p className="muted small">
                Nothing free at this hub right now.
              </p>
            ) : (
              <div className="chips">
                {freeOutlets.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={o.id === outletId ? "chip chip-on" : "chip"}
                    onClick={() => setOutletId(o.id)}
                  >
                    {o.label ?? o.index}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="field">
          <span className="field-label">Plan</span>
          <div className="stack">
            {(plans.data ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                className={p.id === planId ? "plan plan-on" : "plan"}
                onClick={() => setPlanId(p.id)}
              >
                <span className="grow">
                  <span className="plan-name">{p.name}</span>
                  <span className="plan-sub muted">
                    {formatDuration(p.max_duration_minutes)}
                  </span>
                </span>
                <span className="plan-price">{formatNaira(p.price_kobo)}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Customer name</span>
          <input
            className="input"
            value={name}
            maxLength={120}
            placeholder="Who is this for?"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Phone (optional)</span>
          <input
            className="input"
            value={phone}
            maxLength={32}
            inputMode="tel"
            placeholder="08031234567"
            onChange={(e) => setPhone(e.target.value)}
          />
          <span className="faint small">
            How we recognise them next time. Leave blank if they would rather not.
          </span>
        </label>

        <div className="field">
          <span className="field-label">Payment</span>
          <div className="chips">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={method === m.value ? "chip chip-on" : "chip"}
                onClick={() => setMethod(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!ready || book.isPending}
          onClick={() => book.mutate()}
        >
          {book.isPending ? "Booking…" : "Take payment and issue PIN"}
        </button>
      </section>
    </OpsPage>
  );
}
