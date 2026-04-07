import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getFrequentPatterns } from "@/lib/habitTracker";

/** Session-scoped dedup set so the same notification isn't shown twice */
const shown = new Set<string>();

function dedup(key: string): boolean {
  if (shown.has(key)) return false;
  shown.add(key);
  // Auto-expire after 5 min to keep memory bounded
  setTimeout(() => shown.delete(key), 5 * 60_000);
  return true;
}

/** Check if a ride time matches any of the user's habit patterns (±20 min) */
function matchesHabitTiming(rideTime: string, rideDirection: string): boolean {
  const patterns = getFrequentPatterns();
  const [rH, rM] = rideTime.split(":").map(Number);
  const rideMins = rH * 60 + rM;
  return patterns.some((p) => {
    if (p.direction !== rideDirection) return false;
    const [pH, pM] = p.time.split(":").map(Number);
    return Math.abs(rideMins - (pH * 60 + pM)) <= 20;
  });
}

export function RideNotificationListener() {
  const { user } = useAuth();
  const { data: favorites = [] } = useFavorites();
  const qc = useQueryClient();
  // Keep favorites in a ref so the realtime callback always has fresh values
  const favRef = useRef(favorites);
  useEffect(() => { favRef.current = favorites; }, [favorites]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("ride-notifications-v2")
      // ── New ride_request INSERT ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ride_requests" },
        async (payload) => {
          const req = payload.new as {
            id: string;
            ride_id: string;
            passenger_name: string;
            passenger_id: string;
          };

          if (req.passenger_id === user.id) return;

          const { data: ride } = await supabase
            .from("rides")
            .select("id, user_id")
            .eq("id", req.ride_id)
            .single();

          if (ride?.user_id === user.id && dedup(`req-${req.id}`)) {
            toast.info(`🚗 ${req.passenger_name} requested a seat on your ride!`, { duration: 6000 });
          }

          qc.invalidateQueries({ queryKey: ["requests"] });
        }
      )
      // ── ride_request UPDATE (status changes) ──
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ride_requests" },
        async (payload) => {
          const updated = payload.new as {
            id: string;
            passenger_id: string;
            passenger_name: string;
            status: string;
            ride_id: string;
          };

          const key = `requp-${updated.id}-${updated.status}`;

          if (updated.passenger_id === user.id && dedup(key)) {
            if (updated.status === "approved") {
              toast.success("✅ Your seat request was approved!");
            } else if (updated.status === "rejected") {
              toast.error("❌ Your seat request was rejected.");
            } else if (updated.status === "cancelled_by_driver") {
              toast.error("🚫 The driver has cancelled this ride.");
            }
          }

          if (updated.status === "cancelled" && updated.passenger_id !== user.id) {
            const { data: ride } = await supabase
              .from("rides")
              .select("id, user_id")
              .eq("id", updated.ride_id)
              .single();

            if (ride?.user_id === user.id && dedup(key)) {
              toast.info(`⚠️ ${updated.passenger_name} cancelled their seat.`, { duration: 6000 });
            }
          }

          qc.invalidateQueries({ queryKey: ["requests"] });
          qc.invalidateQueries({ queryKey: ["completionStats"] });
        }
      )
      // ── New ride INSERT (favorite user + habit timing alerts) ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          const ride = payload.new as {
            id: string;
            user_id: string;
            name: string;
            destination: string;
            direction: string;
            time: string;
            seats: number;
          };

          if (ride.user_id === user.id) return;

          const isFav = favRef.current.includes(ride.user_id);
          const isHabitMatch = matchesHabitTiming(ride.time, ride.direction);

          // Prioritise: favorite > habit match. Show at most one notification per ride.
          if (isFav && dedup(`fav-ride-${ride.id}`)) {
            toast.info(`⭐ ${ride.name} (Preferred) just posted a ride!`, { duration: 8000 });
          } else if (isHabitMatch && dedup(`habit-ride-${ride.id}`)) {
            toast(`🕐 A ride matching your usual schedule is available!`, { duration: 6000 });
          }

          qc.invalidateQueries({ queryKey: ["rides"] });
        }
      )
      // ── Ride request changes that affect seat count (urgency) ──
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ride_requests", filter: "status=eq.approved" },
        async (payload) => {
          const req = payload.new as { ride_id: string; passenger_id: string };
          if (req.passenger_id === user.id) return;

          // Check seat availability for rides matching user's habits
          const { data: ride } = await supabase
            .from("rides")
            .select("id, name, seats, time, direction, user_id")
            .eq("id", req.ride_id)
            .single();

          if (!ride || ride.user_id === user.id) return;

          const { count } = await supabase
            .from("ride_requests")
            .select("id", { count: "exact", head: true })
            .eq("ride_id", ride.id)
            .eq("status", "approved");

          const remaining = ride.seats - (count || 0);
          if (remaining === 1 && matchesHabitTiming(ride.time, ride.direction) && dedup(`urgency-${ride.id}`)) {
            toast.warning(`🔥 Only 1 seat left on ${ride.name}'s ride!`, { duration: 8000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return null;
}
