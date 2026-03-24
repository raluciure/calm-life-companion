import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePeriodLogs, useTogglePeriodDay } from "@/hooks/useHealth";

const PeriodTracker = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const monthStr = format(viewDate, "yyyy-MM");
  const { data: logs = [] } = usePeriodLogs(monthStr);
  const toggleDay = useTogglePeriodDay();

  const periodDates = new Set(logs.map((l) => l.date));

  const monthStart = startOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (days.length < 42) {
    days.push(d);
    d = addDays(d, 1);
  }

  // Trim trailing empty week rows
  while (days.length > 35) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !isSameMonth(day, viewDate))) {
      days.splice(-7);
    } else break;
  }

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  // Calculate cycle info
  const sortedDates = [...periodDates].sort();
  const lastPeriodDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5"
    >
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

          return (
            <button
              key={dateStr}
              onClick={() => inMonth && toggleDay.mutate({ date: dateStr })}
              disabled={!inMonth}
              className={`aspect-square flex items-center justify-center rounded-full text-[11px] font-body transition-all relative
                ${!inMonth ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-secondary/60"}
                ${today ? "ring-1 ring-primary/30" : ""}
                ${isPeriod ? "bg-rose-200/70 text-rose-800 font-medium" : inMonth ? "text-foreground/70" : "text-muted-foreground"}
              `}
            >
              {format(day, "d")}
              {isPeriod && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-rose-400" />
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
        Tap a day to log or unlog
      </p>
    </motion.div>
  );
};

export default PeriodTracker;
