import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PeriodTracker from "./PeriodTracker";
import MedicationTracker from "./MedicationTracker";
import { useFeatures } from "@/hooks/useFeatures";

type HealthTab = "meds" | "period";

const HealthSection = () => {
  const { features } = useFeatures();
  const showMeds = features.meds;
  const showPeriod = features.period;

  const [tab, setTab] = useState<HealthTab>(showMeds ? "meds" : "period");

  useEffect(() => {
    if (tab === "meds" && !showMeds && showPeriod) setTab("period");
    if (tab === "period" && !showPeriod && showMeds) setTab("meds");
  }, [showMeds, showPeriod, tab]);

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

      {showMeds && showPeriod && (
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
      )}

      {!showMeds && !showPeriod ? (
        <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
          Enable Medications or Period in Profile → Settings ✨
        </p>
      ) : tab === "meds" && showMeds ? (
        <MedicationTracker />
      ) : (
        <PeriodTracker />
      )}
    </motion.div>
  );
};

export default HealthSection;
