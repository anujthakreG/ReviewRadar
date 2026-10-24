/**
 * Formatting utilities for dates, numbers, and ratings
 */

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(num?: number | null): string {
  if (num === undefined || num === null) return '0.0%';
  return `${Number(num).toFixed(1)}%`;
}

export function getSentimentColor(label: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (label.toLowerCase()) {
    case 'positive':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'negative':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        dot: 'bg-rose-400',
      };
    case 'neutral':
    default:
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
      };
  }
}
