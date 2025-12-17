import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,


} from '@/components/ui/sidebar';
import { can } from '@/lib/can';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    ChartCandlestick,
    ChartNoAxesCombined,
    ChevronDown,
    Fence,
    FlaskConical,
    Folder,
    FolderOpenDot,
    Handshake,
    LayoutGrid,
    Notebook,
    Shield,
    ShoppingBasket,
    UsersRound,
    Store,
    Warehouse,
    ShoppingCart,
    ClipboardMinus,
    BookUser,
    Factory,
    FileText,
    MonitorSmartphone,
    ScrollText,
    CreditCard,

    ChartLine,
    Beaker,
    BadgeDollarSign,
    Proportions,
    Truck,

    Fingerprint,
    LayoutDashboard,
    CalendarDays,
    CalendarClock,
    CloudDownload,


} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

const StoreNavItems: NavItem[] = [

    {
        title: 'Dashboard',
        href: '/StoreOrder/Dashboard',
        icon: ChartLine,
        permission: ['PUR.view', 'PUR.Admin'],
    },
    {
        title: 'StoreOrder',
        href: '/StoreOrder',
        icon: Store,
        permission: ['PUR.view', 'PUR.Admin'] // ใส่ permission ที่ต้องการ
    },
    {
        title: 'Product Withdrawal',
        href: '/StoreOrder/StoreOrderIssue',
        icon: ShoppingCart,
        permission: ['PUR.view', 'users.view', 'PUR.Admin'], // OR condition ใช้ได้ทั้งสอง
    },
    {
        title: 'Stock Report',
        href: '/StoreOrder/StoreIssueIndex',
        icon: ClipboardMinus,
        permission: ['PUR.view', 'PUR.Admin', 'users.view']
    },
    {
        title: 'Store Movement',
        href: '/StoreOrder/StoreMovement',
        icon: ClipboardMinus,
        permission: ['PUR.view', 'PUR.Admin'],
    },

];

const ITNavItem: NavItem[] = [

    {
        title: 'Projects',
        href: '/projects',
        icon: FolderOpenDot,
    },
    // React Menu
    {
        title: 'Community',
        href: '/community', // ต้องตรงกับ Route Laravel
        icon: Handshake,
    },
    {
        title: 'บันทึกเอกสาร',
        href: '/memo/documents',
        icon: FileText,
    },
];

const PRONavItem: Navitemp[] = [

    {
        title: 'Chemicals',
        href: '/chemical',
        icon: FlaskConical,
    },
];


const ERPItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/ERPDashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'ERP',
        href: '/ERPIndex',
        icon: Fingerprint,
    },
    {
        title: 'ERPDetail',
        href: '/ERPDetail',
        icon: Fingerprint,
    },
    {
        title: 'ImportExcel',
        href: '/ImportExcel',
        icon: CloudDownload,
    },
    {
        title: 'จัดการวันหยุดและกำหนดกะ',
        href: '/shifts',
        icon: CalendarDays,
    },

    {
        title: 'OT',
        href: '/overtime',
        icon: CalendarClock,

    }

];



const adminNavItems: NavItem[] = [
    {
        title: 'Users',
        href: '/users',
        icon: UsersRound,
        permission: ['Admin.view'],
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Notebook,
        permission: ['Admin.view'],
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Shield,
        permission: ['Admin.view'],
    },
    {
        title: 'เพิ่มข้อมูลของชุมชน',
        href: '/citizens',
        icon: UsersRound,
        permission: ['Admin.view'],
    },

];

const DevNavItems: NavItem[] = [
    {
        title: 'ปริมาณผลปาล์ม',
        href: '/palm/table',
        icon: ShoppingBasket,
        permission: ['developer.view'],
    },
    {
        title: 'ปริมาณผลปาล์มรายวัน',
        href: '/palm/daily',
        icon: ChartNoAxesCombined,
        permission: ['developer.view'],
    },
    {
        title: 'ต้นทุนการขาย',
        href: '/cost-analysis/dashboard',
        icon: ChartCandlestick,
        permission: ['developer.view'],
    },
    {
        title: 'รายงานการขาย',
        href: '/sales/dashboard',
        icon: Truck,
        permission: ['developer.view'],
    },
    {
        title: 'รายการใบสั่งซื้อ',
        href: '/purchase/po',
        icon: ScrollText,
        permission: ['developer.view'],
    },
    {
        title: 'สรุปค่าใช้จ่าย',
        href: '/purchase/dashboard',
        icon: CreditCard,
        permission: ['developer.view'],
    },
    {
        title: 'งบทดลองเบื้องต้น',
        href: '/accounts',
        icon: CreditCard,
        permission: ['developer.view'],
    },
    {
        title: 'รายงานการขายสินค้า',
        href: '/sales-order',
        icon: BadgeDollarSign,
        permission: ['developer.view'],
    },

];

const MARNavItems: NavItem[] = [
    {
        title: 'รายงานการขาย',
        href: '/sales/dashboard',
        icon: Truck,
        permission: ['mar.edit'],
    },
    {
        title: 'รายงานการขายสินค้า',
        href: '/sales-order',
        icon: BadgeDollarSign,
        permission: ['mar.edit'],
    },
    {
        title: 'จัดการคำสั่งขาย',
        href: '/orders',
        icon: Truck,
        permission: ['mar.view'],
    },
];

const AGRNavItems: NavItem[] = [
    {
        title: 'รายการขายสินค้า',
        href: '/sales',
        icon: ShoppingBasket,
        permission: ['agr.view'],
    },
    {
        title: 'สต๊อกสินค้า',
        href: '/stock-agr',
        icon: ChartNoAxesCombined,
        permission: ['agr.view'],
    },
    {
        title: 'ทะเบียนลูกค้า',
        href: '/customers',
        icon: BookUser,
        permission: ['agr.view'],
    },
    {
        title: 'รายงานการขายสินค้าต้นกล้า',
        href: '/sales/report-by-subdistrict',
        icon: Proportions,
        permission: ['agr.delete'],
    },
];

const FerNavItems: NavItem[] = [
    {
        title: 'การผลิตปุ๋ย',
        href: '/fertilizer/productions',
        icon: Warehouse,
        permission: ['fer.view'],
    }
]
const QACNavItems: NavItem[] = [
    {
        title: 'บันทึกข้อมูล Stock CPO',
        href: '/cpo',
        icon: Beaker,
        permission: ['qac.view'],
    },
    {
        title: 'บันทึกข้อมูล Kernel',
        href: '/stock/kernel',
        icon: Beaker,
        permission: ['qac.view'],
    },
    {
        title: 'บันทึกข้อมูล สินค้าอื่น ๆ',
        href: '/stock/by-products',
        icon: Beaker,
        permission: ['qac.view'],
    },
    {
        title: 'Stock CPO',
        href: '/stock/cpo',
        icon: Beaker,
        permission: ['qac.view'],
    },
    {
        title: 'รายงานการผลิต',
        href: '/stock/report',
        icon: ScrollText,
        permission: ['qac.view'],
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroupLabel>Report Present</SidebarGroupLabel>
                {can('developer.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                    <LayoutGrid className="h-6 w-6" />
                                    <span className="flex-1 font-medium hover:text-blue-800">Dashboard Report</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain
                                    items={DevNavItems.filter(
                                        item => !item.permission || item.permission.some(p => can(p))
                                    )} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <NavMain items={mainNavItems} />

                <hr className="border-t border-gray-200 my-1" />
                {/* <hr className="border-t-[0.5px] border-gray-200 my-0.5 w-3/4 mx-auto" /> */}
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                {/* IT */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                <MonitorSmartphone className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                    ฝ่ายสารสนเทศและเทคโนโลยี
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>IT</SidebarGroupLabel>
                            {/* กรองเมนู Store ตาม permission */}
                            <NavMain
                                items={ITNavItem.filter(
                                    item => !item.permission || item.permission.some(p => can(p))
                                )}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* PRO */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                <ChartNoAxesCombined className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                    ฝ่ายผลิต
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>PRO</SidebarGroupLabel>
                            {/* กรองเมนู Store ตาม permission */}
                            <NavMain
                                items={PRONavItem.filter(
                                    item => !item.permission || item.permission.some(p => can(p))
                                )}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* MAR */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                <Truck className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                    ฝ่ายขายและการตลาด
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>MAR</SidebarGroupLabel>
                            {/* กรองเมนู Store ตาม permission */}
                            <NavMain
                                items={MARNavItems.filter(
                                    item => !item.permission || item.permission.some(p => can(p))
                                )}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* STORE */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                <Warehouse className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                    Store
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>Store</SidebarGroupLabel>
                            {/* กรองเมนู Store ตาม permission */}
                            <NavMain
                                items={StoreNavItems.filter(
                                    item => !item.permission || item.permission.some(p => can(p))
                                )}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>


                {/* PALM */}
                {can('agr.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center">
                                    <Fence className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">ฝ่ายสวนและต้นกล้า</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain
                                    items={AGRNavItems.filter(
                                        item => !item.permission || item.permission.some(p => can(p))
                                    )} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {can('agr.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                    <Factory className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">โรงปุ๋ย</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain
                                    items={FerNavItems.filter(
                                        item => !item.permission || item.permission.some(p => can(p))
                                    )} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}


                 {can('qac.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                    <FlaskConical className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">ฝ่ายควบคุมคุณภาพ</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>QAC</SidebarGroupLabel>
                                <NavMain
                                 items={QACNavItems.filter(
                                    item => !item.permission || item.permission.some(p => can(p))
                                )} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}


                {/* ERP */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center">
                                <UsersRound className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-blue-800">
                                    ERP
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>ERP</SidebarGroupLabel>
                            <NavMain
                                items={ERPItems.filter(
                                    (item) => !item.permission || item.permission.some((p) => can(p))
                                )}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>









            </SidebarContent>
            {/* <hr className="border-t-[0.5px] border-gray-200 my-0.5 w-3/4 mx-auto" /> */}
            <hr className="border-t border-gray-200 my-1" />

            {/* ADMIN */}
            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center hover:text-blue-800">
                                <Shield className="h-6 w-6" />
                                <span className="flex-1 font-medium hover:text-blue-800">Admin</span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>Platform</SidebarGroupLabel>
                            <NavMain items={adminNavItems.filter(item =>
                                item.permission?.some(p => can(p))
                            )} />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <hr className="border-t border-gray-200 my-1" />

                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>

        </Sidebar>
    );
}
