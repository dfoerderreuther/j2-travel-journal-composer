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
