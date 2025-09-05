import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RegistryPage } from './pages/RegistryPage';
import { EstimatorPage } from './pages/EstimatorPage';
import { CreateEstimateModal } from './components/CreateEstimateModal';
import type { EstimateProject, QualityLevel, Task, ProjectParameters, Estimate, ApiEstimate, ApiParameter, ApiTask, RoleKey } from './types';
import { QUALITY_LEVELS, DEFAULT_PROJECT_PARAMETERS } from './constants';
import { api, BackendEstimateDto, BackendParameterDto, BackendTaskDto, BackendTaskEstimateDto } from './api';

const App: React.FC = () => {
    const [projects, setProjects] = useState<EstimateProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = useCallback(async () => {
        try {
            setIsLoading(true);
            const list = await api.listEstimates();
            const mapped: EstimateProject[] = list.map(e => {
                let parameters: ProjectParameters;
                let tasks: Task[];
                let qualityLevel: QualityLevel = 'standard';

                // Преобразуем параметры из API в локальный формат
                if (e.parameters && e.parameters.length > 0) {
                    const paramMap = new Map(e.parameters.map(p => [p.name, p.value]));
                    parameters = {
                        risks: parseFloat(paramMap.get('risks') || '0'),
                        risksComment: paramMap.get('risksComment') || '',
                        management: parseFloat(paramMap.get('management') || '0'),
                        managementComment: paramMap.get('managementComment') || '',
                        testing: parseFloat(paramMap.get('testing') || '0'),
                        testingComment: paramMap.get('testingComment') || '',
                        isManualTesting: paramMap.get('isManualTesting') === 'true',
                        general: parseFloat(paramMap.get('general') || '0'),
                        generalComment: paramMap.get('generalComment') || '',
                        vacation: parseFloat(paramMap.get('vacation') || '0'),
                        sick_leave: parseFloat(paramMap.get('sick_leave') || '0'),
                        meetings: parseFloat(paramMap.get('meetings') || '0'),
                        onboarding: parseFloat(paramMap.get('onboarding') || '0'),
                    };
                } else {
                    parameters = {
                        ...DEFAULT_PROJECT_PARAMETERS,
                        general: DEFAULT_PROJECT_PARAMETERS.vacation + DEFAULT_PROJECT_PARAMETERS.sick_leave + DEFAULT_PROJECT_PARAMETERS.meetings + DEFAULT_PROJECT_PARAMETERS.onboarding,
                        testingComment: '',
                        risksComment: '',
                        managementComment: '',
                        generalComment: '',
                        isManualTesting: false,
                    };
                }

                // Преобразуем задачи из API в локальный формат
                if (e.tasks && e.tasks.length > 0) {
                    tasks = e.tasks.map(task => {
                        // Восстанавливаем оценки из API
                        const estimates = {
                            analysis: { min: 0, real: 0, max: 0 },
                            frontDev: { min: 0, real: 0, max: 0 },
                            backDev: { min: 0, real: 0, max: 0 },
                            testing: { min: 0, real: 0, max: 0 },
                            devops: { min: 0, real: 0, max: 0 },
                            design: { min: 0, real: 0, max: 0 },
                            techWriter: { min: 0, real: 0, max: 0 },
                        };

                        // Если есть оценки в API, восстанавливаем их
                        if (task.estimates && task.estimates.length > 0) {
                            task.estimates.forEach(estimate => {
                                if (estimate.role in estimates) {
                                    estimates[estimate.role as keyof typeof estimates] = {
                                        min: estimate.min,
                                        real: estimate.real,
                                        max: estimate.max,
                                    };
                                }
                            });
                        }

                        return {
                            id: task.id || Date.now(),
                            stage: task.stageName || task.category || 'development',
                            name: task.taskName,
                            isRisk: task.complexity === 'high',
                            estimates,
                        };
                    });
                } else {
                    tasks = [];
                }

                if (e.qualityLevel && ['low', 'basic', 'standard', 'high'].includes(e.qualityLevel)) {
                    qualityLevel = e.qualityLevel as QualityLevel;
                }

                return {
                    backendId: e.id,
                    id: `proj-${e.id}`,
                    name: e.projectName,
                    createdAt: new Date().toISOString(),
                    status: e.status as 'Актуальный' | 'Не актуальный' || 'Актуальный',
                    qualityLevel,
                    parameters,
                    tasks,
                };
            });
            setProjects(mapped);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleCreateNew = useCallback(() => {
        setCreateModalOpen(true);
    }, []);

    const handleCreateProject = useCallback(async (name: string, qualityLevel: QualityLevel) => {
        try {
            const baseParams = DEFAULT_PROJECT_PARAMETERS;
            const general = baseParams.vacation + baseParams.sick_leave + baseParams.meetings + baseParams.onboarding;
            
            const parameters: ProjectParameters = {
                ...baseParams,
                testing: QUALITY_LEVELS[qualityLevel].parameters.testing,
                general, 
                testingComment: '',
                risksComment: '',
                managementComment: '',
                generalComment: '',
                isManualTesting: false,
            };

            // Создаем параметры для API
            const apiParameters: BackendParameterDto[] = [
                { name: 'risks', value: parameters.risks.toString(), type: 'number' },
                { name: 'risksComment', value: parameters.risksComment || '', type: 'string' },
                { name: 'management', value: parameters.management.toString(), type: 'number' },
                { name: 'managementComment', value: parameters.managementComment || '', type: 'string' },
                { name: 'testing', value: parameters.testing.toString(), type: 'number' },
                { name: 'testingComment', value: parameters.testingComment || '', type: 'string' },
                { name: 'isManualTesting', value: parameters.isManualTesting?.toString() || 'false', type: 'boolean' },
                { name: 'general', value: parameters.general.toString(), type: 'number' },
                { name: 'generalComment', value: parameters.generalComment || '', type: 'string' },
                { name: 'vacation', value: parameters.vacation.toString(), type: 'number' },
                { name: 'sick_leave', value: parameters.sick_leave.toString(), type: 'number' },
                { name: 'meetings', value: parameters.meetings.toString(), type: 'number' },
                { name: 'onboarding', value: parameters.onboarding.toString(), type: 'number' },
            ];

            const dto: BackendEstimateDto = {
                projectName: name,
                client: '',
                currency: 'USD',
                totalCost: 0,
                qualityLevel,
                status: 'Актуальный',
                parameters: apiParameters,
                tasks: [],
                items: [],
            };

            const created = await api.createEstimate(dto);
            
            const newProject: EstimateProject = {
                backendId: created.id,
                id: `proj-${created.id ?? Date.now()}`,
                name: created.projectName,
                createdAt: new Date().toISOString(),
                status: 'Актуальный',
                qualityLevel,
                parameters,
                tasks: [],
            };
            
            setProjects(prev => [...prev, newProject]);
            setSelectedProjectId(newProject.id);
            setCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    }, []);

    const handleSelectProject = useCallback((id: string) => {
        setSelectedProjectId(id);
    }, []);

    const handleBackToRegistry = useCallback(() => {
        setSelectedProjectId(null);
    }, []);

    const handleDeleteProject = useCallback(async (id: string) => {
        try {
            const project = projects.find(p => p.id === id);
            if (project?.backendId) {
                await api.deleteEstimate(project.backendId);
            }
            setProjects(prev => prev.filter(p => p.id !== id));
            if (selectedProjectId === id) setSelectedProjectId(null);
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    }, [projects, selectedProjectId]);

    const handleSaveProject = useCallback(async (
        projectId: string, 
        updatedData: { tasks: Task[], parameters: ProjectParameters, totalHours: number }
    ) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (!project?.backendId) return;

            // Update local state immediately for better UX
            setProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    return { ...p, tasks: updatedData.tasks, parameters: updatedData.parameters };
                }
                return p;
            }));

            // Создаем параметры для API
            const apiParameters: BackendParameterDto[] = [
                { name: 'risks', value: updatedData.parameters.risks.toString(), type: 'number' },
                { name: 'risksComment', value: updatedData.parameters.risksComment || '', type: 'string' },
                { name: 'management', value: updatedData.parameters.management.toString(), type: 'number' },
                { name: 'managementComment', value: updatedData.parameters.managementComment || '', type: 'string' },
                { name: 'testing', value: updatedData.parameters.testing.toString(), type: 'number' },
                { name: 'testingComment', value: updatedData.parameters.testingComment || '', type: 'string' },
                { name: 'isManualTesting', value: updatedData.parameters.isManualTesting?.toString() || 'false', type: 'boolean' },
                { name: 'general', value: updatedData.parameters.general.toString(), type: 'number' },
                { name: 'generalComment', value: updatedData.parameters.generalComment || '', type: 'string' },
                { name: 'vacation', value: updatedData.parameters.vacation.toString(), type: 'number' },
                { name: 'sick_leave', value: updatedData.parameters.sick_leave.toString(), type: 'number' },
                { name: 'meetings', value: updatedData.parameters.meetings.toString(), type: 'number' },
                { name: 'onboarding', value: updatedData.parameters.onboarding.toString(), type: 'number' },
            ];

            // Создаем задачи для API
            const apiTasks: BackendTaskDto[] = updatedData.tasks.map((task, index) => {
                // Преобразуем оценки задач в формат API
                const estimates: BackendTaskEstimateDto[] = [
                    { role: 'analysis', ...task.estimates.analysis },
                    { role: 'frontDev', ...task.estimates.frontDev },
                    { role: 'backDev', ...task.estimates.backDev },
                    { role: 'testing', ...task.estimates.testing },
                    { role: 'devops', ...task.estimates.devops },
                    { role: 'design', ...task.estimates.design },
                    { role: 'techWriter', ...task.estimates.techWriter },
                ];

                return {
                    taskName: task.name,
                    stageName: task.stage,
                    category: task.stage,
                    complexity: task.isRisk ? 'high' : 'medium',
                    estimatedHours: 0, // Пока не используем
                    status: 'planned',
                    priority: 'medium',
                    sortOrder: index,
                    estimates,
                };
            });

            // Send update to backend
            const dto: BackendEstimateDto = {
                projectName: project.name,
                client: '',
                currency: 'USD',
                totalCost: updatedData.totalHours,
                qualityLevel: project.qualityLevel,
                status: project.status,
                parameters: apiParameters,
                tasks: apiTasks,
                items: [],
            };

            await api.updateEstimate(project.backendId, dto);
        } catch (error) {
            console.error('Failed to save project:', error);
            // Reload projects to ensure consistency
            loadProjects();
        }
    }, [projects, loadProjects]);
    
    const pert = useCallback((e: Estimate) => (e.min + 4 * e.real + e.max) / 6, []);

    const projectsWithTotals = useMemo(() => {
        return projects.map(p => {
            const isManualTesting = !!p.parameters.isManualTesting;
            const totalHours = p.tasks.reduce((sum, task) => {
                const getRoleHours = (role: RoleKey) => task.isRisk ? task.estimates[role].max : pert(task.estimates[role]);
                const analysis = getRoleHours('analysis');
                const frontDev = getRoleHours('frontDev');
                const backDev = getRoleHours('backDev');
                const devops = getRoleHours('devops');
                const design = getRoleHours('design');
                const techWriter = getRoleHours('techWriter');
                const testing = isManualTesting ? getRoleHours('testing') : (frontDev + backDev) * (p.parameters.testing / 100);

                const base = analysis + frontDev + backDev + devops + design + techWriter + testing;
                const risk = base * (p.parameters.risks / 100);
                const general = (base + risk) * (p.parameters.general / 100);
                const management = (base + risk + general) * (p.parameters.management / 100);
                return sum + base + risk + general + management;
            }, 0);

            return { ...p, totalHours: Math.round(totalHours) };
        });
    }, [projects, pert]);

    const selectedProject = useMemo(() => {
        return projectsWithTotals.find(p => p.id === selectedProjectId);
    }, [projectsWithTotals, selectedProjectId]);
    
    const handleCloseModal = useCallback(() => {
        setCreateModalOpen(false);
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (selectedProject) {
        return (
            <EstimatorPage
                project={selectedProject}
                onBack={handleBackToRegistry}
                onSave={handleSaveProject}
            />
        );
    }

    return (
        <>
            <RegistryPage
                projects={projectsWithTotals}
                onSelectProject={handleSelectProject}
                onCreateNew={handleCreateNew}
                onDeleteProject={handleDeleteProject}
            />
            {isCreateModalOpen && (
                <CreateEstimateModal
                    onClose={handleCloseModal}
                    onCreate={handleCreateProject}
                />
            )}
        </>
    );
};

export default App;
