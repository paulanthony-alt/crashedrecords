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
      general: 'ericdanielseides@gmail.com',
      demos: 'ericdanielseides@gmail.com',
      booking: 'ericdanielseides@gmail.com',
      press: 'ericdanielseides@gmail.com'
    },
    socials: {
      instagram: '',
      tiktok: '',
      youtube: '',
      spotify: ''
    },
    // Background music: this track is the first in the player queue on every page. It starts when the intro closes.
    // Browsers only allow audio after a visitor action, so it starts on the visitor's first click or key press. Leave src empty to turn it off.
    backgroundMusic: { title: 'Cash Cow', src: 'assets/audio/cashcow.mp3' },
    featuredRelease: '',         // slug of the release to feature in "Now floating" and load in the player (empty = first release)
    currency: 'USD',
    shipping: { flat: 6, freeOver: 75 }
  },

  /* ---------- Site address and link previews ----------
     `url` is where the site lives (change it when you get your own domain; also
     update the og:url / og:image / canonical lines near the top of index.html).
     Link previews can't read the part after "#", so tools/build-share-pages.js
     writes a small page per artist and release into /share. After you have run
     it and committed the folder, set sharePages to true so the Share buttons
     use those pages. See the README. */
  site: {
    url: 'https://crashedrecords.com/',
    sharePages: false
  },

  /* ---------- Reactive visuals ----------
     How hard the music (mostly the bass and kick) moves the background:
     0 = calm, 1 = default, 2 = maximum. Visitors who ask for reduced motion never see it. */
  visuals: {
    intensity: 1
  },

  /* ---------- Social posts (home page) ----------
     Paste links to the label's latest TikTok / Instagram / YouTube posts and a
     "Follow the float" section appears on the home page. Empty = hidden.
     { platform: 'TikTok', url: 'https://...', caption: 'short text', thumb: 'assets/img/post-1.jpg' }
     `thumb` is optional (a marble tile is used without one). */
  social: {
    posts: []
  },

  /* ---------- Form delivery ----------
     Until `endpoint` is set, forms open the visitor's email app (they still
     work, but depend on the visitor having one set up).
     To receive submissions in your inbox (and keep a log of them), make a free
     form at Formspree (formspree.io), Formsubmit, Basin or similar, paste its
     URL below, and every contact / demo / "talk to Eric" form will post there.
     Any service that accepts a JSON POST works; `extra` is sent with every
     submission (for example { access_key: '...' } for Web3Forms). */
  forms: {
    endpoint: '',
    extra: {},
    minFillSeconds: 4,          // submissions faster than this are treated as bots
    cooldownSeconds: 20         // one submission per form type per visitor in this window
  },

  /* ---------- Drop alerts (newsletter) ----------
     Until `endpoint` is set, sign-ups are only saved in the visitor's own
     browser. To collect real emails, create a form/list at your email service
     and paste its subscribe URL here:
       format 'json'  - the service accepts a JSON POST with CORS (Buttondown API, ConvertKit, Beehiiv, most others)
       format 'form'  - classic HTML form POST (Mailchimp / Buttondown "embed" forms); sent without reading the reply
     `emailField` is the field name the service expects (usually 'email');
     `extra` is added to every sign-up (list IDs, tags, API keys that are safe to publish). */
  newsletter: {
    endpoint: '',
    format: 'json',
    emailField: 'email',
    extra: {}
  },

  /* ---------- "Founding roster" state ----------
     Shown on the home, Artists and Releases pages until real artists and
     releases are added below. Edit the words freely. */
  founding: {
    kicker: 'Now signing',
    headline: 'Founding<br><span class="accent">roster</span>',
    by: 'Psychedelic hip hop & trap · Underground & rising artists',
    text: 'Crashed is signing its first artists. If your sound is hazy, heavy and strange, built to make people float, send it over. Everything you submit goes straight to Eric.',
    slots: 4,
    firstRelease: 'The catalog starts with CR—001. The first drop is coming soon.'
  },

  /* ---------- How signing works (About page + Demos page) ----------
     Written to describe the process only. DRAFT: Eric should read every line and
     change anything that is not how he actually works. Deal terms (money,
     ownership, contract length) are deliberately NOT covered; add a question
     for those once he has decided them. */
  signing: {
    // Shown on the Get signed page and the About page. DRAFT: Eric should check these.
    lookingFor: [
      'Psychedelic hip hop and trap: hazy, heavy, strange',
      'Newer and underground artists. No following needed',
      'A sound of your own, not a copy of the charts',
      'Artists who think about the whole world: visuals, shows, the vibe'
    ],
    replyTime: '',              // for example 'within two weeks'. Leave empty to say nothing about timing.
    steps: [
      { title: 'Send your music', text: 'Use the form: two or three of your best tracks as private links, plus a few lines about you.' },
      { title: 'Eric listens', text: 'Every submission goes straight to Eric. He listens for sound, ideas and where you are headed.' },
      { title: 'We talk', text: 'If it is a fit, Eric reaches out to talk about your music and what you want from a label.' },
      { title: 'Make it official', text: 'If you both want to work together, the terms are set out clearly before anything is released.' }
    ],
    faq: [
      { q: 'What kind of music is Crashed looking for?', a: 'Psychedelic hip hop and trap: hazy, heavy, strange, built to make people float. Newer and underground artists are the focus.' },
      { q: 'Do I need a big following?', a: 'No. Crashed is built around newer and underground artists, so the music comes first.' },
      { q: 'What should I send?', a: 'Two or three of your best tracks as private streaming links (SoundCloud, Google Drive, Dropbox or an unlisted YouTube video), a short bio and your socials. Please do not attach audio files.' },
      { q: 'Will I hear back?', a: 'Eric reads submissions himself.{replyTime} If it is a fit, he will reach out.' },
      { q: 'Does sending music mean I am signed?', a: 'No. Submitting only lets Eric listen. Nothing is agreed until you both say so.' }
    ]
  },

  /* ---------- About page (#/about) ---------- */
  about: {
    headline: 'Born to <span class="accent">float</span>',   // HTML allowed for the accent (used when manifesto is empty)
    // The giant headline at the top of the About page: one entry per line, HTML allowed for the accent.
    manifesto: {
      kicker: '✦ About Crashed',
      lines: ['We sign the <span class="accent">strange</span> ones.', 'The hazy. The heavy.', 'The ones that make you <span class="accent">float</span>.']
    },
    intro: 'Crashed Records is a brand-new independent label for psychedelic hip hop & rap: records built for headphones, late nights and leaving the ground for a while.',
    story: [
      'Crashed started with a simple idea: the strangest, most immersive corners of rap deserve a home that treats them like art, not content. Hazy loops, warped samples, voices that drift in and out of focus. Music that makes you float.',
      'We are just getting started. That means a small roster, a lot of care, and room for artists to shape what this label becomes. Every release gets real attention, from the mix to the artwork to the pressing.',
      'If you make music that sounds like it came from the other side of the sky, we want to hear it.'
    ],
    // "The manifesto": big numbered statements under the headline.
    pillars: [
      { title: 'Sound over numbers', text: 'We sign records we would play on repeat. Followers, streams and trends come second.' },
      { title: 'Underground first', text: 'Crashed is built around newer and underground artists, the ones right before everyone else catches on.' },
      { title: 'Artist first', text: 'Clear communication, terms set out up front, and creative control that stays with the people making the music.' },
      { title: 'Built from zero', text: 'A young, independent label growing one release at a time, with our community along for the ride.' }
    ]
  },

  /* ---------- Founder ---------- */
  founder: {
    name: 'Eric Seides',
    role: 'Founder',
    photo: 'assets/img/eric-seides.jpg',
    bio: [
      'Eric is a producer first. He started Crashed Records to build the label he always wanted to exist: a home for psychedelic hip hop and trap that takes the music, and the artists behind it, seriously.',
      'He runs the label day to day, from finding artists and shaping their sound to releases and shows. If you want to work with Crashed, he is the person to talk to.'
    ],
    email: 'ericdanielseides@gmail.com',
    socials: { instagram: '' }
  },

  artists: [],

  releases: [],

  // Past dates are hidden automatically.
  shows: [],

  videos: [],

  merch: [
    { id: 'float-tee', name: 'Float Tee', tag: 'New', price: 30, sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: 'Heavyweight black tee, chrome logo front.', image: '', hue: 0 },
    { id: 'crash-hoodie', name: 'Crash Site Hoodie', tag: 'Limited', price: 65, sizes: ['S', 'M', 'L', 'XL'], desc: 'Garment-dyed violet hoodie, puff print.', image: '', hue: 60 },
    { id: 'sparkle-beanie', name: 'Sparkle Beanie', tag: 'Restock', price: 25, desc: 'Ribbed knit, embroidered 4-point star.', image: '', hue: 120 },
    { id: 'slipmat', name: 'Marble Slipmat', tag: 'New', price: 18, desc: 'Felt slipmat with the liquid marble print.', image: '', hue: -80 },
    { id: 'sticker-pack', name: 'Sticker Pack', tag: 'Cheap trip', price: 6, desc: 'Eight holographic stickers.', image: '', hue: 160 }
  ]
};
