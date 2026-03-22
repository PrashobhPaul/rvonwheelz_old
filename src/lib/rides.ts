import { Ride } from "./types";

const STORAGE_KEY = "carpool-rides";

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const SEED_RIDES: Ride[] = [
  { id: "seed-1", name: "Ravi Kumar", phone: "9876543210", direction: "to-office", date: today(0), time: "08:30", seats: 3, vehicle: "Car - Hyundai i20", createdAt: new Date().toISOString() },
  { id: "seed-2", name: "Priya Sharma", phone: "9123456789", direction: "to-office", date: today(0), time: "09:00", seats: 1, vehicle: "Bike", createdAt: new Date().toISOString() },
  { id: "seed-3", name: "Arun Reddy", phone: "9988776655", direction: "to-home", date: today(0), time: "18:00", seats: 2, vehicle: "Car - Maruti Swift", createdAt: new Date().toISOString() },
  { id: "seed-4", name: "Sneha Patel", phone: "9001122334", direction: "to-home", date: today(0), time: "18:30", seats: 3, vehicle: "Car - Honda City", createdAt: new Date().toISOString() },
  { id: "seed-5", name: "Kiran Rao", phone: "9556677889", direction: "to-office", date: today(1), time: "08:00", seats: 2, vehicle: "Car - Tata Nexon", createdAt: new Date().toISOString() },
];

function initStorage(): Ride[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RIDES));
    return SEED_RIDES;
  }
  return JSON.parse(stored);
}

export function getRides(): Ride[] {
  return initStorage();
}

function saveRides(rides: Ride[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
}

export function addRide(ride: Omit<Ride, "id" | "createdAt">): Ride {
  const rides = getRides();
  const newRide: Ride = {
    ...ride,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  rides.unshift(newRide);
  saveRides(rides);
  return newRide;
}

export function deleteRide(id: string) {
  const rides = getRides().filter((r) => r.id !== id);
  saveRides(rides);
}

export function updateRide(id: string, data: Partial<Omit<Ride, "id" | "createdAt">>) {
  const rides = getRides().map((r) => (r.id === id ? { ...r, ...data } : r));
  saveRides(rides);
}
