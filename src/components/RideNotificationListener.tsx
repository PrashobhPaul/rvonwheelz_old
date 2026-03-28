import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function RideNotificationListener() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("ride-requests-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_requests",
        },
        async (payload) => {
          const newRequest = payload.new as {
            ride_id: string;
            passenger_name: string;
            passenger_id: string;
          };

          // Only notify the ride owner (not the requester themselves)
          if (newRequest.passenger_id === user.id) return;

          // Check if user owns this ride
          const { data: ride } = await supabase
            .from("rides")
            .select("id, user_id")
            .eq("id", newRequest.ride_id)
            .single();

          if (ride?.user_id === user.id) {
            toast.info(`🚗 ${newRequest.passenger_name} requested a seat on your ride!`, {
              duration: 6000,
            });
          }

          qc.invalidateQueries({ queryKey: ["requests"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ride_requests",
        },
        async (payload) => {
          const updated = payload.new as {
            passenger_id: string;
            status: string;
            ride_id: string;
          };

          // Notify passengers about status changes on their requests
          if (updated.passenger_id === user.id) {
            if (updated.status === "approved") {
              toast.success("✅ Your seat request was approved!");
            } else if (updated.status === "rejected") {
              toast.error("❌ Your seat request was rejected.");
            } else if (updated.status === "cancelled_by_driver") {
              toast.error("🚫 The driver has cancelled this ride.");
            }
          }

          qc.invalidateQueries({ queryKey: ["requests"] });
          qc.invalidateQueries({ queryKey: ["completionStats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return null;
}
