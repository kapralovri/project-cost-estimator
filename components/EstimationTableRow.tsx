import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import type { Task, Estimate, ProjectParameters, RoleKey } from '../types';
import { TrashIcon } from './icons';
import { api } from '../api';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface EstimationTableRowProps {
  task: Task;
  parameters: ProjectParameters;
  estimateId?: number;
  enabledRoles: RoleKey[];
  onTaskChange: (id: number, updatedTask: Task) => void;
  onRemoveTask: (id: number) => void;
}

const pert = (e: Estimate) => (e.min + 4 * e.real + e.max) / 6;

const ROLE_ORDER: RoleKey[] = ['analysis','architect','frontDev','backDev','testing','devops','design','techWriter','adminTrack','stp'];

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

export const EstimationTableRow: React.FC<EstimationTableRowProps> = ({ task, parameters, estimateId, enabledRoles, onTaskChange, onRemoveTask }) => {
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
                    { role: 'architect', ...updatedTask.estimates.architect },
                    { role: 'frontDev', ...updatedTask.estimates.frontDev },
                    { role: 'backDev', ...updatedTask.estimates.backDev },
                    { role: 'testing', ...updatedTask.estimates.testing },
                    { role: 'devops', ...updatedTask.estimates.devops },
                    { role: 'design', ...updatedTask.estimates.design },
                    { role: 'techWriter', ...updatedTask.estimates.techWriter },
                    { role: 'adminTrack', ...updatedTask.estimates.adminTrack },
                    { role: 'stp', ...updatedTask.estimates.stp },
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
        const getValue = (estimate: Estimate) => task.isActual ? estimate.real : (task.isRisk ? estimate.max : pert(estimate));

        ROLE_ORDER.filter(r => enabledRoles.includes(r)).forEach(role => {
            if (role === 'testing') {
                if (isManualTesting) {
                    result.testing = getValue(task.estimates.testing);
                } else {
                    const backDev = getValue(task.estimates.backDev);
                    const frontDev = getValue(task.estimates.frontDev);
                    result.testing = (backDev + frontDev) * (parameters.testing / 100);
                }
            } else {
                result[role] = getValue(task.estimates[role]);
            }
        });
        return result;
    }, [task, parameters, isManualTesting, enabledRoles]);

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
            baseEstimate: Math.round(base + risk),
            riskHours: Math.round(risk),
            generalHours: Math.round(general),
            managementHours: Math.round(management),
            totalHours: Math.round(total)
        };
    }, [pertValues, parameters]);

    const stickyBgStyle = task.isActual ? { backgroundColor: '#ffedd5' } : undefined;
    const rowStyle = task.isActual ? { backgroundColor: '#ffedd5' } : undefined;

    return (
        <tr className="border-b border-border group" style={rowStyle}>
            <td className="px-3 py-2 sticky left-0 group-hover:bg-secondary/50 z-10 transition-colors" style={stickyBgStyle}>
                <button onClick={() => onRemoveTask(task.id)} className="text-muted-foreground hover:text-destructive">
                    <TrashIcon />
                </button>
            </td>
            <td className="px-3 py-2 sticky left-12 group-hover:bg-secondary/50 z-10 transition-colors align-top" style={stickyBgStyle}>
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
            <td className="px-3 py-2 sticky left-[210px] group-hover:bg-secondary/50 z-10 transition-colors align-top" style={stickyBgStyle}>
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
            <td className="px-3 py-2 sticky left-[410px] group-hover:bg-secondary/50 z-10 transition-colors text-center" style={stickyBgStyle}>
                <input
                  type="checkbox"
                  checked={task.isRisk}
                  onChange={(e) => handleRiskChange(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
            </td>
            <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={!!task.isActual}
                  onChange={(e) => {
                    const updated = { ...task, isActual: e.target.checked };
                    onTaskChange(task.id, updated);
                    debouncedSaveTask(updated);
                  }}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
            </td>

            {ROLE_ORDER.filter(r => enabledRoles.includes(r)).map(roleKey => {
              const isTesting = roleKey === 'testing';
              
              return (
                <React.Fragment key={roleKey}>
                    <EstimateCell 
                        value={task.estimates[roleKey].min} 
                        onChange={(e) => handleEstimateChange(roleKey, 'min', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(roleKey, task.estimates[roleKey]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <EstimateCell 
                        value={task.estimates[roleKey].real} 
                        onChange={(e) => handleEstimateChange(roleKey, 'real', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(roleKey, task.estimates[roleKey]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <EstimateCell 
                        value={task.estimates[roleKey].max} 
                        onChange={(e) => handleEstimateChange(roleKey, 'max', Math.max(0, Number(e.target.value) || 0))} 
                        onBlur={() => {
                            if (estimateId) {
                                saveEstimateToBackend(roleKey, task.estimates[roleKey]);
                            }
                        }}
                        isReadOnly={isTesting && !isManualTesting} 
                    />
                    <td className="px-2 py-2 text-center font-bold text-primary bg-secondary/70 border-r border-l border-border">
                        {task.isActual ? (
                          <input
                            type="number"
                            min={0}
                            value={task.estimates[roleKey].real}
                            onChange={(e) => handleEstimateChange(roleKey, 'real', Math.max(0, Number(e.target.value) || 0))}
                            onBlur={() => {
                              if (estimateId) {
                                saveEstimateToBackend(roleKey, task.estimates[roleKey]);
                              }
                            }}
                            className="w-16 text-center rounded p-1 border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        ) : (
                          Math.round((pertValues[roleKey] as number) || 0)
                        )}
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
