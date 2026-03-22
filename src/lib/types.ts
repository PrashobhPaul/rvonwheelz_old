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
