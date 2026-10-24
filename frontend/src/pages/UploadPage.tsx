import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  Table,
  Check,
  X,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { PreviewResponse, ImportSummary } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface UploadPageProps {
  onImportComplete: () => void;
  onLoadSample: () => void;
}

const STANDARD_FIELDS = [
  { key: 'product_name', label: 'Product Name', required: true, desc: 'Name of the product/item' },
  { key: 'rating', label: 'Star Rating', required: true, desc: 'Numeric rating (e.g., 1.0 to 5.0)' },
  { key: 'review_text', label: 'Review Text', required: true, desc: 'Full review commentary for sentiment analysis' },
  { key: 'review_title', label: 'Review Title', required: false, desc: 'Headline or summary' },
  { key: 'review_date', label: 'Review Date', required: false, desc: 'Date of review creation' },
  { key: 'reviewer_name', label: 'Reviewer Name', required: false, desc: 'Customer name or username' },
  { key: 'verified_purchase', label: 'Verified Purchase', required: false, desc: 'Boolean or yes/no verification' },
  { key: 'review_id', label: 'Review ID', required: false, desc: 'External unique review ID' },
  { key: 'product_id', label: 'Product ID', required: false, desc: 'External product SKU or ASIN' },
];

export const UploadPage: React.FC<UploadPageProps> = ({
  onImportComplete,
  onLoadSample,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [scaleMin, setScaleMin] = useState(1.0);
  const [scaleMax, setScaleMax] = useState(5.0);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setImportResult(null);

    // Client-side extension check
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      setError('Unsupported file type. Please upload a CSV, Excel (.xlsx), or JSON file.');
      return;
    }

    // Size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    setLoadingPreview(true);

    try {
      const previewData = await api.previewUpload(file);
      setPreview(previewData);
      setMapping(previewData.suggested_mapping || {});
    } catch (err: any) {
      setError(err.message || 'Failed to parse file preview.');
      setSelectedFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);

    try {
      const summary = await api.importReviews(selectedFile, mapping, scaleMin, scaleMax);
      setImportResult(summary);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete dataset ingestion.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setMapping({});
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top action cards: Load Sample Data & Download CSV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#131D31] border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="pr-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Pre-built Synthetic Dataset
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Test data cleaning with 35 sample reviews across 5 gadgets, featuring deliberate duplicates and outliers.
            </p>
          </div>
          <button
            onClick={onLoadSample}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shrink-0 transition-colors shadow-md shadow-cyan-600/30"
          >
            Load Sample
          </button>
        </div>

        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="pr-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-400" />
              Download CSV Template
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Download the clean standard CSV structure formatted with standard ReviewRadar columns.
            </p>
          </div>
          <a
            href={api.downloadSampleCsvUrl()}
            download="sample_reviews.csv"
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl shrink-0 border border-slate-700 transition-colors"
          >
            Download CSV
          </a>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span> {error}
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Drag & Drop Upload Zone (when no file is loaded) */}
      {!preview && !importResult && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/5 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-[#131D31]/40 hover:bg-[#131D31]/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".csv, .xlsx, .xls, .json"
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            Drag & drop your review dataset here
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Supports CSV, Microsoft Excel (.xlsx), and JSON array files up to 10 MB.
          </p>

          <span className="inline-block px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
            Browse Local File
          </span>
        </div>
      )}

      {loadingPreview && <LoadingSpinner message="Inspecting dataset structure and detecting columns..." />}

      {/* Step 2: Preview, Column Mapping, and Rating Scale Settings */}
      {preview && !importResult && (
        <div className="space-y-6">
          {/* File summary pill */}
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{preview.filename}</h4>
                <p className="text-xs text-slate-400">
                  Detected <span className="text-cyan-400 font-semibold">{preview.total_rows_detected}</span> rows &bull;{' '}
                  <span className="text-slate-300 font-semibold">{preview.detected_columns.length}</span> columns
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              Choose Different File
            </button>
          </div>

          {/* Pre-import Health Check Warning/Pass */}
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" /> Pre-Import Hygiene Scan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <p className="text-slate-400">Total Rows Detected</p>
                <p className="text-base font-bold text-white mt-1">{preview.total_rows_detected}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <p className="text-slate-400">Estimated Missing Ratings</p>
                <p className={`text-base font-bold mt-1 ${preview.preliminary_quality.missing_ratings_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {preview.preliminary_quality.missing_ratings_count} rows
                </p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <p className="text-slate-400">Estimated Missing Review Text</p>
                <p className={`text-base font-bold mt-1 ${preview.preliminary_quality.missing_text_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {preview.preliminary_quality.missing_text_count} rows
                </p>
              </div>
            </div>
          </div>

          {/* Column Mapping Interface */}
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Column Mapping & Normalization
                </h4>
                <p className="text-xs text-slate-400">
                  ReviewRadar automatically matched the fields below. Adjust if your file uses custom headers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STANDARD_FIELDS.map((field) => {
                const currentMapped = mapping[field.key] || '';
                return (
                  <div
                    key={field.key}
                    className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{field.label}</span>
                        {field.required && (
                          <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{field.desc}</p>
                    </div>

                    <select
                      value={currentMapped}
                      onChange={(e) =>
                        setMapping({
                          ...mapping,
                          [field.key]: e.target.value === '' ? null : e.target.value,
                        })
                      }
                      className="bg-[#0B101D] border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">-- Not Mapped --</option>
                      {preview.detected_columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating Scale Configuration */}
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-2">Rating Boundary Validation</h4>
            <p className="text-xs text-slate-400 mb-4">
              Specify the acceptable star rating interval. Reviews falling outside these bounds will be safely rejected and flagged.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Min Rating:</span>
                <input
                  type="number"
                  step="0.5"
                  value={scaleMin}
                  onChange={(e) => setScaleMin(parseFloat(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Max Rating:</span>
                <input
                  type="number"
                  step="0.5"
                  value={scaleMax}
                  onChange={(e) => setScaleMax(parseFloat(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
              </div>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                Standard Scale [{scaleMin} - {scaleMax}]
              </span>
            </div>
          </div>

          {/* Sample Rows Table Preview */}
          <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 overflow-hidden">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" /> First 5 Rows Preview
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    {preview.detected_columns.map((c) => (
                      <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                  {preview.sample_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      {preview.detected_columns.map((c) => (
                        <td key={c} className="py-2 px-3 text-slate-300 max-w-xs truncate">
                          {row[c] !== null && row[c] !== undefined ? String(row[c]) : <span className="text-slate-600">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Confirm Button */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cleaning & Ingesting Dataset...
                </>
              ) : (
                <>
                  <span>Execute Data Cleaning & Import</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Post-Import Summary Card & Results */}
      {importResult && (
        <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import Execution Completed</h3>
              <p className="text-xs text-slate-400">
                File: <span className="font-semibold text-white">{importResult.filename}</span> &bull; Status:{' '}
                <span className="font-semibold text-emerald-400 uppercase">{importResult.status}</span>
              </p>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400">Rows Processed</p>
              <p className="text-2xl font-bold text-white mt-1">{importResult.rows_processed}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-semibold">Valid Clean Rows Imported</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{importResult.rows_imported}</p>
            </div>
            <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <p className="text-xs text-rose-400 font-semibold">Problematic Rows Rejected</p>
              <p className="text-2xl font-bold text-rose-300 mt-1">{importResult.rows_rejected}</p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <p className="text-xs text-amber-400 font-semibold">Duplicates Detected</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">{importResult.rows_duplicate}</p>
            </div>
          </div>

          {/* Breakdown of rejection reasons */}
          {importResult.issues_summary && Object.keys(importResult.issues_summary).length > 0 && (
            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Sanitization Reasons Audit
              </h4>
              <ul className="space-y-1.5 text-xs">
                {Object.entries(importResult.issues_summary).map(([reason, count]) => (
                  <li key={reason} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {reason}
                    </span>
                    <span className="font-mono font-bold text-rose-400">{count} row(s)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Problematic sample rows */}
          {importResult.rejected_rows_sample && importResult.rejected_rows_sample.length > 0 && (
            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Problematic Rows Sample
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">Row #</th>
                      <th className="py-2 px-2">Reasons</th>
                      <th className="py-2 px-2">Raw Data Snapshot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                    {importResult.rejected_rows_sample.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 text-amber-400 font-bold">#{item.row_number}</td>
                        <td className="py-2 px-2 text-rose-400 font-sans">{item.reasons.join(', ')}</td>
                        <td className="py-2 px-2 text-slate-400 max-w-md truncate">
                          {JSON.stringify(item.raw_data)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
