import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("favorite_user_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((f) => f.favorite_user_id);
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (favoriteUserId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("favorite_user_id", favoriteUserId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" as const };
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, favorite_user_id: favoriteUserId });
        if (error) throw error;
        return { action: "added" as const };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
