import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Review, Product, PaginatedReviews } from '../types';
import { StarRating } from '../components/common/StarRating';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

interface ExplorerPageProps {
  products: Product[];
  onLoadSample: () => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  products,
  onLoadSample,
}) => {
  const [reviewsData, setReviewsData] = useState<PaginatedReviews>({
    items: [],
    total: 0,
    page: 1,
    page_size: 15,
    total_pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReviews({
        search: search.trim() || undefined,
        product_name: selectedProduct || undefined,
        rating: selectedRating ? parseFloat(selectedRating) : undefined,
        sentiment: selectedSentiment || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      });
      setReviewsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedProduct, selectedRating, selectedSentiment, startDate, endDate, sortBy, sortOrder, page]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchReviews();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedProduct('');
    setSelectedRating('');
    setSelectedSentiment('');
    setStartDate('');
    setEndDate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedProduct || selectedRating || selectedSentiment || startDate || endDate
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters Bar */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Top search & Sort row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords, review content, product title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B101D] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="rating-asc">Rating: Low to High</option>
              <option value="sentiment_score-desc">Sentiment: Most Positive</option>
              <option value="sentiment_score-asc">Sentiment: Most Negative</option>
            </select>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          {/* Product Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Sentiment</label>
            <select
              value={selectedSentiment}
              onChange={(e) => {
                setSelectedSentiment(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0B101D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Clear Filters CTA */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Filtered matches: <strong className="text-cyan-400">{reviewsData.total}</strong> reviews
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Reviews Content Area */}
      {loading ? (
        <LoadingSpinner message="Querying filtered reviews from SQLite database..." />
      ) : reviewsData.items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No Matching Reviews' : 'No Reviews Found'}
          description={
            hasActiveFilters
              ? 'No reviews match your current search and filter criteria. Try adjusting or clearing your filters.'
              : 'The database currently contains zero reviews. Load the sample dataset to inspect reviews.'
          }
          actionLabel={hasActiveFilters ? 'Clear All Filters' : 'Load Sample Data'}
          onAction={hasActiveFilters ? handleClearFilters : onLoadSample}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing {(reviewsData.page - 1) * reviewsData.page_size + 1} -{' '}
              {Math.min(reviewsData.page * reviewsData.page_size, reviewsData.total)} of{' '}
              <strong className="text-white">{reviewsData.total}</strong> total reviews
            </span>
            <span>
              Page <strong className="text-white">{reviewsData.page}</strong> of{' '}
              <strong className="text-white">{reviewsData.total_pages}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reviewsData.items.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#131D31] border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all duration-150"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{rev.product_name}</span>
                      {rev.external_id && (
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {rev.external_id}
                        </span>
                      )}
                    </div>
                    {rev.review_title && (
                      <h4 className="text-xs font-semibold text-slate-200 mt-1 italic">
                        "{rev.review_title}"
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <StarRating rating={rev.rating} size="sm" />
                    <Badge variant="sentiment" sentimentLabel={rev.sentiment_label}>
                      {rev.sentiment_label} ({rev.sentiment_score > 0 ? `+${rev.sentiment_score.toFixed(2)}` : rev.sentiment_score.toFixed(2)})
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{rev.review_text}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    {rev.reviewer_name && (
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {rev.reviewer_name}
                      </span>
                    )}
                    {rev.verified_purchase !== null && rev.verified_purchase !== undefined && (
                      <span
                        className={`flex items-center gap-1 ${
                          rev.verified_purchase ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {rev.verified_purchase ? 'Verified Purchase' : 'Unverified'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(rev.review_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {reviewsData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, reviewsData.total_pages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                      page === pageNum
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800/70 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(reviewsData.total_pages, page + 1))}
                disabled={page >= reviewsData.total_pages}
                className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
