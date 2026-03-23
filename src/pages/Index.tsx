import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Greeting from "@/components/Greeting";
import TimelineItem, { type TimelineItemData } from "@/components/TimelineItem";
import QuickAdd from "@/components/QuickAdd";
import TomorrowPreview from "@/components/TomorrowPreview";
import FreeTimeMessage from "@/components/FreeTimeMessage";
import AuthGate from "@/components/AuthGate";
import { useItems, useTomorrowItems, useAddItem, useToggleItem } from "@/hooks/useItems";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

const TodayView = () => {
  const { data: items = [], isLoading } = useItems();
  const { data: tomorrowItems = [] } = useTomorrowItems();
  const addItem = useAddItem();
  const toggleItem = useToggleItem();

  const handleToggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) toggleItem.mutate({ id, done: !item.done });
  };

  const handleAdd = (newItem: TimelineItemData) => {
    addItem.mutate({
      title: newItem.title,
      emoji: newItem.emoji,
      category: newItem.category,
      time: newItem.time || null,
    });
  };

  const handleSignOut = () => supabase.auth.signOut();

  const timedItems = items.filter((i) => i.time).sort((a, b) => (a.time! > b.time! ? 1 : -1));
  const untimedItems = items.filter((i) => !i.time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-10 space-y-8">
        {/* Header with sign out */}
        <div className="flex justify-end">
          <button
            onClick={handleSignOut}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <Greeting />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground mb-4 px-1">
            Today
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-secondary/50 animate-gentle-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {timedItems.map((item, i) => (
                <TimelineItem key={item.id} item={item} index={i} onToggle={handleToggle} />
              ))}
              {untimedItems.map((item, i) => (
                <TimelineItem key={item.id} item={item} index={timedItems.length + i} onToggle={handleToggle} />
              ))}
              {items.length === 0 && !isLoading && (
                <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
                  A fresh start — add something below ✨
                </p>
              )}
            </div>
          )}
          {items.length > 0 && <FreeTimeMessage />}
        </motion.div>

        <QuickAdd onAdd={handleAdd} />

        <TomorrowPreview items={tomorrowItems} />

        <p className="text-center text-xs text-muted-foreground/40 font-body pt-4">hush</p>
      </div>
    </div>
  );
};

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground/50 font-display text-lg animate-gentle-pulse">hush</p>
      </div>
    );
  }

  if (!session) return <AuthGate>{null}</AuthGate>;

  return <TodayView />;
};

export default Index;
