/**
 * Thin fetch wrapper around the ChargeHub API.
 *
 * Request and response shapes come from `schema.d.ts`, which is generated from
 * the backend's OpenAPI document (`npm run gen:api`). Nothing here hand-declares
 * a field name — that is deliberate. The worst defect in the 2016 prototype was
 * a silent client/server contract mismatch (firmware sent `?type=`, PHP read
 * `msgType`), dead for nine years because nothing checked. Generating the client
 * types from the server's own schema makes that class of bug a compile error.
 */

import type { components } from "./schema";

export type UserOut = components["schemas"]["UserOut"];
export type TokenResponse = components["schemas"]["TokenResponse"];
export type StationOut = components["schemas"]["StationOut"];
export type StationDetailOut = components["schemas"]["StationDetailOut"];
export type OutletOut = components["schemas"]["OutletOut"];
export type AvailabilityQuery = components["schemas"]["AvailabilityQuery"];
export type AvailabilityResponse = components["schemas"]["AvailabilityResponse"];
export type OutletStatus = components["schemas"]["OutletStatus"];
export type PlanOut = components["schemas"]["PlanOut"];
export type BookingOut = components["schemas"]["BookingOut"];
export type BookingCreate = components["schemas"]["BookingCreate"];
export type BookingStatus = components["schemas"]["BookingStatus"];
export type SessionOut = components["schemas"]["SessionOut"];
export type SessionStatus = components["schemas"]["SessionStatus"];

const BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "chargehub.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token === null) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode / blocked storage — session stays in memory only */
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}/api/v1${path}`, { ...init, headers });

  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // FastAPI returns `detail` as a string, or an array for 422s.
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail) && body.detail[0]?.msg) detail = body.detail[0].msg;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  register: (body: components["schemas"]["RegisterRequest"]) =>
    request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: components["schemas"]["LoginRequest"]) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => request<UserOut>("/auth/me"),

  listStations: () => request<StationOut[]>("/stations"),

  getStation: (id: string) => request<StationDetailOut>(`/stations/${id}`),

  listPlans: () => request<PlanOut[]>("/plans"),

  /**
   * Hold an outlet. `idempotencyKey` travels as a header so a double-tap on a
   * flaky connection returns the same booking instead of creating a second one.
   */
  createBooking: (body: BookingCreate, idempotencyKey: string) =>
    request<BookingOut>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  listBookings: () => request<BookingOut[]>("/bookings"),

  getBooking: (id: string) => request<BookingOut>(`/bookings/${id}`),

  /** Returns the booking with its access code — the one response that carries it. */
  payBooking: (id: string) =>
    request<BookingOut>(`/bookings/${id}/pay`, { method: "POST" }),

  /**
   * Present an access code at a hub. This is the station's endpoint — the code
   * is the credential, so it takes no bearer token. Called from the app only
   * because there is no keypad yet.
   */
  redeemCode: (stationSlug: string, code: string) =>
    request<SessionOut>("/sessions/redeem", {
      method: "POST",
      body: JSON.stringify({ station_slug: stationSlug, code }),
    }),

  getSession: (id: string) => request<SessionOut>(`/sessions/${id}`),

  activeSession: () => request<SessionOut | null>("/sessions/active"),

  endSession: (id: string) =>
    request<SessionOut>(`/sessions/${id}/end`, { method: "POST" }),

  checkAvailability: (id: string, body: AvailabilityQuery) =>
    request<AvailabilityResponse>(`/stations/${id}/availability`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
