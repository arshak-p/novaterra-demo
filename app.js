(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- service content ---------------- */
  const SERVICES = {
    sustain: {
      tag: '01 · Sustainability & ESG', title: 'Making sustainability measurable.',
      desc: 'Helping organizations build sustainable strategies, measure environmental impact, improve resource efficiency, and align their operations with leading ESG expectations and standards.',
      items: ['ESG Strategy Development', 'Sustainability Reporting (GRI · SASB · ISSB)', 'Carbon Footprinting — Scope 1, 2 & 3', 'Net-Zero Roadmap Development', 'Circular Economy Consulting', 'Waste Reduction & Resource Optimization', 'Green Building — LEED · BREEAM · Mostadam', 'Water Efficiency & Conservation', 'Sustainability Audits', 'Environmental Impact Assessments']
    },
    energy: {
      tag: '02 · Energy & Efficiency', title: 'Smarter energy. Lower costs.',
      desc: 'Helping organizations reduce energy consumption, improve operational efficiency, optimize utilities, and accelerate the transition toward cleaner and smarter energy systems.',
      items: ['Energy Audits — ASHRAE Level 1–3', 'Industrial Energy Efficiency Optimization', 'HVAC, Lighting & Motor Efficiency Studies', 'Solar, Wind & Hybrid Feasibility', 'Energy Management Systems — ISO 50001', 'Measurement & Verification — IPMVP', 'Factory Decarbonization Strategies', 'Utility Cost Reduction', 'Smart Metering & Energy Analytics', 'Power Quality & Reliability Assessments']
    },
    digital: {
      tag: '03 · Technology & Digital', title: 'Data that turns into action.',
      desc: 'Enabling organizations to use connected technologies, intelligent systems, data, and automation to improve visibility, decision-making, productivity, and performance.',
      items: ['Digital Transformation Strategy', 'IoT-Based Energy Monitoring', 'Smart Building Automation', 'SCADA Modernization', 'Digital Twins', 'AI-Based Predictive Maintenance', 'Sustainability Data Analytics', 'Performance Dashboards', 'Cloud Migration Strategy', 'Industrial Cybersecurity']
    },
    excel: {
      tag: '04 · Operational Excellence', title: 'Leaner processes. Clearer results.',
      desc: 'Improving organizational performance through optimized processes, effective management systems, measurable KPIs, risk management, and operational efficiency.',
      items: ['Business Process Optimization', 'Lean Six Sigma Consulting', 'Organizational Restructuring', 'Performance Management Systems', 'KPI Development & Monitoring', 'Change Management', 'Risk Management & Compliance', 'Supply Chain & Procurement Efficiency', 'Quality Management — ISO 9001', 'Compliance Consulting']
    },
    vision: {
      tag: '05 · Saudi Vision 2030', title: "Advancing the Kingdom's transformation.",
      desc: "Aligning sustainability, energy and operational programmes with Saudi Vision 2030 priorities, national localisation goals and regulatory frameworks.",
      items: ['Energy Transition Advisory', 'IKTVA Strategy & Localisation', 'Smart City Consulting', 'Saudi Regulatory Alignment', 'Giga-project Sustainability Support', 'Local Content Planning', 'Saudi Green Initiative Alignment', 'Public-Sector Programme Advisory', 'Stakeholder Engagement', 'Capability Building & Training']
    }
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERESTS = ['Sustainability & ESG', 'Energy & Efficiency', 'Digital Transformation', 'Operational Excellence', 'Vision 2030 Advisory', 'Other'];

  /* ---------------- modal ---------------- */
  const modal = $('#modal'), body = $('#mBody');
  let lastFocus = null;

  function open(key) {
    lastFocus = document.activeElement;
    modal.classList.remove('box-ticket');
    if (key === 'contact') body.innerHTML = contactHTML();
    else {
      const s = SERVICES[key];
      body.innerHTML = `
        <p class="eyebrow"><i></i><span>${s.tag}</span></p>
        <h3 id="mTitle">${s.title}</h3>
        <p class="d">${s.desc}</p>
        <ul class="grid2">${s.items.map((t, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b>${t}</li>`).join('')}</ul>
        <button class="btn btn-green" data-contact>Book a consultation <i class="arr"></i></button>`;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const f = $('input,button.btn', body); f && f.focus();
    wireModal();
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  function contactHTML() {
    const f = (n, l, t = 'text', o = {}) => `<label class="fld">${l}${o.req ? ' <b aria-hidden="true">*</b>' : ''}
      <input name="${n}" type="${t}" ${o.req ? 'required' : ''} ${o.ac ? `autocomplete="${o.ac}"` : ''} ${o.ph ? `placeholder="${o.ph}"` : ''} aria-describedby="err-${n}">
      <span class="err" id="err-${n}" role="alert"></span></label>`;
    return `
      <div class="form-wrap" id="formWrap">
        <p class="eyebrow"><i></i><span>Contact</span></p>
        <h3 id="mTitle">Let's build what's next.</h3>
        <p class="d">Have a sustainability, energy, technology or operational challenge? Speak with our consulting team to explore how Novaterra can help.</p>
        <form id="enquiry" novalidate>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="row">${f('name', 'Name', 'text', { req: 1, ac: 'name' })}${f('company', 'Company', 'text', { ac: 'organization' })}${f('title', 'Job Title', 'text', { ac: 'organization-title' })}</div>
          <div class="row">${f('email', 'Email', 'email', { req: 1, ac: 'email', ph: 'you@company.com' })}${f('phone', 'Phone', 'tel', { ac: 'tel', ph: '+966 …' })}${f('country', 'Country', 'text', { ac: 'country-name' })}</div>
          <label class="lbl">Area of Interest</label>
          <div class="chips" role="radiogroup" aria-label="Area of interest">${INTERESTS.map((c, i) => `<button type="button" role="radio" aria-checked="${i === 4}" class="chip${i === 4 ? ' on' : ''}">${c}</button>`).join('')}</div>
          <label class="fld">Message <b aria-hidden="true">*</b>
            <textarea name="message" required minlength="10" aria-describedby="err-message"></textarea>
            <span class="err" id="err-message" role="alert"></span></label>
          <div class="form-actions">
            <button class="btn btn-green" type="submit"><span class="lbl-txt">Submit Enquiry</span> <i class="arr"></i></button>
            <p class="status" id="status" role="status" aria-live="polite"></p>
          </div>
        </form>
      </div>
      <div class="sent" id="sent" hidden>
        <div class="vis" id="vis" aria-hidden="true"></div>
        <h3>Thank you. Your enquiry is in.</h3>
        <p>Our consulting team will reply to <strong id="sentTo"></strong> shortly.</p>
        <button class="btn btn-dark" type="button" id="sentAgain"><span class="lbl-txt">Send another</span> <i class="arr"></i></button>
      </div>`;
  }

  const RULES = {
    name: (v) => (v.trim().length < 2 ? 'Please enter your name.' : ''),
    email: (v) => (!v.trim() ? 'Please enter your email.' : !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v.trim()) ? 'That email doesn’t look right.' : ''),
    phone: (v) => (v.trim() && !/^[+()\d][\d\s().-]{6,}$/.test(v.trim()) ? 'Use digits only, e.g. +966 50 000 0000.' : ''),
    message: (v) => (v.trim().length < 10 ? 'Tell us a little more (at least 10 characters).' : '')
  };
  function validateField(form, name) {
    const el = form.elements[name], rule = RULES[name]; if (!el || !rule) return true;
    const msg = rule(el.value), box = el.closest('.fld'), out = $('.err', box);
    box.classList.toggle('bad', !!msg); box.classList.toggle('good', !msg && !!el.value.trim());
    el.setAttribute('aria-invalid', String(!!msg)); out.textContent = msg;
    return !msg;
  }
  function wireModal() {
    $$('[data-contact]', body).forEach((b) => b.addEventListener('click', () => open('contact')));
    $$('.chip', body).forEach((c) => c.addEventListener('click', () => {
      $$('.chip', body).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
      c.classList.add('on'); c.setAttribute('aria-checked', 'true');
    }));
    const form = $('#enquiry', body);
    if (!form) return;
    const btn = $('button[type=submit]', form), st = $('#status', form);
    // validate as the visitor leaves a field, then live while correcting it
    Object.keys(RULES).forEach((n) => {
      const el = form.elements[n]; if (!el) return;
      el.addEventListener('blur', () => { if (el.value || el.closest('.fld').classList.contains('bad')) validateField(form, n); });
      el.addEventListener('input', () => { if (el.closest('.fld').classList.contains('bad') || el.closest('.fld').classList.contains('good')) validateField(form, n); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.elements.website.value) return;                      // honeypot: bots fill this, people never see it
      const results = Object.keys(RULES).map((n) => [n, validateField(form, n)]);
      const firstBad = results.find((r) => !r[1]);
      if (firstBad) {
        st.textContent = 'Please fix the highlighted fields.'; st.className = 'status error';
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        form.elements[firstBad[0]].focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form)); delete data.website;
      data.interest = ($('.chip.on', form) || {}).textContent || '';
      btn.disabled = true; btn.classList.add('loading'); $('.lbl-txt', btn).textContent = 'Sending'; st.textContent = ''; st.className = 'status';
      try {
        const r = await Promise.race([
          fetch('api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
        ]);
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || 'failed');
        document.dispatchEvent(new Event('enquiry:sent'));
        showSent(form, data.email);
      } catch (err) {
        btn.disabled = false; btn.classList.remove('loading'); $('.lbl-txt', btn).textContent = 'Submit Enquiry';
        st.textContent = err.message === 'timeout' || err instanceof TypeError ? 'Network problem. Please check your connection and try again.' : (err.message && err.message !== 'failed' ? err.message : 'Something went wrong. Please try again.');
        st.className = 'status error';
      }
    });
  }
  const receiptHTML = (email) => {
      const now = new Date(), t = now.toTimeString().slice(0, 5), ref = 'SEN-' + String(Math.floor(10000 + Math.random() * 89999));
      return `<div class="rc"><div class="rc-slot"></div><div class="rc-paper">
        <div class="rc-h">NOVATERRA · ENQUIRY</div>
        <div class="rc-r"><span>Ref</span><b>${ref}</b></div>
        <div class="rc-r"><span>To</span><b>${email.length > 24 ? email.slice(0, 22) + '…' : email}</b></div>
        <div class="rc-r"><span>Time</span><b>${t}</b></div>
        <div class="rc-bars"></div><span class="rc-stamp">RECEIVED</span></div></div>`;
    };
  function showSent(form, email) {
    const wrap = $('#formWrap', body), sent = $('#sent', body);
    $('#sentTo', body).textContent = email;
    sent.className = 'sent v0';
    $('#vis', body).innerHTML = receiptHTML(email);
    modal.classList.add('box-ticket');                   // the success message always arrives as the ticket
    wrap.classList.add('leaving');
    setTimeout(() => {
      wrap.hidden = true; sent.hidden = false; sent.classList.add('play');
      sent.setAttribute('tabindex', '-1'); sent.focus({ preventScroll: true });
      $('#sentAgain', body).addEventListener('click', () => { open('contact'); }, { once: true });
    }, reduceMotion ? 50 : 380);
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) return open(o.dataset.open);
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  /* ---------------- nav ---------------- */
  const nav = $('.nav'), burger = $('#burger'), links = $('#links'), mnav = $('#mnav');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    mnav.setAttribute('aria-hidden', String(!open));
    mnav.inert = !open;
  };
  setMenu(false);
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 899) setMenu(false); });

  const secs = $$('.sec');
  const navLinks = [...$$('[data-nav]', links), ...$$('[data-nav]', mnav)];
  function setActive(k) { navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === k)); }

  /* ---------------- reveal ---------------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
  secs.forEach((s) => io.observe(s));
  secs[0].classList.add('in');

  /* ---------------- dotted journey line, drawn through the same anchors the globe uses ---------------- */
  const pathDark = $('#pathDark'), pathLight = $('#pathLight'), clipShape = $('#clipShape'), pathBox = $('.path'), svg = $('#pathSvg');
  const ringsDark = $('#ringsDark'), ringsLight = $('#ringsLight');
  const BRIGHT = ['sustain', 'digital', 'vision', 'contact'];
  const tilts = $$('.giant.tilt-l, .giant.tilt-r').map((el) => ({ el, sec: el.closest('.sec'), top: 0,
    from: el.classList.contains('tilt-l') ? -9 : 6, to: el.classList.contains('tilt-l') ? -2 : 1 }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vh = innerHeight, secTops = [];

  window.addEventListener('globe:measured', (e) => {
    const { P, seg } = e.detail, vw = innerWidth; vh = innerHeight;
    const d = seg.map((s, i) => `${i ? '' : `M${s[0][0]},${s[0][1]} `}C${s[1][0]},${s[1][1]} ${s[2][0]},${s[2][1]} ${s[3][0]},${s[3][1]}`).join(' ');
    pathDark.setAttribute('d', d); pathLight.setAttribute('d', d);
    const docH = document.documentElement.scrollHeight;
    pathBox.style.height = docH + 'px';
    svg.setAttribute('viewBox', `0 0 ${vw} ${docH}`);
    const rs = P.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="10"/><circle class="c" cx="${p[0]}" cy="${p[1]}" r="2.2"/>`).join('');
    ringsDark.innerHTML = rs; ringsLight.innerHTML = rs;
    const edge = (s) => {
      const wv = s.querySelector('.wave'); if (!wv) return null;
      const r = wv.getBoundingClientRect(), top = r.top + scrollY;
      const dd = wv.querySelector('path').getAttribute('d');
      const vbH = Number(wv.getAttribute('viewBox').split(' ')[3]) || 200;
      const nums = dd.match(/-?\d*\.?\d+/g).map(Number);
      let p0, ci;
      if (/^M[^C]*L/.test(dd)) { p0 = [nums[2], nums[3]]; ci = 4; } else { p0 = [nums[0], nums[1]]; ci = 2; }
      const c1 = [nums[ci], nums[ci + 1]], c2 = [nums[ci + 2], nums[ci + 3]], p3 = [nums[ci + 4], nums[ci + 5]];
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const t = k / 24, u = 1 - t;
        pts.push([(u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p3[0]) / 1440 * vw,
          top + (u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p3[1]) / vbH * r.height]);
      }
      return pts;
    };
    const edges = secs.map(edge);
    let shape = '';
    secs.forEach((s, i) => {
      if (!BRIGHT.includes(s.id)) return;
      const topEdge = edges[i - 1] || [[0, 0], [vw, 0]];
      const sb = s.getBoundingClientRect(), bottom = edges[i] || [[0, sb.bottom + scrollY], [vw, sb.bottom + scrollY]];
      shape += 'M' + topEdge.concat(bottom.slice().reverse()).map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L') + 'Z';
    });
    clipShape.setAttribute('d', shape);
    { const hb = secs[0].getBoundingClientRect().bottom + scrollY, r = document.getElementById('noHeroRect'); r.setAttribute('y', hb); r.setAttribute('height', 100000); }
    tilts.forEach((t) => { t.top = t.sec.getBoundingClientRect().top + scrollY; });
    secTops = secs.map((s) => s.getBoundingClientRect().top + scrollY);
  });

  /* header highlight + headline tilt follow the scroll */
  let tick = false;
  function onScroll() {
    tick = false;
    const y0 = scrollY;
    nav.classList.toggle('scrolled', y0 > 40);
    if (!reduce) tilts.forEach((tl) => {
      const top = tl.top - y0;
      if (top > vh || top < -vh * 1.5) return;
      const q = Math.min(1, Math.max(0, 1 - (top + vh * 0.2) / (vh * 1.2)));
      tl.el.style.transform = `rotate(${(tl.from + (tl.to - tl.from) * q).toFixed(2)}deg)`;
    });
    let c = 0; const mid = y0 + vh * 0.4;
    for (let k = 0; k < secTops.length; k++) if (mid >= secTops[k]) c = k;
    setActive(secs[c].dataset.nav);
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('load', () => { window.dispatchEvent(new Event('globe:remeasure')); onScroll(); });
  onScroll();

  /* big words ("NOVATERRA" in the hero and the footer): fit to ~96% of the screen width and keep them exactly centred */
  (function () {
    const words = [['#home .home-word', '--hw'], ['.foot-word', '--fw']]
      .map(([sel, prop]) => ({ el: document.querySelector(sel), prop })).filter((w) => w.el);
    if (!words.length) return;
    function fit() {
      const vw = document.documentElement.clientWidth;
      words.forEach(({ el, prop }) => {
        el.style.width = vw + 'px'; el.style.margin = '0'; el.style.left = '0';
        el.style.setProperty(prop, '100px');
        const r = document.createRange(); r.selectNodeContents(el);
        const w100 = r.getBoundingClientRect().width || 1;
        const F = vw * 0.96 / w100 * 100;
        el.style.setProperty(prop, F.toFixed(2) + 'px');
        el.style.marginLeft = (-el.getBoundingClientRect().left - 0.0195 * F) + 'px';   // full-screen width; nudged so the INK (not the text box) is centred
      });
    }
    fit(); addEventListener('load', fit);
    if (document.fonts) { document.fonts.ready.then(fit); document.fonts.load('800 100px "Inter Tight"').then(fit, () => {}); }
    setTimeout(fit, 500); setTimeout(fit, 1800);   // safety re-fit once web fonts have really settled
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 80); });
  })();

  /* tagged-link visit notice: only when the link has ?c=NAME (e.g. novaterra.example/?c=aboobacker). Normal visitors are not tracked. */
  (function () {
    const m = /[?&]c=([A-Za-z0-9_-]{1,40})/.exec(location.search); if (!m) return;
    const tag = m[1], t0 = Date.now(); let form = false, sent = false, maxY = 0;
    const send = (event) => {
      const secsEls = [...document.querySelectorAll('.sec')]; let reached = '';
      const edge = maxY + innerHeight * 0.6; secsEls.forEach((s) => { if (s.getBoundingClientRect().top + scrollY < edge) reached = s.id; });
      const body = JSON.stringify({ tag, event, seconds: Math.round((Date.now() - t0) / 1000), reached, form, sent, screen: innerWidth + 'x' + innerHeight });
      try { navigator.sendBeacon('api/visit.php', new Blob([body], { type: 'application/json' })); } catch (e) {}
    };
    addEventListener('scroll', () => { maxY = Math.max(maxY, scrollY); }, { passive: true });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-open="contact"],[data-contact]')) form = true; });
    document.addEventListener('enquiry:sent', () => { sent = true; });
    send('open');
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send('leave'); });
  })();

  /* preview helper: add ?demo to the URL to watch the submit animation; nothing is sent */
  (function () {
    if (!/[?&]demo(=|&|$)/.test(location.search)) return;
    const go = () => { open('contact'); setTimeout(() => showSent(null, 'you@company.com'), 500); };
    document.getElementById('loader') ? document.addEventListener('preloader:done', go, { once: true }) : go();
  })();
})();
