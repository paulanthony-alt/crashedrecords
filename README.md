# Crashed Records — website

Psychedelic hip hop & rap label site, built from the *Crashed Records — Website UI* design (Home, Artist, Release, Mobile, Style guide).

Static site: plain HTML/CSS/JS, **no build step**. Works on any static host (GitHub Pages, Netlify, Vercel, S3…).

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Where things live

| Path | What |
|---|---|
| `index.html` | Page shell: header, music player, search, cart drawer, modals, mobile menu |
| `assets/js/data.js` | **All content** — artists, releases, tracks, shows, merch, videos, links, emails |
| `assets/js/app.js` | Router + page views, cart, checkout, search, forms |
| `assets/js/player.js` | Persistent player (queue, seek, volume, Media Session) |
| `assets/js/intro.js` + `assets/css/intro.css` | Enter animation shown on the first home-page visit each session |
| `assets/css/styles.css` | Design tokens + all styles (from the style guide) |
| `assets/fonts/` | Self-hosted Archivo + JetBrains Mono (OFL, see `LICENSES.txt`) |
| `assets/img/logo.png` | Logo |
| `assets/img/eric-seides.jpg` | Founder photo (About page) |

## Pages (hash routes)

`#/` home · `#/artists` · `#/artists/<slug>` · `#/releases` · `#/releases/<slug>` · `#/shows` · `#/shop` · `#/checkout` · `#/about` (also `#/about/founder`, `#/about/contact`) · `#/contact/<demos|booking|press|general|founder>`

Hash routing keeps the player playing while you move between pages.

## What works

- **Player**: play any track/album/top-tracks, prev/next, seek, volume, queue panel, spinning disc, lock-screen controls. `Space` plays/pauses, `/` opens search.
- **Catalog filters** (All / Albums / EPs / Singles), on the home page and the releases page.
- **Cart**: add merch (with sizes) or a release format, change quantities, see totals and shipping, and go through checkout with validation. The cart is saved in the browser.
- **Follow artist** and **newsletter** sign-up, both saved in the browser.
- **Search** across artists, releases, tracks, shows and merch.
- **Contact forms** for demos, booking and press. They validate, then open the visitor's email app with the message filled in.
- **Video modal**: plays a YouTube embed when `youtubeId` is set.
- Responsive down to 320px. Respects `prefers-reduced-motion`. Keyboard and screen-reader friendly.

## Intro & About

- **Intro**: plays once per browser session, and only when someone lands on the home page (deep links skip it). *Skip intro* or `Esc` closes it. *Sound on* starts the music player, which keeps playing after you enter. The footer's *Replay intro* link shows it again.
- **About** (`#/about`): label story, values and Eric Seides' founder section with a contact form. All of the copy is in `data.js` under `about` and `founder`.

## Before launch — swap in real content

Everything is in `assets/js/data.js`. **The current artists, releases, dates and prices are sample content.**

- **Artwork**: set `cover` (releases), `photo` (artists) or `image` (merch). If you leave it empty, the generated liquid-marble art is used, tinted by `hue`.
- **Audio**: set `src` on a track (an mp3 path or URL). Tracks without a `src` play a generated synth demo loop, so every play button works in the meantime.
- **Links**: fill in streaming, social, ticket and YouTube fields. Empty ones show a "coming soon" toast.
- **Emails**: `label.emails`, plus `founder.email`, which is currently a **placeholder** (`eric@crashedrecords.com`).
- **About copy**: the story, values and Eric's bio are draft text; have Eric review them.

## Needs a backend / service (next steps)

- **Payments**: checkout currently records a *test order* in the browser. Connect Stripe Checkout, Shopify Buy Button or Snipcart in the `checkout` submit handler in `app.js`.
- **Newsletter**: emails are only stored in the visitor's browser. Post them to Mailchimp, ConvertKit or another service in the `newsletter` submit handler.
- **Contact**: uses `mailto:`. Swap in Formspree, Netlify Forms or similar if you want submissions without an email app.
