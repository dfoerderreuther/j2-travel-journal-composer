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
