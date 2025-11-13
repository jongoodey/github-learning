import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
import { GitCommit, GitRef, FileTreeNode } from '../types';

interface StashEntry {
  id: string;
  message: string;
  files: { [path: string]: string };
  timestamp: number;
}

interface SimulatedRemote {
  name: string;
  url: string;
  branches: { [key: string]: string };
}

class GitService {
  private fs: FS;
  private dir: string;
  private pfs: any;
  private stashStack: StashEntry[] = [];
  private remotes: Map<string, SimulatedRemote> = new Map();
  private currentDirectory: string = '/repo';

  constructor() {
    this.fs = new FS('git-learning-game');
    this.dir = '/repo';
    this.pfs = this.fs.promises;

    // Initialize default remote
    this.remotes.set('origin', {
      name: 'origin',
      url: 'https://github.com/user/git-learning-game.git',
      branches: {}
    });
  }

  async init(): Promise<void> {
    try {
      await this.pfs.mkdir(this.dir);
    } catch (e) {
      // Directory might already exist
    }
    
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
  }

  async resetRepo(): Promise<void> {
    // Clear the file system
    try {
      const files = await this.pfs.readdir(this.dir);
      for (const file of files) {
        if (file !== '.git') {
          await this.removeRecursive(`${this.dir}/${file}`);
        }
      }

      // Reinitialize
      await this.init();
    } catch (e) {
      console.error('Error resetting:', e);
    }
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

  async status(): Promise<any> {
    return await git.statusMatrix({
      fs: this.fs,
      dir: this.dir,
    });
  }

  // ============ STASH OPERATIONS ============
  async stashSave(message?: string): Promise<string> {
    const statusMatrix = await this.status();
    const modified = statusMatrix.filter(([, head, workdir]: any[]) => workdir !== head && workdir !== 0);

    if (modified.length === 0) {
      return 'No local changes to save';
    }

    // Save current file states
    const files: { [path: string]: string } = {};
    for (const [filepath] of modified) {
      try {
        const content = await this.pfs.readFile(`${this.dir}/${filepath}`, 'utf8');
        files[filepath] = content;
      } catch (e) {
        // File might be deleted
        files[filepath] = '';
      }
    }

    const stashId = `stash@{${this.stashStack.length}}`;
    const stashMessage = message || `WIP on ${await this.currentBranch()}`;

    this.stashStack.unshift({
      id: stashId,
      message: stashMessage,
      files,
      timestamp: Date.now()
    });

    // Revert files to HEAD state
    for (const [filepath] of modified) {
      try {
        await git.checkout({
          fs: this.fs,
          dir: this.dir,
          filepaths: [filepath],
          force: true
        });
      } catch (e) {
        // Ignore errors
      }
    }

    return `Saved working directory and index state: ${stashMessage}`;
  }

  async stashList(): Promise<StashEntry[]> {
    return this.stashStack;
  }

  async stashApply(index: number = 0): Promise<string> {
    if (index >= this.stashStack.length) {
      return `error: stash@{${index}} is not a valid reference`;
    }

    const stash = this.stashStack[index];

    // Restore files
    for (const [filepath, content] of Object.entries(stash.files)) {
      await this.writeFile(filepath, content);
    }

    return `On ${await this.currentBranch()}\nChanges not staged for commit:\n${Object.keys(stash.files).map(f => `\t${f}`).join('\n')}`;
  }

  async stashPop(index: number = 0): Promise<string> {
    const result = await this.stashApply(index);
    if (!result.startsWith('error:')) {
      this.stashStack.splice(index, 1);
    }
    return result;
  }

  async stashDrop(index: number = 0): Promise<string> {
    if (index >= this.stashStack.length) {
      return `error: stash@{${index}} is not a valid reference`;
    }

    const stash = this.stashStack.splice(index, 1)[0];
    return `Dropped ${stash.id} (${stash.message})`;
  }

  async stashClear(): Promise<string> {
    this.stashStack = [];
    return 'Cleared all stash entries';
  }

  // ============ MERGE OPERATIONS ============
  async merge(branch: string): Promise<string> {
    try {
      const currentBranch = await this.currentBranch();

      // Get current and target commits
      const currentCommit = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: currentBranch
      });

      const targetCommit = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: branch
      });

      if (currentCommit === targetCommit) {
        return 'Already up to date.';
      }

      // Perform merge
      await git.merge({
        fs: this.fs,
        dir: this.dir,
        ours: currentBranch,
        theirs: branch,
        author: {
          name: 'Git Learner',
          email: 'learner@ohmygit.org',
        },
      });

      return `Merge made by the 'recursive' strategy.`;
    } catch (error: any) {
      if (error.code === 'MergeNotSupportedError') {
        return `Merge conflict! (Simulated - in this learning environment, try resolving manually)`;
      }
      return `Error: ${error.message}`;
    }
  }

  // ============ REMOTE OPERATIONS ============
  async addRemote(name: string, url: string): Promise<void> {
    this.remotes.set(name, {
      name,
      url,
      branches: {}
    });
  }

  async listRemotes(): Promise<string[]> {
    return Array.from(this.remotes.keys());
  }

  async push(remote: string = 'origin', branch?: string): Promise<string> {
    const currentBranch = branch || await this.currentBranch();
    const remoteName = remote;

    if (!this.remotes.has(remoteName)) {
      return `fatal: '${remoteName}' does not appear to be a git repository`;
    }

    const remoteObj = this.remotes.get(remoteName)!;

    try {
      const currentCommit = await git.resolveRef({
        fs: this.fs,
        dir: this.dir,
        ref: currentBranch
      });

      remoteObj.branches[currentBranch] = currentCommit;

      return `To ${remoteObj.url}\n   ${currentCommit.substring(0, 7)}..${currentCommit.substring(0, 7)}  ${currentBranch} -> ${currentBranch}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async pull(remote: string = 'origin', branch?: string): Promise<string> {
    const currentBranch = branch || await this.currentBranch();
    return `Already up to date. (Simulated pull from ${remote}/${currentBranch})`;
  }

  async fetch(remote: string = 'origin'): Promise<string> {
    if (!this.remotes.has(remote)) {
      return `fatal: '${remote}' does not appear to be a git repository`;
    }

    return `From ${this.remotes.get(remote)!.url}\n (Simulated fetch completed)`;
  }

  // ============ UNIX COMMANDS ============
  async ls(path: string = '.'): Promise<string> {
    try {
      const targetPath = path === '.' ? this.currentDirectory : `${this.currentDirectory}/${path}`;
      const files = await this.pfs.readdir(targetPath);
      return files.filter((f: string) => f !== '.git').join('\n');
    } catch (error) {
      return `ls: cannot access '${path}': No such file or directory`;
    }
  }

  async pwd(): Promise<string> {
    return this.currentDirectory;
  }

  async cat(filepath: string): Promise<string> {
    try {
      const content = await this.readFile(filepath);
      return content;
    } catch (error) {
      return `cat: ${filepath}: No such file or directory`;
    }
  }

  async mkdir(dirpath: string): Promise<string> {
    try {
      await this.mkdirRecursive(`${this.dir}/${dirpath}`);
      return '';
    } catch (error: any) {
      return `mkdir: cannot create directory '${dirpath}': ${error.message}`;
    }
  }

  async touch(filepath: string): Promise<string> {
    try {
      await this.writeFile(filepath, '');
      return '';
    } catch (error: any) {
      return `touch: cannot touch '${filepath}': ${error.message}`;
    }
  }

  async rm(filepath: string, recursive: boolean = false): Promise<string> {
    try {
      const fullPath = `${this.dir}/${filepath}`;
      if (recursive) {
        await this.removeRecursive(fullPath);
      } else {
        await this.pfs.unlink(fullPath);
      }
      return '';
    } catch (error: any) {
      return `rm: cannot remove '${filepath}': ${error.message}`;
    }
  }

  async echo(text: string, redirect?: string): Promise<string> {
    if (redirect) {
      await this.writeFile(redirect, text);
      return '';
    }
    return text;
  }

  // ============ SIMULATED ADVANCED COMMANDS ============
  async cherryPick(commitOid: string): Promise<string> {
    return `[Simulated] Cherry-picked commit ${commitOid.substring(0, 7)}\n(Full cherry-pick not supported in browser environment)`;
  }

  async rebase(upstream: string): Promise<string> {
    return `[Simulated] Successfully rebased onto ${upstream}\n(Full rebase not supported in browser environment)`;
  }

  async reset(mode: string = 'mixed', ref: string = 'HEAD'): Promise<string> {
    try {
      if (mode === 'hard') {
        // Hard reset - reset working directory and index
        const commits = await this.log();
        if (commits.length > 0 && ref === 'HEAD~1') {
          return `HEAD is now at ${commits[1]?.oid.substring(0, 7) || 'initial'} ${commits[1]?.message || ''}`;
        }
      }
      return `[Simulated] Reset to ${ref} (${mode} mode)`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  async createPR(title: string, _body: string = '', base: string = 'main'): Promise<string> {
    const currentBranch = await this.currentBranch();

    if (currentBranch === base) {
      return `Error: Cannot create PR from ${base} to ${base}`;
    }

    const prNumber = Math.floor(Math.random() * 1000) + 1;
    const prUrl = `https://github.com/user/repo/pull/${prNumber}`;

    return `
✓ Pull Request Created!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Title: ${title}
  Branch: ${currentBranch} → ${base}
  URL: ${prUrl}

This is a simulated PR in the learning environment.
In real GitHub, you'd use: gh pr create --title "${title}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  async executeCommand(command: string): Promise<string> {
    const parts = command.trim().split(/\s+/);
    const gitCommand = parts[0] === 'git' ? (parts[1] || '') : parts[0];
    const args = parts[0] === 'git' ? parts.slice(2) : parts.slice(1);

    console.log('Executing:', gitCommand, args);

    // Handle empty git command
    if (parts[0] === 'git' && !gitCommand) {
      return 'usage: git <command> [<args>]\n\nType "help" for available commands.';
    }

    // Handle empty command
    if (!gitCommand) {
      return 'Type "help" for available commands.';
    }

    try {
      switch (gitCommand) {
        // ============ BASIC GIT COMMANDS ============
        case 'init':
          await this.init();
          return 'Initialized empty Git repository';

        case 'add':
          if (args.length === 0) {
            return 'Nothing specified, nothing added.';
          }
          for (const file of args) {
            if (file === '.') {
              // Add all files
              const statusMatrix = await this.status();
              const untracked = statusMatrix.filter(([, head, workdir]: any[]) => head === 0 && workdir !== 0);
              for (const [filepath] of untracked) {
                await this.add(filepath);
              }
              return 'Added all files';
            }
            await this.add(file);
          }
          return `Added ${args.join(', ')}`;

        case 'commit':
          const messageIndex = args.indexOf('-m');
          if (messageIndex >= 0 && args[messageIndex + 1]) {
            const message = args.slice(messageIndex + 1).join(' ').replace(/^["']|["']$/g, '');
            const sha = await this.commit(message);
            return `[${await this.currentBranch()} ${sha.substring(0, 7)}] ${message}`;
          }
          return 'Error: commit message required (-m flag)';

        case 'branch':
          if (args.length === 0) {
            const branches = await this.listBranches();
            const current = await this.currentBranch();
            return branches.map(b => b === current ? `* ${b}` : `  ${b}`).join('\n');
          } else if (args[0] === '-d' && args[1]) {
            return `Deleted branch ${args[1]} (simulated)`;
          } else {
            await this.branch(args[0]);
            return `Created branch ${args[0]}`;
          }

        case 'checkout':
          if (args[0] === '-b' && args[1]) {
            await this.branch(args[1]);
            await this.checkout(args[1]);
            return `Switched to a new branch '${args[1]}'`;
          }
          await this.checkout(args[0]);
          return `Switched to branch '${args[0]}'`;

        case 'log':
          const logArgs = args[0];
          const commits = await this.log();
          if (logArgs === '--oneline') {
            return commits.map(c => `${c.oid.substring(0, 7)} ${c.message}`).join('\n');
          }
          return commits.map(c =>
            `commit ${c.oid}\nAuthor: ${c.author.name} <${c.author.email}>\n\n    ${c.message}\n`
          ).join('\n');

        case 'status':
          const status = await this.status();
          const staged = status.filter(([, head, _workdir, stage]: any[]) => stage !== head);
          const modified = status.filter(([, head, workdir]: any[]) => workdir !== head && workdir !== 0);
          const untracked = status.filter(([, head, workdir]: any[]) => head === 0 && workdir !== 0);

          let result = `On branch ${await this.currentBranch()}\n\n`;

          if (staged.length > 0) {
            result += 'Changes to be committed:\n';
            staged.forEach(([file]: any[]) => result += `\t${file}\n`);
            result += '\n';
          }

          if (modified.length > 0) {
            result += 'Changes not staged for commit:\n';
            modified.forEach(([file]: any[]) => result += `\t${file}\n`);
            result += '\n';
          }

          if (untracked.length > 0) {
            result += 'Untracked files:\n';
            untracked.forEach(([file]: any[]) => result += `\t${file}\n`);
          }

          return result || 'nothing to commit, working tree clean';

        // ============ STASH COMMANDS ============
        case 'stash':
          if (args.length === 0 || args[0] === 'push') {
            const messageIdx = args.indexOf('-m');
            const message = messageIdx >= 0 ? args[messageIdx + 1] : undefined;
            return await this.stashSave(message);
          } else if (args[0] === 'list') {
            const stashes = await this.stashList();
            if (stashes.length === 0) return '';
            return stashes.map((s, i) => `stash@{${i}}: ${s.message}`).join('\n');
          } else if (args[0] === 'apply') {
            const index = args[1] ? parseInt(args[1].replace(/stash@\{(\d+)\}/, '$1')) : 0;
            return await this.stashApply(index);
          } else if (args[0] === 'pop') {
            const index = args[1] ? parseInt(args[1].replace(/stash@\{(\d+)\}/, '$1')) : 0;
            return await this.stashPop(index);
          } else if (args[0] === 'drop') {
            const index = args[1] ? parseInt(args[1].replace(/stash@\{(\d+)\}/, '$1')) : 0;
            return await this.stashDrop(index);
          } else if (args[0] === 'clear') {
            return await this.stashClear();
          }
          return 'Unknown stash command';

        // ============ MERGE & ADVANCED COMMANDS ============
        case 'merge':
          if (args.length === 0) {
            return 'Error: branch name required';
          }
          return await this.merge(args[0]);

        case 'rebase':
          if (args.length === 0) {
            return 'Error: upstream branch required';
          }
          return await this.rebase(args[0]);

        case 'cherry-pick':
          if (args.length === 0) {
            return 'Error: commit hash required';
          }
          return await this.cherryPick(args[0]);

        case 'reset':
          const mode = args.includes('--hard') ? 'hard' :
                      args.includes('--soft') ? 'soft' : 'mixed';
          const ref = args.find(a => !a.startsWith('--')) || 'HEAD';
          return await this.reset(mode, ref);

        // ============ REMOTE COMMANDS ============
        case 'remote':
          if (args.length === 0 || args[0] === '-v') {
            const remotes = await this.listRemotes();
            if (remotes.length === 0) return '';
            return remotes.map(r => {
              const remote = this.remotes.get(r)!;
              return `${r}\t${remote.url} (fetch)\n${r}\t${remote.url} (push)`;
            }).join('\n');
          } else if (args[0] === 'add' && args[1] && args[2]) {
            await this.addRemote(args[1], args[2]);
            return '';
          }
          return 'Unknown remote command';

        case 'push':
          const pushRemote = args.includes('-u') ? args[args.indexOf('-u') + 1] : args[0] || 'origin';
          const pushBranch = args[args.length - 1] !== pushRemote ? args[args.length - 1] : undefined;
          return await this.push(pushRemote, pushBranch);

        case 'pull':
          return await this.pull(args[0], args[1]);

        case 'fetch':
          return await this.fetch(args[0]);

        // ============ GITHUB CLI SIMULATION ============
        case 'gh':
          if (args[0] === 'pr' && args[1] === 'create') {
            const titleIdx = args.indexOf('--title');
            const bodyIdx = args.indexOf('--body');
            const baseIdx = args.indexOf('--base');

            const title = titleIdx >= 0 ? args[titleIdx + 1]?.replace(/['"]/g, '') : 'New Pull Request';
            const body = bodyIdx >= 0 ? args[bodyIdx + 1]?.replace(/['"]/g, '') : '';
            const base = baseIdx >= 0 ? args[baseIdx + 1] : 'main';

            return await this.createPR(title, body, base);
          }
          return 'GitHub CLI command not recognized. Try: gh pr create --title "Title" --base main';

        // ============ UNIX COMMANDS ============
        case 'ls':
          return await this.ls(args[0]);

        case 'pwd':
          return await this.pwd();

        case 'cat':
          if (args.length === 0) {
            return 'cat: missing file operand';
          }
          return await this.cat(args[0]);

        case 'mkdir':
          if (args.length === 0) {
            return 'mkdir: missing operand';
          }
          return await this.mkdir(args[0]);

        case 'touch':
          if (args.length === 0) {
            return 'touch: missing file operand';
          }
          return await this.touch(args[0]);

        case 'rm':
          if (args.length === 0) {
            return 'rm: missing operand';
          }
          const recursive = args.includes('-rf') || args.includes('-r');
          const filename = args[args.length - 1];
          return await this.rm(filename, recursive);

        case 'echo':
          const echoText = args.join(' ');
          const redirectMatch = echoText.match(/(.*?)\s*>\s*(.+)/);
          if (redirectMatch) {
            const [, text, file] = redirectMatch;
            return await this.echo(text.replace(/['"]/g, ''), file.trim());
          }
          return args.join(' ');

        case 'help':
          return this.getHelpText();

        default:
          return `Command not found: ${gitCommand || 'undefined'}\nType 'help' for available commands.`;
      }
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  getHelpText(): string {
    return `
╔══════════════════════════════════════════════════════════════╗
║               GIT LEARNING TERMINAL - HELP                    ║
╠══════════════════════════════════════════════════════════════╣
║ BASIC GIT COMMANDS:                                          ║
║   git init                    Initialize a repository        ║
║   git status                  Show working tree status       ║
║   git add <file>              Add file to staging            ║
║   git add .                   Add all files                  ║
║   git commit -m "msg"         Create a commit                ║
║   git log                     Show commit history            ║
║   git log --oneline           Show compact log               ║
║                                                              ║
║ BRANCHING:                                                   ║
║   git branch                  List branches                  ║
║   git branch <name>           Create branch                  ║
║   git checkout <branch>       Switch branch                  ║
║   git checkout -b <branch>    Create and switch              ║
║   git merge <branch>          Merge branch                   ║
║                                                              ║
║ STASH COMMANDS:                                              ║
║   git stash                   Stash changes                  ║
║   git stash list              List stashes                   ║
║   git stash apply             Apply latest stash             ║
║   git stash pop               Apply and remove stash         ║
║   git stash drop              Delete stash                   ║
║                                                              ║
║ REMOTE & PR:                                                 ║
║   git remote                  List remotes                   ║
║   git push origin <branch>    Push to remote                 ║
║   git pull                    Pull from remote               ║
║   gh pr create --title "..."  Create pull request            ║
║                                                              ║
║ UNIX COMMANDS:                                               ║
║   ls                          List files                     ║
║   cat <file>                  Show file content             ║
║   echo "text" > file          Write to file                  ║
║   mkdir <dir>                 Create directory               ║
║   touch <file>                Create empty file              ║
║   rm <file>                   Remove file                    ║
║   pwd                         Print working directory        ║
║   clear                       Clear terminal                 ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();
  }

  getFS() {
    return this.fs;
  }

  getDir() {
    return this.dir;
  }
}

export default new GitService();

