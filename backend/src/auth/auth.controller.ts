import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registra una cuenta de cliente e inicia sesión' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto, @Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto, this.context(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTtlMs);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y entrega un token de acceso' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, this.context(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTtlMs);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rota el token de renovación en una cookie HttpOnly' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Req() request: Request & { cookies?: Record<string, string> }, @Res({ passthrough: true }) response: Response): Promise<AuthResponseDto> {
    const token = request.cookies?.nexo_refresh;
    if (!token) throw new UnauthorizedException('No existe un token de renovación.');
    const result = await this.authService.refresh(token, this.context(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTtlMs);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Revoca la sesión actual' })
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.authService.logout(user.sessionId);
    response.clearCookie('nexo_refresh', { path: '/api/auth' });
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Devuelve el perfil de la sesión activa' })
  @ApiOkResponse({ type: UserProfileDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.authService.profile(user.userId);
  }

  private context(request: Request): { userAgent?: string; ip?: string } {
    return { userAgent: request.get('user-agent') ?? undefined, ip: request.ip };
  }

  private setRefreshCookie(response: Response, refreshToken: string, maxAge: number): void {
    response.cookie('nexo_refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      maxAge,
      path: '/api/auth',
    });
  }
}
