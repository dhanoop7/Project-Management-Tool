import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';

interface GitResult {
  stdout: string;
  stderr: string;
}

interface GitCommandError extends Error {
  stderr?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  subject: string;
}

export interface GitTreeEntry {
  mode: string;
  type: string;
  hash: string;
  name: string;
}

@Injectable()
export class GitService {
  private readonly repositoryRoot =
    process.env.REPOSITORY_STORAGE_PATH ??
    path.resolve(process.cwd(), '..', 'repos');

  getRepositoryPath(slug: string) {
    this.assertSafeSlug(slug);

    return path.join(this.repositoryRoot, `${slug}.git`);
  }

  async pathExists(targetPath: string) {
    try {
      await access(targetPath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async initBareRepository(repositoryPath: string) {
    await mkdir(this.repositoryRoot, {
      recursive: true,
    });

    await this.runGit([
      'init',
      '--bare',
      repositoryPath,
    ]);
  }

  async listBranches(repositoryPath: string) {
    const { stdout } = await this.runRepositoryGit(repositoryPath, [
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/heads',
    ]);

    return stdout
      .split('\n')
      .map((branch) => branch.trim())
      .filter(Boolean);
  }

  async listCommits(repositoryPath: string, ref = 'HEAD') {
    this.assertSafeRef(ref);

    try {
      const { stdout } = await this.runRepositoryGit(repositoryPath, [
        'log',
        '--max-count=50',
        '--pretty=format:%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s',
        ref,
      ]);

      return stdout
        .split('\n')
        .filter(Boolean)
        .map((line): GitCommit => {
          const [
            hash,
            shortHash,
            authorName,
            authorEmail,
            authoredAt,
            subject,
          ] = line.split('\x1f');

          return {
            hash,
            shortHash,
            authorName,
            authorEmail,
            authoredAt,
            subject,
          };
        });
    } catch (error) {
      if (this.isEmptyRepositoryError(error)) {
        return [];
      }

      throw error;
    }
  }

  async listTree(
    repositoryPath: string,
    ref = 'HEAD',
    repositoryFilePath = '',
  ) {
    this.assertSafeRef(ref);
    const safePath = this.normalizeRepositoryFilePath(repositoryFilePath);
    const treeish = safePath ? `${ref}:${safePath}` : ref;

    try {
      const { stdout } = await this.runRepositoryGit(repositoryPath, [
        'ls-tree',
        '-z',
        treeish,
      ]);

      return stdout
        .split('\0')
        .filter(Boolean)
        .map((entry): GitTreeEntry => {
          const match = /^(\d+)\s+(\w+)\s+([a-f0-9]+)\t(.+)$/.exec(entry);

          if (!match) {
            throw new InternalServerErrorException(
              'Unable to parse git tree entry',
            );
          }

          const [, mode, type, hash, name] = match;

          return {
            mode,
            type,
            hash,
            name,
          };
        });
    } catch (error) {
      if (this.isEmptyRepositoryError(error)) {
        return [];
      }

      throw error;
    }
  }

  async readBlob(
    repositoryPath: string,
    ref = 'HEAD',
    repositoryFilePath: string,
  ) {
    this.assertSafeRef(ref);
    const safePath = this.normalizeRepositoryFilePath(repositoryFilePath);

    if (!safePath) {
      throw new BadRequestException('File path is required');
    }

    try {
      const { stdout } = await this.runRepositoryGit(repositoryPath, [
        'show',
        `${ref}:${safePath}`,
      ]);

      return {
        path: safePath,
        content: stdout,
      };
    } catch (error) {
      if (this.isEmptyRepositoryError(error)) {
        throw new NotFoundException('File not found in repository');
      }

      throw error;
    }
  }

  private runRepositoryGit(repositoryPath: string, args: string[]) {
    return this.runGit([
      '--git-dir',
      repositoryPath,
      ...args,
    ]);
  }

  private runGit(args: string[]) {
    return new Promise<GitResult>((resolve, reject) => {
      execFile(
        'git',
        args,
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 5,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error) {
            const gitError = error as GitCommandError;
            gitError.stderr = stderr;
            reject(gitError);
            return;
          }

          resolve({
            stdout,
            stderr,
          });
        },
      );
    });
  }

  private assertSafeSlug(slug: string) {
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
      throw new BadRequestException('Invalid repository slug');
    }
  }

  private assertSafeRef(ref: string) {
    if (
      !/^[A-Za-z0-9._/-]+$/.test(ref) ||
      ref.startsWith('-') ||
      ref.includes('..') ||
      ref.includes('//') ||
      ref.includes('@{') ||
      ref.includes('\\')
    ) {
      throw new BadRequestException('Invalid git ref');
    }
  }

  private normalizeRepositoryFilePath(repositoryFilePath: string) {
    if (repositoryFilePath.includes('\\')) {
      throw new BadRequestException('Invalid repository file path');
    }

    const normalizedPath = path.posix.normalize(repositoryFilePath);

    if (
      normalizedPath === '.' ||
      normalizedPath === '/'
    ) {
      return '';
    }

    if (
      normalizedPath.startsWith('/') ||
      normalizedPath.startsWith('../') ||
      normalizedPath === '..'
    ) {
      throw new BadRequestException('Invalid repository file path');
    }

    return normalizedPath;
  }

  private isEmptyRepositoryError(error: unknown) {
    const stderr = (error as GitCommandError).stderr ?? '';

    return (
      stderr.includes('ambiguous argument') ||
      stderr.includes('Not a valid object name') ||
      stderr.includes('unknown revision') ||
      stderr.includes('does not exist in')
    );
  }
}
