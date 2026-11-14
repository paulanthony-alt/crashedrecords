/* ==========================================================================
   CRASHED RECORDS — SITE CONTENT
   --------------------------------------------------------------------------
   Every artist, release, show, product and link on the site comes from this
   file. Edit it and reload — no build step.

   NOTE: the names, titles, dates and prices below are SAMPLE CONTENT so the
   site works end to end. Replace them with the label's real catalogue.

   Artwork:  leave `cover` / `photo` empty to use the generated liquid-marble
             art (tinted by `hue`), or set a path like "assets/img/cr-008.jpg".
   Audio:    leave a track's `src` empty to play the built-in synth demo
             loop, or set a path/URL to an mp3 ("assets/audio/cr-008-01.mp3").
   Links:    empty strings show a "coming soon" notice instead of a dead link.
   ========================================================================== */

window.CR_DATA = {
  label: {
    name: 'Crashed Records',
    tagline: 'Shit that makes you float',
    blurb: 'Psychedelic hip hop & rap from the other side of the sky. Put your headphones on and let go.',
    emails: {
      general: 'hello@crashedrecords.com',
      demos: 'demos@crashedrecords.com',
      booking: 'booking@crashedrecords.com',
      press: 'press@crashedrecords.com'
    },
    socials: {
      instagram: '',
      tiktok: '',
      youtube: '',
      spotify: ''
    },
    featuredRelease: 'cr-008',   // shown in "Now floating" + loaded in the player
    currency: 'USD',
    shipping: { flat: 6, freeOver: 75 }
  },

  /* ---------- About page (#/about) ---------- */
  about: {
    headline: 'Born to <span class="accent">float</span>',   // HTML allowed for the accent
    intro: 'Crashed Records is a brand-new independent label for psychedelic hip hop & rap: records built for headphones, late nights and leaving the ground for a while.',
    story: [
      'Crashed started with a simple idea: the strangest, most immersive corners of rap deserve a home that treats them like art, not content. Hazy loops, warped samples, voices that drift in and out of focus. Music that makes you float.',
      'We are just getting started. That means a small roster, a lot of care, and room for artists to shape what this label becomes. Every release gets real attention, from the mix to the artwork to the pressing.',
      'If you make music that sounds like it came from the other side of the sky, we want to hear it.'
    ],
    pillars: [
      { title: 'Artist first', text: 'Fair deals, clear communication, and creative control that stays with the people making the music.' },
      { title: 'Sound over trends', text: 'We sign records we would play on repeat, not whatever the algorithm wants this week.' },
      { title: 'Built from zero', text: 'A young, independent label growing one release at a time, with our community along for the ride.' }
    ]
  },

  /* ---------- Founder ---------- */
  founder: {
    name: 'Eric Seides',
    role: 'Founder',
    photo: 'assets/img/eric-seides.jpg',
    bio: [
      'Eric founded Crashed Records to build the label he always wanted to exist: a home for psychedelic hip hop and rap that takes the music, and the artists behind it, seriously.',
      'He runs the label day to day, from A&R and artist development to releases and shows. If you want to work with Crashed, he is the person to talk to.'
    ],
    // PLACEHOLDER: replace with Eric's real address before launch.
    email: 'eric@crashedrecords.com',
    socials: { instagram: '' }
  },

  artists: [
    {
      slug: 'lune-vega', name: 'Lune Vega', city: 'Atlanta, GA',
      tags: ['Psychedelic rap', 'Cloud rap', 'Lo-fi'],
      bio: [
        'Lune Vega raps like she is narrating a dream she has not woken up from yet. Tape-warped loops, half-time drums and verses that drift in and out of focus.',
        'Recorded mostly between 2 and 5 a.m., her records are built for headphones and long night drives.'
      ],
      photo: '', hue: 40, rot: 47,
      socials: { instagram: '', youtube: '', spotify: '' }
    },
    {
      slug: 'kosmo-kid', name: 'Kosmo Kid', city: 'Detroit, MI',
      tags: ['Psych hop', 'Boom bap', 'Space funk'],
      bio: [
        'Kosmo Kid digs through dusty space-funk records and flips them into hard-swinging boom bap from orbit.',
        'Think basement cypher meets planetarium show.'
      ],
      photo: '', hue: -40, rot: 94,
      socials: { instagram: '', youtube: '', spotify: '' }
    },
    {
      slug: 'halo-drip', name: 'Halo Drip', city: 'Los Angeles, CA',
      tags: ['Cloud rap', 'Trap', 'Ambient'],
      bio: [
        'Halo Drip makes trap that melts. 808s under a sky of reverb, hooks you hum for a week.',
        'A producer first, Halo builds every beat from field recordings of the Pacific.'
      ],
      photo: '', hue: 80, rot: 141,
      socials: { instagram: '', youtube: '', spotify: '' }
    },
    {
      slug: 'saint-static', name: 'Saint Static', city: 'Houston, TX',
      tags: ['Chopped & screwed', 'Psych rap', 'Noise'],
      bio: [
        'Slowed, pitched down and blown out. Saint Static takes the Houston tradition somewhere stranger.',
        'Live shows are loud, dark and strobe-lit.'
      ],
      photo: '', hue: 120, rot: 188,
      socials: { instagram: '', youtube: '', spotify: '' }
    },
    {
      slug: 'velvet-orbit', name: 'Velvet Orbit', city: 'London, UK',
      tags: ['Jazz rap', 'Neo-psych', 'Dream hop'],
      bio: [
        'A duo of a rapper and a flautist making soft, swirling jazz rap for the comedown.',
        'Their debut EP was written over one rainy month on a houseboat.'
      ],
      photo: '', hue: -80, rot: 235,
      socials: { instagram: '', youtube: '', spotify: '' }
    }
  ],

  releases: [
    {
      slug: 'cr-008', no: 'CR—008', title: 'Lucid Static', artist: 'lune-vega', kind: 'Album',
      date: '2026-10-24', hue: -40, rot: 120, cover: '',
      description: 'Ten tracks recorded half-asleep. A record about the moment right before you drift off — where everything is too bright and too quiet at once.',
      tracks: [
        { title: 'Lift Off (Intro)', dur: '1:48' },
        { title: 'Purple Hours', dur: '3:21', feat: 'Kosmo Kid' },
        { title: 'Gravity Is A Rumour', dur: '2:58' },
        { title: 'Halo Over Hwy 85', dur: '3:34' },
        { title: 'Neon Psalms', dur: '3:05', feat: 'Halo Drip' },
        { title: 'Soft Landing', dur: '2:41' },
        { title: 'Comet Tail', dur: '3:12' },
        { title: '4AM Choir', dur: '1:30', note: 'Interlude' },
        { title: 'Marble Sky', dur: '3:47' },
        { title: 'Float On, Crash Down', dur: '4:02' }
      ],
      formats: [
        { name: 'Vinyl LP', desc: 'Marbled purple pressing', price: 32 },
        { name: 'Cassette', desc: 'Limited run of 200', price: 14 },
        { name: 'Digital', desc: 'Lossless + MP3', price: 10, digital: true }
      ],
      credits: { produced: 'Lune Vega, Halo Drip', mixed: 'Dee Marrow', artwork: 'Studio Nebula' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-007', no: 'CR—007', title: 'Orbit Tapes Vol. 2', artist: 'kosmo-kid', kind: 'EP',
      date: '2026-07-11', hue: 0, rot: 40, cover: '',
      description: 'Five more space-funk flips from the basement observatory.',
      tracks: [
        { title: 'Re-Entry', dur: '2:44' },
        { title: 'Moon Boots', dur: '3:09' },
        { title: 'Satellite Soul', dur: '3:27', feat: 'Velvet Orbit' },
        { title: 'Zero G Cypher', dur: '2:52' },
        { title: 'Splashdown', dur: '3:15' }
      ],
      formats: [
        { name: 'Vinyl 12"', desc: 'Glow-in-the-dark pressing', price: 24 },
        { name: 'Cassette', desc: 'Limited run of 150', price: 12 },
        { name: 'Digital', desc: 'Lossless + MP3', price: 7, digital: true }
      ],
      credits: { produced: 'Kosmo Kid', mixed: 'Kosmo Kid', artwork: 'R. Okafor' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-006', no: 'CR—006', title: 'Pacific Drip', artist: 'halo-drip', kind: 'Single',
      date: '2026-05-02', hue: 80, rot: 200, cover: '',
      description: 'A one-track wave. Recorded on the beach at Point Dume, finished in a parked car.',
      tracks: [
        { title: 'Pacific Drip', dur: '3:38' },
        { title: 'Pacific Drip (Slowed)', dur: '4:24' }
      ],
      formats: [
        { name: 'Digital', desc: 'Lossless + MP3', price: 2, digital: true }
      ],
      credits: { produced: 'Halo Drip', mixed: 'Dee Marrow', artwork: 'Halo Drip' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-005', no: 'CR—005', title: 'Syrup Cathedral', artist: 'saint-static', kind: 'Album',
      date: '2026-02-20', hue: 120, rot: 300, cover: '',
      description: 'Screwed hymns for a city that never cools down.',
      tracks: [
        { title: 'Processional', dur: '2:10' },
        { title: 'Candy Paint Halo', dur: '4:12' },
        { title: 'Slow Motion Rapture', dur: '3:48', feat: 'Lune Vega' },
        { title: 'Static Saints', dur: '3:30' },
        { title: 'Third Coast Ghosts', dur: '4:05' },
        { title: 'Pitch Black Choir', dur: '1:42', note: 'Interlude' },
        { title: 'Molasses', dur: '3:56' },
        { title: 'Benediction (Chopped)', dur: '5:01' }
      ],
      formats: [
        { name: 'Vinyl LP', desc: 'Double LP, cough-syrup purple', price: 36 },
        { name: 'Cassette', desc: 'Limited run of 200', price: 14 },
        { name: 'Digital', desc: 'Lossless + MP3', price: 10, digital: true }
      ],
      credits: { produced: 'Saint Static, DJ Viscous', mixed: 'Dee Marrow', artwork: 'Studio Nebula' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-004', no: 'CR—004', title: 'Houseboat Hymns', artist: 'velvet-orbit', kind: 'EP',
      date: '2025-11-07', hue: -80, rot: 160, cover: '',
      description: 'Soft-focus jazz rap written on the water.',
      tracks: [
        { title: 'Low Tide', dur: '2:58' },
        { title: 'Flute For The Moon', dur: '3:24' },
        { title: 'Canal Lights', dur: '3:02' },
        { title: 'Drifting, Mostly', dur: '3:40' }
      ],
      formats: [
        { name: 'Vinyl 12"', desc: 'Clear with purple swirl', price: 24 },
        { name: 'Digital', desc: 'Lossless + MP3', price: 7, digital: true }
      ],
      credits: { produced: 'Velvet Orbit', mixed: 'J. Amari', artwork: 'Velvet Orbit' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-003', no: 'CR—003', title: 'Comet Season', artist: 'lune-vega', kind: 'Single',
      date: '2025-08-15', hue: 160, rot: 80, cover: '',
      description: 'The single that started the float.',
      tracks: [
        { title: 'Comet Season', dur: '3:16' },
        { title: 'Comet Season (Instrumental)', dur: '3:16' }
      ],
      formats: [
        { name: 'Vinyl 7"', desc: 'Lilac 7-inch', price: 12 },
        { name: 'Digital', desc: 'Lossless + MP3', price: 2, digital: true }
      ],
      credits: { produced: 'Lune Vega', mixed: 'Dee Marrow', artwork: 'Studio Nebula' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-002', no: 'CR—002', title: 'Orbit Tapes Vol. 1', artist: 'kosmo-kid', kind: 'EP',
      date: '2025-04-04', hue: 40, rot: 260, cover: '',
      description: 'The first transmission from the basement observatory.',
      tracks: [
        { title: 'Countdown', dur: '1:55' },
        { title: 'Funk From Saturn', dur: '3:11' },
        { title: 'Crater Bounce', dur: '2:49' },
        { title: 'Mission Control', dur: '3:22' }
      ],
      formats: [
        { name: 'Cassette', desc: 'Sold out — digital only', price: 12, soldOut: true },
        { name: 'Digital', desc: 'Lossless + MP3', price: 6, digital: true }
      ],
      credits: { produced: 'Kosmo Kid', mixed: 'Kosmo Kid', artwork: 'R. Okafor' },
      links: { spotify: '', apple: '', bandcamp: '' }
    },
    {
      slug: 'cr-001', no: 'CR—001', title: 'First Crash', artist: 'halo-drip', kind: 'Single',
      date: '2024-12-06', hue: -120, rot: 20, cover: '',
      description: 'Catalogue number one. Where it all crashed.',
      tracks: [
        { title: 'First Crash', dur: '3:03', feat: 'Saint Static' }
      ],
      formats: [
        { name: 'Digital', desc: 'Lossless + MP3', price: 2, digital: true }
      ],
      credits: { produced: 'Halo Drip', mixed: 'Halo Drip', artwork: 'Studio Nebula' },
      links: { spotify: '', apple: '', bandcamp: '' }
    }
  ],

  // Past dates are hidden automatically.
  shows: [
    { date: '2026-11-28', city: 'Atlanta', venue: 'The Masquerade', artists: ['lune-vega', 'halo-drip'], tickets: '' },
    { date: '2026-12-05', city: 'Detroit', venue: 'El Club', artists: ['kosmo-kid'], tickets: '' },
    { date: '2026-12-12', city: 'Houston', venue: 'White Oak Music Hall', artists: ['saint-static'], tickets: '' },
    { date: '2026-12-19', city: 'Los Angeles', venue: 'The Echo', artists: ['halo-drip', 'lune-vega'], tickets: '' },
    { date: '2027-01-23', city: 'London', venue: 'Jazz Cafe', artists: ['velvet-orbit'], tickets: '' },
    { date: '2027-02-14', city: 'New York', venue: 'Crashed Label Night — Elsewhere', artists: ['lune-vega', 'kosmo-kid', 'saint-static'], tickets: '' },
    { date: '2027-03-06', city: 'Chicago', venue: 'Sleeping Village', artists: ['kosmo-kid', 'velvet-orbit'], tickets: '' }
  ],

  videos: [
    { title: 'Purple Hours', artist: 'lune-vega', youtubeId: '', hue: -30 }
  ],

  merch: [
    { id: 'float-tee', name: 'Float Tee', tag: 'New', price: 30, sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: 'Heavyweight black tee, chrome logo front.', image: '', hue: 0 },
    { id: 'crash-hoodie', name: 'Crash Site Hoodie', tag: 'Limited', price: 65, sizes: ['S', 'M', 'L', 'XL'], desc: 'Garment-dyed violet hoodie, puff print.', image: '', hue: 60 },
    { id: 'lucid-static-vinyl', name: 'Lucid Static Vinyl', tag: 'Pre-order', price: 32, release: 'cr-008', desc: 'Marbled purple LP. Ships December.', image: '', hue: -40 },
    { id: 'sparkle-beanie', name: 'Sparkle Beanie', tag: 'Restock', price: 25, desc: 'Ribbed knit, embroidered 4-point star.', image: '', hue: 120 },
    { id: 'slipmat', name: 'Marble Slipmat', tag: 'New', price: 18, desc: 'Felt slipmat with the liquid marble print.', image: '', hue: -80 },
    { id: 'sticker-pack', name: 'Sticker Pack', tag: 'Cheap trip', price: 6, desc: 'Eight holographic stickers.', image: '', hue: 160 }
  ]
};
