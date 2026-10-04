import { BoltIcon } from "@/components/icons";

/**
 * Shown while the stored session is being revalidated on boot.
 *
 * Deliberately not a route. A splash you can navigate to is a splash you can
 * get stuck on; this is a state, so it renders from the auth guard and
 * disappears on its own when `loading` clears.
 */
export default function SplashScreen() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="splash-mark">
        <BoltIcon />
      </div>
      <p className="splash-name">ChargeHub</p>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
