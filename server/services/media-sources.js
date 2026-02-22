import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { mediaSources } from '../db/schema.js';

const DEFAULT_MEDIA_SOURCES = [
  {
    key: 'megaplay',
    name: 'MegaPlay',
    type: 'embedded',
    streamBaseUrl: 'https://megaplay.buzz/stream/s-2/',
    domain: 'megaplay.buzz',
    refererUrl: 'https://megaplay.buzz/',
    priority: 10,
    isActive: true,
  },
  {
    key: 'vidwish',
    name: 'Vidwish',
    type: 'embedded',
    streamBaseUrl: 'https://vidwish.live/stream/s-2/',
    domain: 'vidwish.live',
    refererUrl: 'https://vidwish.live/',
    priority: 20,
    isActive: true,
  },
  {
    key: 'megaplay',
    name: 'MegaPlay',
    type: 'fallback',
    streamBaseUrl: null,
    domain: 'megaplay.buzz',
    refererUrl: 'https://megaplay.buzz/',
    priority: 10,
    isActive: true,
  },
  {
    key: 'vidwish',
    name: 'Vidwish',
    type: 'fallback',
    streamBaseUrl: null,
    domain: 'vidwish.live',
    refererUrl: 'https://vidwish.live/',
    priority: 20,
    isActive: true,
  },
];

function toProvider(source) {
  return {
    name: source.key,
    domain: source.domain,
    refererUrl: source.refererUrl || `https://${source.domain}/`,
    priority: source.priority,
  };
}

export async function ensureDefaultMediaSources() {
  const existing = await db.query.mediaSources.findMany({
    columns: { id: true },
    limit: 1,
  });

  if (existing.length > 0) return;

  const now = new Date();
  await db.insert(mediaSources).values(
    DEFAULT_MEDIA_SOURCES.map((source) => ({
      id: crypto.randomUUID(),
      ...source,
      createdAt: now,
      updatedAt: now,
    }))
  );
}

export async function listMediaSources() {
  await ensureDefaultMediaSources();

  return db.query.mediaSources.findMany({
    orderBy: [asc(mediaSources.type), asc(mediaSources.priority), asc(mediaSources.name)],
  });
}

export async function listActiveMediaSourcesByType(type) {
  await ensureDefaultMediaSources();

  return db.query.mediaSources.findMany({
    where: and(eq(mediaSources.type, type), eq(mediaSources.isActive, true)),
    orderBy: [asc(mediaSources.priority), asc(mediaSources.name)],
  });
}

export async function getEmbeddedSourceMap() {
  const sources = await listActiveMediaSourcesByType('embedded');
  const entries = sources
    .filter((source) => source.streamBaseUrl)
    .map((source) => [source.key.toLowerCase(), source]);
  return new Map(entries);
}

export async function getFallbackProviders(preferredKey) {
  const activeFallbackSources = await listActiveMediaSourcesByType('fallback');

  const normalizedProviders = activeFallbackSources
    .filter((source) => source.domain)
    .map(toProvider);

  if (normalizedProviders.length === 0) {
    const defaults = DEFAULT_MEDIA_SOURCES.filter((source) => source.type === 'fallback').map(
      toProvider
    );
    return prioritizeProviders(defaults, preferredKey);
  }

  return prioritizeProviders(normalizedProviders, preferredKey);
}

function prioritizeProviders(providers, preferredKey) {
  const targetKey = String(preferredKey || '').toLowerCase();
  if (!targetKey) return providers;

  const preferred = providers.filter((provider) => provider.name.toLowerCase() === targetKey);
  const rest = providers.filter((provider) => provider.name.toLowerCase() !== targetKey);
  return [...preferred, ...rest];
}
