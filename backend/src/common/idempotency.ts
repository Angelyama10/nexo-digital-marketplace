import { BadRequestException, ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;

export function parseIdempotencyKey(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(normalized)) {
    throw new BadRequestException('Idempotency-Key debe tener entre 16 y 128 caracteres seguros.');
  }
  return normalized;
}

export function idempotencyFingerprint(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function assertSameIdempotentRequest(storedFingerprint: string | null, receivedFingerprint: string): void {
  if (!storedFingerprint || storedFingerprint !== receivedFingerprint) {
    throw new ConflictException('La clave de idempotencia ya fue utilizada con una solicitud diferente.');
  }
}
