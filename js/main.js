'use strict';

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var TAGLINE = '서버가 죽지 않게 만드는 도구를 만듭니다.';

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

function typeTagline() {
  var el = document.getElementById('typed');
  if (!el) return;
  if (REDUCED) { el.textContent = TAGLINE; return; }
  var i = 0;
  (function step() {
    el.textContent = TAGLINE.slice(0, ++i);
    if (i < TAGLINE.length) setTimeout(step, 55);
  })();
}

onReady(function () {
  typeTagline();
});
