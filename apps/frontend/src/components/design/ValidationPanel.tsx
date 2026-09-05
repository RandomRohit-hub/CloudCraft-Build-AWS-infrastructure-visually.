import { useState } from 'react';
import type { ValidationReport } from '@/design/types';

interface ValidationPanelProps {
  report: ValidationReport;
  isOpen: boolean;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
}

export function ValidationPanel({ report, isOpen, onClose, onFocusNode }: ValidationPanelProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'recommendations' | 'passed'>('issues');

  if (!isOpen) return null;

  const { score, passedChecks, issues, recommendations } = report;

  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;

  const scoreColor =
    score >= 85 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="absolute bottom-0 left-72 right-80 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all max-h-[380px] flex flex-col">
      {/* Panel Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          {/* Health Score Gauge */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center h-9 px-3 rounded-lg font-bold text-sm shadow-sm"
              style={{
                backgroundColor: `${scoreColor}15`,
                color: scoreColor,
                border: `1px solid ${scoreColor}40`,
              }}
            >
              <span className="text-base mr-1">{score}</span>
              <span className="text-xs opacity-75">/ 100</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                Architecture Health
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {issues.length === 0
                  ? 'All best practice checks passed'
                  : `${errorCount} errors, ${warningCount} warnings`}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'issues'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span>Issues</span>
              {issues.length > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: errorCount > 0 ? '#ef444420' : '#f59e0b20',
                    color: errorCount > 0 ? '#ef4444' : '#f59e0b',
                  }}
                >
                  {issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'recommendations'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span>Recommendations</span>
              {recommendations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                  {recommendations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('passed')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'passed'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span>Passed Checks ({passedChecks.length})</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Tab 1: Issues List */}
        {activeTab === 'issues' && (
          <div>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Architecture Issues Detected</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                  Your diagram adheres to standard AWS security, networking, and tier-isolation practices.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => issue.nodeIds[0] && onFocusNode(issue.nodeIds[0])}
                    className={`p-3 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${
                      issue.severity === 'ERROR'
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 hover:border-red-400'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {issue.severity === 'ERROR' ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {issue.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 hover:text-violet-500">
                        Focus Node →
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                      <span>Recommendation: </span>
                      <span className="text-slate-700 dark:text-slate-300 font-normal">{issue.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recommendations List */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recommendations at this time.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-violet-200/60 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-950/15 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        {rec.title}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                        {rec.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {rec.description}
                    </p>

                    {rec.architectureDiagram && (
                      <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] space-y-0.5">
                        {rec.architectureDiagram.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    )}

                    <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                      {rec.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-violet-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Passed Checks */}
        {activeTab === 'passed' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {passedChecks.map((chk, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  ✓
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{chk}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
