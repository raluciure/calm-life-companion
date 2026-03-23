import { motion } from "framer-motion";

export type ViewMode = "day" | "week" | "month";

interface ViewSwitcherProps {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const options: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const ViewSwitcher = ({ active, onChange }: ViewSwitcherProps) => {
  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-secondary/60">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative px-4 py-1.5 text-xs font-body font-medium rounded-lg transition-colors ${
            active === opt.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {active === opt.value && (
            <motion.div
              layoutId="view-pill"
              className="absolute inset-0 bg-card rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
