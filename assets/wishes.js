// Guest wishes widget: floating "Ucapan" button -> bottom sheet with form + list.
// Uses /api/wishes on Vercel; falls back to this browser's localStorage when the API is unavailable
// (e.g. opening the file locally), so the page always works.
(function () {
  const css = `
  .wz-btn{position:fixed;right:14px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:60;display:flex;align-items:center;gap:6px;
    padding:10px 14px;border-radius:24px;border:1px solid #e9b45a;background:#7a0a10;color:#f6e3bf;font:600 11px 'Cinzel',serif;letter-spacing:.15em;
    box-shadow:0 6px 16px rgba(30,0,0,.45);cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .6s,transform .6s}
  .wz-btn.show{opacity:1;transform:none}
  .wz-btn svg{width:16px;height:16px}
  .wz-ov{position:fixed;inset:0;z-index:70;background:rgba(20,0,0,.55);opacity:0;pointer-events:none;transition:opacity .3s}
  .wz-ov.open{opacity:1;pointer-events:auto}
  .wz-sh{position:fixed;left:0;right:0;bottom:0;z-index:71;max-height:82svh;display:flex;flex-direction:column;
    background:#fbf3e4;color:#5a0a10;border-radius:20px 20px 0 0;border-top:3px solid #e9b45a;
    transform:translateY(105%);transition:transform .4s cubic-bezier(.2,.8,.2,1);padding:0 16px calc(16px + env(safe-area-inset-bottom))}
  .wz-sh.open{transform:none}
  .wz-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 0 8px}
  .wz-hd b{font:26px 'Pinyon Script',cursive;color:#9e1b1b}
  .wz-x{border:0;background:none;font-size:26px;line-height:1;color:#9e1b1b;cursor:pointer;padding:4px 8px}
  .wz-f{display:grid;gap:8px}
  .wz-f input,.wz-f textarea,.wz-f select{width:100%;font:15px 'Cormorant Garamond',Georgia,serif;color:#3a0508;background:#fff;
    border:1px solid #d9b87a;border-radius:10px;padding:10px 12px;outline:none}
  .wz-f input:focus,.wz-f textarea:focus,.wz-f select:focus{border-color:#9e1b1b;box-shadow:0 0 0 2px rgba(158,27,27,.15)}
  .wz-f textarea{min-height:72px;resize:vertical}
  .wz-f button{border:0;border-radius:24px;padding:11px;background:#9e1b1b;color:#fbecd2;font:600 12px 'Cinzel',serif;letter-spacing:.2em;cursor:pointer}
  .wz-f button:disabled{opacity:.6}
  .wz-msg{font:13px Georgia,serif;min-height:18px;color:#9e1b1b}
  .wz-ls{overflow-y:auto;-webkit-overflow-scrolling:touch;margin-top:10px;border-top:1px solid #ead6ad;padding-top:6px}
  .wz-it{padding:10px 2px;border-bottom:1px dashed #ead6ad}
  .wz-it .n{font:600 12px 'Cinzel',serif;letter-spacing:.08em;color:#9e1b1b}
  .wz-it .t{font:11px Georgia,serif;color:#a0815a;margin-left:6px}
  .wz-it .a{display:inline-block;margin-left:6px;font:10px Georgia,serif;padding:1px 7px;border-radius:10px;background:#f3e2c0;color:#7a4a10}
  .wz-it p{font:15px/1.45 'Cormorant Garamond',Georgia,serif;color:#3a0508;margin-top:3px;white-space:pre-wrap;word-break:break-word}
  .wz-empty{font:14px Georgia,serif;color:#a0815a;text-align:center;padding:18px 0}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const ATT = { hadir: 'Hadir', tidak: 'Tidak hadir', ragu: 'Masih ragu' };
  const guest = new URLSearchParams(location.search).get('to') || '';
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button class="wz-btn" type="button" aria-haspopup="dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H8l-4 4z"/></svg>UCAPAN</button>
    <div class="wz-ov"></div>
    <section class="wz-sh" role="dialog" aria-modal="true" aria-label="Ucapan & doa">
      <div class="wz-hd"><b>Ucapan &amp; Doa</b><button class="wz-x" type="button" aria-label="Tutup">&times;</button></div>
      <form class="wz-f">
        <input name="name" maxlength="60" placeholder="Nama" required autocomplete="name">
        <select name="attend" aria-label="Konfirmasi kehadiran">
          <option value="">Konfirmasi kehadiran</option><option value="hadir">Hadir</option>
          <option value="tidak">Tidak hadir</option><option value="ragu">Masih ragu</option></select>
        <textarea name="message" maxlength="500" placeholder="Tulis ucapan &amp; doa untuk kedua mempelai" required></textarea>
        <button type="submit">KIRIM UCAPAN</button>
        <div class="wz-msg" aria-live="polite"></div>
      </form>
      <div class="wz-ls"></div>
    </section>`;
  document.body.appendChild(wrap);
  const $ = s => wrap.querySelector(s);
  const btn = $('.wz-btn'), ov = $('.wz-ov'), sh = $('.wz-sh'), form = $('.wz-f'), list = $('.wz-ls'), msg = $('.wz-msg');
  form.name.value = guest;

  const LS = 'sangjit-wishes-local';
  const local = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } };
  let useApi = true;

  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'baru saja'; if (m < 60) return m + ' menit lalu';
    const h = Math.round(m / 60); if (h < 24) return h + ' jam lalu';
    return Math.round(h / 24) + ' hari lalu';
  }
  function render(rows) {
    list.textContent = '';
    if (!rows.length) { list.innerHTML = '<div class="wz-empty">Belum ada ucapan. Jadilah yang pertama.</div>'; return; }
    rows.forEach(r => {
      const it = document.createElement('div'); it.className = 'wz-it';
      const n = document.createElement('span'); n.className = 'n'; n.textContent = r.name;
      const t = document.createElement('span'); t.className = 't'; t.textContent = ago(r.at);
      it.append(n);
      if (ATT[r.attend]) { const a = document.createElement('span'); a.className = 'a'; a.textContent = ATT[r.attend]; it.append(a); }
      it.append(t);
      const p = document.createElement('p'); p.textContent = r.message; it.append(p);
      list.append(it);
    });
  }
  async function load() {
    try {
      const r = await fetch('/api/wishes', { cache: 'no-store' });
      if (!r.ok) throw 0;
      render(await r.json());
    } catch (e) { useApi = false; render(local()); }
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const item = { name: form.name.value.trim(), attend: form.attend.value, message: form.message.value.trim() };
    if (!item.name || !item.message) { msg.textContent = 'Nama dan ucapan wajib diisi.'; return; }
    const b = form.querySelector('button'); b.disabled = true; msg.textContent = 'Mengirim...';
    try {
      let sent = false;
      if (useApi) {
        try {
          const r = await fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
          if (r.ok) sent = true; else if (r.status === 400) throw 0; else useApi = false;
        } catch (x) { if (x === 0) throw 0; useApi = false; }
      }
      if (!sent) {
        const rows = local(); rows.unshift({ ...item, at: Date.now() }); localStorage.setItem(LS, JSON.stringify(rows.slice(0, 200)));
      }
      form.message.value = ''; msg.textContent = 'Terima kasih atas ucapannya!';
      await load();
    } catch (err) { msg.textContent = 'Gagal mengirim, coba lagi.'; }
    b.disabled = false;
  });
  function open() { ov.classList.add('open'); sh.classList.add('open'); load(); }
  function close() { ov.classList.remove('open'); sh.classList.remove('open'); }
  btn.addEventListener('click', open); ov.addEventListener('click', close); $('.wz-x').addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // show the button once the invitation is open (after the cover/fans), or after a short delay on other pages
  function reveal() { btn.classList.add('show'); }
  const cover = document.getElementById('curtain') || document.getElementById('envelope') || document.querySelector('.envelope');
  if (cover) { cover.addEventListener('click', () => setTimeout(reveal, 2500)); if (location.hash === '#open') setTimeout(reveal, 2500); }
  else setTimeout(reveal, 3000);
})();
