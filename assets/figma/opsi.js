// Scale the 402x874 design frame to fit any phone screen, drop petals, allow replay.
(function(){
  const stage = document.querySelector('.stage');
  // Fill the whole screen like index.html: scale by width (capped so short phones still fit),
  // then pin each decoration to its own corner via data-anchor (t/m/b + l/c/r).
  function fit(){
    const W = innerWidth, H = innerHeight;
    const s = Math.min(W / 402, H / (window.FIT_H || 760));
    const sw = W / s, sh = H / s;
    stage.style.width = sw + 'px';
    stage.style.height = sh + 'px';
    stage.style.transform = 'scale(' + s + ')';
    const ex = sw - 402, ey = sh - 874;
    stage.querySelectorAll('[data-anchor]').forEach(el => {
      const a = el.dataset.anchor;
      const dx = a.includes('r') ? ex : a.includes('c') ? ex / 2 : 0;
      const dy = a.includes('b') ? ey : a.includes('m') ? ey / 2 : 0;
      el.style.translate = dx + 'px ' + dy + 'px';
    });
  }
  fit(); addEventListener('resize', fit);

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
