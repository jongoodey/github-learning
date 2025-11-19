import { useEffect, useRef } from 'react';
import { P5Canvas, Sketch, P5CanvasInstance } from '@p5-wrapper/react';
import { GitCommit, GitRef } from '../types';

interface GitGraphP5Props {
  commits: GitCommit[];
  refs: GitRef[];
}

interface CommitNode {
  oid: string;
  message: string;
  x: number;
  y: number;
  targetY: number;
  branch: number;
  refs: GitRef[];
  dragging: boolean;
  offsetX: number;
  offsetY: number;
}

export function GitGraphP5({ commits, refs }: GitGraphP5Props) {
  const commitsRef = useRef(commits);
  const refsRef = useRef(refs);

  useEffect(() => {
    commitsRef.current = commits;
    refsRef.current = refs;
  }, [commits, refs]);

  const sketch: Sketch<{ commits: GitCommit[]; refs: GitRef[] }> = (p5Instance: P5CanvasInstance<{ commits: GitCommit[]; refs: GitRef[] }>) => {
    const p5 = p5Instance;
    let nodes: CommitNode[] = [];
    let links: { source: CommitNode; target: CommitNode }[] = [];
    let canvasHeight = 400;
    const commitRadius = 12;
    const horizontalSpacing = 80;
    const verticalSpacing = 70;

    p5.setup = () => {
      const canvas = p5.createCanvas(800, canvasHeight);
      canvas.parent('git-graph-container');
      p5.frameRate(60);
      updateGraph();
    };

    p5.updateWithProps = (props: any) => {
      if (props.commits) {
        commitsRef.current = props.commits;
        refsRef.current = props.refs;
        updateGraph();
      }
    };

    const updateGraph = () => {
      const currentCommits = commitsRef.current;
      const currentRefs = refsRef.current;

      if (!currentCommits || currentCommits.length === 0) {
        nodes = [];
        links = [];
        return;
      }

      // Calculate required height
      canvasHeight = Math.max(400, currentCommits.length * verticalSpacing + 150);
      p5.resizeCanvas(800, canvasHeight);

      // Create nodes
      const commitMap = new Map<string, CommitNode>();
      nodes = [];
      links = [];

      // Assign branch lanes
      const branchLanes = new Map<string, number>();
      let nextLane = 0;

      currentCommits.forEach((commit, index) => {
        const commitRefs = currentRefs.filter(ref => ref.oid === commit.oid);
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

        const targetY = 80 + index * verticalSpacing;
        const existingNode = nodes.find(n => n.oid === commit.oid);

        const node: CommitNode = {
          oid: commit.oid,
          message: commit.message,
          x: 100 + lane * horizontalSpacing,
          y: existingNode?.y || targetY,
          targetY: targetY,
          branch: lane,
          refs: commitRefs,
          dragging: existingNode?.dragging || false,
          offsetX: 0,
          offsetY: 0,
        };

        nodes.push(node);
        commitMap.set(commit.oid, node);
      });

      // Build links
      currentCommits.forEach(commit => {
        const node = commitMap.get(commit.oid);
        if (node) {
          commit.parent.forEach(parentOid => {
            const parentNode = commitMap.get(parentOid);
            if (parentNode) {
              links.push({ source: node, target: parentNode });
            }
          });
        }
      });
    };

    p5.draw = () => {
      // Background with gradient
      const c1 = p5.color(17, 24, 39); // gray-900
      const c2 = p5.color(30, 41, 59); // darker blue-gray
      for (let y = 0; y < p5.height; y++) {
        const inter = p5.map(y, 0, p5.height, 0, 1);
        const c = p5.lerpColor(c1, c2, inter);
        p5.stroke(c);
        p5.line(0, y, p5.width, y);
      }

      if (nodes.length === 0) {
        p5.fill(156, 163, 175); // gray-400
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(16);
        p5.text('No commits yet. Make your first commit!', p5.width / 2, p5.height / 2);
        return;
      }

      // Animate nodes to target positions
      nodes.forEach(node => {
        if (!node.dragging) {
          const dy = node.targetY - node.y;
          node.y += dy * 0.15; // Smooth animation
        }
      });

      // Draw links with glow effect
      p5.strokeWeight(3);
      links.forEach(link => {
        // Glow effect
        p5.stroke(74, 85, 104, 80); // gray-600 with transparency
        p5.strokeWeight(6);
        p5.line(link.source.x, link.source.y, link.target.x, link.target.y);

        // Main line
        p5.stroke(107, 114, 128); // gray-500
        p5.strokeWeight(3);
        p5.line(link.source.x, link.source.y, link.target.x, link.target.y);
      });

      // Draw commit nodes
      nodes.forEach(node => {
        const isHead = node.refs.some(ref => ref.type === 'HEAD');
        const isHovered = p5.dist(p5.mouseX, p5.mouseY, node.x, node.y) < commitRadius;

        // Glow effect when hovered
        if (isHovered) {
          p5.noStroke();
          p5.fill(isHead ? 245 : 66, isHead ? 101 : 153, isHead ? 101 : 225, 100);
          p5.circle(node.x, node.y, commitRadius * 3);
        }

        // Commit circle
        p5.fill(isHead ? p5.color(245, 101, 101) : p5.color(66, 153, 225));
        p5.stroke(255);
        p5.strokeWeight(2);
        p5.circle(node.x, node.y, commitRadius * 2);

        // Commit hash
        p5.noStroke();
        p5.fill(160, 174, 192); // gray-400
        p5.textAlign(p5.LEFT, p5.CENTER);
        p5.textSize(11);
        p5.textFont('monospace');
        p5.text(node.oid.substring(0, 7), node.x + commitRadius + 8, node.y - 8);

        // Commit message
        p5.fill(226, 232, 240); // gray-200
        p5.textFont('sans-serif');
        p5.textSize(12);
        const maxLength = 35;
        const displayMessage = node.message.length > maxLength
          ? node.message.substring(0, maxLength) + '...'
          : node.message;
        p5.text(displayMessage, node.x + commitRadius + 8, node.y + 8);

        // Draw ref labels
        node.refs.forEach((ref, i) => {
          const labelY = node.y - 30 - i * 25;
          const bgColor = ref.type === 'HEAD'
            ? p5.color(245, 101, 101)
            : ref.type === 'tag'
            ? p5.color(237, 137, 54)
            : p5.color(72, 187, 120);

          // Label background
          p5.fill(bgColor);
          p5.noStroke();
          const labelWidth = p5.textWidth(ref.name) + 12;
          p5.rect(node.x + commitRadius + 8, labelY - 8, labelWidth, 18, 4);

          // Label text
          p5.fill(255);
          p5.textSize(11);
          p5.textFont('monospace');
          p5.textStyle(p5.BOLD);
          p5.text(ref.name, node.x + commitRadius + 14, labelY);
          p5.textStyle(p5.NORMAL);
        });
      });

      // Draw drag cursor
      const hoveredNode = nodes.find(n =>
        p5.dist(p5.mouseX, p5.mouseY, n.x, n.y) < commitRadius
      );
      if (hoveredNode) {
        p5.cursor(p5.HAND);
      } else {
        p5.cursor(p5.ARROW);
      }
    };

    p5.mousePressed = () => {
      nodes.forEach(node => {
        const d = p5.dist(p5.mouseX, p5.mouseY, node.x, node.y);
        if (d < commitRadius) {
          node.dragging = true;
          node.offsetX = node.x - p5.mouseX;
          node.offsetY = node.y - p5.mouseY;
        }
      });
    };

    p5.mouseReleased = () => {
      nodes.forEach(node => {
        node.dragging = false;
      });
    };

    p5.mouseDragged = () => {
      nodes.forEach(node => {
        if (node.dragging) {
          node.x = p5.mouseX + node.offsetX;
          node.y = p5.mouseY + node.offsetY;
        }
      });
    };
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🌳</span>
        Interactive Git Graph
        <span className="text-xs text-gray-400 font-normal ml-2">(Drag commits to explore!)</span>
      </h3>
      <div id="git-graph-container" className="w-full">
        <P5Canvas sketch={sketch} commits={commits} refs={refs} />
      </div>
    </div>
  );
}
