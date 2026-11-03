import type { PowerSource, TelemetryOut } from "@/api/client";
import {
  BatteryIcon,
  GeneratorIcon,
  GridIcon,
  SolarIcon,
  WarnIcon,
} from "@/components/icons";

/**
 * Which supply is carrying a station, as a glanceable badge.
 *
 * The colour carries meaning an operator can act on, and it is deliberately
 * not a neutral palette: solar is good, grid is fine, generator is costing
 * money right now, and nothing at all is an outage. Icon and text both change
 * with the state, so the signal survives both a monochrome screen and a
 * colour-blind reader.
 */
const SOURCES: Record<
  PowerSource,
  { label: string; tone: string; Icon: typeof SolarIcon }
> = {
  solar: { label: "Solar", tone: "ok", Icon: SolarIcon },
  battery: { label: "Battery", tone: "warn", Icon: BatteryIcon },
  grid: { label: "Grid", tone: "info", Icon: GridIcon },
  generator: { label: "Generator", tone: "bad", Icon: GeneratorIcon },
  none: { label: "No power", tone: "bad", Icon: WarnIcon },
};

export function PowerBadge({ source }: { source: PowerSource }) {
  const { label, tone, Icon } = SOURCES[source] ?? SOURCES.none;
  return (
    <span className={`pbadge pbadge-${tone}`}>
      <Icon className="pbadge-icon" />
      {label}
    </span>
  );
}

/** Full power panel for a station row or detail header. */
export function PowerPanel({ telemetry }: { telemetry: TelemetryOut | null }) {
  if (!telemetry) {
    return (
      <p className="muted small">
        No telemetry. This hub has never reported — it predates the gateway.
      </p>
    );
  }

  const soc = telemetry.battery_soc_pct;

  return (
    <div className="power">
      <div className="power-row">
        <PowerBadge source={telemetry.source} />
        {!telemetry.is_online && <span className="pill pill-bad">Offline</span>}
        {telemetry.generator_running && (
          <span className="pill pill-warn">
            Generator {formatMinutes(telemetry.generator_minutes_today)} today
          </span>
        )}
        {!telemetry.grid_available && <span className="pill pill-off">No grid</span>}
      </div>

      <div className="power-stats">
        <Stat label="Solar" value={`${telemetry.solar_w} W`} />
        <Stat label="Load" value={`${telemetry.load_w} W`} />
        <Stat label="Battery" value={soc == null ? "—" : `${soc}%`} />
      </div>

      {soc != null && (
        <div
          className="soc"
          role="meter"
          aria-valuenow={soc}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Battery state of charge"
        >
          {/* Thresholds, not a gradient: 20% is where a site stops being able
              to ride through an outage, and that should read as a different
              state rather than a slightly different colour. */}
          <span
            className={`soc-fill ${soc <= 20 ? "soc-low" : soc <= 50 ? "soc-mid" : "soc-ok"}`}
            style={{ width: `${soc}%` }}
          />
        </div>
      )}

      <p className="faint small power-seen">
        Last reported {relativeTime(telemetry.last_seen_at)}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="power-stat">
      <span className="power-stat-value">{value}</span>
      <span className="power-stat-label muted">{label}</span>
    </span>
  );
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "just now" / "4 min ago" / "2 hr ago". Staleness is the point. */
export function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86_400)} days ago`;
}
