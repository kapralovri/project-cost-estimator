
import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BackIcon, SaveIcon } from './icons';

interface HeaderProps {
  view: 'registry' | 'estimator';
  projectName?: string;
  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ view, projectName, onBack, onSave, isSaving }) => {
  return (
    <header className="flex justify-between items-center pb-4 border-b border-border">
      <div className="flex items-center space-x-4">
        {view === 'estimator' && onBack && (
           <button onClick={onBack} className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <BackIcon />
           </button>
        )}
        <h1 className="text-2xl font-bold text-card-foreground">
          {view === 'estimator' ? projectName : 'Реестр оценок'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {view === 'estimator' && onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 flex items-center space-x-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-primary/50"
            >
              <SaveIcon />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить проект'}</span>
            </button>
        )}
        <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, Senior UX/UI</span>
        <img
          className="w-10 h-10 rounded-full"
          src="https://picsum.photos/100"
          alt="User Avatar"
        />
        <ThemeSwitcher />
      </div>
    </header>
  );
};
