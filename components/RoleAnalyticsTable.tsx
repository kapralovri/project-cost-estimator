
import React from 'react';
import type { RoleAnalytics } from '../types';

interface RoleAnalyticsTableProps {
    data: RoleAnalytics[];
}

export const RoleAnalyticsTable: React.FC<RoleAnalyticsTableProps> = ({ data }) => {

    const totals = data.reduce((acc, curr) => {
        acc.specialtyHours += curr.specialtyHours;
        acc.riskHours += curr.riskHours;
        acc.generalHours += curr.generalHours;
        acc.totalHours += curr.totalHours;
        acc.distribution += curr.distribution;
        acc.fte += curr.fte;
        return acc;
    }, { specialtyHours: 0, riskHours: 0, generalHours: 0, totalHours: 0, distribution: 0, fte: 0 });

    return (
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Роль</th>
                    <th scope="col" className="px-4 py-2 text-right">Сумма ч/ч</th>
                    <th scope="col" className="px-4 py-2 text-right">Риски</th>
                    <th scope="col" className="px-4 py-2 text-right">Общие</th>
                    <th scope="col" className="px-4 py-2 text-right">Итого</th>
                    <th scope="col" className="px-4 py-2 text-right">%</th>
                    <th scope="col" className="px-4 py-2 text-right">FTE</th>
                </tr>
            </thead>
            <tbody>
                {data.map((role) => (
                    <tr key={role.name} className="border-b border-border hover:bg-secondary/50">
                        <th scope="row" className="px-4 py-2 font-medium text-card-foreground whitespace-nowrap">{role.name}</th>
                        <td className="px-4 py-2 text-right">{role.specialtyHours}</td>
                        <td className="px-4 py-2 text-right">{role.riskHours}</td>
                        <td className="px-4 py-2 text-right">{role.generalHours}</td>
                        <td className="px-4 py-2 text-right font-semibold text-primary">{role.totalHours}</td>
                        <td className="px-4 py-2 text-right">{role.distribution.toFixed(0)}%</td>
                        <td className="px-4 py-2 text-right">{role.fte.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="font-semibold text-card-foreground">
                <tr>
                    <td className="px-4 py-2">Итого</td>
                    <td className="px-4 py-2 text-right">{totals.specialtyHours}</td>
                    <td className="px-4 py-2 text-right">{totals.riskHours}</td>
                    <td className="px-4 py-2 text-right">{totals.generalHours}</td>
                    <td className="px-4 py-2 text-right text-primary">{totals.totalHours}</td>
                    <td className="px-4 py-2 text-right">{Math.round(totals.distribution)}%</td>
                    <td className="px-4 py-2 text-right">{totals.fte.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    );
};
