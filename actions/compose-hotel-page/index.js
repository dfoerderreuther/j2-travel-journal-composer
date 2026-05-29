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

const { fetchJournalPage, fetchHotelIds, fetchAllHotelPages } = require('./sources');
const { composeHtml } = require('./composer');
const { triggerPreview } = require('./preview');

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
