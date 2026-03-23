import { motion } from "framer-motion";

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
}

const TimelineItem = ({ item, index, onToggle }: TimelineItemProps) => {
  const style = categoryStyles[item.category];

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      onClick={() => onToggle(item.id)}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group
        ${item.done ? "opacity-50" : "hover:shadow-sm"}
        ${style.bg}`}
    >
      {/* Time */}
      <span className="w-14 text-sm font-body text-muted-foreground tabular-nums shrink-0">
        {item.time || ""}
      </span>

      {/* Dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot} ${item.done ? "opacity-40" : ""}`} />

      {/* Content */}
      <span className={`flex-1 text-[15px] font-body text-foreground transition-all ${item.done ? "line-through decoration-muted-foreground/40" : ""}`}>
        {item.emoji} {item.title}
      </span>

      {/* Subtle done indicator */}
      <span className={`text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity`}>
        {item.done ? "undo" : "done"}
      </span>
    </motion.button>
  );
};

export default TimelineItem;
