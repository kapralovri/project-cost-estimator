export interface Estimate {
  min: number;
  real: number;
  max: number;
}

export type RoleKey =
  | 'analysis'
  | 'architect'
  | 'frontDev'
  | 'backDev'
  | 'testing'
  | 'devops'
  | 'design'
  | 'techWriter'
  | 'adminTrack'
  | 'stp';

export interface Task {
  id: number;
  stage: string;
  name: string;
  isRisk: boolean;
  /** Включает режим факта по строке и делает PERT редактируемым */
  isActual?: boolean;
  /** Ручные значения для столбцов Риски/Общие/Упр. (при включенной ручной корректировке) */
  riskOverride?: number;
  generalOverride?: number;
  managementOverride?: number;
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
  /** Режим ручной корректировки параметров проекта */
  isManualAdjust?: boolean;
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
  /** Список включенных ролей, участвующих в оценке */
  enabledRoles?: RoleKey[];
}
