// Service to fetch metadata from Anilist GraphQL API (No API Key required)

const ANILIST_API_URL = 'https://graphql.anilist.co';

const QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    streamingEpisodes {
      title
      thumbnail
      url
    }
  }
}
`;

export async function getAnilistThumbnails(animeTitle, episodes) {
  try {
    // 1. Clean the title for better search results
    // Remove "TV", parens, special chars usually helps
    const cleanTitle = animeTitle.replace(/\(TV\)/i, '').trim();
    console.log(`[Anilist] Searching for: "${cleanTitle}"`);

    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          search: cleanTitle
        }
      })
    });

    if (!response.ok) {
      console.error(`Anilist API Error: ${response.status}`);
      return episodes;
    }

    const json = await response.json();
    const media = json.data?.Media;

    if (!media) {
      console.log(`[Anilist] No media found for: "${cleanTitle}"`);
      return episodes;
    }

    // Sort existing episodes by number to make mapping safer if array order differs
    // But we shouldn't mutate original array order if it matters for UI.
    // Instead, let's just create a map of episodeNumber -> thumbnail.
    
    const thumbMap = new Map();
    if (media.streamingEpisodes && media.streamingEpisodes.length > 0) {
       // Anilist streaming episodes often have a title like "Episode 1 - Title"
       // We can try to extract the number.
       media.streamingEpisodes.forEach(ep => {
           // Regex to find "Episode X"
           const match = ep.title.match(/Episode\s+(\d+)/i);
           if (match) {
               const num = parseInt(match[1]);
               thumbMap.set(num, ep.thumbnail);
           } else {
               // Fallback: Use index if title parsing fails?
               // Actually, Anilist streaming episodes are usually ordered.
               // Let's iterate and assume index 0 = Episode 1 if numbers aren't clear.
           }
       });

       // Fallback strategy: Just map by index 1:1
       media.streamingEpisodes.forEach((ep, i) => {
           if (!thumbMap.has(i + 1)) {
               thumbMap.set(i + 1, ep.thumbnail);
           }
       });
    }

    return episodes.map((ep) => {
      // Try to find a thumbnail for this episode number
      const thumb = thumbMap.get(ep.episodeNumber);
      if (thumb) {
        return {
          ...ep,
          image: thumb
        };
      }
      return ep;
    });

  } catch (error) {
    console.error('Anilist Enrichment Error:', error);
    return episodes;
  }
}
