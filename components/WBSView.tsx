import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { Task, ProjectParameters, RoleKey, Estimate } from '../types';
import { TrashIcon, PlusIcon } from './icons';
import AutoResizeTextarea from './AutoResizeTextarea';
import { api } from '../api';

interface WBSViewProps {
  tasks: Task[];
  parameters: ProjectParameters;
  onTaskChange: (id: number, updatedTask: Task) => void;
  onRemoveTask: (id: number) => void;
  onAddTask: (stage?: string) => void;
  estimateId?: number;
}

const roles: { key: RoleKey; label: string }[] = [
  { key: 'analysis', label: 'Анализ' },
  { key: 'frontDev', label: 'Front Dev' },
  { key: 'backDev', label: 'Back Dev' },
  { key: 'testing', label: 'Тестирование' },
  { key: 'devops', label: 'Devops' },
  { key: 'design', label: 'Дизайн' },
  { key: 'techWriter', label: 'Тех.писатель' },
];

export const WBSView: React.FC<WBSViewProps> = ({ tasks, parameters, onTaskChange, onRemoveTask, onAddTask, estimateId }) => {
  const enabledMapRef = useRef<Record<number, Partial<Record<RoleKey, boolean>>>>({});
  const saveEstimateTimeouts = useRef<Record<string, any>>({});
  const saveTaskTimeouts = useRef<Record<number, any>>({});
  const [collapsedRoles, setCollapsedRoles] = useState(false);
  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.forEach(t => {
      const key = t.stage || '';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(t);
    });
    return Array.from(m.entries());
  }, [tasks]);

  const updateStageNameForGroup = useCallback((oldStage: string, newStage: string) => {
    tasks.filter(t => t.stage === oldStage).forEach(t => {
      const updated = { ...t, stage: newStage };
      onTaskChange(t.id, updated);
      // debounce save
      if (estimateId && t.id) {
        if (saveTaskTimeouts.current[t.id]) clearTimeout(saveTaskTimeouts.current[t.id]);
        saveTaskTimeouts.current[t.id] = setTimeout(async () => {
          try {
            const dto = {
              taskName: updated.name,
              stageName: updated.stage,
              category: updated.stage,
              complexity: updated.isRisk ? 'high' : 'medium',
              estimatedHours: 0,
              status: 'planned',
              priority: 'medium',
              sortOrder: 0,
              estimates: [
                { role: 'analysis', ...updated.estimates.analysis },
                { role: 'frontDev', ...updated.estimates.frontDev },
                { role: 'backDev', ...updated.estimates.backDev },
                { role: 'testing', ...updated.estimates.testing },
                { role: 'devops', ...updated.estimates.devops },
                { role: 'design', ...updated.estimates.design },
                { role: 'techWriter', ...updated.estimates.techWriter },
              ]
            };
            await api.updateTask(estimateId, t.id, dto);
          } catch (e) {
            console.error('Failed to save task stage:', e);
          }
        }, 800);
      }
    });
  }, [tasks, onTaskChange, estimateId]);

  const toggleRole = useCallback((task: Task, role: RoleKey, checked: boolean) => {
    // Track enabled state locally so inputs appear immediately
    const map = enabledMapRef.current[task.id] || {};
    map[role] = checked;
    enabledMapRef.current[task.id] = map;
    if (!checked) {
      const next: Estimate = { min: 0, real: 0, max: 0 };
      const updated = {
        ...task,
        estimates: {
          ...task.estimates,
          [role]: next,
        },
      };
      onTaskChange(task.id, updated);
      if (estimateId) {
        const key = `${task.id}-${role}`;
        if (saveEstimateTimeouts.current[key]) clearTimeout(saveEstimateTimeouts.current[key]);
        saveEstimateTimeouts.current[key] = setTimeout(async () => {
          try {
            await api.updateTaskEstimate(estimateId, task.id, role, { role, ...next });
          } catch (e) {
            console.error('Failed to save estimate:', e);
          }
        }, 500);
      }
    }
  }, [onTaskChange, estimateId]);

  const handleEstimateChange = useCallback((task: Task, role: RoleKey, field: keyof Estimate, value: number) => {
    const updated: Task = {
      ...task,
      estimates: {
        ...task.estimates,
        [role]: { ...task.estimates[role], [field]: Math.max(0, value || 0) },
      }
    };
    onTaskChange(task.id, updated);
    if (estimateId) {
      const key = `${task.id}-${role}`;
      if (saveEstimateTimeouts.current[key]) clearTimeout(saveEstimateTimeouts.current[key]);
      const payload = updated.estimates[role];
      saveEstimateTimeouts.current[key] = setTimeout(async () => {
        try {
          await api.updateTaskEstimate(estimateId, task.id, role, { role, ...payload });
        } catch (e) {
          console.error('Failed to save estimate:', e);
        }
      }, 500);
    }
  }, [onTaskChange, estimateId]);

  const isRoleEnabled = (task: Task, role: RoleKey) => {
    const local = enabledMapRef.current[task.id]?.[role];
    if (typeof local === 'boolean') return local;
    const e = task.estimates[role];
    return (e.min || 0) > 0 || (e.real || 0) > 0 || (e.max || 0) > 0;
  };

  const pert = (e: Estimate) => (e.min + 4 * e.real + e.max) / 6;
  const computeBO = (task: Task) => {
    const get = (role: RoleKey) => (task.isRisk ? task.estimates[role].max : pert(task.estimates[role])) || 0;
    const front = get('frontDev');
    const back = get('backDev');
    const testing = parameters.isManualTesting ? get('testing') : (front + back) * (parameters.testing / 100);
    const base = get('analysis') + front + back + get('devops') + get('design') + get('techWriter') + testing;
    const risk = base * (parameters.risks / 100);
    const bo = Math.round(base + risk);
    return bo;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => onAddTask()}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <PlusIcon />
          <span>Добавить этап</span>
        </button>
        <button
          onClick={() => setCollapsedRoles(c => !c)}
          className="px-3 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {collapsedRoles ? 'Развернуть роли' : 'Свернуть роли'}
        </button>
      </div>

      {groups.map(([stageName, items]) => (
        <div key={stageName} className="border border-border rounded-lg">
          <div className="flex items-center justify-between bg-secondary/50 px-4 py-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Этап, Модуль:</span>
              <input
                type="text"
                defaultValue={stageName}
                onBlur={(e) => {
                  const val = e.target.value.trim() || 'Этап';
                  if (val !== stageName) updateStageNameForGroup(stageName, val);
                }}
                className="bg-input text-foreground rounded p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onAddTask(stageName)}
                className="flex items-center space-x-2 px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                <PlusIcon />
                <span>Добавить требование</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {items.map(task => (
              <div key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <label className="text-sm text-muted-foreground">Функциональное требование</label>
                    <AutoResizeTextarea
                      value={task.name}
                      onChange={(v) => {
                        const updated = { ...task, name: v };
                        onTaskChange(task.id, updated);
                        if (estimateId && task.id) {
                          if (saveTaskTimeouts.current[task.id]) clearTimeout(saveTaskTimeouts.current[task.id]);
                          saveTaskTimeouts.current[task.id] = setTimeout(async () => {
                            try {
                              const dto = {
                                taskName: updated.name,
                                stageName: updated.stage,
                                category: updated.stage,
                                complexity: updated.isRisk ? 'high' : 'medium',
                                estimatedHours: 0,
                                status: 'planned',
                                priority: 'medium',
                                sortOrder: 0,
                                estimates: [
                                  { role: 'analysis', ...updated.estimates.analysis },
                                  { role: 'frontDev', ...updated.estimates.frontDev },
                                  { role: 'backDev', ...updated.estimates.backDev },
                                  { role: 'testing', ...updated.estimates.testing },
                                  { role: 'devops', ...updated.estimates.devops },
                                  { role: 'design', ...updated.estimates.design },
                                  { role: 'techWriter', ...updated.estimates.techWriter },
                                ]
                              };
                              await api.updateTask(estimateId, task.id, dto);
                            } catch (e) {
                              console.error('Failed to save task name:', e);
                            }
                          }, 800);
                        }
                      }}
                      className="w-full bg-input text-foreground rounded p-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">БО: {computeBO(task)}</div>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={task.isRisk}
                        onChange={(e) => {
                          const updated = { ...task, isRisk: e.target.checked };
                          onTaskChange(task.id, updated);
                          if (estimateId && task.id) {
                            if (saveTaskTimeouts.current[task.id]) clearTimeout(saveTaskTimeouts.current[task.id]);
                            saveTaskTimeouts.current[task.id] = setTimeout(async () => {
                              try {
                                const dto = {
                                  taskName: updated.name,
                                  stageName: updated.stage,
                                  category: updated.stage,
                                  complexity: updated.isRisk ? 'high' : 'medium',
                                  estimatedHours: 0,
                                  status: 'planned',
                                  priority: 'medium',
                                  sortOrder: 0,
                                  estimates: [
                                    { role: 'analysis', ...updated.estimates.analysis },
                                    { role: 'frontDev', ...updated.estimates.frontDev },
                                    { role: 'backDev', ...updated.estimates.backDev },
                                    { role: 'testing', ...updated.estimates.testing },
                                    { role: 'devops', ...updated.estimates.devops },
                                    { role: 'design', ...updated.estimates.design },
                                    { role: 'techWriter', ...updated.estimates.techWriter },
                                  ]
                                };
                                await api.updateTask(estimateId, task.id, dto);
                              } catch (e) {
                                console.error('Failed to save task risk flag:', e);
                              }
                            }, 800);
                          }
                        }}
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Риск</span>
                    </label>
                    <button onClick={() => onRemoveTask(task.id)} className="text-muted-foreground hover:text-destructive" title="Удалить">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {!collapsedRoles && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roles.map(r => {
                    const enabled = isRoleEnabled(task, r.key);
                    const isTesting = r.key === 'testing';
                    const testingAuto = isTesting && !parameters.isManualTesting;
                    return (
                      <div key={r.key} className="border border-border rounded p-3">
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={enabled || testingAuto}
                              disabled={testingAuto}
                              onChange={(e) => toggleRole(task, r.key, e.target.checked)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{r.label}{testingAuto ? ' (авто)' : ''}</span>
                          </label>
                        </div>
                        {!testingAuto && (enabled) && (
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Мин</div>
                              <input type="number" min={0} value={task.estimates[r.key].min}
                                onChange={(e) => handleEstimateChange(task, r.key, 'min', Number(e.target.value))}
                                className="w-full bg-input text-foreground rounded p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Реал</div>
                              <input type="number" min={0} value={task.estimates[r.key].real}
                                onChange={(e) => handleEstimateChange(task, r.key, 'real', Number(e.target.value))}
                                className="w-full bg-input text-foreground rounded p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Макс</div>
                              <input type="number" min={0} value={task.estimates[r.key].max}
                                onChange={(e) => handleEstimateChange(task, r.key, 'max', Number(e.target.value))}
                                className="w-full bg-input text-foreground rounded p-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                          </div>
                        )}
                        {testingAuto && (
                          <div className="mt-2 text-xs text-muted-foreground">Значение рассчитывается от Front/Back Dev</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WBSView;
