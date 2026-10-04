import { Outlet } from "react-router-dom";

import TabBar from "@/components/TabBar";

/**
 * Phone-width column used by every customer screen.
 *
 * On a wide viewport it centres at 480px rather than stretching. These are
 * phone designs; a 1400px-wide "Find a Hub" would be a different design, not a
 * bigger one. The operator and admin portals are designed as desktop layouts
 * and will get their own shell.
 */
export function MobileShell() {
  return (
    <div className="shell">
      <Outlet />
    </div>
  );
}

/** Shell plus the bottom tab bar, for the four top-level destinations. */
export function TabbedShell() {
  return (
    <div className="shell">
      <Outlet />
      <TabBar />
    </div>
  );
}
