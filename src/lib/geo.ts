import { useEffect, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance. Accurate enough for "how far is this hub". */
export function haversineKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

type GeoState =
  | { status: "idle" | "prompting" | "denied" | "unavailable"; coords: null }
  | { status: "ready"; coords: Coords };

/**
 * The user's position, for sorting hubs by distance.
 *
 * Deliberately non-blocking and failure-tolerant: a denied or unavailable
 * permission is a normal outcome, not an error, and the hub list must still
 * render — just unsorted. Nothing here is sent anywhere; distance is computed
 * in the browser against coordinates the API already returned.
 */
export function useGeolocation(enabled = true): GeoState {
  const [state, setState] = useState<GeoState>({ status: "idle", coords: null });

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coords: null });
      return;
    }

    let cancelled = false;
    setState({ status: "prompting", coords: null });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          status: "ready",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        if (cancelled) return;
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          coords: null,
        });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
