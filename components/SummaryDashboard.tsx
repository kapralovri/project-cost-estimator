
import React, { useState } from 'react';
import { RoleAnalyticsTable } from './RoleAnalyticsTable';
import { DistributionChart } from './DistributionChart';
import type { RoleAnalytics } from '../types';

interface SummaryDashboardProps {
    data: RoleAnalytics[];
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ data }) => {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div className="bg-card rounded-lg p-6 shadow-lg h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-card-foreground">Аналитика по ролям</h3>
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="px-3 py-1 text-sm rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    aria-expanded={!collapsed}
                >
                    {collapsed ? 'Развернуть' : 'Свернуть'}
                </button>
            </div>
            {!collapsed && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="overflow-x-auto">
                    <RoleAnalyticsTable data={data} />
                </div>
                <div className="min-h-[300px]">
                    <DistributionChart data={data} />
                </div>
            </div>
            )}
        </div>
    );
};
