import { AnimatePresence, motion } from "framer-motion";

const AnimatedDescription = ({ step, descriptions }) => {
  const content = descriptions[step];
  if (!content) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={`desc-${step}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-blue-200/80 text-center mb-8 text-xs sm:text-md"
      >
        {content}
      </motion.p>
    </AnimatePresence>
  );
};

export default AnimatedDescription;
