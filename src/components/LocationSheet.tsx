import { useEffect, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon, CrosshairIcon, PinIcon } from "@/components/icons";
import { haversineKm } from "@/lib/geo";
import { formatDistance } from "@/lib/format";
import { PLACES } from "@/lib/places";
import { useLocation } from "@/location/LocationContext";

/**
 * Header control that opens the location picker.
 *
 * A native <dialog> rather than a hand-rolled overlay: it gives focus
 * trapping, Esc-to-close and inertness of the page behind it for free, all of
 * which are easy to get wrong by hand.
 */
export function LocationButton() {
  const { label, deviceStatus, choice } = useLocation();
  const [open, setOpen] = useState(false);
  const needsAttention = choice.kind === "device" && deviceStatus !== "ready";

  return (
    <>
      <button
        type="button"
        className="locbtn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <PinIcon className="locbtn-pin" />
        <span className="locbtn-label">{label}</span>
        <ChevronDownIcon className="locbtn-caret" />
      </button>

      {needsAttention && (
        <p className="faint note">
          {deviceStatus === "denied"
            ? "Location is off, so hubs aren’t sorted by distance. Set one above."
            : deviceStatus === "unavailable"
              ? "This device can’t share a location. Set one above."
              : "Finding you…"}
        </p>
      )}

      {open && <LocationSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function LocationSheet({ onClose }: { onClose: () => void }) {
  const { choice, origin, choosePlace, useDevice, deviceStatus } = useLocation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // showModal() can only run after the node is in the DOM, which is why this
    // lives in an effect rather than an `open` attribute.
    ref.current?.showModal();
  }, []);

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-label="Choose your location">
      <div className="sheet-grip" aria-hidden="true" />
      <h2 className="sheet-title">Your location</h2>
      <p className="sheet-sub muted">Hubs are sorted by how far they are from here.</p>

      <ul className="sheet-list">
        <li>
          <button
            type="button"
            className="placerow"
            onClick={() => {
              useDevice();
              ref.current?.close();
            }}
          >
            <CrosshairIcon className="placerow-icon" />
            <span className="placerow-text">
              <span className="placerow-name">Use my location</span>
              <span className="placerow-area muted">
                {deviceStatus === "denied"
                  ? "Permission blocked — allow it in your browser"
                  : deviceStatus === "unavailable"
                    ? "Not available on this device"
                    : "Ask this device where I am"}
              </span>
            </span>
            {choice.kind === "device" && deviceStatus === "ready" && (
              <CheckIcon className="placerow-check" />
            )}
          </button>
        </li>

        {PLACES.map((p) => {
          const selected = choice.kind === "place" && choice.id === p.id;
          // Distance from wherever we are *now*, so the list says how far each
          // option is before you commit to it.
          const away = origin ? haversineKm(origin, { lat: p.lat, lng: p.lng }) : null;

          return (
            <li key={p.id}>
              <button
                type="button"
                className={selected ? "placerow placerow-on" : "placerow"}
                onClick={() => {
                  choosePlace(p.id);
                  ref.current?.close();
                }}
              >
                <PinIcon className="placerow-icon" />
                <span className="placerow-text">
                  <span className="placerow-name">{p.name}</span>
                  <span className="placerow-area muted">{p.area}</span>
                </span>
                {selected ? (
                  <CheckIcon className="placerow-check" />
                ) : (
                  away != null &&
                  away > 0.05 && (
                    <span className="placerow-dist muted">{formatDistance(away)}</span>
                  )
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sheet-foot">
        <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>
          Close
        </button>
      </div>
    </dialog>
  );
}
