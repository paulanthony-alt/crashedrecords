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
    featuredRelease: '',         // slug of the release to feature in "Now floating" and load in the player (empty = first release)
    currency: 'USD',
    shipping: { flat: 6, freeOver: 75 }
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
