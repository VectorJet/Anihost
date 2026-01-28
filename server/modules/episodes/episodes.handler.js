import config from '@/config/config';
import episodesExtract from './episodes.extract';
import { NotFoundError } from '@/utils/errors';
import { getEpisodeThumbnails, getAnimeCoverImage } from '@/services/thumbnails';

export default async function episodesHandler(c) {
  const { id } = c.req.valid('param');
  console.log(`[Episodes] Handler called for id: ${id}`);

  const Referer = `/watch/${id}`;
  const idParts = id.split('-');
  const idNum = idParts.at(-1);
  const ajaxUrl = `/ajax/v2/episode/list/${idNum}`;

  // Extract title from ID slug (e.g. "one-piece-100" -> "One Piece")
  const rawTitle = idParts.slice(0, -1).join(' ').replace(/-/g, ' ');
  console.log(`[Episodes] Extracted title: "${rawTitle}"`);

  try {
    const res = await fetch(config.baseurl + ajaxUrl, {
      headers: {
        Referer: Referer,
        ...config.headers,
      },
    });

    const data = await res.json();
    let response = episodesExtract(data.html);
    console.log(`[Episodes] Extracted ${response.length} episodes`);

    // Enrich with thumbnails using fallback chain: Jikan -> Kitsu -> Cover Image
    if (response.length > 0) {
      console.log(`[Episodes] Fetching thumbnails with fallback chain...`);
      
      // Get cover image as final fallback
      const coverImage = await getAnimeCoverImage(rawTitle);
      console.log(`[Episodes] Cover image fallback: ${coverImage ? 'found' : 'not found'}`);
      
      response = await getEpisodeThumbnails(rawTitle, response, coverImage);
      const withImages = response.filter(ep => ep.image).length;
      console.log(`[Episodes] Final result: ${withImages}/${response.length} episodes have images`);
    }

    return response;
  } catch (err) {
    console.log(`[Episodes] Error: ${err.message}`);
    throw new NotFoundError('episodes Not Found');
  }
}
