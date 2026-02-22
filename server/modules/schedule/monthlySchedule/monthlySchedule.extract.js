import { load } from 'cheerio';

export default function monthlyScheduleExtract(html) {
  if (!html || typeof html !== 'string') return [];

  const $ = load(html);

  const response = [];
  $('a').each((i, element) => {
    const el = $(element);
    const href = el.attr('href');
    if (!href) return;

    const obj = {
      title: null,
      alternativeTitle: null,
      id: null,
      time: null,
      episode: null,
    };

    obj.id = href.replace('/', '') || null;
    obj.time = el.find('.time').text() || null;
    obj.title = el.find('.film-name').text().trim() || null;
    obj.alternativeTitle = (el.find('.film-name').attr('data-jname') || '').trim() || null;

    const epText = el.find('.btn-play').text().trim();
    const parsedEpisode = Number(epText.split('Episode ').pop());
    obj.episode = Number.isFinite(parsedEpisode) ? parsedEpisode : null;

    response.push(obj);
  });
  return response;
}
