
import type { QualityLevel, ProjectParameters, RoleKey } from './types';

export const QUALITY_LEVELS: Record<QualityLevel, { name: string; parameters: Omit<ProjectParameters, 'general' | 'testingComment' | 'risksComment' | 'managementComment' | 'generalComment'> }> = {
    low: {
        name: 'Низкий',
        parameters: {
            risks: 30,
            management: 10,
            testing: 10,
            vacation: 8,
            sick_leave: 5,
            meetings: 5,
            onboarding: 0,
        }
    },
    basic: {
        name: 'Базовый',
        parameters: {
            risks: 20,
            management: 12,
            testing: 30,
            vacation: 8,
            sick_leave: 5,
            meetings: 5,
            onboarding: 2,
        }
    },
    standard: {
        name: 'Стандартный',
        parameters: {
            risks: 15,
            management: 15,
            testing: 40,
            vacation: 8,
            sick_leave: 5,
            meetings: 10,
            onboarding: 5,
        }
    },
    high: {
        name: 'Высокий',
        parameters: {
            risks: 10,
            management: 18,
            testing: 50,
            vacation: 8,
            sick_leave: 5,
            meetings: 10,
            onboarding: 7,
        }
    }
};

export const BASE_PARAMETER_BENCHMARKS = {
  risks: 20,
  management: 15,
  general: 20,
};

export const DEFAULT_PROJECT_PARAMETERS: Omit<ProjectParameters, 'general' | 'testingComment' | 'risksComment' | 'managementComment' | 'generalComment'> = {
    risks: 20,
    management: 15,
    testing: 40,
    vacation: 8,
    sick_leave: 5,
    meetings: 5,
    onboarding: 2,
};

// Полный справочник ролей с локализованными названиями
export const ALL_ROLES: { key: RoleKey; name: string }[] = [
  { key: 'analysis', name: 'Аналитик' },
  { key: 'architect', name: 'Архитектор' },
  { key: 'frontDev', name: 'Разработчик Front' },
  { key: 'backDev', name: 'Разработчик Back' },
  { key: 'testing', name: 'QA' },
  { key: 'devops', name: 'Devops' },
  { key: 'techWriter', name: 'Технический писатель' },
  { key: 'adminTrack', name: 'Администратор форм. трека' },
  { key: 'design', name: 'Дизайнер' },
  { key: 'stp', name: 'СТП' },
];

export const DEFAULT_ENABLED_ROLES: RoleKey[] = ALL_ROLES.map(r => r.key);
