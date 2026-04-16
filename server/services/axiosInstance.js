import config from '../config/config.js';
import { requestText } from './http-client.js';

export const axiosInstance = async (endpoint) => {
  try {
    const { response, text } = await requestText(config.baseurl + endpoint, {
      headers: {
        ...(config.headers || {}),
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      success: true,
      data: text,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
