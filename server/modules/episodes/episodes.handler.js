import config from '@/config/config';
import { requestJson } from '@/services/http-client.js';
import episodesExtract from './episodes.extract';
import { NotFoundError } from '@/utils/errors';
import { getEpisodeThumbnails, getAnimeCoverImage } from '@/services/thumbnails';

export default async function episodesHandler(c) {
  const { id } = c.req.valid('param');
  const { ep } = c.req.valid('query');
  console.log(`[Episodes] Handler called for id: ${id}, ep: ${ep}`);

  const Referer = `/watch/${id}`;
  const idParts = id.split('-');
  const idNum = idParts.at(-1);
  const ajaxUrl = `/ajax/v2/episode/list/${idNum}`;

  // Extract title from ID slug (e.g. "one-piece-100" -> "One Piece")
  const rawTitle = idParts.slice(0, -1).join(' ').replace(/-/g, ' ');
  console.log(`[Episodes] Extracted title: "${rawTitle}"`);

  try {
    const { data } = await requestJson(config.baseurl + ajaxUrl, {
      headers: {
        Referer: Referer,
        ...config.headers,
      },
    });
    let response = episodesExtract(data.html);
    console.log(`[Episodes] Extracted ${response.length} episodes`);

    // Enrich with thumbnails using fallback chain: Jikan -> Kitsu -> Cover Image
    if (response.length > 0) {
      console.log(`[Episodes] Fetching thumbnails with fallback chain...`);

      // Get cover image as final fallback
      const coverImage = await getAnimeCoverImage(rawTitle);
      console.log(`[Episodes] Cover image fallback: ${coverImage ? 'found' : 'not found'}`);

      // If 'ep' query param is provided, only fetch thumbnail for that specific episode
      if (ep) {
        const episodeNumber = parseInt(ep);
        const epToEnrich = response.filter((item) => item.episodeNumber === episodeNumber);
        
        if (epToEnrich.length > 0) {
          console.log(`[Episodes] Only enriching selected episode: ${episodeNumber}`);
          const enriched = await getEpisodeThumbnails(rawTitle, epToEnrich, coverImage);
          
          // Update the specific episode in our response list
          response = response.map(item => {
            if (item.episodeNumber === episodeNumber) {
              return enriched[0];
            }
            // For other episodes, just use the cover image as fallback immediately
            return { ...item, image: item.image || coverImage, isFallbackImage: !!coverImage };
          });
        } else {
          // If the episode number wasn't found in the list, just apply cover image to all
          response = response.map(item => ({ ...item, image: item.image || coverImage, isFallbackImage: !!coverImage }));
        }
      } else {
        // No specific episode selected, but we still want to avoid fetching 1000+ thumbnails
        // For now, let's limit full enrichment to only if the list is small (e.g., < 100 episodes)
        if (response.length <= 100) {
          response = await getEpisodeThumbnails(rawTitle, response, coverImage);
        } else {
          console.log(`[Episodes] List too long (${response.length}), skipping full thumbnail fetch. Applying cover image to all.`);
          response = response.map(item => ({ ...item, image: item.image || coverImage, isFallbackImage: !!coverImage }));
        }
      }
      
      const withImages = response.filter(ep => ep.image).length;
      console.log(`[Episodes] Final result: ${withImages}/${response.length} episodes have images`);
    }

    return response;
  } catch (err) {
    console.log(`[Episodes] Error: ${err.message}`);
    throw new NotFoundError('episodes Not Found');
  }
}
