/* ==========================================================================
   Crashed Records — reactive visuals
   Makes the site move with whatever is playing.

   1. SIGNAL   Reads the music as four numbers, every frame:
               bass, mid, high (0..1) and "kick" (a pulse on each bass hit).
               - Built-in demo beats: analysed live (Web Audio AnalyserNode).
               - Real audio files:    the file is fetched once and decoded at a
                 low sample rate into a small loudness map, then looked up by
                 playback time. Playback itself is never rerouted, so music
                 keeps playing with the phone locked.
   2. MARBLE   One WebGL canvas draws the liquid marble behind the big
               backdrops (any element with [data-viz]). Silent, it matches the
               CSS marble it replaces. Playing, bass swells the warp, mids
               speed the flow, highs add shimmer.
   3. ACCENTS  Cheap extras driven by CSS variables on [data-react] elements
               (logo pulse, player glow, cover thump, real EQ bars).

   Falls back to the plain CSS marble when WebGL is missing or software-only,
   and switches itself off for visitors who ask for reduced motion.
   Public API: window.CRViz = { refresh(), setEnabled(bool), enabled, debug() }
   ========================================================================== */
(function () {
  'use strict';

  var P = window.CRPlayer;
  if (!P) return;

  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var root = document.documentElement;

  function readPref() { try { return localStorage.getItem('cr:viz') !== 'off'; } catch (e) { return true; } }
  function writePref(on) { try { localStorage.setItem('cr:viz', on ? 'on' : 'off'); } catch (e) { /* private mode */ } }

  var wanted = readPref();                       // the visitor's choice
  function isOn() { return wanted && !reduceMotion.matches; }

  /* ====================================================================== 1. SIGNAL */
  var sig = { bass: 0, mid: 0, high: 0, level: 0, kick: 0 };
  var bassAvg = 0;
  var active = false;                            // true while there is anything to animate

  /* ---- live analysis (demo beats) ---- */
  var freq = null;

  function sampleLive(an) {
    if (!freq || freq.length !== an.frequencyBinCount) freq = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(freq);
    var hz = an.context.sampleRate / an.fftSize;
    function band(lo, hi) {
      var a = Math.max(1, Math.floor(lo / hz)), b = Math.min(freq.length - 1, Math.ceil(hi / hz)), s = 0;
      for (var i = a; i <= b; i++) s += freq[i];
      return s / ((b - a + 1) * 255);
    }
    return [band(35, 170), band(200, 2000), band(2500, 10000)];
  }

  /* ---- pre-computed loudness map (audio files) ---- */
  var ENV_RATE = 50;                             // values per second
  var envCache = {};                             // src -> { b, m, h } | 'pending' | 'failed'

  function buildEnvelope(src) {
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || !window.fetch) return Promise.reject(new Error('unsupported'));
    var conn = navigator.connection;
    if (conn && conn.saveData) return Promise.reject(new Error('save-data'));
    return fetch(src).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      if (+res.headers.get('content-length') > 60e6) throw new Error('too large');
      return res.arrayBuffer();
    }).then(function (buf) {
      var ctx = null;
      [8000, 11025, 22050, 44100].some(function (sr) { try { ctx = new OAC(1, 2, sr); return true; } catch (e) { return false; } });
      if (!ctx) throw new Error('no offline context');
      return new Promise(function (ok, no) { var p = ctx.decodeAudioData(buf, ok, no); if (p && p.catch) p.catch(no); });
    }).then(function (audio) {
      var sr = audio.sampleRate, hop = Math.max(1, Math.round(sr / ENV_RATE)), frames = Math.floor(audio.length / hop);
      var c0 = audio.getChannelData(0), c1 = audio.numberOfChannels > 1 ? audio.getChannelData(1) : null;
      var aL = 1 - Math.exp(-2 * Math.PI * 150 / sr), aM = 1 - Math.exp(-2 * Math.PI * 1500 / sr);
      var lp = 0, lp2 = 0, out = [new Float32Array(frames), new Float32Array(frames), new Float32Array(frames)];
      for (var f = 0, i = 0; f < frames; f++) {
        var sb = 0, sm = 0, sh = 0;
        for (var k = 0; k < hop; k++, i++) {
          var x = c1 ? (c0[i] + c1[i]) * 0.5 : c0[i];
          lp += aL * (x - lp); lp2 += aM * (x - lp2);
          var lo = lp, mi = lp2 - lp, hi = x - lp2;
          sb += lo * lo; sm += mi * mi; sh += hi * hi;
        }
        out[0][f] = Math.sqrt(sb / hop); out[1][f] = Math.sqrt(sm / hop); out[2][f] = Math.sqrt(sh / hop);
      }
      // scale each band to its own 95th percentile so every master uses the full range
      return out.map(function (arr) {
        var sorted = Array.prototype.slice.call(arr).sort(function (a, b) { return a - b; });
        var ref = sorted[Math.floor(sorted.length * 0.95)] || 1e-6, u8 = new Uint8Array(arr.length);
        for (var j = 0; j < arr.length; j++) u8[j] = Math.min(255, Math.round(255 * arr[j] / ref));
        return u8;
      });
    });
  }

  function ensureEnvelope(src) {
    if (!src || envCache[src]) return;
    envCache[src] = 'pending';
    buildEnvelope(src).then(function (bands) { envCache[src] = { b: bands[0], m: bands[1], h: bands[2] }; },
      function () { envCache[src] = 'failed'; });
  }

  // <audio>.currentTime only updates a few times a second in some browsers; glide between updates.
  var clock = { ct: -1, at: 0 };
  function smoothTime(now) {
    var ct = P.time();
    if (ct !== clock.ct) { clock.ct = ct; clock.at = now; }
    return ct + Math.min(0.35, (now - clock.at) / 1000);
  }

  function sampleEnvelope(src, now) {
    var e = envCache[src];
    if (!e || e === 'pending' || e === 'failed') return null;
    var x = smoothTime(now) * ENV_RATE, i = Math.floor(x), fr = x - i, n = e.b.length;
    if (i < 0 || i >= n) return [0, 0, 0];
    var j = Math.min(n - 1, i + 1);
    function at(a) { return (a[i] + (a[j] - a[i]) * fr) / 255; }
    return [at(e.b), at(e.m), at(e.h)];
  }

  // No analysis available (still loading, blocked cross-origin file): a calm, generic sway.
  function sampleFallback(now) {
    var t = now / 1000, s = Math.sin(t * 2.1);
    return [0.3 + 0.22 * s * s, 0.28 + 0.08 * Math.sin(t * 0.7), 0.12];
  }

  // Each band is read against its own recent average: a sustained sound sits around the middle and
  // only changes (a kick, a hi-hat, a swell) push towards 1. Works the same for quiet and loud masters.
  var recent = [0, 0, 0], recentFor = null;
  function relative(raw, dt, key) {
    var fresh = recentFor !== key;
    recentFor = key;
    var k = 1 - Math.exp(-dt / 3), out = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      recent[i] = fresh ? raw[i] : recent[i] + (raw[i] - recent[i]) * k;
      out[i] = Math.min(1, raw[i] / (2 * Math.max(recent[i], 0.03)));
    }
    return out;
  }

  function glide(key, target, dt, up, down) {
    var cur = sig[key];
    sig[key] = cur + (target - cur) * (1 - Math.exp(-dt / (target > cur ? up : down)));
  }

  function updateSignal(dt, now) {
    var raw = null;
    if (P.playing && isOn()) {
      var an = P.analyser(), cur = P.current;
      var measured = an ? sampleLive(an) : (cur && cur.src ? sampleEnvelope(cur.src, now) : null);
      raw = measured ? relative(measured, dt, cur ? cur.id : '') : sampleFallback(now);
    }
    var b = raw ? raw[0] : 0, m = raw ? raw[1] : 0, h = raw ? raw[2] : 0;
    glide('bass', b, dt, 0.03, 0.22);
    glide('mid', m, dt, 0.06, 0.3);
    glide('high', h, dt, 0.03, 0.18);
    glide('level', b * 0.5 + m * 0.3 + h * 0.2, dt, 0.2, 0.6);
    bassAvg += (b - bassAvg) * (1 - Math.exp(-dt / 0.5));
    var onset = Math.max(0, b - bassAvg * 1.1 - 0.05);
    sig.kick = Math.max(sig.kick * Math.exp(-dt / 0.17), Math.min(1, onset * 2.4));   // decays smoothly: no strobing
    active = !!raw || sig.level > 0.004 || sig.kick > 0.004 || sig.bass > 0.004;
  }

  /* ====================================================================== 2. MARBLE */
  var VERT = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }';

  // The same five soft colour blobs as the CSS .cr-marble, sampled through a slowly moving noise warp
  // (the CSS version uses an SVG feTurbulence 0.006 x 0.011 + feDisplacementMap scale 220).
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uSize; uniform float uT; uniform float uRot; uniform vec4 uA; uniform float uKick; uniform float uZoom;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }',
    'float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }',
    'vec3 blob(vec3 col, vec2 u, vec2 c, vec3 k, float r, vec2 box){',
    '  float far = length(max(c, 1. - c) * box);',
    '  return mix(col, k, clamp(1. - length((u - c) * box) / (r * far), 0., 1.)); }',
    'void main(){',
    '  float bass = uA.x, mid = uA.y, high = uA.z, lvl = uA.w;',
    '  vec2 px = vec2(vUv.x, 1. - vUv.y) * uSize;',
    '  vec2 nq = px * vec2(.006, .011);',
    '  vec2 w = vec2(fbm(nq + vec2(uT * .11, uT * .07)), fbm(nq + vec2(5.2 - uT * .09, 1.3 + uT * .05)));',
    '  float amp = 220. * (1. + .6 * bass + .3 * uKick);',
    '  vec2 p = px + (w - .45) * amp;',
    '  vec2 box = uSize * uZoom;',
    '  vec2 v = (p - .5 * uSize) * (1. - .05 * bass - .035 * uKick);',
    '  float cs = cos(uRot), sn = sin(uRot);',
    '  vec2 u = vec2(cs * v.x + sn * v.y, -sn * v.x + cs * v.y) / box + .5;',
    '  vec3 col = vec3(.078, .043, .141);',                                   // #140B24
    '  col = blob(col, u, vec2(.50, .50), vec3(.180, .063, .396), .70, box);',  // #2E1065
    '  col = blob(col, u, vec2(.28, .82), vec3(.925, .282, .600), .30, box);',  // #EC4899
    '  col = blob(col, u, vec2(.62, .78), vec3(.486, .227, .929), .42, box);',  // #7C3AED
    '  col = blob(col, u, vec2(.78, .22), vec3(.310, .275, .898), .38, box);',  // #4F46E5
    '  col = blob(col, u, vec2(.22, .28), vec3(.753, .149, .827), .34, box);',  // #C026D3
    '  col *= 1. + .10 * lvl + .14 * uKick;',
    '  col = mix(col, col * vec3(1.14, .94, 1.08), mid * .5);',
    // highs: thin veins of lilac light that run along the liquid warp (smooth, so they stay clean at low resolution)
    '  float veins = pow(1. - abs(sin((w.x - w.y) * 9. + uT * .6)), 6.);',
    '  col += vec3(.79, .66, 1.) * veins * high * .2 * (.3 + dot(col, vec3(.6)));',
    '  col += (hash(gl_FragCoord.xy) - .5) / 170.;',                          // dither: hides banding when upscaled
    '  gl_FragColor = vec4(col, 1.);',
    '}'
  ].join('\n');

  var canvas = null, gl = null, U = null, glState = 'new';   // new | ok | none | lost
  var slot = null, zoom = 1.95, visible = true;
  var flow = 0, rot = 0;
  var quality = 1, ceiling = 1, emaDt = 1 / 60, cooldown = 0, probe = 0, misses = 0, restoreQ = 1, locked = false;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }

  function setupProgram() {
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one big triangle
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    U = {};
    ['uSize', 'uT', 'uRot', 'uA', 'uKick', 'uZoom'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  }

  function initGL() {
    if (glState !== 'new') return glState === 'ok';
    try {
      canvas = document.createElement('canvas');
      canvas.className = 'viz-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      var opts = { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
        // Software-only WebGL would be slower than the CSS fallback, so refuse it (tests can force it).
        failIfMajorPerformanceCaveat: !window.CR_VIZ_FORCE };
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      if (!gl) throw new Error('no webgl');
      setupProgram();
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); glState = 'lost'; mount(); });
      canvas.addEventListener('webglcontextrestored', function () {
        try { setupProgram(); glState = 'ok'; } catch (err) { glState = 'none'; }
        mount();
      });
      if (window.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(canvas);
      else window.addEventListener('resize', resize);
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (en) { visible = en[en.length - 1].isIntersecting; }).observe(canvas);
      }
      glState = 'ok';
    } catch (e) {
      glState = 'none'; canvas = null; gl = null;
    }
    return glState === 'ok';
  }

  function pixelBudget() {
    var small = Math.min(window.screen.width, window.screen.height) < 700;
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return (small || coarse) ? 150000 : 420000;
  }

  function resize() {
    if (!canvas || !canvas.isConnected) return false;
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return false;
    // The marble is soft, so it never needs more than 1 canvas pixel per CSS pixel, and usually far fewer.
    var scale = Math.min(1, Math.sqrt(pixelBudget() / (cw * ch))) * quality;
    var w = Math.max(16, Math.round(cw * scale)), h = Math.max(16, Math.round(ch * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;       // resizing wipes the canvas...
      draw(0);                                   // ...so repaint straight away to avoid a black flash
    }
    return true;
  }

  function draw(boost) {
    if (glState !== 'ok' || !canvas.isConnected) return;
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uSize, cw, ch);
    gl.uniform1f(U.uT, flow);
    gl.uniform1f(U.uRot, rot);
    gl.uniform4f(U.uA, Math.min(1, sig.bass + boost * 0.6), sig.mid, sig.high, Math.min(1, sig.level + boost * 0.5));
    gl.uniform1f(U.uKick, sig.kick);
    gl.uniform1f(U.uZoom, zoom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Put the canvas behind the current page's backdrop (the intro's while it is open). */
  function mount() {
    var want = null;
    if (isOn() && initGL() && glState === 'ok') {
      want = document.querySelector('.cr-intro:not(.is-leaving) [data-viz]') || document.querySelector('#view [data-viz]');
    }
    if (want === slot && (!slot || canvas.isConnected)) return;
    if (slot) slot.classList.remove('viz-hidden');
    slot = want;
    if (!slot) { if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }
    canvas.setAttribute('data-kind', slot.getAttribute('data-viz') || '');
    canvas.style.opacity = getComputedStyle(slot).opacity;
    var hue = parseFloat(slot.getAttribute('data-viz-hue')) || 0;
    canvas.style.filter = hue ? 'hue-rotate(' + hue + 'deg)' : '';
    zoom = parseFloat(slot.getAttribute('data-viz-zoom')) || 1.95;
    slot.parentNode.insertBefore(canvas, slot.nextSibling);
    visible = true; ceiling = 1;                 // a different backdrop may have headroom again
    if (resize()) { draw(0); slot.classList.add('viz-hidden'); }   // only hide the CSS marble once a frame is on screen
  }

  /* ---- keep it smooth: lower the canvas resolution on slow devices, raise it back when there is headroom ---- */
  var MIN_QUALITY = 0.3;

  function adapt(dt) {
    if (dt > 1) return;                          // first frame after the tab was in the background
    dt = Math.min(dt, 0.25);
    emaDt += (dt - emaDt) * (1 - Math.exp(-dt / 0.4));   // time-based average, so it settles equally fast at 5fps and 120fps
    cooldown -= dt;
    if (cooldown > 0) return;
    if (probe) {
      // Judge the last reduction. Two in a row that change nothing mean the slowness is not ours
      // (for example a phone in battery-saver mode capping every page at 30fps): undo them and stop trying.
      if (emaDt < probe * 0.9) misses = 0;
      else if (++misses >= 2) { locked = true; quality = restoreQ; resize(); }
      probe = 0; cooldown = 1;
      return;
    }
    if (emaDt > 1 / 42 && !locked && quality > MIN_QUALITY) {
      if (misses === 0) restoreQ = quality;
      probe = emaDt;
      quality = Math.max(MIN_QUALITY, quality * 0.8);
      ceiling = quality;                         // don't climb straight back to a level that was just too slow
      resize(); cooldown = 1.5;
    } else if (emaDt < 1 / 55 && quality < ceiling) {
      quality = Math.min(ceiling, quality * 1.12);
      resize(); cooldown = 3;
    }
  }

  /* ====================================================================== 3. ACCENTS */
  var targets = [], eqs = [], targetsAt = 0, wroteZero = true;

  function findTargets() {
    targets = Array.prototype.slice.call(document.querySelectorAll('[data-react]'));
    eqs = Array.prototype.slice.call(document.querySelectorAll('.eq.on, .track.playing .eq, .cri-sound[aria-pressed="true"] .cri-eq'));
  }

  function accents(now) {
    if (!active && wroteZero) return;
    if (now - targetsAt > 400) { findTargets(); targetsAt = now; }
    var k = sig.kick.toFixed(3), b = sig.bass.toFixed(3), l = sig.level.toFixed(3);
    for (var i = 0; i < targets.length; i++) {
      var st = targets[i].style;
      st.setProperty('--k', k); st.setProperty('--b', b); st.setProperty('--l', l);
    }
    var e1 = (0.25 + 0.75 * sig.bass).toFixed(3), e2 = (0.25 + 0.75 * sig.mid).toFixed(3), e3 = (0.25 + 0.75 * sig.high).toFixed(3);
    for (var j = 0; j < eqs.length; j++) {
      var es = eqs[j].style;
      es.setProperty('--e1', e1); es.setProperty('--e2', e2); es.setProperty('--e3', e3);
    }
    wroteZero = !active;
  }

  /* ====================================================================== loop */
  var last = 0, tick = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.1, (now - last) / 1000 || 0.016);
    var rawDt = (now - last) / 1000;
    last = now;
    updateSignal(dt, now);
    root.classList.toggle('viz-live', P.playing && isOn());
    accents(now);
    if (!slot || !visible || glState !== 'ok') return;
    adapt(rawDt);
    tick++;
    if (!active && (tick & 1)) return;           // nothing playing: the slow drift only needs 30fps
    var warp = slot.closest && slot.closest('.cr-intro.is-entering') ? 1 : 0;   // the intro's warp-out
    var step = active ? dt : dt * 2;
    flow += step * (0.25 + 1.5 * sig.mid + 1.1 * sig.level + warp * 5);
    rot += step * (Math.PI * 2 / 90) * (1 + 1.6 * sig.level + warp * 12);
    draw(warp);
  }

  /* ====================================================================== controls */
  function syncToggle() {
    var btn = document.getElementById('viz-toggle');
    if (!btn) return;
    btn.hidden = !!reduceMotion.matches;
    btn.setAttribute('aria-pressed', String(isOn()));
    var label = btn.querySelector('.viz-toggle-state');
    if (label) label.textContent = isOn() ? 'On' : 'Off';
  }

  function refresh() { mount(); findTargets(); targetsAt = last; }

  function setEnabled(on) {
    wanted = !!on; writePref(wanted);
    syncToggle(); refresh();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#viz-toggle');
    if (btn) setEnabled(!isOn());
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', function () { syncToggle(); refresh(); });

  P.on(function (type) {
    if (type === 'track' || type === 'state') {
      var cur = P.current;
      if (cur && cur.src && P.playing && isOn()) ensureEnvelope(cur.src);
      targetsAt = 0; wroteZero = false;
    }
  });

  window.CRViz = {
    refresh: refresh,
    setEnabled: setEnabled,
    get enabled() { return isOn(); },
    debug: function () {
      return { signal: { bass: sig.bass, mid: sig.mid, high: sig.high, level: sig.level, kick: sig.kick }, gl: glState,
        mounted: !!(slot && canvas && canvas.isConnected), kind: canvas ? canvas.getAttribute('data-kind') : null,
        size: canvas ? [canvas.width, canvas.height] : null, quality: quality, locked: locked, envelopes: Object.keys(envCache).map(function (k) { return [k, typeof envCache[k] === 'string' ? envCache[k] : 'ready']; }) };
    }
  };

  syncToggle();
  refresh();
  requestAnimationFrame(frame);
})();
