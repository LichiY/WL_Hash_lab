import React from 'react';
import { BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { WLStep } from '../types';
import { getColorForLabel } from '../constants';

interface Props {
  step: WLStep;
}

// Custom Y-Axis Tick to show the specific Color of the Label being counted
const CustomYAxisTick = ({ x, y, payload }: any) => {
    const labelId = payload.value;
    const color = getColorForLabel(labelId);
    return (
        <g transform={`translate(${x},${y})`}>
            {/* Color Badge representing the Node Label */}
            <rect x={-32} y={-6} width={12} height={12} rx={3} fill={color} stroke="#e5e7eb" strokeWidth={1} />
            {/* Text Label */}
            <text x={-14} y={0} dy={4} textAnchor="start" fill="#57606a" fontSize={10} fontWeight="bold" fontFamily="monospace">
                {labelId}
            </text>
        </g>
    );
};

const TheoryPanel: React.FC<Props> = ({ step }) => {
  // Stats Data Prep
  const data = step.uniqueLabels.map(label => ({
    label: `${label}`, // Short label for axis
    fullLabel: `Label ${label}`,
    CountA: step.labelCountsA[label] || 0,
    CountB: step.labelCountsB[label] || 0,
    color: getColorForLabel(label) // Pass color for tooltip
  }));

  // Dynamic Height Calculation logic for the internal chart scroll area
  const itemHeight = 50; 
  const minScrollHeight = 200;
  // Calculate exact needed height based on data
  // If data is small, we still want it to fill the container visually if space allows, 
  // but ResponsiveContainer handles the "fill" part. 
  // We only strictly need to force height if it EXCEEDS the viewing area.
  // For simplicity in this flex layout, we'll let the container decide, but ensure it's at least enough for bars.
  const computedHeight = Math.max(minScrollHeight, data.length * itemHeight);

  // Isomorphism Check
  const isIsomorphic = step.isIsomorphicCandidate;

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
        {/* Status Banner - Floating or Fixed at top */}
        <div className="px-4 py-3 border-b border-[#f0f0f0] bg-white shrink-0 z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
               <h3 className="flex items-center gap-2 font-bold text-[#24292f] text-xs uppercase tracking-wide">
                 <BarChart2 size={14} className="text-[#57606a]"/> 标签统计 (Histogram K={step.k})
               </h3>
            </div>
            
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-bold border ${isIsomorphic ? 'bg-[#dafbe1] text-[#1a7f37] border-[#1a7f37]/20' : 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]/20'}`}>
                  {isIsomorphic ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                  <div className="flex flex-col leading-none gap-0.5">
                    <span>{isIsomorphic ? '分布一致' : '分布不一致'}</span>
                    <span className="text-[9px] opacity-80 font-normal">
                        {isIsomorphic ? 'WL 测试通过' : 'WL 拒绝同构'}
                    </span>
                  </div>
            </div>
        </div>

        {/* Chart Container - Fills remaining space */}
        <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar bg-[#fcfcfc]">
            <div style={{ height: Math.max(100, computedHeight), width: '100%', minHeight: '100%' }} className="p-2">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart layout="vertical" data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="label" 
                        type="category" 
                        width={40}
                        tick={<CustomYAxisTick />} // Use custom tick with color box
                        axisLine={false}
                        tickLine={false}
                        interval={0} 
                    />
                    <Tooltip 
                        cursor={{ fill: '#f6f8fa' }}
                        contentStyle={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #d0d7de', zIndex: 100 }}
                        formatter={(value: number, name: string, props: any) => {
                            // Custom tooltip to show colored dot
                            return [value, name === 'CountA' ? 'Graph A' : 'Graph B'];
                        }}
                        labelFormatter={(label) => `Label ${label}`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} verticalAlign="top" height={36}/>
                    
                    {/* Use Neutral Colors for Graph Sources to avoid confusing with Label Colors */}
                    <Bar name="Graph A" dataKey="CountA" fill="#24292f" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar name="Graph B" dataKey="CountB" fill="#d0d7de" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export default TheoryPanel;