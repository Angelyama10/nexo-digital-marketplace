import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

type AttemptWindow = {
  failures: number;
  startedAt: number;
  blockedUntil: number | null;
  lastSeenAt: number;
};

@Injectable()
export class AuthRateLimiterService {
  private readonly attempts = new Map<string, AttemptWindow>();
  private readonly windowMs = 15 * 60_000;
  private readonly blockMs = 15 * 60_000;
  private readonly maximumFailures = 5;
  private operations = 0;

  assertLoginAllowed(email: string, ip?: string): void {
    const entry = this.attempts.get(this.key(email, ip));
    const now = Date.now();
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      throw new HttpException('Demasiados intentos. Espera antes de volver a iniciar sesión.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordLoginFailure(email: string, ip?: string): void {
    const key = this.key(email, ip);
    const now = Date.now();
    const current = this.attempts.get(key);
    const entry = !current || now - current.startedAt >= this.windowMs
      ? { failures: 0, startedAt: now, blockedUntil: null, lastSeenAt: now }
      : current;
    entry.failures += 1;
    entry.lastSeenAt = now;
    if (entry.failures >= this.maximumFailures) entry.blockedUntil = now + this.blockMs;
    this.attempts.set(key, entry);
    this.pruneIfNeeded(now);
  }

  clearLoginFailures(email: string, ip?: string): void {
    this.attempts.delete(this.key(email, ip));
  }

  private key(email: string, ip?: string): string {
    return createHash('sha256').update(`${email.toLowerCase()}|${ip ?? 'unknown'}`).digest('hex');
  }

  private pruneIfNeeded(now: number): void {
    this.operations += 1;
    if (this.operations % 100 !== 0 && this.attempts.size < 10_000) return;
    for (const [key, entry] of this.attempts) {
      const retentionEnd = Math.max(entry.startedAt + this.windowMs, entry.blockedUntil ?? 0);
      if (retentionEnd <= now) this.attempts.delete(key);
    }
  }
}
