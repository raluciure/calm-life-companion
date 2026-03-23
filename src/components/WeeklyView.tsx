import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { useItemsRange } from "@/hooks/useItems";
import type { TimelineItemData } from "@/components/TimelineItem";

interface WeeklyViewProps {
  selectedDate: Date;
  onDayTap: (date: Date) => void;
}

const categoryDot: Record<string, string> = {
  health: "bg-health-dot",
  errand: "bg-errand-dot",
  appointment: "bg-appointment-dot",
  personal: "bg-personal-dot",
};

const WeeklyView = ({ selectedDate, onDayTap }: WeeklyViewProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startStr = format(days[0], "yyyy-MM-dd");
  const endStr = format(days[6], "yyyy-MM-dd");
  const { data: grouped = {}, isLoading } = useItemsRange(startStr, endStr);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {/* Week header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs font-body text-muted-foreground uppercase tracking-widest">
          {format(days[0], "MMM d")} – {format(days[6], "MMM d")}
        </p>
      </div>

      {/* Days */}
      <div className="space-y-1.5">
        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayItems: TimelineItemData[] = grouped[dateStr] || [];
          const today = isToday(day);

          return (
            <motion.button
              key={dateStr}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onDayTap(day)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all
                ${today ? "bg-primary/5 border border-primary/15" : "bg-secondary/40 hover:bg-secondary/70"}`}
            >
              {/* Day label */}
              <div className="w-12 shrink-0">
                <p className={`text-xs font-body uppercase ${today ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {format(day, "EEE")}
                </p>
                <p className={`text-lg font-display ${today ? "text-primary font-medium" : "text-foreground"}`}>
                  {format(day, "d")}
                </p>
              </div>

              {/* Items preview */}
              <div className="flex-1 min-w-0 pt-0.5">
                {isLoading ? (
                  <div className="h-4 w-24 rounded bg-secondary animate-gentle-pulse" />
                ) : dayItems.length > 0 ? (
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryDot[item.category]}`} />
                        <span className={`text-xs font-body truncate ${item.done ? "text-muted-foreground line-through" : "text-foreground/80"}`}>
                          {item.time && (
                            <span className="text-muted-foreground mr-1">
                              {item.time}{item.endTime ? `–${item.endTime}` : ""}
                            </span>
                          )}
                          {item.emoji} {item.title}
                        </span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="text-[10px] text-muted-foreground/60 font-body">
                        +{dayItems.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/40 font-body italic">—</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyView;
