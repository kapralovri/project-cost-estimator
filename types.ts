export interface Estimate {
  min: number;
  real: number;
  max: number;
}

export type RoleKey = 'analysis' | 'frontDev' | 'backDev' | 'testing' | 'devops' | 'design' | 'techWriter';

export interface Task {
  id: string;
  stage: string;
  name: string;
  isRisk: boolean;
  estimates: Record<RoleKey, Estimate>;
}

export interface ProjectParameters {
  risks: number;
  risksComment?: string;
  management: number;
  managementComment?: string;
  testing: number;
  testingComment?: string;
  isManualTesting?: boolean;
  general: number;
  generalComment?: string;
  vacation: number;
  sick_leave: number;
  meetings: number;
  onboarding: number;
}

export interface Role {
    key: string;
    name: string;
}

export interface RoleAnalytics {
    name: string;
    specialtyHours: number;
    riskHours: number;
    generalHours: number;
    totalHours: number;
    distribution: number;
    fte: number;
}

export type QualityLevel = 'low' | 'basic' | 'standard' | 'high';

// Новые типы для работы с API
export interface ApiParameter {
  id?: number;
  estimateId?: number;
  name: string;
  value: string;
  type?: string;
  description?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface ApiTask {
  id?: number;
  estimateId?: number;
  name: string;
  description?: string;
  category?: string;
  complexity?: string;
  estimatedHours?: number;
  actualHours?: number;
  status?: string;
  priority?: string;
  assignedRole?: string;
  dependencies?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiEstimateItem {
  id?: number;
  estimateId?: number;
  role: string;
  hours: number;
  rate: number;
}

export interface ApiEstimate {
  id?: number;
  projectName: string;
  client?: string;
  currency: string;
  totalCost?: number;
  qualityLevel?: string;
  status?: string;
  items?: ApiEstimateItem[];
  parameters?: ApiParameter[];
  tasks?: ApiTask[];
}

export interface EstimateProject {
  backendId?: number;
  id: string;
  name: string;
  createdAt: string;
  status: 'Актуальный' | 'Не актуальный';
  qualityLevel: QualityLevel;
  parameters: ProjectParameters;
  tasks: Task[];
}