/**
 * BYOM composer action.
 *
 * Reads 3 sources for a given destination:
 *   1. /{destination}.plain.html  — journal narrative (Content A)
 *   2. /{destination}-hotels.json — ordered hotel ID list
 *   3. /hotels/{id}.plain.html    — per-hotel authored pages
 *
 * Composes final HTML and writes to DA at /composed/{destination}.
 *
 * Params:
 *   destination  — e.g. "greece" or "crete" (required)
 *   DA_ORG, DA_SITE, DA_API_BASE, EDS_PREVIEW_TOKEN
 */

const { fetchJournalPage, fetchHotelIds, fetchAllHotelPages } = require('./sources');
const { composeHtml } = require('./composer');

async function main(params) {
  const { destination, DA_API_BASE, DA_ORG, DA_SITE, EDS_PREVIEW_TOKEN } = params;

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

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  };
}

module.exports = { main };
