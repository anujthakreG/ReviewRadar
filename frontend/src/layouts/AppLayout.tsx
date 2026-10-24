import React, { useState } from 'react';
import { Sidebar, NavPage } from './Sidebar';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  totalReviews: number;
  totalProducts: number;
  loading: boolean;
  onRefresh: () => void;
  onLoadSample: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  totalReviews,
  totalProducts,
  loading,
  onRefresh,
  onLoadSample,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            onNavigate(page);
          }}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-64 z-50">
            <Sidebar
              currentPage={currentPage}
              onNavigate={(page) => {
                onNavigate(page);
                setMobileOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          currentPage={currentPage}
          totalReviews={totalReviews}
          totalProducts={totalProducts}
          loading={loading}
          onRefresh={onRefresh}
          onLoadSample={onLoadSample}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
