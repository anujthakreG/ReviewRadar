import React from 'react';
import { RefreshCw, Database, Menu, Sparkles, Layers } from 'lucide-react';
import { NavPage } from './Sidebar';

interface NavbarProps {
  currentPage: NavPage;
  totalReviews: number;
  totalProducts: number;
  loading: boolean;
  onRefresh: () => void;
  onLoadSample: () => void;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  totalReviews,
  totalProducts,
  loading,
  onRefresh,
  onLoadSample,
  onOpenMobileSidebar,
}) => {
  const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time review KPIs, customer sentiment distributions, and rating trajectories',
    },
    upload: {
      title: 'Upload & Ingest Reviews',
      subtitle: 'Upload CSV, Excel, or JSON files with automated mapping and data cleansing',
    },
    explorer: {
      title: 'Review Explorer',
      subtitle: 'Search, filter, inspect, and analyze granular individual customer reviews',
    },
    analytics: {
      title: 'Deep Analytics & Distributions',
      subtitle: 'Multi-variable visualizations, box-plot distributions, and time-series trends',
    },
    quality: {
      title: 'Data Hygiene & Audit',
      subtitle: 'Transparent pipeline validation metrics, rejection audits, and before-vs-after statistics',
    },
    insights: {
      title: 'Automated Business Insights',
      subtitle: 'Algorithm-driven takeaways, customer friction terms, and category benchmarks',
    },
    settings: {
      title: 'System Settings & Methodology',
      subtitle: 'VADER NLP specifications, data management controls, and architecture documentation',
    },
  };

  const { title, subtitle } = pageTitles[currentPage] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-4 sm:px-8 bg-[#090D16]/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/40 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 line-clamp-1">{subtitle}</p>
        </div>
      </div>

      {/* Right: Dataset badge & Quick Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Dataset Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131D31] border border-slate-800 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {totalReviews > 0 ? (
              <span className="font-semibold text-white">
                {totalReviews} <span className="font-normal text-slate-400">reviews</span> ({totalProducts}{' '}
                <span className="font-normal text-slate-400">products</span>)
              </span>
            ) : (
              <span className="text-amber-400 font-medium">No Dataset Active</span>
            )}
          </span>
        </div>

        {/* Load Sample Data Quick Action */}
        <button
          onClick={onLoadSample}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all disabled:opacity-50"
          title="Load 35 synthetic reviews with documented data flaws"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Load Sample</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50"
          title="Refresh current data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
