export interface Ride {
  id: string;
  name: string;
  phone: string;
  direction: "to-office" | "to-home";
  date: string;
  time: string;
  seats: number;
  vehicle: string;
  createdAt: string;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerName: string;
  passengerPhone: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedAt: string;
}

export const LOCATIONS = {
  home: "Raheja Vistas Nacharam",
  office: "Sattva Knowledge City Gate 2",
} as const;

export function getDirectionLabel(direction: Ride["direction"]) {
  return direction === "to-office"
    ? `${LOCATIONS.home} → ${LOCATIONS.office}`
    : `${LOCATIONS.office} → ${LOCATIONS.home}`;
}

export function getDirectionShort(direction: Ride["direction"]) {
  return direction === "to-office" ? "To Office" : "To Home";
}

/** Minutes remaining until ride starts */
export function getMinutesUntilRide(ride: Ride): number {
  const rideDateTime = new Date(`${ride.date}T${ride.time}`);
  return (rideDateTime.getTime() - Date.now()) / 60000;
}

/** Ride cannot be created if it starts within 30 minutes */
export function canCreateRide(date: string, time: string): boolean {
  const rideDateTime = new Date(`${date}T${time}`);
  return (rideDateTime.getTime() - Date.now()) / 60000 >= 30;
}

/** Rider can reject a passenger only if ride is ≥15 min away */
export function canRejectPassenger(ride: Ride): boolean {
  return getMinutesUntilRide(ride) >= 15;
}

/** Passenger can cancel only if ride is ≥30 min away */
export function canCancelRequest(ride: Ride): boolean {
  return getMinutesUntilRide(ride) >= 30;
}
