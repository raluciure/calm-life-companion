import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TimelineItemData } from "@/components/TimelineItem";
import type { Database } from "@/integrations/supabase/types";

type DbItem = Database["public"]["Tables"]["items"]["Row"];
type DbInsert = Database["public"]["Tables"]["items"]["Insert"];

export const toTimelineItem = (row: DbItem): TimelineItemData => ({
  id: row.id,
  time: row.time || undefined,
  endTime: row.end_time || undefined,
  title: row.title,
  emoji: row.emoji,
  category: row.category,
  done: row.done,
});

const todayStr = () => new Date().toISOString().split("T")[0];
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export function useItems(date?: string) {
  const targetDate = date || todayStr();

  return useQuery({
    queryKey: ["items", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("date", targetDate)
        .order("time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []).map(toTimelineItem);
    },
  });
}

export interface DayItems {
  date: string;
  items: TimelineItemData[];
}

export function useItemsRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["items-range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .order("time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      
      // Group by date
      const grouped: Record<string, TimelineItemData[]> = {};
      for (const row of data || []) {
        const d = row.date;
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(toTimelineItem(row));
      }
      return grouped;
    },
  });
}

export function useTomorrowItems() {
  return useItems(tomorrowStr());
}

export function useAddItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<DbInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("items").insert({
        ...item,
        user_id: user.id,
        date: item.date || todayStr(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items-range"] });
    },
  });
}

export function useToggleItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("items")
        .update({ done })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items-range"] });
    },
  });
}
