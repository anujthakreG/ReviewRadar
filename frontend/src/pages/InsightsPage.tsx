import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  ShieldAlert,
  Tag,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { InsightsReport } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface InsightsPageProps {
  onLoadSample: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onLoadSample }) => {
  const [report, setReport] = useState<InsightsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getInsights();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate business insights.');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) return <LoadingSpinner message="Extracting text frequencies and synthesizing business insights..." />;

  if (error || !report || report.insights.length === 0) {
    return (
      <EmptyState
        title="No Insights Generated Yet"
        description="Business insights are dynamically deduced once review records are imported into the analytics pipeline."
        actionLabel="Load Sample Dataset"
        onAction={onLoadSample}
      />
    );
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'moderate':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'limited evidence':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'positive':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'benchmark':
      default:
        return <Lightbulb className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Dataset Reliability Assessment Banner */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Automated Intelligence Overview</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">{report.reliability_assessment.summary}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Statistical Confidence
            </span>
            <span
              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${getConfidenceBadge(
                report.reliability_assessment.confidence_level
              )}`}
            >
              {report.reliability_assessment.confidence_level} Confidence
            </span>
          </div>
        </div>
      </div>

      {/* 2. Structured Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {report.insights.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-150"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getConfidenceBadge(
                    item.confidence
                  )}`}
                >
                  {item.confidence}
                </span>
              </div>

              <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{item.detail}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-400">Calculation Basis: </span>
              {item.calculation_basis}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Negative and Positive Keyword Extraction Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Negative Keyword Cloud / List */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-base font-bold text-white">Recurring Pain Points (Negative Reviews)</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Most frequent non-stopword tokens extracted from reviews classified as Negative by VADER NLP.
          </p>

          <div className="flex flex-wrap gap-2">
            {report.common_negative_terms && report.common_negative_terms.length > 0 ? (
              report.common_negative_terms.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  <Tag className="w-3 h-3 text-rose-400" />
                  <strong className="text-white">{t.word}</strong>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded-full">
                    {t.count}
                  </span>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No negative recurring terms detected.</p>
            )}
          </div>
        </div>

        {/* Positive Keyword Cloud / List */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Key Drivers of Delight (Positive Reviews)</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Most frequent non-stopword tokens extracted from reviews classified as Positive by VADER NLP.
          </p>

          <div className="flex flex-wrap gap-2">
            {report.common_positive_terms && report.common_positive_terms.length > 0 ? (
              report.common_positive_terms.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <strong className="text-white">{t.word}</strong>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-full">
                    {t.count}
                  </span>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No positive recurring terms detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
