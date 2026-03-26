import { useState } from "react";
import { motion } from "framer-motion";
import PeriodTracker from "./PeriodTracker";
import MedicationTracker from "./MedicationTracker";

type HealthTab = "meds" | "period";

const HealthSection = () => {
  const [tab, setTab] = useState<HealthTab>("meds");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
          🫶 Health & Wellness
        </h1>
        <p className="text-sm font-body text-muted-foreground">
          Take care of yourself
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-secondary/50 p-1 gap-1">
          <button
            onClick={() => setTab("meds")}
            className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all ${
              tab === "meds"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            💊 Medications
          </button>
          <button
            onClick={() => setTab("period")}
            className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all ${
              tab === "period"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌸 Period
          </button>
        </div>
      </div>

      {tab === "meds" ? <MedicationTracker /> : <PeriodTracker />}
    </motion.div>
  );
};

export default HealthSection;
