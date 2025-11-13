import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GitCommit, GitRef } from '../types';

interface GitGraphProps {
  commits: GitCommit[];
  refs: GitRef[];
}

interface GraphNode {
  oid: string;
  message: string;
  x: number;
  y: number;
  branch: number;
  refs: GitRef[];
}

interface GraphLink {
  source: GraphNode;
  target: GraphNode;
}

export function GitGraph({ commits, refs }: GitGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || commits.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = Math.max(400, commits.length * 60 + 100);
    const commitRadius = 8;
    const horizontalSpacing = 60;
    const verticalSpacing = 60;

    svg.attr('width', width).attr('height', height);

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

      // Try to find branch lane
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
        x: 100 + lane * horizontalSpacing,
        y: 80 + index * verticalSpacing,
        branch: lane,
        refs: commitRefs,
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
          links.push({ source: node, target: parentNode });
        }
      });
    });

    // Draw links
    svg
      .selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6);

    // Draw commit nodes
    const nodeGroups = svg
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    nodeGroups
      .append('circle')
      .attr('r', commitRadius)
      .attr('fill', d => {
        const isHead = d.refs.some(ref => ref.type === 'HEAD');
        return isHead ? '#f56565' : '#4299e1';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add commit hash labels
    nodeGroups
      .append('text')
      .attr('x', commitRadius + 8)
      .attr('y', 4)
      .attr('font-size', 11)
      .attr('font-family', 'monospace')
      .attr('fill', '#a0aec0')
      .text(d => d.oid.substring(0, 7));

    // Add commit message
    nodeGroups
      .append('text')
      .attr('x', commitRadius + 8)
      .attr('y', 18)
      .attr('font-size', 12)
      .attr('fill', '#e2e8f0')
      .text(d => {
        const maxLength = 40;
        return d.message.length > maxLength
          ? d.message.substring(0, maxLength) + '...'
          : d.message;
      });

    // Add ref labels
    nodeGroups
      .selectAll('.ref-label')
      .data(d => d.refs)
      .join('g')
      .attr('class', 'ref-label')
      .attr('transform', (_d, i) => `translate(${commitRadius + 8}, ${-18 - i * 20})`)
      .each(function (ref) {
        const group = d3.select(this);
        
        const bgColor = ref.type === 'HEAD' ? '#f56565' : 
                        ref.type === 'tag' ? '#ed8936' : '#48bb78';
        
        const text = group
          .append('text')
          .attr('font-size', 11)
          .attr('font-weight', 'bold')
          .attr('fill', '#fff')
          .text(ref.name);

        const bbox = (text.node() as SVGTextElement).getBBox();
        
        group
          .insert('rect', 'text')
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
          .attr('rx', 3)
          .attr('fill', bgColor);
      });

  }, [commits, refs]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🌳</span>
        Git Graph
      </h3>
      {commits.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          No commits yet. Make your first commit to see the graph!
        </div>
      ) : (
        <svg ref={svgRef} className="w-full" />
      )}
    </div>
  );
}

