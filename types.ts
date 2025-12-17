
export interface Node {
  id: string;
  originalLabel: number; // The starting label (e.g., degree or atom type)
  x?: number;
  y?: number;
}

export interface Link {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface WLStepNodeData {
  id: string;
  label: string; // The compressed label for this step
  originalLabel: number;
  color: string;
  neighbors: string[];
  signature: string; // The multiset signature string before hashing
  expandedSignature?: {
    self: string;
    neighbors: string[];
  };
}

export interface HashMapping {
  signature: string;
  label: string;
  color: string;
}

export interface WLStep {
  k: number;
  nodeDataA: Map<string, WLStepNodeData>; // State for Graph A
  nodeDataB: Map<string, WLStepNodeData>; // State for Graph B
  
  // Stats
  labelCountsA: Record<string, number>;
  labelCountsB: Record<string, number>;
  uniqueLabels: string[]; // All labels present in both graphs this step
  
  // The global dictionary for this step
  mappings: HashMapping[]; 
  
  isIsomorphicCandidate: boolean; // Do the histograms match?
}

export interface SimulationResult {
  steps: WLStep[];
  maxK: number;
}

export enum ScenarioType {
  ISOMORPHIC_PAIR = 'ISOMORPHIC_PAIR',
  ISOMORPHIC_COMPLEX = 'ISOMORPHIC_COMPLEX',
  ISOMORPHIC_TREES = 'ISOMORPHIC_TREES',
  ISOMORPHIC_GRID_3X3 = 'ISOMORPHIC_GRID_3X3', // NEW
  ISOMORPHIC_LADDER = 'ISOMORPHIC_LADDER', // NEW
  
  NON_ISOMORPHIC_SIMPLE = 'NON_ISOMORPHIC_SIMPLE',
  NON_ISOMORPHIC_REGULAR = 'NON_ISOMORPHIC_REGULAR',
  NON_ISOMORPHIC_DEGREE = 'NON_ISOMORPHIC_DEGREE', // NEW
  
  CYCLES = 'CYCLES', // C6 vs 2xC3
  GRID_VS_RANDOM = 'GRID_VS_RANDOM'
}

export interface ScenarioData {
  graphA: GraphData;
  graphB: GraphData;
  description: string;
}