'use strict';
// The shared-title page (CMD-022): https://calledit.dalcor.com/i/title/?m=movie&id=<tmdb id>
// (or m=tv). Vercel rewrites /i/title to this function (vercel.json), which asks
// TMDB for the title and answers the page with the title and its poster in the
// Open Graph tags, so Messages' card shows the poster and names the title.
// Everything else — a bad query, an unknown id, a title with no poster, a TMDB
// failure or timeout, anything thrown — answers 200 with the generic Called It
// card: LinkPresentation refuses a non-200 page, so this never errors out.
//
// The TMDB read-access token is TMDB_READ_ACCESS_TOKEN in Vercel's environment,
// never in this public repository. Nothing from TMDB is stored: a good answer is
// cached by Vercel's CDN for a day (Cache-Control below), a failure for a minute.
// CommonJS on purpose: no package.json, no dependencies, Node's own fetch.

const SITE = 'https://calledit.dalcor.com';
const APP_ID = '6826726436';
const TMDB = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w780';          // the card's image
const PAGE_POSTER_SIZE = 'w342';     // the poster drawn on the page itself
const TIMEOUT_MS = 4000;

// The card's description — changeable here, on the server, without an app
// update or a new link.
const CARD_LINE = 'Shared from Called It — open it to see the details and add it to your list.';

const GENERIC = {
  title: 'Shared from Called It',
  description: 'Open it in Called It to see the details and add it to your list.',
  image: `${SITE}/og.png?v=2`,
  imageWidth: 1200,
  imageHeight: 630,
  imageAlt: 'Called It — track the season with friends.',
};

const CACHE_LONG = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const CACHE_SHORT = 'public, max-age=0, s-maxage=60';

// ---------------------------------------------------------------- query

// {media, id} for a valid ?m=movie|tv&id=N (the app's InviteLink rules), else null.
function parseQuery(params) {
  const media = (params.get('m') || '').toLowerCase();
  const id = params.get('id') || '';
  if (!/^(movie|tv)$/.test(media) || !/^[1-9][0-9]{0,11}$/.test(id)) return null;
  return { media, id };
}

// ----------------------------------------------------------------- TMDB

// {kind: 'found', title, year, posterPath} | {kind: 'missing'} | {kind: 'error'}.
// Never throws. `found` has a non-empty title; posterPath may be null.
async function lookup({ media, id }, { fetch: doFetch, token, timeoutMs = TIMEOUT_MS } = {}) {
  if (!token || typeof doFetch !== 'function') return { kind: 'error' };
  try {
    const response = await doFetch(`${TMDB}/${media}/${id}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 404) return { kind: 'missing' };
    if (!response.ok) return { kind: 'error' };
    const data = await response.json();
    const title = String((media === 'movie' ? data.title : data.name) || '').trim();
    if (!title) return { kind: 'missing' };
    const date = String((media === 'movie' ? data.release_date : data.first_air_date) || '');
    const year = /^\d{4}/.test(date) ? date.slice(0, 4) : null;
    const posterPath = typeof data.poster_path === 'string' && /^\/[A-Za-z0-9._-]+$/.test(data.poster_path)
      ? data.poster_path : null;
    return { kind: 'found', title, year, posterPath };
  } catch {
    return { kind: 'error' };
  }
}

// ----------------------------------------------------------------- page

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// "Wild Horse Nine (2026)"; the title alone when TMDB has no date.
function cardTitle(title, year) {
  return year ? `${title} (${year})` : title;
}

// {html, cache} for the parsed query (or null) and the TMDB result (or null).
function render(query, result) {
  const found = query && result && result.kind === 'found' ? result : null;
  const withPoster = found && found.posterPath ? found : null;
  const link = query ? `${SITE}/i/title/?m=${query.media}&id=${query.id}` : `${SITE}/i/title/`;
  const open = query ? `calledit://title/${query.media}/${query.id}` : null;

  const card = withPoster
    ? {
        title: cardTitle(withPoster.title, withPoster.year),
        description: CARD_LINE,
        image: `${POSTER_BASE}${POSTER_SIZE}${withPoster.posterPath}`,
        imageWidth: null,
        imageHeight: null,
        imageAlt: `Poster for ${withPoster.title}`,
      }
    : GENERIC;

  const banner = query
    ? `app-id=${APP_ID}, app-argument=${link}`
    : `app-id=${APP_ID}`;

  let body;
  if (!query) {
    body = `
  <section id="missing">
    <p><strong>That link isn't complete.</strong> Ask your friend to share it again from the title's screen.</p>
    <p><a class="btn secondary" href="/">Go to the front page</a></p>
  </section>`;
  } else {
    const named = found
      ? `A friend shared <strong>${escapeHTML(cardTitle(found.title, found.year))}</strong> from Called It`
      : `<strong>A friend shared a movie or series from Called It</strong>`;
    const poster = withPoster
      ? `
    <img class="poster" src="${escapeHTML(POSTER_BASE + PAGE_POSTER_SIZE + withPoster.posterPath)}" width="114" height="171" alt="">`
      : '';
    body = `
  <section id="invite">
    <div class="shared">${poster}
      <p>${named} — an app for iPhone and iPad, made for awards season. Open it in Called It to see the details and add it to your list.</p>
    </div>
    <div class="card">
      <h2>Already have the app?</h2>
      <p>Tap below and the app will open the title.</p>
      <p><a id="open" class="btn" href="${escapeHTML(open)}">Open in Called It</a></p>
    </div>
    <div class="card">
      <h2>Not installed yet?</h2>
      <p>Install Called It, sign in with Apple, pick a username — then come back and tap this link again.</p>
      <p><a class="badge" href="https://apps.apple.com/app/id${APP_ID}"><img src="/app-store-badge.svg" width="144" height="48" alt="Download on the App Store"></a></p>
    </div>
  </section>`;
  }

  const imageSize = card.imageWidth
    ? `
  <meta property="og:image:width" content="${card.imageWidth}">
  <meta property="og:image:height" content="${card.imageHeight}">`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(card.title)}</title>
  <meta name="description" content="${escapeHTML(card.description)}">
  <meta name="theme-color" content="#13140E">
  <link rel="icon" type="image/png" href="/icon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="apple-itunes-app" content="${escapeHTML(banner)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Called It">
  <meta property="og:title" content="${escapeHTML(card.title)}">
  <meta property="og:description" content="${escapeHTML(card.description)}">
  <meta property="og:image" content="${escapeHTML(card.image)}">${imageSize}
  <meta property="og:image:alt" content="${escapeHTML(card.imageAlt)}">
  <meta property="og:url" content="${escapeHTML(link)}">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    :root {
      --bg: #13140E; --surface: #1E1F18; --surface2: #272820;
      --text: #ECEEE4; --text2: #AAABA2; --text3: #7F8078;
      --accent: #C2E23C; --ink: #171B08;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: var(--bg); color: var(--text);
      font: 17px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif; }
    main { max-width: 560px; margin: 0 auto; padding: 56px 20px 64px; }
    .mark { display: block; width: 72px; height: 72px; margin-bottom: 28px; }
    h1 { font-size: 40px; line-height: 1.1; margin: 0 0 8px; letter-spacing: -0.01em; }
    .tag { color: var(--text2); font-size: 20px; margin: 0 0 32px; }
    p { margin: 0 0 16px; color: var(--text2); }
    p strong { color: var(--text); font-weight: 600; }
    .shared { display: flex; gap: 20px; align-items: flex-start; }
    .poster { flex: none; width: 114px; height: 171px; border-radius: 10px; object-fit: cover; background: var(--surface); }
    .card { background: var(--surface); border-radius: 16px; padding: 20px; margin: 28px 0; }
    .card h2 { font-size: 17px; margin: 0 0 8px; color: var(--text); }
    .card p { margin: 0 0 14px; }
    .card p:last-child { margin: 0; }
    .btn { display: inline-block; background: var(--accent); color: var(--ink); font-weight: 600;
      text-decoration: none; padding: 14px 22px; border-radius: 12px; }
    .btn.secondary { background: var(--surface2); color: var(--text); }
    .muted { color: var(--text3); font-size: 14px; }
    .badge { display: inline-block; }
    .badge img { display: block; height: 48px; width: auto; }
    footer { margin-top: 48px; color: var(--text3); font-size: 13px; }
  </style>
</head>
<body>
<main>
  <img class="mark" src="/icon.png" width="72" height="72" alt="">
  <h1>Called It</h1>
  <p class="tag">Track the season with friends.</p>
${body}

  <footer>
    This product uses the TMDB API but is not endorsed or certified by TMDB.<br>
    Apple, the Apple logo, iPhone, and iPad are trademarks of Apple Inc., registered in the U.S. and other countries and regions. App Store is a service mark of Apple Inc.<br>
    © Dalcor Software
  </footer>
</main>
</body>
</html>
`;

  const cache = query && result && result.kind === 'error' ? CACHE_SHORT : CACHE_LONG;
  return { html, cache };
}

// -------------------------------------------------------------- handler

// (req, res) in Vercel's Node signature; `deps` lets the test inject fetch and the token.
async function handle(req, res, deps) {
  const { fetch: doFetch = globalThis.fetch, token = process.env.TMDB_READ_ACCESS_TOKEN } = deps || {};
  let page;
  try {
    const url = new URL(req.url || '/', SITE);
    const query = parseQuery(url.searchParams);
    const result = query ? await lookup(query, { fetch: doFetch, token }) : null;
    page = render(query, result);
  } catch {
    page = render(null, null);
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', page.cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(req.method === 'HEAD' ? '' : page.html);
}

module.exports = (req, res) => handle(req, res);
module.exports.handle = handle;
module.exports.render = render;
module.exports.lookup = lookup;
module.exports.parseQuery = parseQuery;
module.exports.cardTitle = cardTitle;
module.exports.CARD_LINE = CARD_LINE;
module.exports.CACHE_LONG = CACHE_LONG;
module.exports.CACHE_SHORT = CACHE_SHORT;
