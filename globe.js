/* Novaterra globe — the WebGL sphere block below is copied verbatim from seenteco-site/index.html.
   Only the surrounding wiring differs: stops come from [data-globe="x,y,size,tilt"] anchors in each
   section (x,y,size in 1440-wide design px) so the journey stays correct on every screen size. */
(() => {
  const globe = document.getElementById('globe'), shadow = document.getElementById('shadow');
  const hint = document.getElementById('scrollHint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let hp = 0, hpT = 0;                                    // hero progress (0 = big globe, 1 = small + text)
  const atTop = () => scrollY <= 1;
  let lockUntil = 0;
  const advance = (e, dir) => {
    if (!atTop()) return false;
    const now = performance.now();
    if (now < lockUntil) {                       // still inside the step (or its trackpad inertia tail): swallow input
      if (e && e.type === 'wheel') lockUntil = Math.max(lockUntil, now + 350);
      if (e) e.preventDefault();
      return true;
    }
    if (dir > 0 && hpT < 1) { hpT = 1; lockUntil = now + 1100; if (e) e.preventDefault(); return true; }
    if (dir < 0 && hpT > 0) { hpT = 0; lockUntil = now + 1100; if (e) e.preventDefault(); return true; }
    return false;
  };
  addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) < 2) return; if (advance(e, Math.sign(e.deltaY))) e.stopImmediatePropagation(); }, { capture: true, passive: false });
  addEventListener('keydown', (e) => { if (['ArrowDown', 'PageDown', ' '].includes(e.key)) advance(e, 1); else if (['ArrowUp', 'PageUp'].includes(e.key)) advance(e, -1); });
  window.__heroGate = (e) => Math.abs(e.deltaY) >= 2 && advance(e, Math.sign(e.deltaY));
  let ty = null;
  addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => { if (ty === null) return; const d = ty - e.touches[0].clientY; if (Math.abs(d) > 24 && advance(e, Math.sign(d))) ty = null; }, { passive: false });
  addEventListener('touchend', () => { ty = null; });
  const heroWord = document.querySelector('#home .home-word');
  const heroCopy = document.querySelector('#home .copy');
  if (heroCopy) heroCopy.style.transition = 'none';
  const hw0 = document.querySelector('#home .home-word'); if (hw0) hw0.style.transition = 'none';
  const anchors = [...document.querySelectorAll('[data-globe]')];
  let sc = 1, vw = innerWidth, vh = innerHeight;
  let P = [], S = [], A = [], seg = [];

  const bez = (s, t) => { const u = 1 - t; return [0, 1].map(k => u*u*u*s[0][k] + 3*u*u*t*s[1][k] + 3*u*t*t*s[2][k] + t*t*t*s[3][k]); };

  function measure() {
    vw = innerWidth; vh = innerHeight;
    sc = Math.max(0.6, vw / 1440);
    P = []; S = [];
    anchors.forEach(el => {
      const r = el.getBoundingClientRect(), d = el.dataset.globe.split(',').map(Number);
      P.push([r.left + r.width / 2, r.top + scrollY + r.height / 2]);
      S.push([d[2], d[3]]);
    });
    seg = P.slice(0, -1).map((p1, i) => {
      const p0 = P[i - 1] || p1, p2 = P[i + 1], p3 = P[i + 2] || p2;
      return [p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2];
    });
    const max = document.documentElement.scrollHeight - vh;
    A = P.map((p, i) => anchors[i].dataset.at !== undefined ? 0 : clamp(p[1] - vh * 0.5, 0, max));        // stop is "reached" at the vertical centre of the screen
    window.dispatchEvent(new CustomEvent('globe:measured', { detail: { P, seg } }));
  }
  function state() {
    const y = scrollY, n = P.length - 1;
    if (y <= 1) return { i: 0, t: ease(hp) };              // pinned hero: scroll input drives hp, the page stays put
    if (y >= A[n]) return { i: n - 1, t: 1 };
    let i = 0; while (y > A[i + 1]) i++;
    const raw = (y - A[i]) / Math.max(1, A[i + 1] - A[i]);
    return { i, t: ease(clamp((raw - .08) / .84, 0, 1)) };     // hold 8% · ease through 84% · hold 8%
  }

  const G = (() => {
    const cv = document.getElementById('gl'), gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true });
    const api = { ok: false, draw() {} };
    if (!gl) return api;
    const SR = 0.58;                                  // sphere radius as a share of the box
    const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}';
    const deriv = !!gl.getExtension('OES_standard_derivatives');
    const fs = `${deriv ? '#extension GL_OES_standard_derivatives : enable\n#define DERIV 1\n' : ''}precision highp float;
      varying vec2 v;uniform sampler2D T;uniform mat3 M;uniform float R;
            float hgt(vec2 uv){return dot(texture2D(T,uv).rgb,vec3(.3,.6,.1));}
      void main(){
        vec2 q=v/R;float d=dot(q,q);float r=sqrt(d);
        vec3 L=normalize(vec3(-.55,.45,.72));
        if(d>1.){discard;}
        vec3 n=vec3(q,sqrt(1.-d));vec3 o=M*n;
        float lon=atan(o.x,o.z),lat=asin(clamp(o.y,-1.,1.));
        float u1=lon/6.2831853+.5;
        #ifdef DERIV
          float u2=fract(u1+.5)-.5;float u=fwidth(u1)<=fwidth(u2)+1e-6?u1:u2;
        #else
          float u=u1;
        #endif
        vec2 uv=vec2(u,.5-lat/3.1415927);
        vec3 s=texture2D(T,uv).rgb;
        float land=smoothstep(.07,.2,s.g-s.b);
        vec3 c=pow(s,vec3(2.2));
        vec2 e=vec2(2./1024.,2./512.);
        float hx=hgt(uv+vec2(e.x,0.))-hgt(uv-vec2(e.x,0.)),hy=hgt(uv+vec2(0.,e.y))-hgt(uv-vec2(0.,e.y));
        vec3 east=vec3(cos(lon),0.,-sin(lon)),north=vec3(-sin(lat)*sin(lon),cos(lat),-sin(lat)*cos(lon));
        vec3 nb=normalize(o-land*2.4*(hx*east-hy*north))*M;
        float ndl=dot(n,L),df=max(dot(nb,L),0.),wrap=clamp(ndl*.5+.5,0.,1.);
        vec3 col=c*(.07+1.3*df);
        vec3 H=normalize(L+vec3(0.,0.,1.));
        float sp=pow(max(dot(n,H),0.),90.)*(1.-land)*.22;
        col+=sp*vec3(.75,.95,.85)*smoothstep(0.,.25,ndl);
        float fr=pow(1.-n.z,4.);
        col+=(1.-land)*fr*vec3(.05,.16,.12)*.5*wrap;
        col*=1.-pow(1.-n.z,3.)*.45;
        col=pow(max(col,0.),vec3(1./2.2));
        float a=smoothstep(1.,.99,d);gl_FragColor=vec4(col*a,a);}`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return api;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uM = gl.getUniformLocation(pr, 'M'), uR = gl.getUniformLocation(pr, 'R');
    gl.uniform1f(uR, SR);
    const tex = gl.createTexture(); let ready = false;
    const img = new Image();
    // The texture must be a real, readable 2048x1024 image. If a host serves it broken (truncated upload, wrong file,
    // blocked), the globe falls back to the flat picture instead of showing a black ball.
    const texOK = (im) => {
      if (im.naturalWidth < 512 || im.naturalHeight < 256) return false;
      try {
        const c = document.createElement('canvas'); c.width = 32; c.height = 16;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 16);
        const d = x.getImageData(0, 0, 32, 16).data; let sum = 0, hi = 0;
        for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += l; if (l > 70) hi++; }
        return sum / (d.length / 4) > 12 && hi > 8;            // not black, and has some bright land
      } catch (e) { return true; }
    };
    let tries = 0;
    const loadTex = () => {
      const im = new Image();
      im.onload = () => {
        if (!texOK(im)) { if (tries++ < 1) { setTimeout(loadTex, 400); } else { console.warn('Novaterra: globe texture looks broken, using the flat globe.'); globe.dataset.tex = 'bad'; } return; }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        // WebGL1 only allows mipmaps + REPEAT on power-of-two textures. Some hosts/CDNs resize images (e.g. to 1600x800),
        // which would otherwise make the globe render BLACK. Always upload a 2048x1024 copy.
        const pw = (n) => (n & (n - 1)) === 0;
        let src = im;
        if (!(pw(im.naturalWidth) && pw(im.naturalHeight))) {
          const cv2 = document.createElement('canvas'); cv2.width = 2048; cv2.height = 1024;
          const x2 = cv2.getContext('2d'); x2.imageSmoothingQuality = 'high'; x2.drawImage(im, 0, 0, 2048, 1024); src = cv2;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
        gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, deriv ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(pr, 'T'), 0);
        ready = true; globe.classList.add('live');
      };
      im.onerror = () => { if (tries++ < 1) setTimeout(loadTex, 400); else { console.warn('Novaterra: globe texture failed to load.'); globe.dataset.tex = 'missing'; } };
      im.src = 'assets/globe-tex.jpg' + (tries ? '?r=' + Date.now() : '');
    };
    loadTex();
    // objects anchored on the surface: [file, lat, lon, height relative to radius, mirror]
    const P = [['turbine', 62, 15, .7], ['panel', 40, 60, .42], ['leafL', 40, -110, .4], ['leafR', 25, 85, .32],
               ['turbine', -30, 135, .6], ['leafR', -15, -50, .32, 1], ['panel', 10, 10, .36], ['leafL', 58, -105, .34, 1]];
    const props = P.map(([f, la, lo, h, m]) => {
      let el;
      if (f === 'turbine') {     // tower + a separate rotor image that spins (CSS animation)
        el = document.createElement('div'); el.className = 'prop turbine';
        const TOW = { w: 105, h: 480 };
        Object.defineProperty(el, 'naturalWidth', { value: TOW.w }); Object.defineProperty(el, 'naturalHeight', { value: TOW.h });
        const tw = new Image(); tw.src = 'assets/prop-turbine.png'; tw.alt = ''; tw.style.cssText = 'width:100%;height:100%;display:block';
        const ro = new Image(); ro.src = 'assets/prop-rotor.png'; ro.alt = ''; ro.className = 'rotor';
        ro.style.cssText = 'position:absolute;left:51.68%;top:3.72%;width:437.1%;height:auto;margin:0;transform-origin:50% 50%';
        el.append(tw, ro); globe.appendChild(el);
      } else { el = new Image(); el.src = `assets/prop-${f}.png`; el.className = 'prop'; el.alt = ''; el.decoding = 'async'; globe.appendChild(el); }
      const a = la*Math.PI/180, b = lo*Math.PI/180;
      return { el, h, m: m ? -1 : 1, v: [Math.cos(a)*Math.sin(b), Math.sin(a), Math.cos(a)*Math.cos(b)] };
    });
    const mul = (A, B) => A.map((r, i) => [0,1,2].map(j => r[0]*B[0][j] + r[1]*B[1][j] + r[2]*B[2][j]));
    api.ok = true;
    api.draw = (p, tilt, now, size) => {
      if (!ready) return;
      const dpr = Math.min(devicePixelRatio || 1, 2), need = Math.min(1400, Math.round(size * dpr));
      let px = cv.width;
      if (!px || px < need || px > need * 1.5) px = Math.min(1400, Math.ceil(need * 1.15 / 64) * 64);   // resize only when really needed (never below native)
      let resized = false;
      if (cv.width !== px) { cv.width = cv.height = px; gl.viewport(0, 0, px, px); resized = true; }
      // spin around its own axis + tumble forward/back + lean, all driven by scroll
      const key = p.toFixed(3) + '|' + tilt.toFixed(1) + '|' + Math.round(size);
      if (!resized && key === api.key && now - (api.t || 0) < 33) return;
      api.key = key; api.t = now;
      const idle = reduce ? 0 : now/1000*0.12;
      const turns = p < 1 ? 0.18 * p : 0.18 + (p - 1);          // hero step: gentle ~65° turn instead of a full spin; later sections: one full turn each
      const yaw = (reduce ? 0 : turns*Math.PI*2) + idle + 0.35;
      const k = Math.floor(p), f = p - k, dir = k % 2 ? -1 : 1;
      const tumble = k === 0 ? 0.2 : 0.75;                      // hero step barely tumbles
      const pitch = 0.3 + (reduce ? 0 : Math.sin(f*Math.PI)*tumble*dir);
      const roll = tilt*Math.PI/180 + (reduce ? 0 : Math.sin(f*Math.PI)*(k === 0 ? 0.1 : 0.35)*-dir);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll);
      const Ry = [[cy,0,sy],[0,1,0],[-sy,0,cy]], Rx = [[1,0,0],[0,cx,-sx],[0,sx,cx]], Rz = [[cz,-sz,0],[sz,cz,0],[0,0,1]];
      const Rot = mul(Rz, mul(Rx, Ry));                       // object → view
      // shader wants view → object (transpose), uploaded column-major
      gl.uniformMatrix3fv(uM, false, new Float32Array([Rot[0][0],Rot[0][1],Rot[0][2], Rot[1][0],Rot[1][1],Rot[1][2], Rot[2][0],Rot[2][1],Rot[2][2]]));
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const R = size*SR/2, c = size/2;
      for (const o of props) {
        const n = Rot.map(r => r[0]*o.v[0] + r[1]*o.v[1] + r[2]*o.v[2]);
        const len = Math.hypot(n[0], n[1]) || 1e-4;
        const h = o.h*R, w = h*(o.el.naturalWidth/(o.el.naturalHeight || 1));
        const sxp = c + n[0]*R*0.97, syp = c - n[1]*R*0.97;
        const ang = Math.atan2(n[0], n[1]);
        const fore = Math.max(0.16, Math.min(1, len));
        const wr = Math.round(w), hr = Math.round(h);
        if (o.wr !== wr || o.hr !== hr) { o.wr = wr; o.hr = hr; o.el.style.width = wr + 'px'; o.el.style.height = hr + 'px'; }
        const zi = n[2] < -0.05 ? 1 : 4;          // two layers only: behind / in front (no depth-sort churn)
        if (o.zi !== zi) { o.zi = zi; o.el.style.zIndex = zi; }
        const ease3 = t => t * t * (3 - 2 * t);
        const op = (Math.round((n[2] < -0.05 ? ease3(clamp(1 + (n[2] + 0.05) * 2.6, 0, 1)) : ease3(clamp((0.97 - n[2]) / 0.45, 0, 1))) * 40) / 40).toFixed(3);   // wider, eased fades in 1/40 steps: no flicker at the rim or face-on
        if (o.op !== op) { o.op = op; o.el.style.opacity = op; }
        o.el.style.transform = `translate3d(${(sxp - wr/2).toFixed(1)}px, ${(syp - hr).toFixed(1)}px, 0) rotate(${ang.toFixed(3)}rad) scale(${o.m}, ${fore.toFixed(3)})`;
      }
    };
    return api;
  })();

  const memo = new WeakMap();
  const put = (el, prop, val) => { let m = memo.get(el); if (!m) memo.set(el, (m = {})); if (m[prop] !== val) { m[prop] = val; el.style[prop] = val; } };
  let cur = null;
  function frame(now) {
    if (P.length > 1 && !document.hidden) {
      const { i, t } = state();
      const [x, y] = bez(seg[i], t);
      const arc = Math.sin(t * Math.PI);
      const g = { x, y: y - arc * 0.05 * vh, s: lerp(S[i][0], S[i + 1][0], t) * (1 + arc * .1) * sc, p: i + t, tilt: lerp(S[i][1], S[i + 1][1], t) };
      if (!cur) cur = { ...g };
      const f = reduce ? 1 : .14;
      for (const k in g) cur[k] = lerp(cur[k], g[k], f);
      const bob = reduce ? 0 : Math.sin(now / 850) * cur.s * .022, sway = reduce ? 0 : Math.sin(now / 1300) * 2.5;
      const s = cur.s, cx = cur.x, cy = cur.y;
      // Element + canvas stay at ONE fixed size (a big one while the hero animates, a mid one for the rest of the page);
      // every size change is a CSS transform scale only: no layout, no canvas resize, no re-sampling -> no flicker.
      const useBig = G.ok && atTop() && (hp < 0.999 || hpT === 0);
      const NB = Math.round(Math.max(...S.slice(1).map((v) => v[0])) * sc * 1.12);   // one fixed box for the whole journey after the hero
      const box = useBig ? Math.round(S[0][0] * sc) : NB, k = Math.min(s / box, 1.001);
      const bw = Math.round(box);
      if (globe._bw !== bw) { globe._bw = bw; globe.style.width = globe.style.height = bw + 'px'; }
      if (G.ok) { put(globe, 'transform', `translate3d(${(cx - bw / 2).toFixed(1)}px, ${(cy - bw / 2 + bob).toFixed(1)}px, 0) scale(${k.toFixed(4)})`); G.draw(cur.p, cur.tilt, now, bw); }
      else { globe.style.width = globe.style.height = s + 'px'; globe.style.transform = `translate3d(${cx - s / 2}px, ${cy - s / 2 + bob}px, 0) rotate(${cur.tilt + (reduce ? 0 : cur.p * 360) + sway}deg)`; }
      const sw = s * .6;
      put(shadow, 'width', Math.round(sw) + 'px'); put(shadow, 'height', Math.round(sw * .16) + 'px');
      shadow.style.transform = `translate3d(${cx - sw / 2}px, ${cy + s * (G.ok ? .36 : .47)}px, 0) scale(${1 - arc * .4})`;
      put(shadow, 'opacity', (.7 - arc * .5).toFixed(2));
      put(hint, 'opacity', scrollY > 40 ? '0' : '1');
      hp += (hpT - hp) * (reduce ? 1 : 0.07);
      if (Math.abs(hpT - hp) < 0.001) hp = hpT;
      const hv = atTop() ? hp : 1;
      if (heroWord) { const w = 1 - clamp(hv / 0.6, 0, 1); put(heroWord, 'opacity', w.toFixed(2)); put(heroWord, 'transform', `scale(${(0.94 + 0.06 * w).toFixed(3)})`); }
      if (heroCopy) { const q = clamp((hv - 0.35) / 0.55, 0, 1); put(heroCopy, 'opacity', q.toFixed(2)); put(heroCopy, 'pointerEvents', q > 0.6 ? 'auto' : 'none'); heroCopy.inert = q < 0.1; /* hidden text can't be tabbed to */ put(heroCopy, 'transform', `translateY(${((1 - q) * 30).toFixed(1)}px)`); }
    }
    requestAnimationFrame(frame);
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 100); });
  addEventListener('load', measure);
  window.addEventListener('globe:remeasure', measure);
  measure();
  requestAnimationFrame(frame);
})();
