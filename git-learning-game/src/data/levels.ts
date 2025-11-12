import { Level } from '../types';

export const levels: Level[] = [
  {
    id: 'intro-1',
    title: 'Your first commit',
    description: `Welcome to Git Learning Game! 

You can use Git to make snapshots of files. Here, let's practice this!

(Your teacher pours some water into a glass.)`,
    cli: `You can use the cards below, or type commands into the terminal at the bottom! This is optional but will give you a sparkling golden badge! :)`,
    congrats: 'Nice! You can try making some additional commits. When you feel comfortable, click on "Next Level".',
    setup: [
      'echo "The glass is full of water." > glass',
    ],
    winCondition: 'hasCommits:2',
    cards: ['commit'],
  },
  {
    id: 'intro-2',
    title: 'Commit changes',
    description: `Great! Now let's make another commit.

First, modify the glass file by changing its contents.
Then stage the changes with 'git add', and make a new commit!`,
    cli: `Remember: you can also type these commands directly:
- git add <filename>
- git commit -m "your message"`,
    congrats: 'Excellent! You\'ve learned how to track changes with Git.',
    setup: [
      'echo "The glass is full of water." > glass',
      'git add glass',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'hasCommits:2',
    cards: ['add', 'commit'],
  },
  {
    id: 'branches-1',
    title: 'Create a branch',
    description: `Branches let you work on different versions of your project!

Create a new branch called "experiment".`,
    cli: `Use: git branch <branch-name>`,
    congrats: 'Great! You created your first branch. Branches are incredibly useful for trying out new ideas!',
    setup: [
      'echo "Hello" > file.txt',
      'git add file.txt',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'hasBranches:2',
    cards: ['branch'],
  },
  {
    id: 'branches-2',
    title: 'Switch branches',
    description: `Now switch to your new "experiment" branch and make a commit there!`,
    cli: `Use: git checkout <branch-name>`,
    congrats: 'Awesome! You can now work on multiple branches independently.',
    setup: [
      'echo "Hello" > file.txt',
      'git add file.txt',
      'git commit -m "Initial commit"',
      'git branch experiment',
    ],
    winCondition: 'currentBranch:experiment',
    cards: ['checkout', 'commit'],
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    description: `Feel free to experiment! Try any Git commands you want.

This level has no win condition - just explore and have fun!`,
    cli: `Try different commands and see what happens!`,
    congrats: 'Great exploration!',
    setup: [
      'echo "Sandbox mode" > readme.txt',
      'git add readme.txt',
      'git commit -m "Initial commit"',
    ],
    winCondition: 'always',
    cards: ['add', 'commit', 'branch', 'checkout'],
  },
];

