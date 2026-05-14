import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Beaker,
    BookUser,
    Car,
    ChartCandlestick,
    ChartLine,
    ChartNoAxesCombined,
    ChevronRight,
    ClipboardList,
    ClipboardMinus,
    CreditCard,
    Database,
    Factory,
    FileText,
    FlaskConical,
    LayoutDashboard,
    LayoutGrid,
    MonitorSmartphone,
    Notebook,
    Proportions,
    QrCode,
    ScrollText,
    Shield,
    ShoppingBasket,
    ShoppingCart,
    Store,
    Truck,
    UsersRound,
    Warehouse,
    Weight,
    Fence,
    Camera,
    Globe,
    Droplets
} from 'lucide-react';

import React from 'react';
import AppLogo from './app-logo';

type SidebarPageProps = {
    auth: {
        permissions?: string[];
        roles?: string[];
    };
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        permission: ['user.view'],
    },
];

const StoreNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/StoreOrder/Dashboard', icon: ChartLine, permission: ['PUR.edit', 'PUR.Admin','pur.edit'] },
    { title: 'StoreOrder', href: '/StoreOrder', icon: Store, permission: ['PUR.edit', 'PUR.Admin','pur.edit'] },
    { title: 'Product Withdrawal', href: '/StoreOrder/StoreOrderIssue', icon: ShoppingCart, permission: ['PUR.view', 'users.view', 'PUR.Admin','pur.edit'] },
    { title: 'Stock Report', href: '/StoreOrder/StoreIssueIndex', icon: ClipboardMinus, permission: ['PUR.view', 'PUR.Admin', 'users.view','pur.edit'] },
    { title: 'Store Movement', href: '/StoreOrder/StoreMovement', icon: ClipboardMinus, permission: ['PUR.edit', 'PUR.Admin','pur.edit'] },
];

const ITNavItem: NavItem[] = [
    { title: 'บันทึกเอกสาร', href: '/memo/documents', icon: FileText, permission: ['it.view'] },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol', icon: QrCode, permission: ['it.view'] },
    { title: 'ภาพรวม CCTV รายเดือน', href: '/cctv-inspection/overview', icon: ChartNoAxesCombined, permission: ['it.view'] },
    { title: 'CCTV Inspection', href: '/cctv-inspection', icon: Camera, permission: ['it.view'] },
    { title: 'ตั้งค่าเครื่องบันทึก DVR', href: '/dvrs', icon: Camera, permission: ['it.view'] },
    { title: 'Computer Inspection', href: '/computer-inspection', icon: MonitorSmartphone, permission: ['it.view'] },
];

const PRONavItem: NavItem[] = [
    { title: 'Chemicals', href: '/chemical', icon: FlaskConical, permission: ['pro.edit', 'gm.view'] },
    { title: 'จัดการสารเคมี', href: '/chemical-master', icon: Beaker, permission: ['pro.edit', 'gm.view'] },
    { title: 'Production Monitor', href: '/production-dashboard', icon: Factory, permission: ['pro.edit', 'gm.view'] },
    { title: 'บันทึกข้อมูลการผลิต', href: '/pro/production-record', icon: ClipboardList, permission: ['pro.edit', 'gm.view'] },
    { title: 'รายงานข้อมูลการผลิต', href: '/pro/production-report', icon: ClipboardList, permission: ['pro.edit', 'gm.view', 'qac.edit'] },
];

const adminNavItems: NavItem[] = [
    { title: 'Users', href: '/users', icon: UsersRound, permission: ['admin.view'] },
    { title: 'Roles', href: '/roles', icon: Notebook, permission: ['admin.view'] },
    { title: 'Permissions', href: '/permissions', icon: Shield, permission: ['admin.view'] },
    { title: 'เพิ่มข้อมูลของชุมชน', href: '/citizens', icon: UsersRound, permission: ['admin.view'] },
    { title: 'บันทึกการเข้าใช้งาน', href: '/admin/page-access-logs', icon: ScrollText, permission: ['admin.edit'] },
    { title: 'สรุป API', href: '/admin/api-summary', icon: Database, permission: ['admin.edit'] },
];

const DevNavItems: NavItem[] = [
    { title: 'รายงานรับซื้อผลปาล์ม', href: '/purchase/po-invoice-dashboard', icon: ShoppingCart, permission: ['developer.view', 'gm.view'] },
    { title: 'รายงานการขาย', href: '/purchase/executive-report', icon: LayoutDashboard, permission: ['developer.view', 'gm.view'] },
    { title: 'รายงานการผลิต', href: '/purchase/executive-production-report', icon: Factory, permission: ['developer.view', 'gm.view'] },

    { title: 'CPO Supply Dashboard', href: '/stock/cpo-supply-dashboard', icon: ChartCandlestick, permission: ['developer.view', 'gm.view'] },

    { title: 'Stock Report', href: '/stock/valuation-report', icon: Database, permission: ['developer.view', 'gm.view'] },
    { title: 'ปริมาณผลปาล์ม', href: '/palm/table', icon: ShoppingBasket, permission: ['developer.view', 'gm.view'] },
    { title: 'ปริมาณผลปาล์มรายวัน', href: '/palm/daily', icon: ChartNoAxesCombined, permission: ['developer.view', 'gm.view'] },
    { title: 'ต้นทุนการขาย', href: '/cost-analysis/dashboard', icon: ChartCandlestick, permission: ['developer.view', 'gm.view'] },
    { title: 'รายงานการขาย', href: '/sales/dashboard', icon: Truck, permission: ['developer.view', 'gm.view'] },
    { title: 'รายการใบสั่งซื้อ', href: '/purchase/po', icon: ScrollText, permission: ['developer.view', 'gm.view'] },
    { title: 'สรุปค่าใช้จ่าย', href: '/purchase/dashboard', icon: CreditCard, permission: ['developer.view', 'gm.view'] },
    { title: 'งบทดลองเบื้องต้น', href: '/accounts', icon: CreditCard, permission: ['developer.view'] },
    { title: 'รายงานการขายสินค้า', href: '/sales-order', icon: BadgeDollarSign, permission: ['developer.view', 'gm.view'] },
    { title: 'วิเคราะห์การรับซื้อปาล์ม', href: '/palm/analytics', icon: ChartLine, permission: ['developer.view'] },
    { title: 'Palm Price Report', href: '/market/palm-price-report', icon: Globe, permission: ['developer.view', 'gm.view'] },
];

const MARNavItems: NavItem[] = [
    { title: 'รายงานการขาย', href: '/sales/dashboard', icon: Truck, permission: ['mar.edit'] },
    { title: 'แผนจัดส่ง (Delivery Plan)', href: '/delivery-plan', icon: Truck, permission: ['developer.view', 'mar.edit', 'gm.view'] },
    { title: 'รายงานการขายสินค้า', href: '/sales-order', icon: BadgeDollarSign, permission: ['mar.edit'] },
    { title: 'จัดการคำสั่งขาย', href: '/orders', icon: Truck, permission: ['mar.view'] },
    { title: 'แผนการโหลดสินค้า', href: '/mar/plan-order', icon: Weight, permission: ['mar.view'] },
];

const AGRNavItems: NavItem[] = [
    { title: 'รายการขายสินค้า', href: '/sales', icon: ShoppingBasket, permission: ['agr.view'] },
    { title: 'สต๊อกสินค้า', href: '/stock-agr', icon: ChartNoAxesCombined, permission: ['agr.view'] },
    { title: 'ทะเบียนลูกค้า', href: '/customers', icon: BookUser, permission: ['agr.view'] },
    { title: 'รายงานการขายสินค้าต้นกล้า', href: '/sales/report-by-subdistrict', icon: Proportions, permission: ['agr.delete'] },
];

const FerNavItems: NavItem[] = [
    { title: 'การผลิตปุ๋ย', href: '/fertilizer/productions', icon: Warehouse, permission: ['fer.view'] }
];

const QACDataEntryNavItems: NavItem[] = [
    { title: 'COA น้ำมันปาล์มดิบ', href: '/qac/coa/oil', icon: Beaker, permission: ['qac.user', 'qac.view', 'qac.edit'] },
    { title: 'COA เมล็ดในปาล์ม', href: '/qac/coa/seed', icon: Beaker, permission: ['qac.user', 'qac.view', 'qac.edit'] },
    { title: 'บันทึกข้อมูล Stock CPO', href: '/cpo', icon: Beaker, permission: ['qac.user', 'qac.edit'] },
    { title: 'บันทึก Skim / Mix', href: '/skim-mix', icon: Beaker, permission: ['qac.user', 'qac.edit'] },
    { title: 'บันทึกข้อมูล Kernel', href: '/stock/kernel', icon: Beaker, permission: ['qac.user', 'qac.edit'] },
    { title: 'บันทึกข้อมูล สินค้าอื่น ๆ', href: '/stock/by-products', icon: Beaker, permission: ['qac.user', 'qac.edit'] },
];

const QACReportNavItems: NavItem[] = [

    { title: 'Stock CPO', href: '/stock/cpo', icon: Beaker, permission: ['qac.delete'] },
    { title: 'รายงานการผลิต (Mill Daily)', href: '/qac/mill-daily-report', icon: ScrollText, permission: ['qac.delete'] },
    { title: 'รายงานการผลิต', href: '/stock/report', icon: ScrollText, permission: ['qac.delete'] },
    { title: 'รายงานพาณิชย์', href: '/stock/production-report', icon: ScrollText, permission: ['qac.delete', 'mar.edit'] },
    { title: 'รายงาน % Yield', href: '/yield-report', icon: ScrollText, permission: ['qac.delete'] },
    { title: 'รายงาน % Yield (ตาราง)', href: '/yield-table', icon: ScrollText, permission: ['qac.delete', 'mar.edit'] },
];

const QACNavItems: NavItem[] = [...QACReportNavItems, ...QACDataEntryNavItems];

const QMRNavItems: NavItem[] = [
    { title: 'บันทึกข้อมูลน้ำ', href: '/qmr/water-usage-reports', icon: Droplets, permission: ['qmr.view', 'admin.view', 'developer.view', 'gm.view', 'qac.view'] },
];

const CarUsageNavItems: NavItem[] = [
    { title: 'รายงานการใช้รถตามคัน', href: '/car-usage-report', icon: Car, permission: ['users.view'] },
    { title: 'รายงานการใช้รถตามผู้ใช้', href: '/user-car-usage-report', icon: Car, permission: ['users.view'] },
];

// Helper function to check if user is developer
const checkIsDeveloper = (permissions: string[]) => permissions.includes('developer.view');

const normalizeAccessList = (items?: unknown[]) => {
    if (!Array.isArray(items)) return [];
    return items
        .map((item: any) => (typeof item === 'string' ? item : item?.name))
        .filter(Boolean)
        .map((item: string) => item.toLowerCase());
};

// Helper function to filter items based on permissions or developer role
const filterItemsByPermission = (items: NavItem[], permissions: string[]) => {
    const isDev = checkIsDeveloper(permissions);
    return items.filter(item => {
        if (!item.permission) return true;
        if (isDev) return true;

        const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
        return perms.some((p: string) => permissions.includes(p));
    });
};

const uniqueAccessList = (items: string[]) => Array.from(new Set(items.map((item) => item.toLowerCase())));

export function AppSidebar() {
    const page = usePage();
    const { auth } = page.props as unknown as SidebarPageProps;
    const permissions = normalizeAccessList(auth.permissions);
    const access = uniqueAccessList([...permissions, ...normalizeAccessList(auth.roles)]);
    const hasAccess = (permission: string) => access.includes(permission.toLowerCase());
    const isDev = checkIsDeveloper(access);
    const isQacUserOnly =
        hasAccess('qac.user') &&
        !hasAccess('qac.edit') &&
        !hasAccess('mar.edit') &&
        !hasAccess('qac.admin') &&
        !hasAccess('qac_admin') &&
        !hasAccess('QAC.Admin') &&
        !isDev;
    const visibleQACNavItems = isQacUserOnly
        ? filterItemsByPermission(QACDataEntryNavItems, access)
        : filterItemsByPermission(QACNavItems, access);
    const isActiveHref = (href: string) => page.url === href || page.url.startsWith(`${href}/`);
    const hasActiveItem = (items: NavItem[]) => items.some((item) => isActiveHref(item.href));

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

            <SidebarContent className="no-scrollbar">
                <SidebarGroupLabel>Report Present</SidebarGroupLabel>

                {/* Developer Menu */}
                {(isDev || filterItemsByPermission(DevNavItems, access).length > 0) && (
                    <Collapsible asChild key={`dev-${page.url}`} defaultOpen={hasActiveItem(DevNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Dashboard Report" className="hover:text-blue-800">
                                    <LayoutGrid className="h-6 w-6" />
                                    <span className="flex-1 font-medium hover:text-blue-800">Dashboard Report</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(DevNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                <NavMain items={mainNavItems} />

                <hr className="border-t border-gray-200 my-1" />
                <SidebarGroupLabel>ISP</SidebarGroupLabel>

                {/* IT */}
                {(isDev || filterItemsByPermission(ITNavItem, access).length > 0) && (
                    <Collapsible asChild key={`it-${page.url}`} defaultOpen={hasActiveItem(ITNavItem)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="ฝ่ายสารสนเทศและเทคโนโลยี" className="hover:text-blue-800">
                                    <MonitorSmartphone className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        ฝ่ายสารสนเทศและเทคโนโลยี
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(ITNavItem, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {/* PRO */}
                {(isDev || filterItemsByPermission(PRONavItem, access).length > 0) && (
                    <Collapsible asChild key={`pro-${page.url}`} defaultOpen={hasActiveItem(PRONavItem)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="ฝ่ายผลิตและวิศวกรรม" className="hover:text-blue-800">
                                    <ChartNoAxesCombined className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        ฝ่ายผลิตและวิศวกรรม
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(PRONavItem, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {/* MAR */}
                {(isDev || filterItemsByPermission(MARNavItems, access).length > 0) && (
                    <Collapsible asChild key={`mar-${page.url}`} defaultOpen={hasActiveItem(MARNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="ฝ่ายขายและการตลาด" className="hover:text-blue-800">
                                    <Truck className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        ฝ่ายขายและการตลาด
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(MARNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {/* QAC */}
                {(isDev || visibleQACNavItems.length > 0) && (
                    <Collapsible asChild key={`qac-${page.url}`} defaultOpen={hasActiveItem(visibleQACNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="ฝ่ายควบคุมคุณภาพ" className="hover:text-blue-800">
                                    <FlaskConical className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">ฝ่ายควบคุมคุณภาพ</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {visibleQACNavItems.map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
                {/* STORE */}
                {(isDev || filterItemsByPermission(StoreNavItems, access).length > 0) && (
                    <Collapsible asChild key={`store-${page.url}`} defaultOpen={hasActiveItem(StoreNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="จัดซื้อทั่วไป/สโตร์" className="hover:text-blue-800">
                                    <Warehouse className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        จัดซื้อทั่วไป/สโตร์
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(StoreNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {/* QMR */}
                {(isDev || filterItemsByPermission(QMRNavItems, access).length > 0) && (
                    <Collapsible asChild key={`qmr-${page.url}`} defaultOpen={hasActiveItem(QMRNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="ฝ่ายแผนพัฒนาคุณภาพ" className="hover:text-blue-800">
                                    <Droplets className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        ฝ่ายแผนพัฒนาคุณภาพ
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(QMRNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {/* Car Usage */}
                {(isDev || filterItemsByPermission(CarUsageNavItems, access).length > 0) && (
                    <Collapsible asChild key={`car-${page.url}`} defaultOpen={hasActiveItem(CarUsageNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="รายงานการใช้รถ" className="hover:text-blue-800">
                                    <Car className="h-6 w-6" />
                                    <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">
                                        รายงานการใช้รถ
                                    </span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(CarUsageNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
            </SidebarContent>

            <hr className="border-t border-gray-200 my-1" />
            <SidebarGroupLabel>MUN</SidebarGroupLabel>

            {/* FER */}
            {(isDev || filterItemsByPermission(FerNavItems, access).length > 0) && (
                <Collapsible asChild key={`fer-${page.url}`} defaultOpen={hasActiveItem(FerNavItems)} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="โรงปุ๋ย" className="hover:text-blue-800">
                                <Factory className="h-6 w-6" />
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">โรงปุ๋ย</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {filterItemsByPermission(FerNavItems, access).map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                            <Link href={item.href} prefetch className="font-anuphan">
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            )}

            {/* AGR */}
            {(isDev || filterItemsByPermission(AGRNavItems, access).length > 0) && (
                <Collapsible asChild key={`agr-${page.url}`} defaultOpen={hasActiveItem(AGRNavItems)} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="ฝ่ายสวนและต้นกล้า" className="hover:text-blue-800">
                                <Fence className="h-6 w-6" />
                                <span className="flex-1 font-anuphan font-medium text-gray-700 hover:text-blue-800">ฝ่ายสวนและต้นกล้า</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {filterItemsByPermission(AGRNavItems, access).map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                            <Link href={item.href} prefetch className="font-anuphan">
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            )}

            <hr className="border-t border-gray-200 my-1" />

            <SidebarFooter>
                {/* ADMIN */}
                {(isDev || filterItemsByPermission(adminNavItems, access).length > 0) && (
                    <Collapsible asChild key={`admin-${page.url}`} defaultOpen={hasActiveItem(adminNavItems)} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Admin" className="hover:text-blue-800">
                                    <Shield className="h-6 w-6" />
                                    <span className="flex-1 font-medium hover:text-blue-800">Admin</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {filterItemsByPermission(adminNavItems, access).map((item) => (
                                        <SidebarMenuSubItem key={item.title}>
                                            <SidebarMenuSubButton asChild isActive={page.url.startsWith(item.href)}>
                                                <Link href={item.href} prefetch className="font-anuphan">
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
                <hr className="border-t border-gray-200 my-1" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
