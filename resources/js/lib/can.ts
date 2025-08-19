import { usePage } from '@inertiajs/react';

export function can(permission: string): boolean {
    const {auth} = usePage().props as {
        auth:{
            permissions: string[]
        };
    };
    return auth.permissions.includes(permission);
}
