import { createRoute, z } from '@hono/zod-openapi';

const WatchHistorySchema = z.object({
  animeId: z.string(),
  animeName: z.string(),
  animePoster: z.string(),
  episodeId: z.string(),
  episodeNumber: z.number(),
  episodeImage: z.string().optional(),
  progress: z.number(),
  duration: z.number(),
  lastWatchedAt: z.date(),
});

export const updateWatchHistorySchema = createRoute({
  method: 'post',
  path: '/user/watch-history',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            animeId: z.string(),
            animeName: z.string().optional(),
            animePoster: z.string().optional(),
            episodeId: z.string(),
            episodeNumber: z.number(),
            episodeImage: z.string().optional(),
            progress: z.number(),
            duration: z.number(),
            explicitRating: z.number().min(1).max(10).optional(),
            genres: z.array(z.string()).optional(), // To update interests
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
      description: 'Watch history updated',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update user watch history and interests',
});

export const getWatchHistorySchema = createRoute({
  method: 'get',
  path: '/user/watch-history',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(WatchHistorySchema),
          }),
        },
      },
      description: 'User watch history retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user watch history',
});

export const getRecommendationsSchema = createRoute({
  method: 'get',
  path: '/user/recommendations',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.any()), // BasicAnimeSchema would be better if imported
          }),
        },
      },
      description: 'Personalized recommendations retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get personalized anime recommendations',
});

export const heartbeatSchema = createRoute({
  method: 'post',
  path: '/user/heartbeat',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
      description: 'Heartbeat recorded',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Record user activity',
});

export const getActiveUsersSchema = createRoute({
  method: 'get',
  path: '/user/active',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.object({
              id: z.string(),
              username: z.string(),
              lastActiveAt: z.date().nullable(),
            })),
          }),
        },
      },
      description: 'Active users retrieved',
    },
  },
  description: 'Get list of active users (active in last 5 minutes)',
});

export const getUserSettingsSchema = createRoute({
  method: 'get',
  path: '/user/settings',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              userId: z.string(),
              safeMode: z.boolean(),
              ageRestriction: z.boolean(),
              explicitContent: z.boolean(),
              autoSkipIntro: z.boolean(),
              notifications: z.boolean(),
              autoPlay: z.boolean(),
              watchHistory: z.boolean(),
              qualityPreference: z.string(),
              downloadQuality: z.string(),
              language: z.string(),
              theme: z.string(),
              defaultVolume: z.number(),
              updatedAt: z.date(),
            }),
          }),
        },
      },
      description: 'User settings retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user settings',
});

export const updateUserSettingsSchema = createRoute({
  method: 'put',
  path: '/user/settings',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            safeMode: z.boolean().optional(),
            ageRestriction: z.boolean().optional(),
            explicitContent: z.boolean().optional(),
            autoSkipIntro: z.boolean().optional(),
            notifications: z.boolean().optional(),
            autoPlay: z.boolean().optional(),
            watchHistory: z.boolean().optional(),
            qualityPreference: z.string().optional(),
            downloadQuality: z.string().optional(),
            language: z.string().optional(),
            theme: z.string().optional(),
            defaultVolume: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
      description: 'Settings updated successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update user settings',
});

export const updateAvatarSchema = createRoute({
  method: 'put',
  path: '/user/avatar',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            avatarUrl: z.string().url(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              avatarUrl: z.string(),
            }),
          }),
        },
      },
      description: 'Avatar updated successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update current user avatar',
});

export const updateProfileStatusSchema = createRoute({
  method: 'put',
  path: '/user/profile-status',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            statusMessage: z.string().max(120),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              statusMessage: z.string(),
            }),
          }),
        },
      },
      description: 'Status message updated successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Update current user profile status message',
});

export const getUserStatsSchema = createRoute({
  method: 'get',
  path: '/user/stats',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              currentActive: z.number(),
              peakToday: z.number(),
              avgSessionMinutes: z.number(),
            }),
          }),
        },
      },
      description: 'User statistics retrieved',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get user statistics for admin panel',
});

export const checkContentAccessSchema = createRoute({
  method: 'post',
  path: '/user/check-access',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            animeId: z.string(),
            title: z.string(),
            genres: z.array(z.string()).optional(),
            rating: z.string().optional(),
            is18Plus: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              allowed: z.boolean(),
              reason: z.string().optional(),
            }),
          }),
        },
      },
      description: 'Content access check result',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Check if user can access specific content based on parental controls',
});

export const getProfileStatsSchema = createRoute({
  method: 'get',
  path: '/user/profile-stats',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              hoursWatched: z.number(),
              completionRate: z.number(),
              favoriteGenres: z.array(z.string()),
              titlesWatched: z.number(),
              currentlyWatching: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  poster: z.string(),
                  episodeId: z.string(),
                  episodeNumber: z.number(),
                  progress: z.number(),
                  duration: z.number(),
                  lastWatchedAt: z.date(),
                })
              ),
            }),
          }),
        },
      },
      description: 'Profile stats and currently watching list',
    },
    401: {
      description: 'Unauthorized',
    },
  },
  description: 'Get MAL-style profile stats for authenticated user',
});

export const getProfileByUsernameSchema = createRoute({
  method: 'get',
  path: '/user/profile/:username',
  request: {
    params: z.object({
      username: z.string().min(1),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              profile: z.object({
                id: z.string(),
                username: z.string(),
                email: z.string(),
                avatarUrl: z.string(),
                statusMessage: z.string(),
                createdAt: z.date(),
              }),
              isOwnProfile: z.boolean(),
              stats: z.object({
                hoursWatched: z.number(),
                completionRate: z.number(),
                favoriteGenres: z.array(z.string()),
                titlesWatched: z.number(),
                currentlyWatching: z.array(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    poster: z.string(),
                    episodeId: z.string(),
                    episodeNumber: z.number(),
                    progress: z.number(),
                    duration: z.number(),
                    lastWatchedAt: z.date(),
                  })
                ),
              }),
              pinnedFavorites: z.array(
                z.object({
                  userId: z.string(),
                  animeId: z.string(),
                  animeName: z.string(),
                  animePoster: z.string(),
                  animeType: z.string(),
                  pinnedAt: z.date(),
                })
              ),
              recentActivity: z.array(
                z.object({
                  animeId: z.string(),
                  animeName: z.string(),
                  animePoster: z.string(),
                  episodeId: z.string(),
                  episodeNumber: z.number(),
                  progress: z.number(),
                  duration: z.number(),
                  lastWatchedAt: z.date(),
                })
              ),
            }),
          }),
        },
      },
      description: 'Profile data by username',
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Profile not found' },
  },
  description: 'Get profile by username for public-style profile viewing',
});

export const getPinnedFavoritesSchema = createRoute({
  method: 'get',
  path: '/user/pinned-favorites',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(
              z.object({
                userId: z.string(),
                animeId: z.string(),
                animeName: z.string(),
                animePoster: z.string(),
                animeType: z.string(),
                pinnedAt: z.date(),
              })
            ),
          }),
        },
      },
      description: 'Pinned favorites list',
    },
    401: { description: 'Unauthorized' },
  },
  description: 'Get top pinned favorite anime for profile showcase',
});

export const pinFavoriteSchema = createRoute({
  method: 'post',
  path: '/user/pinned-favorites',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            animeId: z.string(),
            animeName: z.string(),
            animePoster: z.string().optional(),
            animeType: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'Anime pinned',
    },
    400: { description: 'Validation or pin limit reached' },
    401: { description: 'Unauthorized' },
  },
  description: 'Pin anime to profile favorites (max 5)',
});

export const unpinFavoriteSchema = createRoute({
  method: 'delete',
  path: '/user/pinned-favorites/:animeId',
  request: {
    params: z.object({
      animeId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'Favorite removed',
    },
    401: { description: 'Unauthorized' },
  },
  description: 'Remove anime from pinned favorites',
});

// Admin-only schemas

const UserSettingsSchema = z.object({
  userId: z.string(),
  safeMode: z.boolean(),
  ageRestriction: z.boolean(),
  explicitContent: z.boolean(),
  autoSkipIntro: z.boolean().optional(),
  notifications: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  watchHistory: z.boolean().optional(),
  qualityPreference: z.string().optional(),
  downloadQuality: z.string().optional(),
  language: z.string().optional(),
  theme: z.string().optional(),
  defaultVolume: z.number().optional(),
});

const AdminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.date(),
  lastActiveAt: z.date().nullable(),
  settings: UserSettingsSchema,
});

const MediaSourceSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  type: z.enum(['embedded', 'fallback']),
  streamBaseUrl: z.string().nullable(),
  domain: z.string().nullable(),
  refererUrl: z.string().nullable(),
  priority: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getAllUsersSchema = createRoute({
  method: 'get',
  path: '/user/admin/users',
  request: {
    query: z.object({
      sortBy: z.enum(['createdAt', 'lastActiveAt', 'username', 'email', 'role']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(AdminUserSchema),
          }),
        },
      },
      description: 'List of all users with their settings',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden - Admin access required',
    },
  },
  description: 'Get all users (admin only)',
});

export const updateUserParentalControlsSchema = createRoute({
  method: 'put',
  path: '/user/admin/users/:userId/parental-controls',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            safeMode: z.boolean(),
            ageRestriction: z.boolean(),
            explicitContent: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'Parental controls updated',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden - Admin access required',
    },
    404: {
      description: 'User not found',
    },
  },
  description: 'Update parental controls for a specific user (admin only)',
});

export const getAdminUserByIdSchema = createRoute({
  method: 'get',
  path: '/user/admin/users/:userId',
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: AdminUserSchema,
          }),
        },
      },
      description: 'User with settings',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'User not found' },
  },
  description: 'Get single user for admin settings screen',
});

export const updateAdminUserSettingsSchema = createRoute({
  method: 'put',
  path: '/user/admin/users/:userId/settings',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            safeMode: z.boolean().optional(),
            ageRestriction: z.boolean().optional(),
            explicitContent: z.boolean().optional(),
            autoSkipIntro: z.boolean().optional(),
            notifications: z.boolean().optional(),
            autoPlay: z.boolean().optional(),
            watchHistory: z.boolean().optional(),
            qualityPreference: z.string().optional(),
            downloadQuality: z.string().optional(),
            language: z.string().optional(),
            theme: z.string().optional(),
            defaultVolume: z.number().min(0).max(100).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'User settings updated',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'User not found' },
  },
  description: 'Update user settings from admin screen',
});

export const deleteUserSchema = createRoute({
  method: 'delete',
  path: '/user/admin/users/:userId',
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'User deleted',
    },
    400: { description: 'Invalid delete request' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'User not found' },
  },
  description: 'Delete a user (admin only)',
});

export const deleteAllUsersSchema = createRoute({
  method: 'post',
  path: '/user/admin/users/delete-all',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            includeAdmins: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            deletedCount: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Bulk deletion completed',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
  description: 'Delete all users except yourself; optional includeAdmins flag',
});

export const getMediaSourcesSchema = createRoute({
  method: 'get',
  path: '/user/admin/media-sources',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(MediaSourceSchema),
          }),
        },
      },
      description: 'Media sources list',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
  description: 'Get media source configuration',
});

export const createMediaSourceSchema = createRoute({
  method: 'post',
  path: '/user/admin/media-sources',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            key: z.string().min(1),
            name: z.string().min(1),
            type: z.enum(['embedded', 'fallback']),
            streamBaseUrl: z.string().url().optional(),
            domain: z.string().optional(),
            refererUrl: z.string().url().optional(),
            priority: z.number().optional(),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: MediaSourceSchema,
          }),
        },
      },
      description: 'Media source created',
    },
    400: { description: 'Validation or duplicate error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
  description: 'Add a media source',
});

export const deleteMediaSourceSchema = createRoute({
  method: 'delete',
  path: '/user/admin/media-sources/:sourceId',
  request: {
    params: z.object({
      sourceId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: 'Media source deleted',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'Media source not found' },
  },
  description: 'Remove media source',
});

export const getServerHealthSchema = createRoute({
  method: 'get',
  path: '/user/admin/server-health',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              status: z.string(),
              timestamp: z.string(),
              uptimeSeconds: z.number(),
              totalUsers: z.number(),
              activeUsers: z.number(),
              activeStreams: z.number(),
              memory: z.object({
                rssBytes: z.number(),
                heapUsedBytes: z.number(),
                heapTotalBytes: z.number(),
              }),
              storage: z.object({
                dbProvider: z.string(),
                databasePath: z.string().nullable(),
                databaseBytes: z.number().nullable(),
                diskTotalBytes: z.number().nullable(),
                diskFreeBytes: z.number().nullable(),
              }),
            }),
          }),
        },
      },
      description: 'Server health snapshot',
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
  description: 'Get server health for admin dashboard',
});
