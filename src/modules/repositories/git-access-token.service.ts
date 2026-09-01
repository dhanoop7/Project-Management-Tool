import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GitAccessTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: number, name: string) {
    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const token =
      await this.prisma.client.orm.public.GitAccessToken.create({
        userId,
        name,
        tokenHash,
        createdAt: Temporal.Now.instant(),
        expiresAt: null,
        revokedAt: null,
      });

    return {
      id: token.id,
      name: token.name,
      token: rawToken,
      createdAt: token.createdAt,
    };
  }

  async findValidToken(rawToken: string) {
    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const token =
      await this.prisma.client.orm.public.GitAccessToken.where({
        tokenHash,
      }).first();

    if (!token || token.revokedAt) {
      return null;
    }

    if (
      token.expiresAt &&
      Temporal.Instant.compare(
        token.expiresAt,
        Temporal.Now.instant(),
      ) <= 0
    ) {
      return null;
    }

    return token;
  }

  async revokeToken(userId: number, tokenId: number) {
    const token =
      await this.prisma.client.orm.public.GitAccessToken.where({
        id: tokenId,
        userId,
      }).first();

    if (!token) {
      throw new NotFoundException('Git access token not found');
    }

    return this.prisma.client.orm.public.GitAccessToken.where({
      id: tokenId,
    }).update({
      revokedAt: Temporal.Now.instant(),
    });
  }
}