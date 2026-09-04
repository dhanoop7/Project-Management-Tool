import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { Temporal } from 'temporal-polyfill';

import { PrismaService } from '../../prisma/prisma.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type AuthUserRow = Awaited<
  ReturnType<PrismaService['client']['orm']['public']['User']['first']>
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUsername = await this.prisma.client.orm.public.User.where({
      username: registerDto.username,
    }).first();

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.prisma.client.orm.public.User.where({
      email: registerDto.email,
    }).first();

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const now = Temporal.Now.instant();

    const user = await this.prisma.client.orm.public.User.create({
      username: registerDto.username,
      email: registerDto.email,
      displayName: registerDto.displayName,
      avatarUrl: null,
      role: 'USER',
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return this.toPublicUser(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.client.orm.public.User.where({
      email: loginDto.email,
    }).first();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async getUsers() {
    const users = await this.prisma.client.orm.public.User.all();
    return users.map((user) => this.toPublicUser(user));
  }

  private toPublicUser(user: NonNullable<AuthUserRow>) {
    const { passwordHash, ...publicUser } = user;
    void passwordHash;

    return publicUser;
  }
}
