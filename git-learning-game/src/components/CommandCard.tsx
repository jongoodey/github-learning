import { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, Plus, Archive, Sparkles } from 'lucide-react';

interface CommandCardProps {
  command: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const commandIcons: Record<string, any> = {
  commit: GitCommit,
  add: Plus,
  branch: GitBranch,
  merge: GitMerge,
  checkout: Archive,
};

const commandDescriptions: Record<string, string> = {
  commit: 'Save a snapshot of your changes',
  add: 'Stage changes for commit',
  branch: 'Create a new branch',
  merge: 'Merge branches together',
  checkout: 'Switch to a branch',
};

const commandColors: Record<string, { from: string; to: string; hover: string }> = {
  commit: { from: 'from-yellow-500', to: 'to-orange-500', hover: 'hover:from-yellow-600 hover:to-orange-600' },
  add: { from: 'from-green-500', to: 'to-emerald-500', hover: 'hover:from-green-600 hover:to-emerald-600' },
  branch: { from: 'from-purple-500', to: 'to-pink-500', hover: 'hover:from-purple-600 hover:to-pink-600' },
  merge: { from: 'from-blue-500', to: 'to-cyan-500', hover: 'hover:from-blue-600 hover:to-cyan-600' },
  checkout: { from: 'from-indigo-500', to: 'to-purple-500', hover: 'hover:from-indigo-600 hover:to-purple-600' },
};

export function CommandCard({ command, description, onClick, disabled = false }: CommandCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const Icon = commandIcons[command] || GitCommit;
  const desc = description || commandDescriptions[command] || '';
  const colors = commandColors[command] || commandColors.commit;

  const handleClick = () => {
    if (!disabled) {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 600);
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('command', command);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        draggable={!disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        disabled={disabled}
        className={`
          bg-gradient-to-br ${colors.from} ${colors.to} ${colors.hover}
          text-white rounded-xl p-4 shadow-lg 
          transform transition-all duration-200 
          ${!disabled && !isDragging ? 'hover:scale-105 hover:shadow-2xl cursor-grab active:cursor-grabbing active:scale-95' : ''}
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
          flex flex-col items-center gap-3 min-w-[140px] relative overflow-hidden
        `}
        aria-label={`${command} command: ${desc}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700" />
        
        {/* Icon with pulse animation on hover */}
        <div className="relative">
          <Icon size={32} className="stroke-2 group-hover:animate-pulse" />
          {showSparkle && (
            <Sparkles 
              size={24} 
              className="absolute -top-2 -right-2 text-yellow-300 animate-ping"
            />
          )}
        </div>
        
        <div className="text-center relative z-10">
          <div className="font-bold text-lg tracking-tight">git {command}</div>
          <div className="text-xs opacity-90 mt-1 font-medium">{desc}</div>
        </div>

        {/* Drag hint */}
        {!disabled && (
          <div className="absolute bottom-1 right-1 text-xs opacity-0 group-hover:opacity-70 transition-opacity">
            🖱️
          </div>
        )}
      </button>

      {/* Floating hint on hover */}
      {!disabled && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                      bg-gray-800 text-white text-xs px-2 py-1 rounded 
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                      whitespace-nowrap z-50">
          Click or drag to use
        </div>
      )}
    </div>
  );
}

