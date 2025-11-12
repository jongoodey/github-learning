import { create } from 'zustand';
import { GitCommit, GitRef, FileTreeNode, Level } from '../types';
import gitService from '../services/gitService';
import { levels } from '../data/levels';

interface GameStore {
  currentLevel: number;
  completedLevels: Set<number>;
  commits: GitCommit[];
  refs: GitRef[];
  fileTree: FileTreeNode;
  terminalOutput: string[];
  isLevelComplete: boolean;
  
  // Actions
  setCurrentLevel: (level: number) => void;
  completeLevel: () => void;
  nextLevel: () => void;
  previousLevel: () => void;
  refresh: () => Promise<void>;
  initLevel: (level: Level) => Promise<void>;
  executeCommand: (command: string) => Promise<string>;
  checkWinCondition: (level: Level) => Promise<boolean>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: 0,
  completedLevels: new Set(),
  commits: [],
  refs: [],
  fileTree: { name: 'repo', path: '', type: 'directory', children: [] },
  terminalOutput: [],
  isLevelComplete: false,

  setCurrentLevel: async (level: number) => {
    set({ currentLevel: level, isLevelComplete: false });
    await get().initLevel(levels[level]);
  },

  completeLevel: () => {
    const { currentLevel, completedLevels } = get();
    const newCompleted = new Set(completedLevels);
    newCompleted.add(currentLevel);
    set({ completedLevels: newCompleted, isLevelComplete: true });
  },

  nextLevel: () => {
    const { currentLevel } = get();
    if (currentLevel < levels.length - 1) {
      get().setCurrentLevel(currentLevel + 1);
    }
  },

  previousLevel: () => {
    const { currentLevel } = get();
    if (currentLevel > 0) {
      get().setCurrentLevel(currentLevel - 1);
    }
  },

  refresh: async () => {
    try {
      const [commits, refs, fileTree] = await Promise.all([
        gitService.log(),
        gitService.getRefs(),
        gitService.getFileTree(),
      ]);
      
      set({ commits, refs, fileTree });
      
      // Check win condition
      const level = levels[get().currentLevel];
      const isComplete = await get().checkWinCondition(level);
      if (isComplete && !get().isLevelComplete) {
        get().completeLevel();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  },

  initLevel: async (level: Level) => {
    try {
      console.log('Initializing level:', level.title);
      
      // Reset git with retry logic
      let resetSuccess = false;
      for (let i = 0; i < 3 && !resetSuccess; i++) {
        try {
          await gitService.reset();
          resetSuccess = true;
        } catch (error) {
          console.log(`Reset attempt ${i + 1} failed, retrying...`);
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Execute setup commands
      for (const command of level.setup) {
        if (command.startsWith('echo ')) {
          // Handle echo commands specially
          const match = command.match(/echo "(.*?)" > (.+)/);
          if (match) {
            const [, content, filepath] = match;
            await gitService.writeFile(filepath, content);
          }
        } else if (command.startsWith('git ')) {
          await gitService.executeCommand(command);
        }
      }

      // Refresh the state
      await get().refresh();
      console.log('Level initialized successfully');
    } catch (error) {
      console.error('Error initializing level:', error);
      // Set empty state to avoid crashes
      set({
        commits: [],
        refs: [],
        fileTree: { name: 'repo', path: '', type: 'directory', children: [] }
      });
    }
  },

  executeCommand: async (command: string) => {
    try {
      const output = await gitService.executeCommand(command);
      
      // Refresh after command
      await get().refresh();
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },

  checkWinCondition: async (level: Level): Promise<boolean> => {
    const { commits, refs } = get();
    const condition = level.winCondition;

    // Parse condition
    if (condition === 'always') {
      return true;
    }

    if (condition.startsWith('hasCommits:')) {
      const required = parseInt(condition.split(':')[1]);
      return commits.length >= required;
    }

    if (condition.startsWith('hasBranches:')) {
      const required = parseInt(condition.split(':')[1]);
      const branches = refs.filter(r => r.type === 'branch' || r.type === 'HEAD');
      return branches.length >= required;
    }

    if (condition.startsWith('currentBranch:')) {
      const required = condition.split(':')[1];
      try {
        const current = await gitService.currentBranch();
        return current === required;
      } catch {
        return false;
      }
    }

    return false;
  },
}));

