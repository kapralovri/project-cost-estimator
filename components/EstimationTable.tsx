
import React, { useRef, useState, useMemo } from 'react';
import type { Task, ProjectParameters, Estimate, RoleKey } from '../types';
import { EstimationTableRow } from './EstimationTableRow';
import { PlusIcon, ExpandIcon, CollapseIcon, ImportIcon } from './icons';
import { Spinner } from './Spinner';
import { importExcelFromBackend } from '../api';
import { WBSView } from './WBSView';

// Make XLSX available from the script loaded in index.html
declare var XLSX: any;

interface EstimationTableProps {
  tasks: Task[];
  parameters: ProjectParameters;
  estimateId?: number;
  enabledRoles?: RoleKey[];
  onTaskChange: (id: number, updatedTask: Task) => void;
  onAddTask: (stage?: string) => void;
  onRemoveTask: (id: number) => void;
  onImportTasks: (tasks: Task[]) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const ROLE_LABELS: Record<RoleKey, string> = {
  analysis: 'Аналитик',
  architect: 'Архитектор',
  frontDev: 'Front Dev',
  backDev: 'Back Dev',
  testing: 'Тестирование',
  devops: 'Devops',
  design: 'Дизайнер',
  techWriter: 'Тех. писатель',
  adminTrack: 'Админ форм. трека',
  stp: 'СТП',
};

export const EstimationTable: React.FC<EstimationTableProps> = ({ tasks, parameters, estimateId, enabledRoles, onTaskChange, onAddTask, onRemoveTask, onImportTasks, isFullscreen, toggleFullscreen }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isWBS, setIsWBS] = useState(false);

  const activeRoles = useMemo<RoleKey[]>(() => enabledRoles && enabledRoles.length ? enabledRoles : ['analysis','architect','frontDev','backDev','testing','devops','design','techWriter','adminTrack','stp'] as RoleKey[], [enabledRoles]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !estimateId) return;

    setIsImporting(true);
    try {
      // Используем новую API для импорта через бэкенд
      const importedTasks = await importExcelFromBackend(file, estimateId);
      onImportTasks(importedTasks);
    } catch (error) {
      console.error("Error importing Excel file:", error);
      alert("Не удалось импортировать файл. Убедитесь, что он имеет правильный формат.");
    } finally {
      // Reset file input to allow importing the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsImporting(false);
    }
  };

  return (
    <>
      {isImporting && <Spinner fullscreen size="lg" />}
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
                onClick={() => setIsWBS(v => !v)}
                className={`px-3 py-1 rounded text-sm ${isWBS ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >
                WBS
              </button>
              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
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
      {!isWBS && (
      <div className="overflow-auto flex-grow">
        <table className="w-full min-w-max text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/70 sticky top-0 z-30">
            <tr>
              <th scope="col" className="px-3 py-3 w-12 sticky left-0 bg-secondary/50 z-20"></th>
              <th scope="col" className="px-3 py-3 min-w-[150px] sticky left-12 bg-secondary/50 z-20">Этап, Модуль</th>
              <th scope="col" className="px-3 py-3 min-w-[200px] sticky left-[210px] bg-secondary/50 z-20">Функциональное требование</th>
              <th scope="col" className="px-3 py-3 w-20 text-center sticky left-[410px] bg-secondary/50 z-20">Риск</th>
              <th scope="col" className="px-3 py-3 w-24 text-center">Факт</th>
              {activeRoles.map(role => (
                <th key={role} colSpan={4} className="px-3 py-3 text-center border-l border-r border-border">{ROLE_LABELS[role]}</th>
              ))}
              <th colSpan={5} className="px-3 py-3 text-center border-l border-border">Итоги по задаче</th>
            </tr>
            <tr>
              <th className="px-3 py-3 sticky left-0 bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-12 bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-[210px] bg-secondary/50 z-20"></th>
              <th className="px-3 py-3 sticky left-[410px] bg-secondary/50 z-20"></th>
              <th className="px-3 py-3"></th>
              {activeRoles.flatMap(role => [
                  <th key={`${role}-min`} className="px-2 py-3 text-center border-l border-border">Мин</th>,
                  <th key={`${role}-real`} className="px-2 py-3 text-center">Реал</th>,
                  <th key={`${role}-max`} className="px-2 py-3 text-center">Макс</th>,
                  <th key={`${role}-pert`} className="px-2 py-3 text-center font-bold bg-secondary/70 border-r border-border">Pert</th>
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
                enabledRoles={activeRoles}
                onTaskChange={onTaskChange}
                onRemoveTask={onRemoveTask}
              />
            ))}
          </tbody>
        </table>
      </div>
      )}
      {isWBS && (
        <div className="flex-grow overflow-auto">
          <WBSView
            tasks={tasks}
            parameters={parameters}
            onTaskChange={onTaskChange}
            onRemoveTask={onRemoveTask}
            onAddTask={onAddTask}
            estimateId={estimateId}
          />
        </div>
      )}
      <div className="p-4 flex justify-start items-center space-x-4 border-t border-border">
        {!isWBS ? (
          <button
            onClick={() => onAddTask()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
          >
            <PlusIcon />
            <span>Добавить задачу</span>
          </button>
        ) : (
          <button
            onClick={() => onAddTask()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
          >
            <PlusIcon />
            <span>Добавить этап</span>
          </button>
        )}
      </div>
    </div>
    </>
  );
};
