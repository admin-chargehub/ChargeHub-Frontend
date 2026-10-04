/** Presentation helpers. The API sends integers and ISO strings; formatting happens here. */

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/**
 * Money arrives from the API in kobo, always as an integer. Never do arithmetic
 * on the formatted string, and never let a float near a price.
 */
export function formatNaira(kobo: number): string {
  return naira.format(Math.round(kobo) / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? "hr" : "hrs"}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Energy is stored in watt-hours; kWh is what people read. */
export function formatEnergy(wh: number): string {
  return wh < 1000 ? `${Math.round(wh)} Wh` : `${(wh / 1000).toFixed(2)} kWh`;
}

/** "Today, 2:30 PM" / "Tue, 2:30 PM" — matches the design's time rows. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return `Today, ${time}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  if (isTomorrow) return `Tomorrow, ${time}`;

  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

/** Seconds remaining → "01:45:32", for the session countdown. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** Access codes display grouped, per the contracts spec (XXXXX-XXXXX). */
export function formatAccessCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  return digits.length === 10 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : code;
}
