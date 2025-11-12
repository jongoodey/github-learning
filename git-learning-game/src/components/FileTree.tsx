import { FileTreeNode } from '../types';
import { File, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

interface FileTreeProps {
  tree: FileTreeNode;
  onFileSelect?: (file: FileTreeNode) => void;
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  onFileSelect?: (file: FileTreeNode) => void;
}

function TreeNode({ node, level, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect?.(node);
    }
  };

  const Icon = () => {
    if (node.type === 'directory') {
      return isExpanded ? (
        <FolderOpen size={16} className="text-yellow-400" aria-hidden="true" focusable="false" />
      ) : (
        <Folder size={16} className="text-yellow-400" aria-hidden="true" focusable="false" />
      );
    }
    return <File size={16} className="text-blue-400" aria-hidden="true" focusable="false" />;
  };

  return (
    <li role="none">
      <button
        type="button"
        className="flex w-full items-center gap-2 py-1 px-2 rounded hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 text-left"
        style={{ paddingLeft: `${level * 18 + 12}px` }}
        onClick={handleClick}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && node.type === 'directory') {
            event.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
        role="treeitem"
        aria-expanded={node.type === 'directory' ? isExpanded : undefined}
        aria-level={level + 1}
        data-node-type={node.type}
      >
        <Icon />
        <span className="text-gray-200 text-sm">{node.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <ul role="group" aria-label={`${node.name} contents`}>
          {node.children!.map(child => (
            <TreeNode key={child.path || child.name} node={child} level={level + 1} onFileSelect={onFileSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({ tree, onFileSelect }: FileTreeProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          📁
        </span>
        Files
      </h3>
      {tree.children && tree.children.length > 0 ? (
        <ul role="tree" aria-label="Repository files" className="space-y-1">
          {tree.children.map(child => (
            <TreeNode key={child.path || child.name} node={child} level={0} onFileSelect={onFileSelect} />
          ))}
        </ul>
      ) : (
        <div className="text-gray-400 text-center py-8" role="status">
          No files yet
        </div>
      )}
    </div>
  );
}

