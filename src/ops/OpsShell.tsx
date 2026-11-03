import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import {
  AuditIcon,
  BoltIcon,
  CounterIcon,
  GaugeIcon,
  ReportsIcon,
  SearchIcon,
  SessionsIcon,
  StationsIcon,
} from "@/components/icons";
import { ThemeToggleButton } from "@/components/ThemeToggle";

const LINKS = [
  { to: "/ops", label: "Dashboard", Icon: GaugeIcon, end: true },
  { to: "/ops/counter", label: "Counter", Icon: CounterIcon, end: false },
  { to: "/ops/lookup", label: "Find a PIN", Icon: SearchIcon, end: false },
  { to: "/ops/stations", label: "Stations", Icon: StationsIcon, end: false },
  { to: "/ops/sessions", label: "Sessions", Icon: SessionsIcon, end: false },
  { to: "/ops/reports", label: "Reports", Icon: ReportsIcon, end: false },
  { to: "/ops/audit", label: "Audit", Icon: AuditIcon, end: false },
] as const;

/**
 * Sidebar layout for the operator console.
 *
 * A separate shell from the customer app rather than a mode inside it. The two
 * have different navigation, different density and different stakes — the
 * person using this one can cut power to a socket someone is standing at — and
 * folding them together would mean every customer screen carries code that can
 * do that.
 *
 * Below the wide breakpoint the sidebar becomes a horizontal strip. This is a
 * desk tool and the design is a desktop one, but an operator standing at a hub
 * with a phone is exactly who needs to mark an outlet faulty.
 */
export default function OpsShell() {
  const { user, logout } = useAuth();

  return (
    <div className="ops">
      <aside className="ops-side">
        <div className="ops-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="ops-brand-text">
            ChargeHub
            <span className="ops-brand-sub">Operator</span>
          </span>
        </div>

        <nav className="ops-nav" aria-label="Operator sections">
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "ops-link ops-link-on" : "ops-link")}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ops-side-foot">
          <div className="ops-who">
            <BoltIcon className="ops-who-icon" />
            <span>
              <span className="ops-who-name">{user?.full_name}</span>
              <span className="ops-who-role">{user?.role}</span>
            </span>
          </div>
          <div className="row ops-side-actions">
            <ThemeToggleButton />
            <button type="button" className="btn btn-ghost btn-sm grow" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="ops-main">
        <Outlet />
      </main>
    </div>
  );
}
