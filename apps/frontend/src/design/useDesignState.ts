import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ArchitectureDesign,
  DesignNode,
  DesignConnection,
  DesignResourceType,
  ValidationReport,
} from './types';
import { CATALOG_BY_TYPE } from './catalog';
import { runArchitectureValidation } from './engine';
import { STARTER_TEMPLATES } from './templates';

const STORAGE_KEY = 'CloudCraft_design_current';
const SAVED_DESIGNS_KEY = 'CloudCraft_design_library';
const BEGINNER_MODE_KEY = 'CloudCraft_beginner_mode';
const MAX_HISTORY = 30;

function createEmptyArchitecture(name = 'Untitled Architecture', region = 'us-east-1'): ArchitectureDesign {
  const now = new Date().toISOString();
  return {
    version: '2.0.0',
    id: `arch-${Date.now()}`,
    name,
    region,
    description: 'Designed visually in CloudCraft Design Mode',
    createdAt: now,
    updatedAt: now,
    nodes: [],
    connections: [],
  };
}

export function useDesignState() {
  // Load initial architecture from localStorage or start fresh
  const [architecture, setArchitecture] = useState<ArchitectureDesign>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.nodes && parsed?.connections) return parsed;
      }
    } catch {
      // Fallback
    }
    // Default to the 3-Tier Web App starter template for high-impact first load
    const defaultTemplate = STARTER_TEMPLATES[0]!;
    return {
      version: '2.0.0',
      id: `arch-${Date.now()}`,
      name: defaultTemplate.name,
      region: defaultTemplate.region,
      description: defaultTemplate.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: defaultTemplate.nodes,
      connections: defaultTemplate.connections,
    };
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const [beginnerMode, setBeginnerMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BEGINNER_MODE_KEY) !== 'false'; // default ON for guidance
    } catch {
      return true;
    }
  });

  // Undo / Redo stacks
  const [history, setHistory] = useState<ArchitectureDesign[]>([architecture]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Validation report
  const [validationReport, setValidationReport] = useState<ValidationReport>(() =>
    runArchitectureValidation(architecture.nodes, architecture.connections),
  );

  // Sync validation whenever nodes/connections change
  useEffect(() => {
    const report = runArchitectureValidation(architecture.nodes, architecture.connections);
    setValidationReport(report);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(architecture));
    } catch {
      // Ignore quota exceeded
    }
  }, [architecture]);

  // Helper to commit state into history
  const commitArchitecture = useCallback(
    (newArch: ArchitectureDesign) => {
      setArchitecture(newArch);
      setHistory((prev) => {
        const updated = prev.slice(0, historyIndex + 1);
        if (updated.length >= MAX_HISTORY) updated.shift();
        return [...updated, newArch];
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  // ── Node Operations ──
  const addNode = useCallback(
    (
      type: DesignResourceType,
      position: { x: number; y: number },
      name?: string,
      customConfig?: Record<string, any>,
    ) => {
      const catalogItem = CATALOG_BY_TYPE.get(type);
      const nodeCount = architecture.nodes.filter((n) => n.type === type).length + 1;
      const defaultName = name ?? `${type.replace(/_/g, '-')}-${nodeCount}`;
      const config = { ...(catalogItem?.defaultConfig ?? {}), ...(customConfig ?? {}) };

      const newNode: DesignNode = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        name: defaultName,
        config,
        position,
      };

      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        nodes: [...architecture.nodes, newNode],
      };

      commitArchitecture(updated);
      setSelectedNodeId(newNode.id);
      setSelectedConnectionId(null);
      return newNode;
    },
    [architecture, commitArchitecture],
  );

  const updateNodeName = useCallback(
    (nodeId: string, name: string) => {
      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        nodes: architecture.nodes.map((n) => (n.id === nodeId ? { ...n, name } : n)),
      };
      commitArchitecture(updated);
    },
    [architecture, commitArchitecture],
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, configUpdates: Record<string, any>) => {
      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        nodes: architecture.nodes.map((n) =>
          n.id === nodeId ? { ...n, config: { ...n.config, ...configUpdates } } : n,
        ),
      };
      commitArchitecture(updated);
    },
    [architecture, commitArchitecture],
  );

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setArchitecture((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      }));
    },
    [],
  );

  const updateNodes = useCallback(
    (newNodes: DesignNode[]) => {
      setArchitecture((prev) => ({ ...prev, nodes: newNodes }));
    },
    [],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        nodes: architecture.nodes.filter((n) => n.id !== nodeId),
        connections: architecture.connections.filter(
          (c) => c.source !== nodeId && c.target !== nodeId,
        ),
      };
      commitArchitecture(updated);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [architecture, commitArchitecture, selectedNodeId],
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const original = architecture.nodes.find((n) => n.id === nodeId);
      if (!original) return;

      const dupNode: DesignNode = {
        ...original,
        id: `${original.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${original.name}-copy`,
        position: { x: original.position.x + 30, y: original.position.y + 30 },
        config: JSON.parse(JSON.stringify(original.config)),
      };

      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        nodes: [...architecture.nodes, dupNode],
      };
      commitArchitecture(updated);
      setSelectedNodeId(dupNode.id);
    },
    [architecture, commitArchitecture],
  );

  // ── Connection Operations ──
  const addConnection = useCallback(
    (connection: Omit<DesignConnection, 'id'>) => {
      // Avoid duplicate connections between same source and target
      const exists = architecture.connections.some(
        (c) => c.source === connection.source && c.target === connection.target,
      );
      if (exists) return;

      const newConn: DesignConnection = {
        ...connection,
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };

      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        connections: [...architecture.connections, newConn],
      };
      commitArchitecture(updated);
      setSelectedConnectionId(newConn.id);
    },
    [architecture, commitArchitecture],
  );

  const deleteConnection = useCallback(
    (connectionId: string) => {
      const updated: ArchitectureDesign = {
        ...architecture,
        updatedAt: new Date().toISOString(),
        connections: architecture.connections.filter((c) => c.id !== connectionId),
      };
      commitArchitecture(updated);
      if (selectedConnectionId === connectionId) setSelectedConnectionId(null);
    },
    [architecture, commitArchitecture, selectedConnectionId],
  );

  // ── Global Actions ──
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) setSelectedConnectionId(null);
  }, []);

  const selectConnection = useCallback((connectionId: string | null) => {
    setSelectedConnectionId(connectionId);
    if (connectionId) setSelectedNodeId(null);
  }, []);

  const highlightNode = useCallback((nodeId: string | null) => {
    setHighlightedNodeId(nodeId);
    if (nodeId) setSelectedNodeId(nodeId);
  }, []);

  const toggleBeginnerMode = useCallback(() => {
    setBeginnerMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BEGINNER_MODE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const updateArchitectureMeta = useCallback(
    (updates: { name?: string; region?: string; description?: string }) => {
      const updated = { ...architecture, ...updates, updatedAt: new Date().toISOString() };
      commitArchitecture(updated);
    },
    [architecture, commitArchitecture],
  );

  const newArchitecture = useCallback(
    (name = 'Untitled Architecture', region = 'us-east-1') => {
      const empty = createEmptyArchitecture(name, region);
      commitArchitecture(empty);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    },
    [commitArchitecture],
  );

  const clearCanvas = useCallback(() => {
    const cleared: ArchitectureDesign = {
      ...architecture,
      updatedAt: new Date().toISOString(),
      nodes: [],
      connections: [],
    };
    commitArchitecture(cleared);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
  }, [architecture, commitArchitecture]);

  const loadTemplate = useCallback(
    (templateId: string) => {
      const template = STARTER_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      const templatedArch: ArchitectureDesign = {
        version: '2.0.0',
        id: `arch-${Date.now()}`,
        name: template.name,
        region: template.region,
        description: template.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: JSON.parse(JSON.stringify(template.nodes)),
        connections: JSON.parse(JSON.stringify(template.connections)),
      };
      commitArchitecture(templatedArch);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    },
    [commitArchitecture],
  );

  const exportJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(architecture, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const safeName = (architecture.name || 'architecture').toLowerCase().replace(/\s+/g, '-');
    downloadAnchor.setAttribute('download', `${safeName}.CloudCraft.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [architecture]);

  const importJson = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
          const imported: ArchitectureDesign = {
            version: parsed.version ?? '2.0.0',
            id: parsed.id ?? `arch-${Date.now()}`,
            name: parsed.name ?? 'Imported Architecture',
            region: parsed.region ?? 'us-east-1',
            description: parsed.description ?? '',
            createdAt: parsed.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: parsed.nodes,
            connections: parsed.connections,
          };
          commitArchitecture(imported);
          setSelectedNodeId(null);
          setSelectedConnectionId(null);
          return true;
        }
      } catch (err) {
        console.error('Failed to parse architecture JSON', err);
      }
      return false;
    },
    [commitArchitecture],
  );

  // ── Undo / Redo ──
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setArchitecture(history[newIndex]!);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setArchitecture(history[newIndex]!);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    }
  }, [history, historyIndex]);

  // Keyboard Shortcuts (Delete, Undo, Redo, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        e.preventDefault();
        deleteConnection(selectedConnectionId);
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }

      // Undo (Ctrl+Z)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, deleteNode, deleteConnection, duplicateNode, undo, redo]);

  return {
    architecture,
    selectedNodeId,
    selectedConnectionId,
    highlightedNodeId,
    beginnerMode,
    validationReport,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    addNode,
    updateNodeName,
    updateNodeConfig,
    updateNodePosition,
    updateNodes,
    deleteNode,
    duplicateNode,
    addConnection,
    deleteConnection,
    selectNode,
    selectConnection,
    highlightNode,
    toggleBeginnerMode,
    updateArchitectureMeta,
    newArchitecture,
    clearCanvas,
    loadTemplate,
    exportJson,
    importJson,
    undo,
    redo,
  };
}
