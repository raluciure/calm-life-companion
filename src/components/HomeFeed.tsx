import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format, isToday } from "date-fns";
import { CalendarDays, Dumbbell, UtensilsCrossed, Users, Inbox } from "lucide-react";
import {
  useSharedWithMe,
  useFriends,
  useProfilesByIds,
  useUserStats,
  type Profile,
} from "@/hooks/useProfile";
import { useItems } from "@/hooks/useItems";
import { useMealsByDate } from "@/hooks/useMeals";
import { supabase } from "@/integrations/supabase/client";
import Greeting from "./Greeting";
import SharedItemDialog from "./SharedItemDialog";
import { openSharedGrocery } from "@/lib/sharedNav";

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const HomeFeed = () => {
  const today = toDateStr(new Date());
  const { data: todayItems = [] } = useItems(today);
  const { data: todayMeals = [] } = useMealsByDate(today);
  const { data: stats } = useUserStats();
  const { data: sharedItems = [] } = useSharedWithMe();
  const { data: friends = [] } = useFriends();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id || null));
  }, []);

  // Resolve friend/shared profiles
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    sharedItems.forEach((s) => ids.add(s.from_user_id));
    friends.forEach((f) => {
      ids.add(f.requester_id);
      ids.add(f.addressee_id);
    });
    return [...ids].filter(Boolean);
  }, [sharedItems, friends]);

  const { data: profiles = [] } = useProfilesByIds(allUserIds);
  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => (m[p.user_id] = p));
    return m;
  }, [profiles]);

  const doneCount = todayItems.filter((i) => i.done).length;
  const totalCount = todayItems.length;

  // Red-dot tracking: items newer than last-seen timestamp are "new"
  const LAST_SEEN_KEY = "shared_items_last_seen";
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(LAST_SEEN_KEY) : null;
    return v ? parseInt(v, 10) : 0;
  });
  const newCount = sharedItems.filter((s) => new Date(s.created_at).getTime() > lastSeen).length;

  // Mark as seen 1.5s after the section is on screen with new items
  useEffect(() => {
    if (newCount === 0 || sharedItems.length === 0) return;
    const latest = Math.max(...sharedItems.map((s) => new Date(s.created_at).getTime()));
    const t = setTimeout(() => {
      localStorage.setItem(LAST_SEEN_KEY, String(latest));
      setLastSeen(latest);
    }, 1500);
    return () => clearTimeout(t);
  }, [newCount, sharedItems]);

  const typeLabels: Record<string, { emoji: string; label: string }> = {
    workout: { emoji: "💪", label: "Workout" },
    meal: { emoji: "🍽️", label: "Meal" },
    item: { emoji: "📋", label: "Task" },
    grocery_list: { emoji: "🛒", label: "Grocery list" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <Greeting />

      {/* Your Day Summary */}
      <div className="space-y-2">
        <p className="text-xs font-body font-medium text-muted-foreground px-1">Your day at a glance</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/30">
            <CalendarDays className="w-4 h-4 text-primary/70" />
            <span className="text-lg font-display font-light text-foreground">{doneCount}/{totalCount}</span>
            <span className="text-[10px] font-body text-muted-foreground">Tasks</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/30">
            <UtensilsCrossed className="w-4 h-4 text-primary/70" />
            <span className="text-lg font-display font-light text-foreground">{todayMeals.length}</span>
            <span className="text-[10px] font-body text-muted-foreground">Meals</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/30">
            <Users className="w-4 h-4 text-primary/70" />
            <span className="text-lg font-display font-light text-foreground">{friends.length}</span>
            <span className="text-[10px] font-body text-muted-foreground">Friends</span>
          </div>
        </div>
      </div>

      {/* Shared With You */}
      <div className="space-y-2">
        <p className="text-xs font-body font-medium text-muted-foreground px-1 flex items-center gap-1.5">
          <Inbox className="w-3.5 h-3.5" /> Shared with you
          {newCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
              {newCount}
            </span>
          )}
        </p>
        {sharedItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground/50 font-body italic py-6">
            Nothing shared yet — connect with friends! 💌
          </p>
        ) : (
          <div className="space-y-1.5">
            {sharedItems.slice(0, 10).map((item) => {
              const sender = profileMap[item.from_user_id];
              const t = typeLabels[item.item_type] || { emoji: "📎", label: item.item_type };
              const isNew = new Date(item.created_at).getTime() > lastSeen;
              return (
                <div key={item.id} className="relative p-3 rounded-xl bg-secondary/30 space-y-1">
                  {isNew && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {sender?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-body text-foreground font-medium">
                        {sender?.display_name || "Someone"}
                      </span>
                      <span className="text-xs font-body text-muted-foreground ml-1">
                        shared a {t.label.toLowerCase()} {t.emoji}
                      </span>
                    </div>
                    <span className="text-[10px] font-body text-muted-foreground/50 shrink-0">
                      {format(new Date(item.created_at), "MMM d")}
                    </span>
                  </div>
                  {item.message && (
                    <p className="text-[11px] font-body text-muted-foreground/70 pl-9 italic">
                      {item.message.length > 80 ? item.message.slice(0, 80) + "…" : item.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HomeFeed;
