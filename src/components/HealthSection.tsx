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
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
          🫶 Health & Wellness
        </h1>
        <p className="text-sm font-body text-muted-foreground">
          Take care of yourself
        </p>
      </div>

      <MedicationTracker />
      <PeriodTracker />
    </motion.div>
  );
};

export default HealthSection;
