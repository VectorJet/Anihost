const HIANIME_COOKIE = process.env.HIANIME_COOKIE || process.env.UPSTREAM_COOKIE || '';
const MEGACLOUD_COOKIE = process.env.MEGACLOUD_COOKIE || '';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
};

if (HIANIME_COOKIE) {
  headers.Cookie = HIANIME_COOKIE;
}

const config = {
  baseurl: 'https://aniwatchtv.to',
  hianimeCookie: HIANIME_COOKIE,
  megacloudCookie: MEGACLOUD_COOKIE,
  headers,
};

export default config;
