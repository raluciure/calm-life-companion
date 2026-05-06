import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
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

  return (
    <>
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

      <Drawer open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
        <DrawerContent className="px-4 pb-6 max-h-[90vh]">
          <DrawerHeader className="px-0 flex flex-row items-center justify-between">
            <DrawerTitle className="text-base font-body font-medium">
              {dateLabel ? `New task · ${dateLabel}` : "New task"}
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="space-y-4">
            {/* Category selector */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`py-2.5 rounded-lg text-xs font-body transition-all ${
                    category === c.value
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary/50 text-muted-foreground border border-transparent"
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
              className="w-full bg-background/50 rounded-lg px-3 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary/30"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            {/* Time row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-body text-muted-foreground mb-1 block">Start time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-background/50 rounded-lg px-2 py-2 text-xs font-body text-foreground outline-none border border-border/30 focus:border-primary/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-body text-muted-foreground mb-1 block">End time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-background/50 rounded-lg px-2 py-2 text-xs font-body text-foreground outline-none border border-border/30 focus:border-primary/30"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-body font-medium disabled:opacity-40 transition-all"
            >
              Add Task
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default QuickAdd;
