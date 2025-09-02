export interface BackendEstimateItemDto {
  id?: number;
  estimateId?: number;
  role: string;
  hours: number;
  rate: number;
}

export interface BackendTaskEstimateDto {
  role: string;
  min: number;
  real: number;
  max: number;
}

export interface BackendParameterDto {
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

export interface BackendTaskDto {
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
  estimates?: BackendTaskEstimateDto[];
}

export interface BackendEstimateDto {
  id?: number;
  projectName: string;
  client?: string;
  currency: string;
  totalCost?: number;
  qualityLevel?: string;
  status?: string;
  items?: BackendEstimateItemDto[];
  parameters?: BackendParameterDto[];
  tasks?: BackendTaskDto[];
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  listEstimates: () => http<BackendEstimateDto[]>('/api/estimates'),
  getEstimate: (id: number) => http<BackendEstimateDto>(`/api/estimates/${id}`),
  createEstimate: (dto: BackendEstimateDto) => http<BackendEstimateDto>('/api/estimates', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  updateEstimate: (id: number, dto: BackendEstimateDto) => http<BackendEstimateDto>(`/api/estimates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  }),
  deleteEstimate: (id: number) => http<void>(`/api/estimates/${id}`, { method: 'DELETE' }),
  
  // Items
  addItem: (id: number, item: BackendEstimateItemDto) => http<BackendEstimateItemDto>(`/api/estimates/${id}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  removeItem: (estimateId: number, itemId: number) => http<void>(`/api/estimates/${estimateId}/items/${itemId}`, {
    method: 'DELETE',
  }),
  
  // Parameters
  addParameter: (id: number, parameter: BackendParameterDto) => http<BackendParameterDto>(`/api/estimates/${id}/parameters`, {
    method: 'POST',
    body: JSON.stringify(parameter),
  }),
  removeParameter: (estimateId: number, parameterId: number) => http<void>(`/api/estimates/${estimateId}/parameters/${parameterId}`, {
    method: 'DELETE',
  }),
  
  // Tasks
  addTask: (id: number, task: BackendTaskDto) => http<BackendTaskDto>(`/api/estimates/${id}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  removeTask: (estimateId: number, taskId: number) => http<void>(`/api/estimates/${estimateId}/tasks/${taskId}`, {
    method: 'DELETE',
  }),
  
  // Task Estimates
  updateTaskEstimate: (estimateId: number, taskId: number, role: string, estimate: BackendTaskEstimateDto) => 
    http<BackendTaskEstimateDto>(`/api/estimates/${estimateId}/tasks/${taskId}/estimates/${role}`, {
      method: 'PUT',
      body: JSON.stringify(estimate),
    }),
  
  // Tasks
  updateTask: (estimateId: number, taskId: number, task: BackendTaskDto) => 
    http<BackendTaskDto>(`/api/estimates/${estimateId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
};
