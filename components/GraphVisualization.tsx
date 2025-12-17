import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, WLStepNodeData } from '../types';

interface Props {
  data: GraphData;
  currentNodeState: Map<string, WLStepNodeData>; // K state
  prevNodeState?: Map<string, WLStepNodeData>;   // K-1 state
  selectedNodeId: string | null;
  onNodeClick: (id: string) => void; 
  label: string;
}

const GraphVisualization: React.FC<Props> = ({ 
  data, 
  currentNodeState, 
  prevNodeState,
  selectedNodeId, 
  onNodeClick,
  label
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topSvgRef = useRef<SVGSVGElement>(null);
  const bottomSvgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Refs to hold latest state for D3 access without re-running simulation setup
  const currentNodeStateRef = useRef(currentNodeState);
  const prevNodeStateRef = useRef(prevNodeState);
  const selectedNodeIdRef = useRef(selectedNodeId);

  useEffect(() => {
    currentNodeStateRef.current = currentNodeState;
    prevNodeStateRef.current = prevNodeState;
    selectedNodeIdRef.current = selectedNodeId;
  }, [currentNodeState, prevNodeState, selectedNodeId]);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.contentRect.width > 0) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Stable D3 Nodes for Simulation (Mutated by D3)
  // We recreate them only if graph structure (ID list) changes
  const d3Nodes = useMemo(() => data.nodes.map(n => ({ ...n })), [data.nodes.map(n=>n.id).join(',')]);
  const d3Links = useMemo(() => data.links.map(l => ({ ...l })), [data.links.map(l=>l.source+l.target).join(',')]);

  // Main D3 Effect
  useEffect(() => {
    if (!topSvgRef.current || !bottomSvgRef.current || dimensions.width === 0) return;

    // Height for each SVG
    const svgHeight = dimensions.height / 2;
    const centerY = svgHeight / 2;
    const centerX = dimensions.width / 2;

    const topSvg = d3.select(topSvgRef.current);
    const bottomSvg = d3.select(bottomSvgRef.current);

    // Clear Previous
    topSvg.selectAll("*").remove();
    bottomSvg.selectAll("*").remove();

    // Setup Simulation
    const simulation = d3.forceSimulation(d3Nodes as any)
      .force("link", d3.forceLink(d3Links).id((d: any) => d.id).distance(45))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(centerX, centerY))
      .force("collide", d3.forceCollide().radius(28));

    // Render Function to create elements in a specific SVG
    const renderGraph = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, isInteractive: boolean) => {
        const g = svg.append("g");
        
        // Zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoom);

        // Links
        const link = g.append("g")
            .attr("stroke", "#d0d7de")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(d3Links)
            .join("line")
            .attr("stroke-width", 2);

        // Node Groups
        const nodeGroup = g.append("g")
            .selectAll("g")
            .data(d3Nodes)
            .join("g")
            .attr("cursor", "pointer");

        // Drag (Attach to both so user can interact with either to move the shared model)
        nodeGroup.call(d3.drag<any, any>()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            })
        );
        
        nodeGroup.on("click", (event, d) => {
            onNodeClick(d.id);
            event.stopPropagation();
        });

        // Selection Highlight Ring
        const highlight = nodeGroup.append("circle")
            .attr("class", "highlight-ring")
            .attr("r", 34)
            .attr("fill", "none")
            .attr("stroke", "#f59e0b") // Amber
            .attr("stroke-width", 0)
            .attr("opacity", 0);

        // Main Node Circle
        const circle = nodeGroup.append("circle")
            .attr("r", 20)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("class", "node-circle");

        // Label
        const text = nodeGroup.append("text")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-family", "JetBrains Mono")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .style("pointer-events", "none");

        return { g, link, nodeGroup, circle, text, highlight };
    };

    // Instantiate both graphs
    const topGraph = renderGraph(topSvg, true); 
    const bottomGraph = renderGraph(bottomSvg, true); 

    // Tick Function: Update positions for BOTH
    simulation.on("tick", () => {
        [topGraph, bottomGraph].forEach(graph => {
            graph.link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
            
            graph.nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });
    });

    // Update Visuals Function (Scoped)
    const updateVisuals = () => {
        const curState = currentNodeStateRef.current;
        const prevState = prevNodeStateRef.current;
        const selId = selectedNodeIdRef.current;

        // --- Top Graph (Current) ---
        topGraph.circle.transition().duration(500)
            .attr("fill", (d: any) => curState.get(d.id)?.color || '#cfd7de');
        topGraph.text.text((d: any) => curState.get(d.id)?.label || '?');

        // --- Bottom Graph (Previous) ---
        bottomGraph.circle.transition().duration(500)
            .attr("fill", (d: any) => prevState ? prevState.get(d.id)?.color || '#cfd7de' : '#f3f4f6')
            .attr("stroke", prevState ? "#ffffff" : "#e5e7eb");
        
        bottomGraph.text
            .text((d: any) => prevState ? prevState.get(d.id)?.label || '?' : '')
            .attr("fill", prevState ? "white" : "transparent");

        // --- Highlighting (Both) ---
        [topGraph, bottomGraph].forEach(graph => {
            // Stop previous transitions
            graph.highlight.interrupt();
            
            if (selId) {
                const ring = graph.highlight.filter((d: any) => d.id === selId);
                const others = graph.highlight.filter((d: any) => d.id !== selId);
                
                // Hide others
                others.attr("opacity", 0).attr("stroke-width", 0);

                // Show selected
                ring.attr("opacity", 1).attr("stroke-width", 3);

                // Pulse Animation (Defined inside loop to ensure closure scope is correct if needed, but d3 manages it)
                const pulse = () => {
                    ring.transition().duration(800).ease(d3.easeSinOut)
                        .attr("stroke-width", 6).attr("opacity", 0.5)
                        .transition().duration(800).ease(d3.easeSinIn)
                        .attr("stroke-width", 3).attr("opacity", 1)
                        .on("end", pulse);
                };
                pulse();
            } else {
                graph.highlight.attr("opacity", 0).attr("stroke-width", 0);
            }
        });
    };

    // Attach update function to ref for external access
    (containerRef.current as any).updateAllVisuals = updateVisuals;
    
    // Initial update
    updateVisuals();

    return () => { simulation.stop(); };
  }, [d3Nodes, d3Links, dimensions]); // Re-run only on resizing or graph structure change

  // Separate Effect for updates (color/selection) without restarting sim
  useEffect(() => {
    if (containerRef.current && (containerRef.current as any).updateAllVisuals) {
        (containerRef.current as any).updateAllVisuals();
    }
  }, [currentNodeState, prevNodeState, selectedNodeId]);

  return (
    <div ref={containerRef} className="flex flex-col h-full border border-[#d0d7de] rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Header (Shared) */}
        <div className="border-b border-[#d0d7de] px-2 py-1.5 text-[10px] font-bold uppercase bg-[#f6f8fa] text-[#24292f] flex justify-between">
             <span>{label}</span>
             <span className="text-[#0969da]">{data.nodes.length} 节点</span>
        </div>

        {/* Top Half: Current */}
        <div className="flex-1 border-b border-[#d0d7de] relative group" style={{ minHeight: '50%' }}>
            <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#0969da] border border-[#d0d7de] rounded shadow-sm">
                当前状态 (Current)
            </div>
            <svg ref={topSvgRef} width="100%" height="100%" className="block w-full h-full outline-none" />
        </div>

        {/* Bottom Half: Previous */}
        <div className="flex-1 relative group bg-[#fcfcfc]" style={{ minHeight: '50%' }}>
             <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#57606a] border border-[#d0d7de] rounded shadow-sm">
                上一轮状态 (K-1)
            </div>
             <svg ref={bottomSvgRef} width="100%" height="100%" className="block w-full h-full outline-none" />
             
             {!prevNodeState && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/60 backdrop-blur-[1px]">
                     <span className="text-xs text-gray-400 font-medium">无上一轮历史 (K=0)</span>
                 </div>
             )}
        </div>
    </div>
  );
};

export default GraphVisualization;