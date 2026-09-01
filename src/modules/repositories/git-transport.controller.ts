import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { spawn } from 'node:child_process';

import { RepositoriesService } from './repositories.service';
import { GitAuthenticationService } from './git-authentication.service';

interface GitAuthenticatedUser {
  userId: number;
  username: string;
  role: 'ADMIN' | 'USER';
  tokenId: number;
}

@Controller('git')
export class GitTransportController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly gitAuthenticationService: GitAuthenticationService,
  ) {}

  @Get(':slug.git/info/refs')
  async infoRefs(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const service = req.query.service;

    if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
      res.status(400).send('Unsupported Git service');
      return;
    }

    const repository = await this.repositoriesService.getRepository(slug);
    const serviceName = String(service);

    const auth = await this.getGitAuthentication(req, res);

    if (repository.visibility === 'PRIVATE' && auth === null) {
      this.sendGitUnauthorized(res);
      return;
    }

    if (auth) {
      const hasAccess = await this.authorizeGitService(
        slug,
        serviceName,
        auth,
        res,
      );

      if (!hasAccess) {
        return;
      }
    }

    const gitCommand =
      serviceName === 'git-upload-pack' ? 'upload-pack' : 'receive-pack';

    const child = spawn(
      'git',
      [
        '--git-dir',
        repository.localPath,
        gitCommand,
        '--stateless-rpc',
        '--advertise-refs',
        repository.localPath,
      ],
      {
        windowsHide: true,
      },
    );

    const chunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      console.error(`${gitCommand} advertisement: ${chunk.toString()}`);
    });

    child.on('error', (error) => {
      console.error(`${gitCommand} advertisement failed:`, error);

      if (!res.headersSent) {
        res.status(500).send('Git service failed');
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`${gitCommand} advertisement exited with code ${code}`);

        if (!res.headersSent) {
          res.status(500).send('Git service failed');
        }

        return;
      }

      const body = Buffer.concat(chunks);

      const serviceLine = Buffer.from(`# service=${serviceName}\n`, 'utf8');

      const servicePacket = this.pktLine(serviceLine);
      const flushPacket = Buffer.from('0000', 'ascii');

      res.status(200);

      res.setHeader(
        'Content-Type',
        `application/x-${serviceName}-advertisement`,
      );

      res.setHeader('Cache-Control', 'no-cache');

      res.end(Buffer.concat([servicePacket, flushPacket, body]));
    });

    child.stdin.end();
  }

  @Post(':slug.git/git-upload-pack')
  async uploadPack(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const repository = await this.repositoriesService.getRepository(slug);

    const auth = await this.getGitAuthentication(req, res);

    if (repository.visibility === 'PRIVATE' && auth === null) {
      this.sendGitUnauthorized(res);
      return;
    }

    if (auth) {
      const hasAccess = await this.authorizeGitRead(slug, auth, res);

      if (!hasAccess) {
        return;
      }
    }

    res.status(200);

    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');

    res.setHeader('Cache-Control', 'no-cache');

    const child = spawn(
      'git',
      [
        '--git-dir',
        repository.localPath,
        'upload-pack',
        '--stateless-rpc',
        repository.localPath,
      ],
      {
        windowsHide: true,
      },
    );

    req.pipe(child.stdin);
    child.stdout.pipe(res);

    child.stderr.on('data', (chunk: Buffer) => {
      console.error(`git-upload-pack: ${chunk.toString()}`);
    });

    child.on('error', (error) => {
      console.error('git-upload-pack failed:', error);

      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`git-upload-pack exited with code ${code}`);
      }
    });
  }

  @Post(':slug.git/git-receive-pack')
  async receivePack(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const repository = await this.repositoriesService.getRepository(slug);

    const auth = await this.getGitAuthentication(req, res);

    if (auth === null) {
      this.sendGitUnauthorized(res);
      return;
    }

    const hasAccess = await this.authorizeGitWrite(slug, auth, res);

    if (!hasAccess) {
      return;
    }

    await this.repositoriesService.enableHttpPush(slug);

    res.status(200);

    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');

    res.setHeader('Cache-Control', 'no-cache');

    const child = spawn(
      'git',
      [
        '--git-dir',
        repository.localPath,
        'receive-pack',
        '--stateless-rpc',
        repository.localPath,
      ],
      {
        windowsHide: true,
      },
    );

    req.pipe(child.stdin);
    child.stdout.pipe(res);

    child.stderr.on('data', (chunk: Buffer) => {
      console.error(`git-receive-pack: ${chunk.toString()}`);
    });

    child.on('error', (error) => {
      console.error('git-receive-pack failed:', error);

      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`git-receive-pack exited with code ${code}`);
      }
    });
  }

  private async authenticateGitRequest(req: Request) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Basic ')) {
      return null;
    }

    const encodedCredentials = authorization.slice('Basic '.length);

    let decodedCredentials: string;

    try {
      decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString(
        'utf8',
      );
    } catch {
      throw new UnauthorizedException('Invalid Git credentials');
    }

    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex === -1) {
      throw new UnauthorizedException('Invalid Git credentials');
    }

    const username = decodedCredentials.slice(0, separatorIndex);
    const token = decodedCredentials.slice(separatorIndex + 1);

    if (!username || !token) {
      throw new UnauthorizedException('Invalid Git credentials');
    }

    return this.gitAuthenticationService.authenticate(username, token);
  }

  private async getGitAuthentication(
    req: Request,
    res: Response,
  ) {
    try {
      return await this.authenticateGitRequest(req);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.sendGitUnauthorized(res);
        return null;
      }

      throw error;
    }
  }

  private async authorizeGitService(
    slug: string,
    serviceName: string,
    auth: GitAuthenticatedUser,
    res: Response,
  ) {
    if (serviceName === 'git-receive-pack') {
      return this.authorizeGitWrite(slug, auth, res);
    }

    return this.authorizeGitRead(slug, auth, res);
  }

  private async authorizeGitRead(
    slug: string,
    auth: GitAuthenticatedUser,
    res: Response,
  ) {
    try {
      await this.repositoriesService.assertCanReadRepository(
        slug,
        auth.userId,
        auth.role,
      );

      return true;
    } catch (error) {
      return this.handleAuthorizationError(error, res);
    }
  }

  private async authorizeGitWrite(
    slug: string,
    auth: GitAuthenticatedUser,
    res: Response,
  ) {
    try {
      await this.repositoriesService.assertCanWriteRepository(
        slug,
        auth.userId,
        auth.role,
      );

      return true;
    } catch (error) {
      return this.handleAuthorizationError(error, res);
    }
  }

  private handleAuthorizationError(
    error: unknown,
    res: Response,
  ) {
    if (error instanceof ForbiddenException) {
      this.sendGitForbidden(res);
      return false;
    }

    if (error instanceof UnauthorizedException) {
      this.sendGitUnauthorized(res);
      return false;
    }

    throw error;
  }

  private sendGitUnauthorized(res: Response) {
    res.setHeader('WWW-Authenticate', 'Basic realm="PhabNew Git"');

    res.status(401).send('Git authentication required');
  }

  private sendGitForbidden(res: Response) {
    res.status(403).send('Git repository permission denied');
  }

  private pktLine(data: Buffer) {
    const length = data.length + 4;

    const header = length.toString(16).padStart(4, '0');

    return Buffer.concat([Buffer.from(header, 'ascii'), data]);
  }
}
