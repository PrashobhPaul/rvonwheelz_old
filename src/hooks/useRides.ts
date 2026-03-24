import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    mutationFn: async (ride: { direction: string; date: string; time: string; seats: number; vehicle: string }) => {
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
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (rideId: string) => {
      if (!user || !profile) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        passenger_id: user.id,
        passenger_name: profile.name,
        passenger_phone: profile.phone,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
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
