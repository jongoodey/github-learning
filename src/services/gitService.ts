import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
import type { GitCommit, GitRef, FileTreeNode } from '../types';

class GitService {
  private fs: FS;
  private dir: string;
  private pfs: any;

  constructor() {
    this.fs = new FS('git-learning-game');
    this.dir = '/repo';
    this.pfs = this.fs.promises;
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

  async reset(): Promise<void> {
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

  async executeCommand(command: string): Promise<string> {
    const parts = command.trim().split(/\s+/);
    const gitCommand = parts[0] === 'git' ? parts[1] : parts[0];
    const args = parts[0] === 'git' ? parts.slice(2) : parts.slice(1);

    console.log('Executing:', gitCommand, args);

    try {
      switch (gitCommand) {
        case 'init':
          await this.init();
          return 'Initialized empty Git repository';
          
        case 'add':
          for (const file of args) {
            await this.add(file);
          }
          return `Added ${args.join(', ')}`;
          
        case 'commit':
          const messageIndex = args.indexOf('-m');
          if (messageIndex >= 0 && args[messageIndex + 1]) {
            const message = args[messageIndex + 1].replace(/['"]/g, '');
            const sha = await this.commit(message);
            return `[${await this.currentBranch()} ${sha.substring(0, 7)}] ${message}`;
          }
          return 'Error: commit message required';
          
        case 'branch':
          if (args.length === 0) {
            const branches = await this.listBranches();
            const current = await this.currentBranch();
            return branches.map(b => b === current ? `* ${b}` : `  ${b}`).join('\n');
          } else {
            await this.branch(args[0]);
            return `Created branch ${args[0]}`;
          }
          
        case 'checkout':
          await this.checkout(args[0]);
          return `Switched to branch '${args[0]}'`;
          
        case 'log':
          const commits = await this.log();
          return commits.map(c => 
            `commit ${c.oid}\nAuthor: ${c.author.name} <${c.author.email}>\n\n    ${c.message}\n`
          ).join('\n');
          
        case 'status':
          const status = await this.status();
          const staged = status.filter(([, head, workdir, stage]) => stage !== head);
          const modified = status.filter(([, head, workdir]) => workdir !== head && workdir !== 0);
          const untracked = status.filter(([, head, workdir]) => head === 0 && workdir !== 0);
          
          let result = `On branch ${await this.currentBranch()}\n\n`;
          
          if (staged.length > 0) {
            result += 'Changes to be committed:\n';
            staged.forEach(([file]) => result += `\t${file}\n`);
            result += '\n';
          }
          
          if (modified.length > 0) {
            result += 'Changes not staged for commit:\n';
            modified.forEach(([file]) => result += `\t${file}\n`);
            result += '\n';
          }
          
          if (untracked.length > 0) {
            result += 'Untracked files:\n';
            untracked.forEach(([file]) => result += `\t${file}\n`);
          }
          
          return result || 'nothing to commit, working tree clean';
          
        default:
          return `Unknown command: ${gitCommand}`;
      }
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  getFS() {
    return this.fs;
  }

  getDir() {
    return this.dir;
  }
}

export default new GitService();

