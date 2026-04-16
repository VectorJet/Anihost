import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);
const MAX_RETRIES = 1;
const TIMEOUT = 60_000;

const NODE_SCRIPT = String.raw`
const { ANIME, StreamingServers, SubOrSub } = require('@consumet/extensions');

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toTitle(title) {
  if (typeof title === 'string') return title;
  return title?.english || title?.romaji || title?.userPreferred || title?.native || '';
}

(async () => {
  const input = JSON.parse(process.argv[1]);
  const animekai = new ANIME.AnimeKai();
  const search = await animekai.search(input.title, 1);
  const results = search?.results || [];
  if (results.length === 0) throw new Error('AnimeKai search returned no results');

  const normalizedTitle = normalize(input.title);
  const exact = results.find((item) => normalize(toTitle(item.title)) === normalizedTitle);
  const startsWith = results.find((item) => normalize(toTitle(item.title)).startsWith(normalizedTitle));
  const includes = results.find((item) => normalize(toTitle(item.title)).includes(normalizedTitle));
  const anime = exact || startsWith || includes || results[0];

  const info = await animekai.fetchAnimeInfo(anime.id);
  const episode = info?.episodes?.find((entry) => Number(entry.number) === Number(input.episodeNumber));
  if (!episode?.id) {
    throw new Error('AnimeKai episode not found');
  }

  const source = await animekai.fetchEpisodeSources(
    episode.id,
    StreamingServers.MegaUp,
    input.type === 'dub' ? SubOrSub.DUB : SubOrSub.SUB
  );

  const primary = source?.sources?.find((entry) => entry?.url)?.url;
  if (!primary) {
    throw new Error('AnimeKai returned no playable sources');
  }

  process.stdout.write(JSON.stringify({
    animeId: anime.id,
    episodeId: episode.id,
    link: primary,
    referer: source?.headers?.Referer || 'https://megaup.live/',
    tracks: source?.subtitles || [],
    intro: source?.intro || null,
    outro: source?.outro || null,
  }));
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
`;

export default async function animekaiFallback({ id, type = 'sub', episodeNumber }, retry = 0) {
  try {
    const context = getEpisodeContext(id, episodeNumber, type);
    if (!context) {
      throw new Error('AnimeKai fallback could not resolve episode context');
    }

    const { stdout } = await execFileAsync(
      'node',
      ['-e', NODE_SCRIPT, JSON.stringify(context)],
      {
        timeout: TIMEOUT,
        maxBuffer: 5 * 1024 * 1024,
      }
    );

    const parsed = JSON.parse(stdout);

    return {
      id,
      type,
      link: {
        file: parsed.link,
        type: 'hls',
      },
      tracks: (parsed.tracks ?? []).map((track) => ({
        file: track.url,
        label: track.lang || 'Unknown',
        kind: track.kind || 'captions',
        default: /english/i.test(track.lang || ''),
      })),
      intro: parsed.intro ?? null,
      outro: parsed.outro ?? null,
      server: 'animekai-megaup',
      referer: parsed.referer || 'https://megaup.live/',
      usedAnimekaiFallback: true,
      animekaiAnimeId: parsed.animeId,
      animekaiEpisodeId: parsed.episodeId,
    };
  } catch (error) {
    console.error(error.stderr || error.message);
    if (retry < MAX_RETRIES) {
      return animekaiFallback({ id, type, episodeNumber }, retry + 1);
    }
    return null;
  }
}

function getEpisodeContext(id, episodeNumber, type) {
  const [animeId] = id.split('::');
  const title = animeId
    .split('-')
    .slice(0, -1)
    .join(' ')
    .trim();

  if (!title || !episodeNumber) {
    return null;
  }

  return {
    title,
    episodeNumber: Number(episodeNumber),
    type,
  };
}
