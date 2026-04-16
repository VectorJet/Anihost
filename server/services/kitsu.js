// Service to fetch episode thumbnails from Kitsu API (No API Key required)

const KITSU_API_URL = 'https://kitsu.io/api/edge';

export async function getKitsuThumbnails(animeTitle, episodes) {
  console.log(`[Kitsu] === Starting thumbnail fetch ===`);
  console.log(`[Kitsu] Input title: "${animeTitle}"`);
  console.log(`[Kitsu] Episode count: ${episodes.length}`);

  try {
    const cleanTitle = animeTitle.replace(/\(TV\)/i, '').trim();
    console.log(`[Kitsu] Cleaned title: "${cleanTitle}"`);

    // Search for the anime
    const searchUrl = `${KITSU_API_URL}/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=1`;
    console.log(`[Kitsu] Search URL: ${searchUrl}`);

    const searchRes = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    console.log(`[Kitsu] Search response status: ${searchRes.status}`);

    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      console.error(`[Kitsu] Search API Error: ${searchRes.status} - ${errorText}`);
      return episodes;
    }

    const searchData = await searchRes.json();
    console.log(`[Kitsu] Search results count: ${searchData.data?.length ?? 0}`);

    const anime = searchData.data?.[0];

    if (!anime) {
      console.log(`[Kitsu] No anime found for: "${cleanTitle}"`);
      return episodes;
    }

    console.log(`[Kitsu] Found anime: ${anime.attributes.canonicalTitle} (ID: ${anime.id})`);

    // Fetch episodes with thumbnails
    const thumbMap = new Map();

    if (episodes.length <= 5) {
      // Optimization: Fetch only specific episodes using filter[number]
      console.log(`[Kitsu] Using specific episode filters for ${episodes.length} episodes`);
      const filterPromises = episodes.map(async (ep) => {
        const episodesUrl = `${KITSU_API_URL}/anime/${anime.id}/episodes?filter[number]=${ep.episodeNumber}`;
        try {
          const res = await fetch(episodesUrl, {
            headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            const kitsuEp = data.data?.find(d => d.attributes.number === ep.episodeNumber);
            if (kitsuEp?.attributes.thumbnail?.original) {
              thumbMap.set(ep.episodeNumber, kitsuEp.attributes.thumbnail.original);
            }
          }
        } catch (err) {
          console.error(`[Kitsu] Error filtering for episode ${ep.episodeNumber}:`, err.message);
        }
      });
      await Promise.all(filterPromises);
    } else {
      // Original paginated fetch (only useful for small-ish anime lists, e.g., 24 eps)
      // For large lists like One Piece, even this is too many requests
      const maxEpisodesToFetch = Math.min(episodes.length, 100); 
      const pageSize = 20;

      const fetchPromises = [];
      for (let offset = 0; offset < maxEpisodesToFetch; offset += pageSize) {
        const episodesUrl = `${KITSU_API_URL}/anime/${anime.id}/episodes?page[limit]=${pageSize}&page[offset]=${offset}`;
        console.log(`[Kitsu] Fetching episodes URL: ${episodesUrl}`);
        fetchPromises.push(
          fetch(episodesUrl, {
            headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
            },
          }).then(async res => {
            console.log(`[Kitsu] Episodes fetch status (offset ${offset}): ${res.status}`);
            if (!res.ok) return null;
            return res.json();
          }).catch(err => {
            console.error(`[Kitsu] Episodes fetch error (offset ${offset}):`, err.message);
            return null;
          })
        );
      }

      const results = await Promise.all(fetchPromises);
      console.log(`[Kitsu] Fetched ${results.length} batches`);

      for (const result of results) {
        if (result?.data) {
          for (const ep of result.data) {
            const num = ep.attributes.number;
            const thumb = ep.attributes.thumbnail?.original;
            if (num && thumb) {
              thumbMap.set(num, thumb);
            }
          }
        }
      }
    }

    console.log(`[Kitsu] Retrieved ${thumbMap.size} episode thumbnails`);
    console.log(`[Kitsu] Sample thumbnails:`, Array.from(thumbMap.entries()).slice(0, 3));

    const enrichedEpisodes = episodes.map((ep) => {
      const thumb = thumbMap.get(ep.episodeNumber);
      if (thumb) {
        return {
          ...ep,
          image: thumb,
        };
      }
      return ep;
    });

    const found = enrichedEpisodes.filter(ep => ep.image).length;
    console.log(`[Kitsu] Episodes with images after enrichment: ${found}/${enrichedEpisodes.length}`);
    console.log(`[Kitsu] === Finished thumbnail fetch ===`);

    return { episodes: enrichedEpisodes, found };

  } catch (error) {
    console.error('[Kitsu] Enrichment Error:', error);
    console.error('[Kitsu] Error stack:', error.stack);
    return { episodes, found: 0 };
  }
}
