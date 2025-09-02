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
    const getTaskHours = (task: Task, estimate: Estimate) => task.isRisk ? estimate.max : pert(estimate);
    
    const specialtyHoursByRole: Record<string, number> = {
        developers: 0, qa: 0, analysis: 0, devops: 0, techWriter: 0, design: 0, pm: 0,
    };

    tasks.forEach(task => {
        const frontDevHours = getTaskHours(task, task.estimates.frontDev);
        const backDevHours = getTaskHours(task, task.estimates.backDev);

        specialtyHoursByRole.analysis += getTaskHours(task, task.estimates.analysis);
        specialtyHoursByRole.developers += frontDevHours + backDevHours;
        specialtyHoursByRole.devops += getTaskHours(task, task.estimates.devops);
        specialtyHoursByRole.design += getTaskHours(task, task.estimates.design);
        specialtyHoursByRole.techWriter += getTaskHours(task, task.estimates.techWriter);
        
        if (isManualTesting) {
            specialtyHoursByRole.qa += getTaskHours(task, task.estimates.testing);
        } else {
            specialtyHoursByRole.qa += (frontDevHours + backDevHours) * (parameters.testing / 100);
        }
    });
    
    const totalSpecialtyHours = Object.values(specialtyHoursByRole).reduce((sum, h) => sum + h, 0);
    const totalManagementHours = totalSpecialtyHours * (parameters.management / 100);
    specialtyHoursByRole.pm = totalManagementHours;
    
    const totalHoursBeforeOverheads = totalSpecialtyHours + totalManagementHours;
    
    const riskHours = totalHoursBeforeOverheads * (parameters.risks / 100);
    const generalExpensesHours = totalHoursBeforeOverheads * (parameters.general / 100);
    const vacationHours = totalHoursBeforeOverheads * (parameters.vacation / 100);
    const sickLeaveHours = totalHoursBeforeOverheads * (parameters.sick_leave / 100);
    const meetingsHours = totalHoursBeforeOverheads * (parameters.meetings / 100);
    const onboardingHours = totalHoursBeforeOverheads * (parameters.onboarding / 100);

    const totalHours = totalHoursBeforeOverheads + riskHours + generalExpensesHours;

    const analytics = roles.map(role => {
        const specialtyHours = specialtyHoursByRole[role.key] || 0;
        const roleProportion = totalHoursBeforeOverheads > 0 ? specialtyHours / totalHoursBeforeOverheads : 0;
        const roleRiskHours = riskHours * roleProportion;
        const roleGeneralHours = generalExpensesHours * roleProportion;
        const roleTotalHours = specialtyHours + roleRiskHours + roleGeneralHours;

        return {
            name: role.name,
            specialtyHours: Math.round(specialtyHours),
            riskHours: Math.round(roleRiskHours),
            generalHours: Math.round(roleGeneralHours),
            totalHours: Math.round(roleTotalHours),
            distribution: totalHours > 0 ? (roleTotalHours / totalHours) * 100 : 0,
            fte: roleTotalHours / 168,
        };
    });

    const totalCalculatedHours = analytics.reduce((sum, r) => sum + r.totalHours, 0);
    
    return {
      analytics,
      totalHours: Math.round(totalCalculatedHours),
      totalFTE: totalCalculatedHours / 168,
      overheadTotals: {
          risks: Math.round(riskHours),
          management: Math.round(totalManagementHours),
          general: Math.round(generalExpensesHours),
          vacation: Math.round(vacationHours),
          sick_leave: Math.round(sickLeaveHours),
          meetings: Math.round(meetingsHours),
          onboarding: Math.round(onboardingHours),
      }
    };

  }, [tasks, parameters]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(project.id, {
        tasks,
        parameters,
        totalHours: roleAnalyticsData.totalHours
      });
      setIsSaving(false);
    }, 1000);
  }, [project.id, tasks, parameters, onSave, roleAnalyticsData.totalHours]);

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
              totalHours={roleAnalyticsData.totalHours}
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