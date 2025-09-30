import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center font-anuphan justify-center bg-gradient-to-br from-slate-50 to-blue-50 text-gray-800 px-4">
      <div className={`text-center max-w-md transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

        {/* ตัวเลข 404 ที่มี animation */}
        <div className="mb-8 relative">
          <h1 className="text-8xl font-bold text-gray-700 relative ">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>4</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>0</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>4</span>
          </h1>

          {/* วงกลมเคลื่อนไหวเบาๆ */}
          <div className="absolute -top-4 -right-4 w-6 h-6 bg-blue-200 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -left-4 w-4 h-4 bg-red-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* ข้อความที่มี animation ลื่นไหล */}
        <div className={`mb-10 transform transition-all duration-500 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <h2 className="text-2xl font-semibold mb-3 animate-pulse">ไม่พบหน้า</h2>
          <p className="text-gray-600 leading-relaxed">
            หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือชั่วคราวไม่พร้อมใช้งาน
          </p>
        </div>

        {/* ปุ่มที่มี hover animation */}
        <div className={`transform transition-all duration-500 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <Link
            href="dashboard"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <svg
              className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            กลับหน้าหลัก
          </Link>
        </div>

        {/* เส้นคั่นที่มี animation */}
        <div className={`mt-12 pt-6 border-t border-gray-200 transform transition-all duration-500 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <p className="text-sm text-gray-500 animate-pulse" style={{ animationDuration: '3s' }}>
            หากต้องการความช่วยเหลือ โปรดติดต่อทีมสนับสนุน
          </p>
        </div>

        {/* องค์ประกอบตกแต่งเพิ่มเติม */}
        <div className="mt-8 flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
