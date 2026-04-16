import { validationError } from '@/utils/errors';
import config from '@/config/config';
import { requestJson } from '@/services/http-client.js';
import suggestionExtract from './suggestion.extract';

export default async function suggestionHandler(c) {
  const { keyword } = c.req.valid('query');

  const endpoint = `/ajax/search/suggest?keyword=${keyword}`;
  const Referer = `${config.baseurl}/home`;
  const { response: res, data } = await requestJson(config.baseurl + endpoint, {
    headers: {
      Referer,
      ...config.headers,
    },
  });

  if (!res.ok) throw new validationError(`suggestion request failed: ${res.status}`);
  if (!data.status) throw new validationError('suggestion not found');

  const response = suggestionExtract(data.html);

  return response;
}
