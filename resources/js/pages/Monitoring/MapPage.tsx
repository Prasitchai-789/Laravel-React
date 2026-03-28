import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import AppLayout from '@/layouts/app-layout';

// Fix for default Leaflet icons in Webpack/Vite
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

export default function MapPage() {
    const [devices, setDevices] = useState<any[]>([]);

    const fetchDevices = () => {
        axios.get('/api/monitoring/dashboard/map').then(res => setDevices(res.data));
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    useRealtimeDevices(() => fetchDevices());

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Device Map', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="h-[calc(100vh-80px)] w-full relative z-0">
                <MapContainer center={[13.7563, 100.5018]} zoom={10} style={{ height: "100%", width: "100%" }}>
                    <TileLayer 
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                    />
                    
                    {devices.map(device => (
                        device.location?.lat && (
                            <Marker 
                                key={device.id} 
                                position={[device.location.lat, device.location.lng]}
                            >
                                <Popup>
                                    <div className="text-center font-anuphan min-w-[150px]">
                                        <h3 className="font-bold text-gray-800 text-base">{device.name}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{device.ip_address}</p>
                                        <span className={`px-3 py-1 mt-1 inline-block rounded-full text-xs font-bold text-white shadow-sm ${device.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                            {device.status.toUpperCase()}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>
            </div>
        </AppLayout>
    );
}
