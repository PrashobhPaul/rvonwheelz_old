import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useRideMessages(rideId: string | null) {
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!rideId) return;
    const channel = supabase
      .channel(`ride-chat-${rideId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ride_messages", filter: `ride_id=eq.${rideId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["ride_messages", rideId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rideId, qc]);

  return useQuery({
    queryKey: ["ride_messages", rideId],
    queryFn: async () => {
      if (!rideId) return [];
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!rideId,
    refetchInterval: 30000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ rideId, message, isQuickAction = false }: { rideId: string; message: string; isQuickAction?: boolean }) => {
      if (!user || !profile) throw new Error("Not authenticated");
      const { error } = await supabase.from("ride_messages").insert({
        ride_id: rideId,
        user_id: user.id,
        user_name: profile.name,
        message,
        is_quick_action: isQuickAction,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ride_messages", vars.rideId] });
    },
  });
}
