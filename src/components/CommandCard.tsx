import { GitBranch, GitCommit, GitMerge, Plus, Archive } from 'lucide-react';

interface CommandCardProps {
  command: string;
  description: string;
  onClick: () => void;
}

const commandIcons: Record<string, any> = {
  commit: GitCommit,
  add: Plus,
  branch: GitBranch,
  merge: GitMerge,
  checkout: Archive,
};

const commandDescriptions: Record<string, string> = {
  commit: 'Save a snapshot',
  add: 'Stage changes',
  branch: 'Create a branch',
  merge: 'Merge branches',
  checkout: 'Switch branch',
};

export function CommandCard({ command, description, onClick }: CommandCardProps) {
  const Icon = commandIcons[command] || GitCommit;
  const desc = description || commandDescriptions[command] || '';

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                 text-white rounded-xl p-4 shadow-lg transform transition-all duration-200 
                 hover:scale-105 hover:shadow-xl active:scale-95 
                 flex flex-col items-center gap-3 min-w-[140px]"
    >
      <Icon size={32} className="stroke-2" />
      <div className="text-center">
        <div className="font-bold text-lg">git {command}</div>
        <div className="text-xs opacity-90 mt-1">{desc}</div>
      </div>
    </button>
  );
}

