import React, { useMemo } from 'react';
import { WLStep, GraphData } from '../types';
import { Code2, MousePointerClick } from 'lucide-react';

interface Props {
  nodeId: string | null;
  currentK: number;
  allSteps: WLStep[];
  graph: GraphData | null;
  graphType: 'A' | 'B' | null;
}

// --- RECURSIVE SIGNATURE RENDERER ---
interface RecursiveSigProps {
    nodeId: string;
    level: number;
    allSteps: WLStep[];
    graph: GraphData;
    graphType: 'A' | 'B';
    adjacency: Map<string, string[]>;
}

const RecursiveSignatureRenderer: React.FC<RecursiveSigProps> = ({ nodeId, level, allSteps, graph, graphType, adjacency }) => {
    if (level < 0 || level >= allSteps.length) return <span>?</span>;

    const step = allSteps[level];
    const nodeData = graphType === 'A' ? step.nodeDataA.get(nodeId) : step.nodeDataB.get(nodeId);
    
    if (!nodeData) return <span>?</span>;

    const color = nodeData.color;
    const label = nodeData.label;

    if (level === 0) {
        return (
            <span 
                className="inline-block px-2.5 py-0.5 rounded-md mx-1 text-white font-bold text-sm shadow-sm ring-1 ring-black/10 transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                title={`K=0 Label: ${label}`}
            >
                {label}
            </span>
        );
    }

    const neighbors = adjacency.get(nodeId) || [];
    const neighborsWithLabels = neighbors.map(nid => {
        const nStep = allSteps[level-1];
        const nData = graphType === 'A' ? nStep.nodeDataA.get(nid) : nStep.nodeDataB.get(nid);
        return { nid, label: nData?.label || "", sortVal: parseInt(nData?.label || "0") };
    });
    
    neighborsWithLabels.sort((a, b) => a.sortVal - b.sortVal);

    return (
        <span 
            className="inline-flex items-center border-[1.5px] rounded-lg mx-1 px-1.5 py-1 whitespace-nowrap align-middle transition-colors bg-white/50 hover:bg-white"
            style={{ 
                borderColor: color, 
                backgroundColor: `${color}08`, 
                color: '#374151'
            }}
            title={`Level K=${level} | Label: ${label}`}
        >
            <span style={{ color: color, fontWeight: '900', marginRight: 4, fontSize: '1.2em' }}>(</span>
            
            <RecursiveSignatureRenderer 
                nodeId={nodeId} 
                level={level - 1} 
                allSteps={allSteps} 
                graph={graph} 
                graphType={graphType} 
                adjacency={adjacency} 
            />
            
            <span style={{ color: '#d1d5db', margin: '0 4px', fontWeight: 'bold', fontSize: '1.2em' }}>,</span>
            <span style={{ color: color, fontWeight: '900', marginRight: 2, fontSize: '1.2em' }}>[</span>
            
            <div className="inline-flex gap-1 items-center">
                {neighborsWithLabels.map((n, idx) => (
                    <React.Fragment key={`${n.nid}-${idx}`}>
                        <RecursiveSignatureRenderer 
                            nodeId={n.nid} 
                            level={level - 1} 
                            allSteps={allSteps} 
                            graph={graph} 
                            graphType={graphType} 
                            adjacency={adjacency}
                        />
                        {idx < neighborsWithLabels.length - 1 && <span className="text-gray-300 font-bold mx-0.5">,</span>}
                    </React.Fragment>
                ))}
            </div>

            <span style={{ color: color, fontWeight: '900', marginLeft: 2, fontSize: '1.2em' }}>]</span>
            <span style={{ color: color, fontWeight: '900', marginLeft: 4, fontSize: '1.2em' }}>)</span>
            
            <sup 
                className="shadow-sm border font-mono"
                style={{ 
                    color: color, 
                    fontWeight: 'bold', 
                    fontSize: '11px', 
                    marginLeft: 4, 
                    backgroundColor: '#fff',
                    padding: '0 4px',
                    borderRadius: '4px',
                    borderColor: `${color}40`
                }}
            >
                {label}
            </sup>
        </span>
    );
};

const RecursiveSignaturePanel: React.FC<Props> = ({ nodeId, currentK, allSteps, graph, graphType }) => {
    
    const adjacency = useMemo(() => {
        if (!graph) return new Map<string, string[]>();
        const adj = new Map<string, string[]>();
        graph.nodes.forEach(n => adj.set(n.id, []));
        graph.links.forEach(l => {
            adj.get(l.source)?.push(l.target);
            adj.get(l.target)?.push(l.source);
        });
        return adj;
    }, [graph]);

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="px-4 py-2 border-b border-[#f0f0f0] flex items-center gap-2 bg-[#fcfcfc] shrink-0">
                <Code2 size={14} className="text-[#8250df]" />
                <span className="text-[10px] font-bold uppercase text-[#57606a] tracking-wide">
                    完整递归签名 (Full Recursive Signature)
                </span>
                {nodeId && (
                    <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline border border-gray-200 px-3 py-0.5 rounded-full bg-white shadow-sm font-mono">
                        Node: {nodeId}
                    </span>
                )}
            </div>
            
            <div className="flex-1 px-4 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#fafafa] inner-shadow text-left whitespace-nowrap flex items-center">
                {!nodeId || !graph || !graphType ? (
                    <div className="w-full flex items-center justify-center text-gray-400 gap-2">
                        <MousePointerClick size={16} />
                        <span className="text-xs font-medium">点击图中的节点以查看其递归哈希结构</span>
                    </div>
                ) : (
                    <div className="font-mono text-sm leading-none pl-2"> 
                        <RecursiveSignatureRenderer 
                            nodeId={nodeId} 
                            level={currentK} 
                            allSteps={allSteps} 
                            graph={graph} 
                            graphType={graphType} 
                            adjacency={adjacency} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecursiveSignaturePanel;