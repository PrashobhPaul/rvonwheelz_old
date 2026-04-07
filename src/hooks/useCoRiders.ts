import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CoRider {
  userId: string;
  name: string;
  count: number;
}

/**
 * Finds users who frequently shared rides with the current user.
 * Checks both: rides I drove where they were approved passengers,
 * and rides they drove where I was an approved passenger.
 */
export function useCoRiders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["co-riders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Rides I drove → approved passengers
      const { data: myRides } = await supabase
        .from("rides")
        .select("id")
        .eq("user_id", user.id);

      const myRideIds = (myRides || []).map((r) => r.id);

      let passengersOnMyRides: { passenger_id: string; passenger_name: string }[] = [];
      if (myRideIds.length > 0) {
        const { data } = await supabase
          .from("ride_requests")
          .select("passenger_id, passenger_name")
          .in("ride_id", myRideIds)
          .eq("status", "approved");
        passengersOnMyRides = data || [];
      }

      // 2. Rides I joined as passenger → get drivers
      const { data: myApprovedReqs } = await supabase
        .from("ride_requests")
        .select("ride_id")
        .eq("passenger_id", user.id)
        .eq("status", "approved");

      const joinedRideIds = (myApprovedReqs || []).map((r) => r.ride_id);

      let driversOfJoinedRides: { user_id: string; name: string }[] = [];
      if (joinedRideIds.length > 0) {
        const { data } = await supabase
          .from("rides")
          .select("user_id, name")
          .in("id", joinedRideIds);
        driversOfJoinedRides = data || [];
      }

      // Aggregate counts
      const counts = new Map<string, { name: string; count: number }>();

      for (const p of passengersOnMyRides) {
        if (p.passenger_id === user.id) continue;
        const existing = counts.get(p.passenger_id);
        if (existing) {
          existing.count++;
        } else {
          counts.set(p.passenger_id, { name: p.passenger_name, count: 1 });
        }
      }

      for (const d of driversOfJoinedRides) {
        if (d.user_id === user.id) continue;
        const existing = counts.get(d.user_id);
        if (existing) {
          existing.count++;
        } else {
          counts.set(d.user_id, { name: d.name, count: 1 });
        }
      }

      // Sort by count desc, return top 10
      const result: CoRider[] = [];
      for (const [userId, { name, count }] of counts) {
        result.push({ userId, name, count });
      }
      result.sort((a, b) => b.count - a.count);
      return result.slice(0, 10);
    },
    enabled: !!user,
  });
}
