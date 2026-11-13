import crypto from 'node:crypto';

const MIN_TOKEN_AGE_MS = 4 * 1000; // 4 seconds
const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export function hashIp(ip: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(ip, 'utf8').digest('hex');
}

export function signFormToken(secret: string, nowMs: number = Date.now()): string {
  const ts = String(nowMs);
  const sig = crypto.createHmac('sha256', secret).update(ts, 'utf8').digest('hex');
  return `${ts}.${sig}`;
}

export function verifyFormToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): { valid: boolean; reason?: 'bad_signature' | 'too_fast' | 'expired' } {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'bad_signature' };
  }
  const [tsStr, sig] = parts;
  if (!/^\d+$/.test(tsStr)) {
    return { valid: false, reason: 'bad_signature' };
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(tsStr, 'utf8').digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'bad_signature' };
  }

  const age = nowMs - Number(tsStr);
  if (age < MIN_TOKEN_AGE_MS) {
    return { valid: false, reason: 'too_fast' };
  }
  if (age > MAX_TOKEN_AGE_MS) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true };
}

export function countUrlsInText(text: string): number {
  const matches = text.match(/https?:\/\/|www\./gi);
  return matches ? matches.length : 0;
}
