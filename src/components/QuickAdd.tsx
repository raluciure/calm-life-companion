import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import type { ItemCategory, TimelineItemData } from "./TimelineItem";

interface QuickAddProps {
  onAdd: (item: TimelineItemData) => void;
  dateLabel?: string;
}

const CATEGORIES: { value: ItemCategory; emoji: string; label: string }[] = [
  { value: "personal", emoji: "✨", label: "Personal" },
  { value: "errand", emoji: "🛒", label: "Errand" },
  { value: "appointment", emoji: "📅", label: "Appointment" },
  { value: "health", emoji: "💊", label: "Health" },
];

const QuickAdd = ({ onAdd, dateLabel }: QuickAddProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("personal");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const reset = () => {
    setTitle("");
    setCategory("personal");
    setStartTime("");
    setEndTime("");
    setOpen(false);
  };

  const formatTime = (t: string): string | undefined => {
    if (!t) return undefined;
    // t is HH:MM from input type="time", convert to "9:00 AM"
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const cat = CATEGORIES.find((c) => c.value === category)!;
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      emoji: cat.emoji,
      category,
      time: formatTime(startTime),
      endTime: formatTime(endTime),
    });
    reset();
  };

  if (!open) {
    return (
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full py-3 rounded-xl border border-dashed border-border/50 text-xs font-body text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/30 transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        {dateLabel ? `Add to ${dateLabel}` : "Add task"}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-secondary/30 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body font-medium text-foreground">New Task</span>
            <button onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category selector */}
          <div className="flex gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-body transition-all ${
                  category === c.value
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            autoFocus
            className="w-full bg-background/50 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary/30"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* Time row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-body text-muted-foreground mb-0.5 block">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-background/50 rounded-lg px-2 py-1.5 text-xs font-body text-foreground outline-none border border-border/30 focus:border-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-body text-muted-foreground mb-0.5 block">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-background/50 rounded-lg px-2 py-1.5 text-xs font-body text-foreground outline-none border border-border/30 focus:border-primary/30"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-body font-medium disabled:opacity-40 transition-all"
          >
            Add Task
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickAdd;
