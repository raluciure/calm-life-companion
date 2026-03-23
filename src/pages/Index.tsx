import { useState, useEffect } from "react";
import { format, isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Greeting from "@/components/Greeting";
import TimelineItem, { type TimelineItemData } from "@/components/TimelineItem";
import QuickAdd from "@/components/QuickAdd";
import TomorrowPreview from "@/components/TomorrowPreview";
import FreeTimeMessage from "@/components/FreeTimeMessage";
import DateNavigator from "@/components/DateNavigator";
import AuthGate from "@/components/AuthGate";
import { useItems, useTomorrowItems, useAddItem, useToggleItem } from "@/hooks/useItems";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const TodayView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = toDateStr(selectedDate);
  const viewingToday = isToday(selectedDate);

  const { data: items = [], isLoading } = useItems(dateStr);
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
      date: dateStr,
    });
  };

  const handleSignOut = () => supabase.auth.signOut();

  const timedItems = items.filter((i) => i.time).sort((a, b) => (a.time! > b.time! ? 1 : -1));
  const untimedItems = items.filter((i) => !i.time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-10 space-y-8">
        <div className="flex justify-end">
          <button
            onClick={handleSignOut}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <Greeting />

        {/* Date Navigator */}
        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

        <motion.div
          key={dateStr}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
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
              {items.length === 0 && (
                <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
                  {viewingToday ? "A fresh start — add something below ✨" : "Nothing planned — keep it open 🌿"}
                </p>
              )}
            </div>
          )}
          {items.length > 0 && <FreeTimeMessage />}
        </motion.div>

        <QuickAdd onAdd={handleAdd} dateLabel={viewingToday ? undefined : format(selectedDate, "MMM d")} />

        {viewingToday && <TomorrowPreview items={tomorrowItems} />}

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
