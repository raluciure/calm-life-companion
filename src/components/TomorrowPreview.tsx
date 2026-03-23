import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import type { TimelineItemData } from "./TimelineItem";

interface TomorrowPreviewProps {
  items: TimelineItemData[];
}

const TomorrowPreview = ({ items }: TomorrowPreviewProps) => {
  const isEvening = new Date().getHours() >= 18;

  if (!isEvening && items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="rounded-2xl border border-border bg-secondary/40 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-display font-medium text-muted-foreground">
          Tomorrow at a glance
        </h3>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm font-body">
              <span className="w-12 text-muted-foreground tabular-nums">{item.time || "—"}</span>
              <span className="text-foreground/80">{item.emoji} {item.title}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/70 font-body italic">
          Nothing planned yet — a blank canvas 🌿
        </p>
      )}
    </motion.div>
  );
};

export default TomorrowPreview;
