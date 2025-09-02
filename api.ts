import type { Task } from './types';

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
  taskName: string;
  stageName?: string;
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
  
  // Для пустых ответов (204 No Content) или когда нет тела ответа
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }
  
  // Проверяем, есть ли тело ответа
  const text = await res.text();
  if (!text || text.trim() === '') {
    return undefined as unknown as T;
  }
  
  // Парсим JSON только если есть содержимое
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    // Если не удалось распарсить JSON, возвращаем undefined для void типов
    return undefined as unknown as T;
  }
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

export const importExcelFromBackend = async (file: File, estimateId: number): Promise<Task[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/excel/import/${estimateId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Конвертируем данные из бэкенда в формат фронта
  return data.map((task: any) => ({
    id: task.id,
    stage: task.stageName, // stageName с бэкенда содержит этап
    name: task.taskName,   // taskName с бэкенда содержит задачу
    isRisk: false, // Пока не поддерживается в TaskDto
    estimates: {
      analysis: {
        min: Number(task.estimates.find((e: any) => e.role === 'analysis')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'analysis')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'analysis')?.max || 0),
      },
      frontDev: {
        min: Number(task.estimates.find((e: any) => e.role === 'frontDev')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'frontDev')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'frontDev')?.max || 0),
      },
      backDev: {
        min: Number(task.estimates.find((e: any) => e.role === 'backDev')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'backDev')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'backDev')?.max || 0),
      },
      testing: {
        min: Number(task.estimates.find((e: any) => e.role === 'testing')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'testing')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'testing')?.max || 0),
      },
      devops: {
        min: Number(task.estimates.find((e: any) => e.role === 'devops')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'devops')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'devops')?.max || 0),
      },
      design: {
        min: Number(task.estimates.find((e: any) => e.role === 'design')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'design')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'design')?.max || 0),
      },
      techWriter: {
        min: Number(task.estimates.find((e: any) => e.role === 'techWriter')?.min || 0),
        real: Number(task.estimates.find((e: any) => e.role === 'techWriter')?.real || 0),
        max: Number(task.estimates.find((e: any) => e.role === 'techWriter')?.max || 0),
      },
    },
  }));
};
