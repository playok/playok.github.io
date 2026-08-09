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

function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function countUp(el, target) {
  if (REDUCED) { el.textContent = fmt(target); return; }
  var start = performance.now();
  var dur = 1400;
  (function frame(now) {
    var p = Math.min(1, (now - start) / dur);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(frame);
  })(start);
}

function animateScore() {
  var nums = document.querySelectorAll('[data-stat]');
  for (var i = 0; i < nums.length; i++) {
    countUp(nums[i], parseInt(nums[i].getAttribute('data-target'), 10));
  }

  if (REDUCED) return;
  var bars = document.querySelectorAll('#chart .bar');
  for (var j = 0; j < bars.length; j++) {
    (function (bar, delay) {
      bar.style.height = '0';        // CSS의 height:var(--h)를 잠시 덮어쓴다
      setTimeout(function () {
        bar.style.height = '';       // 인라인 값을 지우면 transition이 목표 높이까지 재생된다
      }, delay);
    })(bars[j], 80 * j);
  }
}

function applyStats(s) {
  var map = {
    total: s.total, year_total: s.year_total,
    max_combo: s.max_combo, current_combo: s.current_combo, best_day: s.best_day
  };
  var nums = document.querySelectorAll('[data-stat]');
  for (var i = 0; i < nums.length; i++) {
    var key = nums[i].getAttribute('data-stat');
    if (map[key] != null) nums[i].setAttribute('data-target', map[key]);
  }

  var chart = document.getElementById('chart');
  if (!chart || !s.by_year) return;

  // 마크업으로 조립하기 전에 형태를 강제한다: 키는 네 자리 연도, 값은 유한한 정수.
  var years = Object.keys(s.by_year)
    .filter(function (y) { return /^\d{4}$/.test(y) && +y >= 2015; })
    .sort();
  var vals = {};
  years = years.filter(function (y) {
    var v = Number(s.by_year[y]);
    if (!isFinite(v) || v < 0) return false;
    vals[y] = Math.round(v);
    return true;
  });
  if (!years.length) return;

  var peak = 0;
  years.forEach(function (y) { peak = Math.max(peak, vals[y]); });
  if (!peak) return;

  // 아래 문자열에 들어가는 값은 전부 위에서 검증된 숫자이거나 고정 문자열이다.
  chart.innerHTML = years.map(function (y) {
    var v = vals[y];
    var cls = v === peak ? ' class="is-record"' : '';
    var pct = (v / peak * 100).toFixed(1);
    return '<li' + cls + ' style="--h:' + pct + '%"><span class="bar"></span>' +
           '<span class="yr">' + y.slice(2) + '</span><span class="n">' + v + '</span></li>';
  }).join('');
}

function initScore() {
  var section = document.getElementById('score');
  if (!section) return;

  var run = function () {
    fetch('assets/stats.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s && s.total) applyStats(s); })
      .catch(function () { /* HTML에 적힌 폴백 값을 그대로 쓴다 */ })
      .then(animateScore);
  };

  if (!('IntersectionObserver' in window)) { run(); return; }
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { io.disconnect(); run(); }
  }, { threshold: 0.25 });
  io.observe(section);
}

onReady(function () {
  typeTagline();
  initScore();
});
