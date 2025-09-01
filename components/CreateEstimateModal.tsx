
import React, { useState } from 'react';
import type { QualityLevel } from '../types';
import { QUALITY_LEVELS } from '../constants';

interface CreateEstimateModalProps {
  onClose: () => void;
  onCreate: (name: string, qualityLevel: QualityLevel) => void;
}

export const CreateEstimateModal: React.FC<CreateEstimateModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Наименование оценки не может быть пустым.');
      return;
    }
    onCreate(name, qualityLevel);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-card-foreground">Создать новую оценку</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="estimate-name" className="block text-sm font-medium text-muted-foreground mb-2">Наименование оценки</label>
              <input
                id="estimate-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-input text-foreground rounded-md p-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Например, 'Интеграция с CRM'"
              />
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </div>
            <div>
              <label htmlFor="quality-level" className="block text-sm font-medium text-muted-foreground mb-2">Уровень качества</label>
              <select
                id="quality-level"
                value={qualityLevel}
                onChange={(e) => setQualityLevel(e.target.value as QualityLevel)}
                className="w-full bg-input text-foreground rounded-md p-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(QUALITY_LEVELS).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
