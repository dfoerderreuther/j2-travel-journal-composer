/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 253
(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Pure composition: takes resolved sources, returns stable HTML + validation report.
 * No I/O — fully unit-testable.
 */

const { parseHotelPage } = __webpack_require__(812);

function absolutifyUrls(html, origin) {
  return html
    .replace(/src="(\.\/[^"]*)"/g, (_, p) => `src="${origin}/${p.slice(2)}"`)
    .replace(/srcset="(\.\/[^"]*)"/g, (_, p) => `srcset="${origin}/${p.slice(2)}"`)
    .replace(/href="(\.\/[^"]*)"/g, (_, p) => `href="${origin}/${p.slice(2)}"`);
}

function composeHtml({ destination, journalHtml, hotelIds, hotelPages, org, site }) {
  const edsOrigin = `https://main--${site || 'j2-travel-journal'}--${org || 'dfoerderreuther'}.aem.page`;
  const fixedJournalHtml = absolutifyUrls(journalHtml, edsOrigin);
  const missingIds = hotelIds.filter((id) => !hotelPages[id]);

  const hotelCardsHtml = hotelIds
    .filter((id) => hotelPages[id])
    .map((id) => renderHotelCard(parseHotelPage(hotelPages[id], id, `${edsOrigin}/hotels/`)))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${edsOrigin}/styles/fonts.css">
  <link rel="stylesheet" href="${edsOrigin}/blocks/hotel-list/hotel-list.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: adobe-clean, 'Trebuchet MS', sans-serif; color: #1a1a1a; background: #f9f9f7; }
    header { background: #1a1a1a; padding: 1rem 2rem; position: sticky; top: 0; z-index: 10; }
    header a { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em; }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* journal */
    .journal-content { background: #fff; border-radius: 12px; padding: 2.5rem; margin-bottom: 3rem; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .journal-content picture { display: block; margin: 1.5rem 0; }
    .journal-content img { width: 100%; max-height: 480px; object-fit: cover; border-radius: 8px; }
    .journal-content h1 { font-size: 2.5rem; margin: 0 0 1.25rem; line-height: 1.2; }
    .journal-content p { font-size: 1.1rem; line-height: 1.75; color: #444; max-width: 72ch; margin: 0 0 1rem; }

    /* hotel grid */
    h2.hotels-heading { font-size: 1.75rem; margin: 0 0 1.5rem; }
    .hotel-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .hotel-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); display: flex; flex-direction: column; transition: box-shadow .2s; }
    .hotel-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.13); }
    .hotel-card > img { width: 100%; height: 220px; object-fit: cover; display: block; }
    .hotel-card-body { padding: 1.25rem 1.5rem 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .hotel-card-body h2 { font-size: 1.2rem; margin: 0 0 .25rem; }
    .hotel-location { font-size: .875rem; color: #777; margin: 0 0 .75rem; }
    .hotel-description { font-size: .9rem; line-height: 1.6; color: #555; margin: 0 0 1rem; flex: 1; }
    .hotel-meta { display: flex; align-items: center; gap: 1rem; margin-top: auto; }
    .hotel-rating { color: #e8a020; font-size: 1rem; letter-spacing: .05em; }
    .hotel-price { font-size: .95rem; font-weight: 600; color: #1a1a1a; margin-left: auto; }

    /* footer */
    footer { background: #1a1a1a; color: #999; text-align: center; padding: 1.5rem; font-size: .875rem; margin-top: 4rem; }
  </style>
</head>
<body>
  <header><a href="${edsOrigin}/">Travel Journal</a></header>
  <main>
    <div class="journal-content">
      ${fixedJournalHtml}
    </div>
    <div class="hotels-heading-section">
      <h2>Recommended Hotels</h2>
    </div>
    <div class="hotel-list">
      ${hotelCardsHtml || '<p>No hotels available for this destination.</p>'}
    </div>
  </main>
  <footer><p>© 2026 Travel Journal</p></footer>
</body>
</html>`;

  return { html, validation: { missingIds } };
}

function renderHotelCard(hotel) {
  const { id, name, description, location, image, imageAlt, rating, priceRange } = hotel;
  const stars = renderStars(rating);

  return `<article class="hotel-card" data-hotel-id="${esc(id)}">
  ${image ? `<img src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy">` : ''}
  <div class="hotel-card-body">
    <h2>${esc(name)}</h2>
    ${location ? `<p class="hotel-location">${esc(location)}</p>` : ''}
    ${description ? `<p class="hotel-description">${esc(description)}</p>` : ''}
    <div class="hotel-meta">
      ${rating ? `<span class="hotel-rating" aria-label="Rating: ${rating} out of 5">${stars}</span>` : ''}
      ${priceRange ? `<span class="hotel-price">${esc(priceRange)}</span>` : ''}
    </div>
  </div>
</article>`;
}

function renderStars(rating) {
  const full = Math.floor(Math.max(0, Math.min(5, rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { composeHtml };


/***/ },

/***/ 323
(module, __unused_webpack_exports, __webpack_require__) {

/**
 * BYOM composer action.
 *
 * Reads 3 sources for a given destination:
 *   1. /{destination}.plain.html  — journal narrative (Content A)
 *   2. /{destination}-hotels.json — ordered hotel ID list
 *   3. /hotels/{id}.plain.html    — per-hotel authored pages
 *
 * Composes final HTML. If HLX_ADMIN_TOKEN or DA_WRITE_TOKEN are present,
 * writes to DA at /composed/{destination} and triggers EDS preview.
 *
 * Params:
 *   destination   — e.g. "greece" or "crete" (required)
 *   DA_ORG, DA_SITE, DA_API_BASE
 *   HLX_ADMIN_TOKEN — admin.hlx.page auth (x-auth-token)
 *   DA_WRITE_TOKEN  — admin.da.live IMS Bearer token for source writes
 */

const { fetchJournalPage, fetchHotelIds, fetchAllHotelPages } = __webpack_require__(517);
const { composeHtml } = __webpack_require__(253);
const { triggerPreview } = __webpack_require__(795);

async function main(params) {
  const { destination, DA_API_BASE, DA_ORG, DA_SITE, HLX_ADMIN_TOKEN, DA_WRITE_TOKEN } = params;

  if (!destination) {
    return { statusCode: 400, body: { error: 'destination param required (e.g. "greece")' } };
  }
  if (!DA_ORG || !DA_SITE) {
    return { statusCode: 400, body: { error: 'DA_ORG and DA_SITE required' } };
  }

  const ctx = { org: DA_ORG, site: DA_SITE };

  const [journalHtml, hotelIds] = await Promise.all([
    fetchJournalPage({ ...ctx, destination }),
    fetchHotelIds({ ...ctx, destination }),
  ]);

  const hotelPages = await fetchAllHotelPages({ ...ctx, hotelIds });

  const { html, validation } = composeHtml({ destination, journalHtml, hotelIds, hotelPages, org: DA_ORG, site: DA_SITE });

  if (validation.missingIds.length > 0) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing hotel pages', missingIds: validation.missingIds }),
    };
  }

  if (HLX_ADMIN_TOKEN || DA_WRITE_TOKEN) {
    const previewUrl = await triggerPreview({
      apiBase: DA_API_BASE || 'https://admin.da.live',
      org: DA_ORG,
      site: DA_SITE,
      hlxAdminToken: HLX_ADMIN_TOKEN,
      daWriteToken: DA_WRITE_TOKEN,
      destination,
      html,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        previewUrl,
        hotelsResolved: hotelIds.length,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  };
}

module.exports = { main };


/***/ },

/***/ 812
(module) {

/**
 * Parses a hotel .plain.html page into structured data using regex.
 * No external deps — works in AppBuilder's webpack bundle.
 *
 * Expected DA document structure:
 *   <h1>Hotel Name</h1>
 *   <p><em>Location, Country</em></p>
 *   <img src="..." alt="...">
 *   <p>Description...</p>
 *   <div class="hotel-details"> EDS block with Rating and Price Range rows </div>
 */

function tag(name, html) {
  const m = html.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1].trim() : '';
}

function attr(name, html) {
  const m = html.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return m ? m[1] : '';
}

function resolveUrl(src, baseUrl) {
  if (!src || src.startsWith('http')) return src;
  if (src.startsWith('./')) return baseUrl + src.slice(2);
  if (src.startsWith('/')) return baseUrl.replace(/\/[^/]*\/?$/, '') + src;
  return baseUrl + src;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '').trim());
}

function parseMetadataBlock(html) {
  const meta = {};
  const blockStart = html.indexOf('<div class="hotel-details">');
  if (blockStart === -1) return meta;
  const section = html.slice(blockStart);
  const rowRegex = /<div>\s*<div>([^<]+)<\/div>\s*<div>([^<]+)<\/div>\s*<\/div>/g;
  let match;
  while ((match = rowRegex.exec(section)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '');
    meta[key] = match[2].trim();
  }
  return meta;
}

function parseHotelPage(html, hotelId, baseUrl = '') {
  const name = stripTags(tag('h1', html)) || hotelId;

  const firstEm = html.match(/<em>([\s\S]*?)<\/em>/i);
  const location = firstEm ? stripTags(firstEm[1]) : '';

  const imgMatch = html.match(/<img([^>]*)>/i);
  const rawSrc = imgMatch ? attr('src', imgMatch[0]) : '';
  const image = resolveUrl(rawSrc, baseUrl);
  const imageAlt = imgMatch ? attr('alt', imgMatch[0]) : name;

  // collect all <p> text, skip the location line
  const paragraphs = [];
  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of pMatches) {
    const text = stripTags(m[1]).trim();
    if (text && text !== location) paragraphs.push(text);
  }

  const meta = parseMetadataBlock(html);

  return {
    id: hotelId,
    name,
    location,
    image,
    imageAlt,
    description: paragraphs.join(' '),
    rating: Number(meta['rating'] || 0),
    priceRange: meta['pricerange'] || '',
  };
}

module.exports = { parseHotelPage };


/***/ },

/***/ 795
(module) {

/**
 * Two-lane write-back:
 *   DA lane  — PUT composed HTML to admin.da.live (DA_WRITE_TOKEN, IMS Bearer)
 *   EDS lane — POST preview trigger to admin.hlx.page (HLX_ADMIN_TOKEN, x-auth-token)
 *
 * Each lane is skipped silently if its token is absent.
 * Returns the preview URL when the EDS lane ran, otherwise null.
 */
async function triggerPreview({ apiBase, org, site, hlxAdminToken, daWriteToken, destination, html }) {
  const path = `/composed/${destination}`;

  if (daWriteToken) {
    const putUrl = `${apiBase}/source/${org}/${site}${path}.html`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/html',
        Authorization: `Bearer ${daWriteToken}`,
      },
      body: html,
    });
    if (!putRes.ok) {
      throw new Error(`DA write failed: ${putRes.status} ${putUrl}`);
    }
  }

  if (hlxAdminToken) {
    const previewUrl = `https://admin.hlx.page/preview/${org}/${site}/main${path}`;
    const previewRes = await fetch(previewUrl, {
      method: 'POST',
      headers: { 'x-auth-token': hlxAdminToken },
    });
    if (!previewRes.ok) {
      throw new Error(`EDS preview trigger failed: ${previewRes.status}`);
    }
    return `https://main--${site}--${org}.aem.page${path}`;
  }

  return null;
}

module.exports = { triggerPreview };


/***/ },

/***/ 517
(module) {

const edsBase = ({ org, site }) => `https://main--${site}--${org}.aem.page`;

async function fetchJournalPage({ org, site, destination }) {
  const url = `${edsBase({ org, site })}/${destination}.plain.html`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Journal page fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function fetchHotelIds({ org, site, destination }) {
  const url = `${edsBase({ org, site })}/${destination}-hotels.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hotel ID list fetch failed: ${res.status} ${url}`);
  const json = await res.json();
  return (json.data || []).map((row) => row.id || row.ID).filter(Boolean);
}

async function fetchHotelPage({ org, site, hotelId }) {
  const url = `${edsBase({ org, site })}/hotels/${hotelId}.plain.html`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hotel page fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function fetchAllHotelPages({ org, site, hotelIds }) {
  const pages = await Promise.all(
    hotelIds.map((id) => fetchHotelPage({ org, site, hotelId: id }))
  );
  return Object.fromEntries(hotelIds.map((id, i) => [id, pages[i]]));
}

module.exports = { fetchJournalPage, fetchHotelIds, fetchAllHotelPages };


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(323);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;