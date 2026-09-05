import type { ConnectionCheckResult } from '@/design/rules/relationships';

interface InvalidConnectionModalProps {
  checkResult: ConnectionCheckResult | null;
  onClose: () => void;
}

export function InvalidConnectionModal({ checkResult, onClose }: InvalidConnectionModalProps) {
  if (!checkResult || checkResult.valid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {checkResult.title ?? 'Invalid Connection'}
            </h3>
            <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">
              AWS Architecture Rule Violation
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {checkResult.reason}
        </div>

        {/* Recommended Path */}
        {checkResult.recommendedPath && checkResult.recommendedPath.length > 0 && (
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Recommended Architecture Path:
            </span>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 flex flex-col items-center space-y-1">
              {checkResult.recommendedPath.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 shadow-sm border border-slate-200/60 dark:border-slate-600 font-semibold">
                    {step}
                  </span>
                  {idx < checkResult.recommendedPath!.length - 1 && (
                    <span className="text-violet-500 font-bold py-0.5">↓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Practice Advice */}
        {checkResult.recommendation && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
            <span className="font-semibold text-slate-700 dark:text-slate-300 not-italic">Advice: </span>
            {checkResult.recommendation}
          </p>
        )}

        {/* Dismiss Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
