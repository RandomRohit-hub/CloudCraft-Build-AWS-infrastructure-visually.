import { useState, useCallback } from 'react';
import { useDesignState } from '@/design/useDesignState';
import { DesignHeader } from './DesignHeader';
import { ComponentSidebar } from './ComponentSidebar';
import { DesignCanvas } from './DesignCanvas';
import { InspectorPanel } from './InspectorPanel';
import { ValidationPanel } from './ValidationPanel';
import { InvalidConnectionModal } from './InvalidConnectionModal';
import type { ConnectionCheckResult } from '@/design/rules/relationships';
import type { DesignResourceType } from '@/design/types';

export function DesignPage() {
  const {
    architecture,
    selectedNodeId,
    selectedConnectionId,
    highlightedNodeId,
    beginnerMode,
    validationReport,
    canUndo,
    canRedo,
    addNode,
    updateNodeName,
    updateNodeConfig,
    updateNodes,
    deleteNode,
    duplicateNode,
    addConnection,
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
  } = useDesignState();

  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [invalidConnectionCheck, setInvalidConnectionCheck] = useState<ConnectionCheckResult | null>(null);

  const selectedNode = architecture.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleAddNodeDirectly = useCallback(
    (type: DesignResourceType) => {
      // Add node near center of canvas
      const x = 350 + Math.random() * 80;
      const y = 200 + Math.random() * 80;
      addNode(type, { x, y });
    },
    [addNode],
  );

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      highlightNode(nodeId);
    },
    [highlightNode],
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
      {/* Top Header */}
      <DesignHeader
        architectureName={architecture.name}
        region={architecture.region}
        score={validationReport.score}
        issueCount={validationReport.issues.length}
        beginnerMode={beginnerMode}
        canUndo={canUndo}
        canRedo={canRedo}
        isValidating={showValidationPanel}
        onUpdateMeta={updateArchitectureMeta}
        onNew={newArchitecture}
        onLoadTemplate={loadTemplate}
        onSave={() => {
          // Trigger save confirmation
        }}
        onExportJson={exportJson}
        onImportJson={importJson}
        onUndo={undo}
        onRedo={redo}
        onToggleValidate={() => setShowValidationPanel((prev) => !prev)}
        onToggleBeginnerMode={toggleBeginnerMode}
        onClearCanvas={clearCanvas}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Left: Component Sidebar */}
        <ComponentSidebar
          beginnerMode={beginnerMode}
          onAddNode={handleAddNodeDirectly}
        />

        {/* Center: Interactive React Flow Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <DesignCanvas
            nodes={architecture.nodes}
            connections={architecture.connections}
            selectedNodeId={selectedNodeId}
            selectedConnectionId={selectedConnectionId}
            highlightedNodeId={highlightedNodeId}
            issues={validationReport.issues}
            onSelectNode={selectNode}
            onSelectConnection={selectConnection}
            onAddNode={addNode}
            onUpdateNodes={updateNodes}
            onAddConnection={addConnection}
            onInvalidConnection={(check) => setInvalidConnectionCheck(check)}
          />

          {/* Validation Drawer / Panel (Floating Dock) */}
          <ValidationPanel
            report={validationReport}
            isOpen={showValidationPanel}
            onClose={() => setShowValidationPanel(false)}
            onFocusNode={handleFocusNode}
          />
        </main>

        {/* Right: Inspector Panel */}
        <InspectorPanel
          node={selectedNode}
          allNodes={architecture.nodes}
          beginnerMode={beginnerMode}
          onUpdateName={updateNodeName}
          onUpdateConfig={updateNodeConfig}
          onDuplicate={duplicateNode}
          onDelete={deleteNode}
          onClose={() => selectNode(null)}
        />
      </div>

      {/* Invalid Connection Diagnostic Modal */}
      <InvalidConnectionModal
        checkResult={invalidConnectionCheck}
        onClose={() => setInvalidConnectionCheck(null)}
      />
    </div>
  );
}
