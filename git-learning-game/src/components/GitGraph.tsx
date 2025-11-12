import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GitCommit, GitRef } from '../types';

interface GitGraphProps {
  commits: GitCommit[];
  refs: GitRef[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  oid: string;
  message: string;
  branch: number;
  refs: GitRef[];
  timestamp: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
}

export function GitGraph({ commits, refs }: GitGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || commits.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(500, commits.length * 80 + 200);
    const commitRadius = 20;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Add gradient definitions for visual appeal
    const defs = svg.append('defs');
    
    // Commit gradient (yellow/gold)
    const commitGradient = defs.append('radialGradient')
      .attr('id', 'commit-gradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    commitGradient.append('stop').attr('offset', '0%').attr('stop-color', '#FDB022');
    commitGradient.append('stop').attr('offset', '100%').attr('stop-color', '#F59E0B');

    // HEAD gradient (blue)
    const headGradient = defs.append('radialGradient')
      .attr('id', 'head-gradient')
      .attr('cx', '30%')
      .attr('cy', '30%');
    headGradient.append('stop').attr('offset', '0%').attr('stop-color', '#60A5FA');
    headGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3B82F6');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create graph structure
    const commitMap = new Map<string, GraphNode>();
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Assign branch lanes
    const branchLanes = new Map<string, number>();
    let nextLane = 0;

    // Build nodes
    commits.forEach((commit, index) => {
      const commitRefs = refs.filter(ref => ref.oid === commit.oid);
      let lane = 0;

      for (const ref of commitRefs) {
        if (branchLanes.has(ref.name)) {
          lane = branchLanes.get(ref.name)!;
          break;
        }
      }

      if (lane === 0 && commitRefs.length > 0) {
        lane = nextLane++;
        branchLanes.set(commitRefs[0].name, lane);
      }

      const node: GraphNode = {
        oid: commit.oid,
        message: commit.message,
        branch: lane,
        refs: commitRefs,
        timestamp: commit.author.timestamp,
        x: width / 2 + lane * 120,
        y: 100 + index * 100,
      };

      nodes.push(node);
      commitMap.set(commit.oid, node);
    });

    // Build links
    commits.forEach(commit => {
      const node = commitMap.get(commit.oid)!;
      commit.parent.forEach(parentOid => {
        const parentNode = commitMap.get(parentOid);
        if (parentNode) {
          links.push({ source: node.oid, target: parentNode.oid });
        }
      });
    });

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.oid)
        .distance(120)
        .strength(0.8))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('x', d3.forceX<GraphNode>(d => width / 2 + d.branch * 120).strength(0.3))
      .force('y', d3.forceY<GraphNode>((d, i) => 100 + i * 100).strength(0.5))
      .force('collision', d3.forceCollide().radius(commitRadius + 30));

    simulationRef.current = simulation;

    // Create arrow marker for links
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-10 -5 10 10')
      .attr('refX', -5)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M-10,-5 L0,0 L-10,5')
      .attr('fill', '#FDB022')
      .attr('opacity', 0.6);

    // Draw links with curved paths
    const linkGroup = svg.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('.link')
      .data(links)
      .join('path')
      .attr('class', 'link')
      .attr('stroke', '#FDB022')
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('opacity', 0)
      .attr('marker-end', 'url(#arrowhead)')
      .style('pointer-events', 'none');

    // Animate links appearance
    link.transition()
      .duration(500)
      .delay((d, i) => i * 100)
      .attr('opacity', 0.6);

    // Draw commit nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const nodeGroups = nodeGroup
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .attr('opacity', 0)
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);

    // Animate nodes appearance
    nodeGroups
      .transition()
      .duration(500)
      .delay((d, i) => i * 100)
      .attr('opacity', 1);

    // Add commit circles with glow
    nodeGroups
      .append('circle')
      .attr('class', 'commit-circle')
      .attr('r', 0)
      .attr('fill', d => {
        const isHead = d.refs.some(ref => ref.type === 'HEAD');
        return isHead ? 'url(#head-gradient)' : 'url(#commit-gradient)';
      })
      .attr('stroke', d => {
        const isHead = d.refs.some(ref => ref.type === 'HEAD');
        return isHead ? '#3B82F6' : '#FDB022';
      })
      .attr('stroke-width', 3)
      .attr('filter', 'url(#glow)')
      .transition()
      .duration(600)
      .ease(d3.easeElasticOut)
      .attr('r', commitRadius);

    // Add inner highlight
    nodeGroups
      .append('circle')
      .attr('r', commitRadius / 2)
      .attr('fill', '#fff')
      .attr('opacity', 0.3)
      .attr('pointer-events', 'none');

    // Add commit hash labels
    nodeGroups
      .append('text')
      .attr('class', 'commit-hash')
      .attr('x', 0)
      .attr('y', commitRadius + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('font-family', 'monospace')
      .attr('fill', '#94A3B8')
      .attr('font-weight', 'bold')
      .text(d => d.oid.substring(0, 7));

    // Add hover effects
    nodeGroups
      .on('mouseenter', function(event, d) {
        d3.select(this).select('.commit-circle')
          .transition()
          .duration(200)
          .attr('r', commitRadius * 1.2)
          .attr('stroke-width', 4);

        // Show tooltip
        const [x, y] = d3.pointer(event, containerRef.current);
        setTooltip({
          x,
          y: y - 80,
          content: `${d.message}\n${d.oid.substring(0, 7)}\n${new Date(d.timestamp * 1000).toLocaleString()}`,
        });
      })
      .on('mouseleave', function() {
        d3.select(this).select('.commit-circle')
          .transition()
          .duration(200)
          .attr('r', commitRadius)
          .attr('stroke-width', 3);

        setTooltip(null);
      })
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', d => `Commit: ${d.message}`);

    // Add ref labels with animation
    nodeGroups
      .selectAll('.ref-label')
      .data(d => d.refs)
      .join('g')
      .attr('class', 'ref-label')
      .attr('transform', (d, i) => `translate(0, ${-commitRadius - 25 - i * 22})`)
      .attr('opacity', 0)
      .each(function (ref) {
        const group = d3.select(this);
        
        const bgColor = ref.type === 'HEAD' ? '#3B82F6' : 
                        ref.type === 'tag' ? '#F59E0B' : '#10B981';
        
        const text = group
          .append('text')
          .attr('font-size', 12)
          .attr('font-weight', 'bold')
          .attr('fill', '#fff')
          .attr('text-anchor', 'middle')
          .text(ref.name);

        const bbox = (text.node() as SVGTextElement).getBBox();
        
        group
          .insert('rect', 'text')
          .attr('x', bbox.x - 6)
          .attr('y', bbox.y - 3)
          .attr('width', bbox.width + 12)
          .attr('height', bbox.height + 6)
          .attr('rx', 6)
          .attr('fill', bgColor)
          .attr('filter', 'url(#glow)');

        // Add HEAD indicator emoji for HEAD ref
        if (ref.type === 'HEAD') {
          group
            .append('text')
            .attr('x', bbox.x - 20)
            .attr('y', bbox.y + bbox.height / 2 + 2)
            .attr('font-size', 16)
            .text('👤');
        }
      })
      .transition()
      .duration(400)
      .delay((d, i) => 300 + i * 100)
      .attr('opacity', 1);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      // Update links with curved paths
      link.attr('d', (d: any) => {
        const source = d.source;
        const target = d.target;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });

      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragStarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [commits, refs]);

  return (
    <div ref={containerRef} className="bg-gray-900 rounded-xl p-6 overflow-auto relative border border-gray-700 shadow-2xl">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🌳</span>
        Git Graph
        <span className="text-xs text-gray-400 ml-2">(drag nodes to rearrange)</span>
      </h3>
      {commits.length === 0 ? (
        <div className="text-gray-400 text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">No commits yet.</p>
          <p className="text-sm mt-2">Make your first commit to see the graph!</p>
        </div>
      ) : (
        <>
          <svg ref={svgRef} className="w-full" />
          {tooltip && (
            <div
              className="absolute bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none z-50"
              style={{ left: tooltip.x, top: tooltip.y, maxWidth: '300px' }}
            >
              {tooltip.content.split('\n').map((line, i) => (
                <div key={i} className={i === 0 ? 'font-bold' : 'text-gray-300 text-xs'}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

