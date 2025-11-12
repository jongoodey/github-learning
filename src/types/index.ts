export interface Level {
  id: string;
  title: string;
  description: string;
  cli?: string;
  congrats: string;
  setup: string[];
  winCondition: string;
  cards?: string[];
}

export interface GitCommit {
  oid: string;
  message: string;
  parent: string[];
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
}

export interface GitRef {
  name: string;
  oid: string;
  type: 'branch' | 'tag' | 'HEAD';
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string;
}

export interface GameState {
  currentLevel: number;
  completedLevels: Set<number>;
  currentRepo: string;
}

