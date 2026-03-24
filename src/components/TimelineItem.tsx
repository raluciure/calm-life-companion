import { motion } from "framer-motion";
import { X } from "lucide-react";

export type ItemCategory = "health" | "errand" | "appointment" | "personal";

export interface TimelineItemData {
  id: string;
  time?: string;
  endTime?: string;
  title: string;
  emoji: string;
  category: ItemCategory;
  done?: boolean;
}

const categoryStyles: Record<ItemCategory, { bg: string; dot: string }> = {
  health: { bg: "bg-health", dot: "bg-health-dot" },
  errand: { bg: "bg-errand", dot: "bg-errand-dot" },
  appointment: { bg: "bg-appointment", dot: "bg-appointment-dot" },
  personal: { bg: "bg-personal", dot: "bg-personal-dot" },
};

interface TimelineItemProps {
  item: TimelineItemData;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TimelineItem = ({ item, index, onToggle, onDelete }: TimelineItemProps) => {
  const style = categoryStyles[item.category];

  const timeLabel = item.time
    ? item.endTime
      ? `${item.time}–${item.endTime}`
      : item.time
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className={`w-full flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-300 text-left group
        ${item.done ? "opacity-50" : "hover:shadow-sm"}
        ${style.bg}`}
    >
      {/* Main clickable area */}
      <button onClick={() => onToggle(item.id)} className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0 text-left">
        {/* Time — auto-width on mobile, fixed on larger */}
        {timeLabel && (
          <span className="text-[11px] sm:text-sm font-body text-muted-foreground tabular-nums shrink-0">
            {timeLabel}
          </span>
        )}

        {/* Dot */}
        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${style.dot} ${item.done ? "opacity-40" : ""}`} />

        {/* Content */}
        <span className={`flex-1 min-w-0 text-[13px] sm:text-[15px] font-body text-foreground transition-all truncate ${item.done ? "line-through decoration-muted-foreground/40" : ""}`}>
          {item.emoji} {item.title}
        </span>
      </button>

      {/* Done label — hidden on small screens to save space */}
      <span
        className="hidden sm:inline text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        onClick={() => onToggle(item.id)}
      >
        {item.done ? "undo" : "done"}
      </span>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
      >
        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </motion.div>
  );
};

export default TimelineItem;
