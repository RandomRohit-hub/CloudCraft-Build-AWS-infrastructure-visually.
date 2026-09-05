import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DesignNode } from '@/design/types';
import { CATALOG_BY_TYPE } from '@/design/catalog';

export interface DesignNodeData {
  node: DesignNode;
  isHighlighted?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
}

export const DesignResourceNode = memo(function DesignResourceNode({
  data,
  selected,
}: NodeProps<DesignNodeData>) {
  const { node, isHighlighted, hasError, hasWarning } = data;
  const catalogItem = CATALOG_BY_TYPE.get(node.type);
  const Icon = catalogItem?.icon;
  const color = catalogItem?.color ?? '#8b5cf6';

  // Extract a helpful subtitle / badge based on configuration
  let subtitle = catalogItem?.awsServiceName ?? node.type.toUpperCase();
  if (node.type === 'ec2' && node.config.instanceType) {
    subtitle = `EC2 · ${node.config.instanceType}`;
  } else if (node.type === 'rds' && node.config.engine) {
    subtitle = `RDS · ${node.config.engine}`;
  } else if (node.type === 'lambda' && node.config.runtime) {
    subtitle = `Lambda · ${node.config.runtime}`;
  } else if (node.type === 'ecs' && node.config.launchType) {
    subtitle = `ECS · ${node.config.launchType}`;
  } else if (node.type === 'alb' && node.config.scheme) {
    subtitle = `ALB · ${node.config.scheme}`;
  } else if (node.type === 'target_group' && node.config.protocol) {
    subtitle = `TG · ${node.config.protocol}:${node.config.port ?? 80}`;
  } else if (node.type === 'dynamodb' && node.config.billingMode) {
    subtitle = `DynamoDB · On-Demand`;
  } else if (node.type === 's3') {
    subtitle = `S3 Bucket`;
  }

  // Border & Glow styling
  let ringStyle = '';
  if (isHighlighted) {
    ringStyle = 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse';
  } else if (selected) {
    ringStyle = `ring-2 ring-offset-1 ring-offset-slate-900`;
  }

  return (
    <div
      className={`relative flex flex-col min-w-[210px] max-w-[260px] rounded-xl border bg-white dark:bg-slate-900 p-3.5 shadow-md transition-all ${ringStyle}`}
      style={{
        borderColor: selected ? color : 'rgba(148, 163, 184, 0.25)',
        borderLeftWidth: '5px',
        borderLeftColor: color,
      }}
    >
      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800 transition-transform hover:scale-125"
        style={{ backgroundColor: color }}
      />

      {/* Left handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800 transition-transform hover:scale-125"
        style={{ backgroundColor: color }}
      />

      {/* Content */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {node.name}
            </p>
            {hasError ? (
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title="Has error" />
            ) : hasWarning ? (
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" title="Has warning" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Configured" />
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Subnet / VPC placement badge if present */}
      {(node.config.subnet || node.config.securityGroup) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
          {node.config.subnet && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50 truncate max-w-[110px]">
              {String(node.config.subnet)}
            </span>
          )}
          {node.config.securityGroup && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/50 truncate max-w-[110px]">
              {String(node.config.securityGroup)}
            </span>
          )}
        </div>
      )}

      {/* Right handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800 transition-transform hover:scale-125"
        style={{ backgroundColor: color }}
      />

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !border-2 !border-slate-800 transition-transform hover:scale-125"
        style={{ backgroundColor: color }}
      />
    </div>
  );
});
