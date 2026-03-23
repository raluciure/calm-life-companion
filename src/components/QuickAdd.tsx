import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ItemCategory, TimelineItemData } from "./TimelineItem";

interface QuickAddProps {
  onAdd: (item: TimelineItemData) => void;
  dateLabel?: string;
}

// Simple keyword-based categorization
function parseInput(text: string): { title: string; emoji: string; category: ItemCategory; time?: string } {
  const lower = text.toLowerCase();

  // Try to extract time (e.g., "3pm", "11:00", "9:30am")
  const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const time = timeMatch ? timeMatch[1].replace(/\s/g, "").toUpperCase().replace(/(\d)(AM|PM)/, "$1 $2") : undefined;
  const titleWithoutTime = text.replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i, "").trim();

  // Categorize
  if (/vitamin|medicine|pill|health|doctor|period|track|water|sleep|exercise|workout/i.test(lower)) {
    return { title: titleWithoutTime, emoji: "💊", category: "health", time };
  }
  if (/buy|grocery|groceries|shop|store|pick up|errand|milk|bread|eggs/i.test(lower)) {
    return { title: titleWithoutTime, emoji: "🛒", category: "errand", time };
  }
  if (/dentist|appointment|meeting|call|visit|doctor|interview/i.test(lower)) {
    return { title: titleWithoutTime, emoji: "📅", category: "appointment", time };
  }

  return { title: titleWithoutTime || text, emoji: "✨", category: "personal", time };
}

const QuickAdd = ({ onAdd, dateLabel }: QuickAddProps) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const parsed = parseInput(value.trim());
    onAdd({
      id: Date.now().toString(),
      ...parsed,
    });
    setValue("");
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300
        ${isFocused ? "border-primary/30 shadow-md bg-card" : "border-border bg-secondary/50"}`}
    >
      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type anything... &quot;buy oat milk&quot; or &quot;dentist 3pm&quot;"
        className="flex-1 bg-transparent text-[15px] font-body text-foreground placeholder:text-muted-foreground/60 outline-none"
      />
      {value.trim() && (
        <motion.button
          type="submit"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Add
        </motion.button>
      )}
    </motion.form>
  );
};

export default QuickAdd;
