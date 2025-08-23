import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

// export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
//     <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
//         {children}
//     </AppLayoutTemplate>
// );



export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    useEffect(() => {
        // ดึงเวลา session expire ที่คุณบันทึกไว้ตอน login
        const expireAt = localStorage.getItem("session_expire");

        if (expireAt) {
            const now = Date.now();
            const timeout = Number(expireAt) - now;

            if (timeout > 0) {
                const timer = setTimeout(() => {
                    // หมดเวลา → เด้งไป Dashboard
                    window.location.href = "/";
                }, timeout);

                return () => clearTimeout(timer);
            } else {
                // ถ้าเลยเวลาแล้ว → เด้งทันที
                window.location.href = "/";
            }
        }
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
};
