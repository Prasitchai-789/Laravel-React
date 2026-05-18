import { usePage } from '@inertiajs/react';

type PermissionPageProps = {
    auth?: {
        permissions?: string[];
        roles?: string[];
    };
};

export function useCanAny(permissions: string[]): boolean {
    const { auth } = usePage().props as PermissionPageProps;
    const access = new Set([...(auth?.permissions ?? []), ...(auth?.roles ?? [])].map((item) => item.toLowerCase()));

    return permissions.some((permission) => access.has(permission.toLowerCase()));
}
