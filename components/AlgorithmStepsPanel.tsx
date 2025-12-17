import React from 'react';
import { WLStepNodeData as NodeData, GraphData, WLStep } from '../types';
import { ArrowDown, Plus } from 'lucide-react';

interface Props {
  currentStepData: NodeData | undefined;
  prevStepData: NodeData | undefined;
  allSteps: WLStep[];
  graph: GraphData | null;
  nodeId: string | null;
  currentK: number;
  graphType: 'A' | 'B' | null;
}

const Tag: React.FC<{ label: string, color: string, sm?: boolean }> = ({ label, color, sm }) => (
  <span 
    className={`inline-flex items-center justify-center font-bold font-mono rounded text-white shadow-sm transition-all ${sm ? 'min-w-[20px] h-5 text-[10px] px-1' : 'min-w-[28px] h-7 text-sm px-2'}`}
    style={{ backgroundColor: color }}
  >
    {label}
  </span>
);

const AlgorithmStepsPanel: React.FC<Props> = ({ currentStepData, prevStepData, currentK, nodeId }) => {
  
  if (!currentStepData || !nodeId) {
    return (
        <div className="h-full bg-[#fcfcfc] flex flex-col items-center justify-center text-gray-400 p-6 text-center border-t border-[#d0d7de]">
            <p className="text-xs font-medium">请点击节点查看计算过程</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-4 py-2 border-b border-[#d0d7de] bg-[#f6f8fa] flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold uppercase text-[#57606a] flex items-center gap-2">
                WL 核心计算流 (K={currentK})
            </h3>
        </div>

        {/* Content - Vertical Layout for Sidebar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="flex flex-col items-center gap-2 max-w-[260px] mx-auto">
                
                {/* Step 1: Aggregate */}
                <div className="w-full bg-white rounded-lg border border-[#d0d7de] shadow-sm p-3 relative group">
                     <span className="absolute -top-2 left-3 text-[9px] font-bold text-[#0969da] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide z-10">
                        1. 聚合 (Aggregate)
                     </span>
                     
                     <div className="mt-2 flex items-center justify-center gap-2">
                        {/* Self */}
                        <div className="flex flex-col items-center p-1.5 bg-[#f6f8fa] rounded border border-gray-100">
                             <span className="text-[9px] text-gray-400 mb-0.5 font-semibold uppercase">Self</span>
                             <Tag 
                                 label={currentStepData.expandedSignature?.self || '?'} 
                                 color={prevStepData?.color || '#999'} 
                             />
                        </div>
                        <Plus size={14} className="text-gray-300" />
                        {/* Neighbors */}
                        <div className="flex flex-col items-center p-1.5 bg-[#f6f8fa] rounded border border-gray-100 flex-1 min-w-0">
                             <span className="text-[9px] text-gray-400 mb-0.5 font-semibold uppercase">Neighbors</span>
                             <div className="flex flex-wrap justify-center gap-1 w-full">
                                 {currentStepData.expandedSignature?.neighbors.slice(0, 8).map((lbl, idx) => (
                                     <Tag key={idx} label={lbl} color="#666" sm />
                                 ))}
                                 {(currentStepData.expandedSignature?.neighbors.length || 0) > 8 && <span className="text-[9px] text-gray-400">...</span>}
                                 {currentStepData.expandedSignature?.neighbors.length === 0 && <span className="text-[9px] text-gray-300 italic">None</span>}
                             </div>
                        </div>
                     </div>
                </div>

                <ArrowDown size={16} className="text-gray-300" />

                {/* Step 2: Construct */}
                <div className="w-full bg-white rounded-lg border border-[#d0d7de] shadow-sm p-3 relative group">
                    <span className="absolute -top-2 left-3 text-[9px] font-bold text-[#9a6700] bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide z-10">
                        2. 构造签名 (Construct)
                    </span>
                    <div className="mt-2 px-2 py-2 rounded bg-gray-50 border border-gray-100 border-dashed flex flex-wrap items-center justify-center font-mono text-xs text-gray-700 leading-relaxed break-all text-center">
                        <span className="font-extrabold text-[#57606a] mr-0.5">(</span>
                        <span className="font-bold">{currentStepData.expandedSignature?.self}</span>
                        <span className="text-gray-300 mx-1">,</span>
                        <span className="font-extrabold text-[#57606a] mr-0.5">[</span>
                        <span className="italic opacity-90">
                            {currentStepData.expandedSignature?.neighbors.join(',')}
                        </span>
                        <span className="font-extrabold text-[#57606a] ml-0.5">]</span>
                        <span className="font-extrabold text-[#57606a] ml-0.5">)</span>
                    </div>
                </div>

                <ArrowDown size={16} className="text-gray-300" />

                {/* Step 3: Hash */}
                <div className="w-full bg-[#dafbe1]/30 rounded-lg border border-[#1a7f37]/20 shadow-sm p-3 relative flex flex-col items-center justify-center">
                    <span className="absolute -top-2 left-3 text-[9px] font-bold text-[#1a7f37] bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-wide z-10">
                        3. 哈希 (Hash)
                    </span>
                    <div className="mt-2">
                        <Tag label={currentStepData.label} color={currentStepData.color} />
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default AlgorithmStepsPanel;