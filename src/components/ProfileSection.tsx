import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Search, Check, X, Trash2, Send, Pencil, Dumbbell, UtensilsCrossed, CalendarDays, Share2, ChevronRight, LogOut, Settings, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatures, type FeatureKey } from "@/hooks/useFeatures";
import { Switch } from "@/components/ui/switch";
import {
  useMyProfile,
  useUpdateProfile,
  useSearchProfiles,
  useFriends,
  usePendingRequests,
  useSendFriendRequest,
  useRespondToRequest,
  useRemoveFriend,
  useProfilesByIds,
  useSharedWithMe,
  useShareItem,
  useUserStats,
  useSentRequests,
  useCancelFriendRequest,
  type Profile,
} from "@/hooks/useProfile";
import { toast } from "sonner";
import SharedItemDialog from "./SharedItemDialog";
import { openSharedGrocery } from "@/lib/sharedNav";

type ProfileTab = "profile" | "friends" | "shared" | "settings";

const ProfileSection = () => {
  const [tab, setTab] = useState<ProfileTab>("profile");
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const startEdit = () => {
    setName(profile?.display_name || "");
    setEditing(true);
  };

  const saveEdit = () => {
    if (name.trim()) {
      updateProfile.mutate({ display_name: name.trim() });
      toast.success("Name updated");
    }
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-display text-primary">
          {profile?.display_name?.[0]?.toUpperCase() || "?"}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-body text-sm outline-none focus:border-primary/30"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            />
            <button onClick={saveEdit} className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
              {profile?.display_name || "User"}
            </h1>
            <button
              onClick={startEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-secondary/50 p-1 gap-1 flex-wrap justify-center">
          {([
            { key: "profile", label: "👤 Me" },
            { key: "friends", label: "👥 Friends" },
            { key: "shared", label: "📬 Shared" },
            { key: "settings", label: "⚙️ Settings" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all ${
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "profile" && <MyProfileTab key="profile" />}
        {tab === "friends" && <FriendsTab key="friends" />}
        {tab === "shared" && <SharedTab key="shared" />}
        {tab === "settings" && <SettingsTab key="settings" />}
      </AnimatePresence>
    </motion.div>
  );
};

// ---- My Profile Tab ----
const MyProfileTab = () => {
  const { data: profile, isLoading } = useMyProfile();
  const { data: stats } = useUserStats();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-gentle-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Dumbbell, label: "Workouts", value: stats?.workouts || 0 },
          { icon: UtensilsCrossed, label: "Meals", value: stats?.meals || 0 },
          { icon: CalendarDays, label: "Tasks done", value: stats?.items || 0 },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/30">
            <stat.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-display font-light text-foreground">{stat.value}</span>
            <span className="text-[10px] font-body text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Log out */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/40 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-sm font-body"
      >
        <LogOut className="w-4 h-4" />
        <span>Log out</span>
      </button>
    </motion.div>
  );
};

// ---- Friends Tab ----
const FriendsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const { data: searchResults = [] } = useSearchProfiles(searchQuery);
  const { data: friends = [] } = useFriends();
  const { data: pendingRequests = [] } = usePendingRequests();
  const { data: sentRequests = [] } = useSentRequests();
  const sendRequest = useSendFriendRequest();
  const respondToRequest = useRespondToRequest();
  const removeFriend = useRemoveFriend();
  const cancelRequest = useCancelFriendRequest();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id || null));
  }, []);

  // Get friend user IDs to resolve names
  const friendUserIds = useMemo(() => {
    if (!myUserId) return [];
    return friends.map((f) => f.requester_id === myUserId ? f.addressee_id : f.requester_id);
  }, [friends, myUserId]);

  const pendingUserIds = useMemo(() => pendingRequests.map((r) => r.requester_id), [pendingRequests]);
  const sentUserIds = useMemo(() => sentRequests.map((r) => r.addressee_id), [sentRequests]);

  const allIds = useMemo(() => [...new Set([...friendUserIds, ...pendingUserIds, ...sentUserIds])], [friendUserIds, pendingUserIds, sentUserIds]);
  const { data: profiles = [] } = useProfilesByIds(allIds);
  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => (m[p.user_id] = p));
    return m;
  }, [profiles]);

  // Check existing friendships to prevent duplicate requests
  const existingFriendIds = useMemo(() => {
    const ids = new Set<string>();
    friends.forEach((f) => {
      ids.add(f.requester_id);
      ids.add(f.addressee_id);
    });
    pendingRequests.forEach((r) => ids.add(r.requester_id));
    sentRequests.forEach((r) => ids.add(r.addressee_id));
    return ids;
  }, [friends, pendingRequests, sentRequests]);

  const handleSend = (userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => toast.success("Friend request sent!"),
      onError: () => toast.error("Could not send request"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find people..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-all"
        />
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="space-y-1.5">
          <p className="text-xs font-body text-muted-foreground px-1">Results</p>
          {searchResults.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground/60 font-body py-4">No users found</p>
          ) : (
            searchResults.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-body">
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-body text-foreground">{p.display_name}</span>
                </div>
                {existingFriendIds.has(p.user_id) ? (
                  <span className="text-xs font-body text-muted-foreground">Added</span>
                ) : (
                  <button
                    onClick={() => handleSend(p.user_id)}
                    disabled={sendRequest.isPending}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-body text-muted-foreground px-1">
            Friend requests ({pendingRequests.length})
          </p>
          {pendingRequests.map((req) => {
            const p = profileMap[req.requester_id];
            return (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-body">
                    {p?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-body text-foreground">{p?.display_name || "User"}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => respondToRequest.mutate({ id: req.id, status: "accepted" }, { onSuccess: () => toast.success("Friend added!") })}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => respondToRequest.mutate({ id: req.id, status: "rejected" })}
                    className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-body text-muted-foreground px-1">
            Sent requests ({sentRequests.length})
          </p>
          {sentRequests.map((req) => {
            const p = profileMap[req.addressee_id];
            return (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-body">
                    {p?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <span className="text-sm font-body text-foreground">{p?.display_name || "User"}</span>
                    <span className="text-[10px] font-body text-muted-foreground ml-2">Pending</span>
                  </div>
                </div>
                <button
                  onClick={() => cancelRequest.mutate(req.id, { onSuccess: () => toast.success("Request cancelled") })}
                  className="p-2 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-1.5">
        <p className="text-xs font-body text-muted-foreground px-1">
          Your friends ({friends.length})
        </p>
        {friends.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground/60 font-body italic py-6">
            Search for people to add friends ✨
          </p>
        ) : (
          friends.map((f) => {
            const friendId = myUserId && f.requester_id === myUserId ? f.addressee_id : f.requester_id;
            const p = profileMap[friendId];
            return (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-body">
                    {p?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-body text-foreground">{p?.display_name || "User"}</span>
                </div>
                <button
                  onClick={() => removeFriend.mutate(f.id, { onSuccess: () => toast.success("Friend removed") })}
                  className="p-2 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};


// ---- Shared Tab ----
const SharedTab = () => {
  const { data: sharedItems = [] } = useSharedWithMe();
  const [openItem, setOpenItem] = useState<{ type: string; id: string; sender?: string } | null>(null);

  const allUserIds = useMemo(() => {
    return [...new Set(sharedItems.map((s) => s.from_user_id))];
  }, [sharedItems]);
  const { data: profiles = [] } = useProfilesByIds(allUserIds);
  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => (m[p.user_id] = p));
    return m;
  }, [profiles]);

  const typeLabels: Record<string, { emoji: string; label: string }> = {
    workout: { emoji: "💪", label: "Workout" },
    meal: { emoji: "🍽️", label: "Meal" },
    item: { emoji: "📋", label: "Task" },
    grocery_list: { emoji: "🛒", label: "Grocery list" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3"
    >
      {sharedItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
          Nothing shared with you yet 📬
        </p>
      ) : (
        sharedItems.map((item) => {
          const sender = profileMap[item.from_user_id];
          const t = typeLabels[item.item_type] || { emoji: "📎", label: item.item_type };
          const isGrocery = item.item_type === "grocery_list";
          const handleOpen = () => {
            if (isGrocery) {
              openSharedGrocery(item.id);
            } else {
              setOpenItem({ type: item.item_type, id: item.item_id, sender: sender?.display_name });
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleOpen}
              className="w-full text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                  {sender?.display_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-body text-foreground font-medium">
                    {sender?.display_name || "Someone"}
                  </span>
                  <span className="text-xs font-body text-muted-foreground ml-1">
                    shared a {t.label.toLowerCase()} {t.emoji}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </div>
              {!isGrocery && item.message && (
                <p className="text-sm font-body text-foreground pl-9">"{item.message}"</p>
              )}
            </button>
          );
        })
      )}

      {openItem && (
        <SharedItemDialog
          open={!!openItem}
          onOpenChange={(o) => !o && setOpenItem(null)}
          itemType={openItem.type as any}
          itemId={openItem.id}
          senderName={openItem.sender}
        />
      )}
    </motion.div>
  );
};

// ---- Settings Tab ----
const SettingsTab = () => {
  const { features, toggle } = useFeatures();

  const groups: { title: string; items: { key: FeatureKey; emoji: string; label: string; desc: string }[] }[] = [
    {
      title: "Daily Life sections",
      items: [
        { key: "schedule", emoji: "📅", label: "Schedule", desc: "Plan your day" },
        { key: "todos", emoji: "✅", label: "To-do list", desc: "Quick checklist" },
        { key: "health", emoji: "🫶", label: "Health", desc: "Meds & period tracking" },
        { key: "gym", emoji: "🏋️", label: "Gym", desc: "Track workouts" },
        { key: "meals", emoji: "🍽️", label: "Meals", desc: "Nutrition & groceries" },
      ],
    },
    {
      title: "Health details",
      items: [
        { key: "meds", emoji: "💊", label: "Medications", desc: "Daily medication checklist" },
        { key: "period", emoji: "🌸", label: "Period", desc: "Cycle & symptoms" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5"
    >
      <p className="text-xs font-body text-muted-foreground text-center px-2">
        Choose which parts of your daily life you want to use. You can change these any time. ✨
      </p>

      {groups.map((g) => (
        <div key={g.title} className="space-y-2">
          <p className="text-xs font-body text-muted-foreground px-1">{g.title}</p>
          <div className="space-y-1.5">
            {g.items.map((it) => (
              <div
                key={it.key}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{it.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-body text-foreground">{it.label}</p>
                    <p className="text-[11px] font-body text-muted-foreground truncate">{it.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={!!features[it.key]}
                  onCheckedChange={(v) => toggle(it.key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default ProfileSection;
