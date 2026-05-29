/**
 * Pure composition: takes resolved sources, returns stable HTML + validation report.
 * No I/O — fully unit-testable.
 */

const { parseHotelPage } = require('./parser');

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
