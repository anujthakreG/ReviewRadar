import React from 'react';
import {
  MessageSquare,
  Star,
  Smile,
  Frown,
  Package,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { DashboardSummary } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StarRating } from '../components/common/StarRating';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatNumber } from '../utils/formatters';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  onNavigate: (page: any) => void;
  onLoadSample: () => void;
}

const SENTIMENT_COLORS = {
  Positive: '#10B981', // emerald-500
  Neutral: '#F59E0B',  // amber-500
  Negative: '#EF4444', // rose-500
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  onNavigate,
  onLoadSample,
}) => {
  if (!summary || summary.total_reviews === 0) {
    return (
      <EmptyState
        title="No Review Data Active in ReviewRadar"
        description="Your database is currently empty. Get started by uploading your own customer review dataset (CSV, Excel, or JSON) or load the bundled synthetic sample dataset."
        actionLabel="Load Sample Dataset"
        onAction={onLoadSample}
        secondaryLabel="Upload Review File"
        onSecondaryAction={() => onNavigate('upload')}
      />
    );
  }

  // Format sentiment data for Pie Chart
  const sentimentPieData = [
    { name: 'Positive', value: summary.sentiment_breakdown.Positive || 0, color: SENTIMENT_COLORS.Positive },
    { name: 'Neutral', value: summary.sentiment_breakdown.Neutral || 0, color: SENTIMENT_COLORS.Neutral },
    { name: 'Negative', value: summary.sentiment_breakdown.Negative || 0, color: SENTIMENT_COLORS.Negative },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Reviews"
          value={formatNumber(summary.total_reviews)}
          subtitle="Clean records in database"
          icon={MessageSquare}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10 border-cyan-500/20"
        />
        <MetricCard
          title="Average Rating"
          value={summary.average_rating.toFixed(2)}
          subtitle="Across all products"
          icon={Star}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
        />
        <MetricCard
          title="Positive Sentiment"
          value={`${summary.positive_sentiment_pct}%`}
          subtitle="VADER compound ≥ 0.05"
          icon={Smile}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
        />
        <MetricCard
          title="Negative Sentiment"
          value={`${summary.negative_sentiment_pct}%`}
          subtitle="VADER compound ≤ -0.05"
          icon={Frown}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10 border-rose-500/20"
        />
        <MetricCard
          title="Catalog Products"
          value={summary.total_products}
          subtitle="Distinct items analyzed"
          icon={Package}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20"
        />
        <MetricCard
          title="Data Quality"
          value={`${summary.data_quality_score}%`}
          subtitle="Sanitization score"
          icon={ShieldCheck}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10 border-violet-500/20"
        />
      </div>

      {/* 2. Visualizations Row 1: Rating Distribution & Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution (2 cols on lg) */}
        <div className="lg:col-span-2 bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Rating Distribution</h3>
              <p className="text-xs text-slate-400">Review volume by star rating rating (1 to 5 stars)</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Details <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.rating_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="rating"
                  tickFormatter={(val) => `${val} ★`}
                  stroke="#64748B"
                  fontSize={12}
                />
                <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B101D] border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-amber-400">{data.rating} Stars</p>
                          <p className="text-slate-300 mt-1">Count: <span className="font-semibold text-white">{data.count}</span></p>
                          <p className="text-slate-400">Share: <span className="font-semibold text-cyan-400">{data.percentage}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                  {summary.rating_distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rating >= 4 ? '#3B82F6' : entry.rating === 3 ? '#6366F1' : '#F43F5E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Breakdown Donut (1 col on lg) */}
        <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Sentiment Polarity</h3>
              <p className="text-xs text-slate-400">VADER Natural Language scoring</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Analyze <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = ((data.value / summary.total_reviews) * 100).toFixed(1);
                      return (
                        <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                          <p className="font-bold" style={{ color: data.color }}>{data.name}</p>
                          <p className="text-slate-300 mt-1">{data.value} reviews ({pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-white">{summary.total_reviews}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
            </div>
          </div>

          {/* Sentiment Legends */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 mt-auto text-center">
            <div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Pos
              </p>
              <p className="text-xs font-bold text-white mt-0.5">{summary.positive_sentiment_pct}%</p>
            </div>
            <div>
              <p className="text-[11px] text-amber-400 font-semibold flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Neu
              </p>
              <p className="text-xs font-bold text-white mt-0.5">{summary.neutral_sentiment_pct}%</p>
            </div>
            <div>
              <p className="text-[11px] text-rose-400 font-semibold flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Neg
              </p>
              <p className="text-xs font-bold text-white mt-0.5">{summary.negative_sentiment_pct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visualizations Row 2: Temporal Trends */}
      {summary.review_volume_trend && summary.review_volume_trend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Review Volume Over Time */}
          <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Review Volume Over Time</h3>
                <p className="text-xs text-slate-400">Daily review submissions with 7-period moving average</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.review_volume_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatDate(val).slice(0, 6)} />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                            <p className="font-semibold text-slate-300">{formatDate(d.date)}</p>
                            <p className="text-cyan-400 font-bold mt-1">Reviews: {d.count}</p>
                            {d.sma_7 !== undefined && d.sma_7 !== null && (
                              <p className="text-violet-400">7-period SMA: {d.sma_7}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#volGradient)" />
                  <Line type="monotone" dataKey="sma_7" stroke="#A855F7" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Rating Trend */}
          <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Average Rating Trajectory</h3>
                <p className="text-xs text-slate-400">Chronological satisfaction fluctuations</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.average_rating_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatDate(val).slice(0, 6)} />
                  <YAxis domain={[1, 5]} stroke="#64748B" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                            <p className="font-semibold text-slate-300">{formatDate(d.date)}</p>
                            <p className="text-amber-400 font-bold mt-1">Average: {d.rating} ★</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. Product Leaderboards: Top Rated vs Lowest Rated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Rated Products */}
        <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Top-Rated Products</h3>
                <p className="text-xs text-slate-400">Highest customer satisfaction score</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {summary.top_rated_products && summary.top_rated_products.length > 0 ? (
              summary.top_rated_products.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div className="pr-4 truncate">
                    <p className="text-sm font-semibold text-white truncate">{prod.name}</p>
                    <p className="text-xs text-slate-400">{prod.review_count} customer reviews</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRating rating={prod.average_rating} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No product ratings available.</p>
            )}
          </div>
        </div>

        {/* Lowest-Rated Products */}
        <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Attention Needed</h3>
                <p className="text-xs text-slate-400">Products with lowest average customer ratings</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {summary.lowest_rated_products && summary.lowest_rated_products.length > 0 ? (
              summary.lowest_rated_products.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div className="pr-4 truncate">
                    <p className="text-sm font-semibold text-white truncate">{prod.name}</p>
                    <p className="text-xs text-slate-400">{prod.review_count} customer reviews</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRating rating={prod.average_rating} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No product ratings available.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Reviews Feed */}
      <div className="bg-[#131D31] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Customer Reviews</h3>
            <p className="text-xs text-slate-400">Latest review submissions with NLP sentiment classifications</p>
          </div>
          <button
            onClick={() => onNavigate('explorer')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Open Explorer <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3">Sentiment</th>
                <th className="py-3 px-3">Review Snippet</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {summary.recent_reviews && summary.recent_reviews.length > 0 ? (
                summary.recent_reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-white max-w-[180px] truncate">
                      {rev.product_name}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StarRating rating={rev.rating} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge variant="sentiment" sentimentLabel={rev.sentiment_label}>
                        {rev.sentiment_label}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={rev.review_text}>
                      {rev.review_title ? (
                        <span className="font-semibold text-white mr-1.5">{rev.review_title}:</span>
                      ) : null}
                      {rev.review_text}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatDate(rev.review_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No recent reviews to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
