(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('js');

  // Hero: pecah per huruf
  let n = 0;
  $$('[data-split]').forEach((el) => {
    const t = el.textContent; el.textContent = '';
    [...t].forEach((c) => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; s.style.setProperty('--d', n++);
      s.setAttribute('aria-hidden', 'true'); el.appendChild(s);
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('go')));

  // Hero: bobot dan lebar huruf mengikuti kursor, gelombang pelan saat diam
  const chs = $$('.hero .ch'), hero = $('.hero');
  const lvl = chs.map(() => 0);
  let px = 0, py = 0, last = -1e5, heroOn = true;
  if (rm) chs.forEach((c) => { c.style.fontVariationSettings = '"wght" 600,"wdth" 90'; });
  else {
    addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; last = performance.now(); }, { passive: true });
    new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
    const tick = (now) => {
      if (heroOn) {
        const live = now - last < 2500;
        chs.forEach((c, i) => {
          let tg;
          if (live) {
            const r = c.getBoundingClientRect();
            tg = clamp(1 - Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) / 260);
          } else tg = (Math.sin(now / 650 + i * 0.55) + 1) / 2 * 0.55;
          lvl[i] += (tg - lvl[i]) * 0.12;
          c.style.fontVariationSettings = `"wght" ${(280 + lvl[i] * 560) | 0},"wdth" ${(78 + lvl[i] * 22) | 0}`;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Kalimat pembuka: kata menyala mengikuti scroll
  const scrub = $('.scrub');
  let words = [];
  if (scrub) {
    words = scrub.textContent.trim().split(/\s+/).map((w) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; return s;
    });
    scrub.textContent = '';
    words.forEach((s, i) => { scrub.append(s, i < words.length - 1 ? ' ' : ''); });
  }

  // Folder proyek: scroll vertikal menggerakkan kartu secara horizontal, keluar dari folder dengan efek kipas
  const sc = $('.showcase'), track = $('.track'), cards = $$('.card');
  const cnt = $('.cnt'), dots = $$('.dots button');
  const fxMq = matchMedia('(min-width:900px) and (min-height:560px)');
  let cur = 0, tgt = 0, hideX = 0, running = false;
  const measure = () => { hideX = $('.stage').clientWidth - $('.fold-front').offsetWidth - cards[0].offsetLeft + 12; };

  const place = () => {
    cards.forEach((c, i) => {
      const d = i - cur;
      let x = 0, y = 0, a = 0, s = 1, b = 1, o = 1;
      if (d > 0) {             // masih di dalam folder, meluncur keluar dan menimpa tumpukan
        const k = Math.min(d, 1);
        x = hideX * k; a = k * 8; o = d > 1.05 ? 0 : 1;
      } else if (d < 0) {      // tetap di tempat, tertimpa kartu baru seperti tumpukan kertas
        const q = Math.min(-d, 4);
        y = -q * 9; s = 1 - q * 0.025; b = 1 - q * 0.08;
        a = (i % 2 ? 1 : -1) * Math.min(q, 2) * 0.8;
      }
      c.style.transform = `translate3d(${x}px,${y}px,0) rotate(${a}deg) scale(${s})`;
      c.style.opacity = o;
      c.style.filter = b < 1 ? `brightness(${b})` : '';
      c.style.zIndex = i;
      c.inert = Math.abs(d) > 0.5;
    });
    const k = Math.round(cur);
    cnt.textContent = `0${k + 1} / 0${cards.length}`;
    dots.forEach((b, i) => b.setAttribute('aria-current', i === k));
  };
  const loop = () => {
    cur += (tgt - cur) * 0.14;
    if (Math.abs(tgt - cur) < 0.002) cur = tgt;
    place();
    if (cur !== tgt) requestAnimationFrame(loop); else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  // Kecilkan teks di dalam kartu bila isinya lebih panjang dari ruang yang tersedia
  const fit = () => cards.forEach((c) => {
    const ct = $('.ct', c);
    let f = 1;
    ct.style.setProperty('--fit', f);
    while (ct.scrollHeight > ct.clientHeight + 1 && f > 0.55) { f -= 0.04; ct.style.setProperty('--fit', f.toFixed(2)); }
  });
  const setFx = () => {
    const on = fxMq.matches && !rm;
    sc.classList.toggle('fx', on);
    if (on) { measure(); fit(); place(); }
    else cards.forEach((c) => { c.style.cssText = ''; c.inert = false; $('.ct', c).style.removeProperty('--fit'); });
    sched();
  };
  dots.forEach((b, i) => b.addEventListener('click', () => {
    const total = track.offsetHeight - innerHeight;
    scrollTo({ top: track.getBoundingClientRect().top + scrollY + total * i / (cards.length - 1), behavior: rm ? 'auto' : 'smooth' });
  }));

  // Pembaruan saat scroll
  const bar = $('#bar');
  const update = () => {
    const vh = innerHeight;
    bar.style.transform = `scaleX(${clamp(scrollY / (document.body.scrollHeight - vh))})`;
    if (scrub) {
      const r = scrub.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      words.forEach((w, i) => { w.style.opacity = rm ? 1 : 0.18 + 0.82 * clamp(p * words.length * 1.15 - i); });
    }
    if (sc.classList.contains('fx')) {
      const total = track.offsetHeight - vh;
      tgt = clamp(-track.getBoundingClientRect().top / total) * (cards.length - 1);
      kick();
    }
  };
  let queued = false;
  function sched() { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }
  addEventListener('scroll', sched, { passive: true });
  addEventListener('resize', () => { if (sc.classList.contains('fx')) { measure(); fit(); } sched(); });
  fxMq.addEventListener('change', setFx);
  setFx(); update();
  if (document.fonts) document.fonts.ready.then(() => { if (sc.classList.contains('fx')) { measure(); fit(); } });

  // Akordeon
  $$('.acc-btn').forEach((b) => b.addEventListener('click', () => {
    const acc = b.closest('.acc'), open = !acc.classList.contains('open');
    $$('.acc.open', acc.parentElement).forEach((o) => { o.classList.remove('open'); $('.acc-btn', o).setAttribute('aria-expanded', 'false'); });
    acc.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
  }));

  // Email: tarikan magnetik dan salin
  const mail = $('.mail');
  if (mail && !rm) {
    mail.addEventListener('pointermove', (e) => {
      const r = mail.getBoundingClientRect();
      mail.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 16}px,${((e.clientY - r.top) / r.height - 0.5) * 10}px)`;
    });
    mail.addEventListener('pointerleave', () => { mail.style.transform = ''; });
  }
  const copy = $('#copy');
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText('novalnoval575@gmail.com'); copy.textContent = 'Email disalin'; }
      catch (_) { copy.textContent = 'Gagal, salin manual'; }
      setTimeout(() => { copy.textContent = 'Salin email'; }, 2000);
    });
  }
})();
