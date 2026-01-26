import * as schema from './user.schema.js';
import * as handler from './user.handler.js';

export const updateWatchHistory = {
  schema: schema.updateWatchHistorySchema,
  handler: handler.updateWatchHistoryHandler,
};

export const getWatchHistory = {
  schema: schema.getWatchHistorySchema,
  handler: handler.getWatchHistoryHandler,
};

export const getRecommendations = {
  schema: schema.getRecommendationsSchema,
  handler: handler.getRecommendationsHandler,
};

export const heartbeat = {
  schema: schema.heartbeatSchema,
  handler: handler.heartbeatHandler,
};

export const getActiveUsers = {
  schema: schema.getActiveUsersSchema,
  handler: handler.getActiveUsersHandler,
};

export const userRoutes = [updateWatchHistory, getWatchHistory, getRecommendations, heartbeat, getActiveUsers];
