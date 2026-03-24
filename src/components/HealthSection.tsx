import { motion } from "framer-motion";
import PeriodTracker from "./PeriodTracker";
import MedicationTracker from "./MedicationTracker";

const HealthSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-display font-light text-foreground">
          🫶 Health & Wellness
        </h2>
        <p className="text-xs font-body text-muted-foreground mt-1">
          Take care of yourself
        </p>
      </div>

      <MedicationTracker />
      <PeriodTracker />
    </motion.div>
  );
};

export default HealthSection;
