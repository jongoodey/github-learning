import { Level } from '../types';

export const levels: Level[] = [
  {
    id: 'intro-1',
    title: 'Your first commit',
    description: `Welcome to the Git Learning Terminal! 🎮

You can use Git to make snapshots of files. Let's practice!

Type commands in the terminal below, or use the command cards.`,
    cli: `Try typing: git status
Then: git add glass
Finally: git commit -m "Add glass"

Type 'help' anytime to see all available commands!`,
    congrats: 'Nice! You made your first commit! Try making more commits to practice.',
    setup: [
      'echo "The glass is full of water." > glass',
    ],
    winCondition: 'hasCommits:2',
    cards: ['status', 'add', 'commit', 'log'],
  },
  {
    id: 'intro-2',
    title: 'Working with files',
    description: `Let's learn basic file operations!

Create a new file and add it to Git.`,
    cli: `Try these Unix commands:
- ls                    (list files)
- cat <filename>        (show file content)
- echo "text" > file    (create a file)
- touch <filename>      (create empty file)

Then use Git to track your changes!`,
    congrats: 'Excellent! You can now create files and track them with Git.',
    setup: [
      'echo "Hello World" > README.md',
      'git add README.md',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'hasCommits:2',
    cards: ['status', 'add', 'commit', 'log'],
  },
  {
    id: 'branches-1',
    title: 'Create a branch',
    description: `Branches let you work on different versions of your project!

Branches are essential for working on features without affecting the main code.`,
    cli: `Create a new branch:
- git branch <name>           (create branch)
- git branch                  (list branches)
- git checkout -b <name>      (create and switch)`,
    congrats: 'Great! Branches let you experiment safely!',
    setup: [
      'echo "Main branch" > file.txt',
      'git add file.txt',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'hasBranches:2',
    cards: ['branch', 'status', 'log'],
  },
  {
    id: 'branches-2',
    title: 'Switch branches',
    description: `Now switch to a different branch!

Each branch can have different files and commits.`,
    cli: `Switch branches:
- git checkout <branch>       (switch to branch)
- git checkout -b <branch>    (create and switch)`,
    congrats: 'Awesome! You can now work on multiple branches.',
    setup: [
      'echo "Hello" > file.txt',
      'git add file.txt',
      'git commit -m "Initial commit"',
      'git branch feature',
    ],
    winCondition: 'currentBranch:feature',
    cards: ['checkout', 'branch', 'status', 'log'],
  },
  {
    id: 'merge-1',
    title: 'Merge branches',
    description: `Now let's merge branches together!

You have two branches: main and feature.
Switch to main and merge the feature branch into it.`,
    cli: `Merging workflow:
1. git checkout main          (switch to main)
2. git merge feature          (merge feature into main)`,
    congrats: 'Perfect! Merging combines work from different branches.',
    setup: [
      'echo "Main line" > main.txt',
      'git add main.txt',
      'git commit -m "Main commit"',
      'git branch feature',
      'git checkout feature',
      'echo "Feature line" > feature.txt',
      'git add feature.txt',
      'git commit -m "Feature commit"',
    ],
    winCondition: 'merged:feature',
    cards: ['checkout', 'merge', 'branch', 'status', 'log'],
  },
  {
    id: 'stash-1',
    title: 'Git Stash - Save your work',
    description: `Sometimes you need to switch branches, but you're not ready to commit!

Git stash lets you save your work temporarily.`,
    cli: `Stashing workflow:
1. Make some changes to a file
2. git stash                  (save changes)
3. git stash list             (see your stashes)
4. git stash pop              (restore changes)

Try: echo "changes" > main.txt
Then: git stash`,
    congrats: 'Great! Stashing is essential for context switching!',
    setup: [
      'echo "Original" > main.txt',
      'git add main.txt',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'always',
    cards: ['stash', 'status', 'log'],
  },
  {
    id: 'remote-1',
    title: 'Working with remotes',
    description: `Git remotes let you collaborate with others!

In real projects, you push your code to GitHub, GitLab, etc.`,
    cli: `Remote commands:
- git remote                  (list remotes)
- git push origin main        (push to remote)
- git pull                    (pull from remote)

Try: git remote
Then: git push origin main`,
    congrats: 'Excellent! You understand Git remotes!',
    setup: [
      'echo "Code to share" > app.js',
      'git add app.js',
      'git commit -m "Add application"',
    ],
    winCondition: 'always',
    cards: ['remote', 'push', 'status', 'log'],
  },
  {
    id: 'pr-1',
    title: 'Creating a Pull Request',
    description: `Pull Requests (PRs) are how teams review code!

Create a feature branch, make changes, and create a PR.`,
    cli: `PR workflow:
1. git checkout -b my-feature
2. Make changes and commit them
3. git push origin my-feature
4. gh pr create --title "My Feature" --base main

Try creating your own PR! 🚀`,
    congrats: 'Amazing! You can now create Pull Requests like a pro!',
    setup: [
      'echo "Main app" > app.js',
      'git add app.js',
      'git commit -m "Initial app"',
    ],
    winCondition: 'always',
    cards: ['checkout', 'branch', 'push', 'status', 'log'],
  },
  {
    id: 'workflow-1',
    title: 'Complete Git workflow',
    description: `Let's practice a real-world workflow!

1. Create a feature branch
2. Make changes
3. Stash if needed
4. Commit your work
5. Push to remote
6. Create a PR`,
    cli: `Full workflow example:
git checkout -b add-login
echo "login code" > login.js
git add .
git commit -m "Add login feature"
git push origin add-login
gh pr create --title "Add Login Feature"

Try it yourself with your own feature! 💪`,
    congrats: 'Outstanding! You mastered the complete Git workflow!',
    setup: [
      'echo "# My Project" > README.md',
      'git add README.md',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'always',
    cards: ['checkout', 'branch', 'add', 'commit', 'stash', 'push', 'status', 'log'],
  },
  {
    id: 'sandbox',
    title: 'Free Practice Sandbox',
    description: `Free practice mode! Try anything you want! 🎮

Experiment with all the commands you've learned.`,
    cli: `Try these ideas:
• Create multiple branches and merge them
• Practice stashing and unstashing
• Create complex file structures
• Simulate a team workflow
• Type 'help' to see all commands!

Have fun exploring Git! 🚀`,
    congrats: 'Keep practicing! The more you use Git, the better you get!',
    setup: [
      'echo "Welcome to the sandbox!" > README.md',
      'git add README.md',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'always',
    cards: ['status', 'add', 'commit', 'log', 'branch', 'checkout', 'merge', 'stash', 'remote', 'push'],
  },
];

