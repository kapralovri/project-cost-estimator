import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import type { Task, Estimate, ProjectParameters, RoleKey } from '../types';
import { TrashIcon } from './icons';
import { api } from '../api';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface EstimationTableRowProps {
  task: Task;
  parameters: ProjectParameters;
  estimateId?: number;
  onTaskChange: (id: number, updatedTask: Task) => void;
  onRemoveTask: (id: number) => void;
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

const EstimateCell: React.FC<{ 
    value: number, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    onBlur?: () => void,
    isReadOnly?: boolean 
}> = ({ value, onChange, onBlur, isReadOnly = false }) => (
    <td className="px-1 py-1">
        <input
            type="number"
            min={0}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={isReadOnly}
            className={`w-16 text-center rounded p-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring ${isReadOnly ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed' : 'bg-background text-foreground'}`}
        />
    </td>
);

export const EstimationTableRow: React.FC<EstimationTableRowProps> = ({ task, parameters, estimateId, onTaskChange, onRemoveTask }) => {
    const isManualTesting = !!parameters.isManualTesting;
    const saveEstimateTimeoutRef = useRef<NodeJS.Timeout>();
    const saveTaskTimeoutRef = useRef<NodeJS.Timeout>();

    const saveEstimateToBackend = useCallback(async (role: RoleKey, estimate: Estimate) => {
        if (!estimateId || !task.id) {
            return;
        }
        
        try {
            await api.updateTaskEstimate(estimateId, task.id, role, {
                role,
                min: estimate.min,
                real: estimate.real,
                max: estimate.max,
            });
        } catch (error) {
            console.error('Failed to save estimate:', error);
        }
    }, [estimateId, task.id]);

    const saveTaskToBackend = useCallback(async (updatedTask: Task) => {
        if (!estimateId || !task.id) {
            return;
        }
        
        try {
            const taskDto = {
                taskName: updatedTask.name,
                stageName: updatedTask.stage,
                category: updatedTask.stage,
                complexity: updatedTask.isRisk ? 'high' : 'medium',
                estimatedHours: 0,
                status: 'planned',
                priority: 'medium',
                sortOrder: 0,
                estimates: [
                    { role: 'analysis', ...updatedTask.estimates.analysis },
                    { role: 'frontDev', ...updatedTask.estimates.frontDev },
                    { role: 'backDev', ...updatedTask.estimates.backDev },
                    { role: 'testing', ...updatedTask.estimates.testing },
                    { role: 'devops', ...updatedTask.estimates.devops },
                    { role: 'design', ...updatedTask.estimates.design },
                    { role: 'techWriter', ...updatedTask.estimates.techWriter },
                ]
            };
            
            await api.updateTask(estimateId, task.id, taskDto);
        } catch (error) {
            console.error('Failed to save task:', error);
        }
    }, [estimateId, task.id]);

    const debouncedSaveEstimate = useCallback((role: RoleKey, estimate: Estimate) => {
        if (saveEstimateTimeoutRef.current) {
            clearTimeout(saveEstimateTimeoutRef.current);
        }
        
        saveEstimateTimeoutRef.current = setTimeout(() => {
            saveEstimateToBackend(role, estimate);
        }, 500);
    }, [saveEstimateToBackend]);

    const debouncedSaveTask = useCallback((updatedTask: Task) => {
        if (saveTaskTimeoutRef.current) {
            clearTimeout(saveTaskTimeoutRef.current);
        }
        
        saveTaskTimeoutRef.current = setTimeout(() => {
            saveTaskToBackend(updatedTask);
        }, 1000);
    }, [saveTaskToBackend]);

    useEffect(() => {
        return () => {
            if (saveEstimateTimeoutRef.current) {
                clearTimeout(saveEstimateTimeoutRef.current);
            }
            if (saveTaskTimeoutRef.current) {
                clearTimeout(saveTaskTimeoutRef.current);
            }
        };
    }, []);

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
        
        // Автосохранение оценки в БД
        if (estimateId) {
            debouncedSaveEstimate(role, updatedTask.estimates[role]);
        }
    }, [task, onTaskChange, estimateId, debouncedSaveEstimate]);
    
    const handleTextChange = useCallback((field: 'stage' | 'name', value: string) => {
        const updatedTask = { ...task, [field]: value };
        onTaskChange(task.id, updatedTask);
        
        // Автосохранение задачи в БД
        if (estimateId) {
            debouncedSaveTask(updatedTask);
        }
    }, [task, onTaskChange, estimateId, debouncedSaveTask]);

    const handleRiskChange = useCallback((isRisk: boolean) => {
        const updatedTask = { ...task, isRisk };
        onTaskChange(task.id, updatedTask);
        
        // Автосохранение задачи в БД
        if (estimateId) {
            debouncedSaveTask(updatedTask);
        }
    }, [task, onTaskChange, estimateId, debouncedSaveTask]);

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
        const values = Object.values(pertValues) as number[];
        const base = values.reduce((sum: number, val: number) => sum + (val || 0), 0);

        // Новая логика: риски и общие считаются от базы,
        // а "Упр." считается от (База + Риски + Общие)
        const risk = base * (parameters.risks / 100);
        // Общие: (base + risk) * (general% / 100)
        const general = (base + risk) * (parameters.general / 100);
        const management = (base + risk + general) * (parameters.management / 100);

        const total = base + risk + general + management;
        
        return {
            baseEstimate: Math.round(base),
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
            <td className="px-3 py-2 sticky left-12 bg-card group-hover:bg-secondary/50 z-10 transition-colors align-top">
                <AutoResizeTextarea
                  value={task.stage}
                  onChange={(v) => handleTextChange('stage', v)}
                  onBlur={() => {
                    if (estimateId) {
                      const updatedTask = { ...task, stage: task.stage };
                      saveTaskToBackend(updatedTask);
                    }
                  }}
                  className="bg-transparent w-full focus:outline-none focus:bg-input p-1 rounded min-w-[138px]"
                />
            </td>
            <td className="px-3 py-2 sticky left-[210px] bg-card group-hover:bg-secondary/50 z-10 transition-colors align-top">
                <AutoResizeTextarea
                  value={task.name}
                  onChange={(v) => handleTextChange('name', v)}
                  onBlur={() => {
                    if (estimateId) {
                      const updatedTask = { ...task, name: task.name };
                      saveTaskToBackend(updatedTask);
                    }
                  }}
                  className="bg-transparent w-full focus:outline-none focus:bg-input p-1 rounded min-w-[188px]"
                />
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
                    <EstimateCell 
                        value={task.estimates[group.key].min} 
                        onChange={(e) => handleEstimateChange(group.key, 'min', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(group.key, task.estimates[group.key]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <EstimateCell 
                        value={task.estimates[group.key].real} 
                        onChange={(e) => handleEstimateChange(group.key, 'real', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(group.key, task.estimates[group.key]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <EstimateCell 
                        value={task.estimates[group.key].max} 
                        onChange={(e) => handleEstimateChange(group.key, 'max', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(group.key, task.estimates[group.key]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <td className="px-2 py-2 text-center font-bold text-primary bg-secondary/70 border-r border-l border-border">
                        {Math.round((pertValues[group.key] as number) || 0)}
                    </td>
                </React.Fragment>
              );
            })}

            <td className="px-2 py-2 text-center border-l border-border">{riskHours}</td>
            <td className="px-2 py-2 text-center">{generalHours}</td>
            <td className="px-2 py-2 text-center">{managementHours}</td>
            <td className="px-2 py-2 text-center font-bold bg-secondary/70">{totalHours}</td>
            <td className="px-2 py-2 text-center font-bold text-primary">{baseEstimate}</td>
        </tr>
    );
};
