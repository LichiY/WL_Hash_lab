import React, { useMemo } from 'react';
import { WLStepNodeData, WLStep, GraphData } from '../types';
import { Network, Check, Minus, GitFork, Hash } from 'lucide-react';
import SubtreeVisualization from './SubtreeVisualization';

interface Props {
  nodeId: string | null;
  currentStepData: WLStepNodeData | undefined;
  step: WLStep;
  allSteps: WLStep[];
  graphA: GraphData;
  graphB: GraphData;
  graphType: 'A' | 'B' | null;
}

const Tag: React.FC<{ label: string, color: string, sm?: boolean }> = ({ label, color, sm }) => (
  <span 
    className={`inline-flex items-center justify-center font-bold font-mono rounded text-white shadow-sm ${sm ? 'min-w-[20px] h-5 text-[10px] px-1' : 'min-w-[32px] h-8 text-sm px-2'}`}
    style={{ backgroundColor: color }}
  >
    {label}
  </span>
);

const SourceIndicator: React.FC<{ active: boolean, color: string, label: string }> = ({ active, color, label }) => (
    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${active ? 'bg-opacity-10' : 'border-gray-100 bg-gray-50'}`} 
         style={{ borderColor: active ? color : undefined, backgroundColor: active ? `${color}20` : undefined }}>
        {active ? <Check size={12} strokeWidth={3} color={color} /> : <Minus size={12} className="text-gray-300"/>}
    </div>
);

const InspectorPanel: React.FC<Props> = ({ nodeId, currentStepData, step, allSteps, graphA, graphB, graphType }) => {
  
  const activeGraph = useMemo(() => {
      if (!nodeId) return null;
      if (graphType === 'A') return graphA;
      if (graphType === 'B') return graphB;
      return null;
  }, [nodeId, graphType, graphA, graphB]);

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#d0d7de] overflow-hidden w-full shadow-2xl relative z-30">
        
        {/* TOP: SUBTREE VISUALIZATION (Flexible Height - Flex 3) */}
        <div className="flex-[3] flex flex-col min-h-0 border-b border-[#d0d7de] relative">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-[#f0f0f0] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded text-[#8250df]">
                        <Network size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase text-[#24292f] tracking-wide">递归透视 (Inspector)</span>
                </div>
                {nodeId && (
                     <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                        ID: {nodeId}
                     </span>
                )}
            </div>

            <div className="flex-1 p-0 flex flex-col min-h-0 bg-[#fafafa] relative overflow-hidden">
                {!nodeId || !currentStepData || !activeGraph ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#57606a] p-8">
                        <div className="w-20 h-20 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <GitFork className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">选择一个节点</p>
                        <p className="text-xs mt-2 text-gray-400 text-center max-w-[240px] leading-relaxed">
                            点击左侧图中的节点，查看 WL 算法如何将其子树结构压缩为哈希标签。
                        </p>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col animate-in fade-in duration-300">
                        {/* Visualization Container */}
                        <div className="flex-1 w-full relative">
                            {/* Overlay Info */}
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
                                <div className="bg-white/90 backdrop-blur px-2 py-1 rounded border border-[#d0d7de] shadow-sm flex items-center gap-2">
                                    <Tag label={currentStepData.label} color={currentStepData.color} />
                                    <span className="text-xs font-bold text-gray-600">当前标签 (K={step.k})</span>
                                </div>
                            </div>
                            
                            <SubtreeVisualization 
                                graph={activeGraph} 
                                rootId={nodeId} 
                                depth={step.k}
                                allSteps={allSteps}
                                graphType={graphType!}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* BOTTOM: HASH TABLE (Flexible Height - Flex 2) */}
        {/* Removed fixed min-h-[200px] to allow it to shrink on small screens */}
        <div className="flex-[2] flex flex-col bg-white min-h-0">
            <div className="px-4 py-2 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Hash size={14} className="text-[#0969da]" />
                    <span className="text-[10px] font-bold uppercase text-[#57606a] tracking-wide">全局哈希映射表 (Global Map)</span>
                </div>
                <span className="text-[9px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                    {step.mappings.length} Patterns
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-[#fcfcfc]">
                {/* Changed grid-cols-2 to grid-cols-3 for wider screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {step.mappings.map((m, idx) => {
                            const inA = (step.labelCountsA[m.label] || 0) > 0;
                            const inB = (step.labelCountsB[m.label] || 0) > 0;
                            const isCurrent = currentStepData?.label === m.label;
                            
                            return (
                                <div 
                                    key={idx} 
                                    className={`
                                        group relative rounded-lg border p-2 flex flex-col gap-1.5 transition-all
                                        ${isCurrent 
                                            ? 'bg-amber-50 border-amber-200 shadow-md scale-[1.02] z-10 ring-1 ring-amber-300' 
                                            : 'bg-white border-gray-200 hover:border-[#0969da] hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start border-b border-gray-50 pb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Tag label={m.label} color={m.color} sm />
                                            {isCurrent && <span className="text-[9px] font-bold text-amber-600 uppercase">Current</span>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="flex flex-col items-center">
                                                <SourceIndicator active={inA} color="#0969da" label="A" />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <SourceIndicator active={inB} color="#8250df" label="B" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded px-2 py-1.5 border border-gray-100 group-hover:bg-white transition-colors">
                                        <div className="text-[8px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Signature</div>
                                        <code className={`text-[10px] font-mono leading-relaxed break-all block ${isCurrent ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                            {m.signature}
                                        </code>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>

    </div>
  );
};

export default InspectorPanel;