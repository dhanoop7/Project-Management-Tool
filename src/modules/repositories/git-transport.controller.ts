import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { spawn } from 'node:child_process';

import { RepositoriesService } from './repositories.service';
import { GitAuthenticationService } from './git-authentication.service';

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

    if (
      repository.visibility === 'PRIVATE' &&
      !(await this.authenticateGitRequest(req, res))
    ) {
      return;
    }

    const serviceName = String(service);

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

    if (
      repository.visibility === 'PRIVATE' &&
      !(await this.authenticateGitRequest(req, res))
    ) {
      return;
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

    if (!(await this.authenticateGitRequest(req, res))) {
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

  private async authenticateGitRequest(
    req: Request,
    res: Response,
  ) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Basic ')) {
      this.sendGitUnauthorized(res);
      return false;
    }

    const encodedCredentials = authorization.slice('Basic '.length);

    let decodedCredentials: string;

    try {
      decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString(
        'utf8',
      );
    } catch {
      this.sendGitUnauthorized(res);
      return false;
    }

    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex === -1) {
      this.sendGitUnauthorized(res);
      return false;
    }

    const username = decodedCredentials.slice(0, separatorIndex);
    const token = decodedCredentials.slice(separatorIndex + 1);

    if (!username || !token) {
      this.sendGitUnauthorized(res);
      return false;
    }

    try {
      await this.gitAuthenticationService.authenticate(username, token);
      return true;
    } catch {
      this.sendGitUnauthorized(res);
      return false;
    }
  }

  private sendGitUnauthorized(res: Response) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="PhabNew Git"',
    );

    res.status(401).send('Git authentication required');
  }

  private pktLine(data: Buffer) {
    const length = data.length + 4;

    const header = length.toString(16).padStart(4, '0');

    return Buffer.concat([Buffer.from(header, 'ascii'), data]);
  }
}
