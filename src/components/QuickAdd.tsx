import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ItemCategory, TimelineItemData } from "./TimelineItem";

interface QuickAddProps {
  onAdd: (item: TimelineItemData) => void;
  dateLabel?: string;
}

// Simple keyword-based categorization
function parseInput(text: string): { title: string; emoji: string; category: ItemCategory; time?: string; endTime?: string } {
  const lower = text.toLowerCase();

  // Try to extract time range (e.g., "9am to 6pm", "9am-5pm", "9:00am - 6:00pm")
  const rangeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:to|-|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  let time: string | undefined;
  let endTime: string | undefined;
  let titleCleaned = text;

  if (rangeMatch) {
    time = rangeMatch[1].replace(/\s/g, "").toUpperCase().replace(/(\d)(AM|PM)/, "$1 $2");
    endTime = rangeMatch[2].replace(/\s/g, "").toUpperCase().replace(/(\d)(AM|PM)/, "$1 $2");
    titleCleaned = text.replace(rangeMatch[0], "").trim();
  } else {
    // Single time
    const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    time = timeMatch ? timeMatch[1].replace(/\s/g, "").toUpperCase().replace(/(\d)(AM|PM)/, "$1 $2") : undefined;
    titleCleaned = time ? text.replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i, "").trim() : text;
  }

  // Clean up extra dashes/connectors left over
  titleCleaned = titleCleaned.replace(/^\s*[-–—]\s*/, "").replace(/\s*[-–—]\s*$/, "").trim();

  // Categorize
  if (/vitamin|medicine|pill|health|doctor|period|track|water|sleep|exercise|workout/i.test(lower)) {
    return { title: titleCleaned, emoji: "💊", category: "health", time, endTime };
  }
  if (/buy|grocery|groceries|shop|store|pick up|errand|milk|bread|eggs/i.test(lower)) {
    return { title: titleCleaned, emoji: "🛒", category: "errand", time, endTime };
  }
  if (/dentist|appointment|meeting|call|visit|doctor|interview|work/i.test(lower)) {
    return { title: titleCleaned, emoji: "📅", category: "appointment", time, endTime };
  }

  return { title: titleCleaned || text, emoji: "✨", category: "personal", time, endTime };
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
        placeholder={dateLabel ? `Add to ${dateLabel}...` : `Type anything... "buy oat milk" or "dentist 3pm"`}
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
