/* ==========================================================================
   Crashed Records — app (router, views, cart, search, forms)
   Plain JS, no build step. Routes are hash-based (#/artists/lune-vega) so the
   site works on any static host and the player keeps playing between pages.
   ========================================================================== */
(function () {
  'use strict';

  const D = window.CR_DATA;
  if (D.founder) D.label.emails.founder = D.founder.email;
  const P = window.CRPlayer;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ------------------------------------------------------------------ utils */
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toSec = (d) => { const [m, s] = String(d || '0:00').split(':').map(Number); return (m || 0) * 60 + (s || 0); };
  const fmtTime = (sec) => { sec = Math.max(0, Math.floor(sec || 0)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: D.label.currency || 'USD' }).format(n);
  const pad2 = (n) => String(n).padStart(2, '0');
  const parseDate = (iso) => new Date(iso + 'T00:00:00');
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const fmtShow = (iso) => { const d = parseDate(iso), now = new Date(); return MONTHS[d.getMonth()] + ' ' + pad2(d.getDate()) + (d.getFullYear() !== now.getFullYear() ? " '" + String(d.getFullYear()).slice(2) : ''); };
  const fmtLong = (iso) => parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const year = (iso) => parseDate(iso).getFullYear();
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  const store = {
    get(k, d) { try { const v = localStorage.getItem('cr:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cr:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ------------------------------------------------------------------ data */
  const artists = D.artists.slice();
  const artistBy = Object.fromEntries(artists.map((a) => [a.slug, a]));
  const releases = D.releases.slice().sort((a, b) => b.date.localeCompare(a.date));
  const releaseBy = Object.fromEntries(releases.map((r) => [r.slug, r]));
  const merch = D.merch.slice();
  const merchBy = Object.fromEntries(merch.map((m) => [m.id, m]));

  releases.forEach((r) => {
    const a = artistBy[r.artist] || { name: 'Unknown', slug: '' };
    r.artistObj = a;
    r.trackObjs = r.tracks.map((t, i) => ({
      id: r.slug + '-' + (i + 1), n: pad2(i + 1), idx: i,
      title: t.title, dur: t.dur, seconds: toSec(t.dur), feat: t.feat || '', note: t.note || '', src: t.src || '',
      releaseSlug: r.slug, releaseTitle: r.title, artistName: a.name, artistSlug: a.slug,
      hue: r.hue, rot: r.rot, cover: r.cover
    }));
  });
  artists.forEach((a) => {
    a.releases = releases.filter((r) => r.artist === a.slug);
    // top tracks: the lead track of each release, then fill from the newest
    const lead = a.releases.map((r) => r.trackObjs.find((t) => !t.note && !/intro|instrumental/i.test(t.title)) || r.trackObjs[0]);
    const rest = a.releases.flatMap((r) => r.trackObjs).filter((t) => lead.indexOf(t) < 0 && !t.note);
    a.top = lead.concat(rest).slice(0, 5);
  });
  const allTracks = releases.flatMap((r) => r.trackObjs);
  const featured = releaseBy[D.label.featuredRelease] || releases[0];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const shows = D.shows.filter((s) => parseDate(s.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  const showArtists = (s) => s.artists.map((x) => artistBy[x]).filter(Boolean);

  /* ------------------------------------------------------------------ shared bits */
  const STAR = '<path d="M12 0C12.8 8.6 15.4 11.2 24 12C15.4 12.8 12.8 15.4 12 24C11.2 15.4 8.6 12.8 0 12C8.6 11.2 11.2 8.6 12 0Z"/>';
  const LONGSTAR = '<path d="M20 0C21 50 24 57 40 60C24 63 21 70 20 120C19 70 16 63 0 60C16 57 19 50 20 0Z"/>';
  const ICON = {
    play: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"><path d="M6 3l15 9-15 9V3z" fill="currentColor"/></svg>',
    pause: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',
    plus: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    eq: '<span class="eq" aria-hidden="true"><span></span><span></span><span></span></span>',
    instagram: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>',
    youtube: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg>',
    spotify: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M7 10c3-1 7-1 10 1M8 13c2.5-.7 5.5-.5 8 .8M9 16c2-.5 4-.3 6 .6"/></svg>'
  };
  const starSvg = (cls, style, fill) => '<svg aria-hidden="true" class="' + (cls || '') + '" viewBox="0 0 24 24" style="' + (style || '') + '" fill="' + (fill || 'url(#cr-star)') + '">' + STAR + '</svg>';
  const longStar = (style) => '<svg aria-hidden="true" viewBox="0 0 40 120" style="' + (style || '') + '" fill="url(#cr-star)">' + LONGSTAR + '</svg>';

  /** Cover art: real image if provided, otherwise tinted liquid marble. */
  function art(o, opts) {
    opts = opts || {};
    const img = o.cover || o.photo || o.image;
    if (img) return '<img class="art-img cr-art" src="' + esc(img) + '" alt="" loading="lazy">';
    const rot = (o.rot || 0) + (opts.rot || 0), hue = (o.hue || 0) + (opts.hue || 0);
    return '<div aria-hidden="true" class="cr-liquid cr-art ' + (opts.cls || '') + '" style="position:absolute;inset:' + (opts.inset || '-20%') + '"><div class="cr-marble" style="position:absolute;inset:0;transform:rotate(' + rot + 'deg);filter:hue-rotate(' + hue + 'deg)' + (opts.extra || '') + '"></div></div>';
  }

  /** External link or a "coming soon" notice when it's not set yet. */
  function ext(url, label, cls, what) {
    if (url) return '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + label + '</a>';
    return '<button type="button" class="' + cls + '" data-action="soon" data-what="' + esc(what || 'This link') + '">' + label + '</button>';
  }

  const eyebrow = (t) => '<p class="eyebrow">' + t + '</p>';

  function releaseCard(r, opts) {
    opts = opts || {};
    return '<a class="rel-card" href="#/releases/' + r.slug + '">' +
      '<div class="cover cr-card">' + art(r) + '<span class="cover-no">' + esc(r.no) + '</span></div>' +
      '<div><p class="rel-title">' + esc(r.title) + '</p><p class="rel-meta">' +
      (opts.noArtist ? esc(r.kind) + ' · ' + year(r.date) : esc(r.artistObj.name) + ' · ' + esc(r.kind)) + '</p></div></a>';
  }

  function artistCard(a, i, opts) {
    opts = opts || {};
    return '<a class="artist-card cr-card' + (opts.wide ? ' wide' : '') + '" href="#/artists/' + a.slug + '">' + art(a) +
      '<div aria-hidden="true" class="fade-bottom"></div>' +
      (opts.wide ? '' : '<span class="artist-no">A—' + pad2(i + 1) + '</span>') +
      '<div class="artist-card-body">' +
      (opts.wide ? '' : '<p class="artist-card-tag">' + esc(a.tags[0] || '') + '</p>') +
      '<p class="artist-card-name">' + esc(a.name) + '</p></div></a>';
  }

  function trackRow(t, list, i, opts) {
    opts = opts || {};
    const sub = opts.sub === 'release' ? esc(t.releaseTitle) : (t.note ? esc(t.note) : (t.feat ? 'feat. ' + esc(t.feat) : esc(t.artistName)));
    return '<li class="cr-row track' + (opts.thumb ? ' has-thumb' : '') + (opts.compact ? ' compact' : '') + '" data-track="' + t.id + '">' +
      '<button type="button" class="track-btn" data-action="play-track" data-list="' + list + '" data-i="' + i + '" aria-label="Play ' + esc(t.title) + '">' +
      '<span class="track-n">' + (list === 'release' ? t.n : pad2(i + 1)) + '</span>' + ICON.eq + '</button>' +
      (opts.thumb ? '<div aria-hidden="true" class="track-thumb">' + art(t, { inset: '-30%' }) + '</div>' : '') +
      '<div class="track-text"><p class="track-title">' + esc(t.title) + '</p>' + (opts.compact ? '' : '<p class="track-sub">' + sub + '</p>') + '</div>' +
      '<span class="track-dur">' + esc(t.dur) + '</span></li>';
  }

  function showRow(s, opts) {
    opts = opts || {};
    const names = showArtists(s).map((a) => '<a href="#/artists/' + a.slug + '">' + esc(a.name) + '</a>').join(', ');
    return '<li class="cr-row show">' +
      '<span class="show-date">' + fmtShow(s.date) + '</span>' +
      '<span class="show-city">' + esc(s.city) + '</span>' +
      '<span class="show-venue">' + esc(s.venue) + (opts.noArtists ? '' : ' · ' + names) + '</span>' +
      ext(s.tickets, 'Tickets', 'btn-line', 'Tickets for ' + s.city) + '</li>';
  }

  function footerBig() {
    const L = D.label;
    return '<footer class="footer-big"><div class="footer-inner">' +
      '<div class="footer-brand"><span class="footer-word">CRASHED</span><span class="footer-records">Records</span><p class="footer-tag">' + esc(L.tagline) + '</p></div>' +
      '<nav aria-label="Footer" class="footer-nav">' +
      '<div><span class="footer-h">Label</span><a href="#/artists">Artists</a><a href="#/releases">Releases</a><a href="#/shows">Trip Log</a><a href="#/about">About</a><a href="#/get-signed">Demos</a></div>' +
      '<div><span class="footer-h">Follow</span>' + ext(L.socials.instagram, 'Instagram', 'footer-link', 'Instagram') + ext(L.socials.tiktok, 'TikTok', 'footer-link', 'TikTok') + ext(L.socials.youtube, 'YouTube', 'footer-link', 'YouTube') + ext(L.socials.spotify, 'Spotify', 'footer-link', 'Spotify') + '</div>' +
      '<div><span class="footer-h">Contact</span><a href="#/about/contact">Contact Eric</a><a href="#/contact/booking">Booking</a><a href="#/contact/press">Press</a><a href="mailto:' + esc(L.emails.general) + '">' + esc(L.emails.general) + '</a></div>' +
      '</nav></div><p class="footer-copy">© ' + new Date().getFullYear() + ' ' + esc(L.name) + ' · <button type="button" class="footer-link footer-replay" data-action="replay-intro">Replay intro</button></p></footer>';
  }
  function footerSmall() {
    return '<footer class="footer-small"><div class="footer-small-inner"><span>© ' + new Date().getFullYear() + ' ' + esc(D.label.name) + '</span>' +
      '<span class="footer-small-tag">' + esc(D.label.tagline) + '</span></div></footer>';
  }

  function pageHero(eb, title, text, hue) {
    return '<section class="page-hero">' +
      '<div aria-hidden="true" class="cr-liquid page-hero-bg" data-viz="page" data-viz-hue="' + (hue || 0) + '"><div class="cr-marble" style="position:absolute;inset:-25%;filter:hue-rotate(' + (hue || 0) + 'deg);animation:cr-spin 120s linear infinite"></div></div>' +
      '<div aria-hidden="true" class="page-hero-shade"></div>' +
      '<div class="wrap page-hero-inner">' + eyebrow(eb) + '<h1 class="h-display">' + title + '</h1>' + (text ? '<p class="lede">' + text + '</p>' : '') + '</div></section>';
  }

  /* Track lists referenced by play buttons (data-list="key"). Rebuilt per view. */
  let lists = {};
  const regList = (key, tracks) => { lists[key] = tracks; return key; };


  /* ---------- "founding roster" state: no signed artists / releases yet ---------- */
  const F = D.founding || {};
  const hasMusic = !!featured;
  const submitBtn = '<a href="#/get-signed" class="btn btn-prism cr-btn">Submit your music</a>';

  function slotCard(i) {
    const hues = [0, 60, -50, 110, -100, 150];
    return '<a class="artist-card slot-card cr-card" href="#/get-signed" aria-label="Open slot ' + (i + 1) + ': submit your music">' +
      art({ hue: hues[i % hues.length], rot: 47 * (i + 1) }) +
      '<div aria-hidden="true" class="fade-bottom"></div>' +
      '<span class="artist-no">A—' + pad2(i + 1) + '</span>' +
      '<div class="artist-card-body"><p class="artist-card-tag">Open slot</p><p class="artist-card-name">Your name</p></div></a>';
  }
  const slotGrid = (n) => '<div class="roster-grid">' + Array.from({ length: n }, (_, i) => slotCard(i)).join('') + '</div>';

  function emptyPanel(no, title, text, actions) {
    return '<div class="empty-panel"><div class="empty-copy"><p class="eyebrow" style="margin:0 0 12px">' + no + '</p>' +
      '<h3 class="empty-title">' + title + '</h3><p class="body-copy">' + text + '</p></div><div class="btn-row">' + actions + '</div></div>';
  }
  const dropAlertsBtn = '<button type="button" class="btn btn-ghost cr-btn" data-action="scroll" data-target="join">Get drop alerts</button>';

  /** Home: latest social posts, pasted in by hand (data.js `social.posts`). Hidden when there are none. */
  function socialWall() {
    const posts = ((D.social || {}).posts || []).filter((p) => p && p.url);
    if (!posts.length) return '';
    return '<section id="social" aria-labelledby="social-h" class="sec sec-tight">' +
      '<div class="sec-head"><div>' + eyebrow('✦ Social') + '<h2 id="social-h" class="h-section">Follow the <span class="accent">float</span></h2></div></div>' +
      '<div class="social-grid">' + posts.slice(0, 4).map((p, i) =>
        '<a class="social-card cr-card" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
          (p.thumb ? '<img class="art-img" src="' + esc(p.thumb) + '" alt="" loading="lazy">' : art({ hue: i * 55, rot: 40 + i * 63 })) +
          '<div aria-hidden="true" class="fade-bottom"></div>' +
          '<span class="social-platform">' + esc(p.platform || 'Post') + '</span>' +
          '<p class="social-caption">' + esc(p.caption || 'Watch') + '</p>' +
        '</a>').join('') + '</div>' +
    '</section>';
  }

  /** Home: a short call to artists, placed just above the newsletter. */
  function areYouNext() {
    return '<section aria-labelledby="next-h" class="next-cta">' +
      '<div class="next-inner">' +
        eyebrow('✦ Artists') +
        '<h2 id="next-h" class="h-section">Are you <span class="accent">next?</span></h2>' +
        '<p class="body-copy">Crashed is signing underground and rising artists in psychedelic hip hop and trap. Send us your music and we will listen.</p>' +
        '<div class="btn-row">' +
          '<a href="#/get-signed" class="btn btn-prism cr-btn">Get signed</a>' +
          '<a href="#/about" class="btn btn-ghost cr-btn">How it works</a>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /** Home: the "Now floating" slot becomes "Now signing" until there is a release to feature. */
  function signingSection() {
    return '<section id="now-floating" aria-labelledby="nf-h" class="now-floating">' +
      '<div class="nf-art"><div aria-hidden="true" class="vinyl-bg"><div class="grooves"></div></div>' +
        '<a href="#/get-signed" class="cover cr-card nf-cover" aria-label="Submit your music">' + art({ hue: 0, rot: -80 }) +
          '<div class="cover-foot"><span>CR—001</span><span>OPEN</span></div></a></div>' +
      '<div class="nf-info"><div class="eyebrow eyebrow-eq">' + ICON.eq.replace('class="eq"', 'class="eq on"') + esc(F.kicker || 'Now signing') + '</div>' +
        '<h2 id="nf-h" class="nf-title">' + (F.headline || 'Founding<br>roster') + '</h2>' +
        (F.by ? '<p class="nf-by">' + esc(F.by) + '</p>' : '') +
        (F.text ? '<p class="body-copy">' + esc(F.text) + '</p>' : '') +
        '<div class="btn-row">' + submitBtn + '<a href="#/about/founder" class="btn btn-ghost cr-btn">Meet Eric</a></div>' +
      '</div></section>';
  }

  /* ------------------------------------------------------------------ views */
  const views = {};

  views.home = function () {
    const f = featured;
    if (f) regList('featured', f.trackObjs);
    const star = '<span class="m-star">✦</span>';
    const marquee = f
      ? '<span>New drop</span>' + star + '<span class="m-it">' + esc(f.title) + ' — ' + esc(f.artistObj.name) + '</span>' + star + '<span>Out now everywhere</span>' + star + '<span class="m-it">' + esc(D.label.tagline) + '</span>' + star
      : '<span>Now signing</span>' + star + '<span class="m-it">Psychedelic hip hop &amp; trap</span>' + star + '<span>Founding roster open</span>' + star + '<span class="m-it">' + esc(D.label.tagline) + '</span>' + star;
    const vid = D.videos[0];
    const vidArtist = vid && artistBy[vid.artist];
    return '' +
    '<section class="hero">' +
      '<div aria-hidden="true" class="cr-liquid hero-bg" data-viz="hero"><div class="cr-marble hero-marble"></div></div>' +
      '<div aria-hidden="true" class="hero-vignette"></div>' +
      '<svg aria-hidden="true" class="grain"><rect width="100%" height="100%" filter="url(#cr-grain)"/></svg>' +
      longStar('position:absolute;left:50%;top:90px;width:30px;margin-left:-15px;z-index:2;animation:cr-twinkle 5s ease-in-out infinite') +
      starSvg('twinkle', 'left:14%;top:26%;width:18px;animation-delay:.6s;animation-duration:4s', '#E8E1D3') +
      starSvg('twinkle', 'right:16%;top:18%;width:14px;animation-delay:1.4s;animation-duration:3.5s', '#E8E1D3') +
      starSvg('twinkle', 'right:10%;top:62%;width:22px;animation-delay:2s;animation-duration:6s', '#C9A8FF') +
      starSvg('twinkle', 'left:9%;top:70%;width:12px;animation-delay:3s;animation-duration:4.5s', '#E8E1D3') +
      '<svg aria-hidden="true" class="orbit" viewBox="0 0 1200 500"><ellipse cx="600" cy="250" rx="580" ry="190" fill="none" stroke="url(#cr-star)" stroke-width="1.2" stroke-dasharray="2 10"/></svg>' +
      '<div class="hero-center">' +
        '<h1 class="hero-logo" data-react><img src="assets/img/logo.png" width="612" height="408" alt="Crashed Records — shit that makes you float"></h1>' +
        '<p class="hero-text">' + esc(D.label.blurb) + '</p>' +
        '<div class="hero-ctas">' +
          '<a href="#/now-floating" class="btn btn-prism cr-btn">' + ICON.play + 'Enter the float</a>' +
          '<a href="#/artists" class="btn btn-ghost cr-btn">' + (artists.length ? 'Meet the roster' : 'Join the roster') + '</a>' +
          '<a href="#/get-signed" class="btn btn-bone cr-btn">Get signed</a>' +
        '</div>' +
      '</div>' +
      '<a href="#/now-floating" class="scroll-cue">Drift down<span aria-hidden="true"></span></a>' +
    '</section>' +
    '<div aria-hidden="true" class="marquee"><div class="marquee-track">' + marquee + marquee + '</div></div>' +

    '<div class="wrap">' +
    /* NOW FLOATING (becomes NOW SIGNING until there is a release to feature) */
    (!f ? signingSection() : '<section id="now-floating" aria-labelledby="nf-h" class="now-floating">' +
      '<div class="nf-art">' +
        '<div aria-hidden="true" class="vinyl-bg"><div class="grooves"></div></div>' +
        '<a href="#/releases/' + f.slug + '" class="cover cr-card nf-cover" data-cover="' + f.slug + '" aria-label="' + esc(f.title) + ' — full release">' + art(f, { rot: -80 }) +
          '<div class="cover-foot"><span>' + esc(f.no) + '</span><span>' + esc(f.kind.toUpperCase()) + '</span></div></a>' +
      '</div>' +
      '<div class="nf-info">' +
        '<div class="eyebrow eyebrow-eq">' + ICON.eq.replace('class="eq"', 'class="eq on"') + 'Now floating</div>' +
        '<h2 id="nf-h" class="nf-title">' + esc(f.title) + '</h2>' +
        '<p class="nf-by"><a href="#/artists/' + f.artistObj.slug + '" class="u-link">' + esc(f.artistObj.name) + '</a> · ' + esc(f.kind) + ' · ' + year(f.date) + '</p>' +
        '<ol class="tracklist compact">' + f.trackObjs.slice(0, 3).map((t, i) => trackRow(t, 'featured', i, { compact: true })).join('') + '</ol>' +
        '<div class="btn-row">' +
          '<a href="#/releases/' + f.slug + '" class="btn btn-bone btn-52 cr-btn">Full release</a>' +
          ext(f.links.spotify, 'Spotify', 'btn-mono btn-52', 'Spotify link') +
          ext(f.links.apple, 'Apple Music', 'btn-mono btn-52', 'Apple Music link') +
          ext(f.links.bandcamp, 'Bandcamp', 'btn-mono btn-52', 'Bandcamp link') +
        '</div>' +
      '</div>' +
    '</section>') +

    /* ROSTER */
    '<section aria-labelledby="roster-h" class="sec">' +
      (artists.length
        ? '<div class="sec-head"><div>' + eyebrow('✦ The roster') + '<h2 id="roster-h" class="h-section">Who\'s<br><span class="accent">floating</span> with us</h2></div>' +
          '<a href="#/artists" class="more-link">All artists →</a></div>' +
          '<div class="roster-grid">' + artists.slice(0, 4).map((a, i) => artistCard(a, i)).join('') + '</div>'
        : '<div class="sec-head"><div>' + eyebrow('✦ The roster') + '<h2 id="roster-h" class="h-section">The first<br><span class="accent">spots</span> are open</h2></div>' +
          '<a href="#/get-signed" class="more-link">Submit your music →</a></div>' + slotGrid(F.slots || 4)) +
    '</section>' +

    /* CATALOG */
    '<section aria-labelledby="cat-h" class="sec">' +
      '<div class="sec-head"><div>' + eyebrow('✦ Catalog') + '<h2 id="cat-h" class="h-section">The crash site</h2></div>' +
      (releases.length ? filterChips('home') : '') + '</div>' +
      (releases.length
        ? '<div class="rel-grid" id="home-catalog">' + catalogItems('All', 6) + '</div>' +
          '<p class="sec-foot"><a href="#/releases" class="more-link">Full catalog →</a></p>'
        : emptyPanel('CR—001', 'Reserved for the first release', esc(F.firstRelease || 'The first drop is coming soon.'), dropAlertsBtn)) +
    '</section>' +

    /* TRIP LOG */
    '<section id="trip-log" aria-labelledby="trip-h" class="sec">' +
      '<div class="trip">' +
        '<div class="trip-intro">' + eyebrow('✦ Trip log') + '<h2 id="trip-h" class="h-section">Catch it<br><span class="accent">live</span></h2>' +
        '<p class="body-copy">Label nights, tour stops and listening sessions.</p>' +
        (shows.length > 4 ? '<a href="#/shows" class="more-link" style="margin-top:28px;display:inline-block">All dates →</a>' : '') + '</div>' +
        (shows.length ? '<ul class="shows">' + shows.slice(0, 4).map((s) => showRow(s)).join('') + '</ul>' :
          '<p class="empty">No dates on the board yet. Join the drift below and we\'ll tell you first.</p>') +
      '</div>' +
    '</section>' +

    /* VISUALS */
    (vid ? '<section id="visuals" aria-labelledby="vis-h" class="sec sec-tight">' +
      eyebrow('✦ Visuals') + '<h2 id="vis-h" class="h-section" style="margin-bottom:40px">Watch the trip</h2>' +
      '<div class="video-card">' +
        '<div aria-hidden="true" class="cr-liquid" style="position:absolute;inset:-20%"><div class="cr-marble" style="position:absolute;inset:-20%;filter:hue-rotate(' + (vid.hue || -30) + 'deg) brightness(.7);animation:cr-spin 120s linear infinite"></div></div>' +
        '<div aria-hidden="true" class="video-shade"></div>' +
        '<div class="video-meta"><span class="eyebrow" style="margin:0">Official video</span><span class="video-title">' + esc(vid.title) + '</span><span class="video-artist">' + esc(vidArtist ? vidArtist.name : '') + '</span></div>' +
        '<button type="button" class="video-play cr-btn" data-action="video" data-i="0" aria-label="Play video: ' + esc(vid.title) + '"><svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8V4z" fill="currentColor"/></svg></button>' +
      '</div></section>' : '') +

    /* MERCH */
    '<section id="merch" aria-labelledby="merch-h" class="sec sec-tight">' +
      '<div class="sec-head"><div>' + eyebrow('✦ Merch') + '<h2 id="merch-h" class="h-section">Wear the float</h2></div>' +
      '<a href="#/shop" class="more-link">Shop all →</a></div>' +
      '<div class="merch-grid">' + merch.slice(0, 3).map(merchCard).join('') + '</div>' +
    '</section>' +

    socialWall() +
    areYouNext() +
    joinBlock() +
    '</div>' + footerBig();
  };

  function filterChips(scope) {
    return '<div role="group" aria-label="Filter releases" class="chips" data-scope="' + scope + '">' +
      ['All', 'Albums', 'EPs', 'Singles'].map((l, i) => '<button type="button" class="chip" data-action="filter" data-filter="' + l + '" aria-pressed="' + (i === 0) + '">' + l + '</button>').join('') + '</div>';
  }
  function filterReleases(f) {
    const kind = { Albums: 'Album', EPs: 'EP', Singles: 'Single' }[f];
    return kind ? releases.filter((r) => r.kind === kind) : releases;
  }
  function catalogItems(f, limit) {
    const list = filterReleases(f).slice(0, limit || 999);
    return list.length ? list.map((r) => releaseCard(r)).join('') : '<p class="empty">Nothing here yet.</p>';
  }

  function merchCard(m) {
    return '<div class="merch-card cr-card">' +
      '<button type="button" class="merch-img" data-action="product" data-id="' + esc(m.id) + '" aria-label="View ' + esc(m.name) + '">' +
        (m.image ? '<img class="art-img" src="' + esc(m.image) + '" alt="" loading="lazy">' : merchArt(m)) +
        '<span class="merch-tag">' + esc(m.tag) + '</span></button>' +
      '<div class="merch-body"><div><p class="merch-name">' + esc(m.name) + '</p><p class="merch-price">' + money(m.price) + '</p></div>' +
      '<button type="button" class="icon-btn" data-action="quick-add" data-id="' + esc(m.id) + '" aria-label="Add ' + esc(m.name) + ' to cart">' + ICON.plus + '</button></div></div>';
  }
  function merchArt(m) {
    // Simple product silhouettes over the marble glow until real photos exist.
    const shapes = {
      tee: '<path d="M70 40l30-14h40l30 14 30 30-26 22-14-12v118H80V80L66 92 40 70z"/>',
      hoodie: '<path d="M78 46c8-14 22-22 42-22s34 8 42 22l34 26-20 30-18-14v120H82V88l-18 14-20-30z"/><path d="M104 30c0 18 7 30 16 30s16-12 16-30" fill="none" stroke="rgba(7,6,11,.5)" stroke-width="3"/>',
      vinyl: '<circle cx="120" cy="120" r="92"/><circle cx="120" cy="120" r="26" fill="#8B5CF6"/><circle cx="120" cy="120" r="4" fill="#07060B"/>',
      beanie: '<path d="M54 160c0-60 30-100 66-100s66 40 66 100z"/><rect x="48" y="156" width="144" height="34"/><circle cx="120" cy="52" r="14"/>',
      mat: '<circle cx="120" cy="120" r="96"/>',
      sticker: '<rect x="50" y="56" width="90" height="90" rx="14" transform="rotate(-10 95 101)"/><rect x="104" y="96" width="86" height="86" rx="43"/>'
    };
    const key = /tee/i.test(m.id) ? 'tee' : /hood/i.test(m.id) ? 'hoodie' : /vinyl/i.test(m.id) ? 'vinyl' : /beanie/i.test(m.id) ? 'beanie' : /mat/i.test(m.id) ? 'mat' : 'sticker';
    return '<div aria-hidden="true" class="merch-glow" style="filter:hue-rotate(' + (m.hue || 0) + 'deg)"></div>' +
      '<svg aria-hidden="true" class="merch-shape" viewBox="0 0 240 240" fill="#1A1426" stroke="rgba(201,168,255,.45)" stroke-width="1.5">' + shapes[key] + '</svg>' +
      starSvg('', 'position:absolute;width:22px;left:50%;top:44%;transform:translate(-50%,-50%)');
  }

  function joinBlock() {
    const joined = store.get('newsletter', null);
    return '<section id="join" aria-labelledby="join-h" class="join">' +
      '<div aria-hidden="true" class="cr-liquid" style="position:absolute;inset:-20%;opacity:.55"><div class="cr-marble" style="position:absolute;inset:-20%;animation:cr-spin 100s linear infinite reverse"></div></div>' +
      '<div aria-hidden="true" style="position:absolute;inset:0;background:rgba(7,6,11,.55)"></div>' +
      '<div class="join-inner">' + longStar('width:18px') +
        '<h2 id="join-h" class="h-join">Join the drift</h2>' +
        '<p class="join-text">First listens, drop alerts and secret show locations. No spam, only signal.</p>' +
        (joined ? joinedMsg(joined.email) :
        '<form class="join-form" data-form="newsletter" data-t0="' + Date.now() + '" novalidate>' +
          '<label for="join-email" class="sr-only">Email address</label>' +
          '<input id="join-email" name="email" type="email" autocomplete="email" placeholder="your@email.com" required>' +
          '<button type="submit" class="btn btn-bone cr-btn">Float me in</button>' + HONEYPOT +
          '<p class="form-error" role="alert"></p>' +
        '</form>') +
      '</div></section>';
  }
  const joinedMsg = (email) => '<p class="join-done" role="status">✦ You\'re in the drift. Watch ' + esc(email) + ' for signal.</p>';

  /* ---------- artists ---------- */
  views.artists = function () {
    if (!artists.length) {
      return pageHero('✦ The roster', 'The first <span class="accent">spots</span> are open', 'Nobody is signed yet, which is the point. Crashed is looking for its founding artists: underground and rising names making psychedelic hip hop and trap.', 40) +
        '<div class="wrap"><section class="sec" style="padding-top:64px">' + slotGrid(F.slots || 4) +
        '<div class="btn-row" style="margin-top:40px">' + submitBtn + '<a href="#/about/founder" class="btn btn-ghost cr-btn">Meet Eric</a></div></section></div>' + footerSmall();
    }
    return pageHero('✦ The roster', 'Who\'s <span class="accent">floating</span>', 'Every artist on the label. Tap in, follow, and catch them live.', 40) +
      '<div class="wrap"><section class="sec" style="padding-top:64px"><div class="roster-grid">' + artists.map((a, i) => artistCard(a, i)).join('') + '</div></section></div>' + footerSmall();
  };

  views.artist = function (slug) {
    const a = artistBy[slug];
    if (!a) return views.notFound();
    regList('top', a.top);
    const following = !!store.get('follows', {})[a.slug];
    const words = a.name.split(' ');
    const first = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : a.name;
    const rest = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
    const aShows = shows.filter((s) => s.artists.indexOf(a.slug) > -1);
    const others = artists.filter((x) => x.slug !== a.slug).slice(0, 3);
    return '<section class="artist-hero">' +
      '<div aria-hidden="true" class="cr-liquid" data-viz="artist" data-viz-hue="' + a.hue + '" style="position:absolute;inset:-15%;opacity:.8"><div class="cr-marble" style="position:absolute;inset:-25%;filter:hue-rotate(' + a.hue + 'deg);animation:cr-spin 110s linear infinite"></div></div>' +
      '<div aria-hidden="true" class="portrait">' + (a.photo ? '<img src="' + esc(a.photo) + '" alt="">' :
        art(a, { inset: '0', extra: ';opacity:.55' }) + '<div class="portrait-mark">' + longStar('width:34px') + '<span>' + esc(a.name.split(' ').map((w) => w[0]).join('')) + '</span></div>') + '</div>' +
      '<div aria-hidden="true" class="artist-hero-shade"></div>' +
      '<svg aria-hidden="true" class="grain"><rect width="100%" height="100%" filter="url(#cr-grain)"/></svg>' +
      '<div class="artist-hero-body"><div class="artist-hero-inner">' +
        '<a href="#/artists" class="back-link">← The roster</a>' +
        eyebrow('✦ ' + esc(a.city) + ' · ' + a.tags.slice(0, 2).map(esc).join(' / ')) +
        '<h1 class="artist-name">' + esc(first) + (rest ? '<br><span class="cr-outline">' + esc(rest) + '</span>' : '') + '</h1>' +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button type="button" class="btn btn-prism cr-btn" data-action="play-list" data-list="top" data-label-play="Play top tracks">' + ICON.play + '<span>Play top tracks</span></button>' +
          '<button type="button" class="btn btn-follow" data-action="follow" data-slug="' + a.slug + '" aria-pressed="' + following + '">' + (following ? 'Following ✓' : 'Follow') + '</button>' +
          '<button type="button" class="btn btn-mono btn-share" data-action="share" data-kind="artists" data-slug="' + a.slug + '" data-title="' + esc(a.name) + '">Share</button>' +
        '</div>' +
      '</div></div></section>' +
      '<div class="wrap">' +
      '<section class="split">' +
        '<div class="split-main"><h2 class="h-sub">Top tracks</h2><ol class="tracklist">' + a.top.map((t, i) => trackRow(t, 'top', i, { thumb: true, sub: 'release' })).join('') + '</ol></div>' +
        '<aside class="split-side"><h2 class="h-sub" style="margin:0">The trip</h2>' + a.bio.map((p) => '<p class="body-copy">' + esc(p) + '</p>').join('') +
          '<div class="tags">' + a.tags.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>' +
          '<div class="socials">' +
            ext(a.socials.instagram, ICON.instagram, 'icon-btn', a.name + ' on Instagram').replace('class="icon-btn"', 'class="icon-btn" aria-label="Instagram"') +
            ext(a.socials.youtube, ICON.youtube, 'icon-btn', a.name + ' on YouTube').replace('class="icon-btn"', 'class="icon-btn" aria-label="YouTube"') +
            ext(a.socials.spotify, ICON.spotify, 'icon-btn', a.name + ' on Spotify').replace('class="icon-btn"', 'class="icon-btn" aria-label="Spotify"') +
          '</div></aside>' +
      '</section>' +
      '<section class="sec-sm"><h2 class="h-sub">Discography</h2><div class="rel-grid wide">' + a.releases.map((r) => releaseCard(r, { noArtist: true })).join('') + '</div></section>' +
      '<section class="sec-sm"><h2 class="h-sub">On the road</h2>' +
        (aShows.length ? '<ul class="shows">' + aShows.map((s) => showRow(s, { noArtists: true })).join('') + '</ul>' : '<p class="empty">No dates announced. Follow to hear first.</p>') + '</section>' +
      '<section class="sec-sm" style="padding-bottom:120px"><div class="sec-head" style="margin-bottom:32px"><h2 class="h-sub" style="margin:0">Also floating</h2><a href="#/artists" class="more-link">Full roster →</a></div>' +
        '<div class="also-grid">' + others.map((x) => artistCard(x, 0, { wide: true })).join('') + '</div></section>' +
      '</div>' + footerSmall();
  };

  /* ---------- releases ---------- */
  views.releases = function () {
    if (!releases.length) {
      return pageHero('✦ Catalog', 'The crash <span class="accent">site</span>', 'Every record we put into orbit will live here, newest first.', -40) +
        '<div class="wrap"><section class="sec" style="padding-top:56px">' +
        emptyPanel('CR—001', 'Reserved for the first release', esc(F.firstRelease || 'The first drop is coming soon.'), dropAlertsBtn + '<a href="#/get-signed" class="btn btn-ghost cr-btn">Submit your music</a>') +
        '</section>' + joinBlock() + '</div>' + footerSmall();
    }
    return pageHero('✦ Catalog', 'The crash <span class="accent">site</span>', 'Every record we\'ve put into orbit, newest first.', -40) +
      '<div class="wrap"><section class="sec" style="padding-top:56px">' +
      '<div class="sec-head" style="margin-bottom:32px"><p class="count" id="rel-count">' + releases.length + ' releases</p>' + filterChips('page') + '</div>' +
      '<div class="rel-grid wide" id="page-catalog">' + catalogItems('All') + '</div></section></div>' + footerSmall();
  };

  views.release = function (slug) {
    const r = releaseBy[slug];
    if (!r) return views.notFound();
    regList('release', r.trackObjs);
    const more = releases.filter((x) => x.slug !== r.slug).slice(0, 4);
    const fmtIdx = Math.max(0, r.formats.findIndex((f) => !f.soldOut));
    const out = parseDate(r.date) > today ? 'Out ' : 'Released ';
    return '<div class="release-page">' +
      '<div aria-hidden="true" class="cr-liquid release-ambient" data-viz="release" data-viz-zoom="1.7" data-viz-hue="' + r.hue + '"><div class="cr-marble" style="position:absolute;inset:-20%;filter:hue-rotate(' + r.hue + 'deg) blur(30px);animation:cr-spin 140s linear infinite"></div></div>' +
      '<div aria-hidden="true" class="release-ambient-shade"></div>' +
      '<div class="wrap release-wrap">' +
      '<section class="release-hero">' +
        '<div class="cr-sleeve" data-sleeve="' + r.slug + '">' +
          '<div aria-hidden="true" class="cr-vinyl"><div class="grooves spin"></div></div>' +
          '<div class="cover release-cover" data-cover="' + r.slug + '">' + art(r, { inset: '-20%' }) + '<span class="cover-no" style="left:22px;bottom:18px;font-size:12px">' + esc(r.no) + ' · ' + esc(r.kind.toUpperCase()) + '</span></div>' +
        '</div>' +
        '<div class="release-info">' +
          eyebrow('✦ ' + esc(r.kind) + ' · ' + out + fmtLong(r.date)) +
          '<h1 class="release-title">' + esc(r.title) + '</h1>' +
          '<p class="nf-by">by <a href="#/artists/' + r.artistObj.slug + '" class="u-link">' + esc(r.artistObj.name) + '</a></p>' +
          '<p class="body-copy" style="max-width:520px">' + esc(r.description) + '</p>' +
          '<div class="btn-row" style="margin-top:8px">' +
            '<button type="button" class="btn btn-prism cr-btn" data-action="play-list" data-list="release" data-label-play="Play ' + r.kind.toLowerCase() + '">' + ICON.play + '<span>Play ' + esc(r.kind.toLowerCase()) + '</span></button>' +
            ext(r.links.spotify, 'Spotify', 'btn-mono', 'Spotify link') + ext(r.links.apple, 'Apple Music', 'btn-mono', 'Apple Music link') + ext(r.links.bandcamp, 'Bandcamp', 'btn-mono', 'Bandcamp link') +
            '<button type="button" class="btn-mono btn-share" data-action="share" data-kind="releases" data-slug="' + r.slug + '" data-title="' + esc(r.title + ' by ' + r.artistObj.name) + '">Share</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="split" style="padding:110px 0 80px;align-items:flex-start">' +
        '<div class="split-main"><h2 class="h-sub" style="margin-bottom:24px">Tracklist</h2><ol class="tracklist">' + r.trackObjs.map((t, i) => trackRow(t, 'release', i)).join('') + '</ol>' +
          '<p class="tracklist-total">' + r.trackObjs.length + ' tracks · ' + fmtTime(r.trackObjs.reduce((s, t) => s + t.seconds, 0)) + '</p></div>' +
        '<aside class="buy-box"><h2 class="h-buy">Own it</h2>' +
          '<div role="radiogroup" aria-label="Format" class="formats">' + r.formats.map((f, i) =>
            '<button type="button" role="radio" class="format" data-action="format" data-i="' + i + '" aria-checked="' + (i === fmtIdx) + '"' + (f.soldOut ? ' disabled aria-disabled="true"' : '') + '>' +
            '<span class="format-text"><span class="format-name">' + esc(f.name) + '</span><span class="format-desc">' + esc(f.desc) + '</span></span>' +
            '<span class="format-price">' + (f.soldOut ? 'Sold out' : money(f.price)) + '</span></button>').join('') + '</div>' +
          '<button type="button" class="btn btn-bone cr-btn" data-action="add-release" data-slug="' + r.slug + '">Add to cart</button>' +
          '<p class="fine">Every physical order includes a digital download.</p>' +
        '</aside>' +
      '</section>' +
      '<section class="credits">' +
        '<div><p class="credit-h">Produced by</p><p class="credit">' + esc(r.credits.produced) + '</p></div>' +
        '<div><p class="credit-h">Mixed &amp; mastered</p><p class="credit">' + esc(r.credits.mixed) + '</p></div>' +
        '<div><p class="credit-h">Artwork</p><p class="credit">' + esc(r.credits.artwork) + '</p></div>' +
      '</section>' +
      '<section class="sec-sm" style="padding:20px 0 120px"><div class="sec-head" style="margin-bottom:32px"><h2 class="h-sub" style="margin:0">Keep floating</h2><a href="#/releases" class="more-link">Full catalog →</a></div>' +
        '<div class="rel-grid wide">' + more.map((x) => releaseCard(x)).join('') + '</div></section>' +
      '</div></div>' + footerSmall();
  };

  /* ---------- shows ---------- */
  views.shows = function () {
    return pageHero('✦ Trip log', 'Catch it <span class="accent">live</span>', 'Label nights, tour stops and listening sessions.', 80) +
      '<div class="wrap"><section class="sec" style="padding-top:56px">' +
      (shows.length ? '<ul class="shows">' + shows.map((s) => showRow(s)).join('') + '</ul>' : '<p class="empty">No dates on the board right now.</p>') +
      '</section>' + joinBlock() + '</div>' + footerSmall();
  };

  /* ---------- shop ---------- */
  views.shop = function () {
    const records = releases.filter((r) => r.formats.some((f) => !f.digital && !f.soldOut));
    return pageHero('✦ Merch', 'Wear the <span class="accent">float</span>', 'Apparel, wax and small objects for the trip. Ships worldwide.', 120) +
      '<div class="wrap"><section class="sec" style="padding-top:56px"><h2 class="h-sub" style="margin-bottom:32px">Merch</h2>' +
      '<div class="merch-grid">' + merch.map(merchCard).join('') + '</div></section>' +
      (records.length ? '<section class="sec" style="padding-top:0"><div class="sec-head" style="margin-bottom:32px"><h2 class="h-sub" style="margin:0">Records</h2><a href="#/releases" class="more-link">Full catalog →</a></div>' +
      '<div class="rel-grid wide">' + records.map((r) => releaseCard(r)).join('') + '</div></section>' : '') + '</div>' + footerSmall();
  };

  /* ---------- checkout ---------- */
  views.checkout = function () {
    const cart = Cart.items();
    if (!cart.length) {
      return '<div class="wrap narrow-page"><h1 class="h-section">Your cart is <span class="accent">empty</span></h1><p class="body-copy">Nothing to float home yet.</p>' +
        '<div class="btn-row"><a href="#/shop" class="btn btn-bone cr-btn">Browse the shop</a><a href="#/releases" class="btn btn-ghost">Records</a></div></div>' + footerSmall();
    }
    const t = Cart.totals();
    const physical = Cart.hasPhysical();
    const field = (id, label, type, ac, req, extra) => '<div class="field' + (extra || '') + '"><label for="co-' + id + '">' + label + (req ? '' : ' <span class="opt">(optional)</span>') + '</label>' +
      '<input id="co-' + id + '" name="' + id + '" type="' + (type || 'text') + '" autocomplete="' + (ac || 'off') + '"' + (req ? ' required' : '') + '><p class="field-error" aria-live="polite"></p></div>';
    return '<div class="wrap checkout-page"><a href="#/shop" class="back-link">← Keep shopping</a><h1 class="h-section" style="margin:18px 0 48px">Checkout</h1>' +
      '<div class="checkout">' +
      '<form class="checkout-form" data-form="checkout" novalidate>' +
        '<fieldset><legend>Contact</legend>' + field('email', 'Email', 'email', 'email', true) + field('name', 'Full name', 'text', 'name', true) + '</fieldset>' +
        (physical ? '<fieldset><legend>Shipping</legend>' + field('address', 'Address', 'text', 'street-address', true) +
          '<div class="field-row">' + field('city', 'City', 'text', 'address-level2', true) + field('postal', 'Postal code', 'text', 'postal-code', true) + '</div>' +
          field('country', 'Country', 'text', 'country-name', true) + '</fieldset>' : '<p class="fine">Digital only — download links go to your email.</p>') +
        '<fieldset><legend>Payment</legend><div class="pay-note">' + starSvg('', 'width:16px;flex:none') +
          '<p>Card payments aren\'t connected yet. Placing an order here records it as a <b>test order</b> — no money is taken.</p></div></fieldset>' +
        '<button type="submit" class="btn btn-prism cr-btn" style="width:100%;justify-content:center">Place order · ' + money(t.total) + '</button>' +
      '</form>' +
      '<aside class="summary"><h2 class="h-buy">Order</h2><ul class="summary-list">' + cart.map((it) =>
        '<li><div class="mini-art">' + art(it.art, { inset: '-30%' }) + '<span class="qty-badge">' + it.qty + '</span></div><div class="summary-text"><p>' + esc(it.name) + '</p><p class="muted">' + esc(it.variant || '') + '</p></div><span>' + money(it.price * it.qty) + '</span></li>').join('') +
      '</ul>' + totalsHTML(t) + '</aside></div></div>' + footerSmall();
  };
  function totalsHTML(t) {
    return '<dl class="totals"><div><dt>Subtotal</dt><dd>' + money(t.subtotal) + '</dd></div>' +
      '<div><dt>Shipping</dt><dd>' + (t.shipping ? money(t.shipping) : (Cart.hasPhysical() ? 'Free' : '—')) + '</dd></div>' +
      '<div class="total"><dt>Total</dt><dd>' + money(t.total) + '</dd></div></dl>';
  }

  views.order = function (id) {
    const o = (store.get('orders', [])).find((x) => x.id === id);
    if (!o) return views.notFound();
    return '<div class="wrap narrow-page">' + longStar('width:22px;margin-bottom:24px') + eyebrow('✦ Order ' + esc(o.id)) +
      '<h1 class="h-section">You\'re <span class="accent">floating</span></h1>' +
      '<p class="body-copy">Thanks, ' + esc(o.name.split(' ')[0]) + '. A confirmation would go to <b>' + esc(o.email) + '</b>. ' +
      '<span class="muted">(Test order — payments aren\'t connected yet, nothing was charged.)</span></p>' +
      '<ul class="summary-list" style="margin:32px 0">' + o.items.map((it) => '<li><div class="summary-text"><p>' + it.qty + ' × ' + esc(it.name) + '</p><p class="muted">' + esc(it.variant || '') + '</p></div><span>' + money(it.price * it.qty) + '</span></li>').join('') + '</ul>' +
      '<p class="body-copy"><b>Total ' + money(o.total) + '</b></p>' +
      '<div class="btn-row" style="margin-top:32px"><a href="#/" class="btn btn-bone cr-btn">Back home</a><a href="#/releases" class="btn btn-ghost">Keep listening</a></div></div>' + footerSmall();
  };

  /* ---------- contact ---------- */
  const CONTACT = {
    demos: { label: 'Demos', title: 'Send us your <span class="accent">trip</span>', intro: 'We listen to everything. Send a private link (SoundCloud, Dropbox, Drive) — no attachments please.' },
    booking: { label: 'Booking', title: 'Book the <span class="accent">float</span>', intro: 'Shows, festivals, label nights and listening sessions.' },
    press: { label: 'Press', title: 'Press &amp; <span class="accent">media</span>', intro: 'Interviews, premieres, promo copies and press kits.' },
    general: { label: 'General', title: 'Say <span class="accent">hello</span>', intro: 'Anything else on your mind.' },
    founder: { label: 'Eric (Founder)', title: 'Talk to <span class="accent">Eric</span>', intro: 'Reach the founder of Crashed Records directly.' }
  };
  /** Hidden decoy field: people never see or fill it, bots usually do. */
  const HONEYPOT = '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label></div>';

  /** "How signing works" steps + FAQ. `compact` drops the heading call-to-action when it already sits beside a form. */
  function signingInfo(opts) {
    const S = D.signing || {};
    if (!(S.steps && S.steps.length) && !(S.faq && S.faq.length)) return '';
    const timeText = S.replyTime ? ' He aims to reply ' + esc(S.replyTime) + '.' : '';
    return '<section id="how-signing-works" class="sec-sm signing" aria-labelledby="hsw-h">' +
      '<div class="sec-head" style="margin-bottom:32px"><div>' + eyebrow('✦ For artists') + '<h2 id="hsw-h" class="h-section">How signing <span class="accent">works</span></h2></div></div>' +
      (S.steps && S.steps.length ? '<ol class="steps">' + S.steps.map((st, i) =>
        '<li><span class="step-no">' + (i + 1) + '</span><h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p></li>').join('') + '</ol>' : '') +
      (S.faq && S.faq.length ? '<h3 class="h-sub faq-h">Questions</h3><div class="faq">' + S.faq.map((f) =>
        '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a).replace('{replyTime}', timeText) + '</p></details>').join('') + '</div>' : '') +
      (opts && opts.compact ? '' : '<div class="btn-row" style="margin-top:36px"><a href="#/get-signed" class="btn btn-prism cr-btn">Submit your music</a></div>') +
    '</section>';
  }

  /** Shared contact form: used on #/contact/<topic> and the About page (topic "founder"). */
  function contactForm(topic, cls) {
    const id = (k) => 'c-' + topic + '-' + k;
    const field = (k, label, input, opt) => '<div class="field"><label for="' + id(k) + '">' + label + (opt ? ' <span class="opt">(optional)</span>' : '') + '</label>' + input + '<p class="field-error"></p></div>';
    return '<form class="contact-form ' + (cls || '') + '" data-form="contact" data-topic="' + topic + '" data-t0="' + Date.now() + '" novalidate>' + HONEYPOT +
      '<div class="field-row">' +
        field('name', 'Name', '<input id="' + id('name') + '" name="name" autocomplete="name" required>') +
        field('email', 'Email', '<input id="' + id('email') + '" name="email" type="email" autocomplete="email" required>') +
      '</div>' +
      (topic === 'demos' ? '<div class="field-row">' + field('artist', 'Artist name', '<input id="' + id('artist') + '" name="artist" required>') +
        field('link', 'Link to music', '<input id="' + id('link') + '" name="link" type="url" placeholder="https://" required>') + '</div>' : '') +
      (topic === 'booking' ? '<div class="field-row">' + field('artist', 'Artist', '<select id="' + id('artist') + '" name="artist">' + artists.map((a) => '<option>' + esc(a.name) + '</option>').join('') + '<option>Label night (multiple)</option></select>') +
        field('when', 'Date &amp; city', '<input id="' + id('when') + '" name="when" placeholder="e.g. 14 Mar, Berlin">') + '</div>' : '') +
      (topic === 'press' ? field('outlet', 'Outlet', '<input id="' + id('outlet') + '" name="outlet" required>') : '') +
      (topic === 'founder' ? '<div class="field-row">' + field('subject', 'What\'s it about?', '<select id="' + id('subject') + '" name="subject">' +
          ['Signing / demos', 'Collaboration', 'Booking', 'Press', 'Business', 'Just saying hi'].map((o) => '<option>' + o + '</option>').join('') + '</select>') +
        field('link', 'Link', '<input id="' + id('link') + '" name="link" type="url" placeholder="https://">', true) + '</div>' : '') +
      field('message', 'Message', '<textarea id="' + id('message') + '" name="message" rows="6" required></textarea>') +
      '<button type="submit" class="btn btn-prism cr-btn">' + (topic === 'founder' ? 'Send to ' + esc(D.founder.name.split(' ')[0]) : 'Send it') + '</button>' +
      '<p class="form-status" role="status"></p>' +
    '</form>';
  }

  views.contact = function (topic) {
    topic = CONTACT[topic] ? topic : 'general';
    const c = CONTACT[topic];
    return pageHero('✦ Contact', c.title, c.intro, -120) +
      '<div class="wrap"><section class="sec contact" style="padding-top:56px">' +
      '<nav aria-label="Contact topic" class="chips" style="margin-bottom:40px">' + Object.keys(CONTACT).map((k) =>
        '<a class="chip" href="' + (k === 'demos' ? '#/get-signed' : '#/contact/' + k) + '"' + (k === topic ? ' aria-current="page"' : '') + '>' + CONTACT[k].label + '</a>').join('') + '</nav>' +
      '<div class="split" style="padding:0;gap:64px">' +
      contactForm(topic, 'split-main') +
      '<aside class="split-side"><p class="credit-h">Or email directly</p><p class="credit"><a class="u-link" href="mailto:' + esc(D.label.emails[topic]) + '">' + esc(D.label.emails[topic]) + '</a></p>' +
        '<p class="fine" style="margin-top:20px">Sending opens your email app with everything filled in.</p></aside>' +
      '</div></section>' + (topic === 'demos' ? signingInfo({ compact: true }) : '') + '</div>' + footerSmall();
  };


  /* ---------- get signed: a guided, step-by-step submission ---------- */
  const SIGN_STEPS = ['You', 'Your music', 'Your sound', 'What you want', 'Send'];
  const SIGN_TAGS = ['Psychedelic trap', 'Rage', 'Plugg', 'Cloud rap', 'Hyperpop', 'Experimental', 'Hazy / lo-fi', 'Melodic', 'Dark', 'Something else'];
  const SIGN_STAGES = ['Just starting out', 'Under 1k monthly listeners', '1k–10k monthly listeners', '10k–100k monthly listeners', '100k+ monthly listeners'];
  const SIGN_WANTS = ['Releasing my music', 'Production / beats', 'Mixing & mastering', 'Artwork & visuals', 'Shows', 'Growing my audience'];
  const SIGN_LABELS = { artist: 'Artist name', name: 'Name', email: 'Email', city: 'City', age: 'Age', guardian: 'Guardian OK', link1: 'Track 1', link2: 'Track 2', link3: 'Track 3',
    instagram: 'Instagram', tiktok: 'TikTok', streaming: 'Streaming page', sound: 'Sound', soundsLike: 'Sounds like', stage: 'Stage', wants: 'Wants', message: 'About', rights: 'Rights confirmed' };

  function lookingForList(cls) {
    const L = (D.signing || {}).lookingFor || [];
    return L.length ? '<ul class="' + cls + '">' + L.map((t) => '<li>' + starSvg('', 'width:14px;flex:none') + '<span>' + esc(t) + '</span></li>').join('') + '</ul>' : '';
  }

  views.getSigned = function () {
    const F = D.founder, first = F.name.split(' ')[0], to = D.label.emails.demos || D.label.emails.general;
    const id = (k) => 'gs-' + k;
    const field = (k, label, input, opt, hint) => '<div class="field"><label for="' + id(k) + '">' + label + (opt ? ' <span class="opt">(optional)</span>' : '') + '</label>' + input +
      (hint ? '<p class="field-hint">' + hint + '</p>' : '') + '<p class="field-error"></p></div>';
    const inp = (k, attrs) => '<input id="' + id(k) + '" name="' + k + '" ' + (attrs || '') + '>';
    const sel = (k, opts, attrs) => '<select id="' + id(k) + '" name="' + k + '" ' + (attrs || '') + '><option value="">Choose…</option>' + opts.map((o) => '<option>' + esc(o) + '</option>').join('') + '</select>';
    const checks = (name, opts, labelId, label, opt) => '<div class="field"><p class="gs-label" id="' + labelId + '">' + label + (opt ? ' <span class="opt">(optional)</span>' : '') + '</p>' +
      '<div class="tag-grid" role="group" aria-labelledby="' + labelId + '">' + opts.map((o) => '<label class="tag-check"><input type="checkbox" name="' + name + '" value="' + esc(o) + '"><span>' + esc(o) + '</span></label>').join('') + '</div><p class="field-error"></p></div>';
    const tick = (k, text) => '<div class="field"><label class="check-line"><input type="checkbox" id="' + id(k) + '" name="' + k + '" value="yes"><span>' + text + '</span></label><p class="field-error"></p></div>';
    const step = (n, title, sub, body) => '<fieldset class="gs-step" data-step="' + n + '"' + (n ? ' hidden' : '') + '>' +
      '<legend class="sr-only">Step ' + (n + 1) + ' of ' + SIGN_STEPS.length + ': ' + SIGN_STEPS[n] + '</legend>' +
      '<p class="eyebrow gs-count">Step ' + (n + 1) + ' / ' + SIGN_STEPS.length + ' · ' + SIGN_STEPS[n] + '</p>' +
      '<h2 class="gs-title" tabindex="-1">' + title + '</h2>' + (sub ? '<p class="gs-sub">' + sub + '</p>' : '') + body + '</fieldset>';

    const form = '<form id="sign-flow" class="gs-form split-main" data-form="signup" data-t0="' + Date.now() + '" novalidate>' + HONEYPOT +
      '<ol class="gs-progress" aria-label="Progress">' + SIGN_STEPS.map((s, i) =>
        '<li data-i="' + i + '"><button type="button" data-gs="go" data-i="' + i + '" disabled><span class="gs-n">' + pad2(i + 1) + '</span><span class="gs-name">' + s + '</span></button></li>').join('') + '</ol>' +
      step(0, 'Who <span class="accent">are you?</span>', 'The basics, so ' + esc(first) + ' knows who he is listening to.',
        '<div class="field-row">' + field('artist', 'Artist name', inp('artist', 'required autocomplete="off"')) + field('name', 'Your name', inp('name', 'autocomplete="name"'), true) + '</div>' +
        '<div class="field-row">' + field('email', 'Email', inp('email', 'type="email" autocomplete="email" required')) + field('city', 'City / country', inp('city', 'autocomplete="address-level2"'), true) + '</div>' +
        '<div class="field-row">' + field('age', 'Age', sel('age', ['18 or over', 'Under 18'], 'required')) + '<div class="field gs-spacer" aria-hidden="true"></div></div>' +
        '<div class="gs-guardian" hidden>' + tick('guardian', 'A parent or guardian knows I am sending this and is OK with it.') + '</div>') +
      step(1, 'Let him <span class="accent">hear it</span>', 'Two or three of your best tracks as private links: SoundCloud, Google Drive, Dropbox or an unlisted YouTube video. No attachments.',
        field('link1', 'Your best track', inp('link1', 'type="url" placeholder="https://" required')) +
        '<div class="field-row">' + field('link2', 'Second track', inp('link2', 'type="url" placeholder="https://"'), true) + field('link3', 'Third track', inp('link3', 'type="url" placeholder="https://"'), true) + '</div>' +
        '<div class="field-row">' + field('instagram', 'Instagram', inp('instagram', 'placeholder="@handle" autocomplete="off"'), true) + field('tiktok', 'TikTok', inp('tiktok', 'placeholder="@handle" autocomplete="off"'), true) + '</div>' +
        field('streaming', 'Spotify / Apple Music page', inp('streaming', 'type="url" placeholder="https://"'), true)) +
      step(2, 'What does it <span class="accent">sound like?</span>', 'Pick everything that fits. There are no wrong answers.',
        checks('sound', SIGN_TAGS, 'gs-sound-l', 'Your sound') +
        '<div class="field-row">' + field('soundsLike', 'Sounds like', inp('soundsLike', 'placeholder="Artists people compare you to" autocomplete="off"'), true) + field('stage', 'Where you are right now', sel('stage', SIGN_STAGES), true) + '</div>') +
      step(3, 'What do you <span class="accent">want?</span>', 'What would help you most from a label right now?',
        checks('wants', SIGN_WANTS, 'gs-wants-l', 'Looking for', true) +
        field('message', 'Tell ' + esc(first) + ' about you', '<textarea id="' + id('message') + '" name="message" rows="6" required></textarea>', false, 'Where you are from, how you make your music, what you are working on next.')) +
      step(4, 'Ready to <span class="accent">send?</span>', 'Check it over. You can go back and change anything.',
        '<div class="gs-review"></div>' +
        tick('rights', 'This is my music (or I have the rights to share it), and I understand that sending it does not mean I am signed.')) +
      '<div class="gs-nav">' +
        '<button type="button" class="btn btn-ghost" data-gs="back" hidden>Back</button>' +
        '<button type="submit" class="btn btn-prism cr-btn gs-next">Next</button>' +
      '</div>' +
      '<p class="form-status" role="status"></p>' +
      '<p class="fine gs-saved">Your answers are saved on this device as you go.</p>' +
    '</form>';

    return pageHero('✦ Get signed', 'Join the <span class="accent">founding roster</span>',
      'Crashed is signing its first artists: psychedelic hip hop and trap, underground and rising. Five short steps, about three minutes, straight to ' + esc(first) + '.', 60) +
      '<div class="wrap"><section class="sec gs" style="padding-top:56px">' +
      '<div class="split" style="padding:0;gap:64px;align-items:flex-start">' + form +
        '<aside class="split-side gs-aside">' +
          '<p class="credit-h">Who we\'re looking for</p>' + lookingForList('look-list') +
          '<div class="gs-eric">' + (F.photo ? '<img src="' + esc(F.photo) + '" alt="" width="64" height="64">' : '') +
            '<div><p class="gs-eric-name">' + esc(F.name) + '</p><p class="fine">' + esc(F.role) + ' · listens to every submission himself</p></div></div>' +
          '<p class="fine">Prefer email? Write to <a class="u-link" href="mailto:' + esc(to) + '">' + esc(to) + '</a> with private links, not attachments.</p>' +
        '</aside>' +
      '</div></section>' + signingInfo({ compact: true }) + '</div>' + footerSmall();
  };

  /* step-by-step behaviour for #sign-flow */
  function gsData(form) {
    const out = {};
    $$('[name]', form).forEach((el) => {
      if (el.name === '_gotcha') return;
      if (el.type === 'checkbox') {
        if (el.name === 'guardian' || el.name === 'rights') out[el.name] = el.checked;
        else { out[el.name] = out[el.name] || []; if (el.checked) out[el.name].push(el.value); }
      } else out[el.name] = el.value.trim();
    });
    return out;
  }
  function gsFill(form, data) {
    $$('[name]', form).forEach((el) => {
      if (el.name === '_gotcha' || !(el.name in data)) return;
      const v = data[el.name];
      if (el.type === 'checkbox') el.checked = Array.isArray(v) ? v.indexOf(el.value) >= 0 : !!v;
      else el.value = v || '';
    });
  }
  let gsTimer = 0;
  function gsSave(form) {
    clearTimeout(gsTimer);
    gsTimer = setTimeout(() => { if (form.isConnected) store.set('signDraft', { v: 1, step: form._step || 0, data: gsData(form) }); }, 250);
  }
  function gsGuardian(form) {
    const under = form.querySelector('[name=age]').value === 'Under 18';
    form.querySelector('.gs-guardian').hidden = !under;
  }
  function gsReview(form) {
    const d = gsData(form);
    const row = (label, val, step) => val ? '<div><dt>' + label + '</dt><dd>' + val + '</dd><dd class="gs-edit"><button type="button" data-gs="go" data-i="' + step + '">Edit</button></dd></div>' : '';
    const link = (u) => u ? '<a class="u-link" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace(/^https?:\/\//, '').slice(0, 48)) + '</a>' : '';
    const msg = d.message.length > 220 ? d.message.slice(0, 217) + '…' : d.message;
    form.querySelector('.gs-review').innerHTML = '<dl class="gs-summary">' +
      row('Artist', esc(d.artist) + (d.name ? ' <span class="muted">(' + esc(d.name) + ')</span>' : ''), 0) +
      row('Email', esc(d.email), 0) + row('From', esc(d.city), 0) + row('Age', esc(d.age), 0) +
      row('Tracks', [d.link1, d.link2, d.link3].filter(Boolean).map(link).join('<br>'), 1) +
      row('Socials', [d.instagram && 'IG ' + esc(d.instagram), d.tiktok && 'TikTok ' + esc(d.tiktok)].filter(Boolean).join(' · ') + (d.streaming ? (d.instagram || d.tiktok ? '<br>' : '') + link(d.streaming) : ''), 1) +
      row('Sound', esc(d.sound.join(', ')) + (d.soundsLike ? '<br><span class="muted">Sounds like ' + esc(d.soundsLike) + '</span>' : ''), 2) +
      row('Stage', esc(d.stage), 2) + row('Looking for', esc(d.wants.join(', ')), 3) + row('About', esc(msg), 3) +
    '</dl>';
  }
  function gsShow(form, n, focus) {
    const steps = $$('.gs-step', form), last = steps.length - 1;
    n = Math.max(0, Math.min(n, last));
    form._step = n;
    steps.forEach((s, i) => { s.hidden = i !== n; });
    $$('.gs-progress li', form).forEach((li, i) => {
      li.classList.toggle('done', i < n); li.classList.toggle('on', i === n);
      const b = li.querySelector('button'); b.disabled = i >= n;
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    form.querySelector('[data-gs=back]').hidden = n === 0;
    form.querySelector('.gs-next').textContent = n === last ? 'Send to ' + D.founder.name.split(' ')[0] : n === last - 1 ? 'Review' : 'Next';
    form.querySelector('.form-status').textContent = '';
    if (n === last) gsReview(form);
    if (focus) {
      const top = form.getBoundingClientRect().top;
      if (top < 80) window.scrollTo({ top: window.scrollY + top - 110, behavior: 'smooth' });
      steps[n].querySelector('.gs-title').focus({ preventScroll: true });
    }
  }
  /** Check the visible step. Returns true when it is complete. */
  function gsCheck(form) {
    const st = $$('.gs-step', form)[form._step || 0];
    const base = validate(st);                                              // focuses the first bad text field itself
    let ok = base, first = null;
    const fail = (el, msg) => { setErr(el, msg); ok = false; first = first || el; };
    const age = st.querySelector('[name=age]'), g = st.querySelector('[name=guardian]');
    if (age && g && age.value === 'Under 18' && !g.checked) fail(g, 'Please check with a parent or guardian first');
    const sound = st.querySelectorAll('[name=sound]');
    if (sound.length && ![].some.call(sound, (c) => c.checked)) fail(sound[0], 'Pick at least one');
    const rights = st.querySelector('[name=rights]');
    if (rights && !rights.checked) fail(rights, 'Please confirm this before sending');
    if (base && first) first.focus();
    return ok;
  }
  function initSignFlow() {
    const form = $('#sign-flow'); if (!form) return;
    const draft = store.get('signDraft', null);
    if (draft && draft.v === 1 && draft.data) {
      gsFill(form, draft.data); gsGuardian(form);
      form.dataset.t0 = Date.now() - 60000;                                  // typed on an earlier visit: don't treat a quick send as a bot
    }
    // reopen at the first step that still needs answers (never further than where they were)
    let n = 0;
    const want = draft && draft.step || 0;
    while (n < want) {                                                      // checked quietly: no errors shown on load
      const st = $$('.gs-step', form)[n];
      const complete = $$('input, select, textarea', st).every((i) => !i.required || i.value.trim()) && (!st.querySelector('[name=sound]') || $$('[name=sound]:checked', st).length);
      if (!complete) break;
      n++;
    }
    gsShow(form, n, false);
    if (draft && draft.data && draft.data.artist) form.querySelector('.gs-saved').textContent = 'Welcome back. We kept your answers on this device.';
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gs]'); const form = b && b.closest('#sign-flow');
    if (!form) return;
    if (b.dataset.gs === 'back') gsShow(form, (form._step || 0) - 1, true);
    if (b.dataset.gs === 'go') gsShow(form, +b.dataset.i, true);
    gsSave(form);
  });
  ['input', 'change'].forEach((t) => document.addEventListener(t, (e) => {
    const form = e.target.closest && e.target.closest('#sign-flow');
    if (!form || e.target.name === '_gotcha') return;
    if (e.target.name === 'age') gsGuardian(form);
    if (e.target.name === 'sound') setErr(form.querySelector('[name=sound]'), '');
    else if (e.target.type === 'checkbox' && e.target.getAttribute('aria-invalid') === 'true') setErr(e.target, '');
    gsSave(form);
  }));

  /* ---------- about ---------- */
  views.about = function () {
    const A = D.about, F = D.founder;
    const first = F.name.split(' ')[0];
    const ig = F.socials && F.socials.instagram;
    const M = A.manifesto || {};
    const lines = M.lines && M.lines.length ? M.lines : [A.headline];
    return '<section class="manifesto-hero" aria-labelledby="about-h">' +
        '<div aria-hidden="true" class="cr-liquid manifesto-bg" data-viz="about" data-viz-hue="20"><div class="cr-marble" style="position:absolute;inset:-25%;filter:hue-rotate(20deg);animation:cr-spin 120s linear infinite"></div></div>' +
        '<div aria-hidden="true" class="manifesto-shade"></div>' +
        '<div class="wrap manifesto-inner">' + eyebrow(esc(M.kicker || '✦ About')) +
          '<h1 id="about-h" class="manifesto-h" data-react>' + lines.map((l, i) => '<span class="m-line" style="--i:' + i + '">' + l + '</span>').join(' ') + '</h1>' +
          '<p class="lede manifesto-sub">' + esc(A.intro) + '</p>' +
          '<div class="btn-row manifesto-cta"><a href="#/get-signed" class="btn btn-prism cr-btn">Get signed</a>' +
            '<a href="#/about/founder" class="btn btn-ghost" data-action="scroll" data-target="founder">Meet ' + esc(first) + '</a></div>' +
        '</div>' +
      '</section>' +
      '<div class="wrap">' +
      (A.pillars && A.pillars.length ? '<section class="manifesto-list" aria-labelledby="pillars-h">' +
        '<h2 id="pillars-h" class="eyebrow">✦ The manifesto</h2>' +
        '<ol class="m-statements">' + A.pillars.map((p, i) =>
          '<li><span class="m-no">' + pad2(i + 1) + '</span><div><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div></li>').join('') + '</ol>' +
      '</section>' : '') +
      '<section id="about-story" class="sec" style="padding-top:64px">' +
        '<div class="split" style="padding:0">' +
          '<div class="split-main">' + eyebrow('✦ The story') +
            '<h2 class="h-section" style="margin-bottom:32px">A label for<br><span class="accent">the float</span></h2>' +
            '<div class="about-story">' + A.story.map((p) => '<p class="body-copy">' + esc(p) + '</p>').join('') + '</div>' +
          '</div>' +
          '<aside class="split-side about-facts">' +
            '<dl>' +
              '<div><dt>Founded by</dt><dd><a href="#/about/founder" data-action="scroll" data-target="founder">' + esc(F.name) + '</a></dd></div>' +
              '<div><dt>Sound</dt><dd>Psychedelic hip hop &amp; trap</dd></div>' +
              '<div><dt>Roster</dt><dd><a href="#/artists">' + (artists.length ? artists.length + ' artist' + (artists.length === 1 ? '' : 's') : 'Founding spots open') + '</a></dd></div>' +
              '<div><dt>Catalog</dt><dd><a href="#/releases">' + (releases.length ? releases.length + ' release' + (releases.length === 1 ? '' : 's') : 'First drop coming') + '</a></dd></div>' +
              '<div><dt>Status</dt><dd class="status"><span class="status-dot" aria-hidden="true"></span>Accepting demos</dd></div>' +
            '</dl>' +
          '</aside>' +
        '</div>' +
      '</section>' +

      ((D.signing || {}).lookingFor && D.signing.lookingFor.length ? '<section class="sec-sm looking" aria-labelledby="look-h">' +
        '<div class="sec-head" style="margin-bottom:32px"><div>' + eyebrow('✦ The sound') + '<h2 id="look-h" class="h-section">Who we\'re <span class="accent">looking for</span></h2></div></div>' +
        lookingForList('look-grid') +
      '</section>' : '') +

      '<section class="sign-band" aria-labelledby="band-h">' +
        '<div aria-hidden="true" class="cr-liquid sign-band-bg"><div class="cr-marble" style="position:absolute;inset:-30%;filter:hue-rotate(-60deg);animation:cr-spin 90s linear infinite"></div></div>' +
        '<div class="sign-band-inner">' + eyebrow('✦ ' + esc((D.founding || {}).kicker || 'Now signing')) +
          '<h2 id="band-h" class="h-display">Are you <span class="accent">next?</span></h2>' +
          '<p class="lede">Five short steps. Straight to ' + esc(first) + '.</p>' +
          '<div class="btn-row"><a href="#/get-signed" class="btn btn-bone cr-btn">Get signed</a></div>' +
        '</div>' +
      '</section>' +

      signingInfo({ compact: true }) +

      '<section id="founder" class="founder" aria-labelledby="founder-h">' +
        '<div class="founder-photo">' +
          '<div aria-hidden="true" class="cr-liquid founder-glow"><div class="cr-marble" style="position:absolute;inset:0"></div></div>' +
          '<div class="founder-arch">' + (F.photo ? '<img src="' + esc(F.photo) + '" alt="' + esc(F.name) + ', founder of Crashed Records" width="288" height="360">' : '') + '</div>' +
          longStar('position:absolute;right:-6px;top:8%;width:22px;z-index:2') +
        '</div>' +
        '<div class="founder-info">' + eyebrow('✦ ' + esc(F.role)) +
          '<h2 id="founder-h" class="founder-name">' + esc(F.name) + '</h2>' +
          F.bio.map((p) => '<p class="body-copy">' + esc(p) + '</p>').join('') +
          '<div class="btn-row" style="margin-top:8px">' +
            '<button type="button" class="btn btn-prism cr-btn" data-action="scroll" data-target="contact-founder">Message ' + esc(first) + '</button>' +
            '<a class="btn-mono" href="mailto:' + esc(F.email) + '">' + esc(F.email) + '</a>' +
            (ig ? '<a class="icon-btn" href="' + esc(ig) + '" target="_blank" rel="noopener" aria-label="' + esc(first) + ' on Instagram">' + ICON.instagram + '</a>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section id="contact-founder" class="sec contact" aria-labelledby="cf-h">' +
        '<div class="sec-head"><div>' + eyebrow('✦ Contact') + '<h2 id="cf-h" class="h-section">Talk to <span class="accent">' + esc(first) + '</span></h2></div></div>' +
        '<div class="split" style="padding:0;gap:64px">' +
          contactForm('founder', 'split-main') +
          '<aside class="split-side">' +
            '<p class="body-copy">Signing, collaborations, shows, press or just an idea: messages here go straight to ' + esc(first) + '.</p>' +
            '<p class="credit-h" style="margin-top:12px">Email directly</p><p class="credit"><a class="u-link" href="mailto:' + esc(F.email) + '">' + esc(F.email) + '</a></p>' +
            '<p class="fine">Sending opens your email app with everything filled in. Sending music? Include a private streaming link rather than attachments.</p>' +
          '</aside>' +
        '</div>' +
      '</section>' +
      '</div>' + footerBig();
  };

  views.notFound = function () {
    return '<div class="wrap narrow-page">' + longStar('width:22px;margin-bottom:24px') + '<h1 class="h-section">Lost in <span class="accent">orbit</span></h1>' +
      '<p class="body-copy">That page drifted off. Let\'s get you back down.</p>' +
      '<div class="btn-row"><a href="#/" class="btn btn-bone cr-btn">Home</a><a href="#/releases" class="btn btn-ghost">Releases</a></div></div>' + footerSmall();
  };

  /* ------------------------------------------------------------------ router */
  const HOME_SECTIONS = ['now-floating', 'trip-log', 'visuals', 'merch'];
  const routes = [
    [/^\/?$/, () => ['home', views.home(), 'Psychedelic hip hop & rap']],
    [new RegExp('^/(' + HOME_SECTIONS.join('|') + ')$'), (m) => ['home', views.home(), 'Psychedelic hip hop & rap', m[1]]],
    [/^\/artists\/?$/, () => ['artists', views.artists(), 'Artists']],
    [/^\/artists\/([\w-]+)$/, (m) => ['artists', views.artist(m[1]), artistBy[m[1]] ? artistBy[m[1]].name : 'Not found']],
    [/^\/releases\/?$/, () => ['releases', views.releases(), 'Releases']],
    [/^\/releases\/([\w-]+)$/, (m) => ['releases', views.release(m[1]), releaseBy[m[1]] ? releaseBy[m[1]].title + ' — ' + releaseBy[m[1]].artistObj.name : 'Not found']],
    [/^\/shows\/?$/, () => ['trip-log', views.shows(), 'Trip Log']],
    [/^\/shop\/?$/, () => ['merch', views.shop(), 'Shop']],
    [/^\/checkout\/?$/, () => ['', views.checkout(), 'Checkout']],
    [/^\/order\/([\w-]+)$/, (m) => ['', views.order(m[1]), 'Order confirmed']],
    [/^\/(?:get-signed|contact\/demos)\/?$/, () => ['signed', views.getSigned(), 'Get signed']],
    [/^\/contact(?:\/(\w+))?\/?$/, (m) => ['contact', views.contact(m[1]), 'Contact']],
    [/^\/about\/?$/, () => ['about', views.about(), 'About']],
    [/^\/about\/(founder|contact)$/, (m) => ['about', views.about(), 'About', m[1] === 'founder' ? 'founder' : 'contact-founder']]
  ];
  let currentPath = null;

  function route() {
    // Plain in-page anchors (e.g. the skip link's #view) aren't routes.
    if (location.hash && location.hash.indexOf('#/') !== 0) return;
    const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
    let out = null;
    lists = {};
    for (const [re, fn] of routes) { const m = path.match(re); if (m) { out = fn(m); break; } }
    if (!out) out = ['', views.notFound(), 'Not found'];
    const [nav, html, title, section] = out;
    const samePage = currentPath !== null && nav === 'home' && document.body.dataset.view === 'home';
    closeOverlays();
    if (!samePage) {
      $('#view').innerHTML = html;
      document.body.dataset.view = nav || 'page';
      if (nav === 'home' && featured) regList('featured', featured.trackObjs);
      if (nav === 'signed') initSignFlow();
    }
    currentPath = path;
    document.title = title + ' · ' + D.label.name;
    $$('.nav-links a, .mobile-menu a').forEach((a) => {
      const on = a.dataset.nav === nav && nav !== 'home';
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (section) {
      const el = document.getElementById(section);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: samePage ? 'smooth' : 'auto', block: 'start' }));
    } else if (!samePage) {
      window.scrollTo(0, 0);
    } else if (path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (!samePage) { const v = $('#view'); v.focus({ preventScroll: true }); }
    syncPlayingUI();
    if (window.CRViz) window.CRViz.refresh();
  }

  /* ------------------------------------------------------------------ cart */
  const Cart = {
    items() { return store.get('cart', []); },
    save(items) { store.set('cart', items); renderCartUI(); },
    add(entry) {
      const items = this.items();
      const ex = items.find((i) => i.key === entry.key);
      if (ex) ex.qty = Math.min(99, ex.qty + (entry.qty || 1)); else items.push(Object.assign({ qty: 1 }, entry));
      this.save(items);
    },
    setQty(key, q) {
      let items = this.items();
      if (q <= 0) items = items.filter((i) => i.key !== key);
      else items.forEach((i) => { if (i.key === key) i.qty = Math.min(99, q); });
      this.save(items);
    },
    count() { return this.items().reduce((s, i) => s + i.qty, 0); },
    hasPhysical() { return this.items().some((i) => !i.digital); },
    totals() {
      const subtotal = this.items().reduce((s, i) => s + i.price * i.qty, 0);
      const sh = D.label.shipping || { flat: 0, freeOver: 0 };
      const shipping = this.hasPhysical() && subtotal < sh.freeOver ? sh.flat : 0;
      return { subtotal, shipping, total: subtotal + shipping };
    },
    clear() { this.save([]); }
  };

  function addMerch(m, size) {
    Cart.add({ key: 'm:' + m.id + ':' + (size || ''), name: m.name, variant: size ? 'Size ' + size : (m.tag === 'Pre-order' ? 'Pre-order' : ''), price: m.price, digital: false, art: { hue: m.hue, rot: 30, image: m.image } });
    toast(m.name + (size ? ' (' + size + ')' : '') + ' added to cart', { label: 'View cart', action: openCart });
    bumpCart();
  }
  function addRelease(r, fi) {
    const f = r.formats[fi];
    if (!f || f.soldOut) return;
    Cart.add({ key: 'r:' + r.slug + ':' + fi, name: r.title + ' — ' + r.artistObj.name, variant: f.name, price: f.price, digital: !!f.digital, art: { hue: r.hue, rot: r.rot, cover: r.cover } });
    toast(r.title + ' (' + f.name + ') added to cart', { label: 'View cart', action: openCart });
    bumpCart();
  }
  function bumpCart() { const b = $('.cart-count'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }

  function renderCartUI() {
    const n = Cart.count();
    $$('.cart-count').forEach((b) => { b.textContent = n; b.hidden = !n; });
    $$('[data-action="open-cart"]').forEach((b) => b.setAttribute('aria-label', 'Cart, ' + n + ' item' + (n === 1 ? '' : 's')));
    const body = $('#cart-body');
    if (!body) return;
    const items = Cart.items();
    if (!items.length) {
      body.innerHTML = '<div class="cart-empty">' + longStar('width:16px') + '<p>Your cart is floating empty.</p><a href="#/shop" class="btn btn-bone cr-btn">Browse the shop</a></div>';
      $('#cart-foot').innerHTML = '';
      return;
    }
    body.innerHTML = '<ul class="cart-list">' + items.map((it) =>
      '<li><div class="mini-art">' + art(it.art || {}, { inset: '-30%' }) + '</div>' +
      '<div class="cart-text"><p class="cart-name">' + esc(it.name) + '</p><p class="muted">' + esc(it.variant || '') + '</p>' +
      '<div class="qty"><button type="button" data-action="qty" data-key="' + esc(it.key) + '" data-d="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">' + it.qty + '</span>' +
      '<button type="button" data-action="qty" data-key="' + esc(it.key) + '" data-d="1" aria-label="Increase quantity">+</button>' +
      '<button type="button" class="remove" data-action="remove" data-key="' + esc(it.key) + '">Remove</button></div></div>' +
      '<span class="cart-price">' + money(it.price * it.qty) + '</span></li>').join('') + '</ul>';
    const t = Cart.totals(), sh = D.label.shipping;
    const left = sh && Cart.hasPhysical() && t.subtotal < sh.freeOver ? '<p class="fine">' + money(sh.freeOver - t.subtotal) + ' away from free shipping.</p>' : '';
    $('#cart-foot').innerHTML = totalsHTML(t) + left + '<a href="#/checkout" class="btn btn-prism cr-btn" style="justify-content:center">Checkout</a>';
  }

  /* ------------------------------------------------------------------ overlays */
  let lastFocus = null;
  function openLayer(id) {
    closeOverlays(true);
    lastFocus = document.activeElement;
    const el = document.getElementById(id);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
    document.body.classList.add('locked');
    const f = el.querySelector('[data-autofocus]') || el.querySelector('input, button, a');
    if (f) setTimeout(() => f.focus(), 30);
  }
  function closeOverlays(keepFocus) {
    let closed = false;
    $$('.layer.open, .layer:not([hidden])').forEach((el) => {
      closed = true;
      el.classList.remove('open');
      setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; }, 250);
      if (el.id === 'video-modal') $('#video-frame').innerHTML = '';
      if (el.id === 'float') { clearTimeout(FL.idle); el.classList.remove('idle'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setTimeout(() => window.CRViz && window.CRViz.refresh(), 0); }
    });
    document.body.classList.remove('locked');
    $('.menu-btn') && $('.menu-btn').setAttribute('aria-expanded', 'false');
    if (closed && !keepFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function openCart() { renderCartUI(); openLayer('cart'); }

  function openProduct(m) {
    const sizes = m.sizes || [];
    $('#product-body').innerHTML =
      '<div class="product">' +
        '<div class="product-img">' + (m.image ? '<img class="art-img" src="' + esc(m.image) + '" alt="">' : merchArt(m)) + '<span class="merch-tag">' + esc(m.tag) + '</span></div>' +
        '<div class="product-info">' + eyebrow('✦ Merch') + '<h2 id="product-title" class="h-sub" style="margin:0">' + esc(m.name) + '</h2>' +
          '<p class="merch-price" style="font-size:16px">' + money(m.price) + '</p><p class="body-copy">' + esc(m.desc || '') + '</p>' +
          (sizes.length ? '<div role="radiogroup" aria-label="Size" class="sizes">' + sizes.map((s, i) => '<button type="button" role="radio" class="chip" data-action="size" aria-checked="' + (i === 1 || sizes.length === 1) + '" aria-pressed="' + (i === 1 || sizes.length === 1) + '" data-size="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>' : '') +
          '<button type="button" class="btn btn-bone cr-btn" data-action="add-merch" data-id="' + esc(m.id) + '" style="justify-content:center">Add to cart</button>' +
          (m.release ? '<a class="more-link" href="#/releases/' + esc(m.release) + '" style="align-self:flex-start">Listen to the record →</a>' : '') +
        '</div></div>';
    openLayer('product-modal');
  }

  function openVideo(i) {
    const v = D.videos[i]; if (!v) return;
    const a = artistBy[v.artist];
    const frame = $('#video-frame');
    if (v.youtubeId) {
      frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.youtubeId) + '?autoplay=1&rel=0" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      P.playing && P.pause();
    } else {
      const t = allTracks.find((x) => x.title.toLowerCase() === v.title.toLowerCase());
      frame.innerHTML = '<div class="video-soon"><div aria-hidden="true" class="cr-liquid" style="position:absolute;inset:-20%"><div class="cr-marble" style="position:absolute;inset:-20%;animation:cr-spin 30s linear infinite"></div></div>' +
        '<div class="video-soon-body">' + eyebrow('✦ Premieres soon') + '<p class="video-title">' + esc(v.title) + '</p><p class="body-copy">' + esc(a ? a.name : '') + '</p>' +
        (t ? '<button type="button" class="btn btn-bone cr-btn" data-action="play-id" data-id="' + t.id + '">' + ICON.play + 'Play the track</button>' : '') + '</div></div>';
    }
    openLayer('video-modal');
  }

  /* ------------------------------------------------------------------ search */
  function searchIndex(q) {
    q = q.trim().toLowerCase();
    if (!q) return null;
    const has = (...s) => s.some((x) => String(x || '').toLowerCase().indexOf(q) > -1);
    return {
      Artists: artists.filter((a) => has(a.name, a.city, a.tags.join(' '))).map((a) => ({ href: '#/artists/' + a.slug, title: a.name, sub: a.city, art: a })),
      Releases: releases.filter((r) => has(r.title, r.no, r.artistObj.name, r.kind)).map((r) => ({ href: '#/releases/' + r.slug, title: r.title, sub: r.artistObj.name + ' · ' + r.kind, art: r })),
      Tracks: allTracks.filter((t) => has(t.title, t.feat)).slice(0, 8).map((t) => ({ href: '#/releases/' + t.releaseSlug, title: t.title, sub: t.artistName + ' · ' + t.releaseTitle, art: t, play: t.id })),
      Shows: shows.filter((s) => has(s.city, s.venue, showArtists(s).map((a) => a.name).join(' '))).map((s) => ({ href: '#/shows', title: s.city + ' — ' + fmtShow(s.date), sub: s.venue, art: { hue: 60 } })),
      Merch: merch.filter((m) => has(m.name, m.tag)).map((m) => ({ href: '#/shop', title: m.name, sub: money(m.price), art: { hue: m.hue }, product: m.id }))
    };
  }
  function renderSearch(q) {
    const res = searchIndex(q), box = $('#search-results');
    if (!res) { box.innerHTML = '<p class="search-hint">Artists, releases, tracks, cities, merch…</p>'; return; }
    const groups = Object.entries(res).filter(([, v]) => v.length);
    if (!groups.length) { box.innerHTML = '<p class="search-hint">Nothing matches “' + esc(q) + '”. Try another word.</p>'; return; }
    box.innerHTML = groups.map(([g, items]) => '<div class="search-group"><p class="credit-h">' + g + '</p><ul>' + items.map((it) =>
      '<li><a href="' + it.href + '" class="search-item"' + (it.play ? ' data-action="play-id" data-id="' + it.play + '" data-nav="1"' : '') + (it.product ? ' data-action="product" data-id="' + esc(it.product) + '"' : '') + '>' +
      '<span class="mini-art">' + art(it.art, { inset: '-30%' }) + '</span><span class="search-text"><span class="search-title">' + esc(it.title) + '</span><span class="muted">' + esc(it.sub) + '</span></span>' +
      (it.play ? '<span class="search-play">' + ICON.play + '</span>' : '') + '</a></li>').join('') + '</ul></div>').join('');
  }

  /* ------------------------------------------------------------------ player UI */
  const PUI = {};
  function initPlayerUI() {
    PUI.root = $('#player'); PUI.disc = $('.p-disc'); PUI.toggle = $('.p-toggle');
    PUI.title = $('.p-title'); PUI.artist = $('.p-artist'); PUI.seek = $('.p-seek');
    PUI.cur = $('.p-cur'); PUI.dur = $('.p-dur'); PUI.queue = $('#queue-list');
    P.setVolume(store.get('volume', 0.8));
    $('.p-vol').value = P.volume;
    if (!featured) return;                       // no music yet: initMusicless() hides the player
    P.setQueue(featured.trackObjs, 0, false);

    P.on((type) => {
      if (type === 'track' || type === 'state') { renderPlayer(); renderFloat(); }
      if (type === 'time') { renderTime(); renderFloatTime(); }
    });
    let seeking = false;
    PUI.seek.addEventListener('input', () => { seeking = true; PUI.cur.textContent = fmtTime(PUI.seek.value * P.duration()); PUI.seek.style.setProperty('--p', (PUI.seek.value * 100) + '%'); });
    PUI.seek.addEventListener('change', () => { P.seek(PUI.seek.value * P.duration()); seeking = false; });
    PUI.isSeeking = () => seeking;
    $('.p-vol').addEventListener('input', (e) => { P.setVolume(+e.target.value); store.set('volume', +e.target.value); e.target.style.setProperty('--p', (e.target.value * 100) + '%'); });
    $('.p-vol').style.setProperty('--p', (P.volume * 100) + '%');
    renderPlayer();
  }
  function renderPlayer() {
    const t = P.current;
    if (!t) return;
    PUI.root.classList.toggle('playing', P.playing);
    PUI.toggle.innerHTML = P.playing ? ICON.pause : ICON.play;
    PUI.toggle.setAttribute('aria-label', P.playing ? 'Pause' : 'Play');
    PUI.title.textContent = t.title; PUI.title.href = '#/releases/' + t.releaseSlug;
    PUI.artist.textContent = t.artistName + (t.feat ? ' feat. ' + t.feat : ''); PUI.artist.href = '#/artists/' + t.artistSlug;
    $('.p-disc .cr-marble').style.filter = 'hue-rotate(' + (t.hue || 0) + 'deg)';
    PUI.queue.innerHTML = P.queue.map((q, i) => '<li><button type="button" data-action="jump" data-i="' + i + '" class="' + (i === P.index ? 'on' : '') + '"' + (i === P.index ? ' aria-current="true"' : '') + '>' +
      '<span class="track-n">' + (i === P.index && P.playing ? ICON.eq.replace('class="eq"', 'class="eq on"') : pad2(i + 1)) + '</span><span class="q-text"><span>' + esc(q.title) + '</span><span class="muted">' + esc(q.artistName) + '</span></span><span class="track-dur">' + esc(q.dur) + '</span></button></li>').join('');
    $('.queue-from').textContent = t.releaseTitle;
    renderTime(); syncPlayingUI();
  }
  function renderTime() {
    const d = P.duration(), c = Math.min(P.time(), d);
    if (PUI.isSeeking && PUI.isSeeking()) return;
    PUI.cur.textContent = fmtTime(c); PUI.dur.textContent = fmtTime(d);
    const p = d ? c / d : 0;
    PUI.seek.value = p; PUI.seek.style.setProperty('--p', (p * 100) + '%');
  }
  /** Reflect the playing track on whatever page is showing. */
  function syncPlayingUI() {
    const t = P.current, id = t && t.id;
    $$('[data-track]').forEach((li) => {
      const on = li.dataset.track === id;
      li.classList.toggle('active', on);
      li.classList.toggle('playing', on && P.playing);
      const b = li.querySelector('.track-btn');
      if (b) b.setAttribute('aria-label', (on && P.playing ? 'Pause ' : 'Play ') + li.querySelector('.track-title').textContent);
    });
    $$('[data-action="play-list"]').forEach((b) => {
      const list = lists[b.dataset.list] || [];
      const mine = P.playing && sameQueue(list);
      b.innerHTML = (mine ? ICON.pause : ICON.play) + '<span>' + (mine ? 'Pause' : esc(b.dataset.labelPlay)) + '</span>';
    });
    $$('[data-sleeve]').forEach((s) => s.classList.toggle('spinning', !!(P.playing && t && t.releaseSlug === s.dataset.sleeve)));
    // covers of the record that is playing pulse with the beat (see viz.js)
    $$('[data-cover]').forEach((c) => c.toggleAttribute('data-react', !!(P.playing && t && t.releaseSlug === c.dataset.cover)));
  }

  /* ------------------------------------------------------------------ toast */
  let toastTimer;
  function toast(msg, act) {
    const el = $('#toast');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button" class="toast-act">' + esc(act.label) + '</button>' : '');
    if (act) el.querySelector('.toast-act').onclick = () => { el.classList.remove('show'); act.action(); };
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
  }

  /* ------------------------------------------------------------------ forms */
  function setErr(input, msg) {
    const f = input.closest('.field'); const e = f && f.querySelector('.field-error');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (e) e.textContent = msg || '';
  }
  function validate(form) {
    let ok = true, first = null;
    $$('input, textarea, select', form).forEach((i) => {
      let msg = '';
      const v = i.value.trim();
      if (i.required && !v) msg = 'Required';
      else if (i.type === 'email' && v && !isEmail(v)) msg = 'That email doesn\'t look right';
      else if (i.type === 'url' && v && !/^https?:\/\/\S+\.\S+/.test(v)) msg = 'Paste a full link starting with https://';
      setErr(i, msg);
      if (msg) { ok = false; first = first || i; }
    });
    if (first) first.focus();
    return ok;
  }

  /** POST JSON and resolve on any 2xx; rejects on network errors, timeouts and non-2xx replies. */
  function postJSON(url, payload) {
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 12000) : 0;
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then((r) => { clearTimeout(timer); if (!r.ok) throw new Error('http ' + r.status); return true; },
        (err) => { clearTimeout(timer); throw err; });
  }

  /** Add the visitor to the mailing list (or just remember them on this device when no list is connected yet). */
  function subscribe(email) {
    const N = D.newsletter || {};
    if (!N.endpoint) return Promise.resolve('local');
    const data = Object.assign({ [N.emailField || 'email']: email }, N.extra || {});
    if (N.format === 'form') return fetch(N.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) }).then(() => 'sent');
    return postJSON(N.endpoint, data).then(() => 'sent');
  }

  const cooldownLeft = (kind) => {
    const wait = ((D.forms || {}).cooldownSeconds || 0) * 1000, last = store.get('last:' + kind, 0);
    return Math.max(0, Math.ceil((last + wait - Date.now()) / 1000));
  };
  const markSent = (kind) => store.set('last:' + kind, Date.now());
  const fillSeconds = (form) => (Date.now() - (+form.dataset.t0 || Date.now())) / 1000;

  const SENT_TEXT = {
    demos: 'Your music is on its way to Eric. If it is a fit, he will reach out.',
    founder: 'Your message is on its way to Eric.',
    booking: 'Your booking request is on its way.',
    press: 'Your note is on its way to the team.',
    general: 'Your message is on its way.'
  };
  function sentState(form, topic) {
    const box = document.createElement('div');
    box.className = 'form-sent'; box.setAttribute('role', 'status');
    box.innerHTML = '<p class="eyebrow" style="margin:0 0 12px">✦ Sent</p><h3 class="empty-title">Got it.</h3><p class="body-copy">' + esc(SENT_TEXT[topic] || SENT_TEXT.general) + '</p>' +
      '<div class="btn-row" style="margin-top:20px"><a href="#/" class="btn btn-bone cr-btn">Back home</a><a href="#/releases" class="btn btn-ghost cr-btn">Keep listening</a></div>';
    form.replaceWith(box);
    toast('Sent ✦');
  }

  document.addEventListener('submit', (e) => {
    const form = e.target, kind = form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'newsletter') {
      const input = form.querySelector('input[type=email]'), err = form.querySelector('.form-error'), btn = form.querySelector('button[type=submit]');
      const v = input.value.trim();
      if (!isEmail(v)) { err.textContent = v ? 'That email doesn\'t look right.' : 'Pop your email in first.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      const trap = form.querySelector('[name=_gotcha]');
      if (trap && trap.value) { form.outerHTML = joinedMsg(v); return; }                  // bot: pretend it worked, store nothing
      if (fillSeconds(form) < 1.5) { err.textContent = 'One second, then try again.'; return; }
      const wait = cooldownLeft('newsletter');
      if (wait) { err.textContent = 'You just signed up. Give it a few seconds.'; return; }
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Sending…';
      subscribe(v).then(() => {
        markSent('newsletter');
        store.set('newsletter', { email: v, at: new Date().toISOString() });
        $$('[data-form=newsletter]').forEach((f) => { f.outerHTML = joinedMsg(v); });
        toast('Welcome to the drift ✦');
      }, () => {
        btn.disabled = false; btn.textContent = 'Float me in';
        err.textContent = 'We couldn\'t reach the list just now. Please try again in a moment.';
      });
    }
    if (kind === 'checkout') {
      if (!validate(form)) return;
      const fd = Object.fromEntries(new FormData(form).entries());
      const t = Cart.totals();
      const order = { id: 'CR' + Date.now().toString(36).toUpperCase().slice(-6), at: new Date().toISOString(), email: fd.email, name: fd.name, shipTo: fd.address ? [fd.address, fd.city, fd.postal, fd.country].join(', ') : '', items: Cart.items(), total: t.total, test: true };
      const orders = store.get('orders', []); orders.push(order); store.set('orders', orders.slice(-20));
      Cart.clear();
      location.hash = '#/order/' + order.id;
    }
    if (kind === 'signup') {
      const last = $$('.gs-step', form).length - 1, n = form._step || 0;
      if (!gsCheck(form)) return;
      if (n < last) { gsShow(form, n + 1, true); gsSave(form); return; }
      const d = gsData(form), status = form.querySelector('.form-status'), F2 = D.forms || {};
      if (form.querySelector('[name=_gotcha]').value) { sentState(form, 'demos'); return; }   // bot: pretend it worked, send nothing
      if (fillSeconds(form) < (F2.minFillSeconds == null ? 4 : F2.minFillSeconds)) { status.textContent = 'That was quick. Give it a second and send again.'; return; }
      const wait = cooldownLeft('signup');
      if (wait) { status.textContent = 'You just sent one. Please wait ' + wait + ' seconds before sending another.'; return; }
      const flat = {};
      Object.keys(SIGN_LABELS).forEach((k) => { const v = d[k]; if (Array.isArray(v) ? v.length : v) flat[k] = Array.isArray(v) ? v.join(', ') : (v === true ? 'Yes' : v); });
      const to = D.label.emails.demos || D.label.emails.general;
      const subject = '[Get signed] ' + d.artist;
      const done = () => { markSent('signup'); store.set('signDraft', null); sentState(form, 'demos'); };
      const openEmail = (note) => {
        const body = Object.keys(flat).filter((k) => k !== 'message').map((k) => SIGN_LABELS[k] + ': ' + flat[k]).join('\n') + '\n\n' + d.message;
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.textContent = note + '✦ Your email app should open with everything filled in. Hit send there. If it didn\'t open, write to ' + to + '.';
      };
      if (!F2.endpoint) { openEmail(''); return; }
      const btn = form.querySelector('.gs-next'), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
      postJSON(F2.endpoint, Object.assign({ _subject: subject, _replyto: d.email, topic: 'Get signed' }, flat, F2.extra || {})).then(done,
        () => { btn.disabled = false; btn.textContent = label; openEmail('We couldn\'t send that from here, so we\'re using email instead. '); });
    }
    if (kind === 'contact') {
      if (!validate(form)) return;
      const fd = Object.fromEntries(new FormData(form).entries());
      const trap = fd._gotcha; delete fd._gotcha;
      const topic = form.dataset.topic, status = form.querySelector('.form-status'), F2 = D.forms || {};
      if (trap) { sentState(form, topic); return; }                                       // bot: pretend it worked, send nothing
      if (fillSeconds(form) < (F2.minFillSeconds == null ? 4 : F2.minFillSeconds)) { status.textContent = 'That was quick. Give it a second and send again.'; return; }
      const wait = cooldownLeft('contact');
      if (wait) { status.textContent = 'You just sent one. Please wait ' + wait + ' seconds before sending another.'; return; }
      const to = D.label.emails[topic] || D.label.emails.general;
      const subject = '[' + CONTACT[topic].label + '] ' + (fd.subject ? fd.subject + ': ' : '') + (fd.artist || fd.outlet || fd.name);
      const openEmail = (note) => {
        const body = Object.entries(fd).filter(([k]) => k !== 'message').map(([k, v]) => k[0].toUpperCase() + k.slice(1) + ': ' + v).join('\n') + '\n\n' + fd.message;
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.textContent = note + '✦ Your email app should open with the message ready. If it didn\'t, write to ' + to + '.';
      };
      if (!F2.endpoint) { openEmail(''); return; }
      const btn = form.querySelector('button[type=submit]'), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
      postJSON(F2.endpoint, Object.assign({ _subject: subject, topic: CONTACT[topic].label }, fd, F2.extra || {})).then(
        () => { markSent('contact'); sentState(form, topic); },
        () => { btn.disabled = false; btn.textContent = label; openEmail('We couldn\'t send that from here, so we\'re using email instead. '); }
      );
    }
  });
  document.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setErr(e.target, ''); });

  /** Share the current artist/release: the phone's share sheet where there is one, otherwise copy the link. */
  function shareLink(el) {
    const S = D.site || {};
    const url = S.sharePages ? new URL('share/' + el.dataset.kind + '/' + el.dataset.slug + '/', location.href.split('#')[0]).href : location.href;
    const title = el.dataset.title + ' · ' + D.label.name;
    const copy = () => {
      const done = () => toast('Link copied ✦');
      const fail = () => toast('Copy this link: ' + url);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fail); else fail();
    };
    if (navigator.share) navigator.share({ title, url }).catch((e) => { if (e && e.name !== 'AbortError') copy(); });
    else copy();
  }


  /* ------------------------------------------------------------------ float mode */
  // Full-screen listening room: the reactive marble fills the screen, the controls fade when idle.
  const FL = { seeking: false, idle: 0 };
  const floatOpen = () => { const f = $('#float'); return !!(f && !f.hidden); };
  function openFloat() {
    if (!P.current) return;
    openLayer('float');
    const fs = $('.f-fs'); if (fs) fs.hidden = !(document.fullscreenEnabled && $('#float').requestFullscreen);
    renderFloat(); floatWake();
    requestAnimationFrame(() => requestAnimationFrame(() => { if (window.CRViz) window.CRViz.refresh(); }));
  }
  function renderFloat() {
    if (!floatOpen()) return;
    const t = P.current; if (!t) return;
    $('.float-release').textContent = t.releaseTitle || '';
    $('.float-title').textContent = t.title;
    $('.float-artist').textContent = t.artistName + (t.feat ? ' feat. ' + t.feat : '');
    const tg = $('.f-toggle');
    tg.innerHTML = P.playing ? ICON.pause : ICON.play;
    tg.setAttribute('aria-label', P.playing ? 'Pause' : 'Play');
    $('#float').classList.toggle('playing', P.playing);
    if (!P.playing) floatWake();
    renderFloatTime();
  }
  function renderFloatTime() {
    if (!floatOpen() || FL.seeking) return;
    const d = P.duration(), c = Math.min(P.time(), d), p = d ? c / d : 0, s = $('.f-seek');
    $('.f-cur').textContent = fmtTime(c); $('.f-dur').textContent = fmtTime(d);
    s.value = p; s.style.setProperty('--p', (p * 100) + '%');
  }
  function floatWake() {
    const f = $('#float'); if (!f) return;
    f.classList.remove('idle');
    clearTimeout(FL.idle);
    FL.idle = setTimeout(() => { if (floatOpen() && P.playing && !FL.seeking) f.classList.add('idle'); }, 3200);
  }
  function floatFullscreen() {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    const f = $('#float');
    if (f.requestFullscreen) f.requestFullscreen().catch(() => toast('Full screen isn\'t available here.'));
    else toast('Full screen isn\'t available here.');
  }
  (function initFloat() {
    const f = $('#float'); if (!f) return;
    const s = $('.f-seek');
    s.addEventListener('input', () => { FL.seeking = true; $('.f-cur').textContent = fmtTime(s.value * P.duration()); s.style.setProperty('--p', (s.value * 100) + '%'); });
    s.addEventListener('change', () => { P.seek(s.value * P.duration()); FL.seeking = false; floatWake(); });
    ['pointermove', 'pointerdown', 'touchstart', 'focusin'].forEach((t) => f.addEventListener(t, floatWake, { passive: true }));
    document.addEventListener('keydown', (e) => {
      if (!floatOpen()) return;
      floatWake();
      const tag = e.target.tagName;
      if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'INPUT') { e.preventDefault(); e.stopPropagation(); P.toggle(); }
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && tag !== 'INPUT') { e.preventDefault(); e.stopPropagation(); P.seek(P.time() + (e.key === 'ArrowRight' ? 10 : -10)); }
      else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); floatFullscreen(); }
    }, true);
  })();

  /* ------------------------------------------------------------------ actions */
  function sameQueue(list) { return list.length === P.queue.length && list.every((x, i) => P.queue[i].id === x.id); }
  function trackById(id) { return allTracks.find((t) => t.id === id); }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#/"]');
    if (link && link.getAttribute('href') === location.hash && !link.dataset.action) { e.preventDefault(); route(); return; }
    const el = e.target.closest('[data-action]');
    if (!el) {
      // close overlays when clicking backdrop
      if (e.target.classList && e.target.classList.contains('layer-backdrop')) closeOverlays();
      return;
    }
    const a = el.dataset.action;
    switch (a) {
      case 'play-track': { const list = lists[el.dataset.list]; if (list) P.toggleTrack(list, +el.dataset.i); break; }
      case 'play-list': {
        const list = lists[el.dataset.list]; if (!list) break;
        if (sameQueue(list)) P.toggle(); else P.setQueue(list, 0, true);
        break;
      }
      case 'play-id': {
        const t = trackById(el.dataset.id); if (!t) break;
        const r = releaseBy[t.releaseSlug];
        P.toggleTrack(r.trackObjs, t.idx);
        if (!el.dataset.nav) { e.preventDefault(); }
        break;
      }
      case 'toggle': P.toggle(); break;
      case 'next': P.next(); break;
      case 'prev': P.prev(); break;
      case 'jump': P.jump(+el.dataset.i); break;
      case 'queue': {
        const q = $('#queue'); const open = q.hidden;
        q.hidden = !open; el.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'filter': {
        const box = el.closest('.chips');
        $$('.chip', box).forEach((c) => c.setAttribute('aria-pressed', String(c === el)));
        const f = el.dataset.filter;
        if (box.dataset.scope === 'home') $('#home-catalog').innerHTML = catalogItems(f, 6);
        else { $('#page-catalog').innerHTML = catalogItems(f); const n = filterReleases(f).length; $('#rel-count').textContent = n + ' release' + (n === 1 ? '' : 's'); }
        break;
      }
      case 'follow': {
        const follows = store.get('follows', {}); const s = el.dataset.slug;
        follows[s] = !follows[s]; if (!follows[s]) delete follows[s];
        store.set('follows', follows);
        el.setAttribute('aria-pressed', String(!!follows[s]));
        el.textContent = follows[s] ? 'Following ✓' : 'Follow';
        if (follows[s]) toast('Following ' + artistBy[s].name + '. We\'ll keep you posted.');
        break;
      }
      case 'format': {
        $$('.format', el.parentNode).forEach((b) => b.setAttribute('aria-checked', String(b === el)));
        break;
      }
      case 'add-release': {
        const r = releaseBy[el.dataset.slug];
        const sel = $$('.format').findIndex((b) => b.getAttribute('aria-checked') === 'true');
        addRelease(r, sel < 0 ? 0 : sel);
        break;
      }
      case 'quick-add': {
        const m = merchBy[el.dataset.id];
        if (m.sizes && m.sizes.length) openProduct(m); else addMerch(m);
        break;
      }
      case 'product': { e.preventDefault(); openProduct(merchBy[el.dataset.id]); break; }
      case 'size': {
        $$('[data-action="size"]', el.parentNode).forEach((b) => { b.setAttribute('aria-checked', String(b === el)); b.setAttribute('aria-pressed', String(b === el)); });
        break;
      }
      case 'add-merch': {
        const m = merchBy[el.dataset.id];
        const s = $('[data-action="size"][aria-checked="true"]');
        closeOverlays(true);
        addMerch(m, s ? s.dataset.size : '');
        break;
      }
      case 'qty': {
        const it = Cart.items().find((i) => i.key === el.dataset.key);
        if (it) Cart.setQty(it.key, it.qty + (+el.dataset.d));
        if (currentPath === '/checkout') $('#view').innerHTML = views.checkout();
        break;
      }
      case 'remove': Cart.setQty(el.dataset.key, 0); if (currentPath === '/checkout') $('#view').innerHTML = views.checkout(); break;
      case 'open-cart': openCart(); break;
      case 'open-search': openLayer('search'); renderSearch($('#search-input').value); break;
      case 'open-menu': openLayer('mobile-menu'); el.setAttribute('aria-expanded', 'true'); break;
      case 'close': closeOverlays(); break;
      case 'video': openVideo(+el.dataset.i); break;
      case 'sign': closeOverlays(true); location.hash = '#/get-signed'; break;
      case 'listen':
        closeOverlays(true);
        if (!featured) { location.hash = '#/get-signed'; break; }
        if (P.current && P.current.releaseSlug === featured.slug) { if (!P.playing) P.play(); }
        else P.setQueue(featured.trackObjs, 0, true);
        break;
      case 'share': shareLink(el); break;
      case 'float': openFloat(); break;
      case 'float-fs': floatFullscreen(); break;
      case 'soon': toast((el.dataset.what || 'This') + ' is coming soon.'); break;
      case 'scroll': {
        e.preventDefault();
        const t = document.getElementById(el.dataset.target);
        if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); const f = t.querySelector('input, textarea'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 500); }
        break;
      }
      case 'replay-intro': if (window.CRIntro) { window.scrollTo(0, 0); window.CRIntro.show(); } break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('intro-open')) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') { if (!$('#queue').hidden) { $('#queue').hidden = true; return; } closeOverlays(); }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); openLayer('search'); renderSearch($('#search-input').value); }
    if (e.key === ' ' && (e.target === document.body || e.target.id === 'view')) { e.preventDefault(); P.toggle(); }
  });

  // focus trap for open layers
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const layer = $$('.layer').find((l) => !l.hidden);
    if (!layer) return;
    const f = $$('a[href], button:not([disabled]), input, select, textarea', layer).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // close the queue when clicking elsewhere
  document.addEventListener('pointerdown', (e) => {
    const q = $('#queue');
    if (!q.hidden && !e.target.closest('#queue') && !e.target.closest('[data-action="queue"]')) { q.hidden = true; $('[data-action="queue"]').setAttribute('aria-expanded', 'false'); }
  });

  /* ------------------------------------------------------------------ boot */
  window.CR = { toast };
  $('#search-input').addEventListener('input', (e) => renderSearch(e.target.value));
  $('#search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = $('#search-results a'); if (first) first.click(); }
  });
  $('#search-results').addEventListener('click', (e) => { if (e.target.closest('a')) closeOverlays(true); });
  window.addEventListener('hashchange', route);
  initPlayerUI();
  if (!hasMusic) {
    // Nothing to play yet: hide the player and point the "Listen" buttons at the submission form.
    document.body.classList.add('no-music');
    const dock = $('.player-dock'); if (dock) dock.hidden = true;
    $$('[data-action="listen"]').forEach((b) => { b.dataset.action = 'sign'; b.textContent = b.classList.contains('btn') ? 'Submit your music' : 'Submit music'; });
  }
  renderCartUI();
  route();
})();
