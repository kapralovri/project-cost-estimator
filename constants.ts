
import type { QualityLevel, ProjectParameters } from './types';

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