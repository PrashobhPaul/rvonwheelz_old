import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { recordHabit } from "@/lib/habitTracker";

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("name, block, flat_number, phone, vehicle_name, registration_number")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useRides() {
  return useQuery({
    queryKey: ["rides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });
}

/** Fetch block info for a list of driver user_ids */
export function useDriverBlocks(userIds: string[]) {
  return useQuery({
    queryKey: ["driver-blocks", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, block")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const d of data || []) {
        map[d.user_id] = d.block;
      }
      return map;
    },
    enabled: userIds.length > 0,
  });
}

export function useRequests(rideId?: string) {
  return useQuery({
    queryKey: ["requests", rideId],
    queryFn: async () => {
      let query = supabase.from("ride_requests").select("*");
      if (rideId) query = query.eq("ride_id", rideId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useCreateRide() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (ride: { direction: string; destination: string; date: string; time: string; seats: number; vehicle: string }) => {
      if (!user || !profile) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("rides").insert({
        user_id: user.id,
        name: profile.name,
        phone: profile.phone,
        ...ride,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useDeleteRide() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      // Post system message before deleting (FK cascade will remove it, but realtime picks it up)
      if (user && profile) {
        await supabase.from("ride_messages").insert({
          ride_id: id,
          user_id: user.id,
          user_name: "System",
          message: "🚫 Ride has been cancelled by the driver",
          is_quick_action: true,
        }).catch(() => {});
      }

      // Before deleting, notify approved co-commuters by changing status
      const { data: approvedReqs } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", id)
        .in("status", ["approved", "pending"]);

      if (approvedReqs && approvedReqs.length > 0) {
        await supabase
          .from("ride_requests")
          .update({ status: "cancelled_by_driver" })
          .eq("ride_id", id)
          .in("status", ["approved", "pending"]);
      }

      const { error } = await supabase.from("rides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["completionStats"] });
    },
  });
}

export function useCompletionStats(userId?: string) {
  return useQuery({
    queryKey: ["completionStats", userId],
    queryFn: async () => {
      if (!userId) return { ridesGiven: 0, ridesTaken: 0 };

      // Log any pending completions for past rides not yet recorded
      await supabase.rpc("log_pending_completions", { _user_id: userId });

      const { data, error } = await supabase
        .from("ride_completion_log")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      const ridesGiven = (data || []).filter((r) => r.role === "driver").length;
      const ridesTaken = (data || []).filter((r) => r.role === "passenger").length;

      return { ridesGiven, ridesTaken };
    },
    enabled: !!userId,
  });
}

export function useRideHistory(userId?: string) {
  return useQuery({
    queryKey: ["rideHistory", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ride_completion_log")
        .select("*")
        .eq("user_id", userId)
        .order("ride_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (rideId: string) => {
      if (!user || !profile) throw new Error("Not authenticated");

      // Check for existing active request
      const { data: existing } = await supabase
        .from("ride_requests")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("passenger_id", user.id)
        .not("status", "in", '("rejected","cancelled")');

      if (existing && existing.length > 0) {
        throw new Error("You have already requested this ride");
      }

      const { data, error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        passenger_id: user.id,
        passenger_name: profile.name,
        passenger_phone: profile.phone,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, rideId) => {
      // Record booking habit - find the ride to get its details
      const rides = qc.getQueryData<any[]>(["rides"]) || [];
      const ride = rides.find((r: any) => r.id === rideId);
      if (ride) {
        recordHabit({
          time: ride.time,
          direction: ride.direction,
          destination: ride.destination,
          action: "booked",
          date: ride.date,
        });
      }
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ride_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}
