# Comprehensive Functional Specification: Web-Based Git Learning Game

## Executive Summary

This specification details the requirements for creating a web-based version of "Oh My Git!" - an interactive Git learning game. The web version will maintain the core educational experience while leveraging modern web technologies (Three.js, D3.js, or similar) to create an engaging, browser-based learning platform.

## 1. Project Overview

### 1.1 Current Implementation Analysis

Based on my analysis of the Oh My Git repository, the game is currently built using:[1]
- **Game Engine**: Godot 3 (GDScript 94.6%)
- **Real Git Integration**: Uses actual Git commands via shell execution
- **Visualization**: 2D node-based graph system with SVG graphics
- **Architecture**: Scene-based with modular levels stored as text files

### 1.2 Objective

Create a fully web-based version that:
- Runs entirely in the browser (no downloads required)
- Uses isogit or libgit2 compiled to WebAssembly for Git operations
- Employs Three.js or D3.js for interactive graph visualization
- Maintains the educational progression and level structure from the original

## 2. Core Architecture

### 2.1 Technology Stack Recommendations

**For Graph Visualization:**
- **Primary Choice: D3.js with force-directed graphs**
  - Best suited for node-graph visualization like commit trees
  - Excellent for animated transitions between states
  - Mature ecosystem with extensive documentation
  - Can handle complex parent-child relationships
  
**Alternative: Three.js**
- Use if 3D visualization is desired
- More complex but allows camera movement and depth
- Could represent branches in 3D space

**For Physics/Animation:**
- D3-force for force-directed layouts
- GSAP (GreenSock) for smooth animations
- CSS animations for UI transitions

**For Git Operations:**
- **isogit** - Pure JavaScript Git implementation
- Runs entirely in browser
- Uses BrowserFS or LightningFS for file system
- Can perform all Git operations client-side

### 2.2 Application Structure

```
web-git-game/
├── src/
│   ├── core/
│   │   ├── GameEngine.js          # Main game loop and state management
│   │   ├── GitManager.js          # Wrapper around isogit
│   │   ├── LevelLoader.js         # Parses and loads level files
│   │   └── StateManager.js        # Save/load progress (localStorage)
│   ├── visualization/
│   │   ├── GraphRenderer.js       # D3.js graph visualization
│   │   ├── NodeFactory.js         # Creates commit/blob/tree nodes
│   │   ├── AnimationController.js # Handles transitions
│   │   └── LayoutEngine.js        # Force-directed layout logic
│   ├── ui/
│   │   ├── CardSystem.js          # Playing card interface
│   │   ├── Terminal.js            # Command line interface
│   │   ├── FileBrowser.js         # File system viewer
│   │   └── LevelUI.js             # Level description, goals, hints
│   ├── levels/
│   │   ├── intro/
│   │   ├── branches/
│   │   ├── remotes/
│   │   └── ... (organized by chapter)
│   └── assets/
│       ├── svg/                   # Node graphics (commit, blob, head, etc.)
│       ├── sounds/                # Sound effects
│       └── fonts/
└── index.html
```

## 3. Key Features & Components

### 3.1 Real-Time Git Repository Visualization

**Requirements:**
- Display Git objects as interactive nodes (commits, blobs, trees, tags)
- Show references (HEAD, branches, remotes) as labels
- Animate state changes when Git commands are executed
- Use force-directed graph layout for automatic positioning

**Visual Elements (from analysis):**[2]
- **Commits**: Yellow/gold square nodes
- **HEAD**: Blue character/monster icon
- **Branches**: Purple/blue labels pointing to commits
- **Arrows**: Yellow arrows showing commit parent relationships (time direction, not Git pointers)
- **Files**: Gray document icons in file browser area

**Implementation Notes:**
```javascript
// Example D3.js structure
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).distance(100))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2));

// Update on Git command
function onGitCommand(command) {
  const newState = await gitManager.executeCommand(command);
  updateGraph(newState);
  animateTransition();
  checkWinCondition();
}
```

### 3.2 Playing Card Interface

**Requirements (from website analysis):**[3]
- Cards appear at bottom of screen
- Each card represents a Git command (e.g., "git commit", "git checkout", "git merge")
- Cards include:
  - Command name
  - Icon/visual representation
  - Short description
  - Optional parameters (can be filled in or dragged)
- Drag-and-drop to commit nodes or just click to execute
- Cards are introduced progressively based on level

**Card Types:**
```javascript
const cardTypes = {
  'commit-auto': {
    title: 'git add . git commit',
    description: 'Make a new commit containing your current environment',
    icon: 'commit.svg',
    action: async (repo) => {
      await repo.add({ filepath: '.' });
      await repo.commit({ message: 'New commit' });
    }
  },
  'checkout': {
    title: 'git checkout {commit_ref}',
    description: 'Drag this card to a commit or branch to travel to it',
    icon: 'checkout.svg',
    requiresTarget: true,
    action: async (repo, target) => {
      await repo.checkout({ ref: target.id });
    }
  }
  // ... more cards
};
```

### 3.3 Integrated Terminal

**Requirements:**
- xterm.js for terminal emulation
- Parse and execute arbitrary Git commands
- Show command output
- Syntax highlighting
- Badge system for completing levels using only CLI (no cards)

**Implementation:**
```javascript
class Terminal {
  constructor(gitManager) {
    this.term = new Terminal();
    this.gitManager = gitManager;
  }
  
  async executeCommand(input) {
    const [command, ...args] = input.split(' ');
    
    if (command === 'git') {
      const result = await this.gitManager.run(args);
      this.term.writeln(result.stdout || result.stderr);
      this.gameEngine.checkWinCondition();
    }
  }
}
```

### 3.4 Level System

**Level Format (from repository analysis):**[1]
```
title = Level Title
cards = commit-auto checkout merge

[description]
Level description text explaining the task.

[cli]
Optional command-line hints for advanced users.

[setup]
# Bash-style setup commands that create initial state
echo "Initial content" > file.txt
git add .
git commit -m "Initial commit"

[win]
# Bash-style win condition checks
# Return 0 if solved, non-zero otherwise
test "$(git show HEAD:file.txt)" = "Expected content"

[congrats]
Congratulations message when level is completed.
```

**Multi-Repository Levels (for remotes):**
```
[setup yours]
# Setup for player's repository

[setup friend]
# Setup for remote repository

[win yours]
# Win condition for player's repo

[win friend]
# Win condition for friend's repo
```

**Level Loader Implementation:**
```javascript
class LevelLoader {
  parseLevelFile(content) {
    const sections = this.extractSections(content);
    
    return {
      title: sections.title,
      cards: sections.cards.split(' '),
      description: sections.description,
      cliHints: sections.cli,
      repositories: this.parseRepositories(sections),
      winConditions: this.parseWinConditions(sections),
      congratsText: sections.congrats
    };
  }
  
  async setupLevel(level) {
    for (const [repoName, setup] of Object.entries(level.repositories)) {
      const repo = await this.createRepository(repoName);
      await this.runSetupCommands(repo, setup);
    }
  }
}
```

### 3.5 File Browser

**Requirements:**
- Show working directory contents
- Display file/folder tree structure
- Allow viewing file contents
- Show staging area (index) status
- Visual indicators for modified/staged/untracked files

**Visual Design:**
- Left side panel or right side panel
- Tree view with expandable folders
- File icons (from SVG assets)[4]
- Color coding: green for staged, red for modified, gray for untracked

### 3.6 Win Condition System

**Implementation:**
```javascript
class WinConditionChecker {
  async checkConditions(repo, conditions) {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(repo, condition);
      if (!result.passed) {
        return { won: false, failedCondition: condition };
      }
    }
    return { won: true };
  }
  
  async evaluateCondition(repo, condition) {
    // Parse bash-style test commands
    // Convert to isogit API calls
    // Examples:
    // - test "$(git log --oneline | wc -l)" -eq 2
    //   → Check if there are exactly 2 commits
    // - git show HEAD:file.txt | grep "text"
    //   → Check if HEAD's file.txt contains "text"
  }
}
```

## 4. Visualization Details

### 4.1 Node Types and Visual Representation

Based on the original graphics:[2][1]

**Commit Nodes:**
- Shape: Rounded square
- Color: Yellow/gold (#F4D03F or similar)
- Size: ~40-60px
- Shadow/glow effect
- Shows first 7 chars of hash on hover

**Blob Nodes:**
- Shape: Square
- Color: Tan/beige
- Smaller than commits (~30px)
- Represents file content objects

**Tree Nodes:**
- Similar to blobs but may have folder icon
- Represents directory objects

**HEAD Indicator:**
- Blue character/monster sprite
- Positioned on or near current commit
- Animated movement when checking out

**Branch/Tag Labels:**
- Rounded rectangle badges
- Color-coded: blue for local branches, purple for remote branches
- Positioned near the commit they reference
- Arrow pointing to commit

**Connections:**
- Yellow arrows from child to parent (time direction)
- Curved paths using D3's link functions
- Animated appearance/disappearance

### 4.2 Layout Algorithm

**Force-Directed Graph with Custom Forces:**

```javascript
function createVisualization(width, height) {
  const simulation = d3.forceSimulation()
    // Keep nodes apart
    .force("charge", d3.forceManyBody().strength(-400))
    
    // Link commits to parents
    .force("link", d3.forceLink()
      .id(d => d.id)
      .distance(150))
    
    // Center the graph
    .force("center", d3.forceCenter(width / 2, height / 2))
    
    // Custom force to arrange commits vertically by time
    .force("y", d3.forceY()
      .y(d => d.commitTime * 50)
      .strength(0.3))
    
    // Collision detection
    .force("collision", d3.forceCollide().radius(50));
    
  return simulation;
}
```

### 4.3 Animation System

**Key Animations:**
- **New commit appears**: Scale from 0 to 1, fade in (500ms)
- **Checkout operation**: HEAD moves smoothly (800ms ease-in-out)
- **Branch created**: Label fades in with slight bounce
- **Merge**: Both parent arrows appear sequentially
- **Rebase**: Commits "jump" to new parent with arc trajectory

```javascript
function animateNewCommit(node) {
  d3.select(node)
    .attr("opacity", 0)
    .attr("transform", "scale(0)")
    .transition()
    .duration(500)
    .attr("opacity", 1)
    .attr("transform", "scale(1)")
    .ease(d3.easeElastic);
}
```

## 5. Git Integration

### 5.1 Using isogit

**Setup:**
```javascript
import git from 'isogit';
import LightningFS from '@isomorphic-git/lightning-fs';

class GitManager {
  constructor() {
    this.fs = new LightningFS('fs');
    this.dir = '/repo';
  }
  
  async init() {
    await git.init({ fs: this.fs, dir: this.dir });
    await this.configureUser();
  }
  
  async commit(message) {
    await git.add({ fs: this.fs, dir: this.dir, filepath: '.' });
    const sha = await git.commit({
      fs: this.fs,
      dir: this.dir,
      message: message,
      author: {
        name: 'Player',
        email: 'player@ohmygit.org'
      }
    });
    
    await this.updateVisualization();
    return sha;
  }
  
  async getRepoState() {
    const commits = await git.log({ fs: this.fs, dir: this.dir });
    const branches = await git.listBranches({ fs: this.fs, dir: this.dir });
    const head = await git.resolveRef({ fs: this.fs, dir: this.dir, ref: 'HEAD' });
    
    return { commits, branches, head };
  }
}
```

### 5.2 Command Translation

**Card Actions → isogit API:**
```javascript
const commandMap = {
  'commit-auto': async (repo) => {
    await repo.add('.');
    await repo.commit('New commit');
  },
  
  'checkout': async (repo, ref) => {
    await git.checkout({
      fs: repo.fs,
      dir: repo.dir,
      ref: ref
    });
  },
  
  'merge': async (repo, branch) => {
    await git.merge({
      fs: repo.fs,
      dir: repo.dir,
      ours: 'HEAD',
      theirs: branch
    });
  }
};
```

### 5.3 Terminal Command Parsing

**Basic Git Command Parser:**
```javascript
class GitCommandParser {
  async parse(input) {
    const tokens = input.split(/\s+/);
    
    if (tokens[0] !== 'git') {
      return { error: 'Only git commands are supported' };
    }
    
    const subcommand = tokens[1];
    const args = tokens.slice(2);
    
    switch (subcommand) {
      case 'commit':
        return this.parseCommit(args);
      case 'checkout':
        return this.parseCheckout(args);
      case 'branch':
        return this.parseBranch(args);
      // ... more commands
    }
  }
  
  parseCommit(args) {
    let message = 'Commit';
    let all = false;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-m' && args[i+1]) {
        message = args[i+1];
        i++;
      } else if (args[i] === '-a' || args[i] === '-am') {
        all = true;
      }
    }
    
    return { command: 'commit

[1](https://github.com/git-learning-game/oh-my-git)
[2](https://ohmygit.org/)
[3](https://ohmygit.org/)
[4](https://github.com/git-learning-game/oh-my-git/tree/main/nodes)