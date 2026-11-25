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
  }
  fit(); addEventListener('resize', fit);

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
