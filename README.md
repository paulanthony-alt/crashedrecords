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
| `assets/js/viz.js` | Reactive visuals: reads the music and drives the liquid-marble canvas and the small pulsing accents |
| `assets/js/ambient.js` | The intro's generated drone + bells |
| `tools/build-share-pages.js` | Writes the link-preview pages in `share/` (see below) |
| `share/` | Generated link-preview pages (committed) |
| `assets/css/styles.css` | Design tokens + all styles (from the style guide) |
| `assets/fonts/` | Self-hosted Archivo + JetBrains Mono (OFL, see `LICENSES.txt`) |
| `assets/img/logo.png` | Logo |
| `assets/img/eric-seides.jpg` | Founder photo (About page) |

## Pages (hash routes)

`#/` home · `#/artists` · `#/artists/<slug>` · `#/releases` · `#/releases/<slug>` · `#/shows` · `#/shop` · `#/checkout` · `#/about` (also `#/about/founder`, `#/about/contact`) · `#/get-signed` (old `#/contact/demos` links open it too) · `#/contact/<booking|press|general|founder>`

Hash routing keeps the player playing while you move between pages.

## What works

- **Reactive visuals**: the backdrops and accents move with the music (see below).
- **Intro sound bed**: "Sound on" in the intro plays a generated drone with soft bells, then hands over to the first track (or fades out if there is no music yet).
- **Get signed** (`#/get-signed`): a five-step submission for artists (about them, track links, their sound, what they want, then a review screen with a rights checkbox). Each step is checked before moving on; under-18s must confirm a parent or guardian is OK with it. Answers are saved in the visitor's browser as they type, so they can leave and come back. It sends through `forms.endpoint` (subject `[Get signed] <artist>`) or opens the email app, with the same spam protection as the other forms. The sound tags and options are at the top of the get-signed section in `app.js`; the "Who we're looking for" list is `signing.lookingFor` in `data.js`.
- **How signing works**: four steps and a short FAQ on the About and Get signed pages (`signing` in `data.js`; a draft for Eric to review).
- **Float mode**: the expand button in the player opens a full-screen listening room. The reactive visuals fill the screen, the track title pulses with the beat, and the controls fade out while music plays. `Space` play/pause, `←` `→` seek 10 seconds, `F` full screen, `Esc` exit. Only shown once there is music.
- **Player**: play any track/album/top-tracks, prev/next, seek, volume, queue panel, spinning disc, lock-screen controls. `Space` plays/pauses, `/` opens search.
- **Catalog filters** (All / Albums / EPs / Singles), on the home page and the releases page.
- **Cart**: add merch (with sizes) or a release format, change quantities, see totals and shipping, and go through checkout with validation. The cart is saved in the browser.
- **Follow artist** and **newsletter** sign-up, both saved in the browser.
- **Search** across artists, releases, tracks, shows and merch.
- **Contact forms** for booking, press, general and Eric. They validate, then open the visitor's email app with the message filled in.
- **Video modal**: plays a YouTube embed when `youtubeId` is set.
- Responsive down to 320px. Respects `prefers-reduced-motion`. Keyboard and screen-reader friendly.

## Intro & About

- **Intro**: plays once per browser session, and only when someone lands on the home page (deep links skip it). *Skip intro* or `Esc` closes it. *Sound on* starts the music player, which keeps playing after you enter. The footer's *Replay intro* link shows it again.
- **About** (`#/about`): a full-screen manifesto headline (`about.manifesto.lines`, one entry per line), the numbered manifesto (`about.pillars`), the story, "Who we're looking for", an "Are you next?" band linking to Get signed, how signing works, and Eric's founder section with a contact form. All of the copy is in `data.js` under `about`, `signing` and `founder`.

## Reactive visuals

The big backdrops (home, page headers, artist and release pages, the intro) are drawn by one WebGL canvas that moves with whatever is playing: bass swells the liquid warp, mids speed up the flow, highs add veins of light. The logo, the player bar, the cover of the playing record and the little EQ bars pulse too.

- **Silent**, it looks the same as the CSS marble it replaces, which stays in the page as the fallback.
- **Demo beats** are analysed live. **Real audio files** are fetched once and turned into a small loudness map, so playback is never rerouted and music keeps playing with a phone locked. A file on another domain needs CORS headers to be analysed; without them the visuals fall back to a gentle generic sway.
- **Slow devices**: the canvas lowers its own resolution until frames are smooth, and browsers with software-only WebGL get the CSS version.
- **Off switch**: "Reactive visuals" at the bottom of the Queue panel (remembered per browser). It is off automatically for visitors whose device asks for reduced motion.
- To give another backdrop the effect, add `data-viz` to its marble wrapper; to make an element pulse, add `data-react` and use the `--k` (kick), `--b` (bass) and `--l` (level) CSS variables.

## Forms, spam protection and drop alerts

By default the contact, demo and "Talk to Eric" forms open the visitor's email app, and the newsletter only remembers sign-ups in the visitor's own browser. To receive real submissions, fill in two settings in `assets/js/data.js` (no code changes):

- **`forms.endpoint`**: paste the URL of a free form service (Formspree, Formsubmit, Basin, Web3Forms, etc.). Any service that accepts a JSON POST works; `forms.extra` adds fields such as `{ access_key: '...' }`. If the service is unreachable, the form falls back to the email app instead of losing the message.
- **`newsletter.endpoint`**: your email service's subscribe URL (`format: 'json'` for services with an API, `'form'` for classic embed forms such as Mailchimp). The site only says "you're in" when the service accepted the address.

Built in against spam: a hidden decoy field (bots fill it, people never see it; bot submissions look successful but send nothing), a minimum fill time (`forms.minFillSeconds`) and a per-visitor cooldown (`forms.cooldownSeconds`). These stop simple bots. They are not a substitute for the spam filtering that Formspree and similar services also provide; turn that on in the service. Cloudflare Turnstile / reCAPTCHA need a server to verify the answer, so they are not included.

Texting alerts (Laylo etc.) need consent wording that should be checked by a lawyer first, so they are not built in.

## Link previews and sharing

Messages, Instagram, X and Discord only read the page before the `#`, so every link into this site would show the same card. `node tools/build-share-pages.js` writes a small page per artist and release (plus About and Get signed) into `share/` with the right title and description, and an instant redirect to the real page. After adding artists or releases: run it, commit `share/`, and set `site.sharePages: true` in `data.js` so the Share buttons on artist and release pages use those links. (`--demo` includes the sample content; `--out dir` writes elsewhere.) Add a `cover` / `photo` image to an artist or release and its preview card uses it; otherwise the label card (`assets/img/og-image.png`) is used. When the site gets its own domain, update `site.url` in `data.js` and the `og:url`, `og:image`, `twitter:image` and `canonical` lines at the top of `index.html`.

The home page's "Follow the float" section shows up when you paste post links into `social.posts` in `data.js` (see the comment there). It uses plain links rather than live embeds, so there are no third-party scripts.

## Founding roster (no artists yet)

`data.js` starts with **no artists, releases, shows or videos**, so the site doesn't show invented acts. Until real ones are added, the site shows a "Now signing / Founding roster" state:

- **Home:** a "Get signed" button in the hero and menu, an "Are you next?" call-out above the newsletter, and the "Now signing" block, four open artist slots, a "Reserved for the first release" panel, and a "Submit your music" button in the header.
- **Artists and Releases pages:** the same open-slot and first-release treatment.
- **Player, Sound toggle in the intro, "Listen" buttons:** hidden or pointed at the submission form, because there is nothing to play yet.
- **Wording:** edit `founding` in `data.js`.
- **Preview the full site with sample artists and releases:** add `?demo` to the address (`http://localhost:8000/?demo`). The sample content lives in `assets/js/sample-content.js`, which is never loaded otherwise.
- **To go from empty to populated:** add artists and releases to `data.js`. Each state switches on by itself.

## Before launch — swap in real content

Everything is in `assets/js/data.js`. **Artists, releases, dates and videos start empty; the shop's merch items and prices are still sample content.**

- **Artwork**: set `cover` (releases), `photo` (artists) or `image` (merch). If you leave it empty, the generated liquid-marble art is used, tinted by `hue`.
- **Audio**: set `src` on a track (an mp3 path or URL). Tracks without a `src` play a generated synth demo loop, so every play button works in the meantime.
- **Links**: fill in streaming, social, ticket and YouTube fields. Empty ones show a "coming soon" toast.
- **Emails**: `label.emails`, plus `founder.email` (Eric's business address).
- **About copy**: the manifesto headline, statements, story, "Who we're looking for" list and Eric's bio are draft text; have Eric review them.

## Needs a backend / service (next steps)

- **Payments**: checkout currently records a *test order* in the browser. Connect Stripe Checkout, Shopify Buy Button or Snipcart in the `checkout` submit handler in `app.js`.
- **Newsletter**: emails are only stored in the visitor's browser. Post them to Mailchimp, ConvertKit or another service in the `newsletter` submit handler.
- **Contact / Get signed**: use `mailto:` until `forms.endpoint` is set (see above).
