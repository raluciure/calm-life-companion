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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group
        ${item.done ? "opacity-50" : "hover:shadow-sm"}
        ${style.bg}`}
    >
      {/* Main clickable area */}
      <button onClick={() => onToggle(item.id)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        {/* Time */}
        <span className="w-24 text-sm font-body text-muted-foreground tabular-nums shrink-0">
          {item.time ? (
            item.endTime ? `${item.time} – ${item.endTime}` : item.time
          ) : ""}
        </span>

        {/* Dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot} ${item.done ? "opacity-40" : ""}`} />

        {/* Content */}
        <span className={`flex-1 text-[15px] font-body text-foreground transition-all ${item.done ? "line-through decoration-muted-foreground/40" : ""}`}>
          {item.emoji} {item.title}
        </span>
      </button>

      {/* Done label */}
      <span
        className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => onToggle(item.id)}
      >
        {item.done ? "undo" : "done"}
      </span>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export default TimelineItem;
