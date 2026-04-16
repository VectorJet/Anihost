import megacloud from './parser/megacloud.js';
import animekaiFallback from './parser/animekai.js';
import { getServers } from '../servers/servers.handler.js';
import { getEmbeddedSourceMap } from '../../services/media-sources.js';

/* =======================
   CONSTANTS
======================= */
const TYPE_DUB = 'dub';

/* =======================
   MAIN FUNCTION
======================= */
export default async function streamExtract({ selectedServer, id, episodeNumber }) {
  const embeddedSources = await getEmbeddedSourceMap();

  if (isEmbeddedStream(selectedServer, embeddedSources)) {
    return buildEmbeddedStream(selectedServer, id, embeddedSources);
  }

  const stream = await megacloud({ selectedServer, id });
  if (!hasFile(stream)) {
    const animekaiStream = await animekaiFallback({
      id,
      type: selectedServer.type,
      episodeNumber,
    });
    return animekaiStream ?? buildPreferredEmbeddedFallback(selectedServer, id, embeddedSources) ?? stream;
  }

  if (needsSubFallback(selectedServer, stream)) {
    await attachSubtitlesFromSub(stream, selectedServer, id);
  }

  return {
    ...stream,
    referer: getDefaultReferer(embeddedSources),
  };
}

/* =======================
   HELPERS
======================= */

const isEmbeddedStream = (server, embeddedSources) =>
  embeddedSources.has(server.name.toLowerCase());

const buildEmbeddedStream = (server, id, embeddedSources) => {
  const episodeId = id.split('ep=').pop();
  const source = embeddedSources.get(server.name.toLowerCase());

  if (!source?.streamBaseUrl) {
    return null;
  }

  const END_PATH = `${episodeId}/${server.type}`;

  const END_URL = `${source.streamBaseUrl}${END_PATH}`;

  return {
    streamingLink: END_URL,
    servers: source.name || server.name,
    server: source.key || server.name,
    referer: source.refererUrl || `https://${source.domain}/`,
    usedEmbeddedFallback: true,
  };
};

const buildPreferredEmbeddedFallback = (server, id, embeddedSources) => {
  const preferred = embeddedSources.get(server.name.toLowerCase());
  if (preferred?.streamBaseUrl) {
    return buildEmbeddedStream({ ...server, name: preferred.key }, id, embeddedSources);
  }

  const primary = embeddedSources.get('megaplay');
  if (primary?.streamBaseUrl) {
    return buildEmbeddedStream({ ...server, name: primary.key }, id, embeddedSources);
  }

  const first = [...embeddedSources.values()].find((source) => source.streamBaseUrl);
  if (!first) return null;

  return buildEmbeddedStream({ ...server, name: first.key }, id, embeddedSources);
};

const getDefaultReferer = (embeddedSources) => {
  const primary = embeddedSources.get('megaplay');
  if (primary?.refererUrl) {
    return primary.refererUrl;
  }

  const first = [...embeddedSources.values()][0];
  return first?.refererUrl || 'https://megacloud.blog/';
};

const hasFile = (stream) => Boolean(stream?.link?.file);

const needsSubFallback = (server, stream) => {
  if (server.type !== TYPE_DUB) return false;

  const captions =
    stream.tracks?.filter((t) => t.kind === 'captions' || t.kind === 'subtitles') ?? [];

  return captions.length === 0;
};

const attachSubtitlesFromSub = async (stream, server, id) => {
  try {
    const allServers = await getServers(id);

    const subServer = allServers?.sub?.find(
      (s) => s.name === server.name || s.index === server.index
    );

    if (!subServer?.id) return;

    const subStream = await megacloud({
      selectedServer: subServer,
      id,
    });

    const subtitles =
      subStream?.tracks?.filter((t) => t.kind === 'captions' || t.kind === 'subtitles') ?? [];

    if (subtitles.length === 0) return;

    stream.tracks = [...(stream.tracks ?? []), ...subtitles];
  } catch {
    // no need to thorw error for subtitles
  }
};
