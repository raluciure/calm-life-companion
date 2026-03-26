import { useState } from "react";
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePeriodLogs, useTogglePeriodDay, usePeriodSymptoms, useToggleSymptom } from "@/hooks/useHealth";

const SYMPTOMS = [
  { key: "cramps", emoji: "😣", label: "Cramps" },
  { key: "headache", emoji: "🤕", label: "Headache" },
  { key: "fatigue", emoji: "😴", label: "Fatigue" },
  { key: "bloating", emoji: "🫧", label: "Bloating" },
  { key: "mood_swings", emoji: "🎭", label: "Mood swings" },
  { key: "acne", emoji: "😖", label: "Acne" },
  { key: "back_pain", emoji: "🦴", label: "Back pain" },
  { key: "nausea", emoji: "🤢", label: "Nausea" },
];

const PeriodTracker = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const monthStr = format(viewDate, "yyyy-MM");
  const { data: logs = [] } = usePeriodLogs(monthStr);
  const { data: symptoms = [] } = usePeriodSymptoms(monthStr);
  const toggleDay = useTogglePeriodDay();
  const toggleSymptom = useToggleSymptom();

  const periodDates = new Set(logs.map((l) => l.date));

  const monthStart = startOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (days.length < 42) {
    days.push(d);
    d = addDays(d, 1);
  }
  while (days.length > 35) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !isSameMonth(day, viewDate))) {
      days.splice(-7);
    } else break;
  }

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const sortedDates = [...periodDates].sort();

  // Build symptom map: date -> Set of symptom keys
  const symptomsByDate = new Map<string, Set<string>>();
  symptoms.forEach((s) => {
    if (!symptomsByDate.has(s.date)) symptomsByDate.set(s.date, new Set());
    symptomsByDate.get(s.date)!.add(s.symptom);
  });

  const selectedSymptoms = selectedDate ? symptomsByDate.get(selectedDate) || new Set() : new Set();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-medium text-foreground flex items-center gap-2">
            🌸 Period Tracker
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-body text-muted-foreground min-w-[70px] text-center">
              {format(viewDate, "MMM yyyy")}
            </span>
            <button
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map((wd, i) => (
            <div key={i} className="text-center text-[9px] font-body text-muted-foreground/50 uppercase py-0.5">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, viewDate);
            const today = isToday(day);
            const isPeriod = periodDates.has(dateStr);
            const hasSymptoms = symptomsByDate.has(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (!inMonth) return;
                  if (selectedDate === dateStr) {
                    // Second tap toggles period
                    toggleDay.mutate({ date: dateStr });
                  } else {
                    setSelectedDate(dateStr);
                  }
                }}
                disabled={!inMonth}
                className={`aspect-square flex items-center justify-center rounded-full text-[11px] font-body transition-all relative
                  ${!inMonth ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-secondary/60"}
                  ${today ? "ring-1 ring-primary/30" : ""}
                  ${isSelected ? "ring-2 ring-primary" : ""}
                  ${isPeriod ? "bg-period text-period-foreground font-medium" : inMonth ? "text-foreground/70" : "text-muted-foreground"}
                `}
              >
                {format(day, "d")}
                {(isPeriod || hasSymptoms) && (
                  <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${isPeriod ? "bg-period-active" : "bg-accent-foreground/40"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Cycle info */}
        {sortedDates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[11px] font-body text-muted-foreground">
              {sortedDates.length} day{sortedDates.length !== 1 ? "s" : ""} logged this month
            </p>
          </div>
        )}

        <p className="text-[10px] font-body text-muted-foreground/40 mt-2 italic">
          Tap a day to select · tap again to toggle period
        </p>
      </div>

      {/* Symptom panel for selected date */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-display font-medium text-foreground">
                {format(new Date(selectedDate + "T00:00:00"), "MMM d")} — Symptoms
              </h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[10px] font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const active = selectedSymptoms.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSymptom.mutate({ date: selectedDate, symptom: s.key })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body transition-all
                      ${active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-medium"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70"
                      }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {periodDates.has(selectedDate) && (
              <p className="text-[10px] font-body text-period-active mt-3 italic">
                🌸 Period logged for this day
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PeriodTracker;
