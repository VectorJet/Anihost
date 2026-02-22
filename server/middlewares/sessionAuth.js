import { AppError } from '../utils/errors.js';
import { touchSession, validateSession } from '../modules/auth/session.store.js';

export function requireActiveSession(options = {}) {
  const allowLegacyTokens = options.allowLegacyTokens ?? true;

  return async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload?.id) {
      throw new AppError('Unauthorized', 401);
    }

    if (!payload.sid) {
      if (!allowLegacyTokens) {
        throw new AppError('Session token missing. Please login again.', 401);
      }
      await next();
      return;
    }

    const sessionValidation = await validateSession(payload.sid, payload.id);
    if (!sessionValidation.valid) {
      throw new AppError('Session expired or revoked. Please login again.', 401, {
        reason: sessionValidation.reason,
      });
    }

    await touchSession(payload.sid);
    c.set('authSession', sessionValidation.session);

    await next();
  };
}
