import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const todayStr = () => new Date().toISOString().split("T")[0];

// ── Period Logs ──

export interface PeriodLog {
  id: string;
  date: string;
  flow: string;
  notes: string | null;
}

export function usePeriodLogs(month: string) {
  // month = "2026-03"
  return useQuery({
    queryKey: ["period-logs", month],
    queryFn: async () => {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      const { data, error } = await supabase
        .from("period_logs")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as PeriodLog[];
    },
  });
}

export function useTogglePeriodDay() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, flow }: { date: string; flow?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Check if log exists
      const { data: existing } = await supabase
        .from("period_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        // Remove it (toggle off)
        const { error } = await supabase.from("period_logs").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        // Add it
        const { error } = await supabase.from("period_logs").insert({
          user_id: user.id,
          date,
          flow: flow || "medium",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["period-logs"] });
    },
  });
}

// ── Medications ──

export interface Medication {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
}

export function useMedications() {
  return useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Medication[];
    },
  });
}

export function useAddMedication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, emoji }: { name: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("medications").insert({
        user_id: user.id,
        name,
        emoji,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useDeleteMedication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["medication-logs"] });
    },
  });
}

// ── Medication Logs (daily check-offs) ──

export interface MedicationLog {
  id: string;
  medication_id: string;
  date: string;
  taken: boolean;
}

export function useTodayMedLogs() {
  return useQuery({
    queryKey: ["medication-logs", todayStr()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_logs")
        .select("*")
        .eq("date", todayStr());
      if (error) throw error;
      return (data || []) as MedicationLog[];
    },
  });
}

export function useMedLogsByMonth(month: string) {
  // month = "2026-03"
  return useQuery({
    queryKey: ["medication-logs", "month", month],
    queryFn: async () => {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      const { data, error } = await supabase
        .from("medication_logs")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as MedicationLog[];
    },
  });
}

export function useToggleMedLog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ medicationId, date }: { medicationId: string; date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: existing } = await supabase
        .from("medication_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("medication_id", medicationId)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("medication_logs").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("medication_logs").insert({
          user_id: user.id,
          medication_id: medicationId,
          date,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medication-logs"] });
    },
  });
}

// ── Period Symptoms ──

export interface PeriodSymptom {
  id: string;
  date: string;
  symptom: string;
  severity: number;
}

export function usePeriodSymptoms(month: string) {
  return useQuery({
    queryKey: ["period-symptoms", month],
    queryFn: async () => {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      const { data, error } = await supabase
        .from("period_symptoms")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as PeriodSymptom[];
    },
  });
}

export function useToggleSymptom() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, symptom, severity }: { date: string; symptom: string; severity?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: existing } = await supabase
        .from("period_symptoms")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", date)
        .eq("symptom", symptom)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("period_symptoms").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("period_symptoms").insert({
          user_id: user.id,
          date,
          symptom,
          severity: severity || 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["period-symptoms"] });
    },
  });
}
