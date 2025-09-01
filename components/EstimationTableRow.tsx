import React, { useMemo, useCallback } from 'react';
import type { Task, Estimate, ProjectParameters, RoleKey } from '../types';
import { TrashIcon } from './icons';

interface EstimationTableRowProps {
  task: Task;
  parameters: ProjectParameters;
  onTaskChange: (id: string, updatedTask: Task) => void;
  onRemoveTask: (id: string) => void;
}

const pert = (e: Estimate) => (e.min + 4 * e.real + e.max) / 6;

const estimateGroups: { name: string, key: RoleKey }[] = [
    { name: 'Анализ', key: 'analysis' },
    { name: 'Front Dev', key: 'frontDev' },
    { name: 'Back Dev', key: 'backDev' },
    { name: 'Тестирование', key: 'testing' },
    { name: 'Devops', key: 'devops' },
    { name: 'Дизайнер', key: 'design' },
    { name: 'Технические писатели', key: 'techWriter' },
];

const EstimateCell: React.FC<{ value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isReadOnly?: boolean }> = ({ value, onChange, isReadOnly = false }) => (
    <td className="px-1 py-1">
        <input
            type="number"
            value={value}
            onChange={onChange}
            readOnly={isReadOnly}
            className={`w-16 text-center rounded p-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring ${isReadOnly ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed' : 'bg-background text-foreground'}`}
        />
    </td>
);

export const EstimationTableRow: React.FC<EstimationTableRowProps> = ({ task, parameters, onTaskChange, onRemoveTask }) => {
    const isManualTesting = !!parameters.isManualTesting;

    const handleEstimateChange = useCallback((role: RoleKey, field: keyof Estimate, value: number) => {
        const updatedTask = {
            ...task,
            estimates: {
                ...task.estimates,
                [role]: {
                    ...task.estimates[role],
                    [field]: value
                }
            }
        };
        onTaskChange(task.id, updatedTask);
    }, [task, onTaskChange]);
    
    const handleTextChange = useCallback((field: 'stage' | 'name', value: string) => {
        const updatedTask = { ...task, [field]: value };
        onTaskChange(task.id, updatedTask);
    }, [task, onTaskChange]);

    const handleRiskChange = useCallback((isRisk: boolean) => {
        const updatedTask = { ...task, isRisk };
        onTaskChange(task.id, updatedTask);
    }, [task, onTaskChange]);

    const pertValues = useMemo(() => {
        const result: Record<RoleKey, number> = {} as any;
        
        const getPert = (estimate: Estimate) => task.isRisk ? estimate.max : pert(estimate);

        estimateGroups.forEach(group => {
            if (group.key === 'testing') {
                if (isManualTesting) {
                    result.testing = getPert(task.estimates.testing);
                } else {
                    const backDev = getPert(task.estimates.backDev);
                    const frontDev = getPert(task.estimates.frontDev);
                    result.testing = (backDev + frontDev) * (parameters.testing / 100);
                }
            } else {
                result[group.key] = getPert(task.estimates[group.key]);
            }
        });
        return result;
    }, [task, parameters, isManualTesting]);

    const { baseEstimate, riskHours, generalHours, managementHours, totalHours } = useMemo(() => {
        const totalBaseWithTesting = Object.values(pertValues).reduce((sum, val) => sum + val, 0);
        
        const management = totalBaseWithTesting * (parameters.management / 100);
        const subTotal = totalBaseWithTesting + management;
        const risk = subTotal * (parameters.risks / 100);
        const general = subTotal * (parameters.general / 100);
        const total = subTotal + risk + general;
        
        return {
            baseEstimate: Math.round(totalBaseWithTesting),
            riskHours: Math.round(risk),
            generalHours: Math.round(general),
            managementHours: Math.round(management),
            totalHours: Math.round(total)
        };
    }, [pertValues, parameters]);

    return (
        <tr className="border-b border-border group">
            <td className="px-3 py-2 sticky left-0 bg-card group-hover:bg-secondary/50 z-10 transition-colors">
                <button onClick={() => onRemoveTask(task.id)} className="text-muted-foreground hover:text-destructive">
                    <TrashIcon />
                </button>
            </td>
            <td className="px-3 py-2 sticky left-12 bg-card group-hover:bg-secondary/50 z-10 transition-colors">
                <input type="text" value={task.stage} onChange={(e) => handleTextChange('stage', e.target.value)} className="bg-transparent w-full focus:outline-none focus:bg-input p-1 rounded min-w-[138px]" />
            </td>
            <td className="px-3 py-2 sticky left-[210px] bg-card group-hover:bg-secondary/50 z-10 transition-colors">
                <input type="text" value={task.name} onChange={(e) => handleTextChange('name', e.target.value)} className="bg-transparent w-full focus:outline-none focus:bg-input p-1 rounded min-w-[188px]" />
            </td>
            <td className="px-3 py-2 sticky left-[410px] bg-card group-hover:bg-secondary/50 z-10 transition-colors text-center">
                <input
                  type="checkbox"
                  checked={task.isRisk}
                  onChange={(e) => handleRiskChange(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
            </td>

            {estimateGroups.map(group => {
              const isTesting = group.key === 'testing';
              
              return (
                <React.Fragment key={group.key}>
                    <EstimateCell value={task.estimates[group.key].min} onChange={(e) => handleEstimateChange(group.key, 'min', Number(e.target.value))} isReadOnly={isTesting && !isManualTesting} />
                    <EstimateCell value={task.estimates[group.key].real} onChange={(e) => handleEstimateChange(group.key, 'real', Number(e.target.value))} isReadOnly={isTesting && !isManualTesting} />
                    <EstimateCell value={task.estimates[group.key].max} onChange={(e) => handleEstimateChange(group.key, 'max', Number(e.target.value))} isReadOnly={isTesting && !isManualTesting} />
                    <td className="px-2 py-2 text-center font-bold text-primary bg-secondary/70 border-r border-l border-border">
                        {Math.round(pertValues[group.key])}
                    </td>
                </React.Fragment>
              );
            })}

            <td className="px-2 py-2 text-center border-l border-border">{riskHours}</td>
            <td className="px-2 py-2 text-center">{generalHours}</td>
            <td className="px-2 py-2 text-center">{managementHours}</td>
            <td className="px-2 py-2 text-center font-bold bg-secondary/70">{totalHours}</td>
            <td className="px-2 py-2 text-center font-bold text-primary bg-primary/20">{baseEstimate}</td>
        </tr>
    );
};