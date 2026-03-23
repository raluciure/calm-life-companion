import { motion } from "framer-motion";

const messages = [
  "Nothing else today — rest well 🌿",
  "The rest of the day is yours 🍃",
  "Clear skies ahead — breathe easy ☁️",
  "No more plans — enjoy the quiet 🌙",
];

const FreeTimeMessage = () => {
  const msg = messages[Math.floor(Math.random() * messages.length)];

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="text-center text-sm text-muted-foreground/60 font-body italic py-6"
    >
      {msg}
    </motion.p>
  );
};

export default FreeTimeMessage;
