import { createRouter } from '../lib/create-app';

import * as home from '../modules/home/index';
import * as spotlight from '../modules/spotlight/index';
import * as topTen from '../modules/topTen/index';
import * as animeInfo from '../modules/info/animeInfo/index';
import * as randomAnimeInfo from '../modules/info/randomAnimeInfo/index';
import * as explore from '../modules/explore/index';
import * as search from '../modules/explore/search/index';
import * as suggestion from '../modules/suggestion/index';
import * as characters from '../modules/characters/index';
import * as animeCharacter from '../modules/characterInfo/animeCharacter/index';
import * as voiceActor from '../modules/characterInfo/voiceActor/index';
import * as genre from '../modules/explore/genre/index';
import * as azList from '../modules/explore/az-list/index';
import * as producer from '../modules/explore/producer/index';
import * as filter from '../modules/explore/filter/index';
import * as episodes from '../modules/episodes/index';
import * as servers from '../modules/servers/index';
import * as stream from '../modules/stream/index';
import * as monthlySchedule from '../modules/schedule/monthlySchedule/index';
import * as nextEpSchedule from '../modules/schedule/nextEpSchedule/index';
import * as meta from '../modules/meta/index';
import * as proxy from '../modules/proxy/index';
import * as auth from '../modules/auth/index';
import * as user from '../modules/user/index';
import withTryCatch from '@/utils/withTryCatch';
import { jwt } from 'hono/jwt';
import { contentFilterMiddleware } from '../middlewares/contentFilter.js';

const router = createRouter();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Apply JWT middleware to protected routes
router.use('/auth/me', jwt({ secret: JWT_SECRET, alg: 'HS256' }));
router.use('/user/*', jwt({ secret: JWT_SECRET, alg: 'HS256' }));

// Apply content filtering to all routes (will only filter for authenticated users with settings)
router.use('*', contentFilterMiddleware());

const routes = [
  home,
  spotlight,
  topTen,
  animeInfo,
  randomAnimeInfo,
  search,
  suggestion,
  characters,
  animeCharacter,
  voiceActor,
  genre,
  azList,
  producer,
  filter,
  episodes,
  servers,
  stream,
  monthlySchedule,
  nextEpSchedule,
  meta,
  explore,
];

// Register proxy without withTryCatch wrapper to allow streaming Response
// MUST be registered before other routes to avoid matching /{query}
router.openapi(proxy.schema, proxy.handler);

// Register auth routes
auth.authRoutes.forEach((route) => {
  router.openapi(route.schema, withTryCatch(route.handler));
});

// Register user routes
user.userRoutes.forEach((route) => {
  router.openapi(route.schema, withTryCatch(route.handler));
});

routes.forEach((route) => {
  router.openapi(route.schema, withTryCatch(route.handler));
});

export default router;
