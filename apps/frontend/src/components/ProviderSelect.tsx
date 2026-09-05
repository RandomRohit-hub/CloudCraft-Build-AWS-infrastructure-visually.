import type { CloudProvider, ParseResponse } from '@CloudCraft/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from './Upload';
import { UserMenu } from './UserMenu';
import { GitHubConnectModal } from './GitHubConnectModal';
import { useDarkMode } from '@/lib/useDarkMode';
import { GITHUB_ICON_PATH, PROVIDER_COLORS } from '@/lib/constants';
import GatewayFlow from '@/components/ui/gateway-flow';

const samples: { id: CloudProvider; label: string; color: string; count: string }[] = [
  { id: 'aws', label: 'AWS', color: PROVIDER_COLORS.aws, count: '20+' },
  { id: 'azure', label: 'Azure', color: PROVIDER_COLORS.azure, count: '12+' },
  { id: 'gcp', label: 'GCP', color: PROVIDER_COLORS.gcp, count: '11+' },
];

interface ProviderSelectProps {
  onUpload: (files: File[], mode: 'tfstate' | 'hcl' | 'cfn' | 'cdk' | 'plan') => void;
  onTrySample: (provider: CloudProvider) => void;
  onTryCfnSample: () => void;
  onTryPlanSample: () => void;
  onGitHubParsed: (data: ParseResponse, fileName: string) => void;
}

export function ProviderSelect({ onUpload, onTrySample, onTryCfnSample, onTryPlanSample, onGitHubParsed }: ProviderSelectProps) {
  const [dark, toggleTheme] = useDarkMode();
  const [showGitHub, setShowGitHub] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* ── GatewayFlow Animated Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GatewayFlow
          className="w-full h-full"
          mode="dark"
          density={1.2}
          speed={0.9}
          opacity={1}
        />
      </div>

      {/* Dither noise overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 2 2' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='%23ffffff'/%3E%3Crect x='1' y='1' width='1' height='1' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: '2px 2px',
        }}
      />

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 relative z-20 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          {/* CloudCraft Logo */}
          <Link to="/" className="flex items-center gap-2 mr-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-600 shadow-md shadow-orange-500/30 group-hover:bg-orange-500 transition-colors">
              <svg className="w-4.5 h-4.5 text-white" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
            <span className="text-sm font-black tracking-tight text-white">
              Cloud<span className="text-orange-400">Craft</span>
            </span>
          </Link>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-200/80 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-800 text-xs font-semibold shadow-inner mr-2">
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm">
              Visualize
            </span>
            <Link
              to="/design"
              className="px-3 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Design Mode</span>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            </Link>
          </div>

          {[{ label: 'Docs', path: '/docs' }, { label: 'API', path: '/reference' }, { label: 'AI', path: '/ai' }].map(({ label, path }) => (
            <Link
              key={label}
              to={path}
              className="px-4 py-2 text-base font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/manimovassagh/CloudCraft"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d={GITHUB_ICON_PATH} />
            </svg>
            GitHub
          </a>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? (
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />
          <UserMenu />
        </div>
      </nav>

      {/* ── Hero: split layout ── */}
      <div className="flex-1 flex items-center relative z-20">
        <div className="max-w-7xl mx-auto w-full px-8 py-12 lg:py-0 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column: text + CTA */}
          <div className="flex flex-col items-start">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tight leading-none">
              <span className="text-white">Cloud</span><span className="text-orange-400">Craft</span>
            </h1>
            <p className="mt-5 text-xl font-medium text-neutral-300">
              Terraform, CloudFormation &amp; CDK to diagrams, instantly.
            </p>

            {/* Provider pills */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6">
              {samples.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-base font-medium"
                  style={{
                    backgroundColor: `${s.color}18`,
                    color: s.color,
                    border: `1px solid ${s.color}30`,
                  }}
                >
                  {s.label} {s.count}
                </span>
              ))}
            </div>

            {/* Upload drop zone */}
            <div className="w-full max-w-lg mt-8">
              <Upload onSubmit={onUpload} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Link
                to="/design"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md shadow-orange-500/30 transition-all hover:scale-[1.02]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Design AWS Architecture
              </Link>
              <button
                onClick={() => setShowGitHub(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-900/80 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d={GITHUB_ICON_PATH} />
                </svg>
                Connect GitHub Repo
              </button>
            </div>

            {/* Sample pill buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="text-sm text-neutral-400 font-medium">Try a sample:</span>
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onTrySample(s.id)}
                  className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: s.color }}
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={onTryCfnSample}
                className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#E7157B' }}
              >
                CloudFormation
              </button>
              <button
                onClick={onTryPlanSample}
                className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#f97316' }}
              >
                TF Plan
              </button>
            </div>
          </div>

          {/* Right column: product screenshot */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={dark ? '/preview-graph.png' : '/preview-light.png'}
              alt="CloudCraft architecture diagram preview"
              className="w-full max-w-lg rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-center gap-2 px-8 py-4 text-xs text-neutral-400 dark:text-neutral-600 relative z-10">
        <span className="font-mono">v2.2</span>
        <span>&middot;</span>
        <span className="font-medium">Open Source</span>
      </footer>

      {showGitHub && (
        <GitHubConnectModal
          onClose={() => setShowGitHub(false)}
          onParsed={(data, fileName) => {
            setShowGitHub(false);
            onGitHubParsed(data, fileName);
          }}
        />
      )}
    </main>
  );
}
