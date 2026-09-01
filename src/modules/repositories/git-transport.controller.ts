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

@Controller('git')
export class GitTransportController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
  ) {}

  @Get(':slug.git/info/refs')
  async infoRefs(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const service = req.query.service;

    if (service !== 'git-upload-pack') {
      res.status(400).send('Unsupported Git service');
      return;
    }

    const repository =
      await this.repositoriesService.getRepository(slug);

    const child = spawn(
      'git',
      [
        '--git-dir',
        repository.localPath,
        'upload-pack',
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
      console.error(
        `git-upload-pack advertisement: ${chunk.toString()}`,
      );
    });

    child.on('error', () => {
      if (!res.headersSent) {
        res.status(500).send('Git service failed');
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        if (!res.headersSent) {
          res.status(500).send('Git service failed');
        }
        return;
      }

      const body = Buffer.concat(chunks);

      const serviceLine = Buffer.from(
        `# service=${service}\n`,
        'utf8',
      );

      const servicePacket = this.pktLine(serviceLine);
      const flushPacket = Buffer.from('0000', 'ascii');

      res.status(200);
      res.setHeader(
        'Content-Type',
        'application/x-git-upload-pack-advertisement',
      );
      res.setHeader('Cache-Control', 'no-cache');

      res.end(
        Buffer.concat([
          servicePacket,
          flushPacket,
          body,
        ]),
      );
    });

    child.stdin.end();
  }

  @Post(':slug.git/git-upload-pack')
  async uploadPack(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const repository =
      await this.repositoriesService.getRepository(slug);

    res.status(200);
    res.setHeader(
      'Content-Type',
      'application/x-git-upload-pack-result',
    );
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
      console.error(
        `git-upload-pack: ${chunk.toString()}`,
      );
    });

    child.on('error', () => {
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(
          `git-upload-pack exited with code ${code}`,
        );
      }
    });
  }

  private pktLine(data: Buffer) {
    const length = data.length + 4;
    const header = length.toString(16).padStart(4, '0');

    return Buffer.concat([
      Buffer.from(header, 'ascii'),
      data,
    ]);
  }
}