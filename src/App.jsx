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

const IntakeNode = ({ data }) => (
  <div className="p-2 rounded shadow-sm bg-white border relative">
    <div className="font-semibold">{data.label}</div>
    <div className="text-xs text-gray-600">{data.meta || 'intake'}</div>
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const ScheduleNode = ({ data }) => (
  <div className="p-2 rounded shadow-sm bg-indigo-50 border border-indigo-200 relative">
    <Handle type="target" position={Position.Left} id="in" />
    <div className="font-semibold text-indigo-700">{data.label}</div>
    <div className="text-xs text-indigo-600">{data.meta || 'schedule'}</div>
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const CommunicationNode = ({ data }) => (
  <div className="p-2 rounded shadow-sm bg-indigo-50 border border-indigo-200 relative">
    <Handle type="target" position={Position.Left} id="in" />
    <div className="font-semibold text-indigo-700">{data.label}</div>
    <div className="text-xs text-indigo-600">
      {data.meta || 'communication'}
    </div>
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const ConsultNode = ({ data }) => (
  <div className="p-2 rounded shadow-sm bg-indigo-50 border border-indigo-200 relative">
    <Handle type="target" position={Position.Left} id="in" />
    <div className="font-semibold text-indigo-700">{data.label}</div>
    <div className="text-xs text-indigo-600">{data.meta || 'consult'}</div>
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const AiNode = ({ data }) => (
  <div className="p-2 rounded shadow-sm bg-indigo-50 border border-indigo-200 relative">
    <Handle type="target" position={Position.Left} id="in" />
    <div className="font-semibold text-indigo-700">{data.label}</div>
    <div className="text-xs text-indigo-600">{data.meta || 'ai'}</div>
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const nodeTypes = {
  intakeNode: IntakeNode,
  scheduleNode: ScheduleNode,
  communicationNode: CommunicationNode,
  aiNode: AiNode,
  consultNode: ConsultNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'intakeNode',
    position: { x: 250, y: 5 },
    data: { meta: 'Intake' },
  },
];

const initialEdges = [
  /*
  {
    id: 'e1-2',
    source: '1',
    sourceHandle: 'out',
    target: '2',
    targetHandle: 'in',
    animated: true,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: 'e2-3',
    source: '2',
    sourceHandle: 'out',
    target: '3',
    targetHandle: 'in',
    markerEnd: { type: MarkerType.Arrow },
  },
  */
];

export default function DagDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedType, setSelectedType] = useState('defaultNode');
  const [counter, setCounter] = useState(4);
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

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  const addNewNode = useCallback(() => {
    const id = String(counter);
    const newNode = {
      id,
      type: selectedType,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label: `${selectedType}-${id}`, meta: '' },
    };
    setCounter((c) => c + 1);
    setNodes((nds) => nds.concat(newNode));
  }, [counter, selectedType, setNodes]);

  const exportYaml = useCallback(() => {
    const nodesForYaml = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.data.label,
      meta: n.data.meta || null,
    }));
    const edgesForYaml = edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
    }));
    const doc = { workflow: { nodes: nodesForYaml, edges: edgesForYaml } };
    const y = yaml.dump(doc);

    const blob = new Blob([y], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.yaml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="intakeNode">Patient Intake</option>
            <option value="scheduleNode">Schedule Appointment</option>
            <option value="communicationNode">Communication</option>
            <option value="aiNode">AI</option>
            <option value="consultNode">Consult</option>
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
          style={{ width: '100%', height: '100%' }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
