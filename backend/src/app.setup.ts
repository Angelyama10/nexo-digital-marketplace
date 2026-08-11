import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import * as cookieParser from 'cookie-parser';

export function configureApplication(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const expressApplication = app.getHttpAdapter().getInstance() as { disable?: (name: string) => void };

  expressApplication.disable?.('x-powered-by');
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const suppliedRequestId = request.header('x-request-id');
    const requestId = suppliedRequestId && /^[A-Za-z0-9._-]{1,128}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();

    response.setHeader('X-Request-Id', requestId);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader('X-XSS-Protection', '0');
    if (request.path.startsWith('/api')) {
      response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      response.setHeader('Cache-Control', 'no-store');
    }
    next();
  });
  app.enableCors({ origin: configService.getOrThrow<string>('FRONTEND_URL'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
}
