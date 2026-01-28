import { load } from 'cheerio';

export default function episodesExtract(html) {
  const $ = load(html);

  const response = [];
  $('.ssl-item.ep-item').each((i, el) => {
    const obj = {
      title: null,
      alternativeTitle: null,
      id: null,
      isFiller: false,
      episodeNumber: null,
    };
    obj.episodeNumber = i + 1;
    obj.title = $(el).attr('title');
    obj.id = $(el).attr('href').replace('/watch/', '').replace('?', '::');
    obj.isFiller = $(el).hasClass('ssl-item-filler');

    obj.alternativeTitle = $(el).find('.ep-name.e-dynamic-name').attr('data-jname');

    // Attempt to extract thumbnail
    const img = $(el).find('img');
    obj.image = img.attr('data-src') || img.attr('src') || null;

    response.push(obj);
  });
  return response;
}
