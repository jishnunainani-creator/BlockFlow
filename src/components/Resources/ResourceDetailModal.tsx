import React, { useState, useEffect } from 'react';
import { ResourceItem } from '../../types/resources';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Star,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ResourceDetailModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenLink: (resource: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenLink,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(resource.examplePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs"
              style={{
                borderColor: `${resource.accentColor}40`,
                backgroundColor: `${resource.accentColor}12`,
                color: resource.accentColor,
              }}
            >
              {resource.monogram}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="resource-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {resource.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
                  {resource.categoryLabel}
                </span>
                {resource.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-[#2563EB] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    {resource.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                {resource.pricing}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(resource.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Overview */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overview
            </h4>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Best For & Primary Use Cases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Best For</span>
              </h5>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {resource.bestFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#2563EB] dark:text-indigo-400" />
                <span>Primary Use Cases</span>
              </h5>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {resource.primaryUseCases.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Example Prompt / "What to ask it" */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>What to ask it (Example Task)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                title="Copy prompt text to clipboard"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 leading-relaxed text-[11px] select-all">
              "{resource.examplePrompt}"
            </p>
          </div>

          {/* Strengths & Limitations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white">Strengths</h5>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {resource.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white">Limitations</h5>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {resource.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">!</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Academic & Verification Guidance */}
          {resource.guidance && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5 text-amber-950 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[11px] block">Verification &amp; Academic Guidance</span>
                <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                  {resource.guidance}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 rounded-b-2xl flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
            Official website: <span className="font-mono text-slate-700 dark:text-slate-300">{resource.url}</span>
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onOpenLink(resource)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Open {resource.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
