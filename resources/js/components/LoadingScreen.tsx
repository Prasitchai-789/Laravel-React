import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
      {/* วงกลมหมุน */}
      <motion.div
        className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />

      {/* ข้อความหลัก */}
      <motion.h2
        className="text-2xl font-semibold text-gray-800 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        Loading..
      </motion.h2>

      {/* ข้อความคำอธิบาย */}
      <motion.p
        className="text-gray-500 mt-2 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Please wait while we get your information from the web
      </motion.p>
    </div>
  );
}
