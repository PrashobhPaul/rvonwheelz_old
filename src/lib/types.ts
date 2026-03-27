export interface Ride {
  id: string;
  name: string;
  phone: string;
  direction: "to-office" | "to-home";
  destination: string;
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

export const HOME_LOCATION = "Raheja Vistas Elite, Nacharam";

export const DESTINATIONS = [
  "HITEC City – Mindspace Main Gate",
  "Raidurg – Metro Station Gate",
  "HITEC City – ITC Kohenur Junction",
  "Nanakramguda – Sattva Knowledge City Main Gate",
  "Raidurg – Knowledge City Gate 3 & 4",
  "HITEC City – iLabs / Inorbit Mall Junction",
  "HITEC City – Cyber Towers Junction",
  "HITEC City – Metro Station",
  "Financial District – Wipro Circle Junction",
  "Financial District – Nanakramguda Main Junction",
  "Financial District – WaveRock SEZ Entry",
  "Financial District – TSIIC Layout Entry",
  "Financial District – Salarpuria Sattva Campus",
  "Gachibowli – DLF Cyber City Gate",
  "Gachibowli – Flyover Junction",
  "Gachibowli – Biodiversity Junction",
  "Kondapur – Botanical Garden Entrance",
  "Kothaguda – Junction",
  "HITEC City – IKEA Circle Junction",
  "Jubilee Hills – Checkpost Junction",
  "Shamirpet – Genome Valley Main Gate",
  "Shamirpet – IKP Knowledge Park Entry",
  "Shamirpet – Main Junction",
  "Jeedimetla – Bus Depot Junction",
  "Balanagar – X Roads Junction",
  "Sanathnagar – Industrial Area Gate",
  "Shamshabad – RGIA Airport Departures Gate",
  "Shamshabad – GMR AeroCity Entrance",
  "Shamshabad – Hardware Park Main Gate",
  "Adibatla – Aerospace SEZ Entry",
  "Adibatla – TCS Campus Gate",
  "Kukatpally – JNTU Main Gate",
  "Kukatpally – Y Junction",
  "Miyapur – Metro Station",
  "KPHB – Main Circle Junction",
] as const;

export const DEFAULT_DESTINATION = "Nanakramguda – Sattva Knowledge City Main Gate";

// Keep backward compat
export const LOCATIONS = {
  home: HOME_LOCATION,
  office: DEFAULT_DESTINATION,
} as const;

export function getDirectionLabel(direction: Ride["direction"], destination?: string) {
  const dest = destination || DEFAULT_DESTINATION;
  return direction === "to-office"
    ? `${HOME_LOCATION} → ${dest}`
    : `${dest} → ${HOME_LOCATION}`;
}

export function getDirectionShort(direction: Ride["direction"]) {
  return direction === "to-office" ? "To Destination" : "To Home";
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
