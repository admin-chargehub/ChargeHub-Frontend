import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Seconds remaining until `endsAt`, ticking once a second.
 *
 * Two things this gets right that a naive implementation does not:
 *
 * 1. **It recomputes from the timestamp every tick rather than decrementing.**
 *    A backgrounded mobile tab has its `setInterval` throttled to roughly once
 *    a minute, so a counter that subtracts one each tick drifts by minutes
 *    across a two-hour session. Recomputing means the clock is correct the
 *    instant the tab comes back, however long it was asleep.
 *
 * 2. **It corrects for a wrong device clock.** Phones drift, and some are set
 *    deliberately wrong. `serverNow` is captured once per response; the offset
 *    between it and the browser's clock is applied to every tick, so the
 *    countdown reflects the server's view without a round trip per second.
 */
export function useCountdown(endsAt: string | null, serverNow?: string | null): number {
  const offsetMs = useMemo(() => {
    if (!serverNow) return 0;
    return new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);

  const offsetRef = useRef(offsetMs);
  offsetRef.current = offsetMs;

  const compute = useMemo(() => {
    const endMs = endsAt ? new Date(endsAt).getTime() : null;
    return () => {
      if (endMs === null) return 0;
      return Math.max(0, Math.round((endMs - (Date.now() + offsetRef.current)) / 1000));
    };
  }, [endsAt]);

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    if (!endsAt) return;

    const id = setInterval(() => setRemaining(compute()), 1000);

    // A throttled tab can miss many ticks; recompute the moment it is visible
    // again rather than waiting up to a second.
    const onVisible = () => {
      if (!document.hidden) setRemaining(compute());
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [compute, endsAt]);

  return remaining;
}
