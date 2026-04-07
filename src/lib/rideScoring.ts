import { getFrequentPatterns } from "@/lib/habitTracker";

interface RideForScoring {
  id: string;
  user_id: string;
  direction: string;
  destination: string;
  time: string;
  date: string;
}

interface ScoringContext {
  userOfficeLocation?: string;
  userBlock?: string;
  favorites: string[];
  /** Map of driver user_id → block */
  driverBlocks: Record<string, string>;
}

/**
 * Score a ride for relevance to the current user.
 * Higher = better match.
 *
 * Weights:
 *  - Office location match (area): +40
 *  - Favorite driver: +30
 *  - Same block: +20
 *  - Habit time match (±15 min): +10
 */
export function scoreRide(ride: RideForScoring, ctx: ScoringContext): number {
  let score = 0;

  // 1. Office location match (area-level)
  if (ctx.userOfficeLocation) {
    const userArea = ctx.userOfficeLocation.split("–")[0].trim();
    const rideArea = (ride.destination || "").split("–")[0].trim();
    if (userArea && rideArea && userArea === rideArea) {
      score += 40;
    }
  }

  // 2. Favorite driver
  if (ctx.favorites.includes(ride.user_id)) {
    score += 30;
  }

  // 3. Same block proximity
  const driverBlock = ctx.driverBlocks[ride.user_id];
  if (driverBlock && ctx.userBlock && driverBlock === ctx.userBlock) {
    score += 20;
  }

  // 4. Habit time match (±15 min window)
  const patterns = getFrequentPatterns();
  const [rH, rM] = ride.time.split(":").map(Number);
  const rideMinutes = rH * 60 + rM;
  for (const p of patterns) {
    if (p.direction !== ride.direction) continue;
    const [pH, pM] = p.time.split(":").map(Number);
    const patternMinutes = pH * 60 + pM;
    if (Math.abs(rideMinutes - patternMinutes) <= 15) {
      score += 10;
      break;
    }
  }

  return score;
}

/** Threshold above which we consider a ride a "best match" */
export const BEST_MATCH_THRESHOLD = 40;
