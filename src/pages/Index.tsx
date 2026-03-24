import { useState, useEffect, useMemo } from "react";
import { format, isToday, isThisWeek, isThisMonth, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, addDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Greeting from "@/components/Greeting";
import TimelineItem, { type TimelineItemData } from "@/components/TimelineItem";
import QuickAdd from "@/components/QuickAdd";
import TomorrowPreview from "@/components/TomorrowPreview";
import FreeTimeMessage from "@/components/FreeTimeMessage";
import DateNavigator from "@/components/DateNavigator";
import ViewSwitcher, { type ViewMode } from "@/components/ViewSwitcher";
import WeeklyView from "@/components/WeeklyView";
import MonthlyView from "@/components/MonthlyView";
import AuthGate from "@/components/AuthGate";
import HealthSection from "@/components/HealthSection";
import { useItems, useTomorrowItems, useAddItem, useToggleItem, useDeleteItem } from "@/hooks/useItems";
import { motion } from "framer-motion";
import { LogOut, CalendarDays as CalendarIcon, Heart } from "lucide-react";

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const MainApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const dateStr = toDateStr(selectedDate);
  const viewingToday = isToday(selectedDate);

  const { data: items = [], isLoading } = useItems(dateStr);
  const { data: tomorrowItems = [] } = useTomorrowItems();
  const addItem = useAddItem();
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();

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
      end_time: newItem.endTime || null,
      date: dateStr,
    });
  };

  // Navigate based on view mode
  const handleDateNav = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      if (viewMode === "week") return direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1);
      if (viewMode === "month") return direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1);
      return prev; // day mode uses DateNavigator directly
    });
  };

  // When tapping a day in week/month view, switch to day view
  const handleDayTap = (date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  const handleSignOut = () => supabase.auth.signOut();

  const timedItems = items.filter((i) => i.time).sort((a, b) => (a.time! > b.time! ? 1 : -1));
  const untimedItems = items.filter((i) => !i.time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <button
            onClick={handleSignOut}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <Greeting />

        {/* View Switcher */}
        <ViewSwitcher active={viewMode} onChange={setViewMode} />

        {/* Navigation for week/month */}
        {viewMode !== "day" && (() => {
          const isCurrentPeriod = viewMode === "week"
            ? isThisWeek(selectedDate, { weekStartsOn: 1 })
            : isThisMonth(selectedDate);

          const periodLabel = viewMode === "week"
            ? (() => {
                const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
                return `${format(ws, "MMM d")} – ${format(addDays(ws, 6), "MMM d")}`;
              })()
            : format(selectedDate, "MMMM yyyy");

          return (
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleDateNav("prev")}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-body"
              >
                ←
              </button>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-body font-medium text-foreground">
                  {periodLabel}
                </span>
                {!isCurrentPeriod && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-body text-primary hover:text-primary/80 transition-colors"
                  >
                    Back to today
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDateNav("next")}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-body"
              >
                →
              </button>
            </div>
          );
        })()}

        {/* Day View */}
        {viewMode === "day" && (
          <>
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
                    <TimelineItem key={item.id} item={item} index={i} onToggle={handleToggle} onDelete={(id) => deleteItem.mutate(id)} />
                  ))}
                  {untimedItems.map((item, i) => (
                    <TimelineItem key={item.id} item={item} index={timedItems.length + i} onToggle={handleToggle} onDelete={(id) => deleteItem.mutate(id)} />
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
          </>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <WeeklyView selectedDate={selectedDate} onDayTap={handleDayTap} />
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <MonthlyView selectedDate={selectedDate} onDayTap={handleDayTap} />
        )}

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

  return <MainApp />;
};

export default Index;
