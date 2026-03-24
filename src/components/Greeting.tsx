import { motion } from "framer-motion";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good evening", emoji: "🌙" };
  return { text: "Night time", emoji: "✨" };
};

const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const Greeting = () => {
  const { text, emoji } = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-1"
    >
      <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
        {emoji} {text}
      </h1>
      <p className="text-sm font-body text-muted-foreground">
        {getFormattedDate()}
      </p>
    </motion.div>
  );
};

export default Greeting;
