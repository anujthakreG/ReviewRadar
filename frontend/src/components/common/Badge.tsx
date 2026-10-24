import React from 'react';
import { getSentimentColor } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sentiment' | 'default' | 'cyan' | 'violet' | 'outline';
  sentimentLabel?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  sentimentLabel,
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  if (variant === 'sentiment' && sentimentLabel) {
    const colors = getSentimentColor(sentimentLabel);
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {children}
      </span>
    );
  }

  if (variant === 'cyan') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 ${sizeClasses}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'violet') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20 ${sizeClasses}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border bg-slate-800/80 text-slate-300 border-slate-700 ${sizeClasses}`}
    >
      {children}
    </span>
  );
};
