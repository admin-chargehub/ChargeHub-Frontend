import type { Coords } from "@/lib/geo";

export interface Place extends Coords {
  id: string;
  name: string;
  area: string;
}

/**
 * Places a user can stand in, for the "change location" picker.
 *
 * These are *origins*, not hubs — somewhere to measure from. Coordinates are
 * approximate centres of well-known Ibadan areas, which is all distance
 * ordering needs.
 *
 * A free-text search would need a geocoder (Nominatim, Google Places), which
 * means an outbound request carrying whatever the user typed. For a pilot
 * confined to one city a fixed list answers the same question without sending
 * anything anywhere, so that stays deferred rather than half-built.
 */
export const PLACES: Place[] = [
  { id: "ui", name: "University of Ibadan", area: "Main campus", lat: 7.4429, lng: 3.896 },
  { id: "sango", name: "Sango", area: "Eleyele Road", lat: 7.429, lng: 3.874 },
  { id: "bodija", name: "Bodija", area: "Bodija Market", lat: 7.4258, lng: 3.908 },
  { id: "agodi", name: "Agodi Gate", area: "Agodi", lat: 7.4, lng: 3.913 },
  { id: "mokola", name: "Mokola", area: "Mokola Roundabout", lat: 7.403, lng: 3.89 },
  { id: "dugbe", name: "Dugbe", area: "City centre", lat: 7.387, lng: 3.882 },
  { id: "ringroad", name: "Ring Road", area: "Ring Road", lat: 7.368, lng: 3.879 },
  { id: "challenge", name: "Challenge", area: "Challenge", lat: 7.355, lng: 3.875 },
];

export function findPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id);
}
