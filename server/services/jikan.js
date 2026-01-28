// Service to fetch episode thumbnails from Jikan API (Unofficial MyAnimeList API)
// Uses /videos/episodes endpoint which has thumbnail images

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export async function getJikanThumbnails(animeTitle, episodes) {
  console.log(`[Jikan] === Starting thumbnail fetch ===`);
  console.log(`[Jikan] Input title: "${animeTitle}"`);
  console.log(`[Jikan] Episode count: ${episodes.length}`);

  try {
    const cleanTitle = animeTitle.replace(/\(TV\)/i, '').trim();
    console.log(`[Jikan] Cleaned title: "${cleanTitle}"`);

    // Search for the anime to get MAL ID
    const searchUrl = `${JIKAN_API_URL}/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`;
    console.log(`[Jikan] Search URL: ${searchUrl}`);

    const searchRes = await fetch(searchUrl);
    console.log(`[Jikan] Search response status: ${searchRes.status}`);

    if (!searchRes.ok) {
      console.error(`[Jikan] Search API Error: ${searchRes.status}`);
      return { episodes, found: 0 };
    }

    const searchData = await searchRes.json();
    const anime = searchData.data?.[0];

    if (!anime) {
      console.log(`[Jikan] No anime found for: "${cleanTitle}"`);
      return { episodes, found: 0 };
    }

    const malId = anime.mal_id;
    console.log(`[Jikan] Found anime: ${anime.title} (MAL ID: ${malId})`);

    // Fetch video episodes (has thumbnails) - paginated, 40 per page
    const thumbMap = new Map();
    const pageSize = 40;
    const totalPages = Math.ceil(episodes.length / pageSize);

    // Jikan has rate limiting (3 req/sec), so fetch sequentially with small delay
    for (let page = 1; page <= totalPages; page++) {
      const videosUrl = `${JIKAN_API_URL}/anime/${malId}/videos/episodes?page=${page}`;
      console.log(`[Jikan] Fetching videos page ${page}: ${videosUrl}`);

      try {
        const res = await fetch(videosUrl);
        console.log(`[Jikan] Videos page ${page} status: ${res.status}`);

        if (res.status === 429) {
          console.log(`[Jikan] Rate limited, stopping pagination`);
          break;
        }

        if (!res.ok) continue;

        const data = await res.json();
        console.log(`[Jikan] Page ${page} returned ${data.data?.length ?? 0} episodes`);

        for (const ep of data.data || []) {
          const num = ep.mal_id;
          const thumb = ep.images?.jpg?.image_url;
          if (num && thumb) {
            thumbMap.set(num, thumb);
          }
        }

        // Small delay to respect rate limits
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      } catch (err) {
        console.error(`[Jikan] Error fetching page ${page}:`, err.message);
      }
    }

    console.log(`[Jikan] Retrieved ${thumbMap.size} episode thumbnails`);
    console.log(`[Jikan] Sample thumbnails:`, Array.from(thumbMap.entries()).slice(0, 3));

    const enrichedEpisodes = episodes.map((ep) => {
      const thumb = thumbMap.get(ep.episodeNumber);
      if (thumb) {
        return { ...ep, image: thumb };
      }
      return ep;
    });

    const found = enrichedEpisodes.filter(ep => ep.image).length;
    console.log(`[Jikan] Episodes with images: ${found}/${enrichedEpisodes.length}`);
    console.log(`[Jikan] === Finished thumbnail fetch ===`);

    return { episodes: enrichedEpisodes, found };

  } catch (error) {
    console.error('[Jikan] Enrichment Error:', error);
    return { episodes, found: 0 };
  }
}
