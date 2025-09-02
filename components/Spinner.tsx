import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullscreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', fullscreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary ${sizeClasses[size]}`} />
          <p className="text-gray-700 font-medium">Импорт файла...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${sizeClasses[size]} ${className}`} />
  );
};
