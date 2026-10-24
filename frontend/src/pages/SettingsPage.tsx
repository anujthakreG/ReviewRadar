import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Trash2,
  Sparkles,
  Server,
  Code,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface SettingsPageProps {
  onDataChanged: () => void;
  onLoadSample: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onDataChanged,
  onLoadSample,
}) => {
  const [health, setHealth] = useState<{ status: string; project: string; version: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      setLoading(true);
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };
    checkApi();
  }, []);

  const handleResetDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear all imported reviews and products? This action will reset SQLite to an empty state.')) {
      return;
    }
    setResetting(true);
    setStatusMessage(null);
    try {
      await api.resetDatabase();
      setStatusMessage({ type: 'success', text: 'Database successfully cleared.' });
      onDataChanged();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset database.' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. API Health & Server Connection */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" /> Backend Infrastructure & Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">API Health Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className="text-sm font-bold text-white">
                {health?.status === 'healthy' ? 'Online (Healthy)' : 'Unreachable'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Backend Engine</span>
            <span className="text-sm font-bold text-white">FastAPI + Python 3.13</span>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Interactive API Docs</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
            >
              Open Swagger /docs <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Dataset Management */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" /> Database & Storage Management
        </h3>
        <p className="text-xs text-slate-400">
          Manage local SQLite records. ReviewRadar stores validated products, reviews, and import job logs locally in <code>reviewradar.db</code>.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Load Synthetic Sample Dataset
          </button>

          <button
            onClick={handleResetDatabase}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Reset / Clear Database
          </button>
        </div>
      </div>

      {/* 3. Sentiment Methodology & Limitations Documentation */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-violet-400" /> VADER Sentiment Methodology & Limitations
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            ReviewRadar utilizes <strong>VADER (Valence Aware Dictionary and sEntiment Reasoner)</strong>, a rule-based model specifically tuned for customer sentiment in commercial and social domains.
          </p>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
            <p className="text-slate-400 font-sans font-bold">Standard Decision Thresholds:</p>
            <p className="text-emerald-400">&bull; Positive Sentiment: compound_score &ge; +0.05</p>
            <p className="text-amber-400">&bull; Neutral Sentiment: -0.05 &lt; compound_score &lt; +0.05</p>
            <p className="text-rose-400">&bull; Negative Sentiment: compound_score &le; -0.05</p>
          </div>

          <h4 className="text-xs font-bold text-white pt-2">Known Technical Limitations:</h4>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>
              <strong>Sarcasm & Irony:</strong> Lexicon matching cannot detect subtle sarcasm (e.g., <em>"Great, it broke on day one!"</em> might score artificially positive).
            </li>
            <li>
              <strong>Mixed Sentiments:</strong> Reviews featuring balanced pros and cons can yield neutral compound scores even when highlighting specific severe bugs.
            </li>
            <li>
              <strong>Language Support:</strong> VADER is optimized for the English language; non-English or heavily regional slang may experience reduced classification fidelity.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. College Project Information */}
      <div className="bg-[#131D31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Academic Project Specification
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>ReviewRadar</strong> is built as an end-to-end full-stack data analytics platform demonstrating professional software architecture, relational data modeling with SQLite/SQLAlchemy, reproducible Pandas data cleaning pipelines, natural language processing, and interactive visualization in React/TypeScript.
        </p>
      </div>
    </div>
  );
};
