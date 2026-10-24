import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  showValue = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  return (
    <div className="inline-flex items-center gap-1.5" title={`${rating} out of ${maxRating} stars`}>
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: maxRating }).map((_, i) => {
          const fillRatio = Math.max(0, Math.min(1, rating - i));
          return (
            <div key={i} className="relative">
              <Star className={`${iconSizes[size]} text-slate-700`} />
              {fillRatio > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden text-amber-400"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <Star className={`${iconSizes[size]} fill-amber-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={`text-slate-300 font-mono ${textSizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
