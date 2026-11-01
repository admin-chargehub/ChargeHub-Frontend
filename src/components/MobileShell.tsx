import { Outlet } from "react-router-dom";

import DesktopNav from "@/components/DesktopNav";
import TabBar from "@/components/TabBar";

/**
 * The customer shell, at both widths.
 *
 * Phone designs below the wide breakpoint, desktop designs above it. Both
 * chrome elements are always in the DOM and CSS picks one, so there is no
 * viewport-measuring in JS and nothing jumps on first paint — a width the
 * stylesheet already knows should not be re-derived in React.
 *
 * The operator and admin portals are separate designs and will get their own
 * shell; this one is the customer's.
 */
export function MobileShell() {
  return (
    <>
      <DesktopNav />
      <div className="shell">
        <Outlet />
      </div>
    </>
  );
}

/** Shell plus the bottom tab bar, for the four top-level destinations. */
export function TabbedShell() {
  return (
    <>
      <DesktopNav />
      <div className="shell">
        <Outlet />
        <TabBar />
      </div>
    </>
  );
}
