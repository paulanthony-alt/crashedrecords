/* ==========================================================================
   Player — one queue, two engines:
   - FileEngine: plays a track's `src` (mp3/ogg/etc) through <audio>
   - SynthEngine: a generated psychedelic beat loop, used when a track has no
     audio file yet, so every play button works before real masters exist.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- Synth engine ---------- */
  function SynthEngine() {
    this.ctx = null; this.bus = null; this.timer = null;
    this.t0 = 0; this.pausedAt = 0; this.running = false; this.volume = 0.8;
  }
  SynthEngine.prototype.ensure = function () {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio not supported');
    const ctx = this.ctx = new AC();
    // voices -> out (fixed mix level) -> compressor -> analyser -> volume -> speakers.
    // The analyser sits before the volume control so the visuals keep moving at low volume.
    this.out = ctx.createGain(); this.out.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024; this.analyser.smoothingTimeConstant = 0.55;
    this.analyser.minDecibels = -90; this.analyser.maxDecibels = -12;
    this.vol = ctx.createGain(); this.vol.gain.value = this.volume;
    this.out.connect(comp); comp.connect(this.analyser); this.analyser.connect(this.vol); this.vol.connect(ctx.destination);
    // shared echo for the sparkles
    this.delay = ctx.createDelay(2); this.fb = ctx.createGain(); this.fb.gain.value = 0.38;
    this.delayOut = ctx.createGain(); this.delayOut.gain.value = 0.5;
    this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.delayOut); this.delayOut.connect(this.out);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  };
  SynthEngine.prototype.load = function (track) {
    this.stopVoices();
    this.track = track; this.pausedAt = 0;
    const r = rng(hash(track.id));
    this.bpm = 66 + Math.floor(r() * 22);
    this.step = 60 / this.bpm / 4;
    this.root = 43 + Math.floor(r() * 9);
    const progs = [
      [[0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [10, 14, 17, 21]],
      [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [7, 10, 14, 17]],
      [[0, 3, 7, 14], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -1, 2, 7]],
      [[0, 3, 7, 10], [0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15]]
    ];
    this.prog = progs[Math.floor(r() * progs.length)];
    this.kick = [[0, 10], [0, 7, 10], [0, 3, 10, 14], [0, 9, 11]][Math.floor(r() * 4)];
    this.swing = 0.12 + r() * 0.12;
    this.cutoff = 700 + r() * 900;
    this.sparkle = Array.from({ length: 16 }, () => r() < 0.22);
    this.scale = [0, 3, 5, 7, 10, 12, 15, 19];
    this.r = r;
  };
  SynthEngine.prototype.play = function (offset) {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopVoices();
    const ctx = this.ctx;
    const at = offset != null ? offset : this.pausedAt;
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.4);
    this.bus.connect(this.out);
    this.send = ctx.createGain(); this.send.gain.value = 1; this.send.connect(this.delay);
    this.delay.delayTime.value = this.step * 3;
    this.t0 = ctx.currentTime + 0.05 - at;
    this.nextStep = Math.ceil(at / this.step);
    this.running = true;
    const tick = () => this.schedule();
    tick();
    this.timer = setInterval(tick, 40);
  };
  SynthEngine.prototype.schedule = function () {
    const ctx = this.ctx, horizon = ctx.currentTime + 0.25;
    while (this.t0 + this.nextStep * this.step < horizon) {
      const s = this.nextStep, t = this.t0 + s * this.step + (s % 2 ? this.step * this.swing : 0);
      if (t >= ctx.currentTime - 0.01) this.voiceStep(s, Math.max(t, ctx.currentTime));
      this.nextStep++;
    }
  };
  SynthEngine.prototype.voiceStep = function (s, t) {
    const pos = s % 16, bar = Math.floor(s / 16), chord = this.prog[bar % this.prog.length];
    const intro = bar < 2; // drums come in on bar 3
    if (pos === 0) this.pad(t, chord, this.step * 16);
    if (!intro) {
      if (this.kick.indexOf(pos) > -1) this.kickAt(t);
      if (pos === 4 || pos === 12) this.snare(t);
      if (pos % 2 === 0) this.hat(t, pos % 4 === 2 ? 0.09 : 0.05);
      if (pos === 0 || pos === 10) this.bass(t, this.root - 12 + chord[0], this.step * (pos === 0 ? 7 : 5));
    }
    if (this.sparkle[pos] && bar % 2 === 1) {
      const n = this.root + 24 + this.scale[Math.floor(this.r() * this.scale.length)];
      this.bell(t, n);
    }
  };
  SynthEngine.prototype.env = function (g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  SynthEngine.prototype.kickAt = function (t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    this.env(g, t, 0.004, 0.9, 0.45);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.5);
  };
  SynthEngine.prototype.snare = function (t) {
    const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
    this.env(g, t, 0.003, 0.45, 0.22);
    n.connect(f); f.connect(g); g.connect(this.bus); n.start(t); n.stop(t + 0.25);
    const o = c.createOscillator(), og = c.createGain();
    o.type = 'triangle'; o.frequency.value = 185; this.env(og, t, 0.002, 0.25, 0.12);
    o.connect(og); og.connect(this.bus); o.start(t); o.stop(t + 0.15);
  };
  SynthEngine.prototype.hat = function (t, v) {
    const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7500;
    this.env(g, t, 0.002, v, 0.05);
    n.connect(f); f.connect(g); g.connect(this.bus); n.start(t, Math.random() * 0.5); n.stop(t + 0.06);
  };
  SynthEngine.prototype.bass = function (t, note, dur) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = mtof(note);
    this.env(g, t, 0.01, 0.42, dur);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
  };
  SynthEngine.prototype.pad = function (t, chord, dur) {
    const c = this.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(this.cutoff * 0.5, t);
    f.frequency.linearRampToValueAtTime(this.cutoff * 1.6, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(this.cutoff * 0.6, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.5);
    g.gain.setValueAtTime(0.06, t + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    f.connect(g); g.connect(this.bus);
    chord.forEach((iv) => {
      [-8, 8].forEach((det) => {
        const o = c.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = mtof(this.root + 12 + iv); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 0.5);
      });
    });
  };
  SynthEngine.prototype.bell = function (t, note) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = mtof(note);
    this.env(g, t, 0.005, 0.07, 0.6);
    o.connect(g); g.connect(this.bus); g.connect(this.send); o.start(t); o.stop(t + 0.7);
  };
  SynthEngine.prototype.stopVoices = function () {
    clearInterval(this.timer); this.timer = null;
    if (this.bus && this.ctx) {
      const b = this.bus, s = this.send, now = this.ctx.currentTime;
      b.gain.cancelScheduledValues(now);
      b.gain.setValueAtTime(b.gain.value, now);
      b.gain.linearRampToValueAtTime(0, now + 0.08);
      setTimeout(() => { try { b.disconnect(); s && s.disconnect(); } catch (e) { /* already gone */ } }, 150);
    }
    this.bus = null; this.send = null;
  };
  SynthEngine.prototype.pause = function () {
    if (this.running) this.pausedAt = this.currentTime();
    this.running = false; this.stopVoices();
  };
  SynthEngine.prototype.seek = function (sec) {
    this.pausedAt = sec;
    if (this.running) this.play(sec);
  };
  SynthEngine.prototype.currentTime = function () {
    if (!this.running || !this.ctx) return this.pausedAt;
    return Math.max(0, this.ctx.currentTime - this.t0);
  };
  SynthEngine.prototype.setVolume = function (v) {
    this.volume = v;
    if (this.vol) this.vol.gain.value = v;
  };

  /* ---------- File engine ---------- */
  function FileEngine(onEnded, onError) {
    this.audio = new Audio(); this.audio.preload = 'metadata';
    this.audio.addEventListener('ended', onEnded);
    this.audio.addEventListener('error', onError);
  }
  FileEngine.prototype.load = function (track) { if (this.audio.src !== new URL(track.src, location.href).href) this.audio.src = track.src; };
  FileEngine.prototype.play = function () { return this.audio.play(); };
  FileEngine.prototype.pause = function () { this.audio.pause(); };
  FileEngine.prototype.seek = function (s) { this.audio.currentTime = s; };
  FileEngine.prototype.currentTime = function () { return this.audio.currentTime || 0; };
  FileEngine.prototype.duration = function () { return isFinite(this.audio.duration) ? this.audio.duration : 0; };
  FileEngine.prototype.setVolume = function (v) { this.audio.volume = v; };

  /* ---------- Player (queue + state) ---------- */
  const listeners = [];
  const Player = {
    queue: [], index: -1, playing: false,
    synth: new SynthEngine(),
    file: null,
    on(fn) { listeners.push(fn); },
    emit(type) { listeners.forEach((fn) => fn(type, this)); },
    get current() { return this.queue[this.index] || null; },
    engine() { const t = this.current; return t && t.src ? this.file : this.synth; },
    /** Live frequency analyser for the current track, or null (file tracks are analysed ahead of time in viz.js). */
    analyser() { const t = this.current; return t && !t.src ? (this.synth.analyser || null) : null; },

    /** Replace queue and (optionally) start playing at `index`. */
    setQueue(tracks, index, autoplay) {
      this.stopEngines();
      this.queue = tracks.slice(); this.index = Math.max(0, Math.min(index || 0, tracks.length - 1));
      this.loadCurrent();
      if (autoplay) this.play(); else this.emit('track');
    },
    loadCurrent() {
      const t = this.current; if (!t) return;
      this.engine().load(t);
      this.updateMediaSession();
    },
    play() {
      const t = this.current; if (!t) return;
      try {
        const p = this.engine().play();
        if (p && p.catch) p.catch(() => { this.playing = false; this.emit('state'); });
        this.playing = true;
      } catch (e) {
        this.playing = false;
        window.CR && window.CR.toast && window.CR.toast('Audio is not supported in this browser.');
      }
      this.emit('state'); this.startClock();
    },
    pause() { this.engine() && this.engine().pause(); this.playing = false; this.emit('state'); },
    toggle() { this.playing ? this.pause() : this.play(); },
    /** Toggle a specific track id; switches queue if needed. */
    toggleTrack(tracks, index) {
      const target = tracks[index];
      if (this.current && target && this.current.id === target.id) { this.toggle(); return; }
      this.setQueue(tracks, index, true);
    },
    jump(i) { if (i < 0 || i >= this.queue.length) return; this.stopEngines(); this.index = i; this.loadCurrent(); this.play(); this.emit('track'); },
    next() {
      if (this.index < this.queue.length - 1) this.jump(this.index + 1);
      else { this.stopEngines(); this.index = 0; this.loadCurrent(); this.playing = false; this.emit('track'); this.emit('state'); }
    },
    prev() {
      if (this.time() > 3 || this.index === 0) this.seek(0);
      else this.jump(this.index - 1);
    },
    seek(sec) { const e = this.engine(); if (!e) return; e.seek(Math.max(0, Math.min(sec, this.duration() - 0.25))); this.emit('time'); },
    time() { const e = this.engine(); return e ? e.currentTime() : 0; },
    duration() {
      const t = this.current; if (!t) return 0;
      if (t.src && this.file.duration()) return this.file.duration();
      return t.seconds;
    },
    setVolume(v) { this.volume = v; this.synth.setVolume(v); this.file.setVolume(v); },
    stopEngines() { this.synth.pause(); this.file.pause(); },
    startClock() {
      if (this.clock) return;
      const loop = () => {
        if (!this.playing) { this.clock = null; return; }
        this.emit('time');
        if (this.current && !this.current.src && this.time() >= this.duration()) { this.next(); }
        this.clock = requestAnimationFrame(loop);
      };
      this.clock = requestAnimationFrame(loop);
    },
    updateMediaSession() {
      const t = this.current;
      if (!t || !('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title, artist: t.artistName, album: t.releaseTitle,
          artwork: t.cover ? [{ src: t.cover, sizes: '512x512' }] : [{ src: 'assets/img/logo.png', sizes: '612x408', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      } catch (e) { /* optional API */ }
    }
  };
  Player.file = new FileEngine(() => Player.next(), () => {
    window.CR && window.CR.toast && window.CR.toast('Could not load that audio file.');
    Player.playing = false; Player.emit('state');
  });

  window.CRPlayer = Player;
})();
