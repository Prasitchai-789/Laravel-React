import { motion } from "framer-motion";

export default function ProductionSwitch({ isProducing, onChange }: any) {
    return (
        <div className="mb-4 flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">โหมดการทำงาน:</span>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                    ${isProducing ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
                ผลิต
            </motion.button>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(false)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                    ${!isProducing ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
                ไม่ผลิต
            </motion.button>
        </div>
    );
}
