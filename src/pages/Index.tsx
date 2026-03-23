import { useState } from "react";
import Greeting from "@/components/Greeting";
import TimelineItem, { type TimelineItemData } from "@/components/TimelineItem";
import QuickAdd from "@/components/QuickAdd";
import TomorrowPreview from "@/components/TomorrowPreview";
import FreeTimeMessage from "@/components/FreeTimeMessage";
import { motion } from "framer-motion";

const initialItems: TimelineItemData[] = [
  { id: "1", time: "9:00 AM", title: "Morning vitamins", emoji: "💊", category: "health" },
  { id: "2", time: "11:00 AM", title: "Grocery run — oat milk, bananas", emoji: "🛒", category: "errand" },
  { id: "3", time: "3:00 PM", title: "Dentist appointment", emoji: "🦷", category: "appointment" },
  { id: "4", time: "", title: "Call mom", emoji: "💛", category: "personal" },
];

const tomorrowItems: TimelineItemData[] = [
  { id: "t1", time: "10:00 AM", title: "Yoga class", emoji: "🧘", category: "health" },
  { id: "t2", time: "2:00 PM", title: "Pick up package", emoji: "📦", category: "errand" },
];

const Index = () => {
  const [items, setItems] = useState<TimelineItemData[]>(initialItems);

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const handleAdd = (newItem: TimelineItemData) => {
    setItems((prev) => [...prev, newItem]);
  };

  const timedItems = items.filter((i) => i.time).sort((a, b) => (a.time! > b.time! ? 1 : -1));
  const untimedItems = items.filter((i) => !i.time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-10 space-y-8">
        {/* Greeting */}
        <Greeting />

        {/* Today section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground mb-4 px-1">
            Today
          </h2>
          <div className="space-y-2">
            {timedItems.map((item, i) => (
              <TimelineItem key={item.id} item={item} index={i} onToggle={handleToggle} />
            ))}
            {untimedItems.map((item, i) => (
              <TimelineItem key={item.id} item={item} index={timedItems.length + i} onToggle={handleToggle} />
            ))}
          </div>
          <FreeTimeMessage />
        </motion.div>

        {/* Quick Add */}
        <QuickAdd onAdd={handleAdd} />

        {/* Tomorrow Preview */}
        <TomorrowPreview items={tomorrowItems} />

        {/* App name */}
        <p className="text-center text-xs text-muted-foreground/40 font-body pt-4">
          hush
        </p>
      </div>
    </div>
  );
};

export default Index;
