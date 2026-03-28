import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GroceryItem = {
  id: string;
  user_id: string;
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

export function useGroceryItems() {
  return useQuery({
    queryKey: ["grocery_items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("checked")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GroceryItem[];
    },
  });
}

export function useAddGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { name: string; category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("grocery_items").insert({ ...item, user_id: user.id });
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

export function useClearCheckedGroceryItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("user_id", user.id)
        .eq("checked", true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grocery_items"] }),
  });
}
