import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Heart, Dumbbell, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, addDays } from "date-fns";
import HealthSection from "./HealthSection";
import GymSection from "./GymSection";
import MealSection from "./MealSection";
import ViewSwitcher, { type ViewMode } from "./ViewSwitcher";
import DateNavigator from "./DateNavigator";
import TimelineItem, { type TimelineItemData } from "./TimelineItem";
import QuickAdd from "./QuickAdd";
import TomorrowPreview from "./TomorrowPreview";
import FreeTimeMessage from "./FreeTimeMessage";
import WeeklyView from "./WeeklyView";
import MonthlyView from "./MonthlyView";
import { useItems, useTomorrowItems, useAddItem, useToggleItem, useDeleteItem } from "@/hooks/useItems";
import { useFeatures } from "@/hooks/useFeatures";
import { onOpenSharedGrocery, PENDING_KEY } from "@/lib/sharedNav";

type DailyLifeSection = "schedule" | "health" | "gym" | "meals";

const allSections: { key: DailyLifeSection; icon: typeof CalendarDays; label: string; emoji: string; desc: string }[] = [
  { key: "schedule", icon: CalendarDays, label: "Schedule", emoji: "📅", desc: "Plan your day" },
  { key: "health", icon: Heart, label: "Health", emoji: "🫶", desc: "Meds & period" },
  { key: "gym", icon: Dumbbell, label: "Gym", emoji: "🏋️", desc: "Track workouts" },
  { key: "meals", icon: UtensilsCrossed, label: "Meals", emoji: "🍽️", desc: "Nutrition & groceries" },
];

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const DailyLife = () => {
  const [activeSection, setActiveSection] = useState<DailyLifeSection | null>(null);
  const { features } = useFeatures();
  const sections = allSections.filter((s) => features[s.key]);

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_KEY) : null;
    if (pending) setActiveSection("meals");
    return onOpenSharedGrocery(() => setActiveSection("meals"));
  }, []);

  if (activeSection) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4 relative"
      >
        <button
          onClick={() => setActiveSection(null)}
          className="absolute left-0 top-1 z-10 flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to Daily Life"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Daily Life</span>
        </button>

        {activeSection === "schedule" && <ScheduleContent />}
        {activeSection === "health" && <HealthSection />}
        {activeSection === "gym" && <GymSection />}
        {activeSection === "meals" && <MealSection />}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
          🌿 Daily Life
        </h1>
        <p className="text-sm font-body text-muted-foreground">
          Your routines in one place
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-secondary/25 border border-border/30 hover:bg-secondary/40 hover:border-primary/20 transition-all active:scale-[0.97]"
          >
            <span className="text-2xl">{sec.emoji}</span>
            <span className="text-sm font-body font-medium text-foreground">{sec.label}</span>
            <span className="text-[10px] font-body text-muted-foreground">{sec.desc}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ── Schedule content ──
const ScheduleContent = () => {
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
      title: newItem.title, emoji: newItem.emoji, category: newItem.category,
      time: newItem.time || null, end_time: newItem.endTime || null, date: dateStr,
    });
  };

  const handleDateNav = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      if (viewMode === "week") return direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1);
      if (viewMode === "month") return direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1);
      return prev;
    });
  };

  const handleDayTap = (date: Date) => { setSelectedDate(date); setViewMode("day"); };

  const parseTime = (t: string) => {
    const match = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return 0;
    let h = parseInt(match[1]); const m = parseInt(match[2] || "0");
    const pm = match[3].toUpperCase() === "PM";
    if (pm && h !== 12) h += 12; if (!pm && h === 12) h = 0;
    return h * 60 + m;
  };

  const timedItems = items.filter((i) => i.time).sort((a, b) => parseTime(a.time!) - parseTime(b.time!));
  const untimedItems = items.filter((i) => !i.time);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">📅 Schedule</h1>
        <p className="text-sm font-body text-muted-foreground">Plan your day</p>
      </div>

      <ViewSwitcher active={viewMode} onChange={setViewMode} />

      {viewMode !== "day" && (() => {
        const isCurrentPeriod = viewMode === "week"
          ? isThisWeek(selectedDate, { weekStartsOn: 1 }) : isThisMonth(selectedDate);
        const periodLabel = viewMode === "week"
          ? (() => { const ws = startOfWeek(selectedDate, { weekStartsOn: 1 }); return `${format(ws, "MMM d")} – ${format(addDays(ws, 6), "MMM d")}`; })()
          : format(selectedDate, "MMMM yyyy");
        return (
          <div className="flex items-center justify-between">
            <button onClick={() => handleDateNav("prev")} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-body">←</button>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-body font-medium text-foreground">{periodLabel}</span>
              {!isCurrentPeriod && <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-body text-primary hover:text-primary/80 transition-colors">Back to today</button>}
            </div>
            <button onClick={() => handleDateNav("next")} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-sm font-body">→</button>
          </div>
        );
      })()}

      {viewMode === "day" && (
        <>
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <motion.div key={dateStr} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-secondary/50 animate-gentle-pulse" />)}</div>
            ) : (
              <div className="space-y-2">
                {timedItems.map((item, i) => <TimelineItem key={item.id} item={item} index={i} onToggle={handleToggle} onDelete={(id) => deleteItem.mutate(id)} />)}
                {untimedItems.map((item, i) => <TimelineItem key={item.id} item={item} index={timedItems.length + i} onToggle={handleToggle} onDelete={(id) => deleteItem.mutate(id)} />)}
                {items.length === 0 && <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">{viewingToday ? "A fresh start — add something below ✨" : "Nothing planned — keep it open 🌿"}</p>}
              </div>
            )}
            {items.length > 0 && <FreeTimeMessage />}
          </motion.div>
          <QuickAdd onAdd={handleAdd} dateLabel={viewingToday ? undefined : format(selectedDate, "MMM d")} />
          {viewingToday && <TomorrowPreview items={tomorrowItems} />}
        </>
      )}

      {viewMode === "week" && <WeeklyView selectedDate={selectedDate} onDayTap={handleDayTap} />}
      {viewMode === "month" && <MonthlyView selectedDate={selectedDate} onDayTap={handleDayTap} />}
    </div>
  );
};

export default DailyLife;
