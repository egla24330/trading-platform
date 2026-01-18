import { AnimatePresence, motion } from "framer-motion";

const AnimatedTitle = ({ step, titles }) => {
  const content = titles[step];
  if (!content) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.h1
        key={`title-${step}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-bold text-center text-white mb-2"
      >
        {content}
      </motion.h1>
    </AnimatePresence>
  );
};

export default AnimatedTitle;
