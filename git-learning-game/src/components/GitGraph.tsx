import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { GitCommit, GitRef } from '../types';

interface GitGraphProps {
  commits: GitCommit[];
  refs: GitRef[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  oid: string;
  message: string;
  order: number;
  lane: number;
  refs: GitRef[];
  branchName: string;
  isHead: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const BRANCH_COLORS = [
  '#60a5fa',
  '#f472b6',
  '#facc15',
  '#34d399',
  '#c084fc',
  '#f97316',
  '#f87171',
];

function getNodeId(nodeOrString: string | GraphNode): string {
  return typeof nodeOrString === 'string' ? nodeOrString : nodeOrString.id;
}

function createLinkPath(link: GraphLink) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;

  if (!source || !target || source.x === undefined || target.x === undefined || source.y === undefined || target.y === undefined) {
    return '';
  }

  const midX = (source.x + target.x) / 2;
  const verticalOffset = 60;
  const controlY = Math.min(source.y, target.y) - verticalOffset;

  return `M ${source.x} ${source.y} Q ${midX} ${controlY} ${target.x} ${target.y}`;
}

export function GitGraph({ commits, refs }: GitGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 560 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions(prev => ({
          width: Math.max(width, 600),
          height: Math.max(height, prev.height),
        }));
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (commits.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const branchLaneMap = new Map<string, number>();
    let nextLane = 0;

    const branchNames = refs
      .filter(ref => ref.type === 'branch')
      .map(ref => ref.name);

    const branchColorScale = d3
      .scaleOrdinal<string, string>()
      .domain(branchNames)
      .range(BRANCH_COLORS);

    const nodes: GraphNode[] = commits.map((commit, index) => {
      const commitRefs = refs.filter(ref => ref.oid === commit.oid);
      const headRef = commitRefs.find(ref => ref.type === 'HEAD');
      const branchRef = commitRefs.find(ref => ref.type === 'branch');

      const branchName = headRef?.name ?? branchRef?.name ?? 'main';

      if (!branchLaneMap.has(branchName)) {
        branchLaneMap.set(branchName, nextLane);
        nextLane += 1;
      }

      const lane = branchLaneMap.get(branchName) ?? 0;

      return {
        id: commit.oid,
        oid: commit.oid,
        message: commit.message || '(no message)',
        refs: commitRefs,
        branchName,
        isHead: Boolean(headRef),
        order: commits.length - index,
        lane,
        x: undefined,
        y: undefined,
        fx: undefined,
        fy: undefined,
        vx: undefined,
        vy: undefined,
      };
    });

    const existingCommits = new Set(commits.map(c => c.oid));
    const links: GraphLink[] = [];

    commits.forEach(commit => {
      commit.parent.forEach(parentOid => {
        if (existingCommits.has(parentOid)) {
          links.push({
            source: commit.oid,
            target: parentOid,
          });
        }
      });
    });

    const height = Math.max(dimensions.height, Math.max(nodes.length * 120, 500));
    const width = dimensions.width;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-labelledby', 'git-graph-title')
      .attr('tabindex', -1);

    const defs = svg.append('defs');
    const gridPattern = defs
      .append('pattern')
      .attr('id', 'graph-grid')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 40)
      .attr('height', 40);

    gridPattern
      .append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.45);

    const headGradient = defs
      .append('radialGradient')
      .attr('id', 'head-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    headGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f0f9ff');
    headGradient.append('stop').attr('offset', '65%').attr('stop-color', '#38bdf8');
    headGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9');

    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#475569')
      .attr('opacity', 0.6);

    const rootGroup = svg.append('g').attr('class', 'graph-root');
    rootGroup
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#graph-grid)')
      .attr('opacity', 0.35);

    const linkGroup = rootGroup
      .append('g')
      .attr('class', 'links')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.6)
      .attr('stroke-opacity', 0.5)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    const nodeGroup = rootGroup.append('g').attr('class', 'nodes');

    const linkSelection = linkGroup.selectAll<SVGPathElement, GraphLink>('path').data(links, d => `${getNodeId(d.source)}-${getNodeId(d.target)}`);

    const linkEnter = linkSelection
      .enter()
      .append('path')
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', d => (getNodeId(d.source) === getNodeId(d.target) ? '2 4' : ''))
      .attr('opacity', 0);

    const linkMerge = linkEnter.merge(linkSelection as any);

    if (!prefersReducedMotion) {
      linkEnter
        .transition()
        .duration(600)
        .attr('opacity', 0.65);
    } else {
      linkMerge.attr('opacity', 0.65);
    }

    const nodeSelection = nodeGroup.selectAll<SVGGElement, GraphNode>('.node').data(nodes, d => d.id);

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('tabindex', 0)
      .attr('role', 'listitem')
      .attr('aria-label', d => `Commit ${d.oid.substring(0, 7)}: ${d.message}`)
      .attr('data-commit-id', d => d.oid);

    nodeEnter.append('title').text(d => `Commit ${d.oid}\n${d.message}`);

    nodeEnter
      .append('circle')
      .attr('class', 'head-ring')
      .attr('r', 20)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('opacity', d => (d.isHead ? 1 : 0));

    const commitCircle = nodeEnter
      .append('circle')
      .attr('class', 'commit-node')
      .attr('r', prefersReducedMotion ? 14 : 0)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5)
      .attr('fill', d => {
        if (d.isHead) {
          return 'url(#head-gradient)';
        }
        if (branchColorScale.domain().includes(d.branchName)) {
          return branchColorScale(d.branchName);
        }
        return '#3b82f6';
      })
      .attr('filter', 'drop-shadow(0px 4px 6px rgba(14,165,233,0.25))');

    if (!prefersReducedMotion) {
      commitCircle
        .transition()
        .duration(700)
        .ease(d3.easeElastic.period(0.6))
        .attr('r', 14);
    } else {
      commitCircle.attr('r', 14);
    }

    nodeEnter
      .append('text')
      .attr('class', 'commit-hash')
      .attr('font-size', 12)
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .attr('fill', '#e2e8f0')
      .attr('x', 22)
      .attr('y', -2)
      .text(d => d.oid.substring(0, 7));

    nodeEnter
      .append('text')
      .attr('class', 'commit-message')
      .attr('font-size', 12)
      .attr('fill', '#cbd5f5')
      .attr('x', 22)
      .attr('y', 14)
      .text(d => {
        const maxLength = 46;
        return d.message.length > maxLength ? `${d.message.substring(0, maxLength)}…` : d.message;
      });

    nodeEnter.append('g').attr('class', 'ref-badges');

    const nodeMerge = nodeEnter.merge(nodeSelection as any);

    nodeMerge
      .select<SVGCircleElement>('circle.commit-node')
      .attr('fill', d => {
        if (d.isHead) {
          return 'url(#head-gradient)';
        }
        if (branchColorScale.domain().includes(d.branchName)) {
          return branchColorScale(d.branchName);
        }
        return '#3b82f6';
      });

    nodeMerge
      .select<SVGCircleElement>('circle.head-ring')
      .attr('opacity', d => (d.isHead ? 1 : 0))
      .attr('stroke-dasharray', d => (d.isHead ? '0' : '4 6'));

    nodeMerge
      .select<SVGTextElement>('text.commit-hash')
      .text(d => d.oid.substring(0, 7))
      .attr('aria-hidden', 'true');

    nodeMerge
      .select<SVGTextElement>('text.commit-message')
      .text(d => {
        const maxLength = 56;
        return d.message.length > maxLength ? `${d.message.substring(0, maxLength)}…` : d.message;
      })
      .attr('aria-hidden', 'true');

    nodeMerge.each(function (nodeData: GraphNode) {
      const badgeGroup = d3.select(this).select<SVGGElement>('g.ref-badges');

      const badgeSelection = badgeGroup
        .selectAll<SVGGElement, GitRef>('g.badge')
        .data(nodeData.refs, ref => ref.name);

      const badgeEnter = badgeSelection
        .enter()
        .append('g')
        .attr('class', 'badge')
        .attr('transform', (_: GitRef, idx: number) => `translate(${20}, ${-26 - idx * 24})`);

      badgeEnter
        .append('rect')
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', ref => {
          if (ref.type === 'HEAD') return '#0ea5e9';
          if (ref.type === 'tag') return '#f97316';
          return '#7c3aed';
        })
        .attr('opacity', 0.9);

      badgeEnter
        .append('text')
        .attr('font-size', 10)
        .attr('font-weight', '700')
        .attr('fill', '#f8fafc')
        .attr('x', 8)
        .attr('y', 13)
        .text(ref => (ref.type === 'HEAD' ? `HEAD → ${ref.name}` : ref.name));

      const badgeMerge = badgeEnter.merge(badgeSelection as any);

      badgeMerge.attr('transform', (_: GitRef, idx: number) => `translate(${20}, ${-26 - idx * 24})`);

      badgeMerge.each(function () {
        const badge = d3.select(this);
        const textElement = badge.select<SVGTextElement>('text').node();
        if (!textElement) return;
        const bbox = textElement.getBBox();
        badge
          .select<SVGRectElement>('rect')
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 10)
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 5);
      });

      badgeSelection
        .exit()
        .transition()
        .duration(prefersReducedMotion ? 0 : 200)
        .attr('opacity', 0)
        .remove();
    });

    nodeSelection.exit().remove();
    linkSelection.exit().remove();

    const laneCount = Math.max(branchLaneMap.size, 1);
    const laneSpacing = Math.min(240, Math.max(width / (laneCount + 1), 160));
    const laneOffset = (laneCount - 1) / 2;

    const simulation =
      simulationRef.current ??
      d3
        .forceSimulation<GraphNode>(nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(160).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-220))
        .force(
          'x',
          d3.forceX<GraphNode>().x(d => width / 2 + (d.lane - laneOffset) * laneSpacing).strength(0.2),
        )
        .force(
          'y',
          d3
            .forceY<GraphNode>()
            .y(d => 120 + d.order * 90)
            .strength(0.24),
        )
        .force('collision', d3.forceCollide(36));

    simulation.nodes(nodes);
    simulation.force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(160).strength(1));

    simulation.force(
      'x',
      d3.forceX<GraphNode>().x(d => width / 2 + (d.lane - laneOffset) * laneSpacing).strength(0.3),
    );

    simulation.force(
      'y',
      d3
        .forceY<GraphNode>()
        .y(d => 120 + d.order * 90)
        .strength(0.35),
    );

    simulation.force('collision', d3.forceCollide(42));
    simulation.alpha(1).restart();

    simulation.on('tick', () => {
      linkMerge.attr('d', createLinkPath);

      nodeMerge.attr('transform', d => {
        const x = d.x ?? width / 2;
        const y = d.y ?? 80;
        return `translate(${x}, ${y})`;
      });
    });

    simulationRef.current = simulation;

    const highlightNode = (activeNode: GraphNode | null) => {
      nodeMerge.attr('opacity', node => {
        if (!activeNode) return 1;
        return node.id === activeNode.id ? 1 : 0.35;
      });

      linkMerge.attr('stroke-opacity', link => {
        if (!activeNode) return 0.65;
        const isConnected =
          getNodeId(link.source) === activeNode.id || getNodeId(link.target) === activeNode.id;
        return isConnected ? 0.85 : 0.15;
      });
    };

    nodeMerge
      .on('mouseenter', (_, d) => highlightNode(d))
      .on('mouseleave', () => highlightNode(null))
      .on('focus', (_, d) => highlightNode(d))
      .on('blur', () => highlightNode(null))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          highlightNode(d);
        }
      });

    const dragBehaviour = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', event => {
        const node = event.subject;
        node.fx = event.x;
        node.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeMerge.call(dragBehaviour as any);

    const zoomBehaviour = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', event => {
        rootGroup.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehaviour as any);

    return () => {
      simulation.stop();
    };
  }, [commits, refs, dimensions]);

  return (
    <div ref={containerRef} className="bg-gray-900 rounded-lg p-4 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-400">
      <h3 id="git-graph-title" className="text-white font-bold mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          🌳
        </span>
        Git Graph
      </h3>
      {commits.length === 0 ? (
        <div
          className="text-gray-300 text-center py-12 px-4 border border-dashed border-slate-700 rounded-lg"
          role="status"
        >
          No commits yet. Make your first commit to see the graph!
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="w-full h-[520px] xl:h-[640px] outline-none"
          aria-describedby="git-graph-helptext"
        />
      )}
      <p id="git-graph-helptext" className="sr-only">
        Visual graph of commits. Use your mouse or touch to drag nodes. Scroll or pinch to zoom. Keyboard users can
        focus nodes to highlight related commits.
      </p>
    </div>
  );
}

