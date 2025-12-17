import { GraphData, Node, Link, ScenarioData, ScenarioType } from '../types';

// --- Generators ---

const createCycle = (n: number, prefix: string, label: number = 1): GraphData => {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, originalLabel: label }));
  const links = Array.from({ length: n }, (_, i) => ({
    source: `${prefix}${i}`,
    target: `${prefix}${(i + 1) % n}`
  }));
  return { nodes, links };
};

const createGrid = (rows: number, cols: number, prefix: string): GraphData => {
  const nodes: Node[] = [];
  const links: Link[] = [];
  for(let r=0; r<rows; r++) {
    for(let c=0; c<cols; c++) {
      const id = `${prefix}_r${r}c${c}`;
      // Checkerboard pattern for labels: (Row+Col)%2
      // Even sum = Label 1, Odd sum = Label 2
      const label = ((r + c) % 2) + 1; 
      nodes.push({ id, originalLabel: label });
      
      if (r < rows - 1) links.push({ source: id, target: `${prefix}_r${r+1}c${c}` });
      if (c < cols - 1) links.push({ source: id, target: `${prefix}_r${r}c${c+1}` });
    }
  }
  return { nodes, links };
};

const createPetersenGraph = (prefix: string): GraphData => {
    // Inner star (0-4) and Outer pentagon (5-9)
    // Let's color them differently to show roles.
    // Outer = Label 1 (Blue), Inner = Label 2 (Red)
    const nodes: Node[] = [];
    for(let i=0; i<10; i++) {
        nodes.push({ 
            id: `${prefix}${i}`, 
            originalLabel: i < 5 ? 1 : 2 // 0-4 Outer(1), 5-9 Inner(2)
        });
    }

    const links: Link[] = [];
    
    // Outer cycle (0-4)
    for(let i=0; i<5; i++) links.push({ source: `${prefix}${i}`, target: `${prefix}${(i+1)%5}` });
    // Inner star (5-9)
    for(let i=0; i<5; i++) links.push({ source: `${prefix}${i+5}`, target: `${prefix}${((i+2)%5)+5}` });
    // Spokes (Connecting outer to inner)
    for(let i=0; i<5; i++) links.push({ source: `${prefix}${i}`, target: `${prefix}${i+5}` });

    return { nodes, links };
};

const createLadderGraph = (rungCount: number, prefix: string, circular: boolean): GraphData => {
    // A ladder is two rails connected by rungs.
    // circular = Mobius Ladder or Circular Prism
    const n = rungCount * 2;
    const nodes = Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, originalLabel: 1 }));
    const links: Link[] = [];

    // Top rail: 0..rungCount-1
    // Bot rail: rungCount..2*rungCount-1
    for(let i=0; i<rungCount; i++) {
        // Rail links
        if (i < rungCount - 1) {
            links.push({ source: `${prefix}${i}`, target: `${prefix}${i+1}` }); // Top
            links.push({ source: `${prefix}${i+rungCount}`, target: `${prefix}${i+rungCount+1}` }); // Bot
        } else if (circular) {
            // Close loop
            links.push({ source: `${prefix}${i}`, target: `${prefix}0` });
            links.push({ source: `${prefix}${i+rungCount}`, target: `${prefix}${rungCount}` });
        }
        
        // Rung links
        links.push({ source: `${prefix}${i}`, target: `${prefix}${i+rungCount}` });
    }
    return { nodes, links };
};

// Helper to permute (shuffle) a graph to create an isomorphic copy
const createPermutedCopy = (graph: GraphData, prefix: string): GraphData => {
  const n = graph.nodes.length;
  // Create a random mapping from old index to new index
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Create mapping: OldID -> NewID
  const oldIdToNewId = new Map<string, string>();
  // We want new IDs to look clean, e.g., "prefix_0", "prefix_1"
  // The node at graph.nodes[i] will be renamed to prefix_{indices[i]}
  graph.nodes.forEach((node, i) => {
      oldIdToNewId.set(node.id, `${prefix}${indices[i]}`);
  });

  const newNodes: Node[] = graph.nodes.map(node => ({
      id: oldIdToNewId.get(node.id)!,
      originalLabel: node.originalLabel // Keep the original label/color!
  }));

  const newLinks: Link[] = graph.links.map(link => ({
      source: oldIdToNewId.get(link.source)!,
      target: oldIdToNewId.get(link.target)!
  }));

  // Shuffle the order in the array to avoid D3 plotting them in same order
  newNodes.sort(() => Math.random() - 0.5);

  return { nodes: newNodes, links: newLinks };
};

// --- Scenarios ---

export const getScenario = (type: ScenarioType): ScenarioData => {
  switch (type) {
    case ScenarioType.ISOMORPHIC_PAIR: {
        // "The House" Graph
        // Base Square: Label 1 (Blue)
        // Roof Tip: Label 2 (Red)
        const nodes = [
            { id: 'A0', originalLabel: 1 }, { id: 'A1', originalLabel: 1 }, // Top of square
            { id: 'A2', originalLabel: 1 }, { id: 'A3', originalLabel: 1 }, // Floor
            { id: 'A4', originalLabel: 2 } // The roof tip (Different Role)
        ];
        const links = [
            { source: 'A0', target: 'A1' }, // base top
            { source: 'A1', target: 'A2' }, // right wall
            { source: 'A2', target: 'A3' }, // floor
            { source: 'A3', target: 'A0' }, // left wall
            { source: 'A4', target: 'A0' }, // roof L
            { source: 'A4', target: 'A1' }  // roof R
        ];
        const graphA = { nodes, links };
        const graphB = createPermutedCopy(graphA, 'B');

        return {
            graphA,
            graphB,
            description: "基础同构：'房子'图。注意【红色节点】代表屋顶，【蓝色节点】代表墙壁。在右图中，红色节点的位置被随机打乱了，但 WL 算法通过邻居关系仍能识别出它是屋顶。"
        };
    }

    case ScenarioType.ISOMORPHIC_COMPLEX: {
        // Petersen Graph (10 nodes)
        // Outer Ring = Label 1, Inner Star = Label 2
        const graphA = createPetersenGraph('P');
        const graphB = createPermutedCopy(graphA, 'Q');

        return {
            graphA,
            graphB,
            description: "复杂同构：彼得森图。外圈设为【蓝色】，内圈设为【红色】。尽管右图看起来杂乱无章，但你可以看到它依然保持了 5个红点、5个蓝点的分布，且连接结构一致。"
        };
    }

    case ScenarioType.ISOMORPHIC_TREES: {
        // Rooted Trees with Hierarchy
        const g1Nodes = [
            {id: 't1_r', originalLabel: 3}, // Root
            {id: 't1_a', originalLabel: 2}, {id: 't1_b', originalLabel: 2}, // Inner
            {id: 't1_a1', originalLabel: 1}, {id: 't1_a2', originalLabel: 1}, // Leaves
            {id: 't1_b1', originalLabel: 1} // Leaf
        ];
        const g1Links = [
            {source: 't1_r', target: 't1_a'}, {source: 't1_r', target: 't1_b'},
            {source: 't1_a', target: 't1_a1'}, {source: 't1_a', target: 't1_a2'},
            {source: 't1_b', target: 't1_b1'}
        ];
        const graphA = { nodes: g1Nodes, links: g1Links };
        const graphB = createPermutedCopy(graphA, 't2');

        return {
            graphA,
            graphB,
            description: "树结构同构：模拟具有层级关系的系统（如文件系统或组织架构）。根节点（绿）、中间层（红）、叶子（蓝）。WL 算法能轻松验证这种层级结构是否一致。"
        };
    }

    case ScenarioType.ISOMORPHIC_GRID_3X3: {
        const graphA = createGrid(3, 3, 'G3');
        const graphB = createPermutedCopy(graphA, 'GP');
        return {
            graphA,
            graphB,
            description: "网格同构：3x3 的棋盘网格。中心点、边中点、角点具有不同的邻居数量和拓扑位置。WL 算法能在 K=1 或 K=2 时迅速将它们区分开来（例如角点有2个邻居，中心点有4个）。"
        };
    }

    case ScenarioType.ISOMORPHIC_LADDER: {
        // Circular Ladder / Prism Graph
        const graphA = createLadderGraph(5, 'L', true); // 10 nodes
        const graphB = createPermutedCopy(graphA, 'LP');
        return {
            graphA,
            graphB,
            description: "环形梯子图：也称为棱柱图。它具有高度的对称性。尽管右图被完全打乱，看起来像一团乱麻，但本质上它仍然是两个相连的环。"
        };
    }

    case ScenarioType.NON_ISOMORPHIC_SIMPLE: {
        // Path vs Star 
        const g1Nodes = [
            {id:'A0', originalLabel: 2}, {id:'A1', originalLabel: 1}, {id:'A2', originalLabel: 1}, 
            {id:'A3', originalLabel: 1}, {id:'A4', originalLabel: 2}
        ];
        const g1Links = [{source:'A0',target:'A1'},{source:'A1',target:'A2'},{source:'A2',target:'A3'},{source:'A3',target:'A4'}];

        const g2Nodes = [
            {id:'B0', originalLabel: 3}, // Center
            {id:'B1', originalLabel: 2}, {id:'B2', originalLabel: 2}, 
            {id:'B3', originalLabel: 2}, {id:'B4', originalLabel: 2}
        ];
        const g2Links = [{source:'B0',target:'B1'},{source:'B0',target:'B2'},{source:'B0',target:'B3'},{source:'B0',target:'B4'}];

        return {
            graphA: { nodes: g1Nodes, links: g1Links },
            graphB: { nodes: g2Nodes, links: g2Links },
            description: "简单非同构：链状图 vs 星状图。即使不看连接，光看标签分布（K=0），我们也能发现图 B 有一个唯一的绿色中心节点（Label 3）。"
        };
    }

    case ScenarioType.NON_ISOMORPHIC_REGULAR: {
        // "Dumbbell" vs "Chorded Circle" with Labels
        const nodesA = [
            {id:'A0', originalLabel: 2}, {id:'A1', originalLabel: 1}, {id:'A2', originalLabel: 1}, 
            {id:'A3', originalLabel: 2}, {id:'A4', originalLabel: 1}, {id:'A5', originalLabel: 1}
        ];
        const linksA = [
            {source:'A0',target:'A1'}, {source:'A1',target:'A2'}, {source:'A2',target:'A0'}, // Tri 1
            {source:'A3',target:'A4'}, {source:'A4',target:'A5'}, {source:'A5',target:'A3'}, // Tri 2
            {source:'A0',target:'A3'} // Bridge
        ];

        const nodesB = [
            {id:'B0', originalLabel: 2}, {id:'B1', originalLabel: 1}, {id:'B2', originalLabel: 1},
            {id:'B3', originalLabel: 2}, {id:'B4', originalLabel: 1}, {id:'B5', originalLabel: 1}
        ];
        const linksB = [
            {source:'B0',target:'B1'}, {source:'B1',target:'B2'}, {source:'B2',target:'B3'},
            {source:'B3',target:'B4'}, {source:'B4',target:'B5'}, {source:'B5',target:'B0'}, // C6
            {source:'B0',target:'B3'} // Chord
        ];

        return {
            graphA: { nodes: nodesA, links: linksA },
            graphB: { nodes: nodesB, links: linksB },
            description: "高阶非同构：特意将度数为3的节点设为红色，度数为2的设为蓝色。K=0 时标签分布一致。观察 K=1 时，哑铃图的红色桥接点连接的是另一个红点，而右图中红点连接的都是蓝点，WL 瞬间发现差异。"
        };
    }

    case ScenarioType.NON_ISOMORPHIC_DEGREE: {
        // Two graphs with the SAME degree sequence but different structure.
        // Graph A: 6 nodes circle
        // Graph B: Two disconnected triangles
        // Wait, standard C6 vs 2xC3 is degree regular.
        // Let's try something slightly less trivial.
        // Graph A: A square with a diagonal (Degree seq: 3,3,2,2)
        // Graph B: A triangle with a tail of length 2? No.
        
        // Let's use:
        // A: 6-cycle with chords forming 3 triangles (Prism 3 aka Ladder 3) - All degree 3
        // B: Two disconnected K4 graphs? No different size.
        
        // Let's stick to a simpler visual difference.
        // A: Line 6 (path)
        // B: Graph with same edges but disconnected components? (e.g. Line 3 + Line 3)
        // Degrees: A=[1,2,2,2,2,1], B=[1,2,1, 1,2,1]. Same distribution of 1s and 2s!
        
        // Graph A: Path 6
        const nA = 6;
        const nodesA = Array.from({length:nA}, (_,i)=>({id:`A${i}`, originalLabel: 1}));
        const linksA = [];
        for(let i=0; i<nA-1; i++) linksA.push({source:`A${i}`, target:`A${i+1}`});

        // Graph B: Two Path 3s
        const nodesB = Array.from({length:nA}, (_,i)=>({id:`B${i}`, originalLabel: 1}));
        const linksB = [
            {source:'B0',target:'B1'}, {source:'B1',target:'B2'},
            {source:'B3',target:'B4'}, {source:'B4',target:'B5'}
        ];

        return {
            graphA: {nodes:nodesA, links:linksA},
            graphB: {nodes:nodesB, links:linksB},
            description: "同度数非同构：长链 vs 两条短链。两者都拥有 2个度为1的节点（端点）和 4个度为2的节点（中间）。K=0 无法区分。但在 K=1 或 K=2，WL 算法会通过邻居的邻居发现长链的端点距离更远。"
        };
    }

    case ScenarioType.CYCLES: {
        const gA = createCycle(6, 'A_C6_'); 
        
        const gB1 = createCycle(3, 'B_C3a_');
        const gB2 = createCycle(3, 'B_C3b_');
        const gB = { 
            nodes: [...gB1.nodes, ...gB2.nodes], 
            links: [...gB1.links, ...gB2.links] 
        };

        return {
            graphA: gA,
            graphB: gB,
            description: "算法失效场景：C6 大环 vs 两个 C3 小环。这是 WL 算法的经典反例。所有节点都是 2 度，所有邻居都是 2 度。无论迭代多少次，所有节点的标签始终相同。WL 无法区分它们。"
        };
    }

    case ScenarioType.GRID_VS_RANDOM: {
        const gA = createGrid(3, 3, 'G'); 
        const gB = createCycle(9, 'C', 1);
        gB.nodes.forEach((n, i) => {
            if (i % 2 !== 0) n.originalLabel = 2;
        });
        gB.links.push({source: 'C0', target: 'C4'});
        gB.links.push({source: 'C2', target: 'C7'});

        return {
            graphA: gA,
            graphB: gB,
            description: "混合场景：3x3 网格 vs 随机连线图。用来展示 WL 算法在一般任意图上的处理能力。"
        };
    }

    default:
        return getScenario(ScenarioType.ISOMORPHIC_PAIR);
  }
};