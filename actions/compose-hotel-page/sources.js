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
