
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { RoleAnalytics } from '../types';
import { useTheme } from './ThemeProvider';

interface DistributionChartProps {
    data: RoleAnalytics[];
}

const initialDarkColors = {
    grid: '#374151', // gray-700
    tick: '#9CA3AF', // gray-400
    tooltipBg: '#1F2937', // gray-800
    tooltipBorder: '#374151', // gray-700
    bar: '#14B8A6', // teal-500
    label: '#F3F4F6', // gray-100
};

export const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const [chartColors, setChartColors] = useState(initialDarkColors);

    useEffect(() => {
        // Delay to ensure CSS variables are applied
        const timer = setTimeout(() => {
            const computedStyle = getComputedStyle(document.documentElement);
            setChartColors({
                grid: `hsl(${computedStyle.getPropertyValue('--secondary')})`,
                tick: `hsl(${computedStyle.getPropertyValue('--muted-foreground')})`,
                tooltipBg: `hsl(${computedStyle.getPropertyValue('--card')})`,
                tooltipBorder: `hsl(${computedStyle.getPropertyValue('--border')})`,
                bar: `hsl(${computedStyle.getPropertyValue('--primary')})`,
                label: `hsl(${computedStyle.getPropertyValue('--card-foreground')})`,
            });
        }, 50);
        return () => clearTimeout(timer);
    }, [theme]);

    const chartData = data
      .filter(d => d.distribution > 0)
      .map(d => ({
          name: d.name,
          '% распределения': parseFloat(d.distribution.toFixed(2)),
      }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" tick={{ fill: chartColors.tick }} fontSize={12} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: chartColors.tick }} unit="%" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        color: chartColors.label,
                    }}
                    cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                />
                <Bar dataKey="% распределения" fill={chartColors.bar} barSize={30}>
                   <LabelList dataKey="% распределения" position="top" formatter={(value: number) => `${value.toFixed(0)}%`} fill={chartColors.label} fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};