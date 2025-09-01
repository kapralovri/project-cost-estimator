
import React from 'react';
import { RoleAnalyticsTable } from './RoleAnalyticsTable';
import { DistributionChart } from './DistributionChart';
import type { RoleAnalytics } from '../types';

interface SummaryDashboardProps {
    data: RoleAnalytics[];
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ data }) => {
    return (
        <div className="bg-card rounded-lg p-6 shadow-lg h-full">
            <h3 className="text-lg font-bold text-card-foreground mb-4">Аналитика по ролям</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="overflow-x-auto">
                    <RoleAnalyticsTable data={data} />
                </div>
                <div className="min-h-[300px]">
                    <DistributionChart data={data} />
                </div>
            </div>
        </div>
    );
};
