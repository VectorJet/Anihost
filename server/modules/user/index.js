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

export const updateAvatar = {
  schema: schema.updateAvatarSchema,
  handler: handler.updateAvatarHandler,
};

export const updateProfileStatus = {
  schema: schema.updateProfileStatusSchema,
  handler: handler.updateProfileStatusHandler,
};

export const getUserStats = {
  schema: schema.getUserStatsSchema,
  handler: handler.getUserStatsHandler,
};

export const checkContentAccess = {
  schema: schema.checkContentAccessSchema,
  handler: handler.checkContentAccess,
};

export const getProfileStats = {
  schema: schema.getProfileStatsSchema,
  handler: handler.getProfileStatsHandler,
};

export const getProfileByUsername = {
  schema: schema.getProfileByUsernameSchema,
  handler: handler.getProfileByUsernameHandler,
};

export const getPinnedFavorites = {
  schema: schema.getPinnedFavoritesSchema,
  handler: handler.getPinnedFavoritesHandler,
};

export const pinFavorite = {
  schema: schema.pinFavoriteSchema,
  handler: handler.pinFavoriteHandler,
};

export const unpinFavorite = {
  schema: schema.unpinFavoriteSchema,
  handler: handler.unpinFavoriteHandler,
};

export const getAllUsers = {
  schema: schema.getAllUsersSchema,
  handler: handler.getAllUsersHandler,
};

export const updateUserParentalControls = {
  schema: schema.updateUserParentalControlsSchema,
  handler: handler.updateUserParentalControlsHandler,
};

export const getAdminUserById = {
  schema: schema.getAdminUserByIdSchema,
  handler: handler.getAdminUserByIdHandler,
};

export const updateAdminUserSettings = {
  schema: schema.updateAdminUserSettingsSchema,
  handler: handler.updateAdminUserSettingsHandler,
};

export const deleteUser = {
  schema: schema.deleteUserSchema,
  handler: handler.deleteUserHandler,
};

export const deleteAllUsers = {
  schema: schema.deleteAllUsersSchema,
  handler: handler.deleteAllUsersHandler,
};

export const getMediaSources = {
  schema: schema.getMediaSourcesSchema,
  handler: handler.getMediaSourcesHandler,
};

export const createMediaSource = {
  schema: schema.createMediaSourceSchema,
  handler: handler.createMediaSourceHandler,
};

export const deleteMediaSource = {
  schema: schema.deleteMediaSourceSchema,
  handler: handler.deleteMediaSourceHandler,
};

export const getServerHealth = {
  schema: schema.getServerHealthSchema,
  handler: handler.getServerHealthHandler,
};

export const userRoutes = [
  updateWatchHistory, 
  getWatchHistory, 
  getRecommendations, 
  heartbeat, 
  getActiveUsers,
  getUserSettings,
  updateUserSettings,
  updateAvatar,
  updateProfileStatus,
  getUserStats,
  checkContentAccess,
  getProfileStats,
  getProfileByUsername,
  getPinnedFavorites,
  pinFavorite,
  unpinFavorite,
  getAllUsers,
  updateUserParentalControls,
  getAdminUserById,
  updateAdminUserSettings,
  deleteUser,
  deleteAllUsers,
  getMediaSources,
  createMediaSource,
  deleteMediaSource,
  getServerHealth,
];
