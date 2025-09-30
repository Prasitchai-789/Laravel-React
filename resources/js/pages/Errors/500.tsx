import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ServerError() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 px-4">
      <h1 className="text-9xl font-black text-red-500 mb-6">500</h1>
      <p className="text-xl text-red-700 mb-4">เกิดข้อผิดพลาดภายในระบบ</p>
      <Link href="/" className="px-6 py-3 bg-red-500 text-white rounded-lg">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
