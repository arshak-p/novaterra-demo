/* Smooth (inertial) scrolling for the whole page. Wheel / trackpad input is eased towards a target
   position each frame; touch, keyboard, scrollbar drags and find-in-page stay native. Anchor links
   glide to their section. Disabled for prefers-reduced-motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';
  const EASE = 0.1;                       // lower = silkier / longer glide
  let target = scrollY, current = scrollY, raf = 0, wheeling = false;
  const max = () => Math.max(0, root.scrollHeight - innerHeight);
  const clamp = (v) => Math.min(max(), Math.max(0, v));

  function loop() {
    const d = target - current;
    if (Math.abs(d) < 0.3) { current = target; window.scrollTo(0, current); raf = 0; wheeling = false; return; }
    current += d * EASE;
    window.scrollTo(0, current);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;
    if (window.__heroGate && window.__heroGate(e)) return;                 // pinned hero step consumes this wheel                      // pinch-zoom, handled elsewhere
    if (e.target.closest && e.target.closest('textarea, .dialog, [data-native-scroll]')) return;   // let inner scrollers scroll
    e.preventDefault();
    if (!raf) { current = target = scrollY; }
    let dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    target = clamp(target + dy);
    wheeling = true;
    start();
  }, { passive: false });

  // keep in sync when something else moves the page (keyboard, scrollbar drag, touch, jump links)
  addEventListener('scroll', () => { if (!raf) { current = target = scrollY; } }, { passive: true });

  // smooth in-page links
  function glideTo(y) { if (!raf) current = scrollY; target = clamp(y); start(); }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    glideTo(el.getBoundingClientRect().top + scrollY);
  });
  window.__glideTo = glideTo;
})();
