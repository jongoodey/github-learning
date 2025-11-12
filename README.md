# GitHub Learning Game 🎮

An interactive, browser-based game that teaches Git and GitHub concepts through visual demonstrations and hands-on practice. Built with React, TypeScript, and D3.js, this game runs entirely in your browser—no downloads or installations required!

![Git Learning Game](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Real-time Git Visualization
- **Interactive commit graph** powered by D3.js
- See commits, branches, and relationships update live
- Beautiful visual representation of Git's internal structure

### Dual Interface
- **Command Cards**: Click visual cards to execute common Git commands
- **Built-in Terminal**: Type commands directly for a more authentic experience
- Command history with arrow key navigation

### Progressive Learning
- 5 starter levels from basics to branching
- Auto-detecting win conditions
- Progress tracking and level navigation
- Sandbox mode for experimentation

### Modern Tech Stack
- Runs entirely in the browser using isomorphic-git
- No server or backend required
- In-memory file system for instant operations
- Responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone git@github.com:jongoodey/github-learning.git
cd github-learning

# Navigate to the game directory
cd git-learning-game

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` to start playing!

## 📚 Current Levels

1. **Your First Commit** - Learn how to make your first Git snapshot
2. **Commit Changes** - Understand staging and committing modifications
3. **Create a Branch** - Learn about Git branches
4. **Switch Branches** - Practice checking out different branches
5. **Sandbox** - Free play mode to experiment with all commands

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Modern UI framework with type safety |
| Vite | Lightning-fast build tool and dev server |
| isomorphic-git | Full Git implementation for the browser |
| Lightning FS | In-memory file system |
| D3.js | Powerful commit graph visualization |
| Zustand | Lightweight state management |
| Tailwind CSS | Utility-first styling |
| Lucide React | Beautiful, consistent icons |

## 🎯 How It Works

### Git in the Browser
The game uses [isomorphic-git](https://isomorphic-git.org/), a pure JavaScript implementation of Git that runs in the browser. Combined with Lightning FS (an in-memory file system), it provides a fully functional Git environment without any server.

### Real-time Visualization
As you execute Git commands, the D3.js-powered visualization updates to show:
- Commits as colored circles
- Parent-child relationships as connecting lines
- Branch labels and HEAD pointer
- Commit messages and hashes

### Level System
Levels are defined declaratively with:
- **Setup scripts**: Initialize the repository state
- **Win conditions**: Auto-detect when objectives are met
- **Available commands**: Control which operations are allowed
- **Progressive difficulty**: Build on previous concepts

## 📖 Project Structure

```
git-learning-game/
├── src/
│   ├── components/        # React components
│   │   ├── GitGraph.tsx   # D3-based commit graph
│   │   ├── FileTree.tsx   # File system browser
│   │   ├── Terminal.tsx   # Interactive terminal
│   │   └── CommandCard.tsx # Visual command buttons
│   ├── services/
│   │   └── gitService.ts  # Git operations wrapper
│   ├── store/
│   │   └── gameStore.ts   # Zustand state management
│   ├── data/
│   │   └── levels.ts      # Level definitions
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   └── App.tsx            # Main application
├── public/                # Static assets
└── package.json           # Dependencies
```

## 🎨 Adding New Levels

Edit `src/data/levels.ts` to add new levels:

```typescript
{
  id: 'my-level',
  title: 'Level Title',
  description: 'Explain the task...',
  cli: 'Optional CLI hints...',
  congrats: 'Success message!',
  setup: [
    'echo "content" > file.txt',
    'git add file.txt',
    'git commit -m "Initial commit"',
  ],
  winCondition: 'hasCommits:2', // hasCommits:N, hasBranches:N, currentBranch:name, always
  cards: ['add', 'commit', 'branch', 'checkout'],
}
```

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` directory will contain your production build.

### Deployment Options

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your GitHub repo for automatic deployments
- **GitHub Pages**: Use the `gh-pages` npm package
- **Cloudflare Pages**: Connect your repository

## 🐛 Known Issues & Future Enhancements

### Current Issues
- [ ] File system initialization needs improvement
- [ ] Some Git error messages need better formatting

### Planned Features
- [ ] More levels (merge, rebase, stash, remotes, conflicts)
- [ ] Animations for Git operations
- [ ] Achievement and badge system
- [ ] Save progress to localStorage
- [ ] Mobile optimization
- [ ] Multiplayer/collaborative mode
- [ ] Export commit history
- [ ] Interactive tutorials with tooltips

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new levels
- Improve visualizations
- Fix bugs
- Enhance documentation
- Add new features

## 📝 License

MIT License - feel free to use this project for learning and teaching!

## 🙏 Acknowledgments

This project is inspired by:
- **[Oh My Git!](https://ohmygit.org)** by blinry and bleeptrack - The original Git learning game
- **[isomorphic-git](https://isomorphic-git.org/)** - For making Git work in the browser
- **[Pro Git Book](https://git-scm.com/book/en/v2)** - Comprehensive Git documentation

## 📬 Contact

Created by [@jongoodey](https://github.com/jongoodey)

---

**Happy Git Learning! 🚀**

Start your journey to Git mastery today - no installations required!

