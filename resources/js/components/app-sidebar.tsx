import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, ChevronDown, FlaskConical, Folder, FolderOpenDot, LayoutGrid, Notebook, Shield, UsersRound } from 'lucide-react';
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuItem name="Settings">
                            <SidebarMenuButton className="flex w-full items-center">
                                <Shield className="h-6 w-6" />
                                <span className="flex-1 font-medium">Admin</span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56 rounded-md bg-white p-1 shadow-lg">
                        <NavMain items={adminNavItems} />
                    </DropdownMenuContent>
                </DropdownMenu>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
