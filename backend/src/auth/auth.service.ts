import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

interface SessionContext { userAgent?: string; ip?: string; }
interface TokenBundle extends AuthResponseDto { refreshToken: string; refreshTtlMs: number; }

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: SessionContext): Promise<TokenBundle> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.usuario.findFirst({
      where: { OR: [{ email }, { emailNormalizado: email }] },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.usuario.create({
      data: { nombre: dto.nombre.trim(), apellido: dto.apellido?.trim(), email, emailNormalizado: email, passwordHash },
    });
    return this.createSession(user, context);
  }

  async login(dto: LoginDto, context: SessionContext): Promise<TokenBundle> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.usuario.findUnique({ where: { emailNormalizado: email } });
    const isValid = user?.activo ? await this.isPasswordValid(user.passwordHash, dto.password) : false;
    if (!isValid || !user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    await this.prisma.usuario.update({ where: { id: user.id }, data: { ultimoAccesoEn: new Date() } });
    return this.createSession(user, context);
  }

  async refresh(refreshToken: string, context: SessionContext): Promise<TokenBundle> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.sesion.findUnique({ where: { id: payload.sid }, include: { usuario: true } });
    if (!session || session.revocadoEn || session.expiraEn <= new Date() || !session.usuario.activo) {
      throw new UnauthorizedException('La sesión ya no está disponible.');
    }
    if (!await argon2.verify(session.refreshTokenHash, refreshToken)) {
      throw new UnauthorizedException('La sesión no es válida.');
    }

    await this.prisma.sesion.update({ where: { id: session.id }, data: { revocadoEn: new Date() } });
    return this.createSession(session.usuario, context);
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.sesion.updateMany({ where: { id: sessionId, revocadoEn: null }, data: { revocadoEn: new Date() } });
  }

  async profile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.usuario.findUniqueOrThrow({ where: { id: userId } });
    return this.toProfile(user);
  }

  private async createSession(user: Usuario, context: SessionContext): Promise<TokenBundle> {
    const refreshTtlMs = this.getTtlMs('JWT_REFRESH_TTL', 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    const session = await this.prisma.sesion.create({
      data: { usuarioId: user.id, refreshTokenHash: 'PENDIENTE', expiraEn: expiresAt, userAgent: context.userAgent, ip: context.ip },
    });
    const payload = { sub: user.id, email: user.email, role: user.rol, sid: session.id };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.getTtlSeconds('JWT_ACCESS_TTL', 15 * 60),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: Math.floor(refreshTtlMs / 1000),
    });
    await this.prisma.sesion.update({ where: { id: session.id }, data: { refreshTokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }) } });

    return { accessToken, user: this.toProfile(user), refreshToken, refreshTtlMs };
  }

  private async verifyRefreshToken(token: string): Promise<{ sid: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sid: string }>(token, { secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('El token de renovación es inválido o venció.');
    }
  }

  private async isPasswordValid(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private getTtlSeconds(key: string, fallback: number): number { return Math.floor(this.getTtlMs(key, fallback * 1000) / 1000); }

  private getTtlMs(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    if (!value) return fallback;
    const match = value.match(/^(\d+)([mhd])$/);
    if (!match) return fallback;
    const amount = Number(match[1]);
    return amount * ({ m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 'm' | 'h' | 'd']);
  }

  private toProfile(user: Usuario): UserProfileDto {
    return { id: user.id, name: user.nombre, lastName: user.apellido, email: user.email, role: user.rol };
  }
}
