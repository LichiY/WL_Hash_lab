import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { WLStep } from '../types';
import { getColorForLabel } from '../constants';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  step: WLStep;
}

const StatsPanel: React.FC<Props> = ({ step }) => {
  // Merge data for comparison
  const data = step.uniqueLabels.map(label => ({
    label: `Label ${label}`,
    rawLabel: label,
    CountA: step.labelCountsA[label] || 0,
    CountB: step.labelCountsB[label] || 0,
    fill: getColorForLabel(label)
  }));

  const isIsomorphic = step.isIsomorphicCandidate;

  return (
    <div className="bg-white rounded-lg border border-[#d0d7de] p-4 h-full flex flex-col shadow-sm">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-[#24292f] flex items-center gap-2">
            📊 标签分布对比 (直方图)
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isIsomorphic ? 'bg-[#dafbe1] text-[#1a7f37] border-[#1a7f37]' : 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]'}`}>
              {isIsomorphic ? <CheckCircle size={14}/> : <XCircle size={14}/>}
              {isIsomorphic ? '可能是同构的 (WL测试通过)' : '非同构 (分布不匹配)'}
          </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis 
                dataKey="label" 
                tick={{ fill: '#57606a', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                tick={{ fill: '#57606a', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
            />
            <Tooltip 
                cursor={{ fill: '#f6f8fa' }}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d0d7de', borderRadius: '6px', color: '#24292f', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            <Bar name="图 A 计数" dataKey="CountA" fill="#0969da" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar name="图 B 计数" dataKey="CountB" fill="#8250df" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPanel;