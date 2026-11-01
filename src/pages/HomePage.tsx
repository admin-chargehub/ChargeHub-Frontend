import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { api, type StationOut } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { PinIcon } from "@/components/icons";
import { LocationButton } from "@/components/LocationSheet";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { formatDistance } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import { useLocation } from "@/location/LocationContext";

type WithDistance = StationOut & { distanceKm: number | null };

export default function HomePage() {
  const { user } = useAuth();
  const { origin } = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["stations"],
    queryFn: api.listStations,
  });

  // Distance is computed in the browser from coordinates the API already
  // returns. For a handful of hubs that is exact and costs nothing; once the
  // fleet is large enough to need filtering, it moves server-side.
  const hubs: WithDistance[] = useMemo(() => {
    const list = (data ?? []).map((s) => ({
      ...s,
      distanceKm:
        origin && s.latitude != null && s.longitude != null
          ? haversineKm(origin, { lat: s.latitude, lng: s.longitude })
          : null,
    }));
    // Only re-sort when we actually have an origin; otherwise keep the
    // server's ordering rather than shuffling for no reason.
    return origin
      ? [...list].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      : list;
  }, [data, origin]);

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="screen screen-tabbed">
      <header className="home-head row-between">
        <span>
          <p className="muted">{firstName ? `Hello, ${firstName}` : "Welcome"}</p>
          <h1>Find a Hub</h1>
        </span>
        <ThemeToggleButton />
      </header>

      <LocationButton />

      {isLoading && (
        <div className="stack" aria-hidden="true">
          <div className="skeleton" style={{ height: 104 }} />
          <div className="skeleton" style={{ height: 104 }} />
        </div>
      )}

      {error && <p className="error">{(error as Error).message}</p>}

      {!isLoading && !error && hubs.length === 0 && (
        <div className="card empty">
          <h2>No hubs yet</h2>
          <p className="muted">
            Run <code>python -m scripts.seed</code> in the backend to create the pilot hub.
          </p>
        </div>
      )}

      <div className="stack">
        {hubs.map((hub) => (
          <Link key={hub.id} to={`/hubs/${hub.id}`} className="card card-link hubcard">
            <div className="row-between">
              <h2 className="hubcard-name">{hub.name}</h2>
              {hub.distanceKm != null && (
                <span className="muted hubcard-dist">{formatDistance(hub.distanceKm)}</span>
              )}
            </div>

            {hub.address && (
              <p className="muted hubcard-addr">
                <PinIcon className="hubcard-pin" />
                {hub.address}
              </p>
            )}

            <div className="row hubcard-foot">
              <span className={hub.is_active ? "dot" : "dot dot-off"} aria-hidden="true" />
              <span className={hub.is_active ? "pill pill-ok" : "pill pill-off"}>
                {hub.is_active ? "Open" : "Closed"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
