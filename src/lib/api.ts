import { getApiUrl } from "./config";
import { Ride, RideRequest } from "./types";
import * as local from "./rides";

async function sheetsGet(action: string, params: Record<string, string> = {}): Promise<any> {
  const url = getApiUrl();
  if (!url) throw new Error("No API URL configured");
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${url}?${qs}`);
  if (!res.ok) throw new Error("Sheets API error");
  return res.json();
}

async function sheetsPost(body: Record<string, any>): Promise<any> {
  const url = getApiUrl();
  if (!url) throw new Error("No API URL configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // Apps Script needs text/plain to avoid CORS preflight
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Sheets API error");
  return res.json();
}

function useSheets(): boolean {
  return !!getApiUrl();
}

// ─── Rides ───

export async function fetchRides(): Promise<Ride[]> {
  if (!useSheets()) return local.getRides();
  const data = await sheetsGet("getRides");
  return data.map((r: any) => ({
    ...r,
    seats: Number(r.seats),
  }));
}

export async function createRide(ride: Omit<Ride, "id" | "createdAt">): Promise<Ride> {
  if (!useSheets()) return local.addRide(ride);
  const result = await sheetsPost({ action: "addRide", ...ride });
  return { ...ride, id: result.id, createdAt: result.createdAt };
}

export async function removeRide(id: string, phone: string): Promise<void> {
  if (!useSheets()) {
    local.deleteRide(id);
    return;
  }
  await sheetsPost({ action: "deleteRide", id, phone });
}

// ─── Requests ───

export async function fetchRequests(rideId?: string): Promise<RideRequest[]> {
  if (!useSheets()) {
    return rideId ? local.getRequestsForRide(rideId) : local.getRequests();
  }
  return sheetsGet("getRequests", rideId ? { rideId } : {});
}

export async function createRequest(req: Omit<RideRequest, "id" | "status" | "requestedAt">): Promise<RideRequest> {
  if (!useSheets()) return local.addRequest(req);
  const result = await sheetsPost({ action: "addRequest", ...req });
  return { ...req, id: result.id, status: "pending", requestedAt: result.requestedAt };
}

export async function setRequestStatus(id: string, status: RideRequest["status"]): Promise<void> {
  if (!useSheets()) {
    local.updateRequestStatus(id, status);
    return;
  }
  await sheetsPost({ action: "updateRequest", id, status });
}
