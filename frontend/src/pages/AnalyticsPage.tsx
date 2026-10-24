import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Info,
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
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';
import { RatingsAnalytics, SentimentAnalytics, TrendsAnalytics } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

interface AnalyticsPageProps {
  onLoadSample: () => void;
}

const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onLoadSample }) => {
  const [ratings, setRatings] = useState<RatingsAnalytics | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time-series forecast toggle
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rData, sData, tData] = await Promise.all([
          api.getRatingsAnalytics(),
          api.getSentimentAnalytics(),
          api.getTrendsAnalytics(),
        ]);
        setRatings(rData);
        setSentiment(sData);
        setTrends(tData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating statistical distributions and time-series models..." />;

  if (error || !ratings || ratings.distribution.length === 0) {
    return (
      <EmptyState
        title="No Analytics Data Available"
        description="To view rating histograms, box plots, sentiment cross-tabs, and moving average trends, please load the sample dataset or upload review records."
        actionLabel="Load Sample Dataset"
        onAction={onLoadSample}
      />
    );
  }

  // Filter trend points based on forecast toggle
  const displayedTrendPoints = showForecast
    ? trends?.points || []
    : (trends?.points || []).filter((p) => !p.is_forecast);

  // Prepare sentiment pie chart data
  const sentimentPieData = [
    { name: 'Positive', value: sentiment?.distribution.Positive || 0, color: '#10B981' },
    { name: 'Neutral', value: sentiment?.distribution.Neutral || 0, color: '#F59E0B' },
    { name: 'Negative', value: sentiment?.distribution.Negative || 0, color: '#EF4444' },
  ].filter((i) => i.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Rating Overview & Statistical Distribution Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Frequency Histogram (2 cols) */}
        <div className="lg:col-span-2 bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Rating Frequency Histogram
              </h3>
              <p className="text-xs text-slate-400">Total volume of customer submissions per discrete star rating</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratings.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rating" tickFormatter={(v) => `${v} Stars`} stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-amber-400">{d.rating} Stars</p>
                          <p className="text-slate-300 mt-1">Count: <span className="text-white font-bold">{d.count}</span></p>
                          <p className="text-slate-400">Proportion: <span className="text-cyan-400 font-bold">{d.percentage}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistical Summary Panel (1 col) */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-violet-400" /> Statistical Moments
            </h3>
            <p className="text-xs text-slate-400 mb-4">Central tendency and dispersion metrics</p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-medium">Mean (Arithmetic Average)</span>
                <span className="font-mono font-bold text-white">{ratings.overall_stats.mean} / 5.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-medium">Median (50th Percentile)</span>
                <span className="font-mono font-bold text-cyan-400">{ratings.overall_stats.median}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-medium">Mode (Most Frequent)</span>
                <span className="font-mono font-bold text-amber-400">{ratings.overall_stats.mode} Stars</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-medium">Standard Deviation (σ)</span>
                <span className="font-mono font-bold text-violet-400">± {ratings.overall_stats.std_dev}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 font-medium">Interquartile Range (IQR)</span>
                <span className="font-mono font-bold text-slate-300">
                  {ratings.overall_stats.iqr} (Q1: {ratings.overall_stats.q1}, Q3: {ratings.overall_stats.q3})
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-3 border-t border-slate-800/80 mt-4">
            Computed using NumPy statistical primitives across all validated review records.
          </p>
        </div>
      </div>

      {/* 2. Custom Box-and-Whisker Distribution Plot across Products */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Product Rating Dispersion (Box & Whisker Analysis)
            </h3>
            <p className="text-xs text-slate-400">
              Visualizes minimum, 25th percentile (Q1), median (bar line), 75th percentile (Q3), and maximum rating spreads per product.
            </p>
          </div>
        </div>

        {/* Custom Visual Box Plot Table/Chart */}
        <div className="space-y-4 pt-4">
          {ratings.product_distributions.map((item) => {
            // Scale 1 to 5 to percentages 0% to 100%
            const minPos = ((item.min_rating - 1) / 4) * 100;
            const q1Pos = ((item.q1 - 1) / 4) * 100;
            const medPos = ((item.median - 1) / 4) * 100;
            const q3Pos = ((item.q3 - 1) / 4) * 100;
            const maxPos = ((item.max_rating - 1) / 4) * 100;
            const boxWidth = Math.max(2, q3Pos - q1Pos);

            return (
              <div key={item.product_id} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white">{item.product_name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Mean: <strong className="text-amber-400">{item.average_rating}</strong> ★ &bull;{' '}
                    Median: <strong className="text-cyan-400">{item.median}</strong> &bull;{' '}
                    Range: [{item.min_rating} - {item.max_rating}] ({item.review_count} revs)
                  </span>
                </div>

                {/* Box Plot Bar Line */}
                <div className="relative h-6 bg-[#0B101D] rounded-lg border border-slate-800 overflow-hidden">
                  {/* Scale lines at 1, 2, 3, 4, 5 */}
                  <div className="absolute inset-0 flex justify-between px-2 text-[9px] text-slate-600 pointer-events-none select-none">
                    <span>1.0</span>
                    <span>2.0</span>
                    <span>3.0</span>
                    <span>4.0</span>
                    <span>5.0</span>
                  </div>

                  {/* Whisker Line (min to max) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-600"
                    style={{ left: `${minPos}%`, width: `${maxPos - minPos}%` }}
                  />

                  {/* Interquartile Box (Q1 to Q3) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-cyan-500/30 border border-cyan-400/80 rounded"
                    style={{ left: `${q1Pos}%`, width: `${boxWidth}%` }}
                  />

                  {/* Median Line */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4.5 bg-amber-400 rounded-full shadow"
                    style={{ left: `${medPos}%` }}
                    title={`Median: ${item.median}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Product Comparison Bar Chart & Sentiment Proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Rating by Product */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Product Average Rating Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked satisfaction scores across all catalog items</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={ratings.product_distributions}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} stroke="#64748B" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  stroke="#64748B"
                  fontSize={11}
                  width={110}
                  tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 14)}...` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-white">{d.product_name}</p>
                          <p className="text-amber-400 font-semibold mt-1">Average: {d.average_rating} ★</p>
                          <p className="text-slate-400">Total Reviews: {d.review_count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="average_rating" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                  {ratings.product_distributions.map((_, idx) => (
                    <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Across Ratings (Stacked Bar) */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Sentiment Polarity by Star Rating</h3>
          <p className="text-xs text-slate-400 mb-4">Correlation between customer star score and VADER sentiment label</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sentiment?.sentiment_by_rating || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rating" tickFormatter={(v) => `${v} ★`} stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0B101D] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-white">{d.rating} Stars ({d.total} total)</p>
                          <p className="text-emerald-400 mt-1">Positive: {d.positive} ({d.positive_pct}%)</p>
                          <p className="text-amber-400">Neutral: {d.neutral}</p>
                          <p className="text-rose-400">Negative: {d.negative} ({d.negative_pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="positive" name="Positive" stackId="a" fill="#10B981" />
                <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#F59E0B" />
                <Bar dataKey="negative" name="Negative" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Time-Series Analysis & Optional Trend Forecasting */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Temporal Review Acquisition & Trend Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Review volume over time, 7-period Simple Moving Average (SMA), and cautious linear trend projections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
              />
              <span className="font-semibold text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Toggle 5-Period Forecast
              </span>
            </label>
          </div>
        </div>

        {/* Forecast status banner */}
        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs flex items-start gap-2.5 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Forecasting Status: </span>
            {trends?.forecast_message}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedTrendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
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
                        <p className="font-bold text-white">
                          {formatDate(d.date)}{' '}
                          {d.is_forecast && <span className="text-purple-400">(Forecast)</span>}
                        </p>
                        <p className="text-cyan-400 font-bold mt-1">Review Volume: {d.review_count}</p>
                        <p className="text-amber-400">Avg Rating: {d.average_rating} ★</p>
                        {d.sma_7 !== null && d.sma_7 !== undefined && (
                          <p className="text-violet-400">7-period SMA: {d.sma_7}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="review_count"
                name="Observed Volume"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trendGradient)"
              />
              <Line
                type="monotone"
                dataKey="sma_7"
                name="7-period Moving Average"
                stroke="#A855F7"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
