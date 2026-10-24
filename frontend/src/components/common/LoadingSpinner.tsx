import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading analytics data...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      <Loader2 className={`${sizeMap[size]} text-cyan-400 animate-spin mb-3`} />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );
};
