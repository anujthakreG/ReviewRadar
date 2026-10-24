import React, { useState, useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { NavPage } from './layouts/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { DashboardSummary, Product } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [sumData, prodData] = await Promise.all([
        api.getDashboardSummary(),
        api.getProducts(),
      ]);
      setSummary(sumData);
      setProducts(prodData);
    } catch (err: any) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleLoadSampleData = async () => {
    setLoading(true);
    try {
      const res = await api.loadSampleData();
      await refreshAllData();
      showToast(
        `Successfully loaded sample dataset! ${res.rows_imported} valid reviews imported, ${res.rows_rejected} flawed rows flagged.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to load synthetic sample dataset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = async () => {
    await refreshAllData();
    showToast('New review dataset imported and processed successfully!', 'success');
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      totalReviews={summary?.total_reviews || 0}
      totalProducts={summary?.total_products || 0}
      loading={loading}
      onRefresh={refreshAllData}
      onLoadSample={handleLoadSampleData}
    >
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#131D31] border border-cyan-500/30 shadow-2xl text-xs font-medium animate-bounce-short">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-white">{toast.message}</span>
        </div>
      )}

      {/* Pages rendering */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          summary={summary}
          onNavigate={setCurrentPage}
          onLoadSample={handleLoadSampleData}
        />
      )}

      {currentPage === 'upload' && (
        <UploadPage
          onImportComplete={handleImportComplete}
          onLoadSample={handleLoadSampleData}
        />
      )}

      {currentPage === 'explorer' && (
        <ExplorerPage
          products={products}
          onLoadSample={handleLoadSampleData}
        />
      )}

      {currentPage === 'analytics' && (
        <AnalyticsPage onLoadSample={handleLoadSampleData} />
      )}

      {currentPage === 'quality' && (
        <DataQualityPage onLoadSample={handleLoadSampleData} />
      )}

      {currentPage === 'insights' && (
        <InsightsPage onLoadSample={handleLoadSampleData} />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          onDataChanged={refreshAllData}
          onLoadSample={handleLoadSampleData}
        />
      )}
    </AppLayout>
  );
};

export default App;
