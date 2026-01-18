import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function VerifyAccountModal({ open}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Verify Your Account
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Your account has been created. Click verify to continue.
          </p>

          <div className="flex justify-end mt-6 gap-2">
            <button
              onClick={()=>{
                toast.warn("Please verify your account to proceed.");
              }}
              disabled={false}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>

            <button
              onClick={() => navigate(`/verify`)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Verify
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
