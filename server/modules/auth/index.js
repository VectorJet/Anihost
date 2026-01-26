import * as schema from './auth.schema.js';
import * as handler from './auth.handler.js';

export const register = {
  schema: schema.registerSchema,
  handler: handler.registerHandler,
};

export const login = {
  schema: schema.loginSchema,
  handler: handler.loginHandler,
};

export const me = {
  schema: schema.meSchema,
  handler: handler.meHandler,
};

export const authRoutes = [register, login, me];
