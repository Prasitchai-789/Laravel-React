import React from 'react';
import {
    Cpu, Monitor, Plug, Cctv, Server, Shield, Network,
    Printer, Camera, BarChart3, Laptop, Package
} from "lucide-react";

interface CategoryIconProps {
    category: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
    category,
    size = 'md',
    className = ""
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const iconProps = {
        className: `${sizeClasses[size]} flex-shrink-0 ${className}`
    };

    const iconMap: { [key: string]: JSX.Element } = {
        "Computer": <Cpu {...iconProps} />,
        "Monitor": <Monitor {...iconProps} />,
        "UPS": <Plug {...iconProps} />,
        "CCTV": <Cctv {...iconProps} />,
        "Server": <Server {...iconProps} />,
        "Firewall": <Shield {...iconProps} />,
        "Network": <Network {...iconProps} />,
        "Switch": <Network {...iconProps} />,
        "Printer": <Printer {...iconProps} />,
        "Scanner": <Camera {...iconProps} />,
        "Projector": <BarChart3 {...iconProps} />,
        "Laptop": <Laptop {...iconProps} />
    };

    return iconMap[category] || <Package {...iconProps} />;
};
