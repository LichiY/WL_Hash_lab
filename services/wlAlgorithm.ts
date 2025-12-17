import { GraphData, Node, Link, WLStep, WLStepNodeData, SimulationResult, HashMapping } from '../types';
import { getColorForLabel } from '../constants';

// Helper to get adjacency list
const getAdjacencyList = (nodes: Node[], links: Link[]): Map<string, string[]> => {
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  links.forEach(l => {
    if(adj.has(l.source) && adj.has(l.target)){
        adj.get(l.source)?.push(l.target);
        adj.get(l.target)?.push(l.source);
    }
  });
  return adj;
};

// Check if two count records are identical
const areCountsEqual = (c1: Record<string, number>, c2: Record<string, number>): boolean => {
  const keys1 = Object.keys(c1);
  const keys2 = Object.keys(c2);
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (c1[k] !== c2[k]) return false;
  }
  return true;
};

export const runWLAlgorithm = (graphA: GraphData, graphB: GraphData, maxK: number): SimulationResult => {
  const adjA = getAdjacencyList(graphA.nodes, graphA.links);
  const adjB = getAdjacencyList(graphB.nodes, graphB.links);
  const steps: WLStep[] = [];

  // GLOBAL Counter for Label IDs. 
  // We do NOT reset this between steps. This ensures that Label "1" in K=0
  // becomes Label "5" (or similar) in K=1, making the change visually obvious.
  // This solves the "1 -> (1, [2,2,4]) -> 1" confusion.
  let globalLabelCounter = 0;

  // Initial Label State (NodeID -> Label)
  let currentLabelsA = new Map<string, string>();
  let currentLabelsB = new Map<string, string>();

  // --- Initialization Phase (K=0) ---
  // To ensure determinstic starting IDs, we collect all initial values, sort them, and map to 1..N
  const allInitialValues = new Set<number>();
  graphA.nodes.forEach(n => allInitialValues.add(n.originalLabel));
  graphB.nodes.forEach(n => allInitialValues.add(n.originalLabel));
  
  const sortedInitLabels = Array.from(allInitialValues).sort((a, b) => a - b);
  const initLabelMap = new Map<number, string>();
  
  sortedInitLabels.forEach(val => {
      globalLabelCounter++;
      initLabelMap.set(val, globalLabelCounter.toString());
  });

  // Apply Initial Labels
  graphA.nodes.forEach(n => currentLabelsA.set(n.id, initLabelMap.get(n.originalLabel)!));
  graphB.nodes.forEach(n => currentLabelsB.set(n.id, initLabelMap.get(n.originalLabel)!));

  // Function to process a single step
  const processStep = (k: number, labelsA: Map<string, string>, labelsB: Map<string, string>, prevLabelsA: Map<string, string>, prevLabelsB: Map<string, string>) => {
    
    // We need to generate signatures for ALL nodes in both graphs first,
    // then sort those signatures, and THEN assign new IDs.
    // This ensures deterministic mapping.

    interface NodeSig {
        graph: 'A' | 'B';
        id: string;
        signature: string;
        expanded: { self: string, neighbors: string[] };
    }

    const allSigs: NodeSig[] = [];

    const generateSig = (gNodes: Node[], adj: Map<string, string[]>, prevLabs: Map<string, string>, graphType: 'A' | 'B') => {
        gNodes.forEach(node => {
            if (k === 0) {
                // For K=0, we act as if the "signature" is just the initial mapped label
                // But we still create a record for the visualizer
                const lbl = prevLabs.get(node.id)!;
                allSigs.push({
                    graph: graphType,
                    id: node.id,
                    signature: `[${node.originalLabel}]`, // Display original raw value in sig
                    expanded: { self: node.originalLabel.toString(), neighbors: [] }
                });
            } else {
                const myPrevLabel = prevLabs.get(node.id)!;
                const neighborIds = adj.get(node.id) || [];
                const neighborLabels = neighborIds.map(nid => prevLabs.get(nid)!);
                // Sort neighbors for multiset invariance
                neighborLabels.sort((a, b) => parseInt(a) - parseInt(b));

                const signature = `(${myPrevLabel},[${neighborLabels.join(',')}])`;
                allSigs.push({
                    graph: graphType,
                    id: node.id,
                    signature: signature,
                    expanded: { self: myPrevLabel, neighbors: neighborLabels }
                });
            }
        });
    };

    generateSig(graphA.nodes, adjA, prevLabelsA, 'A');
    generateSig(graphB.nodes, adjB, prevLabelsB, 'B');

    // Identify unique signatures and assign NEW Global IDs
    const uniqueSignatures = Array.from(new Set(allSigs.map(s => s.signature))).sort();
    
    // Map Signature -> New Label ID
    const stepMapping = new Map<string, string>();
    const mappingList: HashMapping[] = [];

    uniqueSignatures.forEach(sig => {
        // If K=0, we already assigned IDs in the init phase, effectively.
        // But for visualization consistency in the table, we re-verify or just lookup.
        // Actually, for K>0, we ALWAYS generate new IDs.
        
        if (k === 0) {
            // Reverse lookup based on our init logic? 
            // The signature is `[raw]`. We want the mapped ID.
            // Let's just use the currentLabels map we set up earlier to find the ID.
            // This is a bit circular for K=0 but fine for Viz.
            // We'll skip ID generation for K=0 since we did it in init block.
        } else {
            globalLabelCounter++;
            const newId = globalLabelCounter.toString();
            stepMapping.set(sig, newId);
            mappingList.push({
                signature: sig,
                label: newId,
                color: getColorForLabel(newId)
            });
        }
    });

    // Special handling for K=0 Mapping List Display
    if (k === 0) {
        sortedInitLabels.forEach(val => {
            const id = initLabelMap.get(val)!;
            mappingList.push({
                signature: `Initial: ${val}`,
                label: id,
                color: getColorForLabel(id)
            });
            stepMapping.set(`[${val}]`, id); // Ensure lookup works below
        });
    }

    // Now build the result data
    const nextLabsA = new Map<string, string>();
    const nextLabsB = new Map<string, string>();
    const nodeDataA = new Map<string, WLStepNodeData>();
    const nodeDataB = new Map<string, WLStepNodeData>();
    const countsA: Record<string, number> = {};
    const countsB: Record<string, number> = {};

    allSigs.forEach(item => {
        const newLabel = stepMapping.get(item.signature)!;
        
        // Save for next round
        if (item.graph === 'A') nextLabsA.set(item.id, newLabel);
        else nextLabsB.set(item.id, newLabel);

        // Stats
        if (item.graph === 'A') countsA[newLabel] = (countsA[newLabel] || 0) + 1;
        else countsB[newLabel] = (countsB[newLabel] || 0) + 1;

        // Visual Data
        const nodeData: WLStepNodeData = {
            id: item.id,
            originalLabel: 0, // Not used much in display, handled by signature
            label: newLabel,
            color: getColorForLabel(newLabel),
            neighbors: [], // Filled below if needed, but handled by expandedSignature
            signature: item.signature,
            expandedSignature: item.expanded
        };

        if (item.graph === 'A') nodeDataA.set(item.id, nodeData);
        else nodeDataB.set(item.id, nodeData);
    });

    const uniqueLabels = Array.from(new Set([...Object.keys(countsA), ...Object.keys(countsB)]))
        .sort((a, b) => parseInt(a) - parseInt(b));

    return {
        step: {
            k: k,
            nodeDataA,
            nodeDataB,
            labelCountsA: countsA,
            labelCountsB: countsB,
            uniqueLabels,
            mappings: mappingList,
            isIsomorphicCandidate: areCountsEqual(countsA, countsB)
        },
        nextLabelsA: nextLabsA,
        nextLabelsB: nextLabsB
    };
  };

  // Run Step 0 (Using the initialized labels)
  const result0 = processStep(0, currentLabelsA, currentLabelsB, currentLabelsA, currentLabelsB);
  steps.push(result0.step);

  // Run Step 1..MaxK
  for (let k = 1; k <= maxK; k++) {
      // Create snapshots of labels at start of this step
      const prevA = new Map(currentLabelsA);
      const prevB = new Map(currentLabelsB);
      
      const res = processStep(k, currentLabelsA, currentLabelsB, prevA, prevB);
      steps.push(res.step);
      
      currentLabelsA = res.nextLabelsA;
      currentLabelsB = res.nextLabelsB;
  }

  return { steps, maxK };
};