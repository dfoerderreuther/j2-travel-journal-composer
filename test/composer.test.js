const { composeHtml } = require('../actions/compose-hotel-page/composer');
const { parseHotelPage } = require('../actions/compose-hotel-page/parser');

const H101_HTML = `<div>
  <h1>Blue Bay Palace</h1>
  <p><em>Elounda, Crete, Greece</em></p>
  <img src="https://picsum.photos/seed/h101-hotel/800/500" alt="Blue Bay Palace beachfront">
  <p>Beachfront resort on the sheltered bay of Elounda with private beach access.</p>
  <p>The sea here is extraordinary — calm, clear, and warm from June through October.</p>
  <div class="hotel-details">
    <div><div>Rating</div><div>5</div></div>
    <div><div>Price Range</div><div>from £299/night</div></div>
  </div>
</div>`;

const H201_HTML = `<div>
  <h1>Acropolis View Suites</h1>
  <p><em>Monastiraki, Athens, Greece</em></p>
  <img src="https://picsum.photos/seed/h201-hotel/800/500" alt="Rooftop terrace with Acropolis view">
  <p>Wake up to the Parthenon. Rooftop terrace, best seat in Athens.</p>
  <div class="hotel-details">
    <div><div>Rating</div><div>4</div></div>
    <div><div>Price Range</div><div>from £189/night</div></div>
  </div>
</div>`;

const JOURNAL_HTML = `<div>
  <h1>Greece — Sun, History and the Aegean Sea</h1>
  <p>Few countries deliver as many versions of perfect as Greece does.</p>
</div>`;

describe('parseHotelPage', () => {
  test('extracts all fields from hotel page HTML', () => {
    const hotel = parseHotelPage(H101_HTML, 'h101');
    expect(hotel.id).toBe('h101');
    expect(hotel.name).toBe('Blue Bay Palace');
    expect(hotel.location).toBe('Elounda, Crete, Greece');
    expect(hotel.image).toContain('h101-hotel');
    expect(hotel.rating).toBe(5);
    expect(hotel.priceRange).toBe('from £299/night');
    expect(hotel.description).toContain('Beachfront resort');
  });

  test('falls back to hotelId as name when h1 missing', () => {
    const hotel = parseHotelPage('<div><p>no heading</p></div>', 'h999');
    expect(hotel.name).toBe('h999');
  });
});

describe('composeHtml', () => {
  const hotelPages = { h101: H101_HTML, h201: H201_HTML };

  test('renders hotels in ID order', () => {
    const { html, validation } = composeHtml({
      destination: 'greece',
      journalHtml: JOURNAL_HTML,
      hotelIds: ['h101', 'h201'],
      hotelPages,
    });
    expect(validation.missingIds).toHaveLength(0);
    expect(html.indexOf('h101')).toBeLessThan(html.indexOf('h201'));
    expect(html).toContain('Blue Bay Palace');
    expect(html).toContain('Acropolis View Suites');
  });

  test('includes journal content', () => {
    const { html } = composeHtml({
      destination: 'greece',
      journalHtml: JOURNAL_HTML,
      hotelIds: ['h101'],
      hotelPages,
    });
    expect(html).toContain('Few countries deliver');
  });

  test('reports missing hotel IDs', () => {
    const { validation } = composeHtml({
      destination: 'greece',
      journalHtml: JOURNAL_HTML,
      hotelIds: ['h101', 'h999'],
      hotelPages,
    });
    expect(validation.missingIds).toEqual(['h999']);
  });

  test('escapes HTML special chars in hotel fields', () => {
    const xssHtml = `<div><h1>Hotel &amp; "Suites" &lt;Test&gt;</h1><p><em>loc</em></p></div>`;
    const { html } = composeHtml({
      destination: 'greece',
      journalHtml: '',
      hotelIds: ['xss'],
      hotelPages: { xss: xssHtml },
    });
    // JSDOM decodes entities, esc() re-encodes them once
    expect(html).toContain('Hotel &amp; &quot;Suites&quot; &lt;Test&gt;');
  });

  test('empty hotel list renders fallback message', () => {
    const { html, validation } = composeHtml({
      destination: 'crete',
      journalHtml: JOURNAL_HTML,
      hotelIds: [],
      hotelPages: {},
    });
    expect(validation.missingIds).toHaveLength(0);
    expect(html).toContain('No hotels available');
  });
});
