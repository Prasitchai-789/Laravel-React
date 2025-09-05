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
import { BookOpen, ChevronDown, FlaskConical, Folder, FolderOpenDot, Handshake, LayoutGrid, Notebook, Shield, UsersRound ,ChartNoAxesCombined ,
    ShoppingBasket,ChartCandlestick} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderOpenDot,
    },
    {
        title: 'Chemicals',
        href: '/chemical',
        icon: FlaskConical,
    },
    // React Menu
    {
        title: 'Community',
        href: '/citizens/communitypage',
        icon: Handshake,
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
                {can('developer_GM.view') && (
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
            </SidebarContent>

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
