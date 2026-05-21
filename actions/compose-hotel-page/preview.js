/**
 * Writes composed HTML to DA at /composed/{destination}
 * then triggers EDS preview for that path.
 */
async function triggerPreview({ apiBase, org, site, token, destination, html }) {
  const path = `/composed/${destination}`;
  const putUrl = `${apiBase}/source/${org}/${site}${path}.html`;

  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/html',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: html,
  });

  if (!putRes.ok) {
    throw new Error(`DA write failed: ${putRes.status} ${putUrl}`);
  }

  const previewUrl = `https://admin.hlx.page/preview/${org}/${site}/main${path}`;
  const previewRes = await fetch(previewUrl, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!previewRes.ok) {
    throw new Error(`EDS preview trigger failed: ${previewRes.status}`);
  }
}

module.exports = { triggerPreview };
