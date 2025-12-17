import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, FlaskConical } from 'lucide-react';
import GraphVisualization from './components/GraphVisualization';
import InspectorPanel from './components/InspectorPanel';
import TheoryPanel from './components/TheoryPanel';
import AlgorithmStepsPanel from './components/AlgorithmStepsPanel';
import WLFeatureVectorPanel from './components/WLFeatureVectorPanel';
import RecursiveSignaturePanel from './components/RecursiveSignaturePanel';
import { getScenario } from './data/scenarios';
import { runWLAlgorithm } from './services/wlAlgorithm';
import { ScenarioType, WLStep } from './types';
import { MAX_K } from './constants';

const App: React.FC = () => {
  const [scenarioType, setScenarioType] = useState<ScenarioType>(ScenarioType.ISOMORPHIC_PAIR);
  const [k, setK] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const playInterval = useRef<number | null>(null);

  // Load Data
  const scenarioData = useMemo(() => getScenario(scenarioType), [scenarioType]);

  // Run Simulation (Memoized)
  const simulation = useMemo(() => 
    runWLAlgorithm(scenarioData.graphA, scenarioData.graphB, MAX_K), 
  [scenarioData]);
  
  // Current State derivation
  const currentStep: WLStep = simulation.steps[k];
  const prevStep: WLStep | undefined = k > 0 ? simulation.steps[k-1] : undefined;

  // Selected Node Data Helper
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return undefined;
    return currentStep.nodeDataA.get(selectedNodeId) || currentStep.nodeDataB.get(selectedNodeId);
  }, [selectedNodeId, currentStep]);

  const selectedNodePrevData = useMemo(() => {
    if (!selectedNodeId || !prevStep) return undefined;
    return prevStep.nodeDataA.get(selectedNodeId) || prevStep.nodeDataB.get(selectedNodeId);
  }, [selectedNodeId, prevStep]);

  // Determine which graph the selected node belongs to
  const selectedGraphType = useMemo(() => {
      if (!selectedNodeId) return null;
      if (scenarioData.graphA.nodes.some(n => n.id === selectedNodeId)) return 'A';
      return 'B';
  }, [selectedNodeId, scenarioData]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      playInterval.current = window.setInterval(() => {
        setK(prev => {
          if (prev < MAX_K) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 2000);
    } else {
      if (playInterval.current) clearInterval(playInterval.current);
    }
    return () => { if (playInterval.current) clearInterval(playInterval.current); };
  }, [isPlaying]);

  // Handlers
  const handleNext = () => k < MAX_K && setK(k + 1);
  const handlePrev = () => k > 0 && setK(k - 1);
  const handleReset = () => {
    setIsPlaying(false);
    setK(0);
    setSelectedNodeId(null);
  };
  
  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenarioType(e.target.value as ScenarioType);
    handleReset();
  };

  return (
    <div className="flex h-screen w-full bg-[#f6f8fa] text-[#24292f] overflow-x-auto overflow-y-hidden font-sans">
      <div className="flex h-full min-w-[1050px] w-full">
        
        {/* 1. LEFT COLUMN: THEORY & ALGORITHM PROCESS */}
        <div className="w-[20%] min-w-[280px] max-w-[340px] shrink-0 border-r border-[#d0d7de] bg-[#f6f8fa] flex flex-col h-full">
            {/* Top: Theory & Distribution */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <TheoryPanel step={currentStep} />
            </div>
            
            {/* Bottom: Algorithm Steps (Vertical Process Flow) */}
            <div className="h-[35%] min-h-[220px] border-t border-[#d0d7de] shrink-0 bg-white overflow-hidden relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
                <AlgorithmStepsPanel 
                    currentStepData={selectedNodeData}
                    prevStepData={selectedNodePrevData}
                    allSteps={simulation.steps}
                    graph={selectedGraphType === 'A' ? scenarioData.graphA : scenarioData.graphB}
                    nodeId={selectedNodeId}
                    currentK={k}
                    graphType={selectedGraphType}
                />
            </div>
        </div>

        {/* 2. MIDDLE COLUMN: GRAPHS & VECTORS & SIGNATURE */}
        <div className="flex-1 flex flex-col min-w-[380px] h-full bg-white relative shadow-sm z-10 shrink">
            
            {/* Header (Controls) */}
            <header className="h-14 border-b border-[#d0d7de] bg-white flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0969da] to-[#0550ae] flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
                    <FlaskConical size={18} />
                </div>
                <div>
                    <h1 className="font-bold text-base tracking-tight text-[#24292f]">WL-Hash 实验室</h1>
                </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#f6f8fa] rounded-md border border-[#d0d7de] p-0.5 shadow-sm">
                        <button onClick={handlePrev} disabled={k===0} className="p-1.5 hover:bg-white rounded hover:shadow-sm disabled:opacity-30 transition-all text-[#57606a]">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-2 font-mono text-sm font-bold text-[#0969da] min-w-[60px] text-center">K = {k}</div>
                        <button onClick={handleNext} disabled={k===MAX_K} className="p-1.5 hover:bg-white rounded hover:shadow-sm disabled:opacity-30 transition-all text-[#57606a]">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border transition-colors ${isPlaying ? 'bg-[#ffebe9] text-[#cf222e] border-[#cf222e]' : 'bg-white text-[#24292f] border-[#d0d7de] hover:bg-[#f3f4f6]'}`}
                    >
                        {isPlaying ? <Pause size={12}/> : <Play size={12}/>}
                        {isPlaying ? '演示中' : '演示'}
                    </button>

                    <select 
                        value={scenarioType}
                        onChange={handleScenarioChange}
                        className="bg-white border border-[#d0d7de] rounded py-1 px-2 text-xs font-medium text-[#24292f] outline-none cursor-pointer hover:border-[#0969da] transition-colors shadow-sm max-w-[180px]"
                    >
                        <optgroup label="同构图 (Isomorphic)">
                            <option value={ScenarioType.ISOMORPHIC_PAIR}>基础: 房子图</option>
                            <option value={ScenarioType.ISOMORPHIC_COMPLEX}>复杂: 彼得森图</option>
                            <option value={ScenarioType.ISOMORPHIC_TREES}>结构: 树层级</option>
                            <option value={ScenarioType.ISOMORPHIC_GRID_3X3}>网格: 3x3棋盘</option>
                            <option value={ScenarioType.ISOMORPHIC_LADDER}>环形: 棱柱/梯子</option>
                        </optgroup>
                        <optgroup label="非同构图 (Non-Isomorphic)">
                            <option value={ScenarioType.NON_ISOMORPHIC_SIMPLE}>基础: 链 vs 星</option>
                            <option value={ScenarioType.NON_ISOMORPHIC_REGULAR}>正则: 哑铃 vs 弦环</option>
                            <option value={ScenarioType.NON_ISOMORPHIC_DEGREE}>同度: 长链 vs 短链</option>
                            <option value={ScenarioType.GRID_VS_RANDOM}>对比: 网格 vs 随机</option>
                        </optgroup>
                        <optgroup label="算法局限性 (Limit)">
                            <option value={ScenarioType.CYCLES}>失败: C6 vs 2xC3</option>
                        </optgroup>
                    </select>

                    <button onClick={handleReset} className="p-1.5 text-[#57606a] hover:text-[#0969da] transition-colors" title="重置">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </header>

            {/* Content Top: Graph A & Graph B */}
            <div className="flex-1 flex p-3 gap-3 overflow-hidden bg-[#f6f8fa] min-h-0">
                <div className="flex-1 min-w-0 h-full flex flex-col shadow-sm rounded-lg overflow-hidden border border-[#d0d7de]">
                    <GraphVisualization 
                        label="Graph A"
                        data={scenarioData.graphA}
                        currentNodeState={currentStep.nodeDataA}
                        prevNodeState={prevStep ? prevStep.nodeDataA : undefined}
                        selectedNodeId={selectedNodeId}
                        onNodeClick={setSelectedNodeId}
                    />
                </div>
                <div className="flex-1 min-w-0 h-full flex flex-col shadow-sm rounded-lg overflow-hidden border border-[#d0d7de]">
                    <GraphVisualization 
                        label="Graph B"
                        data={scenarioData.graphB}
                        currentNodeState={currentStep.nodeDataB}
                        prevNodeState={prevStep ? prevStep.nodeDataB : undefined}
                        selectedNodeId={selectedNodeId}
                        onNodeClick={setSelectedNodeId}
                    />
                </div>
            </div>

            {/* BOTTOM SECTION: Feature Vector & Recursive Signature */}
            <div className="shrink-0 flex flex-col h-[35%] min-h-[220px] border-t border-[#d0d7de] z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] bg-white">
                
                {/* 1. Feature Vector (Flexible) */}
                <div className="flex-1 min-h-0 border-b border-[#f0f0f0]">
                    <WLFeatureVectorPanel allSteps={simulation.steps} currentK={k} />
                </div>

                {/* 2. Recursive Signature (Fixed small height) */}
                <div className="h-[90px] shrink-0">
                    <RecursiveSignaturePanel 
                        nodeId={selectedNodeId}
                        currentK={k}
                        allSteps={simulation.steps}
                        graph={selectedGraphType === 'A' ? scenarioData.graphA : scenarioData.graphB}
                        graphType={selectedGraphType}
                    />
                </div>

            </div>

        </div>

        {/* 3. RIGHT COLUMN: INSPECTOR */}
        <div className="w-[35%] min-w-[400px] max-w-[500px] shrink-0 bg-white z-20 flex flex-col border-l border-[#d0d7de] shadow-xl">
                <InspectorPanel 
                    nodeId={selectedNodeId} 
                    currentStepData={selectedNodeData}
                    step={currentStep}
                    allSteps={simulation.steps}
                    graphA={scenarioData.graphA}
                    graphB={scenarioData.graphB}
                    graphType={selectedGraphType}
                />
        </div>
      </div>
    </div>
  );
};

export default App;