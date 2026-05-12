import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GroceryItem = {
  id: string;
  user_id: string;
  list_owner_id: string;
  name: string;
  category: string;
  checked: boolean;
  created_at: string;
};

export const GROCERY_CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "grains",
  "snacks",
  "beverages",
  "frozen",
  "other",
] as const;

export const CATEGORY_EMOJIS: Record<string, string> = {
  produce: "🥬",
  dairy: "🧀",
  meat: "🥩",
  grains: "🌾",
  snacks: "🍪",
  beverages: "🥤",
  frozen: "🧊",
  other: "📦",
};

/**
 * Fetch grocery items for a list. Pass the owner's user id (for a shared
 * list) or undefined to load the current user's own list.
 */
export function useGroceryItems(listOwnerId?: string) {
  return useQuery({
    queryKey: ["grocery_items", listOwnerId ?? "me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const ownerId = listOwnerId || user.id;
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("list_owner_id", ownerId)
        .order("checked")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GroceryItem[];
    },
  });
}

export function useAddGroceryItem(listOwnerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { name: string; category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ownerId = listOwnerId || user.id;
      const { error } = await supabase.from("grocery_items").insert({
        ...item,
        user_id: user.id,
        list_owner_id: ownerId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_items"] }),
  });
}

export function useToggleGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase.from("grocery_items").update({ checked }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_items"] }),
  });
}

export function useDeleteGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grocery_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_items"] }),
  });
}

export function useClearCheckedGroceryItems(listOwnerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ownerId = listOwnerId || user.id;
      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("list_owner_id", ownerId)
        .eq("checked", true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_items"] }),
  });
}

/**
 * Subscribe to realtime changes on a grocery list so collaborators see each
 * other's adds, checks, and deletes instantly.
 */
export function useRealtimeGroceryList(listOwnerId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!listOwnerId) return;
    const channel = supabase
      .channel(`grocery_items:${listOwnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
          filter: `list_owner_id=eq.${listOwnerId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["grocery_items", listOwnerId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listOwnerId, qc]);
}
