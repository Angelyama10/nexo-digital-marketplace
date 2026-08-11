import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { RolUsuario } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

interface JwtPayload {
  sub: string;
  email: string;
  role: RolUsuario;
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const session = await this.prisma.sesion.findFirst({
      where: {
        id: payload.sid,
        usuarioId: payload.sub,
        revocadoEn: null,
        expiraEn: { gt: new Date() },
        usuario: { activo: true },
      },
      include: { usuario: true },
    });
    if (!session) throw new UnauthorizedException('Sesión inválida o vencida.');
    return {
      userId: session.usuario.id,
      email: session.usuario.email,
      role: session.usuario.rol,
      sessionId: session.id,
    };
  }
}
