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

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          isExpanded ? (
            <FolderOpen size={16} className="text-yellow-400" />
          ) : (
            <Folder size={16} className="text-yellow-400" />
          )
        ) : (
          <File size={16} className="text-blue-400" />
        )}
        <span className="text-gray-200 text-sm">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={index}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree, onFileSelect }: FileTreeProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📁</span>
        Files
      </h3>
      {tree.children && tree.children.length > 0 ? (
        <div>
          {tree.children.map((child, index) => (
            <TreeNode key={index} node={child} level={0} onFileSelect={onFileSelect} />
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-center py-8">
          No files yet
        </div>
      )}
    </div>
  );
}

