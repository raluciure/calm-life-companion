import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
};

export type SharedItem = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  item_type: string;
  item_id: string;
  message: string | null;
  created_at: string;
};

export function useMyProfile() {
  return useQuery({
    queryKey: ["my_profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      // Auto-create if missing (for existing users)
      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, display_name: user.email?.split("@")[0] || "User" })
          .select()
          .single();
        if (createErr) throw createErr;
        return created as Profile;
      }
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_profile"] }),
  });
}

export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ["search_profiles", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user.id)
        .ilike("display_name", `%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data || []) as Profile[];
    },
    enabled: query.length >= 2,
  });
}

// Friends
export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      return (data || []) as Friendship[];
    },
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ["pending_requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return (data || []) as Friendship[];
    },
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("friendships")
        .insert({ requester_id: user.id, addressee_id: addresseeId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["pending_requests"] });
      qc.invalidateQueries({ queryKey: ["search_profiles"] });
    },
  });
}

export function useRespondToRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["pending_requests"] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });
}

// Sent (outgoing) friend requests
export function useSentRequests() {
  return useQuery({
    queryKey: ["sent_requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("requester_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return (data || []) as Friendship[];
    },
  });
}

export function useCancelFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sent_requests"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["search_profiles"] });
    },
  });
}

// Profiles by IDs (for resolving friend names)
export function useProfilesByIds(userIds: string[]) {
  return useQuery({
    queryKey: ["profiles_by_ids", userIds],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);
      if (error) throw error;
      return (data || []) as Profile[];
    },
    enabled: userIds.length > 0,
  });
}

// Sharing
export function useSharedWithMe() {
  return useQuery({
    queryKey: ["shared_with_me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("shared_items")
        .select("*")
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SharedItem[];
    },
  });
}

export function useShareItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { to_user_id: string; item_type: string; item_id: string; message?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("shared_items")
        .insert({ ...item, from_user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shared_with_me"] }),
  });
}

// Stats
export function useUserStats() {
  return useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { workouts: 0, meals: 0, items: 0 };
      const [w, m, i] = await Promise.all([
        supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("meals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("done", true),
      ]);
      return {
        workouts: w.count || 0,
        meals: m.count || 0,
        items: i.count || 0,
      };
    },
  });
}
