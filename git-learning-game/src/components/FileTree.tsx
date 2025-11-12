import { FileTreeNode } from '../types';
import { File, Folder, FolderOpen, FileCode, FileText, FileJson, FileImage } from 'lucide-react';
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

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
      return FileCode;
    case 'json':
    case 'xml':
      return FileJson;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return FileImage;
    case 'txt':
    case 'md':
    case 'readme':
      return FileText;
    default:
      return File;
  }
}

function TreeNode({ node, level, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const FileIcon = node.type === 'file' ? getFileIcon(node.name) : null;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect?.(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li role="none">
      <button
        type="button"
        className={`
          flex w-full items-center gap-2 py-2 px-2 rounded-lg cursor-pointer
          transition-all duration-150
          ${isHovered ? 'bg-gray-700/70 scale-102' : 'bg-transparent'}
          hover:bg-gray-700/70 hover:scale-102
          ${node.type === 'directory' ? 'font-medium' : ''}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        role="treeitem"
        tabIndex={0}
        aria-label={`${node.type === 'directory' ? 'Folder' : 'File'}: ${node.name}`}
        aria-expanded={node.type === 'directory' ? isExpanded : undefined}
        aria-level={level + 1}
        data-node-type={node.type}
      >
        {node.type === 'directory' ? (
          <div className="flex items-center transition-transform duration-200">
            {isExpanded ? (
              <FolderOpen 
                size={18} 
                className="text-yellow-400 drop-shadow-lg" 
                aria-hidden="true"
                focusable="false"
              />
            ) : (
              <Folder 
                size={18} 
                className="text-yellow-400 drop-shadow-lg" 
                aria-hidden="true"
                focusable="false"
              />
            )}
          </div>
        ) : (
          FileIcon && (
            <FileIcon 
              size={16} 
              className="text-blue-400 drop-shadow-lg"
              aria-hidden="true"
              focusable="false"
            />
          )
        )}
        <span className={`
          text-sm transition-colors duration-150
          ${isHovered ? 'text-white' : 'text-gray-200'}
        `}>
          {node.name}
        </span>
        
        {/* File size indicator for files */}
        {node.type === 'file' && node.content && (
          <span className="ml-auto text-xs text-gray-500 font-mono">
            {node.content.length}b
          </span>
        )}
      </button>
      
      {hasChildren && isExpanded && (
        <ul role="group" aria-label={`${node.name} contents`} className="ml-2 border-l-2 border-gray-700/50">
          {node.children!.map((child, index) => (
            <TreeNode
              key={child.path || child.name || index}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({ tree, onFileSelect }: FileTreeProps) {
  const fileCount = tree.children?.length || 0;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">📁</span>
          Working Directory
        </h3>
        {fileCount > 0 && (
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full font-medium">
            {fileCount} {fileCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      
      {tree.children && tree.children.length > 0 ? (
        <ul role="tree" aria-label="Repository files" className="space-y-1">
          {tree.children.map((child, index) => (
            <TreeNode 
              key={child.path || child.name || index}
              node={child} 
              level={0} 
              onFileSelect={onFileSelect} 
            />
          ))}
        </ul>
      ) : (
        <div className="text-gray-400 text-center py-12" role="status">
          <div className="text-5xl mb-3" aria-hidden="true">📂</div>
          <p className="text-sm">No files yet</p>
          <p className="text-xs mt-1 text-gray-500">Create files to see them here</p>
        </div>
      )}
    </div>
  );
}
