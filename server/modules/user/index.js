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

export const userRoutes = [updateWatchHistory, getWatchHistory, getRecommendations];
