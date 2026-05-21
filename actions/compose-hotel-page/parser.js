/**
 * Parses a hotel .plain.html page into structured data using regex.
 * No external deps — works in AppBuilder's webpack bundle.
 *
 * Expected DA document structure:
 *   <h1>Hotel Name</h1>
 *   <p><em>Location, Country</em></p>
 *   <img src="..." alt="...">
 *   <p>Description...</p>
 *   <table> Metadata rows with Rating and Price Range </table>
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

function parseMetadataTable(html) {
  const meta = {};
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return meta;
  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi) || [];
  rows.forEach((row) => {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 2) {
      const key = stripTags(cells[0]).toLowerCase().replace(/\s+/g, '');
      const val = stripTags(cells[1]);
      meta[key] = val;
    }
  });
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

  const meta = parseMetadataTable(html);

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
