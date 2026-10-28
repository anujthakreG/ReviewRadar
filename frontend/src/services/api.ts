import {
  DashboardSummary,
  PaginatedReviews,
  Product,
  RatingsAnalytics,
  SentimentAnalytics,
  TrendsAnalytics,
  DataQualityReport,
  InsightsReport,
  PreviewResponse,
  ImportSummary,
} from '../types';

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE = rawBase.replace(/\/+$/, '');

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return (await response.json()) as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to ReviewRadar backend. Please verify FastAPI is running on port 8000.');
    }
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; project: string; version: string }>('/api/health'),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),

  // Reviews with filtering & pagination
  getReviews: (params?: {
    product_id?: number;
    product_name?: string;
    rating?: number;
    sentiment?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<PaginatedReviews>(`/api/reviews${qStr}`);
  },

  // Products
  getProducts: () => request<Product[]>('/api/products'),

  // Analytics endpoints
  getRatingsAnalytics: () => request<RatingsAnalytics>('/api/analytics/ratings'),
  getSentimentAnalytics: () => request<SentimentAnalytics>('/api/analytics/sentiment'),
  getTrendsAnalytics: () => request<TrendsAnalytics>('/api/analytics/trends'),
  getDataQualityReport: () => request<DataQualityReport>('/api/analytics/data-quality'),

  // Insights
  getInsights: () => request<InsightsReport>('/api/insights'),

  // Upload & File operations
  previewUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<PreviewResponse>('/api/uploads/preview', {
      method: 'POST',
      body: formData,
    });
  },

  importReviews: (
    file: File,
    mapping?: Record<string, string | null>,
    scaleMin: number = 1.0,
    scaleMax: number = 5.0
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) {
      formData.append('column_mapping', JSON.stringify(mapping));
    }
    formData.append('rating_scale_min', String(scaleMin));
    formData.append('rating_scale_max', String(scaleMax));

    return request<ImportSummary>('/api/uploads/import', {
      method: 'POST',
      body: formData,
    });
  },

  // Sample data & database management
  loadSampleData: () =>
    request<ImportSummary>('/api/sample-data/load', {
      method: 'POST',
    }),

  downloadSampleCsvUrl: () => `${API_BASE}/api/sample-data/download`,
  getDocsUrl: () => `${API_BASE}/docs`,

  resetDatabase: () =>
    request<{ status: string; message: string }>('/api/database/reset', {
      method: 'POST',
    }),
};
