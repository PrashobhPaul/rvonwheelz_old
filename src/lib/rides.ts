import { Ride, RideRequest } from "./types";

const RIDES_KEY = "carpool-rides";
const REQUESTS_KEY = "carpool-requests";

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const SEED_RIDES: Ride[] = [
  { id: "seed-1", name: "Ravi Kumar", phone: "9876543210", direction: "to-office", destination: "Nanakramguda – Sattva Knowledge City Main Gate", date: today(0), time: "08:30", seats: 3, vehicle: "Car - Hyundai i20", createdAt: new Date().toISOString() },
  { id: "seed-2", name: "Priya Sharma", phone: "9123456789", direction: "to-office", destination: "HITEC City – Mindspace Main Gate", date: today(0), time: "09:00", seats: 1, vehicle: "Bike", createdAt: new Date().toISOString() },
  { id: "seed-3", name: "Arun Reddy", phone: "9988776655", direction: "to-home", destination: "Gachibowli – Biodiversity Junction", date: today(0), time: "18:00", seats: 2, vehicle: "Car - Maruti Swift", createdAt: new Date().toISOString() },
  { id: "seed-4", name: "Sneha Patel", phone: "9001122334", direction: "to-home", destination: "Financial District – Wipro Circle Junction", date: today(0), time: "18:30", seats: 3, vehicle: "Car - Honda City", createdAt: new Date().toISOString() },
  { id: "seed-5", name: "Kiran Rao", phone: "9556677889", direction: "to-office", destination: "HITEC City – Cyber Towers Junction", date: today(1), time: "08:00", seats: 2, vehicle: "Car - Tata Nexon", createdAt: new Date().toISOString() },
];

// ─── Rides ───

function initRides(): Ride[] {
  const stored = localStorage.getItem(RIDES_KEY);
  if (!stored) {
    localStorage.setItem(RIDES_KEY, JSON.stringify(SEED_RIDES));
    return SEED_RIDES;
  }
  return JSON.parse(stored);
}

export function getRides(): Ride[] {
  return initRides();
}

function saveRides(rides: Ride[]) {
  localStorage.setItem(RIDES_KEY, JSON.stringify(rides));
}

export function addRide(ride: Omit<Ride, "id" | "createdAt">): Ride {
  const rides = getRides();
  const newRide: Ride = { ...ride, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  rides.unshift(newRide);
  saveRides(rides);
  return newRide;
}

export function deleteRide(id: string) {
  saveRides(getRides().filter((r) => r.id !== id));
  // Also clean up related requests
  saveRequests(getRequests().filter((r) => r.rideId !== id));
}

export function updateRide(id: string, data: Partial<Omit<Ride, "id" | "createdAt">>) {
  saveRides(getRides().map((r) => (r.id === id ? { ...r, ...data } : r)));
}

// ─── Ride Requests ───

function initRequests(): RideRequest[] {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (!stored) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(stored);
}

export function getRequests(): RideRequest[] {
  return initRequests();
}

function saveRequests(requests: RideRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function addRequest(req: Omit<RideRequest, "id" | "status" | "requestedAt">): RideRequest {
  const requests = getRequests();
  const newReq: RideRequest = {
    ...req,
    id: crypto.randomUUID(),
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
  requests.push(newReq);
  saveRequests(requests);
  return newReq;
}

export function updateRequestStatus(id: string, status: RideRequest["status"]) {
  saveRequests(getRequests().map((r) => (r.id === id ? { ...r, status } : r)));
}

export function getRequestsForRide(rideId: string): RideRequest[] {
  return getRequests().filter((r) => r.rideId === rideId);
}

export function getApprovedCount(rideId: string): number {
  return getRequests().filter((r) => r.rideId === rideId && r.status === "approved").length;
}
