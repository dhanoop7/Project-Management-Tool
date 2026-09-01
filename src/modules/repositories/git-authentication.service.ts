import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { Temporal } from 'temporal-polyfill';

@Injectable()
export class GitAuthenticationService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(username: string, rawToken: string) {
    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const token =
      await this.prisma.client.orm.public.GitAccessToken.where({
        tokenHash,
      }).first();

    if (!token || token.revokedAt) {
      throw new UnauthorizedException(
        'Invalid Git credentials',
      );
    }

    if (
      token.expiresAt &&
      Temporal.Instant.compare(
        token.expiresAt,
        Temporal.Now.instant(),
      ) <= 0
    ) {
      throw new UnauthorizedException(
        'Git access token has expired',
      );
    }

    const user =
      await this.prisma.client.orm.public.User.where({
        id: token.userId,
      }).first();

    if (!user || user.username !== username) {
      throw new UnauthorizedException(
        'Invalid Git credentials',
      );
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      tokenId: token.id,
    };
  }
}