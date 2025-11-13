import git from 'isomorphic-git';
import LightningFS from '@isomorphic-git/lightning-fs';
import { GitCommit, GitRef, FileTreeNode } from '../types';

type StatusEntry = [string, number, number, number];

class GitService {
  private fs: any;
  private dir: string;
  private pfs: any;

  constructor() {
    this.fs = new LightningFS('git-learning-game');
    this.dir = '/repo';
    this.pfs = this.fs.promises;
    
    // Ensure root directory exists
    this.pfs.mkdir('/').catch(() => {
      // Root might already exist, ignore
    });
  }

  async init(): Promise<void> {
    try {
      // Ensure root exists first
      try {
        await this.pfs.stat('/');
      } catch (e) {
        await this.pfs.mkdir('/');
      }
      
      // Create repo directory
      try {
        await this.pfs.mkdir(this.dir);
      } catch (e) {
        // Directory might already exist, that's okay
      }
    } catch (e) {
      console.error('Error creating directories:', e);
    }
    
    try {
      await git.init({
        fs: this.fs,
        dir: this.dir,
        defaultBranch: 'main',
      });

      // Configure git
      await git.setConfig({
        fs: this.fs,
        dir: this.dir,
        path: 'user.name',
        value: 'Git Learner',
      });

      await git.setConfig({
        fs: this.fs,
        dir: this.dir,
        path: 'user.email',
        value: 'learner@ohmygit.org',
      });
    } catch (e) {
      console.error('Error initializing git:', e);
      throw e;
    }
  }

  private async ensureRepoDir(): Promise<boolean> {
    try {
      await this.pfs.stat(this.dir);
      return true;
    } catch {
      await this.pfs.mkdir(this.dir);
      return false;
    }
  }

  async reset(): Promise<void> {
    const existed = await this.ensureRepoDir();

    if (existed) {
      try {
        const files = await this.pfs.readdir(this.dir);
        for (const file of files) {
          if (file !== '.git') {
            await this.removeRecursive(`${this.dir}/${file}`);
          }
        }
      } catch (e) {
        console.warn('Reset skipped clearing repository contents:', e);
      }

      // Check if .git exists, if not, reinitialize
      try {
        await this.pfs.stat(`${this.dir}/.git`);
      } catch (e) {
        // .git doesn't exist, initialize
        await git.init({
          fs: this.fs,
          dir: this.dir,
          defaultBranch: 'main',
        });

        await git.setConfig({
          fs: this.fs,
          dir: this.dir,
          path: 'user.name',
          value: 'Git Learner',
        });

        await git.setConfig({
          fs: this.fs,
          dir: this.dir,
          path: 'user.email',
          value: 'learner@ohmygit.org',
        });
      }
    }

    // Reinitialize regardless
    await this.init();
  }

  private async removeRecursive(path: string): Promise<void> {
    try {
      const stat = await this.pfs.stat(path);
      if (stat.type === 'dir') {
        const files = await this.pfs.readdir(path);
        for (const file of files) {
          await this.removeRecursive(`${path}/${file}`);
        }
        await this.pfs.rmdir(path);
      } else {
        await this.pfs.unlink(path);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  async writeFile(filepath: string, content: string): Promise<void> {
    const fullPath = `${this.dir}/${filepath}`;
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    
    // Create directory if it doesn't exist
    if (dirPath !== this.dir) {
      await this.mkdirRecursive(dirPath);
    }
    
    await this.pfs.writeFile(fullPath, content, 'utf8');
  }

  async readFile(filepath: string): Promise<string> {
    const content = await this.pfs.readFile(`${this.dir}/${filepath}`, 'utf8');
    return content;
  }

  private async mkdirRecursive(path: string): Promise<void> {
    const parts = path.split('/').filter(p => p);
    let current = '';
    
    for (const part of parts) {
      current += '/' + part;
      try {
        await this.pfs.mkdir(current);
      } catch (e) {
        // Directory might already exist
      }
    }
  }

  async add(filepath: string): Promise<void> {
    await git.add({
      fs: this.fs,
      dir: this.dir,
      filepath,
    });
  }

  async commit(message: string): Promise<string> {
    const sha = await git.commit({
      fs: this.fs,
      dir: this.dir,
      message,
      author: {
        name: 'Git Learner',
        email: 'learner@ohmygit.org',
      },
    });
    return sha;
  }

  async log(): Promise<GitCommit[]> {
    try {
      const commits = await git.log({
        fs: this.fs,
        dir: this.dir,
        depth: 100,
      });

      return commits.map(commit => ({
        oid: commit.oid,
        message: commit.commit.message,
        parent: commit.commit.parent,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          timestamp: commit.commit.author.timestamp,
        },
      }));
    } catch (e) {
      return [];
    }
  }

  async branch(name: string): Promise<void> {
    await git.branch({
      fs: this.fs,
      dir: this.dir,
      ref: name,
    });
  }

  async checkout(ref: string): Promise<void> {
    await git.checkout({
      fs: this.fs,
      dir: this.dir,
      ref,
    });
  }

  async listBranches(): Promise<string[]> {
    const branches = await git.listBranches({
      fs: this.fs,
      dir: this.dir,
    });
    return branches;
  }

  async currentBranch(): Promise<string> {
    const branch = await git.currentBranch({
      fs: this.fs,
      dir: this.dir,
    });
    return branch || 'main';
  }

  async getRefs(): Promise<GitRef[]> {
    const refs: GitRef[] = [];
    
    try {
      const branches = await this.listBranches();
      const currentBranch = await this.currentBranch();
      
      for (const branch of branches) {
        const oid = await git.resolveRef({
          fs: this.fs,
          dir: this.dir,
          ref: branch,
        });
        
        refs.push({
          name: branch,
          oid,
          type: branch === currentBranch ? 'HEAD' : 'branch',
        });
      }
    } catch (e) {
      console.error('Error getting refs:', e);
    }
    
    return refs;
  }

  async getFileTree(): Promise<FileTreeNode> {
    const root: FileTreeNode = {
      name: 'repo',
      path: '',
      type: 'directory',
      children: [],
    };

    try {
      await this.buildFileTree(this.dir, root);
    } catch (e) {
      console.error('Error building file tree:', e);
    }

    return root;
  }

  private async buildFileTree(dirPath: string, node: FileTreeNode): Promise<void> {
    try {
      const files = await this.pfs.readdir(dirPath);
      
      for (const file of files) {
        if (file === '.git') continue;
        
        const fullPath = `${dirPath}/${file}`;
        const stat = await this.pfs.stat(fullPath);
        const relativePath = fullPath.replace(this.dir + '/', '');
        
        if (stat.type === 'dir') {
          const childNode: FileTreeNode = {
            name: file,
            path: relativePath,
            type: 'directory',
            children: [],
          };
          node.children!.push(childNode);
          await this.buildFileTree(fullPath, childNode);
        } else {
          const content = await this.pfs.readFile(fullPath, 'utf8');
          node.children!.push({
            name: file,
            path: relativePath,
            type: 'file',
            content,
          });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  async status(): Promise<StatusEntry[]> {
    return await git.statusMatrix({
      fs: this.fs,
      dir: this.dir,
    });
  }

  async executeCommand(command: string): Promise<string> {
    const parts = command.trim().split(/\s+/);
    const firstCommand = parts[0];
    const isGitCommand = firstCommand === 'git';
    const gitCommand = isGitCommand ? parts[1] : firstCommand;
    const args = isGitCommand ? parts.slice(2) : parts.slice(1);

    console.log('Executing:', gitCommand, args);

    try {
      // Handle basic terminal commands
      switch (firstCommand) {
        case 'help':
          return `Available commands:
Terminal Commands:
  help              - Show this help message
  ls                - List files in current directory
  pwd               - Print working directory
  cat <file>        - Display file contents
  echo <text>       - Print text to terminal

Git Commands:
  git init          - Initialize a repository
  git status        - Show working tree status
  git add <file>    - Add file to staging area
  git commit -m     - Commit staged changes
  git log           - Show commit history
  git branch        - List or create branches
  git checkout      - Switch branches
  git merge         - Merge branches
  git diff          - Show changes
  git reset         - Reset current HEAD
  git stash         - Stash changes
  git tag           - Create or list tags
  git remote        - Manage remote repositories
  git push          - Push to remote (simulated)
  git pull          - Pull from remote (simulated)

Type any command to try it out!`;

        case 'ls':
          try {
            const files = await this.pfs.readdir(this.dir);
            const fileList = files.filter((f: string) => f !== '.git');
            if (fileList.length === 0) {
              return '(empty directory)';
            }
            // Get details for each file
            const fileDetails = await Promise.all(
              fileList.map(async (f: string) => {
                try {
                  const stat = await this.pfs.stat(`${this.dir}/${f}`);
                  return `${stat.type === 'dir' ? '📁' : '📄'} ${f}`;
                } catch {
                  return `📄 ${f}`;
                }
              })
            );
            return fileDetails.join('\n');
          } catch (e) {
            return '(empty directory)';
          }

        case 'pwd':
          return this.dir;

        case 'cat':
          if (args.length === 0) {
            return 'Error: missing file operand\nUsage: cat <filename>';
          }
          try {
            const content = await this.readFile(args[0]);
            return content;
          } catch (e) {
            return `cat: ${args[0]}: No such file or directory`;
          }

        case 'echo':
          return args.join(' ');
      }

      // Handle git commands
      if (!isGitCommand && gitCommand !== 'init' && gitCommand !== 'add' &&
          gitCommand !== 'commit' && gitCommand !== 'branch' &&
          gitCommand !== 'checkout' && gitCommand !== 'log' &&
          gitCommand !== 'status' && gitCommand !== 'merge' &&
          gitCommand !== 'diff' && gitCommand !== 'reset' &&
          gitCommand !== 'stash' && gitCommand !== 'tag' &&
          gitCommand !== 'remote' && gitCommand !== 'push' &&
          gitCommand !== 'pull' && gitCommand !== 'show') {
        return `Unknown command: ${firstCommand}\nType 'help' for available commands.`;
      }

      switch (gitCommand) {
        case 'init':
          await this.init();
          return '✅ Initialized empty Git repository';

        case 'add':
          if (args.length === 0) {
            return 'Error: Nothing specified, nothing added.\nUsage: git add <file> or git add .';
          }
          if (args[0] === '.') {
            // Add all files
            const files = await this.pfs.readdir(this.dir);
            const filtered = files.filter((f: string) => f !== '.git');
            for (const file of filtered) {
              try {
                const stat = await this.pfs.stat(`${this.dir}/${file}`);
                if (stat.type !== 'dir') {
                  await this.add(file);
                }
              } catch (e) {
                // Skip if error
              }
            }
            return `✅ Added all files to staging area`;
          }
          for (const file of args) {
            await this.add(file);
          }
          return `✅ Added ${args.join(', ')} to staging area`;

        case 'commit':
          const messageIndex = args.indexOf('-m');
          if (messageIndex >= 0 && args[messageIndex + 1]) {
            const message = args.slice(messageIndex + 1).join(' ').replace(/^["']|["']$/g, '');
            const sha = await this.commit(message);
            return `✅ [${await this.currentBranch()} ${sha.substring(0, 7)}] ${message}`;
          }
          return 'Error: commit message required\nUsage: git commit -m "message"';

        case 'branch':
          if (args.length === 0) {
            const branches = await this.listBranches();
            const current = await this.currentBranch();
            return branches.map(b => b === current ? `* ${b}` : `  ${b}`).join('\n');
          } else if (args[0] === '-d' || args[0] === '--delete') {
            return `Branch deletion not supported in learning mode`;
          } else {
            await this.branch(args[0]);
            return `✅ Created branch '${args[0]}'`;
          }

        case 'checkout':
          if (args.length === 0) {
            return 'Error: branch name required\nUsage: git checkout <branch>';
          }
          try {
            await this.checkout(args[0]);
            return `✅ Switched to branch '${args[0]}'`;
          } catch (e: any) {
            return `Error: Branch '${args[0]}' does not exist\nUse 'git branch ${args[0]}' to create it first`;
          }

        case 'log':
          const commits = await this.log();
          if (commits.length === 0) {
            return 'No commits yet';
          }
          return commits.map(c =>
            `commit ${c.oid}\nAuthor: ${c.author.name} <${c.author.email}>\nDate:   ${new Date(c.author.timestamp * 1000).toLocaleString()}\n\n    ${c.message}\n`
          ).join('\n');

        case 'status':
          const status = await this.status();
          const staged = status.filter(([, head, , stage]) => stage !== head && stage !== 0);
          const modified = status.filter(([, head, workdir, stage]) => workdir !== head && workdir !== 0 && stage === head);
          const untracked = status.filter(([, head, workdir]) => head === 0 && workdir !== 0);

          let result = `On branch ${await this.currentBranch()}\n\n`;

          if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
            result += '✅ nothing to commit, working tree clean';
            return result;
          }

          if (staged.length > 0) {
            result += 'Changes to be committed:\n  (use "git reset HEAD <file>..." to unstage)\n\n';
            staged.forEach(([file]) => {
              result += `\tmodified:   ${file}\n`;
            });
            result += '\n';
          }

          if (modified.length > 0) {
            result += 'Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\n';
            modified.forEach(([file]) => {
              result += `\tmodified:   ${file}\n`;
            });
            result += '\n';
          }

          if (untracked.length > 0) {
            result += 'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n\n';
            untracked.forEach(([file]) => {
              result += `\t${file}\n`;
            });
          }

          return result;

        case 'merge':
          if (args.length === 0) {
            return 'Error: branch name required\nUsage: git merge <branch>';
          }
          return `✅ Merged branch '${args[0]}' (fast-forward)`;

        case 'diff':
          const diffStatus = await this.status();
          const changed = diffStatus.filter(([, head, workdir]) => workdir !== head && workdir !== 0);
          if (changed.length === 0) {
            return 'No changes to show';
          }
          let diffResult = '';
          for (const [file] of changed) {
            try {
              const content = await this.readFile(file);
              diffResult += `diff --git a/${file} b/${file}\n`;
              diffResult += `--- a/${file}\n`;
              diffResult += `+++ b/${file}\n`;
              diffResult += `@@ -0,0 +1,${content.split('\n').length} @@\n`;
              content.split('\n').forEach(line => {
                diffResult += `+${line}\n`;
              });
            } catch (e) {
              // Skip files that can't be read
            }
          }
          return diffResult || 'No changes to show';

        case 'reset':
          if (args.length === 0 || args[0] === 'HEAD') {
            return '✅ Unstaged all changes';
          }
          return `✅ Reset to ${args[0]}`;

        case 'stash':
          if (args.length === 0 || args[0] === 'push') {
            return '✅ Saved working directory and index state';
          } else if (args[0] === 'pop') {
            return '✅ Applied stashed changes';
          } else if (args[0] === 'list') {
            return 'No stashes found';
          }
          return 'Usage: git stash [push|pop|list]';

        case 'tag':
          if (args.length === 0) {
            return '(no tags yet)';
          }
          return `✅ Created tag '${args[0]}'`;

        case 'remote':
          if (args.length === 0) {
            return 'origin';
          } else if (args[0] === 'add') {
            return `✅ Added remote '${args[1]}'`;
          } else if (args[0] === '-v') {
            return 'origin\thttps://github.com/user/repo.git (fetch)\norigin\thttps://github.com/user/repo.git (push)';
          }
          return 'Usage: git remote [-v] [add <name> <url>]';

        case 'push':
          const currentBranch = await this.currentBranch();
          return `✅ Pushed to origin/${currentBranch}`;

        case 'pull':
          return `✅ Already up to date`;

        case 'show':
          const logCommits = await this.log();
          if (logCommits.length === 0) {
            return 'No commits yet';
          }
          const latest = logCommits[0];
          return `commit ${latest.oid}\nAuthor: ${latest.author.name} <${latest.author.email}>\nDate:   ${new Date(latest.author.timestamp * 1000).toLocaleString()}\n\n    ${latest.message}`;

        default:
          return `Unknown git command: ${gitCommand}\nType 'help' for available commands.`;
      }
    } catch (error: any) {
      return `❌ Error: ${error.message}`;
    }
  }

  getFS() {
    return this.fs;
  }

  getDir() {
    return this.dir;
  }
}

const gitServiceInstance = new GitService();

// Initialize on creation
gitServiceInstance.init().catch(err => {
  console.error('Failed to initialize git service:', err);
});

export default gitServiceInstance;
