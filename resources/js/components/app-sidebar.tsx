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
    MonitorSmartphone,


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
        href: '/citizens/communitypage',
        icon: Handshake,
    },
];

const PDNavItem: Navitemp[] = [

    {
        title: 'Chemicals',
        href: '/chemical',
        icon: FlaskConical,
    },
];


const adminNavItems: NavItem[] = [
    {
        title: 'Users',
        href: '/users',
        icon: UsersRound,
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Notebook,
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Shield,
    },
    {
        title: 'เพิ่มข้อมูลของชุมชน',
        href: '/citizens',
        icon: UsersRound,
    },
];

const DevNavItems: NavItem[] = [
    {
        title: 'ปริมาณผลปาล์ม',
        href: '/palm/table',
        icon: ShoppingBasket,
    },
    {
        title: 'ปริมาณผลปาล์มรายวัน',
        href: '/palm/daily',
        icon: ChartNoAxesCombined,
    },
    {
        title: 'ต้นทุนการขาย',
        href: '/cost-analysis/dashboard',
        icon: ChartCandlestick,
    },
];

const AGRNavItems: NavItem[] = [
    {
        title: 'รายการขายสินค้า',
        href: '/sales',
        icon: ShoppingBasket,
    },
    {
        title: 'สต๊อกสินค้า',
        href: '/stock-agr',
        icon: ChartNoAxesCombined,
    },
    {
        title: 'ทะเบียนลูกค้า',
        href: '/customers',
        icon: BookUser,
    },
];

const FerNavItems: NavItem[] = [
    {
        title: 'การผลิต',
        href: '/fertilizer/productions',
        icon: Warehouse,
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
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                {can('developer.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center">
                                    <LayoutGrid className="h-6 w-6" />
                                    <span className="flex-1 font-medium">Dashboard Report</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain items={DevNavItems} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <NavMain items={mainNavItems} />

                {/* IT */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center">
                                <MonitorSmartphone className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700">
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

                {/* PD */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center">
                                <ChartNoAxesCombined className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-gray-700">
                                    ฝ่ายผลิต
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>PD</SidebarGroupLabel>
                            {/* กรองเมนู Store ตาม permission */}
                            <NavMain
                                items={PDNavItem.filter(
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
                            <SidebarMenuButton className="flex w-full items-center">
                                <Warehouse className="h-6 w-6" /> {/* ไอคอนหลักของกลุ่ม */}
                                <span className="flex-1 font-anuphan font-medium text-blue-800">
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
                                    <span className="flex-1 font-anuphan font-medium text-green-800">ฝ่ายสวนและต้นกล้า</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain items={AGRNavItems} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {can('agr.view') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex w-full items-center">
                                    <Factory className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-green-800">โรงปุ๋ย</span>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                            <DropdownMenuGroup>
                                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                                <NavMain items={FerNavItems} />
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

            </SidebarContent>


            {/* ADMIN */}
            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex w-full items-center">
                                <Shield className="h-6 w-6" />
                                <span className="flex-1 font-medium">Admin</span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 font-anuphan shadow-lg">
                        <DropdownMenuGroup>
                            <SidebarGroupLabel>Platform</SidebarGroupLabel>
                            <NavMain items={adminNavItems} />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>


        </Sidebar>
    );
}
