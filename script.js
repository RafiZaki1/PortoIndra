/* =========================================================
   LANDING: judul PORTOFOLIO dengan wave huruf (tetap di tempat)
   RODA KARTU: section tersendiri di bawah landing, animasi otomatis
     Fase B 0–1.4s : kartu naik dari bawah & berputar ke posisi utama
     Fase C 1.4–2.5s: roda diam, kartu foto Indra di tengah
     Fase D 2.5s–  : auto-rotate, tiap kartu gerak 0.8s + jeda 1.5s (2.3s)
   Tidak ada kontrol scroll/wheel: roda mulai sendiri saat section masuk layar.
   ========================================================= */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- landing: pecah huruf untuk wave ---------- */
document.querySelectorAll('.hero-title .word').forEach((el) => {
  el.innerHTML = [...'PORTOFOLIO']
    .map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`)
    .join('');
});

/* ---------- roda kartu ---------- */
const fan = document.querySelector('.fan');
const ring = fan.querySelector('.ring');
const ringLine = ring.querySelector('circle');
const ringPath = ring.querySelector('#circ');
const ringText = ring.querySelector('textPath');
const meEl = fan.querySelector('.dial-me');

// index 0 = kartu home (foto Indra) di tengah
// kiri→kanan: dark(-2), red(-1), photo(0), light(+1), figma(+2)
const byClass = (c) => fan.querySelector(`.card.${c}`);
const cards = [byClass('c-photo'), byClass('c-light'), byClass('c-figma'), byClass('c-dark'), byClass('c-red')];
const N = cards.length;

const rad = (deg) => (deg * Math.PI) / 180;
const wrap = (x) => {
  let d = ((x % N) + N) % N;
  if (d >= N / 2) d -= N;
  return d;
};

let W = 0, H = 0, cx = 0, cy = 0, ringR = 0, cardW = 0, cardH = 0, cardR = 0, step = 14;

const wheel = { rotation: 0, spread: 2.6 };     // satu state untuk semua posisi
const intro = cards.map(() => ({ k: 0 }));       // 0..1, kartu naik dari bawah
const fx = { ringOpacity: 0, meOpacity: 0 };

function measure() {
  H = fan.clientHeight;
  W = fan.clientWidth;
  cx = W / 2;
  cy = 1.09 * H;
  ringR = 0.55 * H;
  cardH = Math.min(440, Math.max(240, 0.46 * H));
  cardW = cardH * 0.72;
  cardR = ringR + cardH / 2 + 0.02 * H;
  step = W < 760 ? 18 : 14;

  const D = 2 * ringR;
  const c = ringR;
  ring.setAttribute('width', D);
  ring.setAttribute('height', D);
  ring.setAttribute('viewBox', `0 0 ${D} ${D}`);
  ring.style.left = `${cx - ringR}px`;
  ring.style.top = `${cy - ringR}px`;
  ring.style.fontSize = `${0.018 * H}px`;

  ringLine.setAttribute('cx', c);
  ringLine.setAttribute('cy', c);
  ringLine.setAttribute('r', ringR);
  ringPath.setAttribute(
    'd',
    `M${c},${c - ringR} a${ringR},${ringR} 0 1,1 0,${2 * ringR} a${ringR},${ringR} 0 1,1 0,${-2 * ringR}`
  );
  ringText.setAttribute('textLength', (2 * Math.PI * ringR).toFixed(1));
  ringText.setAttribute('lengthAdjust', 'spacing');

  meEl.style.left = `${cx}px`;
  meEl.style.top = `${cy - ringR + 14}px`;
}

function layoutWheel() {
  cards.forEach((el, i) => {
    const k = intro[i].k;
    const th = wrap(i - wheel.rotation) * step * wheel.spread;
    const a = rad(th);
    const x = cx + cardR * Math.sin(a);
    const y = cy - cardR * Math.cos(a) + (1 - k) * H * 0.6;
    const s = Math.max(0.82, 1 - (0.06 * Math.abs(th)) / step);

    el.style.width = `${cardW}px`;
    el.style.height = `${cardH}px`;
    el.style.transform =
      `translate(${x - cardW / 2}px, ${y - cardH / 2}px) rotate(${th}deg) scale(${s})`;
    el.style.zIndex = Math.round(100 - Math.abs(th));
    el.style.opacity = k > 0 && Math.abs(th) <= 45 ? k : 0;
  });

  ring.style.transform = `rotate(${-wheel.rotation * step * 0.6}deg)`;
  ring.style.opacity = fx.ringOpacity;
  meEl.style.opacity = fx.meOpacity;
}

gsap.ticker.add(() => layoutWheel());

/* ---------- timeline roda (dibangun sekali, diputar saat section terlihat) ---------- */
let wheelTl = null;

if (reduce) {
  wheel.spread = 1;
  intro.forEach((o) => (o.k = 1));
  fx.ringOpacity = 1;
  fx.meOpacity = 1;
} else {
  wheelTl = gsap.timeline({ paused: true });

  // Fase B
  intro.forEach((o, i) => {
    wheelTl.to(o, { k: 1, duration: 1.2, ease: 'power4.out' }, i * 0.08);
  });
  wheelTl.to(wheel, { spread: 1, duration: 1.4, ease: 'power4.out' }, 0);
  wheelTl.to(fx, { ringOpacity: 1, duration: 0.8, ease: 'power2.out' }, 1.0);
  wheelTl.to(fx, { meOpacity: 1, duration: 0.6, ease: 'power2.out' }, 1.4);

  // Fase D (mulai 2.5s): auto-rotate
  // Satu putaran penuh = N langkah (kartu foto Indra kembali ke tengah), lalu jeda singkat di kartu itu.
  const loop = gsap.timeline({ repeat: -1 });
  for (let s = 0; s < N; s++) {
    loop.to(wheel, { rotation: '-=1', duration: 0.7, ease: 'power1.inOut' });
  }
  loop.to({}, { duration: 2 });
  wheelTl.add(loop, 2.5);
}

/* roda mulai sekali saat section pertama kali terlihat; setelahnya pause saat tidak terlihat */
if (wheelTl) {
  let started = false;
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        started = true;
        wheelTl.play();
      } else if (started) {
        wheelTl.pause();
      }
    },
    { threshold: 0.35 }
  ).observe(fan);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) wheelTl.pause();
    else if (started && fan.getBoundingClientRect().top < innerHeight && fan.getBoundingClientRect().bottom > 0) wheelTl.play();
  });
}

new ResizeObserver(measure).observe(fan);
measure();

/* ---------- reveal bagian bawah saat masuk layar ---------- */
document.querySelectorAll('.sec > *, .contact > *').forEach((el) => el.classList.add('rv'));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.rv').forEach((el) => io.observe(el));
