import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

window.Pusher = Pusher;

export const useRealtimeDevices = (onDeviceUpdated: (device: any) => void) => {
    useEffect(() => {
        // Initialize Echo if not already done globally
        const echo = new Echo({
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
            wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
            wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
            wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        const channel = echo.channel('devices');
        
        channel.listen('DeviceStatusUpdated', (event: any) => {
            if (event) {
                onDeviceUpdated(event);
            }
        });

        return () => {
            channel.stopListening('DeviceStatusUpdated');
            echo.leaveChannel('devices');
        };
    }, [onDeviceUpdated]);
};
