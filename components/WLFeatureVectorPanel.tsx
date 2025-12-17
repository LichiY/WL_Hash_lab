import React, { useMemo } from 'react';
import { WLStep } from '../types';
import { getColorForLabel } from '../constants';
import { Braces, Sigma, FileDigit } from 'lucide-react';

interface Props {
  allSteps: WLStep[];
  currentK: number;
}

const WLFeatureVectorPanel: React.FC<Props> = ({ allSteps, currentK }) => {
  
  // Calculate Global Cumulative Stats up to current K
  const globalStats = useMemo(() => {
    let cumulativeDotProduct = 0;
    let cumulativeNormA = 0;
    let cumulativeNormB = 0;
    let totalDimensions = 0;

    // Iterate through steps 0 to currentK
    const relevantSteps = allSteps.slice(0, currentK + 1);

    relevantSteps.forEach(step => {
        const labels = step.uniqueLabels;
        totalDimensions += labels.length;

        const vectorA = labels.map(l => step.labelCountsA[l] || 0);
        const vectorB = labels.map(l => step.labelCountsB[l] || 0);

        for(let i=0; i<labels.length; i++) {
            const valA = vectorA[i];
            const valB = vectorB[i];
            
            cumulativeDotProduct += valA * valB;
            cumulativeNormA += valA * valA;
            cumulativeNormB += valB * valB;
        }
    });

    const cosineSim = (cumulativeNormA > 0 && cumulativeNormB > 0) 
        ? (cumulativeDotProduct / (Math.sqrt(cumulativeNormA) * Math.sqrt(cumulativeNormB))) 
        : 0;

    return { cumulativeDotProduct, cosineSim, totalDimensions, relevantSteps };
  }, [allSteps, currentK]);

  const { cumulativeDotProduct, cosineSim, totalDimensions, relevantSteps } = globalStats;

  return (
    <div className="flex flex-col h-full bg-white text-[#24292f] overflow-hidden">
        {/* Header - Fixed */}
        <div className="px-4 py-2 border-b border-[#d0d7de] bg-[#f6f8fa] flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold uppercase text-[#57606a] flex items-center gap-2">
                <Braces size={14} className="text-[#d97706]"/> WL 特征向量 (Feature Vector)
            </h3>
            <span className="text-[9px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500 font-mono">
                Dim: {totalDimensions}
            </span>
        </div>
        
        {/* Content - Scrollable BOTH directions if needed, but primarily X */}
        {/* Added min-h-0 to allow proper flex shrinking/scrolling */}
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-white relative p-4">
            <div className="flex flex-col min-w-max">
                
                {/* 1. K-Step Markers (Top Header) */}
                <div className="flex mb-2 ml-[36px] items-end"> {/* Offset for row headers */}
                    {/* Phantom Bracket for alignment with vector rows */}
                    <span className="font-mono text-lg leading-none opacity-0 mr-1 select-none">[</span>

                    {relevantSteps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center mr-3 relative">
                             {/* Group Label */}
                             <div className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 mb-1 w-full text-center whitespace-nowrap">
                                K={step.k}
                             </div>
                             {/* Label IDs (Mini) */}
                             <div className="flex gap-1 justify-center">
                                {step.uniqueLabels.map(label => (
                                    <div key={label} className="w-6 flex justify-center group relative cursor-help">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColorForLabel(label) }}></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-50 pointer-events-none">
                                            Label ID: {label}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>

                {/* 2. Vector A Row */}
                <div className="flex items-center mb-1.5">
                    <div className="w-[36px] text-[10px] font-bold text-[#0969da] shrink-0 flex items-center gap-1">
                        φ(A)
                    </div>
                    <div className="flex text-[#0969da] items-center">
                         <span className="font-mono text-lg leading-none text-gray-300 mr-1">[</span>
                         {relevantSteps.map((step, sIdx) => (
                             <div key={sIdx} className="flex gap-1 mr-3 relative after:content-['|'] after:text-gray-200 after:absolute after:-right-2 after:top-1 last:after:content-none last:mr-0">
                                 {step.uniqueLabels.map((label) => {
                                     const val = step.labelCountsA[label] || 0;
                                     return (
                                         <div key={label} className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono font-bold border rounded ${val > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-gray-50/50 border-gray-100 text-gray-300'}`}>
                                            {val}
                                         </div>
                                     );
                                 })}
                             </div>
                         ))}
                         <span className="font-mono text-lg leading-none text-gray-300 ml-1">]</span>
                    </div>
                </div>

                {/* 3. Vector B Row */}
                <div className="flex items-center">
                    <div className="w-[36px] text-[10px] font-bold text-[#8250df] shrink-0 flex items-center gap-1">
                        φ(B)
                    </div>
                    <div className="flex text-[#8250df] items-center">
                         <span className="font-mono text-lg leading-none text-gray-300 mr-1">[</span>
                         {relevantSteps.map((step, sIdx) => (
                             <div key={sIdx} className="flex gap-1 mr-3 relative after:content-['|'] after:text-gray-200 after:absolute after:-right-2 after:top-1 last:after:content-none last:mr-0">
                                 {step.uniqueLabels.map((label) => {
                                     const val = step.labelCountsB[label] || 0;
                                     return (
                                         <div key={label} className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono font-bold border rounded ${val > 0 ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'bg-gray-50/50 border-gray-100 text-gray-300'}`}>
                                            {val}
                                         </div>
                                     );
                                 })}
                             </div>
                         ))}
                         <span className="font-mono text-lg leading-none text-gray-300 ml-1">]</span>
                    </div>
                </div>

            </div>
        </div>

        {/* Footer Stats - Fixed */}
        <div className="px-4 py-2 border-t border-[#d0d7de] bg-[#fcfcfc] text-[10px] text-gray-600 flex flex-col gap-1.5 shrink-0 shadow-[0_-2px_6px_rgba(0,0,0,0.02)] z-10">
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-gray-700" title="Sum of dot products from K=0 to Current K">
                    <Sigma size={12} className="text-[#1a7f37]" /> Cumulative Kernel Value
                </span>
                <span className="font-mono font-bold text-sm text-[#1a7f37] bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    {cumulativeDotProduct}
                </span>
             </div>
             <div className="h-px bg-gray-100 w-full"></div>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-gray-700" title="Cosine Similarity of the full concatenated vectors">
                   <FileDigit size={12} className="text-[#0969da]" /> Global Cosine Similarity
                </span>
                <span className="font-mono font-bold text-gray-900 text-xs">
                    { (cosineSim * 100).toFixed(2) }%
                </span>
             </div>
        </div>
    </div>
  );
};

export default WLFeatureVectorPanel;