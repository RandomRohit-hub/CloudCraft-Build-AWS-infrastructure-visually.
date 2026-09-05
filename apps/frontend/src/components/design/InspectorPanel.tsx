import { useMemo } from 'react';
import type { DesignNode, SecurityGroupRule } from '@/design/types';
import { CATALOG_BY_TYPE } from '@/design/catalog';

interface InspectorPanelProps {
  node: DesignNode | null;
  allNodes: DesignNode[];
  beginnerMode: boolean;
  onUpdateName: (nodeId: string, name: string) => void;
  onUpdateConfig: (nodeId: string, config: Record<string, any>) => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

const INSTANCE_TYPES = ['t3.nano', 't3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'c5.large'];
const AMIS = ['Amazon Linux 2023', 'Ubuntu 22.04 LTS', 'Red Hat Enterprise Linux 9', 'Debian 12'];
const PURPOSES = ['Backend API', 'Web Server / Ingress', 'Worker / Background Job', 'Bastion / Jump Host'];
const RDS_ENGINES = ['PostgreSQL', 'MySQL', 'Aurora PostgreSQL', 'Aurora MySQL', 'MariaDB'];
const RDS_CLASSES = ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large'];
const LAMBDA_RUNTIMES = ['nodejs20.x', 'python3.11', 'java17', 'go1.x', 'dotnet8'];

export function InspectorPanel({
  node,
  allNodes,
  beginnerMode,
  onUpdateName,
  onUpdateConfig,
  onDuplicate,
  onDelete,
  onClose,
}: InspectorPanelProps) {
  if (!node) {
    return (
      <aside className="w-80 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 select-none z-10 shrink-0">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 border border-slate-200 dark:border-slate-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Inspector Panel
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
            Click any node on the canvas to configure its properties, rules, and architecture settings.
          </p>
        </div>
      </aside>
    );
  }

  const catalogItem = CATALOG_BY_TYPE.get(node.type);
  const Icon = catalogItem?.icon;
  const color = catalogItem?.color ?? '#8b5cf6';
  const explanation = catalogItem?.explanation;

  // Available VPCs, Subnets, and Security Groups for dropdown bindings
  const vpcList = useMemo(() => allNodes.filter((n) => n.type === 'vpc'), [allNodes]);
  const subnetList = useMemo(
    () => allNodes.filter((n) => n.type === 'public_subnet' || n.type === 'private_subnet'),
    [allNodes],
  );
  const sgList = useMemo(() => allNodes.filter((n) => n.type === 'security_group'), [allNodes]);
  const roleList = useMemo(() => allNodes.filter((n) => n.type === 'iam_role'), [allNodes]);

  const updateField = (key: string, value: any) => {
    onUpdateConfig(node.id, { [key]: value });
  };

  // Security Group Rules handlers
  const rules = (node.config.rules as SecurityGroupRule[]) || [];

  const addRule = () => {
    const newRule: SecurityGroupRule = {
      id: `r-${Date.now()}`,
      type: 'inbound',
      protocol: 'tcp',
      portRange: '80',
      source: '0.0.0.0/0',
      description: 'Web traffic',
    };
    onUpdateConfig(node.id, { rules: [...rules, newRule] });
  };

  const removeRule = (ruleId: string) => {
    onUpdateConfig(node.id, { rules: rules.filter((r) => r.id !== ruleId) });
  };

  const updateRule = (ruleId: string, updates: Partial<SecurityGroupRule>) => {
    onUpdateConfig(node.id, {
      rules: rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    });
  };

  return (
    <aside className="w-80 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 select-none z-10 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {catalogItem?.name ?? node.name}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {node.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(node.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Duplicate node (Ctrl+D)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete node (Del)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Resource Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Resource Name
          </label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdateName(node.id, e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
          />
        </div>

        {/* ── EC2 Configuration ── */}
        {node.type === 'ec2' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Instance Type
              </label>
              <select
                value={node.config.instanceType ?? 't3.micro'}
                onChange={(e) => updateField('instanceType', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {INSTANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                AMI Operating System
              </label>
              <select
                value={node.config.ami ?? 'Amazon Linux 2023'}
                onChange={(e) => updateField('ami', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {AMIS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Workload Purpose
              </label>
              <select
                value={node.config.purpose ?? 'Backend API'}
                onChange={(e) => updateField('purpose', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Subnet Placement
              </label>
              <select
                value={node.config.subnet ?? ''}
                onChange={(e) => updateField('subnet', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">-- Select Subnet on Canvas --</option>
                {subnetList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type === 'public_subnet' ? 'Public' : 'Private'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Attached Security Group
              </label>
              <select
                value={node.config.securityGroup ?? ''}
                onChange={(e) => updateField('securityGroup', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">-- Select Security Group --</option>
                {sgList.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Assign Public IPv4 Address
              </span>
              <button
                type="button"
                onClick={() => updateField('publicIp', !node.config.publicIp)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  node.config.publicIp ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    node.config.publicIp ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </>
        )}

        {/* ── RDS Database Configuration ── */}
        {node.type === 'rds' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Database Engine
              </label>
              <select
                value={node.config.engine ?? 'PostgreSQL'}
                onChange={(e) => updateField('engine', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {RDS_ENGINES.map((eng) => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                DB Instance Class
              </label>
              <select
                value={node.config.instanceClass ?? 'db.t3.micro'}
                onChange={(e) => updateField('instanceClass', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {RDS_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Database Subnet
              </label>
              <select
                value={node.config.subnet ?? ''}
                onChange={(e) => updateField('subnet', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">-- Select Subnet --</option>
                {subnetList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type === 'public_subnet' ? 'Public' : 'Private'})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Multi-AZ Deployment
                </span>
                <span className="text-[10px] text-slate-400">High availability standby</span>
              </div>
              <button
                type="button"
                onClick={() => updateField('multiAz', !node.config.multiAz)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  node.config.multiAz ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    node.config.multiAz ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Publicly Accessible
                </span>
                <span className="text-[10px] text-red-500">Security risk if enabled</span>
              </div>
              <button
                type="button"
                onClick={() => updateField('publiclyAccessible', !node.config.publiclyAccessible)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  node.config.publiclyAccessible ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    node.config.publiclyAccessible ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </>
        )}

        {/* ── S3 Configuration ── */}
        {node.type === 's3' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Block All Public Access
                </span>
                <span className="text-[10px] text-slate-400">Recommended best practice</span>
              </div>
              <button
                type="button"
                onClick={() => updateField('blockPublicAccess', !node.config.blockPublicAccess)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  node.config.blockPublicAccess !== false ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
                    node.config.blockPublicAccess !== false ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Object Versioning
              </span>
              <button
                type="button"
                onClick={() => updateField('versioning', !node.config.versioning)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  node.config.versioning ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
                    node.config.versioning ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </>
        )}

        {/* ── Lambda Configuration ── */}
        {node.type === 'lambda' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Runtime
              </label>
              <select
                value={node.config.runtime ?? 'nodejs20.x'}
                onChange={(e) => updateField('runtime', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {LAMBDA_RUNTIMES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                IAM Execution Role
              </label>
              <select
                value={node.config.iamRole ?? ''}
                onChange={(e) => updateField('iamRole', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Select IAM Role on Canvas --</option>
                {roleList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* ── VPC / Subnet Configuration ── */}
        {(node.type === 'public_subnet' || node.type === 'private_subnet') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Enclosing VPC Network
            </label>
            <select
              value={node.config.vpcId ?? ''}
              onChange={(e) => updateField('vpcId', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 mb-3"
            >
              <option value="">-- Select VPC on Canvas --</option>
              {vpcList.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {(node.type === 'vpc' || node.type === 'public_subnet' || node.type === 'private_subnet') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              CIDR IPv4 Block
            </label>
            <input
              type="text"
              value={node.config.cidrBlock ?? ''}
              onChange={(e) => updateField('cidrBlock', e.target.value)}
              placeholder="e.g. 10.0.0.0/16"
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
        )}

        {beginnerMode && explanation && (
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed">
            <span className="font-bold">Beginner Tip: </span>
            {explanation.summary}
          </div>
        )}

        {/* ── Security Group Rules Builder ── */}
        {node.type === 'security_group' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Inbound Rules ({rules.length})
              </span>
              <button
                type="button"
                onClick={addRule}
                className="px-2 py-1 text-[10px] font-semibold rounded bg-violet-600 hover:bg-violet-700 text-white transition-colors flex items-center gap-1"
              >
                <span>+ Add Rule</span>
              </button>
            </div>

            <div className="space-y-2">
              {rules.map((rule) => {
                const isSensitive = ['5432', '3306', '22', '1433'].includes(String(rule.portRange));
                const isOpen = rule.source === '0.0.0.0/0' || rule.source === '::/0';
                const isHighRisk = isSensitive && isOpen;

                return (
                  <div
                    key={rule.id}
                    className={`p-2.5 rounded-lg border text-xs space-y-2 ${
                      isHighRisk
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-900/60'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Port {rule.portRange} ({rule.protocol.toUpperCase()})
                      </span>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">Port</span>
                        <input
                          type="text"
                          value={rule.portRange}
                          onChange={(e) => updateRule(rule.id, { portRange: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">Source</span>
                        <input
                          type="text"
                          value={rule.source}
                          onChange={(e) => updateRule(rule.id, { source: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    {isHighRisk && (
                      <div className="p-2 rounded bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-[10px] text-red-700 dark:text-red-300 leading-tight">
                        <span className="font-bold">HIGH RISK: </span>
                        Port {rule.portRange} is open to the entire internet (0.0.0.0/0). Restrict this source to a specific Security Group.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Beginner "WHY?" Explanation Section ── */}
        {explanation && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-wider">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 10-6 0 3 3 0 006 0z" />
              </svg>
              <span>Architectural Guidance</span>
            </div>

            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 space-y-2">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                  What is this?
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {explanation.summary}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                  Why use it?
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {explanation.why}
                </p>
              </div>

              <div className="pt-1 border-t border-violet-200/60 dark:border-violet-800/40">
                <span className="font-semibold text-violet-700 dark:text-violet-300 block text-[11px]">
                  Best Practice:
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {explanation.bestPractice}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
