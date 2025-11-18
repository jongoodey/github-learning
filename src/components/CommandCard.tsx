import { GitBranch, GitCommit, GitMerge, Plus, Archive, FileText, History, CloudUpload, Save, Globe } from 'lucide-react';

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
  status: FileText,
  log: History,
  push: CloudUpload,
  stash: Save,
  remote: Globe,
};

const commandDescriptions: Record<string, string> = {
  commit: 'Save a snapshot',
  add: 'Stage changes',
  branch: 'Create a branch',
  merge: 'Merge branches',
  checkout: 'Switch branch',
  status: 'Show working tree status',
  log: 'Show commit history',
  push: 'Push to remote',
  stash: 'Stash changes',
  remote: 'List remotes',
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
                 flex flex-col items-center gap-3 w-full sm:w-auto sm:min-w-[140px] sm:max-w-[180px] 
                 flex-shrink-0"
    >
      <Icon size={32} className="stroke-2 flex-shrink-0" />
      <div className="text-center w-full">
        <div className="font-bold text-base sm:text-lg break-words">git {command}</div>
        <div className="text-xs opacity-90 mt-1 break-words">{desc}</div>
      </div>
    </button>
  );
}

