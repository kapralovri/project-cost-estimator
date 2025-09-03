import React, { useState, useMemo, useCallback } from 'react';
import { Header } from '../components/Header';
import { ProjectInfo } from '../components/ProjectInfo';
import { SummaryDashboard } from '../components/SummaryDashboard';
import { EstimationTable } from '../components/EstimationTable';
import type { Task, ProjectParameters, Role, RoleKey, EstimateProject, Estimate } from '../types';
import { api } from '../api';

interface EstimatorPageProps {
    project: EstimateProject;
    onSave: (projectId: string, updatedData: { tasks: Task[], parameters: ProjectParameters, totalHours: number }) => void;
    onBack: () => void;
}

export const EstimatorPage: React.FC<EstimatorPageProps> = ({ project, onSave, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [parameters, setParameters] = useState<ProjectParameters>(project.parameters);
  const [isTableFullscreen, setTableFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTaskChange = useCallback((id: number, updatedTask: Task) => {
    setTasks(currentTasks => currentTasks.map(task => task.id === id ? updatedTask : task));
  }, []);

  const handleAddTask = useCallback(async () => {
    // Автосохранение новой задачи в БД
    if (project.backendId) {
      try {
        const taskDto = {
          taskName: 'Новая задача',
          stageName: 'Новый этап',
          category: 'Новый этап',
          complexity: 'medium',
          estimatedHours: 0,
          status: 'planned',
          priority: 'medium',
          sortOrder: tasks.length,
          estimates: [
            { role: 'analysis', min: 0, real: 0, max: 0 },
            { role: 'frontDev', min: 0, real: 0, max: 0 },
            { role: 'backDev', min: 0, real: 0, max: 0 },
            { role: 'testing', min: 0, real: 0, max: 0 },
            { role: 'devops', min: 0, real: 0, max: 0 },
            { role: 'design', min: 0, real: 0, max: 0 },
            { role: 'techWriter', min: 0, real: 0, max: 0 },
          ]
        };
        
        const savedTask = await api.addTask(project.backendId, taskDto);
        
        if (!savedTask.id) {
          console.error('Backend returned task without ID');
          return;
        }
        
        // Создаем задачу с ID из backend
        const newTask: Task = {
          id: savedTask.id, // ID из backend
          name: savedTask.taskName,
          stage: savedTask.stageName || savedTask.category || 'Новый этап',
          isRisk: savedTask.complexity === 'high',
          estimates: {
            analysis: { min: 0, real: 0, max: 0 },
            frontDev: { min: 0, real: 0, max: 0 },
            backDev: { min: 0, real: 0, max: 0 },
            testing: { min: 0, real: 0, max: 0 },
            devops: { min: 0, real: 0, max: 0 },
            design: { min: 0, real: 0, max: 0 },
            techWriter: { min: 0, real: 0, max: 0 },
          }
        };
        
        setTasks(currentTasks => [...currentTasks, newTask]);
      } catch (error) {
        console.error('Failed to save new task:', error);
      }
    } else {
      // Если нет backendId, создаем временную задачу
      const newTask: Task = {
        id: Date.now(),
        name: 'Новая задача',
        stage: 'Новый этап',
        isRisk: false,
        estimates: {
          analysis: { min: 0, real: 0, max: 0 },
          frontDev: { min: 0, real: 0, max: 0 },
          backDev: { min: 0, real: 0, max: 0 },
          testing: { min: 0, real: 0, max: 0 },
          devops: { min: 0, real: 0, max: 0 },
          design: { min: 0, real: 0, max: 0 },
          techWriter: { min: 0, real: 0, max: 0 },
        }
      };
      setTasks(currentTasks => [...currentTasks, newTask]);
    }
  }, [tasks.length, project.backendId]);

  const handleRemoveTask = useCallback(async (id: number) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
    
    // Автоудаление из БД
    if (project.backendId) {
      try {
        await api.removeTask(project.backendId, id);
      } catch (error) {
        console.error('Failed to remove task:', error);
      }
    }
  }, [project.backendId]);

  const handleImportTasks = useCallback((importedTasks: Task[]) => {
    if (window.confirm(`Вы уверены, что хотите импортировать ${importedTasks.length} задач? Это действие заменит все существующие задачи в этой оценке.`)) {
        setTasks(importedTasks);
    }
  }, []);
  
  const toggleFullscreen = useCallback(() => {
    setTableFullscreen(prev => !prev);
  }, []);

  const roleAnalyticsData = useMemo(() => {
    const roles: Role[] = [
      { key: 'developers', name: 'Разработчики' },
      { key: 'qa', name: 'QA' },
      { key: 'analysis', name: 'Аналитики' },
      { key: 'devops', name: 'Devops' },
      { key: 'techWriter', name: 'Тех.писатели' },
      { key: 'design', name: 'Дизайнеры' },
      { key: 'pm', name: 'РП и Администратор' },
    ];

    const isManualTesting = !!parameters.isManualTesting;
    const pert = (e: Estimate) => (e.min + 4 * e.real + e.max) / 6;
    const getTaskHours = (task: Task, estimate: Estimate) => (task.isRisk ? estimate.max : pert(estimate));

    // 1) База по ролям (без PM)
    const baseByRole: Record<string, number> = {
      developers: 0, qa: 0, analysis: 0, devops: 0, techWriter: 0, design: 0,
    };

    tasks.forEach(task => {
      const frontDev = getTaskHours(task, task.estimates.frontDev);
      const backDev = getTaskHours(task, task.estimates.backDev);
      baseByRole.analysis += getTaskHours(task, task.estimates.analysis);
      baseByRole.developers += frontDev + backDev;
      baseByRole.devops += getTaskHours(task, task.estimates.devops);
      baseByRole.design += getTaskHours(task, task.estimates.design);
      baseByRole.techWriter += getTaskHours(task, task.estimates.techWriter);
      baseByRole.qa += isManualTesting
        ? getTaskHours(task, task.estimates.testing)
        : (frontDev + backDev) * (parameters.testing / 100);
    });

    const base = Object.values(baseByRole).reduce((s, v) => s + v, 0);
    const risk = base * (parameters.risks / 100);
    const general = (base + risk) * (parameters.general / 100);
    const management = (base + risk + general) * (parameters.management / 100);

    // 2) Распределение рисков и общих
    const roleRiskShares: Record<string, number> = {};
    const roleGeneralShares: Record<string, number> = {};
    const safeBase = base > 0 ? base : 1; // защита от деления на 0
    const safeBasePlusRisk = (base + risk) > 0 ? (base + risk) : 1;

    Object.keys(baseByRole).forEach(key => {
      const roleBase = baseByRole[key] || 0;
      const riskShare = (roleBase / safeBase) * risk;
      roleRiskShares[key] = riskShare;
      const generalShare = ((roleBase + riskShare) / safeBasePlusRisk) * general;
      roleGeneralShares[key] = generalShare;
    });

    // 3) Собираем аналитику по ролям
    const analyticsRaw = roles.map(role => {
      if (role.key === 'pm') {
        const total = management;
        return {
          name: role.name,
          specialtyHours: Math.round(management),
          riskHours: 0,
          generalHours: 0,
          totalHours: Math.round(total),
          distribution: 0, // вычислим позже
          fte: total / 168,
        };
      }

      const spec = baseByRole[role.key] || 0;
      const r = roleRiskShares[role.key] || 0;
      const g = roleGeneralShares[role.key] || 0;
      const total = spec + r + g;
      return {
        name: role.name,
        specialtyHours: Math.round(spec),
        riskHours: Math.round(r),
        generalHours: Math.round(g),
        totalHours: Math.round(total),
        distribution: 0, // позже
        fte: total / 168,
      };
    });

    // 4) Балансировка округления по total
    const targetTotal = Math.round(base + risk + general + management);
    const currentSum = analyticsRaw.reduce((s, r) => s + r.totalHours, 0);
    const delta = targetTotal - currentSum;
    if (delta !== 0) {
      const pmIdx = analyticsRaw.findIndex(r => r.name === 'РП и Администратор');
      if (pmIdx >= 0) {
        analyticsRaw[pmIdx] = {
          ...analyticsRaw[pmIdx],
          totalHours: analyticsRaw[pmIdx].totalHours + delta,
          specialtyHours: analyticsRaw[pmIdx].specialtyHours + delta,
        };
      }
    }

    const totalCalculatedHours = analyticsRaw.reduce((s, r) => s + r.totalHours, 0);

    // 5) Финальные проценты распределения
    const analytics = analyticsRaw.map(r => ({
      ...r,
      distribution: totalCalculatedHours > 0 ? (r.totalHours / totalCalculatedHours) * 100 : 0,
    }));

    // 6) Сводки по накладным (для отображения), согласованные с формулой
    const vacationHours = base * (parameters.vacation / 100);
    const sickLeaveHours = base * (parameters.sick_leave / 100);
    const meetingsHours = base * (parameters.meetings / 100);
    const onboardingHours = base * (parameters.onboarding / 100);

    return {
      analytics,
      totalHours: totalCalculatedHours,
      totalFTE: totalCalculatedHours / 168,
      overheadTotals: {
        risks: Math.round(risk),
        management: Math.round(management),
        general: Math.round(general),
        vacation: Math.round(vacationHours),
        sick_leave: Math.round(sickLeaveHours),
        meetings: Math.round(meetingsHours),
        onboarding: Math.round(onboardingHours),
      }
    };

  }, [tasks, parameters]);

  // Сумма "Итого" из раздела "Оценка проекта" по всем задачам
  const tableTotalHours = useMemo(() => {
    const pert = (e: Estimate) => (e.min + 4 * e.real + e.max) / 6;
    const getRoleHours = (task: Task, role: RoleKey) => task.isRisk ? task.estimates[role].max : pert(task.estimates[role]);

    return Math.round(tasks.reduce((sum, task) => {
      const isManualTesting = !!parameters.isManualTesting;
      const analysis = getRoleHours(task, 'analysis');
      const frontDev = getRoleHours(task, 'frontDev');
      const backDev = getRoleHours(task, 'backDev');
      const devops = getRoleHours(task, 'devops');
      const design = getRoleHours(task, 'design');
      const techWriter = getRoleHours(task, 'techWriter');
      const testing = isManualTesting
        ? getRoleHours(task, 'testing')
        : (frontDev + backDev) * (parameters.testing / 100);

      const base = analysis + frontDev + backDev + devops + design + techWriter + testing;
      const risk = base * (parameters.risks / 100);
      const general = (base + risk) * (parameters.general / 100);
      const management = (base + risk + general) * (parameters.management / 100);
      const total = base + risk + general + management;
      return sum + total;
    }, 0));
  }, [tasks, parameters]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(project.id, {
        tasks,
        parameters,
        totalHours: tableTotalHours
      });
      setIsSaving(false);
    }, 1000);
  }, [project.id, tasks, parameters, onSave, tableTotalHours]);

  if (isTableFullscreen) {
    return (
        <div className="fixed inset-0 bg-background z-50 p-4 sm:p-6 lg:p-8 flex flex-col">
            <EstimationTable
                tasks={tasks}
                onTaskChange={handleTaskChange}
                onAddTask={handleAddTask}
                onRemoveTask={handleRemoveTask}
                onImportTasks={handleImportTasks}
                parameters={parameters}
                estimateId={project.backendId}
                isFullscreen={isTableFullscreen}
                toggleFullscreen={toggleFullscreen}
            />
        </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        view="estimator"
        projectName={project.name}
        onBack={onBack}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <main className="mt-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProjectInfo 
              projectName={project.name}
              qualityLevel={project.qualityLevel}
              parameters={parameters}
              setParameters={setParameters}
              totalHours={tableTotalHours}
              totalFTE={roleAnalyticsData.totalFTE}
              overheadTotals={roleAnalyticsData.overheadTotals}
            />
          </div>
          <div className="lg:col-span-2">
            <SummaryDashboard data={roleAnalyticsData.analytics} />
          </div>
        </div>
        <div>
          <EstimationTable
            tasks={tasks}
            onTaskChange={handleTaskChange}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTask}
            onImportTasks={handleImportTasks}
            parameters={parameters}
            estimateId={project.backendId}
            isFullscreen={isTableFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      </main>
    </div>
  );
};
