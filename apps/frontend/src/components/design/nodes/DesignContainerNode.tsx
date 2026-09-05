import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { DesignNode } from '@/design/types';
import { VpcIcon, SubnetIcon } from '@/components/nodes/icons/AwsIcons';

export interface DesignContainerData {
  node: DesignNode;
  isHighlighted?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
}

export const DesignContainerNode = memo(function DesignContainerNode({
  data,
  selected,
}: NodeProps<DesignContainerData>) {
  const { node, isHighlighted, hasError } = data;
  const isVpc = node.type === 'vpc';
  const isPublic = node.type === 'public_subnet';

  const themeColor = isVpc ? '#1B660F' : isPublic ? '#147EBA' : '#0D6494';
  const Icon = isVpc ? VpcIcon : SubnetIcon;
  const cidr = node.config.cidrBlock as string | undefined;

  let ringStyle = '';
  if (isHighlighted) {
    ringStyle = 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900';
  } else if (selected) {
    ringStyle = 'ring-2 ring-offset-1 ring-offset-slate-900';
  }

  return (
    <div
      className={`min-w-[320px] min-h-[180px] rounded-2xl border-2 p-4 transition-all shadow-sm ${
        isVpc ? 'border-dashed' : 'border-dashed'
      } ${ringStyle}`}
      style={{
        borderColor: selected ? themeColor : `${themeColor}60`,
        backgroundColor: `${themeColor}08`,
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: `${themeColor}25` }}>
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md" style={{ backgroundColor: `${themeColor}20` }}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {node.name}
            </span>
            <span
              className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
            >
              {isVpc ? 'VPC' : isPublic ? 'Public Subnet' : 'Private Subnet'}
            </span>
          </div>
        </div>

        {cidr && (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            {cidr}
          </span>
        )}

        {hasError && (
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" title="Configuration issue" />
        )}
      </div>

      <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
        {isVpc
          ? 'Enclosing VPC Network boundary'
          : isPublic
          ? 'Public traffic ingress & egress tier'
          : 'Private isolated workload tier'}
      </div>

      {/* Connection handles for route table or association */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !border-2 !border-slate-800 !opacity-40 hover:!opacity-100"
        style={{ backgroundColor: themeColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !border-2 !border-slate-800 !opacity-40 hover:!opacity-100"
        style={{ backgroundColor: themeColor }}
      />
    </div>
  );
});
