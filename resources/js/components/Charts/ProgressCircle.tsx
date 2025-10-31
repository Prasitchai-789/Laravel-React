import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ProgressCircleProps {
  value: number;      // ค่าเปอร์เซ็นต์ เช่น 30
  size?: number;      // ขนาดของวงกลม
  strokeWidth?: number; // ความหนาเส้น
  color?: string;     // สีหลักของเส้น
}

export default function ProgressCircle({
  value,
  size = 140,
  strokeWidth = 10,
  color = "#10b981", // สีเขียว mint
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const circleRef = useRef<SVGCircleElement>(null);
  const [progress, setProgress] = useState(0);

  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  // เมื่อ component เข้าสู่ viewport → ให้แอนิเมต
  useEffect(() => {
    if (inView) {
      controls.start({ progress: value, transition: { duration: 1.2, ease: "easeOut" } });
    }
  }, [inView, controls, value]);

  // อัปเดตค่าตัวเลขที่แสดง
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = 16;
    const increment = value / (duration / step);
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(interval);
      }
      setProgress(Math.floor(start));
    }, step);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div
      ref={ref}
      className="bg-white rounded-xl shadow flex items-center justify-center p-6"
      style={{ width: size + 50, height: size + 40 }}
    >
      <svg width={size} height={size}>
        {/* วงกลมพื้นหลัง */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* วงกลม progress */}
        <motion.circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* ตัวเลขตรงกลาง */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-3xl font-semibold"
          fill={color}
        >
          {progress}
        </text>
      </svg>
    </div>
  );
}


{/* <ProgressCircle value={65} color="#f59e0b" /> */}
