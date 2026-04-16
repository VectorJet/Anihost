import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT = 15_000;

function buildCurlArgs(url, { method = 'GET', headers = {}, body, timeout = DEFAULT_TIMEOUT } = {}) {
  const args = [
    '--silent',
    '--show-error',
    '--location',
    '--max-time',
    String(Math.ceil(timeout / 1000)),
    '--request',
    method,
    '--write-out',
    '\n__STATUS__:%{http_code}',
  ];

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null || value === '') continue;
    args.push('--header', `${key}: ${value}`);
  }

  if (body !== undefined) {
    args.push('--data-raw', typeof body === 'string' ? body : JSON.stringify(body));
  }

  args.push(url);
  return args;
}

async function curlRequest(url, options) {
  const { stdout, stderr } = await execFileAsync('curl', buildCurlArgs(url, options), {
    timeout: (options?.timeout || DEFAULT_TIMEOUT) + 1000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stderr?.trim()) {
    console.warn(stderr.trim());
  }

  const marker = '\n__STATUS__:';
  const index = stdout.lastIndexOf(marker);
  if (index === -1) {
    throw new Error('curl response missing status marker');
  }

  const text = stdout.slice(0, index);
  const status = Number(stdout.slice(index + marker.length).trim());

  return {
    response: {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
    },
    text,
  };
}

export async function requestText(url, options) {
  return curlRequest(url, options);
}

export async function requestJson(url, options) {
  const { response, text } = await curlRequest(url, options);
  const data = text ? JSON.parse(text) : null;
  return { response, data, text };
}
