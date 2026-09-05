import { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { DesignNode, DesignConnection, DesignResourceType, ValidationResult } from '@/design/types';
import { checkConnectionValidity, type ConnectionCheckResult } from '@/design/rules/relationships';
import { DesignResourceNode } from './nodes/DesignResourceNode';
import { DesignContainerNode } from './nodes/DesignContainerNode';
import { DesignSecurityGroupNode } from './nodes/DesignSecurityGroupNode';

// IMPORTANT: Defined at module scope to prevent React Flow re-mounting
const NODE_TYPES = {
  designResourceNode: DesignResourceNode,
  designContainerNode: DesignContainerNode,
  designSecurityGroupNode: DesignSecurityGroupNode,
};

const DEFAULT_EDGE_OPTIONS = {
  animated: true,
  type: 'smoothstep',
  style: { stroke: '#8b5cf6', strokeWidth: 2 },
};

interface DesignCanvasInnerProps {
  nodes: DesignNode[];
  connections: DesignConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  highlightedNodeId: string | null;
  issues: ValidationResult[];
  onSelectNode: (nodeId: string | null) => void;
  onSelectConnection: (connId: string | null) => void;
  onAddNode: (type: DesignResourceType, position: { x: number; y: number }) => void;
  onUpdateNodes: (nodes: DesignNode[]) => void;
  onAddConnection: (conn: Omit<DesignConnection, 'id'>) => void;
  onInvalidConnection: (check: ConnectionCheckResult) => void;
}

function DesignCanvasInner({
  nodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  highlightedNodeId,
  issues,
  onSelectNode,
  onSelectConnection,
  onAddNode,
  onUpdateNodes,
  onAddConnection,
  onInvalidConnection,
}: DesignCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Create issue node maps for fast status lookups
  const errorNodeIds = useMemo(
    () => new Set(issues.filter((i) => i.severity === 'ERROR').flatMap((i) => i.nodeIds)),
    [issues],
  );
  const warningNodeIds = useMemo(
    () => new Set(issues.filter((i) => i.severity === 'WARNING').flatMap((i) => i.nodeIds)),
    [issues],
  );

  // Transform DesignNodes into React Flow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return nodes.map((node) => {
      let nodeType = 'designResourceNode';
      if (['vpc', 'public_subnet', 'private_subnet'].includes(node.type)) {
        nodeType = 'designContainerNode';
      } else if (node.type === 'security_group') {
        nodeType = 'designSecurityGroupNode';
      }

      return {
        id: node.id,
        type: nodeType,
        position: node.position,
        selected: node.id === selectedNodeId,
        data: {
          node,
          isHighlighted: node.id === highlightedNodeId,
          hasError: errorNodeIds.has(node.id),
          hasWarning: warningNodeIds.has(node.id),
        },
      };
    });
  }, [nodes, selectedNodeId, highlightedNodeId, errorNodeIds, warningNodeIds]);

  // Transform DesignConnections into React Flow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return connections.map((conn) => {
      const isSelected = conn.id === selectedConnectionId;
      return {
        id: conn.id,
        source: conn.source,
        target: conn.target,
        type: 'smoothstep',
        animated: true,
        selected: isSelected,
        label: conn.config?.protocol ? `${conn.config.protocol}:${conn.config.port ?? ''}` : undefined,
        labelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85, rx: 4, ry: 4 },
        style: {
          stroke: isSelected ? '#a855f7' : '#8b5cf6',
          strokeWidth: isSelected ? 3 : 2,
        },
      };
    });
  }, [connections, selectedConnectionId]);

  // Drag & Drop Handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as DesignResourceType;
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAddNode(type, position);
    },
    [reactFlowInstance, onAddNode],
  );

  // Connection Handler with Smart Validation
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      if (!sourceNode || !targetNode) return;

      const check = checkConnectionValidity(sourceNode.type, targetNode.type);
      if (!check.valid) {
        onInvalidConnection(check);
        return;
      }

      onAddConnection({
        source: params.source,
        target: params.target,
        type: check.relationship?.type ?? 'traffic',
        config: {
          protocol: check.relationship?.protocol,
          port: check.relationship?.defaultPort,
          label: check.relationship?.label,
        },
      });
    },
    [nodes, onAddConnection, onInvalidConnection],
  );

  // Position & movement updates
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, rfNodes);
      // Map updated coordinates back to design nodes
      const newDesignNodes = nodes.map((n) => {
        const rf = updated.find((u) => u.id === n.id);
        return rf ? { ...n, position: rf.position } : n;
      });
      onUpdateNodes(newDesignNodes);
    },
    [rfNodes, nodes, onUpdateNodes],
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onConnect={onConnect}
        onNodeClick={(_: React.MouseEvent, node: Node) => onSelectNode(node.id)}
        onEdgeClick={(_: React.MouseEvent, edge: Edge) => onSelectConnection(edge.id)}
        onPaneClick={() => {
          onSelectNode(null);
          onSelectConnection(null);
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg" />
        <MiniMap
          nodeColor={(node: Node) => {
            const dn = (node.data as any)?.node as DesignNode;
            if (dn?.type === 'vpc') return '#1B660F';
            if (dn?.type.includes('subnet')) return '#147EBA';
            if (dn?.type === 'ec2') return '#ED7100';
            if (dn?.type === 'rds') return '#3B48CC';
            if (dn?.type === 'security_group') return '#DD344C';
            return '#8C4FFF';
          }}
          className="!bg-white/80 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-md"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

export function DesignCanvas(props: DesignCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <DesignCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
