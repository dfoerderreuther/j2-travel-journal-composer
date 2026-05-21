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
    body { margin: 0; font-family: adobe-clean, 'Trebuchet MS', sans-serif; color: #1a1a1a; background: #fff; }
    header { background: #1a1a1a; padding: 1rem 2rem; }
    header a { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em; }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .journal-content img { width: 100%; max-height: 480px; object-fit: cover; border-radius: 8px; margin: 1.5rem 0; }
    .journal-content h1 { font-size: 2.5rem; margin: 0 0 1rem; line-height: 1.2; }
    .journal-content p { font-size: 1.1rem; line-height: 1.7; color: #333; max-width: 72ch; margin: 0 0 1rem; }
    h2.hotels-heading { font-size: 1.5rem; margin: 2.5rem 0 1rem; border-top: 2px solid #eee; padding-top: 2rem; }
    footer { background: #f5f5f5; text-align: center; padding: 1.5rem; color: #666; font-size: 0.875rem; margin-top: 4rem; }
  </style>
</head>
<body>
  <header><a href="${edsOrigin}/">Travel Journal</a></header>
  <main>
    <div class="journal-content">
      ${fixedJournalHtml}
    </div>
    <h2 class="hotels-heading">Our hotel picks</h2>
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
