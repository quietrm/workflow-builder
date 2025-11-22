import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import yaml from 'js-yaml';
import { API_BASE_URL } from "./config";

export default function DagDesigner() {
  // ---------------------------------------------------------
  // DEFINITIONS LOADING
  // ---------------------------------------------------------
  const [definitions, setDefinitions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("api/workflow-definitions")
      .then((res) => res.json())
      .then((defs) => {
        setDefinitions(defs);
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------
  // LAYOUT + REACTFLOW STATE
  // ---------------------------------------------------------
  const initialNodes = [];
  const initialEdges = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedType, setSelectedType] = useState(null);
  const [counter, setCounter] = useState(1);

  const [flowHeight, setFlowHeight] = useState(window.innerHeight);
  const toolbarRef = useRef(null);

  const updateFlowHeight = () => {
    const toolbarHeight = toolbarRef.current
      ? toolbarRef.current.offsetHeight
      : 0;
    setFlowHeight(window.innerHeight - toolbarHeight);
  };

  useEffect(() => {
    updateFlowHeight();
    window.addEventListener('resize', updateFlowHeight);
    return () => window.removeEventListener('resize', updateFlowHeight);
  }, []);

  // ---------------------------------------------------------
  // GENERIC NODE COMPONENT
  // ---------------------------------------------------------
  const GenericNode = ({ data }) => (
    <div className="p-2 rounded shadow-sm bg-white border relative">
      <Handle type="target" position={Position.Left} id="in" />
      <div className="font-semibold">{data.label}</div>
      <div className="text-xs text-gray-600">{data.type}</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );

  // nodeTypes must be created AFTER definitions are loaded
  const nodeTypes = React.useMemo(() => {
    return Object.keys(definitions).reduce((acc, key) => {
      acc[key] = GenericNode;
      return acc;
    }, {});
  }, [definitions]);

  // ---------------------------------------------------------
  // CONNECTING NODES
  // ---------------------------------------------------------
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  // ---------------------------------------------------------
  // ADD NEW NODES USING DEFINITIONS
  // ---------------------------------------------------------
  const addNewNode = useCallback(() => {
    if (!selectedType) return;

    const def = definitions[selectedType];
    const id = String(counter);

    const newNode = {
      id,
      type: selectedType,
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
      },
      data: {
        label: def.label || selectedType,
        type: selectedType,
        config: def || {},
      },
    };

    setCounter((c) => c + 1);
    setNodes((nds) => nds.concat(newNode));
  }, [counter, definitions, selectedType, setNodes]);

  // ---------------------------------------------------------
  // EXPORT YAML
  // ---------------------------------------------------------
  const exportYaml = useCallback(() => {
    const steps = nodes.map((n) => {
      const def = definitions[n.type];

      return {
        id: n.id,
        type: n.type,
        config: {
          ...def,
          ...n.data.config,
        },
      };
    });

    const transitions = edges.map((e) => ({
      from: e.source,
      to: e.target,
    }));

    const doc = { steps, transitions };
    const y = yaml.dump(doc);

    // download as file
    const blob = new Blob([y], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.yaml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [nodes, edges, definitions]);

  if (loading) return <div>Loading definitions...</div>;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col h-screen w-screen">
      <div
        ref={toolbarRef}
        className=" items-center gap-3 p-3 border-b bg-white w-full"
      >
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Node type:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Select...</option>
            {Object.entries(definitions).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label || key}
              </option>
            ))}
          </select>
          <button
            className="ml-2 px-3 py-1 rounded bg-sky-600 text-white"
            onClick={addNewNode}
          >
            Add node
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-emerald-600 text-white"
            onClick={exportYaml}
          >
            Export YAML
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-w-0 min-h-0 relative"
        style={{ width: '100%', height: flowHeight }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
