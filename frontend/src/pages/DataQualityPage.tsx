import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  FileQuestion,
  Slash,
  CalendarX,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { DataQualityReport } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface DataQualityPageProps {
  onLoadSample: () => void;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({ onLoadSample }) => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDataQualityReport();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data quality audit.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <LoadingSpinner message="Auditing schema conformity and integrity checks..." />;

  if (error || !report || report.total_rows_processed === 0) {
    return (
      <EmptyState
        title="No Data Quality Records"
        description="Data quality auditing is computed automatically whenever review files or sample datasets are ingested into ReviewRadar."
        actionLabel="Load Sample Dataset"
        onAction={onLoadSample}
      />
    );
  }

  const score = report.quality_score;
  const scoreColor =
    score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-cyan-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Overall Quality Gauge & High-level Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Score Card */}
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center w-28 h-28 mb-3">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                stroke="#1E293B"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={289}
                strokeDashoffset={289 - (289 * score) / 100}
                strokeLinecap="round"
                fill="none"
                className={scoreColor}
              />
            </svg>
            <span className={`absolute text-2xl font-black ${scoreColor}`}>{score}%</span>
          </div>
          <h3 className="text-sm font-bold text-white">Dataset Quality Index</h3>
          <p className="text-xs text-slate-400 mt-1">Multi-factor hygiene score</p>
        </div>

        {/* Breakdown KPIs (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Total Rows Examined
            </div>
            <p className="text-2xl font-bold text-white">{report.total_rows_processed}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ingested across all uploads</p>
          </div>

          <div className="bg-[#131D31] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4" /> Valid Records
            </div>
            <p className="text-2xl font-bold text-emerald-400">{report.valid_rows}</p>
            <p className="text-[11px] text-slate-400 mt-1">Passed schema validation</p>
          </div>

          <div className="bg-[#131D31] border border-rose-500/20 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 text-xs mb-1">
              <AlertTriangle className="w-4 h-4" /> Rejected Rows
            </div>
            <p className="text-2xl font-bold text-rose-400">{report.rejected_rows}</p>
            <p className="text-[11px] text-slate-400 mt-1">Safely flagged and excluded</p>
          </div>

          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <Copy className="w-4 h-4" /> Duplicate Records
            </div>
            <p className="text-2xl font-bold text-white">{report.duplicate_rows}</p>
            <p className="text-[11px] text-slate-500 mt-1">Identical hash or duplicate ID</p>
          </div>

          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <FileQuestion className="w-4 h-4" /> Missing Ratings
            </div>
            <p className="text-2xl font-bold text-white">{report.missing_ratings}</p>
            <p className="text-[11px] text-slate-500 mt-1">Refused arbitrary imputation</p>
          </div>

          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <Slash className="w-4 h-4" /> Missing Review Text
            </div>
            <p className="text-2xl font-bold text-white">{report.missing_text}</p>
            <p className="text-[11px] text-slate-500 mt-1">Blank or whitespace content</p>
          </div>
        </div>
      </div>

      {/* 2. Before vs After Cleaning Comparison Cards */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-2">Before vs. After Cleaning Transformation</h3>
        <p className="text-xs text-slate-400 mb-6">
          Quantifiable evidence of the Pandas data cleansing pipeline standardizing messy external files into clean database relations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Card */}
          <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">
              Before Cleaning (Raw Ingestion)
            </span>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Total Raw Rows Ingested:</span>
                <span className="font-mono font-bold text-white">
                  {report.before_after_comparison.before.total_rows}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Problematic / Unclean Records:</span>
                <span className="font-mono font-bold text-rose-400">
                  {report.before_after_comparison.before.unclean_or_problematic_rows}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Raw Data Validity:</span>
                <span className="font-mono font-bold text-amber-400">
                  {report.before_after_comparison.before.data_integrity}%
                </span>
              </li>
            </ul>
          </div>

          {/* After Card */}
          <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
              After Cleaning (SQLite Production Table)
            </span>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Active Clean Database Rows:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {report.before_after_comparison.after.clean_rows_in_database}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Database Schema Conformity:</span>
                <span className="font-mono font-bold text-emerald-400">100% Conforming</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Active Data Validity:</span>
                <span className="font-mono font-bold text-emerald-400">100.0% Clean</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Plain Language Explanations of Pipeline Rules */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> Pipeline Sanitization Rules & Impact
          </h3>
          <p className="text-xs text-slate-400">
            Transparent methodology explaining every condition monitored by the ReviewRadar cleansing engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {report.issue_explanations.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{item.issue_type}</h4>
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {item.count} detected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                <strong className="text-slate-300">Analytical Impact:</strong> {item.impact}
              </p>
              <p className="text-[11px] text-slate-400">
                <strong className="text-slate-300">Enforced Rule:</strong> {item.rule_applied}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Problematic Rows Preview Table */}
      {report.problematic_rows_sample && report.problematic_rows_sample.length > 0 && (
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <h3 className="text-base font-bold text-white mb-1">Problematic Rows Sample Audit</h3>
          <p className="text-xs text-slate-400 mb-4">
            Snapshot of rejected records demonstrating exact validation failures and excluded payloads.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Identified Violations</th>
                  <th className="py-2.5 px-3">Raw Content Excerpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                {report.problematic_rows_sample.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3 font-bold text-amber-400">#{row.row_number}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-sans font-medium">
                      {row.reasons.join(' • ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-md truncate" title={JSON.stringify(row.raw_data)}>
                      {JSON.stringify(row.raw_data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
