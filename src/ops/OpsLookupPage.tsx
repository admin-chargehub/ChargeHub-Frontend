import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { api, type LookupOut } from "@/api/client";
import { formatAccessCode, formatNaira, formatWhen } from "@/lib/format";
import { OpsPage } from "@/ops/OpsDashboardPage";

/** How a code state reads as a pill. */
const STATE_TONE: Record<string, string> = {
  valid: "ok",
  "already used": "off",
  expired: "bad",
  "not valid yet": "warn",
};

/**
 * "Somebody is at the counter holding a PIN and no idea what it is."
 *
 * Resolved by hash the same way the keypad resolves it, so a code this page
 * calls valid is a code that will actually open a socket — rather than one
 * that looks fine here and fails in front of the customer.
 */
export default function OpsLookupPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<LookupOut | null | undefined>(undefined);
  const [refundOpen, setRefundOpen] = useState(false);

  const search = useMutation({
    mutationFn: () => api.opsLookup(code),
    onSuccess: (found) => {
      setResult(found);
      setRefundOpen(false);
    },
  });

  return (
    <OpsPage title="Find a PIN" subtitle="Who does this code belong to?">
      <section className="card">
        <label className="field">
          <span className="field-label">Access PIN</span>
          <input
            className="input lookup-input"
            value={code}
            inputMode="numeric"
            maxLength={16}
            placeholder="12345-67890"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.trim()) search.mutate();
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!code.trim() || search.isPending}
          onClick={() => search.mutate()}
        >
          {search.isPending ? "Looking…" : "Look up"}
        </button>
      </section>

      {result === null && (
        <p className="muted lookup-none">
          No booking has that PIN. Check the digits — it is ten long.
        </p>
      )}

      {result && (
        <section className="card ops-section">
          <div className="row-between">
            <h2 className="ops-card-title">{result.customer_name}</h2>
            <span className={`pill pill-${STATE_TONE[result.code_state] ?? "off"}`}>
              {result.code_state}
            </span>
          </div>
          {result.customer_phone && (
            <p className="muted small">{result.customer_phone}</p>
          )}

          <dl className="deflist">
            <div className="defrow">
              <dt>PIN</dt>
              <dd>{formatAccessCode(code.replace(/\D/g, ""))}</dd>
            </div>
            <div className="defrow">
              <dt>Hub</dt>
              <dd>
                {result.station_name} · {result.outlet_label}
              </dd>
            </div>
            <div className="defrow">
              <dt>Booking</dt>
              <dd>{result.status}</dd>
            </div>
            <div className="defrow">
              <dt>Window</dt>
              <dd>
                {formatWhen(result.starts_at)} → {formatWhen(result.ends_at)}
              </dd>
            </div>
            <div className="defrow">
              <dt>Session</dt>
              <dd>{result.session_status ?? "not started"}</dd>
            </div>
            <div className="defrow defrow-total">
              <dt>Paid</dt>
              <dd>
                {formatNaira(result.amount_kobo)}
                {result.refund_kobo > 0 && (
                  <span className="muted small block">
                    {formatNaira(result.refund_kobo)} refunded
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {result.refund_kobo < result.amount_kobo &&
            (refundOpen ? (
              <RefundForm
                bookingId={result.booking_id}
                maxKobo={result.amount_kobo - result.refund_kobo}
                onDone={() => {
                  setRefundOpen(false);
                  search.mutate();
                }}
                onCancel={() => setRefundOpen(false)}
              />
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setRefundOpen(true)}
              >
                Refund
              </button>
            ))}
        </section>
      )}
    </OpsPage>
  );
}

function RefundForm({
  bookingId,
  maxKobo,
  onDone,
  onCancel,
}: {
  bookingId: string;
  maxKobo: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [naira, setNaira] = useState(String(maxKobo / 100));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refund = useMutation({
    mutationFn: () =>
      api.opsRefund(bookingId, Math.round(Number(naira) * 100), reason.trim()),
    onSuccess: onDone,
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not record that"),
  });

  return (
    <div className="refund">
      <p className="small">
        <strong>This records the refund; it does not move the money.</strong> Hand over
        the cash, or raise it with the gateway, then log it here.
      </p>

      <label className="field">
        <span className="field-label">Amount (₦)</span>
        <input
          className="input"
          value={naira}
          inputMode="decimal"
          onChange={(e) => setNaira(e.target.value)}
        />
        <span className="faint small">
          At most {formatNaira(maxKobo)} is left to refund.
        </span>
      </label>

      <label className="field">
        <span className="field-label">Reason</span>
        <input
          className="input"
          value={reason}
          maxLength={200}
          placeholder="Why is this being refunded?"
          onChange={(e) => setReason(e.target.value)}
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="row ops-modal-actions">
        <button type="button" className="btn btn-ghost grow" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger grow"
          disabled={!reason.trim() || !Number(naira) || refund.isPending}
          onClick={() => {
            setError(null);
            refund.mutate();
          }}
        >
          {refund.isPending ? "Recording…" : "Record refund"}
        </button>
      </div>
    </div>
  );
}
