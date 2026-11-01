import { Link, NavLink } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { ThemeToggleButton } from "@/components/ThemeToggle";

/**
 * Top navigation for the desktop layout, hidden below the wide breakpoint
 * where the tab bar takes over.
 *
 * The design's nav reads "Find a Hub · How it works · Pricing · Support". The
 * last three are marketing pages that belong to the public site and have no
 * route here, so this links the four destinations that actually exist — the
 * same four as the tab bar. A nav whose links go nowhere is worse than a
 * shorter one.
 */
export default function DesktopNav() {
  const { user } = useAuth();

  // Signed out, there is nothing to navigate to: every link below needs a
  // session. Onboarding and login carry their own calls to action, so the bar
  // is just the brand.
  if (!user) {
    return (
      <header className="topnav">
        <div className="topnav-inner">
          <Link to="/" className="brand topnav-brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>ChargeHub</span>
          </Link>
          <div className="topnav-right">
            <ThemeToggleButton />
            <Link to="/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const initials = (user.full_name ?? user.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand topnav-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>ChargeHub</span>
        </Link>

        <nav className="topnav-links" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            Find a Hub
          </NavLink>
          <NavLink to="/bookings" className={navClass}>
            Bookings
          </NavLink>
          <NavLink to="/wallet" className={navClass}>
            Wallet
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            Profile
          </NavLink>
        </nav>

        <div className="topnav-right">
          <ThemeToggleButton />
          <Link to="/profile" className="topnav-avatar" aria-label="Your account">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? "topnav-link topnav-link-on" : "topnav-link";
}
