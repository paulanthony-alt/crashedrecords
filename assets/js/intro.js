/* ==========================================================================
   Crashed Records — enter animation
   Shown as an overlay the first time someone lands on the home page in a
   browser session. "Enter the float" warps through to the site; "Skip intro"
   fades straight to it. The sound toggle drives the site's music player, so
   whatever starts here keeps playing after you enter.
   Replay any time with  window.CRIntro.show()  (wired to the footer link).
   ========================================================================== */
(function () {
  'use strict';

  var WARP_MS = 1350;       // length of the warp before the site shows
  var LEAVE_MS = 600;       // fade-out of the overlay
  var SESSION_KEY = 'cr:intro-seen';
  var LOGO_SRC = 'assets/img/logo.png';

  var LONG_STAR = 'M20 0C21 50 24 57 40 60C24 63 21 70 20 120C19 70 16 63 0 60C16 57 19 50 20 0Z';
  var SPARKLE = 'M12 0C12.8 8.6 15.4 11.2 24 12C15.4 12.8 12.8 15.4 12 24C11.2 15.4 8.6 12.8 0 12C8.6 11.2 11.2 8.6 12 0Z';
  var ENTER_STAR = 'M32 1C34 21 43 30 63 32C43 34 34 43 32 63C30 43 21 34 1 32C21 30 30 21 32 1Z';

  var MARKUP =
    '<div class="cri-bloom" aria-hidden="true"><div class="cri-liquid" data-viz="intro"><div class="cri-marble"></div></div><div class="cri-vignette"></div></div>' +
    '<svg class="cri-grain" aria-hidden="true"><rect width="100%" height="100%" filter="url(#cr-grain)"/></svg>' +
    '<div class="cri-stars" aria-hidden="true"></div>' +
    '<div class="cri-spark" aria-hidden="true"><svg viewBox="0 0 40 120"><path d="' + LONG_STAR + '" fill="url(#cr-star)"/></svg></div>' +
    '<div class="cri-wave" aria-hidden="true"></div>' +
    '<div class="cri-stage">' +
      '<div class="cri-zoom"><div class="cri-logo-wrap">' +
        '<img class="cri-split a" src="' + LOGO_SRC + '" alt="" aria-hidden="true">' +
        '<img class="cri-split b" src="' + LOGO_SRC + '" alt="" aria-hidden="true">' +
        '<div class="cri-logo-float" data-react><img src="' + LOGO_SRC + '" alt="Crashed Records — shit that makes you float"></div>' +
      '</div></div>' +
      '<p class="cri-cue">Put your headphones on</p>' +
      '<button class="cri-enter" type="button" aria-label="Enter Crashed Records">' +
        '<span class="cri-enter-star">' +
          '<svg class="shape" viewBox="0 0 64 64" aria-hidden="true"><path d="' + ENTER_STAR + '" fill="rgba(7,6,11,.6)" stroke="url(#cr-star)" stroke-width="1"/></svg>' +
          '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="position:relative;margin-left:3px"><path d="M6 3l15 9-15 9V3z" fill="currentColor"/></svg>' +
        '</span>' +
        '<span class="cri-enter-label">Enter the float</span>' +
      '</button>' +
    '</div>' +
    '<button class="cri-corner cri-skip" type="button">Skip intro →</button>' +
    '<button class="cri-corner cri-sound" type="button" aria-pressed="false"><span class="cri-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="cri-sound-label">Sound off</span></button>' +
    '<div class="cri-warp" aria-hidden="true"><div class="cri-streaks"></div><div class="cri-flash"></div></div>';

  var el = null, timer = null, lastFocus = null;

  function seen() { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* private mode */ } }

  function stars(container) {
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 30; i++) {
      var size = 6 + Math.round(rnd() * 16);
      var s = document.createElementNS(ns, 'svg');
      s.setAttribute('viewBox', '0 0 24 24');
      s.setAttribute('class', 'cri-star-dot');
      s.style.cssText = 'left:' + Math.round(rnd() * 96 + 2) + '%;top:' + Math.round(rnd() * 92 + 4) + '%;width:' + size + 'px;height:' + size + 'px;' +
        '--d1:' + (1.2 + rnd() * 1.6).toFixed(2) + 's;--d2:' + (2 + rnd() * 4).toFixed(2) + 's;--dur:' + (3 + rnd() * 4).toFixed(2) + 's';
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', SPARKLE);
      p.setAttribute('fill', i % 4 === 0 ? '#C9A8FF' : '#E8E1D3');
      s.appendChild(p);
      container.appendChild(s);
    }
  }

  function player() { return window.CRPlayer; }

  function setSound(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.cri-sound-label').textContent = on ? 'Sound on' : 'Sound off';
  }

  function close() {
    if (!el) return;
    var node = el;
    el = null;
    clearTimeout(timer);
    markSeen();
    node.classList.add('is-leaving');
    if (window.CRViz) window.CRViz.refresh();   // hand the reactive canvas back to the page underneath
    document.removeEventListener('keydown', onKey, true);
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
      document.body.classList.remove('intro-open');
      var view = document.getElementById('view');
      if (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus();
      else if (view) view.focus({ preventScroll: true });
    }, LEAVE_MS);
  }

  function enter() {
    if (!el || el.classList.contains('is-entering')) return;
    el.classList.add('is-entering');
    timer = setTimeout(close, WARP_MS);
  }

  function onKey(e) {
    if (!el) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { // keep focus inside the intro
      var f = Array.prototype.slice.call(el.querySelectorAll('button'));
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  function show() {
    if (el) return;
    lastFocus = document.activeElement;
    el = document.createElement('div');
    el.className = 'cr-intro';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Crashed Records intro');
    el.innerHTML = MARKUP;
    stars(el.querySelector('.cri-stars'));

    el.querySelector('.cri-enter').addEventListener('click', enter);
    el.querySelector('.cri-skip').addEventListener('click', close);

    var snd = el.querySelector('.cri-sound');
    var P = player();
    if (!P || !P.current) snd.hidden = true;     // nothing to play yet: no sound toggle
    setSound(snd, !!(P && P.playing));
    snd.addEventListener('click', function () {
      var p = player();
      if (!p) return;
      if (p.playing) p.pause(); else p.play();   // the click is the user gesture browsers need for audio
      setSound(snd, p.playing);
    });

    document.body.appendChild(el);
    document.body.classList.add('intro-open');
    document.addEventListener('keydown', onKey, true);
    el.querySelector('.cri-enter').focus({ preventScroll: true });
    if (window.CRViz) window.CRViz.refresh();
  }

  function onHome() {
    var h = (location.hash || '').replace(/^#/, '');
    return h === '' || h === '/';
  }

  window.CRIntro = { show: show, close: close };

  if (!seen() && onHome()) show();
})();
