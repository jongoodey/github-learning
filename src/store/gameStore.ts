import { create } from 'zustand';
import { GitCommit, GitRef, FileTreeNode, Level } from '../types';
import gitService from '../services/gitService';
import { levels } from '../data/levels';

interface GameStore {
  currentLevel: number;
  completedLevels: Set<number>;
  initializedLevels: Set<number>;
  commits: GitCommit[];
  refs: GitRef[];
  fileTree: FileTreeNode;
  terminalOutput: string[];
  isLevelComplete: boolean;
  
  // Actions
  setCurrentLevel: (level: number, forceReinit?: boolean) => void;
  completeLevel: () => void;
  nextLevel: () => void;
  previousLevel: () => void;
  refresh: () => Promise<void>;
  initLevel: (level: Level, forceReinit?: boolean) => Promise<void>;
  executeCommand: (command: string) => Promise<string>;
  checkWinCondition: (level: Level) => Promise<boolean>;
  resetLevel: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: 0,
  completedLevels: new Set(),
  initializedLevels: new Set(),
  commits: [],
  refs: [],
  fileTree: { name: 'repo', path: '', type: 'directory', children: [] },
  terminalOutput: [],
  isLevelComplete: false,

  setCurrentLevel: (level: number, forceReinit: boolean = false) => {
    const { initializedLevels, completedLevels } = get();
    // Initially set to false - will be updated by refresh after checking win condition
    set({ currentLevel: level, isLevelComplete: false });
    
    // Only init if never initialized before or forced
    const needsInit = !initializedLevels.has(level) || forceReinit;
    get().initLevel(levels[level], needsInit).then(async () => {
      // Always refresh after level change to ensure graph shows current state
      await get().refresh();
      // After refresh, check if level was previously completed
      const wasCompleted = completedLevels.has(level);
      if (wasCompleted) {
        set({ isLevelComplete: true });
      }
    });
  },

  completeLevel: () => {
    const { currentLevel, completedLevels } = get();
    const newCompleted = new Set(completedLevels);
    newCompleted.add(currentLevel);
    set({ completedLevels: newCompleted, isLevelComplete: true });
  },

  nextLevel: () => {
    const { currentLevel, isLevelComplete } = get();
    // Prevent navigation if level is not complete
    if (!isLevelComplete) {
      return;
    }
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
      
      // Check win condition and update completion status
      const level = levels[get().currentLevel];
      const isComplete = await get().checkWinCondition(level);
      const currentIsComplete = get().isLevelComplete;
      
      if (isComplete) {
        if (!currentIsComplete) {
          // Level just became complete
          get().completeLevel();
        }
        // Ensure isLevelComplete is set to true
        set({ isLevelComplete: true });
      } else {
        // Level is not complete
        set({ isLevelComplete: false });
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  },

  initLevel: async (level: Level, forceReinit: boolean = false) => {
    try {
      // Only reset and setup if this is a new level or forced
      if (forceReinit) {
        // Reset git
        await gitService.resetRepo();

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

        // Mark this level as initialized
        const { initializedLevels, currentLevel } = get();
        const newInitialized = new Set(initializedLevels);
        newInitialized.add(currentLevel);
        set({ initializedLevels: newInitialized });
      }

      // Always refresh the state to show current git state
      // This ensures the graph shows the correct state even when navigating between levels
      await get().refresh();
    } catch (error) {
      console.error('Error initializing level:', error);
    }
  },

  resetLevel: () => {
    const { currentLevel } = get();
    get().setCurrentLevel(currentLevel, true);
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

