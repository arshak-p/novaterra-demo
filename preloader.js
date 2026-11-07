/* Novaterra hand-drawn preloader
   - a "pen" sketches a wobbly globe, a seedling grows, handwritten notes change
   - the % is REAL: it counts images listed in ASSETS (or every <img> on the page) + web fonts
   - shows for at least MIN_MS so the drawing can finish; gives up waiting after MAX_MS */
(() => {
  // ---- settings you can change ----
  const ASSETS = ['assets/globe-tex.jpg', 'assets/globe.png', 'assets/prop-turbine.png', 'assets/prop-rotor.png', 'assets/prop-panel.png', 'assets/prop-leafL.png', 'assets/prop-leafR.png', 'img/riyadh.jpg', 'assets/logo.png'];
  const MIN_MS = 2400;          // shortest time the preloader stays up
  const MAX_MS = 9000;          // never wait longer than this
  const NOTES = ['sharpening the pencil…', 'measuring carbon…', 'auditing the energy…', 'connecting the data…',
                 'leaning the process…', 'aligning with 2030…', 'planting something good.'];
  // ----------------------------------

  const L = document.getElementById('loader'); if (!L) return;
  if (/[?&]nopre(&|$)/.test(location.search)) { L.remove(); document.addEventListener('DOMContentLoaded', () => document.dispatchEvent(new Event('preloader:done'))); return; }   // dev helper: ?nopre skips the loader
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('ld-locked'); L.setAttribute('aria-busy', 'true');

  // hand-drawn shapes: slightly wobbly, so it never looks machine-perfect
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - .5;
  const smooth = pts => pts.reduce((d, p, i, a) => {
    if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const q = a[i-1], m = [(q[0]+p[0])/2, (q[1]+p[1])/2];
    return d + ` Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }, '');
  const loop = (cx, cy, rx, ry, turns, start, wob, n = 72) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = start + i/n*turns*Math.PI*2, w = 1 + rnd()*wob/Math.max(rx, 1); pts.push([cx + Math.cos(a)*rx*w, cy + Math.sin(a)*ry*w]); }
    return smooth(pts);
  };
  const jit = pts => pts.map(p => [p[0] + rnd()*3, p[1] + rnd()*3]);
  const C = [150, 172], R = 96;
  const set = (id, d) => { const el = document.getElementById(id); el.setAttribute('d', d); const len = el.getTotalLength(); el.style.strokeDasharray = len; el.style.strokeDashoffset = len; return { el, len }; };

  // [stroke, starts at %, finished at %]  (as fractions 0–1)
  const parts = [
    [set('ldRing',  loop(C[0], C[1], R, R, 1.07, -1.95, 3.2)), 0, .40],
    [set('ldRing2', loop(C[0]+1.5, C[1]-1, R-3, R-2, .8, 1.2, 4)), .28, .52],
    [set('ldMer1',  loop(C[0], C[1], R*.42, R, 1.0, -1.57, 2)), .38, .60],
    [set('ldLat',   loop(C[0], C[1]+8, R*.98, R*.28, 1.0, 0, 2)), .48, .68],
    [set('ldMer2',  loop(C[0], C[1], R*.82, R, .5, -1.57, 2)), .56, .74],
    [set('ldLand',  smooth(jit([[118,122],[136,114],[150,128],[140,144],[150,160],[132,174],[122,194],[108,180],[104,154],[112,136],[118,122]])) + ' ' +
                    smooth(jit([[176,144],[196,140],[212,154],[204,180],[188,210],[174,200],[170,174],[178,160],[176,144]]))), .62, .86],
    [set('ldStem',  `M150 ${C[1]-R+2} C146 ${C[1]-R-14} 156 ${C[1]-R-26} 150 ${C[1]-R-48}`), .72, .90],
  ];
  const top = C[1]-R-40;
  const leafL = document.getElementById('ldLeafL'), leafR = document.getElementById('ldLeafR');
  leafL.setAttribute('d', `M150 ${top} C132 ${top-4} 118 ${top-18} 116 ${top-34} C136 ${top-34} 150 ${top-20} 150 ${top} Z`);
  leafR.setAttribute('d', `M151 ${top+8} C168 ${top+2} 182 ${top-10} 186 ${top-26} C166 ${top-28} 152 ${top-14} 151 ${top+8} Z`);

  // real loading progress
  const noteEl = document.getElementById('ldNote'), num = document.getElementById('ldNum');
  const urls = ASSETS.length ? ASSETS : [...document.images].map(i => i.currentSrc || i.src).filter(Boolean);
  let done = 0; const total = urls.length + 1; const tick = () => { done++; };
  urls.forEach(u => { const i = new Image(); i.onload = i.onerror = tick; i.src = u; });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(tick, tick);

  const t0 = performance.now(), MIN = reduce ? 400 : MIN_MS;
  let shown = 0, noteIdx = 0, finished = false;
  function frame(now) {
    const el = now - t0;
    let target = Math.min(done / total, Math.min(1, el / MIN)); if (el > MAX_MS) target = 1;
    shown += (target - shown) * (reduce ? 1 : .07);
    if (target === 1 && shown > .996) shown = 1;
    num.textContent = Math.round(shown * 100);
    for (const [{ el: path, len }, a, b] of parts) { const k = Math.min(1, Math.max(0, (shown - a) / (b - a))); path.style.strokeDashoffset = len * (1 - k); }
    leafL.classList.toggle('on', shown > .84); leafR.classList.toggle('on', shown > .94);
    const ni = Math.min(NOTES.length - 1, Math.floor(shown * (NOTES.length - 1) + .001));
    if (ni !== noteIdx) { noteIdx = ni; noteEl.classList.add('fade'); setTimeout(() => { noteEl.textContent = NOTES[ni]; noteEl.classList.remove('fade'); }, 200); }
    if (shown >= 1 && !finished) { finished = true; setTimeout(exit, reduce ? 100 : 700); return; }
    requestAnimationFrame(frame);
  }
  function exit() {
    L.classList.add('out'); L.setAttribute('aria-busy', 'false');
    setTimeout(() => { document.body.classList.remove('ld-locked'); L.remove(); document.dispatchEvent(new Event('preloader:done')); }, reduce ? 450 : 1200);
  }
  const swallow = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  const keys = e => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)) swallow(e); };
  addEventListener('wheel', swallow, { capture: true, passive: false });
  addEventListener('touchmove', swallow, { capture: true, passive: false });
  addEventListener('keydown', keys, true);
  document.addEventListener('preloader:done', () => {
    removeEventListener('wheel', swallow, { capture: true });
    removeEventListener('touchmove', swallow, { capture: true });
    removeEventListener('keydown', keys, true);
  }, { once: true });
  scrollTo(0, 0);
  requestAnimationFrame(frame);
})();
