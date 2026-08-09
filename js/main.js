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

var REPOS = [
  { world: 'WORLD 1', title: 'SERVER OPS', items: [
    { n: 'jvm-oom-guardian', l: 'Go', d: 'JVM OutOfMemoryError를 감지해 Tomcat을 재기동하는 감시자' },
    { n: 'TomcatKit', l: 'Go', d: 'Tomcat 9 설정 파일을 다루는 터미널 UI 유틸리티' },
    { n: 'only1mon', l: 'Go', d: '장비 한 대만 집중 감시하는 경량 모니터' },
    { n: 'pg19-simd-check', l: 'C', d: 'PostgreSQL 19의 SIMD 지원 여부 판별기' }
  ]},
  { world: 'WORLD 2', title: 'DESKTOP TOOLS', items: [
    { n: 'devup', l: 'Rust', d: '개발 도구 버전을 점검하고 갱신하는 윈도우 데스크톱 앱' },
    { n: 'DevHome_Relocator', l: 'Rust', d: '개발 도구 캐시를 시스템 드라이브 밖으로 옮기는 GUI 도구' },
    { n: 'synergy-hangul-fix', l: 'Rust', d: 'Synergy/Deskflow 사용 시 한영 전환이 깨지는 문제 해결' }
  ]},
  { world: 'WORLD 3', title: 'WEB & DATA', items: [
    { n: 'gitNotepad', l: 'JavaScript', d: 'git을 저장소로 쓰는 웹 메모장', star: 3 },
    { n: 'ParquetDuckQuery', l: 'HTML', d: 'DuckDB JDBC로 Parquet을 조회하는 도구' },
    { n: 'packetDup', l: 'HTML', d: '트래픽을 복제해 흘려보내는 패킷 프록시' },
    { n: 'kr-supercharger-timeline', l: 'HTML', d: '국내 슈퍼차저 설치 이력 타임라인' }
  ]},
  { world: 'WORLD 4', title: 'AI & SIGNAL', items: [
    { n: 'mcp-glm-go', l: 'Go', d: 'Z.AI GLM 모델을 연결하는 MCP 서버' },
    { n: 'audio-modem', l: 'JavaScript', d: '스피커와 마이크만으로 파일을 전송하는 OFDM 오디오 모뎀' }
  ]}
];

function el(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function renderWorlds() {
  var root = document.getElementById('worlds');
  if (!root) return;

  REPOS.forEach(function (w) {
    var box = el('div', 'world');

    var h3 = el('h3', 'world-title');
    h3.appendChild(el('span', 'world-no', w.world));
    h3.appendChild(document.createTextNode(' ' + w.title));
    box.appendChild(h3);

    var ul = el('ul', 'cards');
    w.items.forEach(function (r) {
      var a = el('a');
      a.href = 'https://github.com/playok/' + r.n;

      var lang = el('span', 'card-lang', r.l);
      lang.setAttribute('data-lang', r.l);
      a.appendChild(lang);
      a.appendChild(el('span', 'card-name', r.n));
      a.appendChild(el('span', 'card-desc', r.d));
      if (r.star) a.appendChild(el('span', 'star', '★ ' + r.star));

      var li = el('li', 'card');
      li.appendChild(a);
      ul.appendChild(li);
    });

    box.appendChild(ul);
    root.appendChild(box);
  });
}

onReady(function () {
  typeTagline();
  initScore();
  renderWorlds();
});
