
import React, { useRef } from 'react';
import type { Task, ProjectParameters, Estimate, RoleKey } from '../types';
import { EstimationTableRow } from './EstimationTableRow';
import { PlusIcon, ExpandIcon, CollapseIcon, ImportIcon } from './icons';

// Make XLSX available from the script loaded in index.html
declare var XLSX: any;

interface EstimationTableProps {
  tasks: Task[];
  parameters: ProjectParameters;
  estimateId?: number;
  onTaskChange: (id: number, updatedTask: Task) => void;
  onAddTask: () => void;
  onRemoveTask: (id: number) => void;
  onImportTasks: (tasks: Task[]) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const estimateGroups = [
  { name: 'Анализ + документирование', keys: ['analysis'] },
  { name: 'Front Dev', keys: ['frontDev'] },
  { name: 'Back Dev', keys: ['backDev'] },
  { name: 'Тестирование', keys: ['testing'] },
  { name: 'Devops', keys: ['devops'] },
  { name: 'Дизайнер', keys: ['design'] },
  { name: 'Технические писатели', keys: ['techWriter'] },
];

const roleEstimateGroups: { name: string, key: RoleKey }[] = [
    { name: 'Анализ', key: 'analysis' },
    { name: 'Front Dev', key: 'frontDev' },
    { name: 'Back Dev', key: 'backDev' },
    { name: 'Тестирование', key: 'testing' },
    { name: 'Devops', key: 'devops' },
    { name: 'Дизайнер', key: 'design' },
    { name: 'Технические писатели', key: 'techWriter' },
];

export const EstimationTable: React.FC<EstimationTableProps> = ({ tasks, parameters, estimateId, onTaskChange, onAddTask, onRemoveTask, onImportTasks, isFullscreen, toggleFullscreen }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            const newTasks: Task[] = json.map((row, index) => {
                const estimates: Record<RoleKey, Estimate> = {} as any;
                roleEstimateGroups.forEach(group => {
                    estimates[group.key] = {
                        min: Number(row[`${group.name} Мин`]) || 0,
                        real: Number(row[`${group.name} Реал`]) || 0,
                        max: Number(row[`${group.name} Макс`]) || 0,
                    };
                });
                
                const isRisk = ['да', 'yes', 'true', '1'].includes(String(row['Риск'] || '').toLowerCase());

                return {
                    id: Date.now() + index, // Генерируем числовой ID
                    stage: String(row['Этап, Модуль'] || ''),
                    name: String(row['Функциональное требование'] || ''),
                    isRisk,
                    estimates,
                };
            });

            onImportTasks(newTasks);

        } catch (error) {
            console.error("Error parsing Excel file:", error);
            alert("Не удалось обработать файл. Убедитесь, что он имеет правильный формат и заголовки столбцов.");
        } finally {
            // Reset file input to allow importing the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className={`bg-card rounded-lg shadow-lg flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
      <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="text-lg font-bold text-card-foreground">Оценка проекта</h3>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <button
              onClick={handleImportClick}
              className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Импорт из Excel"
            >
              <ImportIcon />
            </button>
            <button 
              onClick={toggleFullscreen} 
              className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Перейти в полноэкранный режим"}
            >
                {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>
      </div>
      <div className="overflow-auto flex-grow">
        <table className="w-full min-w-max text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
            <tr>
              <th scope="col" className="px-3 py-3 w-12 sticky left-0 bg-secondary/50 z-20"></th>
              <th scope="col" className="px-3 py-3 min-w-[150px] sticky left-12 bg-secondary/50 z-20">Этап, Модуль</th>
              <th scope="col" className="px-3 py-3 min-w-[200px] sticky left-[210px] bg-secondary/50 z-20">Функциональное требование</th>
              <th scope="col" className="px-3 py-3 w-20 text-center sticky left-[410px] bg-secondary/50 z-20">Риск</th>
              {estimateGroups.map(group => (
                <th key={group.name} colSpan={4} className="px-3 py-3 text-center border-l border-r border-border">{group.name}</th>
              ))}
              <th colSpan={5} className="px-3 py-3 text-center border-l border-border">Итоги по задаче</th>
            </tr>
            <tr>
              <th className="px-3 py-3 sticky left-0 bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-12 bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-[210px] bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-[410px] bg-secondary/50 z-20"></th>
              {estimateGroups.flatMap(group => [
                  <th key={`${group.name}-min`} className="px-2 py-3 text-center border-l border-border">Мин</th>,
                  <th key={`${group.name}-real`} className="px-2 py-3 text-center">Реал</th>,
                  <th key={`${group.name}-max`} className="px-2 py-3 text-center">Макс</th>,
                  <th key={`${group.name}-pert`} className="px-2 py-3 text-center font-bold bg-secondary/70 border-r border-border">Pert</th>
              ])}
              <th className="px-2 py-3 text-center border-l border-border">Риски</th>
              <th className="px-2 py-3 text-center">Общие</th>
              <th className="px-2 py-3 text-center">Упр.</th>
              <th className="px-2 py-3 text-center font-bold bg-secondary/70">Итого</th>
              <th className="px-2 py-3 text-center font-bold bg-primary/20">Базовая оценка</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <EstimationTableRow
                key={task.id}
                task={task}
                parameters={parameters}
                estimateId={estimateId}
                onTaskChange={onTaskChange}
                onRemoveTask={onRemoveTask}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-start items-center space-x-4 border-t border-border">
        <button
          onClick={onAddTask}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
        >
          <PlusIcon />
          <span>Добавить задачу</span>
        </button>
      </div>
    </div>
  );
};