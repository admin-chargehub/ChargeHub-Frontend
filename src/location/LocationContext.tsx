import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Coords } from "@/lib/geo";
import { findPlace, type Place } from "@/lib/places";

const KEY = "chargehub.origin";

/** How the origin was chosen. "device" means ask the browser. */
export type Choice = { kind: "device" } | { kind: "place"; id: string };

export type DeviceStatus = "idle" | "prompting" | "ready" | "denied" | "unavailable";

interface LocationState {
  choice: Choice;
  /** Where to measure distances from, or null while unknown. */
  origin: Coords | null;
  /** The chosen place, when one was picked. */
  place: Place | null;
  /** Only meaningful while `choice.kind === "device"`. */
  deviceStatus: DeviceStatus;
  /** Short name for a header button — never empty. */
  label: string;
  choosePlace: (id: string) => void;
  useDevice: () => void;
}

const LocationContext = createContext<LocationState | null>(null);

function readStored(): Choice {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && raw !== "device" && findPlace(raw)) return { kind: "place", id: raw };
  } catch {
    /* blocked storage — fall through to the device */
  }
  return { kind: "device" };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice>(readStored);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("idle");
  const [deviceCoords, setDeviceCoords] = useState<Coords | null>(null);
  // Bumped by useDevice() so picking "Use my location" re-asks after a denial
  // rather than silently doing nothing.
  const [attempt, setAttempt] = useState(0);

  // Only talk to the Geolocation API when the device is actually the chosen
  // origin. Picking a place off the list must not trigger a permission prompt.
  useEffect(() => {
    if (choice.kind !== "device") return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDeviceStatus("unavailable");
      return;
    }

    let cancelled = false;
    setDeviceStatus("prompting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setDeviceCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDeviceStatus("ready");
      },
      (err) => {
        if (cancelled) return;
        setDeviceCoords(null);
        setDeviceStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );

    return () => {
      cancelled = true;
    };
  }, [choice, attempt]);

  const persist = useCallback((next: Choice) => {
    setChoice(next);
    try {
      if (next.kind === "device") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next.id);
    } catch {
      /* choice lasts for this session only */
    }
  }, []);

  const choosePlace = useCallback(
    (id: string) => {
      if (findPlace(id)) persist({ kind: "place", id });
    },
    [persist],
  );

  const useDevice = useCallback(() => {
    persist({ kind: "device" });
    setAttempt((n) => n + 1);
  }, [persist]);

  const place = choice.kind === "place" ? (findPlace(choice.id) ?? null) : null;

  const value = useMemo<LocationState>(() => {
    const origin = place ? { lat: place.lat, lng: place.lng } : deviceCoords;
    const label = place
      ? place.name
      : deviceStatus === "ready"
        ? "My location"
        : deviceStatus === "prompting"
          ? "Locating…"
          : "Set location";

    return { choice, origin, place, deviceStatus, label, choosePlace, useDevice };
  }, [choice, place, deviceCoords, deviceStatus, choosePlace, useDevice]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}
