import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: string;
}

export interface Workout {
  id: string;
  date: string;
  title: string;
  emoji: string;
  duration_minutes: number | null;
  notes: string | null;
  exercises: Exercise[];
  created_at: string;
}

const toWorkout = (row: any): Workout => ({
  id: row.id,
  date: row.date,
  title: row.title,
  emoji: row.emoji,
  duration_minutes: row.duration_minutes,
  notes: row.notes,
  exercises: (row.exercises as Exercise[]) || [],
  created_at: row.created_at,
});

export function useWorkouts(limit = 10) {
  return useQuery({
    queryKey: ["workouts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map(toWorkout);
    },
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workout: {
      title: string;
      emoji: string;
      date: string;
      duration_minutes?: number;
      notes?: string;
      exercises?: Exercise[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("workouts").insert({
        ...workout,
        user_id: user.id,
        exercises: workout.exercises || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}
