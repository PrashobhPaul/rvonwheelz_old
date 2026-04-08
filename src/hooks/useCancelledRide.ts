import { useEffect, useState, useCallback } from "react";
import { CancelledRideInfo } from "@/components/RideCancelledSuggestions";

const EVENT_NAME = "ride-cancelled-show-alternatives";

/** Dispatch from anywhere to trigger the alternatives overlay */
export function showCancelledAlternatives(ride: CancelledRideInfo) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: ride }));
}

/** Hook that listens for cancelled-ride events */
export function useCancelledRide() {
  const [cancelledRide, setCancelledRide] = useState<CancelledRideInfo | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setCancelledRide((e as CustomEvent<CancelledRideInfo>).detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const dismiss = useCallback(() => setCancelledRide(null), []);
  return { cancelledRide, dismiss };
}
