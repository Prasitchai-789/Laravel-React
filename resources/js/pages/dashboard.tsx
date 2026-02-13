import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Heart,
  Share2,
  Download,
  Camera,
  Clock,
  Eye,
  MessageCircle,
  Bookmark,
  Users,
  Trophy,
  Coffee,
  Music,
  Gift,
  Briefcase,
  GraduationCap,
  Leaf,
  Palette
} from 'lucide-react';

// Mock Data ภาพกิจกรรม
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 1,
    title: "🏃‍♂️ วิ่งการกุศล Bangkok Marathon 2026",
    description: "พนักงานร่วมใจบริจาครายได้สมทบทุนมูลนิธิโรงพยาบาลเด็ก ครั้งที่ 12 โดยมีผู้เข้าร่วมกว่า 200 คน วิ่งรวมระยะทางกว่า 1,000 กิโลเมตร สามารถระดมทุนได้กว่า 500,000 บาท",
    activity_date: "2026-02-15 06:00:00",
    location: "สนามกีฬาแห่งชาติ ปทุมวัน",
    status: "เสร็จสิ้น",
    created_by: 1,
    images: [
      {
        id: 101,
        image_path: "https://images.unsplash.com/photo-1552674605-db6a1e1f3b0e?w=1200",
        image_alt_text: "พนักงานร่วมกันวิ่งการกุศลในชุดสีฟ้า",
        display_order: 1
      },
      {
        id: 102,
        image_path: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200",
        image_alt_text: "ภาพหมู่คณะผู้บริหารและพนักงานก่อนเริ่มวิ่ง",
        display_order: 2
      },
      {
        id: 103,
        image_path: "https://images.unsplash.com/photo-1552674605-db6a1e1f3b0e?w=1200",
        image_alt_text: "บรรยากาศการวิ่งริมถนน",
        display_order: 3
      },
      {
        id: 104,
        image_path: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1200",
        image_alt_text: "พิธีมอบทุนบริจาค",
        display_order: 4
      },
      {
        id: 105,
        image_path: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200",
        image_alt_text: "กิจกรรมสันทนาการหลังวิ่ง",
        display_order: 5
      }
    ]
  },
  {
    id: 2,
    title: "🌳 โครงการปลูกป่าเฉลิมพระเกียรติ 72 พรรษา",
    description: "พนักงานจิตอาสา 150 คน ร่วมปลูกป่าชายเลน จำนวน 3,000 ต้น ณ ศูนย์อนุรักษ์ป่าชายเลน เพื่อฟื้นฟูระบบนิเวศและลดภาวะโลกร้อน พร้อมกิจกรรมเก็บขยะชายหาด",
    activity_date: "2026-01-20 08:30:00",
    location: "ศูนย์อนุรักษ์ป่าชายเลน จ.สมุทรสงคราม",
    status: "เสร็จสิ้น",
    created_by: 1,
    images: [
      {
        id: 201,
        image_path: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200",
        image_alt_text: "พนักงานช่วยกันปลูกต้นไม้",
        display_order: 1
      },
      {
        id: 202,
        image_path: "https://images.unsplash.com/photo-1593113598330-7c5c5e9b8a3a?w=1200",
        image_alt_text: "บรรยากาศป่าชายเลน",
        display_order: 2
      },
      {
        id: 203,
        image_path: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200",
        image_alt_text: "กิจกรรมเก็บขยะชายหาด",
        display_order: 3
      }
    ]
  },
  {
    id: 3,
    title: "🎄 งานเลี้ยงสังสรรค์ปีใหม่ 2026",
    description: "งานเลี้ยงขอบคุณพนักงานประจำปี พร้อมมอบรางวัลพนักงานดีเด่น การแสดงจากแผนกต่างๆ และการจับสลากของขวัญสุดพิเศษ มูลค่ารางวัลรวมกว่า 1 ล้านบาท",
    activity_date: "2025-12-25 18:00:00",
    location: "โรงแรมแกรนด์ บอลรูม ชั้น 23",
    status: "เสร็จสิ้น",
    created_by: 1,
    images: [
      {
        id: 301,
        image_path: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",
        image_alt_text: "บรรยากาศงานเลี้ยงปีใหม่",
        display_order: 1
      },
      {
        id: 302,
        image_path: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200",
        image_alt_text: "การแสดงบนเวที",
        display_order: 2
      },
      {
        id: 303,
        image_path: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200",
        image_alt_text: "พิธีมอบรางวัลพนักงานดีเด่น",
        display_order: 3
      },
      {
        id: 304,
        image_path: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1200",
        image_alt_text: "การจับสลากของขวัญ",
        display_order: 4
      }
    ]
  },
  {
    id: 4,
    title: "💻 Tech Conference 2026: AI Innovation",
    description: "งานสัมมนาทางวิชาการด้านเทคโนโลยี AI ประจำปี มีวิทยากรผู้เชี่ยวชาญจากต่างประเทศ พนักงานเข้าร่วมอบรมกว่า 300 คน พร้อมเวิร์คช็อปสร้าง Chatbot ด้วย ChatGPT API",
    activity_date: "2026-02-05 09:00:00",
    location: "ศูนย์ประชุมไบเทค บางนา",
    status: "กำลังดำเนินการ",
    created_by: 1,
    images: [
      {
        id: 401,
        image_path: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
        image_alt_text: "วิทยากรบรรยายบนเวที",
        display_order: 1
      },
      {
        id: 402,
        image_path: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200",
        image_alt_text: "พนักงานร่วมเวิร์คช็อป",
        display_order: 2
      },
      {
        id: 403,
        image_path: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=1200",
        image_alt_text: "บูธแสดงสินค้าเทคโนโลยี",
        display_order: 3
      }
    ]
  },
  {
    id: 5,
    title: "🧘 โครงการส่งเสริมสุขภาพ: โยคะเพื่อพนักงาน",
    description: "กิจกรรมออกกำลังกายเพื่อสุขภาพ จัดทุกวันพุธ เวลา 17:30 น. โดยวิทยากรผู้เชี่ยวชาญ พนักงานสามารถเข้าร่วมได้ฟรี พร้อมบริการน้ำดื่มและผลไม้หลังกิจกรรม",
    activity_date: "2026-02-10 17:30:00",
    location: "ห้อง Fitness ชั้น 8 อาคารสำนักงานใหญ่",
    status: "กำลังดำเนินการ",
    created_by: 1,
    images: [
      {
        id: 501,
        image_path: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200",
        image_alt_text: "พนักงานฝึกโยคะพร้อมกัน",
        display_order: 1
      },
      {
        id: 502,
        image_path: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=1200",
        image_alt_text: "บรรยากาศการฝึกสมาธิ",
        display_order: 2
      }
    ]
  },
  {
    id: 6,
    title: "🎨 กิจกรรมศิลปะเพื่อสังคม วาดภาพให้ร้านกาแฟคนหูหนวก",
    description: "จิตอาสาช่วยกันตกแต่งร้านกาแฟของชุมชนผู้พิการทางการได้ยิน ด้วยภาพวาดสีสันสดใส พร้อมเรียนรู้ภาษามือเบื้องต้น สร้างรอยยิ้มและกำลังใจให้แก่กัน",
    activity_date: "2026-01-28 13:00:00",
    location: "Cafe Sign ร้านกาแฟคนหูหนวก อารีย์",
    status: "เสร็จสิ้น",
    created_by: 1,
    images: [
      {
        id: 601,
        image_path: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200",
        image_alt_text: "พนักงานช่วยกันวาดภาพตกแต่งร้าน",
        display_order: 1
      },
      {
        id: 602,
        image_path: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",
        image_alt_text: "ภาพวาดฝาผนังเสร็จสมบูรณ์",
        display_order: 2
      }
    ]
  },
  {
    id: 7,
    title: "🏆 กีฬาสีภายใน ประจำปี 2569",
    description: "การแข่งขันกีฬาสีประจำปี แบ่งเป็น 4 คณะสี มีพนักงานเข้าร่วมกว่า 400 คน ชิงถ้วยรางวัลเกียรติยศจาก CEO พร้อมกิจกรรมกระชับความสัมพันธ์",
    activity_date: "2026-03-10 08:00:00",
    location: "สนามกีฬามหาวิทยาลัยธรรมศาสตร์",
    status: "เร็วๆ นี้",
    created_by: 1,
    images: [
      {
        id: 701,
        image_path: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=1200",
        image_alt_text: "ขบวนพาเหรดกีฬาสี",
        display_order: 1
      },
      {
        id: 702,
        image_path: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200",
        image_alt_text: "การแข่งขันวิ่งผลัด",
        display_order: 2
      },
      {
        id: 703,
        image_path: "https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?w=1200",
        image_alt_text: "พิธีเปิดการแข่งขัน",
        display_order: 3
      }
    ]
  },
  {
    id: 8,
    title: "🍲 ครัวปันอิ่ม: อาหารกลางวันเพื่อน้อง",
    description: "พนักงานจิตอาสารวมตัวกันทำอาหารกลางวัน 500 กล่อง เพื่อนำไปมอบให้เด็กๆ ในโรงเรียนชุมชนคลองเตย พร้อมกิจกรรมมอบอุปกรณ์การเรียน",
    activity_date: "2026-02-20 09:00:00",
    location: "โรงเรียนชุมชนคลองเตย",
    status: "เร็วๆ นี้",
    created_by: 1,
    images: [
      {
        id: 801,
        image_path: "https://images.unsplash.com/photo-1593113598330-7c5c5e9b8a3a?w=1200",
        image_alt_text: "พนักงานช่วยกันประกอบอาหาร",
        display_order: 1
      },
      {
        id: 802,
        image_path: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200",
        image_alt_text: "แจกอาหารกลางวันให้นักเรียน",
        display_order: 2
      }
    ]
  }
];

interface ActivityImage {
    id: number;
    image_path: string;
    image_alt_text: string;
    display_order: number;
}

interface Activity {
    id: number;
    title: string;
    description: string | null;
    activity_date: string;
    location: string | null;
    status: string;
    created_by: number;
    images: ActivityImage[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'ภาพกิจกรรมองค์กร',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [liked, setLiked] = useState<number[]>([]);
    const [saved, setSaved] = useState<number[]>([]);
    const [autoPlay, setAutoPlay] = useState(true);
    const sliderRef = useRef<HTMLDivElement>(null);
    const autoPlayRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Simulate API call with mock data
        setTimeout(() => {
            setActivities(MOCK_ACTIVITIES);
            setLoading(false);
        }, 1000);
    }, []);

    useEffect(() => {
        if (autoPlay && activities.length > 0) {
            autoPlayRef.current = setInterval(() => {
                handleNext();
            }, 5000);
        }
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [autoPlay, currentIndex, activities]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => 
            prev === 0 ? activities.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) => 
            prev === activities.length - 1 ? 0 : prev + 1
        );
    };

    const toggleLike = (activityId: number) => {
        setLiked(prev => 
            prev.includes(activityId) 
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };

    const toggleSave = (activityId: number) => {
        setSaved(prev => 
            prev.includes(activityId) 
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'เสร็จสิ้น':
                return 'from-green-500 to-emerald-500';
            case 'กำลังดำเนินการ':
                return 'from-blue-500 to-cyan-500';
            case 'เร็วๆ นี้':
                return 'from-orange-500 to-pink-500';
            default:
                return 'from-gray-500 to-slate-500';
        }
    };

    const getActivityIcon = (title: string) => {
        if (title.includes('วิ่ง')) return '🏃';
        if (title.includes('ปลูก')) return '🌳';
        if (title.includes('ปีใหม่')) return '🎄';
        if (title.includes('Tech')) return '💻';
        if (title.includes('โยคะ')) return '🧘';
        if (title.includes('ศิลปะ')) return '🎨';
        if (title.includes('กีฬา')) return '🏆';
        if (title.includes('ครัว')) return '🍲';
        return '📸';
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard - ภาพกิจกรรมองค์กร" />
                <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="h-32 w-32 animate-pulse rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mb-6 rotate-45"></div>
                            <Camera className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" size={40} />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-4 text-2xl font-medium">กำลังโหลดกิจกรรม...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">เตรียมความทรงจำดีๆ ให้คุณ</p>
                        <div className="mt-8 flex justify-center gap-2">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (activities.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard - ภาพกิจกรรมองค์กร" />
                <div className="flex h-full flex-col items-center justify-center p-6">
                    <div className="max-w-lg text-center">
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl p-8 mx-auto mb-8">
                            <Camera size={64} className="text-blue-600 dark:text-blue-400 mx-auto" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            ยังไม่มีกิจกรรม
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                            เริ่มต้นบันทึกความทรงจำดีๆ ขององค์กรกับกิจกรรมแรกกันเลย!
                        </p>
                        <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl">
                            + สร้างกิจกรรมแรก
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const currentActivity = activities[currentIndex];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - ภาพกิจกรรมองค์กร" />
            <div className="flex h-full flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-12 px-6">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                    
                    <div className="relative max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                {/* <div className="flex items-center gap-3 mb-4 flex-wrap">
                                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                        🎉 {activities.length} กิจกรรมทั้งหมด
                                    </span>
                                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                        📸 {activities.reduce((acc, act) => acc + act.images.length, 0)} ภาพความทรงจำ
                                    </span>
                                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                        ❤️ {activities.length * 128} กำลังใจ
                                    </span>
                                </div> */}
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg flex items-center gap-3">
                                    กิจกรรมองค์กรของเรา                                    
                                </h1>
                                <p className="text-white/90 text-lg max-w-2xl">
                                    รวมเรื่องราว ความทรงจำ และช่วงเวลาดีๆ จากกิจกรรมของเรา
                                </p>
                            </div>
                            
                            {/* AutoPlay Toggle */}
                            <div className="mt-6 md:mt-0 flex items-center gap-4">
                                {/* <button
                                    onClick={() => setAutoPlay(!autoPlay)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl backdrop-blur-md transition-all ${
                                        autoPlay 
                                            ? 'bg-white text-blue-600 shadow-lg' 
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                >
                                    <Clock size={20} />
                                    {autoPlay ? 'Auto Play ON' : 'Auto Play OFF'}
                                </button> */}
                                {/* <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-2xl p-1">
                                    <button
                                        onClick={handlePrevious}
                                        className="p-3 hover:bg-white/20 rounded-xl text-white transition-all"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <span className="text-white font-medium px-2 min-w-[80px] text-center">
                                        {currentIndex + 1} / {activities.length}
                                    </span>
                                    <button
                                        onClick={handleNext}
                                        className="p-3 hover:bg-white/20 rounded-xl text-white transition-all"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div> */}
                            </div>
                        </div>
                        
                        {/* Activity Tags */}
                        {/* <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                            {activities.map((activity, idx) => (
                                <button
                                    key={activity.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                                        currentIndex === idx
                                            ? 'bg-white text-blue-600 shadow-lg'
                                            : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
                                    }`}
                                >
                                    {getActivityIcon(activity.title)} {activity.title.split(' ').slice(0, 3).join(' ')}...
                                </button>
                            ))}
                        </div> */}
                    </div>
                </div>

                {/* Main Slider Content */}
                <div className="flex-1 max-w-7xl w-full mx-auto p-6">
                    <div 
                        ref={sliderRef}
                        className="relative transition-all duration-500 ease-out"
                    >
                        {/* Activity Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 transform hover:shadow-3xl transition-shadow">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                
                                {/* Image Section - 7 columns */}
                                <div className="lg:col-span-7 relative group bg-gray-900">
                                    {currentActivity.images.length > 0 ? (
                                        <>
                                            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
                                                <img
                                                    src={currentActivity.images[0].image_path}
                                                    alt={currentActivity.images[0].image_alt_text}
                                                    className="w-full h-full object-cover"
                                                />
                                                
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                                
                                                {/* Image Navigation */}
                                                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button
                                                        onClick={handlePrevious}
                                                        className="bg-black/60 hover:bg-black/80 text-white p-4 rounded-2xl transform hover:scale-110 transition-all backdrop-blur-md border border-white/20"
                                                    >
                                                        <ChevronLeft size={28} />
                                                    </button>
                                                    <button
                                                        onClick={handleNext}
                                                        className="bg-black/60 hover:bg-black/80 text-white p-4 rounded-2xl transform hover:scale-110 transition-all backdrop-blur-md border border-white/20"
                                                    >
                                                        <ChevronRight size={28} />
                                                    </button>
                                                </div>
                                                
                                                {/* Image Counter */}
                                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm border border-white/20">
                                                    <span className="flex items-center gap-2">
                                                        <Camera size={16} />
                                                        {currentActivity.images.length} ภาพในกิจกรรม
                                                    </span>
                                                </div>
                                                
                                                {/* Thumbnails Strip */}
                                                {currentActivity.images.length > 1 && (
                                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                                        {currentActivity.images.slice(0, 4).map((img, idx) => (
                                                            <div 
                                                                key={img.id}
                                                                className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/60 shadow-lg transform hover:scale-110 transition-transform cursor-pointer"
                                                            >
                                                                <img 
                                                                    src={img.image_path} 
                                                                    alt="" 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ))}
                                                        {currentActivity.images.length > 4 && (
                                                            <div className="w-12 h-12 rounded-xl bg-black/60 backdrop-blur-md border-2 border-white/60 flex items-center justify-center text-white font-medium">
                                                                +{currentActivity.images.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="aspect-[4/3] lg:aspect-auto lg:h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <div className="text-center">
                                                <Camera size={48} className="text-gray-600 mx-auto mb-3" />
                                                <span className="text-gray-400">ไม่มีภาพในกิจกรรมนี้</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Content Section - 5 columns */}
                                <div className="lg:col-span-5 p-8 flex flex-col bg-white dark:bg-gray-900">
                                    {/* Status & Actions */}
                                    {/* <div className="flex items-center justify-between mb-6">
                                        <span className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(currentActivity.status)} text-white text-sm rounded-2xl font-medium shadow-lg`}>
                                            {currentActivity.status}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleLike(currentActivity.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all group"
                                            >
                                                <Heart 
                                                    size={22} 
                                                    className={`transition-all group-hover:scale-110 ${
                                                        liked.includes(currentActivity.id) 
                                                            ? 'fill-red-500 text-red-500' 
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                                />
                                            </button>
                                            <button 
                                                onClick={() => toggleSave(currentActivity.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all group"
                                            >
                                                <Bookmark 
                                                    size={22}
                                                    className={`transition-all group-hover:scale-110 ${
                                                        saved.includes(currentActivity.id)
                                                            ? 'fill-blue-500 text-blue-500'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                                />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                                                <Share2 size={22} className="text-gray-500 dark:text-gray-400 group-hover:scale-110" />
                                            </button>
                                        </div>
                                    </div> */}
                                    
                                    {/* Title & Description */}
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 flex items-center gap-2">
                                            {getActivityIcon(currentActivity.title)} {currentActivity.title}
                                        </h2>
                                        
                                        {currentActivity.description && (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
                                                <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                                                    {currentActivity.description}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Metadata Cards */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">วันที่จัดกิจกรรม</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatDate(currentActivity.activity_date)}
                                                </p>
                                            </div>
                                            
                                            {currentActivity.location && (
                                                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-800/30 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin size={18} className="text-red-600 dark:text-red-400" />
                                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">สถานที่</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                        {currentActivity.location}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Engagement Stats */}
                                        {/* <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Eye size={18} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {Math.floor(Math.random() * 500) + 200}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle size={18} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {Math.floor(Math.random() * 50) + 15}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Heart size={18} className="text-red-400" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {liked.includes(currentActivity.id) ? 
                                                            Math.floor(Math.random() * 100) + 150 : 
                                                            Math.floor(Math.random() * 100) + 50}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                อัปเดตล่าสุด 2 ชม. ที่แล้ว
                                            </span>
                                        </div> */}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="mt-6 flex gap-3">
                                        <button className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                            <Camera size={18} />
                                            ดูภาพทั้งหมด {currentActivity.images.length} ภาพ
                                        </button>
                                        <button className="px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 hover:scale-[1.02]">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Slide Indicators */}
                        <div className="flex justify-center mt-8 gap-2">
                            {activities.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${
                                        currentIndex === idx
                                            ? 'w-10 bg-gradient-to-r from-blue-600 to-purple-600'
                                            : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Related Activities / More Cards */}
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Camera size={28} className="text-blue-600" />
                                กิจกรรมอื่นๆ ที่น่าสนใจ
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                    เลือกดูกิจกรรมเพิ่มเติม
                                </span>
                            </h3>
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all">
                                ดูทั้งหมด
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {activities.filter((_, idx) => idx !== currentIndex).slice(0, 4).map((activity) => {
                                const activityIndex = activities.findIndex(a => a.id === activity.id);
                                return (
                                    <button
                                        key={activity.id}
                                        onClick={() => setCurrentIndex(activityIndex)}
                                        className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 transition-all transform hover:scale-[1.03]"
                                    >
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                                            {activity.images.length > 0 ? (
                                                <>
                                                    <img
                                                        src={activity.images[0].image_path}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1.5 rounded-lg flex items-center gap-1">
                                                        <Camera size={12} />
                                                        {activity.images.length} ภาพ
                                                    </div>
                                                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${getStatusColor(activity.status)} text-white`}>
                                                        {activity.status}
                                                    </span>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Camera size={32} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {getActivityIcon(activity.title)} {activity.title}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Calendar size={12} />
                                                <span>{new Date(activity.activity_date).toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}</span>
                                            </div>
                                            {activity.location && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <MapPin size={12} />
                                                    <span className="line-clamp-1">{activity.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                  
                </div>
            </div>
        </AppLayout>
    );
}