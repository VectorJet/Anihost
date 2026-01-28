// Unified thumbnail service with fallback chain:
// 1. Jikan (MyAnimeList) - has good coverage
// 2. Kitsu - comprehensive episode thumbnails
// 3. Anime cover image as final fallback

import { getJikanThumbnails } from './jikan.js';
import { getKitsuThumbnails } from './kitsu.js';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export async function getEpisodeThumbnails(animeTitle, episodes, animeCoverImage = null) {
  console.log(`[Thumbnails] === Starting unified thumbnail fetch ===`);
  console.log(`[Thumbnails] Title: "${animeTitle}", Episodes: ${episodes.length}`);

  let enrichedEpisodes = episodes;
  let totalFound = 0;

  // 1. Try Jikan first (MyAnimeList data)
  try {
    console.log(`[Thumbnails] Trying Jikan...`);
    const jikanResult = await getJikanThumbnails(animeTitle, enrichedEpisodes);
    enrichedEpisodes = jikanResult.episodes;
    totalFound = jikanResult.found;
    console.log(`[Thumbnails] Jikan found ${jikanResult.found}/${episodes.length} thumbnails`);

    // If Jikan got most thumbnails, we're done
    if (jikanResult.found >= episodes.length * 0.8) {
      console.log(`[Thumbnails] Jikan coverage sufficient (>=80%), skipping fallbacks`);
      return applyFallbackImage(enrichedEpisodes, animeCoverImage);
    }
  } catch (err) {
    console.error(`[Thumbnails] Jikan failed:`, err.message);
  }

  // 2. Try Kitsu for missing thumbnails
  const missingCount = enrichedEpisodes.filter(ep => !ep.image).length;
  if (missingCount > 0) {
    try {
      console.log(`[Thumbnails] Trying Kitsu for ${missingCount} missing thumbnails...`);
      
      // Only pass episodes without images to Kitsu
      const episodesNeedingImages = enrichedEpisodes.filter(ep => !ep.image);
      const kitsuResult = await getKitsuThumbnails(animeTitle, episodesNeedingImages);
      
      // Merge Kitsu results back
      const kitsuMap = new Map(kitsuResult.episodes.map(ep => [ep.episodeNumber, ep.image]));
      enrichedEpisodes = enrichedEpisodes.map(ep => {
        if (!ep.image && kitsuMap.has(ep.episodeNumber)) {
          return { ...ep, image: kitsuMap.get(ep.episodeNumber) };
        }
        return ep;
      });

      totalFound = enrichedEpisodes.filter(ep => ep.image).length;
      console.log(`[Thumbnails] After Kitsu: ${totalFound}/${episodes.length} thumbnails`);
    } catch (err) {
      console.error(`[Thumbnails] Kitsu failed:`, err.message);
    }
  }

  // 3. Apply cover image fallback for any remaining episodes without images
  enrichedEpisodes = applyFallbackImage(enrichedEpisodes, animeCoverImage);

  const finalCount = enrichedEpisodes.filter(ep => ep.image).length;
  console.log(`[Thumbnails] Final count: ${finalCount}/${episodes.length} episodes have images`);
  console.log(`[Thumbnails] === Finished unified thumbnail fetch ===`);

  return enrichedEpisodes;
}

// Apply cover image as fallback for episodes without thumbnails
function applyFallbackImage(episodes, fallbackImage) {
  if (!fallbackImage) return episodes;

  return episodes.map(ep => {
    if (!ep.image) {
      return { ...ep, image: fallbackImage, isFallbackImage: true };
    }
    return ep;
  });
}

// Fetch anime cover image from Jikan to use as fallback
export async function getAnimeCoverImage(animeTitle) {
  try {
    const cleanTitle = animeTitle.replace(/\(TV\)/i, '').trim();
    const searchUrl = `${JIKAN_API_URL}/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`;
    
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    
    const data = await res.json();
    const anime = data.data?.[0];
    
    // Return the large image or default image
    return anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url || null;
  } catch (err) {
    console.error(`[Thumbnails] Failed to get cover image:`, err.message);
    return null;
  }
}
