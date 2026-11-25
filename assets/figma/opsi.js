// Scale the 402x874 design frame to fit any phone screen, drop petals, allow replay.
(function(){
  const stage = document.querySelector('.stage');
  // Fill the whole screen like index.html: scale by width (capped so short phones still fit),
  // then pin each decoration to its own corner via data-anchor (t/m/b + l/c/r).
  function fit(){
    let W = innerWidth, H = innerHeight, cx = innerWidth / 2, cy = innerHeight / 2;
    // dual-screen devices (Surface Duo, Galaxy Fold in flex mode): use one screen segment, not across the hinge
    const segs = (window.viewport && window.viewport.segments) || (window.visualViewport && window.visualViewport.segments);
    if (segs && segs.length === 2) {
      const g = segs[0];
      W = g.width; H = g.height; cx = g.x + g.width / 2; cy = g.y + g.height / 2;
    }
    // touch devices (phones, foldables, tablets) fill the whole screen; mouse/desktop gets a phone-width column
    const touch = matchMedia('(pointer: coarse)').matches;
    if (!touch) W = Math.min(W, 430, Math.round(H * 0.6));
    document.body.classList.toggle('desk', innerWidth > W && !touch);
    const s = Math.min(W / 402, H / (window.FIT_H || 760));
    const sw = W / s, sh = H / s;
    stage.style.width = sw + 'px';
    stage.style.height = sh + 'px';
    stage.style.transform = 'translate(' + (cx - innerWidth / 2) + 'px,' + (cy - innerHeight / 2) + 'px) scale(' + s + ')';
    const ex = sw - 402, ey = sh - 874;
    stage.querySelectorAll('[data-anchor]').forEach(el => {
      const a = el.dataset.anchor;
      let dx = a.includes('r') ? ex : a.includes('c') ? ex / 2 : 0;
      const dy = a.includes('b') ? ey : a.includes('m') ? ey / 2 : 0;
      if (el.dataset.fullw !== undefined) {           // stretch strips (waves, clouds) across wide screens
        if (!el.dataset.w0) { el.dataset.w0 = parseFloat(el.style.width); el.dataset.l0 = parseFloat(el.style.left); }
        const w = Math.max(+el.dataset.w0, sw + 120);
        el.style.width = w + 'px'; el.style.left = ((sw - w) / 2) + 'px'; dx = 0;
      }
      el.style.translate = dx + 'px ' + dy + 'px';
    });
    declutter(sw, sh);
  }

  // Keep every text line clear of the decorations (the guest-name box excepted):
  // try nudging the content up/down, then shrinking it, then pushing decorations outward.
  function declutter(sw, sh){
    const content = stage.querySelector('.content');
    if (!content) return;
    content.style.scale = ''; content.style.transformOrigin = '50% 0';
    const tr = s => (s || '0px 0px').split(' ').map(parseFloat).concat([0, 0]);
    const [, cdy] = tr(content.style.translate);
    const decos = [...stage.querySelectorAll('[data-anchor]')].filter(el => el !== content).map(el => {
      const [dx, dy] = tr(el.style.translate);
      const w = el.offsetWidth, h = el.offsetHeight, ix = w * 0.12, iy = h * 0.12;   // images have transparent margins
      return { el, dx, dy, push: 0, x0: el.offsetLeft + dx + ix, y0: el.offsetTop + dy + iy, x1: el.offsetLeft + dx + w - ix, y1: el.offsetTop + dy + h - iy };
    });
    const texts = [...content.querySelectorAll('p, .vr')].filter(p => !p.closest('.yth') && !p.closest('.seal'));
    const cw = content.offsetWidth, cx = content.offsetLeft, ctop = content.offsetTop;
    const local = texts.map(p => {
      let x = 0, y = 0, n = p;
      while (n && n !== content) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y, w: p.offsetWidth, h: p.offsetHeight };
    });
    const pad = 6;
    const rects = (k, shift) => local.map(r => ({
      x0: cx + (r.x - cw / 2) * k - pad, x1: cx + (r.x + r.w - cw / 2) * k + pad,
      y0: ctop + cdy + shift + r.y * k - pad, y1: ctop + cdy + shift + (r.y + r.h) * k + pad }));
    const hits = (rs) => {
      const bad = new Set();
      rs.forEach(r => {
        if (r.x0 < 0 || r.x1 > sw || r.y0 < 0 || r.y1 > sh) bad.add('edge');
        decos.forEach(d => { const o = d.push; if (r.x0 < d.x1 + o && r.x1 > d.x0 + o && r.y0 < d.y1 && r.y1 > d.y0) bad.add(d); });
      });
      return bad;
    };
    let best = null;
    for (let k = 1; k >= 0.62 && !best; k -= 0.02)
      for (const shift of [0, -6, 6, -12, 12, -20, 20, -30, 30, -42, 42, -56, 56])
        if (!hits(rects(k, shift)).size) { best = { k, shift }; break; }
    if (!best) {                                   // still crowded: slide offending decorations toward their edge
      best = { k: 0.62, shift: 0 };
      for (let i = 0; i < 40; i++) {
        const bad = hits(rects(best.k, 0)); if (!bad.size) break;
        bad.forEach(d => { if (d !== 'edge') d.push += ((d.x0 + d.x1) / 2 < sw / 2 ? -6 : 6); });
      }
      decos.forEach(d => { if (d.push) d.el.style.translate = (d.dx + d.push) + 'px ' + d.dy + 'px'; });
    }
    content.style.scale = best.k;
    content.style.translate = '0px ' + (cdy + best.shift) + 'px';
    content.dataset.fit = best.k.toFixed(2) + ' ' + best.shift + ' ' + decos.map(d => d.push).join(',');
  }
  fit(); addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);

  // personalised "Kepada Yth." line from ?to=Nama (pages with their own cover, like opsi-4, already handle it)
  const to = new URLSearchParams(location.search).get('to');
  const content = stage.querySelector('.content');
  if (content) {
    const y = document.createElement('div');
    y.className = 'yth a';
    y.innerHTML = '<span>KEPADA YTH. BAPAK/IBU/SAUDARA/I</span><b></b>';
    y.querySelector('b').textContent = to || 'Nama Tamu';
    y.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin-bottom:10px;white-space:normal;max-width:300px;' +
      'padding:6px 18px;border-radius:14px;background:color-mix(in srgb, var(--bg) 88%, transparent);position:relative;z-index:6';
    content.style.zIndex = 6;
    y.firstChild.style.cssText = "font:10px 'Cinzel',serif;letter-spacing:.2em;opacity:.85";
    y.lastChild.style.cssText = "font:700 32px/1.05 'Tangerine',cursive;margin-top:2px";
    content.prepend(y);
    content.style.top = 'calc(' + getComputedStyle(content).top + ' - 52px)';
    fit();
  }

  // stagger content items
  stage.querySelectorAll('.content > .a, .content > .pop').forEach((el, i) => {
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (1.2 + i * 0.22) + 's');
  });

  function petals(n){
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      p.style.left = Math.random() * 402 + 'px';
      p.style.setProperty('--x', (Math.random() * 120 - 60) + 'px');
      p.style.animationDuration = (6 + Math.random() * 6) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.transform = 'scale(' + (0.6 + Math.random() * 0.8) + ')';
      p.addEventListener('animationend', () => p.remove());
      stage.appendChild(p);
    }
  }
  setTimeout(() => petals(24), 2500);
  setInterval(() => petals(6), 8000);

  const btn = document.querySelector('.replay');
  if (btn) btn.addEventListener('click', () => location.reload());
})();
