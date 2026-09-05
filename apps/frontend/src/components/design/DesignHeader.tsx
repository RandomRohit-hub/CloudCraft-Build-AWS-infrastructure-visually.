import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '@/lib/useDarkMode';
import { GITHUB_ICON_PATH } from '@/lib/constants';
import { STARTER_TEMPLATES } from '@/design/templates';

interface DesignHeaderProps {
  architectureName: string;
  region: string;
  score: number;
  issueCount: number;
  beginnerMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isValidating: boolean;
  onUpdateMeta: (meta: { name?: string; region?: string }) => void;
  onNew: () => void;
  onLoadTemplate: (templateId: string) => void;
  onSave: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleValidate: () => void;
  onToggleBeginnerMode: () => void;
  onClearCanvas: () => void;
}

const REGIONS = [
  { id: 'us-east-1', label: 'US East (N. Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'eu-west-1', label: 'EU (Ireland)' },
  { id: 'eu-central-1', label: 'EU (Frankfurt)' },
  { id: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { id: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

export function DesignHeader({
  architectureName,
  region,
  score,
  issueCount,
  beginnerMode,
  canUndo,
  canRedo,
  isValidating,
  onUpdateMeta,
  onNew,
  onLoadTemplate,
  onSave,
  onExportJson,
  onImportJson,
  onUndo,
  onRedo,
  onToggleValidate,
  onToggleBeginnerMode,
  onClearCanvas,
}: DesignHeaderProps) {
  const [dark, toggleTheme] = useDarkMode();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(architectureName);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      onUpdateMeta({ name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportJson(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveClick = () => {
    onSave();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const scoreColor = score >= 85 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Hidden file input for importing JSON */}
      <input ref={fileInputRef} type="file" accept=".json,.CloudCraft.json" onChange={handleFileChange} className="hidden" />

      {/* Left section: Logo + Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {/* CloudCraft Logo Mark */}
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-600 shadow-sm shadow-orange-500/40">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-white">
            Cloud<span className="text-orange-400">Craft</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-800">
            Design
          </span>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          <Link
            to="/"
            className="px-2.5 py-1 rounded-md text-neutral-500 hover:text-white transition-colors"
          >
            Visualize
          </Link>
          <span className="px-2.5 py-1 rounded-md bg-neutral-800 text-orange-400 font-bold shadow-sm">
            Design
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        {/* Architecture Title & Region Selector */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
              className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-900 border border-orange-600 text-neutral-200 focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setNameInput(architectureName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-xs font-semibold text-neutral-200 max-w-[180px] truncate group transition-colors"
              title="Click to rename architecture"
            >
              <span className="truncate">{architectureName}</span>
              <svg className="h-3 w-3 text-neutral-600 group-hover:text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}

          {/* Region Dropdown */}
          <select
            value={region}
            onChange={(e) => onUpdateMeta({ region: e.target.value })}
            className="text-[11px] font-mono rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} · {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle/Right Actions: Undo/Redo, Templates, Export/Import, Validate, Beginner Toggle */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
          </button>
        </div>

        {/* Starter Templates */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates((v) => !v)}
            onBlur={() => setTimeout(() => setShowTemplates(false), 200)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <span>Templates</span>
            <svg className="h-3 w-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl shadow-black/50 py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-600 tracking-wider">
                Starter Architectures
              </div>
              {STARTER_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onMouseDown={() => {
                    onLoadTemplate(tpl.id);
                    setShowTemplates(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 transition-colors"
                >
                  <p className="text-xs font-semibold text-neutral-200">{tpl.name}</p>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{tpl.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New / Clear */}
        <button
          onClick={onNew}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          title="New blank canvas"
        >
          New
        </button>

        {/* Clear */}
        <button
          onClick={onClearCanvas}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          title="Clear all nodes from canvas"
        >
          Clear
        </button>

        {/* Save */}
        <button
          onClick={handleSaveClick}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          title="Save architecture to local storage"
        >
          {showSaveToast ? <span className="text-emerald-500 font-bold">Saved!</span> : 'Save'}
        </button>

        {/* Export / Import Dropdown */}
        <button
          onClick={onExportJson}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          title="Download architecture JSON"
        >
          Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          title="Upload architecture JSON"
        >
          Import
        </button>

        {/* Validate Architecture Button with Health Score */}
        <button
          onClick={onToggleValidate}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
            isValidating
              ? 'bg-orange-950/40 border-orange-600 text-orange-300'
              : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-orange-600'
          }`}
          title="Run architecture validation"
        >
          <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span>Validate</span>
          <span
            className="px-1.5 py-0.2 rounded-full font-bold text-[10px]"
            style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
          >
            {score}{issueCount > 0 ? ` (${issueCount})` : ''}
          </span>
        </button>

        {/* Beginner Mode Toggle */}
        <button
          onClick={onToggleBeginnerMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            beginnerMode
              ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
              : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500'
          }`}
          title="Toggle Beginner Assist Mode"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 10-6 0 3 3 0 006 0z" />
          </svg>
          <span className="hidden xl:inline">{beginnerMode ? 'Beginner ON' : 'Beginner'}</span>
        </button>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* External Links: Docs & GitHub */}
        <Link
          to="/docs"
          className="px-2 py-1 text-xs text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          Docs
        </Link>
        <a
          href="https://github.com/manimovassagh/CloudCraft"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          title="GitHub"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d={GITHUB_ICON_PATH} />
          </svg>
        </a>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
