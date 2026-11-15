/* ==========================================================================
   Ambient sound bed for the intro.
   A slow, hazy drone (a minor-ninth chord through a drifting low-pass filter)
   with a soft bell every few seconds, all generated in the browser: no audio
   files. Used by intro.js; viz.js reads `analyser` so the visuals move with it.

   window.CRAmbient = { start(), stop(fadeSeconds), active, analyser }
   ========================================================================== */
(function () {
  'use strict';

  var ctx = null, master = null, analyser = null, send = null;
  var oscs = [], bellTimer = 0, parkTimer = 0, on = false;

  // A minor 9: A2 C3 E3 B3, plus a sub A1. Bells walk the A minor pentatonic.
  var CHORD = [110, 130.81, 164.81, 246.94];
  var BELLS = [440, 523.25, 587.33, 659.25, 783.99];

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.55;
    analyser.minDecibels = -90; analyser.maxDecibels = -12;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);

    // long echo for the bells
    var delay = ctx.createDelay(2); delay.delayTime.value = 0.62;
    var fb = ctx.createGain(); fb.gain.value = 0.45;
    var wet = ctx.createGain(); wet.gain.value = 0.5;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    send = ctx.createGain(); send.connect(delay);

    // the pad: detuned saws through a low-pass whose cutoff drifts very slowly
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 3;
    lp.connect(master);
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    var lfoDepth = ctx.createGain(); lfoDepth.gain.value = 260;
    lfo.connect(lfoDepth); lfoDepth.connect(lp.frequency);
    lfo.start(); oscs.push(lfo);

    CHORD.forEach(function (f) {
      [-7, 7].forEach(function (cents) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
        g.gain.value = 0.045;
        o.connect(g); g.connect(lp); o.start(); oscs.push(o);
      });
    });
    var sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.type = 'sine'; sub.frequency.value = 55; sg.gain.value = 0.16;
    sub.connect(sg); sg.connect(master); sub.start(); oscs.push(sub);
    return true;
  }

  function bell() {
    if (!on || !ctx) return;
    var t = ctx.currentTime + 0.05;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = BELLS[Math.floor(Math.random() * BELLS.length)];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g); g.connect(master); g.connect(send);
    o.start(t); o.stop(t + 2.6);
    bellTimer = setTimeout(bell, 2400 + Math.random() * 3600);
  }

  function start() {
    if (!ctx && !build()) return false;
    clearTimeout(parkTimer);
    if (ctx.state === 'suspended') ctx.resume();
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.6, now, 0.8);       // about two seconds to full
    if (!on) { on = true; bellTimer = setTimeout(bell, 1200); }
    return true;
  }

  function stop(fadeSeconds) {
    if (!ctx || !on) return;
    on = false;
    clearTimeout(bellTimer);
    var fade = fadeSeconds == null ? 1.5 : fadeSeconds, now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, Math.max(0.05, fade / 3));
    parkTimer = setTimeout(function () { if (!on && ctx.state === 'running') ctx.suspend(); }, fade * 1000 + 600);   // stop using CPU once silent
  }

  window.CRAmbient = {
    start: start,
    stop: stop,
    get active() { return on; },
    get analyser() { return on ? analyser : null; }
  };
})();
