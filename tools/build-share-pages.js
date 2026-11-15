#!/usr/bin/env node
/* ==========================================================================
   Build share pages
   Link previews (iMessage, Instagram DMs, X, Discord...) only read the plain
   page before the "#", so every link into this single-page site would show the
   same card. This writes a tiny page per artist, release and a few key pages
   with the right title, description and image, plus an instant redirect into
   the real site for people who click.

   Usage:   node tools/build-share-pages.js            (reads assets/js/data.js)
            node tools/build-share-pages.js --demo      (also loads sample-content.js)
            node tools/build-share-pages.js --out dir   (default: share)

   Run it again whenever artists or releases change, commit the share/ folder,
   then set  site.sharePages: true  in assets/js/data.js so the Share buttons
   use these pages. No dependencies; needs Node 16+.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const demo = args.includes('--demo');
const outName = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'share';
const outDir = path.resolve(root, outName);
if (!outDir.startsWith(root + path.sep) || outDir === root) {
  console.error('--out must be a folder inside the project'); process.exit(1);
}

// load the site's content the same way the browser does
const sandbox = { window: {} };
vm.createContext(sandbox);
const files = ['assets/js/data.js'].concat(demo ? ['assets/js/sample-content.js'] : []);
files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }));
const D = sandbox.window.CR_DATA;
const site = (D.site && D.site.url || '').replace(/\/?$/, '/');
if (!/^https?:\/\//.test(site)) { console.error('Set site.url in assets/js/data.js first (for example https://crashedrecords.com/).'); process.exit(1); }

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (p) => (/^https?:\/\//.test(p) ? p : site + String(p).replace(/^\.?\//, ''));
const DEFAULT_IMAGE = abs('assets/img/og-image.png');
const label = D.label.name;
const artistBy = Object.fromEntries((D.artists || []).map((a) => [a.slug, a]));

const pages = [];
(D.artists || []).forEach((a) => pages.push({
  dir: 'artists/' + a.slug, hash: '#/artists/' + a.slug,
  title: a.name + ' · ' + label,
  desc: (a.bio && a.bio[0]) || (a.name + ' on ' + label + '.'),
  image: a.photo ? abs(a.photo) : DEFAULT_IMAGE
}));
(D.releases || []).forEach((r) => {
  const by = artistBy[r.artist] ? artistBy[r.artist].name : '';
  pages.push({
    dir: 'releases/' + r.slug, hash: '#/releases/' + r.slug,
    title: r.title + (by ? ' by ' + by : '') + ' · ' + label,
    desc: r.description || (r.kind + (by ? ' by ' + by : '') + ' on ' + label + '.'),
    image: r.cover ? abs(r.cover) : DEFAULT_IMAGE
  });
});
pages.push({ dir: 'about', hash: '#/about', title: 'About · ' + label, desc: D.about.intro, image: DEFAULT_IMAGE });
pages.push({ dir: 'get-signed', hash: '#/contact/demos', title: 'Get signed · ' + label, desc: 'Send your music to ' + label + '. We are signing underground and rising artists in psychedelic hip hop and trap.', image: DEFAULT_IMAGE });

function html(p) {
  const url = site + outName.replace(/\\/g, '/') + '/' + p.dir + '/';
  const up = '../'.repeat(p.dir.split('/').length + outName.split(/[\\/]/).length);   // from share/<dir>/ back up to the site root
  const target = up + p.hash;
  const desc = p.desc.length > 200 ? p.desc.slice(0, 197).replace(/\s+\S*$/, '') + '…' : p.desc;
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(p.title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n<link rel="canonical" href="' + esc(url) + '">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:site_name" content="' + esc(label) + '">\n' +
    '<meta property="og:title" content="' + esc(p.title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + esc(url) + '">\n<meta property="og:image" content="' + esc(p.image) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(p.title) + '">\n' +
    '<meta name="twitter:description" content="' + esc(desc) + '">\n<meta name="twitter:image" content="' + esc(p.image) + '">\n' +
    '<meta name="theme-color" content="#07060B">\n<meta http-equiv="refresh" content="0;url=' + esc(target) + '">\n' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07060B;color:#E8E1D3;font:16px system-ui,sans-serif}a{color:#C9A8FF}</style>\n' +
    '</head>\n<body>\n<p>Taking you to <a href="' + esc(target) + '">' + esc(p.title) + '</a>…</p>\n' +
    '<script>location.replace(' + JSON.stringify(target) + ');</script>\n</body>\n</html>\n';
}

fs.rmSync(outDir, { recursive: true, force: true });
pages.forEach((p) => {
  const dir = path.join(outDir, p.dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html(p));
});
console.log('Wrote ' + pages.length + ' share pages to ' + path.relative(root, outDir) + '/ for ' + site);
