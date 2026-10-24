import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  BarChart3,
  ShieldCheck,
  Lightbulb,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radar,
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'upload'
  | 'explorer'
  | 'analytics'
  | 'quality'
  | 'insights'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as NavPage, label: 'Upload Reviews', icon: UploadCloud },
    { id: 'explorer' as NavPage, label: 'Review Explorer', icon: FileSearch },
    { id: 'analytics' as NavPage, label: 'Analytics', icon: BarChart3 },
    { id: 'quality' as NavPage, label: 'Data Quality', icon: ShieldCheck },
    { id: 'insights' as NavPage, label: 'Insights', icon: Lightbulb },
    { id: 'settings' as NavPage, label: 'Settings / About', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-[#0B101D] border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="flex items-center justify-center w-full h-full bg-[#0B101D] rounded-[10px]">
              <Radar className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Review<span className="text-cyan-400">Radar</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Analytics Engine</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors hidden lg:flex items-center justify-center"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-transparent text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? 'text-cyan-400 scale-105' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Version footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-slate-300">v1.0.0 Online</span>
              <span className="text-[10px] text-slate-400">FastAPI & SQLite</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
