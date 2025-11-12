# Git Learning Game - Web Version 🎮

An interactive, browser-based game that teaches Git concepts through visual demonstrations and hands-on practice. Inspired by [Oh My Git!](https://ohmygit.org), this web version runs entirely in the browser without requiring downloads.

![Git Learning Game](/.playwright-mcp/page-2025-11-12T15-34-14-400Z.png)

## 🌟 Features

- **Real-time Git Visualization**: See your Git graph update live as you execute commands
- **Interactive Card Interface**: Visual command cards for common Git operations
- **Built-in Terminal**: For advanced users who want to type commands directly
- **File System View**: See your working directory and file changes in real-time
- **Progressive Learning**: Multiple levels that teach Git concepts incrementally
- **No Installation Required**: Runs entirely in the browser using isomorphic-git

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Navigate to the project directory
cd git-learning-game

# Install dependencies
npm install

# Start the development server
npm run dev
```

The game will be available at `http://localhost:5173`

## 🎯 How to Play

1. **Read the Level Description**: Each level explains what you need to accomplish
2. **Use Command Cards**: Click on the visual cards to execute Git commands quickly
3. **Or Use the Terminal**: Type Git commands directly for a more authentic experience
4. **Watch the Visualization**: See your Git graph update in real-time
5. **Complete the Objective**: When you meet the level's win condition, you'll advance!

## 📚 Current Levels

1. **Your First Commit** - Learn how to make your first Git snapshot
2. **Commit Changes** - Understand staging and committing modifications  
3. **Create a Branch** - Learn about Git branches
4. **Switch Branches** - Practice checking out different branches
5. **Sandbox** - Free play mode to experiment

## 🛠️ Technology Stack

- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Vite** - Lightning-fast build tool and dev server
- **isomorphic-git** - Full Git implementation that runs in the browser
- **D3.js** - Powerful data visualization for the commit graph
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icons

## 🏗️ Project Structure

```
src/
├── components/        # React components
│   ├── GitGraph.tsx   # D3-based commit graph visualization
│   ├── FileTree.tsx   # File system display
│   ├── Terminal.tsx   # Interactive command terminal
│   └── CommandCard.tsx # Visual command buttons
├── services/
│   └── gitService.ts  # Git operations wrapper
├── store/
│   └── gameStore.ts   # Global state management
├── data/
│   └── levels.ts      # Level definitions
├── types/
│   └── index.ts       # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🎨 Key Components

### GitGraph Component
Uses D3.js to create an interactive visualization of:
- Commits (as circles)
- Commit relationships (parent/child connections)
- Branch references (as colored labels)
- HEAD pointer (special highlighting)

### GitService
Wraps isomorphic-git to provide a clean API for:
- Repository initialization
- File operations (read/write)
- Git commands (add, commit, branch, checkout)
- Status and history queries

### Level System
Levels are defined declaratively with:
- **Setup**: Bash commands to initialize the level
- **Description**: What the player needs to do
- **Win Condition**: How to determine if the level is complete
- **Cards**: Which command cards to show

## 🔧 Development

### Adding New Levels

Edit `src/data/levels.ts` to add new levels:

```typescript
{
  id: 'my-level',
  title: 'Level Title',
  description: 'What the player needs to do...',
  setup: [
    'echo "content" > file.txt',
    'git add file.txt',
    'git commit -m "Initial commit"',
  ],
  winCondition: 'hasCommits:2', // or 'hasBranches:3', 'currentBranch:main', 'always'
  cards: ['add', 'commit', 'branch'],
}
```

### Win Condition Types

- `hasCommits:N` - Requires at least N commits
- `hasBranches:N` - Requires at least N branches
- `currentBranch:name` - Must be on a specific branch
- `always` - Level always complete (sandbox mode)

## 🐛 Known Issues & TODOs

1. **File Initialization**: The file system needs better initialization on level start
2. **Error Handling**: Some Git errors need more user-friendly messages
3. **More Levels**: Add levels for merge, rebase, stash, remotes, etc.
4. **Visual Enhancements**: Add animations for Git operations
5. **Mobile Support**: Optimize layout for mobile devices
6. **Save Progress**: Add local storage to save user progress
7. **Achievements**: Add badges and achievements system

## 🌐 Deployment

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory. Deploy to any static hosting service:
- **Netlify**: Drop the `dist` folder or connect your Git repo
- **Vercel**: Connect your Git repo for automatic deployments
- **GitHub Pages**: Use `gh-pages` package
- **Cloudflare Pages**: Connect your Git repo

## 📖 Resources

- [Original Oh My Git! Game](https://ohmygit.org)
- [isomorphic-git Documentation](https://isomorphic-git.org/)
- [D3.js Documentation](https://d3js.org/)
- [Pro Git Book](https://git-scm.com/book/en/v2)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new levels
- Improve visualizations
- Fix bugs
- Enhance documentation
- Add new features

## 📝 License

This project is inspired by Oh My Git! which is licensed under Blue Oak Model License 1.0.0.

## 🙏 Acknowledgments

- **Oh My Git!** by [blinry](https://morr.cc/) and [bleeptrack](https://bleeptrack.de/) for the inspiration
- **isomorphic-git** team for making Git work in the browser
- All the amazing open-source libraries that made this possible

---

Made with ❤️ for Git learners everywhere!
