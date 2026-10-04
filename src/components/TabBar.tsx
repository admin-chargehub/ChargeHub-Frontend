import { NavLink } from "react-router-dom";

import { BookingsIcon, HomeIcon, ProfileIcon, WalletIcon } from "@/components/icons";

const TABS = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/bookings", label: "Bookings", Icon: BookingsIcon, end: false },
  { to: "/wallet", label: "Wallet", Icon: WalletIcon, end: false },
  { to: "/profile", label: "Profile", Icon: ProfileIcon, end: false },
] as const;

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => (isActive ? "tab tab-on" : "tab")}
        >
          {({ isActive }) => (
            <>
              <Icon />
              <span>{label}</span>
              {/* The colour change alone is not an accessible state cue. */}
              {isActive && <span className="sr-only"> (current)</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
