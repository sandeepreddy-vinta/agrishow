import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, change, trend = 'neutral', icon: Icon, color = 'primary' }) => {
    const colorMap = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        error: 'bg-error/10 text-error',
        warning: 'bg-yellow-500/10 text-yellow-500',
    };

    return (
        <div className="glass-panel p-6 hover:translate-y-[-2px] transition-transform duration-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-muted text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorMap[color]}`}>
                    <Icon size={24} />
                </div>
            </div>

            {change && (
                <div className="flex items-center gap-2 mt-4 text-sm">
                    <span className={`flex items-center gap-1 font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted'}`}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {change}
                    </span>
                    <span className="text-muted">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
