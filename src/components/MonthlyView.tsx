import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { useItemsRange } from "@/hooks/useItems";
import type { TimelineItemData } from "@/components/TimelineItem";

interface MonthlyViewProps {
  selectedDate: Date;
  onDayTap: (date: Date) => void;
}

const categoryDot: Record<string, string> = {
  health: "bg-health-dot",
  errand: "bg-errand-dot",
  appointment: "bg-appointment-dot",
  personal: "bg-personal-dot",
};

const MonthlyView = ({ selectedDate, onDayTap }: MonthlyViewProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // Build 6 weeks of days
  const days: Date[] = [];
  let d = calStart;
  while (days.length < 42) {
    days.push(d);
    d = addDays(d, 1);
  }

  const startStr = format(days[0], "yyyy-MM-dd");
  const endStr = format(days[days.length - 1], "yyyy-MM-dd");
  const { data: grouped = {} } = useItemsRange(startStr, endStr);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Month label */}
      <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-4 px-1">
        {format(selectedDate, "MMMM yyyy")}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((wd) => (
          <div key={wd} className="text-center text-[10px] font-body text-muted-foreground/60 uppercase py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayItems: TimelineItemData[] = grouped[dateStr] || [];
          const inMonth = isSameMonth(day, selectedDate);
          const today = isToday(day);

          // Get unique categories for dots
          const categories = [...new Set(dayItems.map((i) => i.category))];
          const hasDone = dayItems.some((i) => i.done);
          const allDone = dayItems.length > 0 && dayItems.every((i) => i.done);

          return (
            <button
              key={dateStr}
              onClick={() => onDayTap(day)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all min-h-[52px]
                ${!inMonth ? "opacity-30" : ""}
                ${today ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-secondary/60"}
              `}
            >
              <span className={`text-xs font-body leading-none mb-1.5
                ${today ? "text-primary font-medium" : inMonth ? "text-foreground/80" : "text-muted-foreground"}
                ${allDone ? "line-through opacity-60" : ""}
              `}>
                {format(day, "d")}
              </span>

              {/* Category dots */}
              {categories.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {categories.slice(0, 3).map((cat) => (
                    <span key={cat} className={`w-1 h-1 rounded-full ${categoryDot[cat]}`} />
                  ))}
                </div>
              )}

              {/* Item count */}
              {dayItems.length > 0 && (
                <span className="text-[9px] text-muted-foreground/50 font-body mt-0.5">
                  {dayItems.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MonthlyView;
