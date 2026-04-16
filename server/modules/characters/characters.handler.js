import { NotFoundError } from '@/utils/errors';
import config from '@/config/config';
import { requestJson } from '@/services/http-client.js';
import charactersExtract from './characters.extract';

export default async function charactersHandler(c) {
  const { id } = c.req.valid('param');
  const { page } = c.req.valid('query');

  const idNum = id.split('-').pop();
  const endpoint = `/ajax/character/list/${idNum}?page=${page}`;
  try {
    const Referer = `${config.baseurl}/home`;

    const { response: res, data } = await requestJson(config.baseurl + endpoint, {
      headers: {
        ...config.headers,
        Referer,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const response = charactersExtract(data.html);

    return response;
  } catch {
    throw new NotFoundError('characters not found');
  }
}
