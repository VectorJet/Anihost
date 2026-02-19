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

export const getUserSettings = {
  schema: schema.getUserSettingsSchema,
  handler: handler.getUserSettingsHandler,
};

export const updateUserSettings = {
  schema: schema.updateUserSettingsSchema,
  handler: handler.updateUserSettingsHandler,
};

export const getUserStats = {
  schema: schema.getUserStatsSchema,
  handler: handler.getUserStatsHandler,
};

export const checkContentAccess = {
  schema: schema.checkContentAccessSchema,
  handler: handler.checkContentAccess,
};

export const getAllUsers = {
  schema: schema.getAllUsersSchema,
  handler: handler.getAllUsersHandler,
};

export const updateUserParentalControls = {
  schema: schema.updateUserParentalControlsSchema,
  handler: handler.updateUserParentalControlsHandler,
};

export const userRoutes = [
  updateWatchHistory, 
  getWatchHistory, 
  getRecommendations, 
  heartbeat, 
  getActiveUsers,
  getUserSettings,
  updateUserSettings,
  getUserStats,
  checkContentAccess,
  getAllUsers,
  updateUserParentalControls,
];
