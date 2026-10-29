import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTimetable();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        const toastVariantClass = isSuccess
          ? 'blockflow-toast-success bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-600/50 text-emerald-950 dark:text-emerald-100'
          : isWarning
          ? 'blockflow-toast-warning bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-600/50 text-amber-950 dark:text-amber-100'
          : isError
          ? 'blockflow-toast-error bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-600/50 text-rose-950 dark:text-rose-100'
          : 'blockflow-toast-info bg-sky-50 dark:bg-slate-900/95 border-sky-300 dark:border-slate-700/60 text-sky-950 dark:text-slate-100';

        const iconClass = isSuccess
          ? 'toast-icon text-emerald-600 dark:text-emerald-400'
          : isWarning
          ? 'toast-icon text-amber-600 dark:text-amber-400'
          : isError
          ? 'toast-icon text-rose-600 dark:text-rose-400'
          : 'toast-icon text-sky-600 dark:text-sky-400';

        const closeClass = isSuccess
          ? 'toast-close text-emerald-700/70 hover:text-emerald-950 hover:bg-emerald-100/70 dark:text-emerald-300/70 dark:hover:text-emerald-100 dark:hover:bg-white/10'
          : isWarning
          ? 'toast-close text-amber-700/70 hover:text-amber-950 hover:bg-amber-100/70 dark:text-amber-300/70 dark:hover:text-amber-100 dark:hover:bg-white/10'
          : isError
          ? 'toast-close text-rose-700/70 hover:text-rose-950 hover:bg-rose-100/70 dark:text-rose-300/70 dark:hover:text-rose-100 dark:hover:bg-white/10'
          : 'toast-close text-sky-700/70 hover:text-sky-950 hover:bg-sky-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10';

        return (
          <div
            key={toast.id}
            className={`blockflow-toast pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in ${toastVariantClass}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isSuccess && <CheckCircle2 className={`w-5 h-5 shrink-0 ${iconClass}`} />}
              {isWarning && <AlertCircle className={`w-5 h-5 shrink-0 ${iconClass}`} />}
              {isError && <AlertCircle className={`w-5 h-5 shrink-0 ${iconClass}`} />}
              {!isSuccess && !isWarning && !isError && <Info className={`w-5 h-5 shrink-0 ${iconClass}`} />}
              <span className="toast-text text-sm font-semibold tracking-normal leading-snug break-words">
                {toast.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${closeClass}`}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
