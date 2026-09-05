import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DesignNode, SecurityGroupRule } from '@/design/types';
import { SecurityGroupIcon } from '@/components/nodes/icons/AwsIcons';

export interface DesignSgNodeData {
  node: DesignNode;
  isHighlighted?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
}

export const DesignSecurityGroupNode = memo(function DesignSecurityGroupNode({
  data,
  selected,
}: NodeProps<DesignSgNodeData>) {
  const { node, isHighlighted, hasError, hasWarning } = data;
  const rules = (node.config.rules as SecurityGroupRule[]) || [];
  const themeColor = '#DD344C';

  let ringStyle = '';
  if (isHighlighted) {
    ringStyle = 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse';
  } else if (selected) {
    ringStyle = 'ring-2 ring-offset-1 ring-offset-slate-900';
  }

  return (
    <div
      className={`relative flex flex-col min-w-[240px] max-w-[290px] rounded-xl border bg-white dark:bg-slate-900 shadow-md transition-all ${ringStyle}`}
      style={{
        borderColor: selected ? themeColor : 'rgba(221, 52, 76, 0.4)',
        borderLeftWidth: '5px',
        borderLeftColor: themeColor,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800"
        style={{ backgroundColor: themeColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800"
        style={{ backgroundColor: themeColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 p-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DD344C]/15 border border-[#DD344C]/30">
          <SecurityGroupIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {node.name}
            </p>
            {hasError ? (
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            ) : hasWarning ? (
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
          <p className="text-[10px] font-medium text-[#DD344C]">Virtual Firewall</p>
        </div>
      </div>

      {/* Inbound Rules Table Preview */}
      <div className="p-3 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Inbound Rules ({rules.length})
          </span>
        </div>

        {rules.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">No inbound rules (deny all)</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {rules.slice(0, 4).map((r) => {
              const isDatabasePort = ['5432', '3306', '1433', '1521'].includes(String(r.portRange));
              const isSshPort = String(r.portRange) === '22';
              const isOpenSource = r.source === '0.0.0.0/0' || r.source === '::/0';
              const isHighRisk = isOpenSource && (isDatabasePort || isSshPort);

              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-1.5 rounded text-[11px] border ${
                    isHighRisk
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1 font-mono font-medium">
                    <span className="uppercase text-[9px] text-slate-500 dark:text-slate-400">{r.protocol}</span>
                    <span>:{r.portRange}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[120px]">
                    <span className="text-[10px] truncate text-slate-500 dark:text-slate-400">
                      {r.source}
                    </span>
                    {isHighRisk && (
                      <span className="shrink-0 text-[8px] font-extrabold uppercase px-1 rounded bg-red-600 text-white">
                        RISK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {rules.length > 4 && (
              <p className="text-[10px] text-slate-400 text-right">+{rules.length - 4} more rules</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
