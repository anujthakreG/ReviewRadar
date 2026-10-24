import React from 'react';
import { LucideIcon, Database, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Database,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#131D31]/50 border border-dashed border-slate-800 rounded-2xl my-6">
      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-cyan-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all duration-150"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
};
