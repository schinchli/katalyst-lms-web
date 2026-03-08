/**
 * logger.ts — structured server-side logging for all API routes.
 * Outputs JSON lines compatible with Vercel Log Drains and any log aggregator.
 */

type Level = 'info' | 'warn' | 'error';

interface LogPayload {
  level:    Level;
  route:    string;
  message:  string;
  userId?:  string;
  ip?:      string;
  reason?:  string;
  [key: string]: unknown;
}

function emit(payload: LogPayload): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  if (payload.level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info:  (route: string, message: string, ctx?: Partial<LogPayload>) =>
    emit({ level: 'info',  route, message, ...ctx }),
  warn:  (route: string, message: string, ctx?: Partial<LogPayload>) =>
    emit({ level: 'warn',  route, message, ...ctx }),
  error: (route: string, message: string, ctx?: Partial<LogPayload>) =>
    emit({ level: 'error', route, message, ...ctx }),

  /** Log auth failures — always includes ip + reason. */
  authFail: (route: string, reason: string, ctx?: { ip?: string; userId?: string }) =>
    emit({ level: 'warn', route, message: 'auth_failure', reason, ...ctx }),

  /** Log rate-limit hits. */
  rateLimited: (route: string, ip: string) =>
    emit({ level: 'warn', route, message: 'rate_limited', ip }),
};
