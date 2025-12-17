import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, Node, WLStep } from '../types';
import { getColorForLabel } from '../constants';

interface Props {
  graph: GraphData;
  rootId: string;
  depth: number;
  allSteps: WLStep[];
  graphType: 'A' | 'B';
}

interface TreeNode {
  id: string; 
  graphNodeId: string;
  originalLabel: number;
  children?: TreeNode[];
}

const SubtreeVisualization: React.FC<Props> = ({ graph, rootId, depth, allSteps, graphType }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Build the Tree Data Structure
  const treeData = useMemo(() => {
    if (!rootId || !graph) return null;

    const adj = new Map<string, string[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));
    graph.links.forEach(l => {
        adj.get(l.source)?.push(l.target);
        adj.get(l.target)?.push(l.source);
    });

    const nodeMap = new Map<string, Node>();
    graph.nodes.forEach(n => nodeMap.set(n.id, n));

    let uniqueCounter = 0;

    const build = (currentId: string, currentDepth: number): TreeNode => {
      const node = nodeMap.get(currentId);
      const uId = `${currentId}-${uniqueCounter++}`;
      
      const treeNode: TreeNode = {
        id: uId,
        graphNodeId: currentId,
        originalLabel: node?.originalLabel || 0,
        children: []
      };

      if (currentDepth < depth) {
        const neighbors = adj.get(currentId) || [];
        neighbors.sort(); 
        treeNode.children = neighbors.map(nid => build(nid, currentDepth + 1));
      }
      return treeNode;
    };

    return build(rootId, 0);

  }, [graph, rootId, depth]);

  // 2. Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      if(entries[0].contentRect.width > 0) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 3. D3 Render
  useEffect(() => {
    if (!svgRef.current || !treeData || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 70, right: 30, bottom: 40, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const rootRaw = d3.hierarchy<TreeNode>(treeData);
    
    const treeLayout = d3.tree<TreeNode>()
        .size([innerWidth, innerHeight])
        .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.6));

    const root = treeLayout(rootRaw) as d3.HierarchyPointNode<TreeNode>;

    // --- 1. BACKGROUND LAYERS (DEPTH BANDS) ---
    // Fix: Explicitly type Array.from and sort arguments to avoid unknown type errors
    const distinctY: number[] = Array.from<number>(new Set(root.descendants().map(d => d.y))).sort((a,b) => a - b);
    
    const bgGroup = svg.append("g");
    if (distinctY.length > 0) {
        const levelHeight = distinctY.length > 1 ? (distinctY[1] - distinctY[0]) : 100;
        distinctY.forEach((y, i) => {
            const bandColor = i % 2 === 0 ? "#f6f8fa" : "#ffffff";
            bgGroup.append("rect")
                .attr("x", 0)
                .attr("y", margin.top + y - levelHeight/2)
                .attr("width", width)
                .attr("height", levelHeight)
                .attr("fill", bandColor)
                .attr("opacity", 0.5);

            // Annotation for depth
            const currentLayerK = depth - i;
            bgGroup.append("text")
                .attr("x", 10)
                .attr("y", margin.top + y)
                .attr("dy", "0.3em")
                .attr("text-anchor", "start")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("fill", "#9ca3af")
                .text(`K-${i} (${currentLayerK})`);
        });
    }

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- 2. LINKS ---
    g.selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1.5)
        .attr("d", d3.linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
            .x(d => d.x)
            .y(d => d.y) as any
        );

    // --- 3. NODES ---
    const node = g.selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    // Node Circle (Atomic/Original Color)
    node.append("circle")
        .attr("r", (d: any) => Math.max(6, 16 - d.depth * 2)) 
        .attr("fill", (d: any) => getColorForLabel(d.data.originalLabel.toString()))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("class", "shadow-sm");
    
    // Original Label Text (Inside Circle)
    node.append("text")
        .attr("dy", "0.3em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", (d: any) => Math.max(0, 10 - d.depth * 2) + "px") 
        .attr("font-weight", "bold")
        .text((d: any) => d.data.originalLabel);


    // --- 4. INTERMEDIATE WL LABEL BADGES ---
    // This is the core new feature: Show the label that THIS node had at THAT step in time.
    // Node at depth 'd' in visualization represents the node's state at Step 'depth - d'.
    // e.g., Root (d=0) is at Step K. Child (d=1) is at Step K-1.
    node.each(function(d: any) {
        const stepIndex = depth - d.depth;
        
        if (stepIndex >= 0 && stepIndex < allSteps.length) {
            const step = allSteps[stepIndex];
            const nodeData = graphType === 'A' 
                ? step.nodeDataA.get(d.data.graphNodeId) 
                : step.nodeDataB.get(d.data.graphNodeId);
            
            if (nodeData) {
                const label = nodeData.label;
                const color = nodeData.color;

                const badgeGroup = d3.select(this).append("g")
                    .attr("transform", "translate(10, -10)"); // Top-right offset

                // Badge Rect
                badgeGroup.append("rect")
                    .attr("x", 0)
                    .attr("y", -8)
                    .attr("width", 20)
                    .attr("height", 14)
                    .attr("rx", 3)
                    .attr("fill", color)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);
                
                // Badge Text
                badgeGroup.append("text")
                    .attr("x", 10)
                    .attr("y", 1)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("font-size", "9px")
                    .attr("font-family", "monospace")
                    .attr("font-weight", "bold")
                    .text(label);
            }
        }
    });

  }, [treeData, dimensions, allSteps]);

  if (!treeData) return <div className="text-xs text-gray-400 p-4 text-center">无法构建子树</div>;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white">
        <svg ref={svgRef} width="100%" height="100%" style={{ overflow: 'visible' }} />
        
        {/* Legend Top Right */}
        <div className="absolute top-2 right-2 bg-white/95 p-2 rounded-md border border-gray-200 shadow-sm text-[10px] text-gray-500 min-w-[130px] backdrop-blur-sm z-10 flex flex-col gap-1">
            <div className="font-bold text-gray-700 border-b border-gray-100 pb-1">图例 (Legend)</div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400 border border-white"></span>
                <span>原始原子值 (K=0)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-[#8250df] rounded text-[8px] text-white flex items-center justify-center">L</div>
                <span>该层产生的 WL 标签</span>
            </div>
        </div>
    </div>
  );
};

export default SubtreeVisualization;