
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PlusIcon, TrashIcon } from '../components/icons';
import type { EstimateProject } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface RegistryPageProps {
  projects: (EstimateProject & { totalHours: number })[];
  onSelectProject: (id: string) => void;
  onCreateNew: () => void;
  onDeleteProject: (id: string) => void;
}

export const RegistryPage: React.FC<RegistryPageProps> = ({ projects, onSelectProject, onCreateNew, onDeleteProject }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <Header view="registry" />
      <main className="mt-8">
        <div className="flex justify-end mb-6">
          <button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
          >
            <PlusIcon />
            <span>Создать оценку</span>
          </button>
        </div>
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Наименование оценки</th>
                  <th scope="col" className="px-6 py-3">Дата создания</th>
                  <th scope="col" className="px-6 py-3 text-right">Кол-во часов</th>
                  <th scope="col" className="px-6 py-3">Статус</th>
                  <th scope="col" className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-border hover:bg-secondary/50">
                    <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onSelectProject(project.id); }}
                        className="text-primary hover:underline"
                      >
                        {project.name}
                      </a>
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-semibold text-card-foreground">{project.totalHours.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'Актуальный' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center space-x-3">
                        <button
                          onClick={() => onSelectProject(project.id)}
                          className="px-3 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                          Открыть
                        </button>
                        <button
                          onClick={() => setConfirmId(project.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Удалить оценку"
                          aria-label="Удалить оценку"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {projects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                  <h3 className="text-lg font-semibold">Оценок пока нет</h3>
                  <p className="mt-1">Нажмите "Создать оценку", чтобы начать работу.</p>
              </div>
            )}
        </div>
        {confirmId && (
          <ConfirmDialog
            title="Удалить оценку?"
            message="Действие необратимо. Подтвердите удаление оценки."
            confirmLabel="Удалить"
            cancelLabel="Отмена"
            onConfirm={() => {
              onDeleteProject(confirmId);
              setConfirmId(null);
            }}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </main>
    </div>
  );
};
