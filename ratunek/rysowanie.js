'use strict';

// =====================================================
//   RYSOWANIE – pixel art
// =====================================================
//  Świat rysujemy na małym, ukrytym płótnie (16 pikseli na kratkę),
//  a potem powiększamy je bez rozmazywania – dlatego wszystko jest
//  z dużych, wyraźnych pikseli. Napisy i menu rysujemy już na ekranie.

// ---------- Kolory krain (śmiało zmieniaj!) ----------
const SWIATY = {
  laka: {
    niebo: ['#4fa8f0', '#c8eeff'], ziemia: '#a0662f', kropki: '#7a4a20', wierzch: '#4fc25a', wierzch2: '#8ee587',
    blok: '#a7b0ba', blok2: '#d0d6dc', blok3: '#4e5660', cegla: '#d0603f', cegla2: '#7e2f1e',
    polka: '#b77c45', polka2: '#6e4522', woda: 'rgba(58,150,232,0.85)', woda2: '#c4ecff',
    gory: '#9bd6a2', gory2: '#6cbd7a', glutek: '#5ad15a',
    muzyka: 'wesola', instrument: 'square', tempo: 150,
  },
  las: {
    niebo: ['#2f7a5b', '#a6dcb4'], ziemia: '#6b4a2b', kropki: '#4a3019', wierzch: '#2e9a4a', wierzch2: '#6fd27e',
    blok: '#8a5a33', blok2: '#b07a4a', blok3: '#3e2612', cegla: '#b5523a', cegla2: '#6a2a1c',
    polka: '#7a5230', polka2: '#46301a', woda: 'rgba(45,140,170,0.85)', woda2: '#b0eaf0',
    gory: '#3a8660', gory2: '#255a40', glutek: '#a4e05d',
    muzyka: 'wesola', instrument: 'triangle', tempo: 132,
  },
  pustynia: {
    niebo: ['#ff9f43', '#ffe6a8'], ziemia: '#d9a55a', kropki: '#b88040', wierzch: '#f2cf86', wierzch2: '#fff0c4',
    blok: '#d8a868', blok2: '#f6d49c', blok3: '#8a5a2a', cegla: '#c9773f', cegla2: '#7a4222',
    polka: '#a8743c', polka2: '#6e4a22', woda: 'rgba(40,180,200,0.85)', woda2: '#c0f6f6',
    gory: '#f2bd78', gory2: '#e0a058', glutek: '#e6c84a',
    muzyka: 'przygoda', instrument: 'square', tempo: 140,
  },
  lod: {
    niebo: ['#3d5fb8', '#cfe6ff'], ziemia: '#6f9fd0', kropki: '#93bde6', wierzch: '#f4fbff', wierzch2: '#ffffff',
    blok: '#9fd6f5', blok2: '#e8f8ff', blok3: '#3f80b8', cegla: '#86b8e0', cegla2: '#3f6e9e',
    polka: '#c6e9ff', polka2: '#6aa6d8', woda: 'rgba(30,90,170,0.88)', woda2: '#b8e0ff',
    gory: '#cfe0f5', gory2: '#a3c2e8', glutek: '#7fd6ff',
    muzyka: 'wesola', instrument: 'sine', tempo: 120,
  },
  wulkan: {
    niebo: ['#2a0a10', '#a8391c'], ziemia: '#4a302b', kropki: '#2e1c18', wierzch: '#6e4a40', wierzch2: '#9a6e60',
    blok: '#3d3436', blok2: '#665a5c', blok3: '#1a1416', cegla: '#7a3a2a', cegla2: '#3e1a12',
    polka: '#5a4440', polka2: '#2e201c', woda: 'rgba(60,160,190,0.85)', woda2: '#b8f4ff',
    gory: '#5a1e18', gory2: '#3a120e', glutek: '#ff8a5a',
    muzyka: 'przygoda', instrument: 'sawtooth', tempo: 155,
  },
  zamek: {
    niebo: ['#0b1026', '#33296e'], ziemia: '#5d5873', kropki: '#3e3a52', wierzch: '#8f8aa8', wierzch2: '#bcb7d4',
    blok: '#6e6988', blok2: '#9a95b4', blok3: '#34304a', cegla: '#8e4a3a', cegla2: '#4a2018',
    polka: '#7a7592', polka2: '#46425c', woda: 'rgba(40,70,140,0.88)', woda2: '#a0bcff',
    gory: '#262052', gory2: '#18143a', glutek: '#c08cff',
    muzyka: 'przygoda', instrument: 'square', tempo: 135,
  },
};

const L = {};          // rozmiary ekranu
const P = 16;          // ile pikseli ma jedna kratka na małym płótnie
const bufor = document.createElement('canvas');
const b = bufor.getContext('2d');
let kamPX = 0;         // kamera w pikselach małego płótna
let kamPY = 0;


// =====================================================
//   ROZMIARY EKRANU
// =====================================================
function ogranicz(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dopasujRozmiar() {
  const dpr = window.devicePixelRatio || 1;
  L.W = window.innerWidth;
  L.H = window.innerHeight;
  plotno.width = Math.round(L.W * dpr);
  plotno.height = Math.round(L.H * dpr);
  plotno.style.width = L.W + 'px';
  plotno.style.height = L.H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  L.hudH = L.H < 420 ? 46 : 58;
  L.fs = ogranicz(Math.min(L.W / 34, L.H / 30), 11, 20);
  L.R = ogranicz(Math.min(L.W, L.H) * 0.085, 30, 52);
  L.kontrolkiH = dotykowe ? L.R * 2.7 : 0;

  const wolne = L.H - L.hudH;
  let T = wolne / WIERSZE;
  if (T < 34) T = Math.min(34, wolne / 10);    // niski ekran: przybliżamy, kamera jeździ też w pionie
  T = Math.min(T, L.W / 13);                  // wąski ekran: widać co najmniej 13 kratek
  // Każdy piksel gry to całe piksele ekranu (wtedy obraz jest ostry).
  // Na telefonie ekran ma więcej pikseli niż pokazuje, dlatego liczymy w prawdziwych pikselach (dpr).
  let skalaEkranu = Math.max(1, Math.floor((T * dpr) / P + 0.25));
  while (skalaEkranu > 1 && L.W / ((skalaEkranu / dpr) * P) < 12.5) skalaEkranu--;
  L.skala = skalaEkranu / dpr;
  L.T = L.skala * P;
  L.kolumny = L.W / L.T;
  L.wiersze = wolne / L.T;
  if (L.wiersze >= WIERSZE) {
    const zapas = wolne - WIERSZE * L.T;
    const podPrzyciski = Math.min(zapas, L.kontrolkiH);
    L.swiatY = L.hudH + (zapas - podPrzyciski) / 2;
  } else {
    L.swiatY = L.hudH;
  }
  L.bw = Math.ceil(L.W / L.skala) + 1;
  L.bh = Math.ceil(L.H / L.skala) + 1;
  bufor.width = L.bw;
  bufor.height = L.bh;
  b.imageSmoothingEnabled = false;
  L.oy = Math.round(L.swiatY / L.skala);
  if (gracz) aktualizujKamere(0, true);
}

// Kratki -> piksele małego płótna
function bx(x) {
  return Math.round(x * P) - kamPX;
}

function by(y) {
  return L.oy + Math.round(y * P) - kamPY;
}

// Kratki -> piksele ekranu (dla napisów)
function sx(x) {
  return bx(x) * L.skala;
}

function sy(y) {
  return by(y) * L.skala;
}

// Zawsze ta sama „losowa” liczba dla tego samego n (od 0 do 1)
function losowe(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}


// =====================================================
//   KOLORY I OBRAZKI
// =====================================================
function rgbZ(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mieszaj(a, c, t) {
  const x = rgbZ(a);
  const y = rgbZ(c);
  const m = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function ciemniej(hex, f = 0.75) {
  return mieszaj(hex, '#000000', 1 - f);
}

function jasniej(hex, f = 0.3) {
  return mieszaj(hex, '#ffffff', f);
}

const pamiec = new Map();   // gotowe obrazki (żeby nie rysować ich od nowa co klatkę)

function nowePlotno(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function zrobObrazek(siatka, kolory) {
  const h = siatka.length;
  const w = siatka[0].length;
  const c = nowePlotno(w, h);
  const x = c.getContext('2d');
  for (let r = 0; r < h; r++) {
    for (let k = 0; k < w; k++) {
      const z = siatka[r][k];
      if (z === '.' || z === ' ' || !kolory[z]) continue;
      x.fillStyle = kolory[z];
      x.fillRect(k, r, 1, 1);
    }
  }
  return c;
}

function odbity(c) {
  const n = nowePlotno(c.width, c.height);
  const x = n.getContext('2d');
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return n;
}

// Obrazek z pamięci: { p: patrzy w prawo, l: patrzy w lewo }
function obraz(klucz, tworz) {
  let o = pamiec.get(klucz);
  if (!o) {
    const c = tworz();
    o = { p: c, l: odbity(c), w: c.width, h: c.height };
    pamiec.set(klucz, o);
  }
  return o;
}

function rysujObraz(o, x, y, wLewo = false) {
  b.drawImage(wLewo ? o.l : o.p, Math.round(x), Math.round(y));
}

function sprite(nazwa, siatka) {
  return obraz(`s|${nazwa}`, () => zrobObrazek(siatka, KOLORY_PIKSELI[nazwa]));
}

// ---------- proste kształty z pikseli ----------
function pProst(x, y, w, h, kolor) {
  b.fillStyle = kolor;
  b.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pKolo(cx, cy, r, kolor) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.max(0, Math.round(r));
  b.fillStyle = kolor;
  for (let dy = -r; dy <= r; dy++) {
    const h = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy + r * 0.6)));
    b.fillRect(cx - h, cy + dy, 2 * h + 1, 1);
  }
}

function pOkrag(cx, cy, r, kolor) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.max(1, Math.round(r));
  b.fillStyle = kolor;
  for (let dy = -r; dy <= r; dy++) {
    const h = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy + r * 0.6)));
    b.fillRect(cx - h, cy + dy, 1, 1);
    b.fillRect(cx + h, cy + dy, 1, 1);
  }
  for (let dx = -r; dx <= r; dx++) {
    const v = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx + r * 0.6)));
    b.fillRect(cx + dx, cy - v, 1, 1);
    b.fillRect(cx + dx, cy + v, 1, 1);
  }
}

// Trójkąt z czubkiem u góry
function pTrojkat(cx, gora, dol, polSzer, kolor) {
  b.fillStyle = kolor;
  const h = Math.max(1, dol - gora);
  for (let y = Math.round(gora); y <= Math.round(dol); y++) {
    const w = Math.round((polSzer * (y - gora)) / h);
    b.fillRect(Math.round(cx) - w, y, 2 * w + 1, 1);
  }
}

// Linia z pikseli
function pLinia(x1, y1, x2, y2, kolor, grubosc = 1) {
  const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  b.fillStyle = kolor;
  for (let i = 0; i <= n; i++) {
    b.fillRect(Math.round(x1 + ((x2 - x1) * i) / n), Math.round(y1 + ((y2 - y1) * i) / n), grubosc, grubosc);
  }
}


// =====================================================
//   BOHATEROWIE (z obrazków w piksele.js)
// =====================================================
function paletaBohatera(id) {
  const wy = BOHATEROWIE[id].wyglad;
  return {
    k: OBRYS, e: OBRYS, w: '#ffffff', r: '#b8404f', R: '#f7a6b0',
    h: wy.wlosy, H: ciemniej(wy.wlosy, 0.75), s: wy.skora, S: ciemniej(wy.skora, 0.86),
    t: wy.koszulka, T: ciemniej(wy.koszulka, 0.78), y: wy.znakKolor || '#ffd23f',
    u: wy.spodnica || wy.spodnie, l: wy.nogi || wy.spodnie, b: wy.buty, o: wy.kokarda || '#ffd23f',
  };
}

function zlozBohatera(id, poza, zamkniete) {
  const glowa = GLOWY[id] || GLOWY.seweryn;
  const cialo = CIALA[poza] || CIALA.stoi;
  const siatka = [];
  for (let r = 0; r < 22; r++) siatka.push(new Array(14).fill('.'));
  cialo.forEach((wiersz, i) => {
    for (let k = 0; k < 14; k++) if (wiersz[k] !== '.') siatka[8 + i][k] = wiersz[k];
  });
  glowa.forEach((wiersz, i) => {
    for (let k = 0; k < wiersz.length; k++) {
      let z = wiersz[k];
      if (z === '.') continue;
      if (zamkniete && z === 'e' && i === 6) z = 's';
      siatka[i][1 + k] = z;
    }
  });
  return zrobObrazek(siatka.map((r) => r.join('')), paletaBohatera(id));
}

function pozaBohatera(ruch, faza) {
  if (ruch === 'biegnie') return Math.floor(faza / 1.6) % 2 ? 'bieg2' : 'bieg1';
  if (ruch === 'skacze' || ruch === 'spada') return 'skok';
  if (ruch === 'cieszy') return 'cieszy';
  if (ruch === 'macha') return Math.floor(czas * 4) % 2 ? 'macha2' : 'macha1';
  return 'stoi';
}

function obrazBohatera(id, ruch, faza, przesuniecie = 0) {
  const poza = pozaBohatera(ruch, faza);
  const zamkniete = ruch === 'omdlaly' || (czas + przesuniecie) % 3.3 < 0.13;
  return obraz(`b|${id}|${poza}|${zamkniete ? 1 : 0}`, () => zlozBohatera(id, poza, zamkniete));
}

// Na małym płótnie: xs, ys = środek stóp
function postacNaBuforze(id, xs, ys, ruch, faza, kier, przesuniecie) {
  const o = obrazBohatera(id, ruch, faza, przesuniecie);
  rysujObraz(o, xs - 7, ys - 22, kier < 0);
}

// Na ekranie (menu): x, y = środek stóp, wysokosc = mniej więcej ile pikseli ma mieć postać
function postacNaEkranie(id, x, y, wysokosc, ruch, faza, kier, przesuniecie) {
  const k = Math.max(1, Math.round(wysokosc / 22));
  const o = obrazBohatera(id, ruch, faza, przesuniecie);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(kier < 0 ? o.l : o.p, Math.round(x - 7 * k), Math.round(y - 22 * k), 14 * k, 22 * k);
}

function ikonaNaEkranie(o, x, y, k) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(o.p, Math.round(x), Math.round(y), o.w * k, o.h * k);
}


// =====================================================
//   GOTOWE OBRAZKI (monety, przedmioty, wrogowie)
// =====================================================
function obrazMonety(f) {
  return obraz(`moneta|${f}`, () => {
    const szer = [8, 6, 3, 6][f];
    const c = nowePlotno(8, 10);
    const x = c.getContext('2d');
    for (let r = 0; r < 10; r++) {
      const t = (r - 4.5) / 5;
      const pol = Math.max(0.5, (szer / 2) * Math.sqrt(Math.max(0, 1 - t * t)) + 0.35);
      const x0 = Math.round(4 - pol);
      const x1 = Math.round(4 + pol);
      x.fillStyle = '#a86f00';
      x.fillRect(x0, r, x1 - x0, 1);
      if (r > 0 && r < 9 && x1 - x0 > 2) {
        x.fillStyle = '#ffd23f';
        x.fillRect(x0 + 1, r, x1 - x0 - 2, 1);
      }
    }
    if (szer > 3) {
      x.fillStyle = '#fff6c0';
      x.fillRect(3, 2, 1, 5);
    }
    return c;
  });
}

function rysujMonete(x, y, f) {
  rysujObraz(obrazMonety(f % 4), x - 4, y - 5);
}

function obrazGlutka(f) {
  const g = SWIATY[swiat].glutek;
  return obraz(`glutek|${swiat}|${f}`, () => zrobObrazek(GLUTEK[f], { k: OBRYS, g, G: ciemniej(g, 0.7), L: jasniej(g, 0.5), w: '#ffffff' }));
}

function obrazGburka(f, oszolomiony) {
  return obraz(`gburek|${f}|${oszolomiony ? 1 : 0}`, () => {
    const kolory = { ...KOLORY_PIKSELI.gburek };
    if (oszolomiony) kolory.e = '#ffffff';
    return zrobObrazek([...GBUREK, STOPY_GBURKA[f]], kolory);
  });
}


// =====================================================
//   KAFELKI (16 × 16 pikseli, osobne dla każdej krainy)
// =====================================================
function kafelek(nazwa, wariant, tworz) {
  return obraz(`k|${swiat}|${nazwa}|${wariant}`, () => {
    const c = nowePlotno(P, P);
    tworz(c.getContext('2d'), SWIATY[swiat]);
    return c;
  });
}

function kafelekZiemi(gora, wariant) {
  return kafelek(gora ? 'ziemiaG' : 'ziemia', wariant, (c, s) => {
    c.fillStyle = s.ziemia;
    c.fillRect(0, 0, P, P);
    if (swiat === 'zamek') {
      c.fillStyle = s.kropki;
      c.fillRect(0, 7, P, 1);
      c.fillRect(0, 15, P, 1);
      c.fillRect(wariant % 2 ? 4 : 11, 0, 1, 7);
      c.fillRect(wariant % 2 ? 12 : 3, 8, 1, 7);
      c.fillStyle = jasniej(s.ziemia, 0.15);
      c.fillRect(0, 0, P, 1);
      c.fillRect(0, 8, P, 1);
    } else {
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(losowe(i * 3.1 + wariant * 17) * 15);
        const y = Math.floor(losowe(i * 7.3 + wariant * 29) * 15);
        c.fillStyle = i % 3 ? s.kropki : jasniej(s.ziemia, 0.18);
        c.fillRect(x, y, i % 2 ? 2 : 1, 1);
      }
    }
    if (gora) {
      for (let x = 0; x < P; x++) {
        const d = 3 + (losowe(x * 1.7 + wariant) < 0.4 ? 1 : 0) + (losowe(x * 5.1 + wariant) < 0.15 ? 1 : 0);
        c.fillStyle = s.wierzch;
        c.fillRect(x, 0, 1, d);
        c.fillStyle = ciemniej(s.wierzch, 0.78);
        c.fillRect(x, d, 1, 1);
      }
      c.fillStyle = s.wierzch2;
      c.fillRect(0, 0, P, 1);
      if (swiat === 'lod') {
        c.fillStyle = '#dff3ff';
        c.fillRect(4 + wariant * 3, 5, 2, 2);
        c.fillRect(5 + wariant * 3, 7, 1, 2);
      }
    }
  });
}

function kafelekBloku() {
  return kafelek('blok', 0, (c, s) => {
    c.fillStyle = s.blok3;
    c.fillRect(0, 0, P, P);
    c.fillStyle = s.blok;
    c.fillRect(1, 1, 14, 14);
    c.fillStyle = s.blok2;
    c.fillRect(1, 1, 14, 2);
    c.fillRect(1, 1, 2, 14);
    c.fillStyle = ciemniej(s.blok, 0.8);
    c.fillRect(3, 13, 12, 2);
    c.fillRect(13, 3, 2, 12);
    if (swiat === 'las') {
      c.fillStyle = s.blok3;
      c.fillRect(6, 5, 4, 1);
      c.fillRect(5, 6, 1, 4);
      c.fillRect(10, 6, 1, 4);
      c.fillRect(6, 10, 4, 1);
      c.fillRect(7, 7, 2, 2);
    } else if (swiat === 'lod') {
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) c.fillRect(5 + i, 9 - i, 1, 1);
      c.fillRect(10, 4, 1, 1);
    } else {
      c.fillStyle = s.blok3;
      c.fillRect(4, 4, 1, 1);
      c.fillRect(11, 4, 1, 1);
      c.fillRect(4, 11, 1, 1);
      c.fillRect(11, 11, 1, 1);
    }
  });
}

function kafelekCegiel() {
  return kafelek('cegla', 0, (c, s) => {
    c.fillStyle = s.cegla2;
    c.fillRect(0, 0, P, P);
    for (let r = 0; r < 4; r++) {
      const y = r * 4;
      const o = r % 2 ? 4 : 0;
      for (let x = -o; x < P; x += 8) {
        const x0 = Math.max(0, x);
        const x1 = Math.min(P, x + 7);
        c.fillStyle = s.cegla;
        c.fillRect(x0, y, x1 - x0, 3);
        c.fillStyle = jasniej(s.cegla, 0.25);
        c.fillRect(x0, y, x1 - x0, 1);
      }
    }
  });
}

function kafelekPrezentu(serce) {
  return obraz(`prezent|${serce ? 1 : 0}`, () => {
    const c = nowePlotno(P, P);
    const x = c.getContext('2d');
    const ram = serce ? '#8e1f4d' : '#8a5a00';
    const pud = serce ? '#ff8fc8' : '#ffcf3a';
    const cien = serce ? '#e0609e' : '#e0a400';
    const wst = serce ? '#ffffff' : '#e63946';
    x.fillStyle = ram;
    x.fillRect(1, 3, 14, 13);
    x.fillStyle = pud;
    x.fillRect(2, 4, 12, 11);
    x.fillStyle = cien;
    x.fillRect(2, 13, 12, 2);
    x.fillRect(12, 4, 2, 11);
    x.fillStyle = wst;
    x.fillRect(7, 4, 2, 11);
    x.fillRect(2, 8, 12, 2);
    // kokardka
    x.fillRect(4, 0, 2, 1);
    x.fillRect(3, 1, 1, 2);
    x.fillRect(6, 1, 1, 2);
    x.fillRect(10, 0, 2, 1);
    x.fillRect(9, 1, 1, 2);
    x.fillRect(12, 1, 1, 2);
    x.fillRect(7, 1, 2, 3);
    x.fillStyle = '#ffffff';
    x.fillRect(3, 5, 2, 1);
    x.fillRect(3, 6, 1, 1);
    return c;
  });
}

function kafelekPustego() {
  return obraz('puste', () => {
    const c = nowePlotno(P, P);
    const x = c.getContext('2d');
    x.fillStyle = '#4e3524';
    x.fillRect(1, 3, 14, 13);
    x.fillStyle = '#a07a52';
    x.fillRect(2, 4, 12, 11);
    x.fillStyle = '#7a5a3a';
    x.fillRect(2, 13, 12, 2);
    x.fillRect(12, 4, 2, 11);
    x.fillStyle = '#4e3524';
    for (const [px, py] of [[4, 6], [10, 6], [4, 11], [10, 11]]) x.fillRect(px, py, 1, 1);
    return c;
  });
}

function kafelekPolki() {
  return kafelek('polka', 0, (c, s) => {
    if (swiat === 'las') {
      c.fillStyle = s.polka2;
      c.fillRect(0, 1, P, 5);
      c.fillStyle = s.polka;
      c.fillRect(0, 1, P, 3);
      c.fillStyle = '#56c46a';
      c.fillRect(3, 0, 3, 1);
      c.fillRect(10, 0, 2, 1);
      c.fillRect(11, 6, 2, 2);
    } else if (swiat === 'lod') {
      c.fillStyle = s.polka2;
      c.fillRect(0, 0, P, 5);
      c.fillStyle = s.polka;
      c.fillRect(0, 0, P, 3);
      c.fillStyle = '#e8f8ff';
      c.fillRect(2, 5, 2, 3);
      c.fillRect(3, 8, 1, 2);
      c.fillRect(10, 5, 2, 2);
      c.fillRect(10, 7, 1, 2);
    } else {
      c.fillStyle = s.polka2;
      c.fillRect(0, 0, P, 6);
      c.fillStyle = s.polka;
      c.fillRect(0, 0, P, 4);
      c.fillStyle = jasniej(s.polka, 0.25);
      c.fillRect(0, 0, P, 1);
      c.fillStyle = s.polka2;
      c.fillRect(7, 0, 1, 4);
      c.fillRect(3, 2, 1, 1);
      c.fillRect(12, 2, 1, 1);
    }
  });
}

function kafelekKolcow() {
  return obraz('kolce', () => {
    const c = nowePlotno(P, P);
    const x = c.getContext('2d');
    for (let i = 0; i < 4; i++) {
      for (let y = 8; y < P; y++) {
        const w = Math.min(4, 1 + Math.floor((y - 8) / 2));
        const x0 = i * 4 + Math.floor((4 - w) / 2);
        x.fillStyle = '#d6dce6';
        x.fillRect(x0, y, Math.ceil(w / 2), 1);
        x.fillStyle = '#7d8698';
        x.fillRect(x0 + Math.ceil(w / 2), y, Math.floor(w / 2), 1);
      }
    }
    x.fillStyle = '#4a4f5c';
    x.fillRect(0, 15, P, 1);
    return c;
  });
}

function kafelekTrampoliny(u) {
  return obraz(`trampolina|${u}`, () => {
    const c = nowePlotno(P, P);
    const x = c.getContext('2d');
    x.fillStyle = '#3b3550';
    x.fillRect(1, 13, 14, 3);
    const pad = u ? 7 : 2;
    x.fillStyle = '#c4c8d4';
    for (let y = pad + 3; y < 13; y++) x.fillRect(((y - pad) % 4 < 2 ? 5 : 9), y, 2, 1);
    x.fillStyle = '#ff4d6d';
    x.fillRect(0, pad, P, 3);
    x.fillStyle = '#ffa0b2';
    x.fillRect(1, pad, 14, 1);
    x.fillStyle = '#a0203a';
    x.fillRect(0, pad + 2, P, 1);
    return c;
  });
}


// =====================================================
//   TŁO – niebo, góry, chmury (też w pikselach)
// =====================================================
function rysujNiebo(s) {
  const pasy = 8;
  const gora = by(-1);
  const dol = by(13);
  const h = Math.max(1, (dol - gora) / pasy);
  pProst(0, 0, L.bw, L.bh, s.niebo[1]);
  pProst(0, 0, L.bw, Math.max(0, gora), s.niebo[0]);
  for (let i = 0; i < pasy; i++) {
    const kol = mieszaj(s.niebo[0], s.niebo[1], i / (pasy - 1));
    const y = Math.round(gora + i * h);
    pProst(0, y, L.bw, Math.ceil(h) + 1, kol);
    if (i < pasy - 1) {
      // kratkowane przejście między pasami (jak w starych grach)
      const nast = mieszaj(s.niebo[0], s.niebo[1], (i + 1) / (pasy - 1));
      b.fillStyle = nast;
      const yy = Math.round(gora + (i + 1) * h) - 1;
      for (let x = 0; x < L.bw; x += 2) b.fillRect(x + (i % 2), yy, 1, 1);
    }
  }
}

function pasmoGor(paralaksa, baza, a1, a2, czest, kolor, poszarpane, czapki) {
  const hor = by(12);
  for (let x = 0; x < L.bw; x++) {
    const wx = (x + kamPX * paralaksa) / P;
    let h = baza + Math.sin(wx * czest) * a1 + Math.sin(wx * czest * 2.7 + 1.3) * a2;
    if (poszarpane) h += (Math.abs(((wx * 0.35) % 2) - 1) - 0.5) * a1 * 2.2;
    const y = Math.round(hor - h * P);
    b.fillStyle = kolor;
    b.fillRect(x, y, 1, L.bh - y);
    if (czapki && h > baza + a1 * 0.4) {
      b.fillStyle = '#f4fbff';
      b.fillRect(x, y, 1, Math.round((h - baza - a1 * 0.4) * P * 0.5) + 1);
    } else {
      b.fillStyle = jasniej(kolor, 0.15);
      b.fillRect(x, y, 1, 1);
    }
  }
}

function chmurka(x, y, r, kolor) {
  pKolo(x, y, r, kolor);
  pKolo(x + r * 0.9, y + r * 0.25, r * 0.75, kolor);
  pKolo(x - r * 0.9, y + r * 0.3, r * 0.7, kolor);
  pKolo(x + r * 0.2, y - r * 0.4, r * 0.7, kolor);
  pProst(x - r * 1.5, y + r * 0.55, r * 3.1, r * 0.5, kolor);
}

function rysujChmury(ile, kolor) {
  const szer = L.bw + 8 * P;
  for (let i = 0; i < ile; i++) {
    const baza = losowe(i * 3.1) * szer + czas * P * (0.15 + losowe(i) * 0.2) - kamPX * 0.12;
    const x = (((baza % szer) + szer) % szer) - 4 * P;
    const y = by(0.8 + losowe(i * 7.7) * 3.5);
    chmurka(x, y, P * (0.45 + losowe(i * 5.3) * 0.4), kolor);
  }
}

function rysujTlo() {
  const s = SWIATY[swiat];
  const W = L.bw;
  rysujNiebo(s);
  if (swiat === 'laka') {
    pKolo(W * 0.82, by(2.2), 13, '#fff7c0');
    pKolo(W * 0.82, by(2.2), 10, '#fff3a0');
    pasmoGor(0.12, 4.5, 1.2, 0.6, 0.12, s.gory, false, false);
    rysujChmury(7, '#ffffff');
    pasmoGor(0.35, 2.2, 0.9, 0.4, 0.22, s.gory2, false, false);
  } else if (swiat === 'las') {
    pasmoGor(0.12, 5, 0.8, 0.5, 0.15, s.gory, false, false);
    rysujChmury(4, '#dff3e6');
    const krok = 2.2;
    const od = Math.floor((kamPX * 0.4) / P / krok) - 2;
    for (let i = od; i < od + L.kolumny / krok + 4; i++) {
      const x = Math.round((i * krok + losowe(i) * 0.8) * P - kamPX * 0.4);
      const h = (3 + losowe(i * 1.7) * 3) * P;
      const pod = by(12.2);
      pTrojkat(x, pod - h, pod, P * 0.9, s.gory2);
      pProst(x - 1, pod - 4, 3, 4, '#1c3d2c');
    }
  } else if (swiat === 'pustynia') {
    pKolo(W * 0.75, by(2.5), 16, '#fffbe0');
    pKolo(W * 0.75, by(2.5), 12, '#fff6c8');
    for (let i = 0; i < 5; i++) {
      const x = Math.round((i * 30 + 8) * P - kamPX * 0.15);
      const h = (3 + (i % 2) * 1.5) * P;
      const pod = by(12);
      pTrojkat(x, pod - h, pod, h, '#e8a860');
      for (let y = Math.round(pod - h); y <= pod; y++) {
        const w = Math.round((h * (y - (pod - h))) / h);
        pProst(x, y, w, 1, '#d0904a');
      }
    }
    pasmoGor(0.35, 1.6, 0.6, 0.3, 0.18, s.gory2, false, false);
  } else if (swiat === 'lod') {
    pasmoGor(0.1, 5.5, 1.3, 0.5, 0.1, s.gory2, true, true);
    pasmoGor(0.22, 3.5, 1, 0.4, 0.16, s.gory, true, true);
    rysujChmury(4, '#ffffff');
  } else if (swiat === 'wulkan') {
    const x = Math.round(W * 0.6 - kamPX * 0.05);
    const pod = by(12);
    const szczyt = by(3.5);
    for (let y = szczyt; y <= pod; y++) {
      const t = (y - szczyt) / (pod - szczyt);
      const w = Math.round(P * (1.4 + t * 7.6));
      pProst(x - w, y, 2 * w, 1, '#3d1410');
    }
    pKolo(x, szczyt, 14, 'rgba(255,150,60,0.35)');
    for (let y = szczyt; y < szczyt + P * 2; y++) {
      const w = Math.round(P * 1.4 - (y - szczyt) * 0.5);
      if (w > 0) pProst(x - w + ((y * 7) % 5) - 2, y, Math.max(2, w), 1, '#ff7b2a');
    }
    for (let i = 0; i < 5; i++) {
      const t = (czas * 0.25 + i / 5) % 1;
      pKolo(x + Math.sin(i * 2 + czas * 0.5) * P * 0.8 * t, szczyt - t * P * 3.5, P * (0.4 + t), t < 0.5 ? '#5a4040' : '#4a3434');
    }
    pasmoGor(0.3, 1.8, 0.8, 0.4, 0.2, s.gory2, true, false);
  } else if (swiat === 'zamek') {
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(((losowe(i) * 1.5 * W - kamPX * 0.03) % W + W) % W);
      const y = Math.floor(losowe(i + 50) * by(9));
      if (Math.sin(czas * (0.5 + losowe(i + 9)) + i) > -0.3) pProst(x, y, 1, 1, i % 7 ? '#ffffff' : '#ffe9a0');
    }
    pKolo(W * 0.8, by(2.4), 11, '#fff6d8');
    pKolo(W * 0.8 + 5, by(2.2), 9, s.niebo[0]);
    for (let i = 0; i < 9; i++) {
      const x = Math.round((i * 24 + 6) * P - kamPX * 0.3);
      const szer = Math.round(P * (1.6 + (i % 3) * 0.5));
      const h = Math.round(P * (5 + (i % 4) * 1.4));
      const pod = by(12.5);
      pProst(x, pod - h, szer, h, s.gory);
      for (let z = 0; z < 3; z++) pProst(x + Math.round((z * szer) / 2.5), pod - h - 5, Math.round(szer / 5), 5, s.gory);
      pProst(x + Math.round(szer * 0.4), Math.round(pod - h * 0.7), 3, 6, '#ffd86b');
    }
    pasmoGor(0.35, 1.4, 0.5, 0.3, 0.2, s.gory2, false, false);
  }
}

// Śnieg, iskry, liście – piksele na wierzchu
function rysujPogode() {
  const W = L.bw;
  const H = L.bh;
  if (swiat === 'lod') {
    for (let i = 0; i < 60; i++) {
      const v = 8 + losowe(i + 200) * 12;
      const x = Math.floor((((losowe(i) * W * 1.3 + Math.sin(czas + i) * 6 - kamPX * 0.3) % W) + W) % W);
      const y = Math.floor((losowe(i + 100) * H + czas * v) % H);
      pProst(x, y, i % 4 ? 1 : 2, i % 4 ? 1 : 2, '#ffffff');
    }
  } else if (swiat === 'wulkan') {
    for (let i = 0; i < 35; i++) {
      const v = 10 + losowe(i + 200) * 16;
      const x = Math.floor((((losowe(i) * W * 1.3 + Math.sin(czas * 2 + i) * 4 - kamPX * 0.5) % W) + W) % W);
      const y = Math.floor(H - ((losowe(i + 100) * H + czas * v) % H));
      if (Math.sin(czas * 3 + i) > -0.5) pProst(x, y, 1, 1, i % 3 ? '#ff9f43' : '#ffd23f');
    }
  } else if (swiat === 'las') {
    for (let i = 0; i < 12; i++) {
      const v = 6 + losowe(i + 200) * 6;
      const x = Math.floor((((losowe(i) * W * 1.3 + Math.sin(czas * 1.3 + i) * 10 - kamPX * 0.4) % W) + W) % W);
      const y = Math.floor((losowe(i + 100) * H + czas * v) % H);
      pProst(x, y, 2, 1, i % 2 ? '#e8a33a' : '#8bd16a');
    }
  }
}


// =====================================================
//   DEKORACJE – drzewa, kwiatki, kaktusy...
// =====================================================
function wolneNad(k, w, ile) {
  for (let i = 1; i <= ile; i++) if (kafel(k, w - i) !== ' ') return false;
  return true;
}

function rysujDekoracje() {
  const k0 = Math.max(0, Math.floor(kamX) - 2);
  const k1 = Math.min(mapaSzer - 1, Math.ceil(kamX + L.kolumny) + 2);
  for (let k = k0; k <= k1; k++) {
    for (let w = 1; w < WIERSZE; w++) {
      if (mapa[w][k] !== '#' || kafel(k, w - 1) !== ' ') continue;
      const h = losowe(k * 13.7 + nrEtapu * 71.3 + w);
      dekoracja(h, bx(k + 0.5), by(w), k, w);
    }
  }
}

function dekoracja(h, x, y, k, w) {
  if (swiat === 'laka') {
    if (h < 0.1 && wolneNad(k, w, 4)) {
      pProst(x - 2, y - 26, 4, 26, '#7a4a24');
      pProst(x - 2, y - 26, 1, 26, '#9a6434');
      pKolo(x, y - 36, 13, '#2f8f3c');
      pKolo(x - 8, y - 29, 9, '#2f8f3c');
      pKolo(x + 8, y - 30, 9, '#3a9e47');
      pKolo(x - 3, y - 40, 7, '#4fbf5a');
      pKolo(x + 4, y - 33, 4, '#5fcf6a');
    } else if (h < 0.4) {
      const kolory = ['#ff5a5f', '#ffd23f', '#ffffff', '#c77dff', '#ff9f1c'];
      for (let i = 0; i < 2; i++) {
        const fx = Math.round(x + (losowe(k + i) - 0.5) * 12);
        const fh = 4 + Math.floor(losowe(k * 3 + i) * 4);
        pProst(fx, y - fh, 1, fh, '#2e8b3a');
        const kol = kolory[Math.floor(losowe(k * 7 + i) * kolory.length)];
        pProst(fx - 1, y - fh - 1, 3, 1, kol);
        pProst(fx, y - fh - 2, 1, 3, kol);
        pProst(fx, y - fh - 1, 1, 1, '#fff3a0');
      }
    } else if (h < 0.5) {
      pKolo(x - 3, y - 4, 5, '#2f9a40');
      pKolo(x + 3, y - 5, 6, '#3aa64a');
      pProst(x - 1, y - 9, 2, 1, '#6fd27e');
    }
  } else if (swiat === 'las') {
    if (h < 0.16 && wolneNad(k, w, 5)) {
      pProst(x - 3, y - 38, 6, 38, '#5a3a1e');
      pProst(x - 3, y - 38, 2, 38, '#6e4a28');
      pKolo(x, y - 48, 17, '#1f7a3f');
      pKolo(x - 11, y - 40, 11, '#237f43');
      pKolo(x + 11, y - 41, 11, '#2a8c4c');
      pKolo(x - 4, y - 54, 8, '#33a057');
    } else if (h < 0.36) {
      const r = 3 + Math.floor(losowe(k) * 2);
      pProst(x - 1, y - r * 2, 3, r * 2, '#f4ead8');
      const czerwony = h < 0.26;
      for (let dy = 0; dy <= r; dy++) {
        const pol = Math.round(Math.sqrt(r * r - dy * dy + r * 0.5));
        pProst(x - pol, y - r * 2 - dy, 2 * pol + 1, 1, czerwony ? '#e63946' : '#b5651d');
      }
      if (czerwony) {
        pProst(x - 2, y - r * 2 - 2, 1, 1, '#ffffff');
        pProst(x + 1, y - r * 3, 1, 1, '#ffffff');
      }
    } else if (h < 0.46) {
      for (let i = -2; i <= 2; i++) pLinia(x, y - 1, x + i * 2, y - 5 + Math.abs(i), '#2e9a4a');
    }
  } else if (swiat === 'pustynia') {
    if (h < 0.1 && wolneNad(k, w, 3)) {
      const kol = '#3f9a4a';
      const jas = '#5cbf68';
      pProst(x - 2, y - 26, 5, 26, kol);
      pProst(x - 1, y - 26, 1, 26, jas);
      pProst(x - 8, y - 14, 6, 3, kol);
      pProst(x - 8, y - 20, 3, 7, kol);
      pProst(x + 3, y - 18, 5, 3, kol);
      pProst(x + 5, y - 24, 3, 7, kol);
      pProst(x, y - 28, 1, 2, '#ff7eb6');
    } else if (h < 0.22) {
      pKolo(x, y - 2, 4, '#c48a4a');
      pProst(x - 2, y - 5, 3, 1, '#e0a868');
    } else if (h < 0.3) {
      for (let i = -2; i <= 2; i++) pLinia(x, y - 1, x + i * 2, y - 4, '#a3874a');
    }
  } else if (swiat === 'lod') {
    if (h < 0.1 && wolneNad(k, w, 4)) {
      pProst(x - 1, y - 8, 3, 8, '#5a3a24');
      for (let i = 0; i < 3; i++) {
        const py = y - 6 - i * 10;
        pTrojkat(x, py - 16, py, 13 - i * 3, '#2f7a5a');
        pTrojkat(x, py - 16, py - 8, 6 - i, '#ffffff');
      }
    } else if (h < 0.17 && wolneNad(k, w, 2)) {
      pKolo(x, y - 6, 6, '#ffffff');
      pKolo(x, y - 16, 5, '#ffffff');
      pProst(x - 2, y - 18, 1, 1, OBRYS);
      pProst(x + 1, y - 18, 1, 1, OBRYS);
      pProst(x, y - 16, 4, 1, '#ff9f1c');
      pProst(x - 4, y - 22, 9, 1, OBRYS);
      pProst(x - 2, y - 27, 5, 5, OBRYS);
      pProst(x, y - 10, 1, 1, OBRYS);
      pProst(x, y - 7, 1, 1, OBRYS);
    } else if (h < 0.3) {
      pProst(x - 2, y - 8, 2, 8, '#c8ecff');
      pProst(x, y - 5, 2, 5, '#e8f8ff');
      pProst(x + 2, y - 6, 2, 6, '#a8dcff');
    }
  } else if (swiat === 'wulkan') {
    if (h < 0.15) {
      pKolo(x, y - 3, 5, '#2e2224');
      pProst(x - 2, y - 7, 3, 1, '#4a3a3c');
    } else if (h < 0.24 && wolneNad(k, w, 3)) {
      pProst(x - 1, y - 26, 3, 26, '#2a1a16');
      pLinia(x, y - 16, x - 7, y - 23, '#2a1a16', 2);
      pLinia(x, y - 20, x + 6, y - 27, '#2a1a16', 2);
    } else if (h < 0.32) {
      pProst(x - 4, y - 1, 8, 1, '#ff7b2a');
      for (let i = 0; i < 3; i++) {
        const t = (czas * 0.6 + i / 3 + h * 5) % 1;
        pKolo(x + Math.sin(t * 6 + i) * 2, y - 3 - t * 24, 2 + t * 4, t < 0.5 ? '#6a5858' : '#584848');
      }
    }
  } else if (swiat === 'zamek') {
    if (h < 0.12 && wolneNad(k, w, 2)) {
      pProst(x - 1, y - 20, 2, 20, '#4a3326');
      pProst(x - 3, y - 22, 6, 2, '#8a8aa0');
      const m = Math.floor(czas * 10 + k) % 3;
      pKolo(x, y - 25, 6, 'rgba(255,190,90,0.18)');
      pProst(x - 2, y - 27 - m, 4, 5 + m, '#ff7b2a');
      pProst(x - 1, y - 26 - m, 2, 3 + m, '#ffe066');
    } else if (h < 0.22) {
      pProst(x - 4, y - 10, 8, 10, '#3a3558');
      pProst(x - 5, y - 11, 10, 2, '#5a5578');
    }
  }
}


// =====================================================
//   KAFELKI NA MAPIE
// =====================================================
function rysujKafle() {
  const s = SWIATY[swiat];
  const k0 = Math.max(0, Math.floor(kamX) - 1);
  const k1 = Math.min(mapaSzer - 1, Math.ceil(kamX + L.kolumny) + 1);
  const wMax = Math.ceil(kamY + (L.bh - L.oy) / P) + 1;
  for (let k = k0; k <= k1; k++) {
    for (let w = Math.max(0, Math.floor(kamY) - 1); w <= wMax; w++) {
      let z;
      if (w < WIERSZE) z = mapa[w][k];
      else z = mapa[WIERSZE - 1][k] === '#' ? '#' : ' ';
      if (z === ' ' || z === '~' || z === 'L' || z === 'o') continue;
      const x = bx(k);
      let y = by(w);
      const pod = podskoki.get(`${k},${w}`);
      if (pod !== undefined && czas - pod < 0.2) y -= Math.round(Math.sin(((czas - pod) / 0.2) * Math.PI) * 5);
      if (z === '#') {
        const gora = w >= 1 && w < WIERSZE && kafel(k, w - 1) !== '#';
        rysujObraz(kafelekZiemi(gora, (k * 7 + w * 3) % 3), x, y);
        if (gora && (swiat === 'laka' || swiat === 'las') && kafel(k, w - 1) === ' ' && losowe(k * 2.3) < 0.5) {
          pProst(x + 3 + Math.floor(losowe(k) * 9), y - 1, 1, 1, s.wierzch2);
          pProst(x + 2 + Math.floor(losowe(k * 4) * 11), y - 2, 1, 2, s.wierzch);
        }
      } else if (z === 'B') {
        rysujObraz(kafelekBloku(), x, y);
        if (swiat === 'laka' && kafel(k, w - 1) === ' ') pProst(x, y, P, 2, '#5fbf5a');
      } else if (z === '=') rysujObraz(kafelekCegiel(), x, y);
      else if (z === '?' || z === '+') {
        rysujObraz(kafelekPrezentu(z === '+'), x, y);
        const bl = (czas * 0.8 + k * 0.37) % 2;
        if (bl < 0.25) {
          pProst(x + 11, y + 3, 1, 3, '#ffffff');
          pProst(x + 10, y + 4, 3, 1, '#ffffff');
        }
      } else if (z === 'u') rysujObraz(kafelekPustego(), x, y);
      else if (z === '-') rysujObraz(kafelekPolki(), x, y);
      else if (z === '^') rysujObraz(kafelekKolcow(), x, y);
      else if (z === 'T') {
        const kiedy = trampoliny.get(k);
        rysujObraz(kafelekTrampoliny(kiedy !== undefined && czas - kiedy < 0.2 ? 1 : 0), x, y);
      } else if (z === 'Z') rysujKrate(k, w, x, y);
    }
  }
  // monety
  for (let k = k0; k <= k1; k++) {
    for (let w = 0; w < WIERSZE; w++) {
      if (mapa[w][k] === 'o') rysujMonete(bx(k + 0.5), by(w + 0.5), Math.floor(czas * 8 + k * 0.7));
    }
  }
}

function rysujKrate(k, w, x, y) {
  if (!krataZamknieta) {
    b.fillStyle = 'rgba(10,8,25,0.45)';
    b.fillRect(x, y, P, P);
    if (kafel(k, w - 1) !== 'Z') for (let i = 0; i < 4; i++) pProst(x + 1 + i * 4, y, 2, 3, '#4a4860');
    return;
  }
  b.fillStyle = 'rgba(10,8,25,0.6)';
  b.fillRect(x, y, P, P);
  for (let i = 0; i < 4; i++) {
    pProst(x + 1 + i * 4, y, 2, P, '#4a4860');
    pProst(x + 1 + i * 4, y, 1, P, '#7a789a');
  }
  pProst(x, y + 7, P, 2, '#4a4860');
}

// Woda i lawa – na końcu, żeby zanurzone rzeczy były „pod wodą”
function rysujPlyny() {
  const s = SWIATY[swiat];
  const k0 = Math.max(0, Math.floor(kamX) - 1);
  const k1 = Math.min(mapaSzer - 1, Math.ceil(kamX + L.kolumny) + 1);
  const wMax = Math.ceil(kamY + (L.bh - L.oy) / P) + 1;
  for (let k = k0; k <= k1; k++) {
    for (let w = 0; w <= wMax; w++) {
      const z = w < WIERSZE ? mapa[w][k] : mapa[WIERSZE - 1][k];
      if (z !== '~' && z !== 'L') continue;
      const x = bx(k);
      const y = by(w);
      const lawa = z === 'L';
      const gorny = w < WIERSZE && kafel(k, w - 1) !== z;
      if (!gorny) {
        pProst(x, y, P, P, lawa ? '#d83a12' : s.woda);
        if (lawa && losowe(k * 3 + w) < 0.3) pProst(x + 5, y + 6, 2, 1, '#ff7b2a');
        continue;
      }
      for (let i = 0; i < P; i++) {
        const fala = 4 + Math.round(Math.sin((k * P + i) * 0.28 + czas * (lawa ? 1.5 : 3)) * 1.3);
        if (lawa) {
          pProst(x + i, y + fala, 1, P - fala, '#e8461a');
          pProst(x + i, y + fala, 1, 3, '#ff9a2a');
          pProst(x + i, y + fala, 1, 1, '#ffe08a');
        } else {
          pProst(x + i, y + fala, 1, P - fala, s.woda);
          pProst(x + i, y + fala, 1, 1, s.woda2);
        }
      }
      if (lawa) {
        const bq = (czas * 0.7 + losowe(k) * 3) % 1.5;
        if (bq < 0.6) pKolo(x + 3 + Math.floor(losowe(k * 3) * 10), y + 7 - bq * 6, bq < 0.4 ? 1 : 0, '#ffd86b');
      }
    }
  }
}


// =====================================================
//   FLAGI, GWIAZDKI, PRZEDMIOTY, PLATFORMY, KLATKA
// =====================================================
function widac(x, zapas = 40) {
  return x > -zapas && x < L.bw + zapas;
}

function rysujFlagi() {
  for (const f of flagi) {
    const x = bx(f.k + 0.5);
    if (!widac(x)) continue;
    const pod = by(f.w + 1);
    pProst(x - 1, pod - 43, 2, 43, '#c9cdd8');
    pProst(x - 1, pod - 43, 1, 43, '#ffffff');
    pProst(x - 2, pod - 46, 4, 3, '#ffd23f');
    const wys = f.zdobyta ? Math.min(1, (czas - f.czas) / 0.6) : 0;
    const fy = Math.round(pod - 16 - wys * 24);
    const kol = f.zdobyta && gracz ? BOHATEROWIE[gracz.id].wyglad.koszulka : '#9aa3ad';
    for (let r = 0; r < 10; r++) {
      const dl = 14 - Math.abs(r - 4.5) * 2.6;
      const fal = Math.round(Math.sin(czas * 6 + r * 0.5));
      pProst(x + 1, fy + r + fal * (r > 0 ? 0 : 0), Math.max(1, Math.round(dl)) + (r % 3 === 0 ? fal : 0), 1, kol);
    }
    if (f.zdobyta) {
      pProst(x + 4, fy + 4, 3, 1, '#ffffff');
      pProst(x + 5, fy + 3, 1, 3, '#ffffff');
    }
  }
}

function rysujGwiazdki() {
  const o = sprite('gwiazdka', GWIAZDKA);
  for (const g of gwiazdki) {
    if (g.zebrana) continue;
    const x = bx(g.k + 0.5);
    if (!widac(x)) continue;
    const y = by(g.w + 0.5) + Math.round(Math.sin(czas * 3 + g.nr) * 1.5);
    b.globalAlpha = g.miala ? 0.45 : 1;
    if (Math.floor(czas * 3 + g.nr) % 2) {
      pProst(x - 9, y - 1, 2, 1, '#fff6a0');
      pProst(x + 8, y + 2, 1, 2, '#fff6a0');
    }
    rysujObraz(o, x - 5, y - 6);
    b.globalAlpha = 1;
  }
}

const OBRAZKI_MOCY = { R: ['plecak', () => PLECAK], P: ['bankomiotacz', () => BANKOMIOTACZ], N: ['magnes', () => MAGNES] };

function obrazMocy(typ) {
  const [nazwa, siatka] = OBRAZKI_MOCY[typ];
  return sprite(nazwa, siatka());
}

function rysujMoce() {
  for (const m of moce) {
    if (m.zebrana) continue;
    const x = bx(m.k + 0.5);
    if (!widac(x)) continue;
    const y = by(m.w + 0.5) + Math.round(Math.sin(czas * 3 + m.k) * 2);
    pKolo(x, y, 10 + (Math.floor(czas * 4) % 2), 'rgba(255,255,255,0.18)');
    pOkrag(x, y, 10 + (Math.floor(czas * 4) % 2), 'rgba(255,255,255,0.35)');
    const o = obrazMocy(m.typ);
    rysujObraz(o, x - Math.floor(o.w / 2), y - Math.floor(o.h / 2));
  }
}

function rysujPlatformy() {
  const s = SWIATY[swiat];
  for (const p of platformy) {
    const x = bx(p.x);
    if (!widac(x, (p.w + ZASIEG_PLATFORMY) * P)) continue;
    // tor, po którym jeździ
    b.fillStyle = 'rgba(255,255,255,0.3)';
    if (p.typ === 'M') {
      const y = by(p.y0 + 0.2);
      for (let xx = bx(p.x0 + p.w / 2); xx < bx(p.x0 + ZASIEG_PLATFORMY + p.w / 2); xx += 4) b.fillRect(xx, y, 2, 1);
    } else {
      const xx = bx(p.x0 + p.w / 2);
      for (let yy = by(p.y0 - ZASIEG_PLATFORMY + 0.2); yy < by(p.y0 + 0.2); yy += 4) b.fillRect(xx, yy, 1, 2);
    }
    const y = by(p.y);
    const w = p.w * P;
    pProst(x, y, w, 7, OBRYS);
    pProst(x + 1, y + 1, w - 2, 5, s.polka);
    pProst(x + 1, y + 1, w - 2, 1, jasniej(s.polka, 0.3));
    for (let i = 2; i < w - 3; i += 4) pProst(x + i, y + 4, 2, 2, (i / 4) % 2 ? '#ffd23f' : OBRYS);
  }
}

function rysujKlatke() {
  if (!klatka) return;
  const x = bx(klatka.x);
  if (!widac(x, 60)) return;
  const dol = by(klatka.dol);
  const wys = Math.round(klatka.wys * P);
  const gora = dol - wys;
  if (!klatka.otwarta) {
    const gx = gracz ? gracz.x + gracz.w / 2 : klatka.x - 5;
    postacNaBuforze(etap.porwany, x + 16, dol - 3, 'macha', 0, gx < klatka.x + 1 ? -1 : 1, 0.5);
  }
  pProst(x - 2, dol - 4, 36, 4, '#5b4636');
  pProst(x - 2, dol - 4, 36, 1, '#7a5e48');
  for (let i = 0; i <= 8; i++) {
    if (klatka.otwarta && i >= 2 && i <= 5) continue;
    pProst(x + i * 4 - 1, gora + 3, 2, wys - 7, '#4a4860');
    pProst(x + i * 4 - 1, gora + 3, 1, wys - 7, '#8a88a8');
  }
  if (klatka.otwarta) {
    const kier = uwolniony ? uwolniony.kier : -1;
    const zawias = kier < 0 ? x - 1 : x + 31;
    for (let i = 1; i <= 3; i++) pProst(zawias + kier * i * 3, gora + 5 + i, 2, wys - 10, '#4a4860');
  }
  pProst(x - 2, gora, 36, 4, '#5d5b6e');
  pProst(x - 2, gora, 36, 1, '#8a88a8');
  for (let dy = 0; dy <= 9; dy++) {
    const pol = Math.round(Math.sqrt(Math.max(0, 81 - dy * dy)));
    pProst(x + 16 - pol, gora - dy, 2 * pol, 1, '#5d5b6e');
  }
  pOkrag(x + 16, gora - 13, 3, '#5d5b6e');
  if (!klatka.otwarta) {
    const kx = x + 13;
    const ky = gora + Math.round(wys * 0.55);
    pProst(kx + 1, ky - 3, 1, 3, '#c99a2a');
    pProst(kx + 4, ky - 3, 1, 3, '#c99a2a');
    pProst(kx + 1, ky - 4, 4, 1, '#c99a2a');
    pProst(kx, ky, 6, 5, '#ffd23f');
    pProst(kx + 2, ky + 2, 2, 2, '#5b4636');
  }
}

function dymkiKlatki() {
  if (!klatka || klatka.otwarta || !gracz || stan !== 'gra') return;
  const x = sx(klatka.x + 1);
  const y = sy(klatka.dol - klatka.wys - 0.9);
  if (czas - klatka.prosba < 1.5) dymek('Najpierw pokonaj Gburka!', x, y);
  else if (Math.abs(gracz.x - klatka.x) < 16 && czas % 4 < 2.2) dymek('Pomocy!', x, y);
}

function polozenieUwolnionego() {
  const t = stan === 'uratowanie' ? uratowanieCzas : 10;
  if (t < 0.7) {
    const p = t / 0.7;
    return { t, x: uwolniony.startX + (uwolniony.celX - uwolniony.startX) * p, y: uwolniony.y - Math.sin(p * Math.PI) * 1.6 };
  }
  return { t, x: uwolniony.celX, y: uwolniony.y - Math.abs(Math.sin((t - 0.7) * 5)) * 0.45 };
}

function rysujUwolnionego() {
  if (!uwolniony) return;
  const { t, x, y } = polozenieUwolnionego();
  postacNaBuforze(uwolniony.id, bx(x), by(y), t < 0.7 ? 'skacze' : 'cieszy', 0, uwolniony.kier, 1.7);
  if (stan === 'uratowanie' && Math.floor(t * 3) !== Math.floor((t - 1 / 60) * 3)) {
    efekty.push({ typ: 'serce', x: x + (Math.random() - 0.5), y: y - 1.6, czas: 0, dlugosc: 1.1 });
  }
}

function dymekUwolnionego() {
  if (!uwolniony || !gracz) return;
  const { t, x, y } = polozenieUwolnionego();
  if (t > 0.6) dymek(`Dzięki, ${BOHATEROWIE[gracz.id].wolacz}!`, sx(x), sy(y - 1.6));
}


// =====================================================
//   GRACZ
// =====================================================
function rysujGracza() {
  const g = gracz;
  if (!g || g.ukryty || g.powrot > 0) return;
  if (g.nietykalny > 0 && g.omdlenie <= 0 && Math.floor(czas * 12) % 2 === 0) return;
  let ruch = 'stoi';
  if (g.omdlenie > 0) ruch = 'omdlaly';
  else if (stan === 'uratowanie' || stan === 'podsumowanie' || stan === 'final') ruch = g.naZiemi ? 'cieszy' : 'skacze';
  else if (!g.naZiemi) ruch = g.vy < 0 ? 'skacze' : 'spada';
  else if (Math.abs(g.vx) > 0.4) ruch = 'biegnie';
  const x = bx(g.x + g.w / 2);
  const y = by(g.y + g.h);
  pProst(x - 5, y, 10, 1, 'rgba(0,0,0,0.2)');
  if (g.magnes > 0) {
    const r = 18 + (Math.floor(czas * 6) % 3) * 4;
    b.globalAlpha = g.magnes < 3 && Math.floor(czas * 8) % 2 ? 0.1 : 0.35;
    pOkrag(x, y - 11, r, '#ff7b7b');
    b.globalAlpha = 1;
  }
  // plecak rakietowy na plecach
  if (g.paliwo > 0) {
    const px = g.kier > 0 ? x - 10 : x + 5;
    pProst(px, y - 19, 5, 9, OBRYS);
    pProst(px + 1, y - 18, 3, 7, '#c4c8d4');
    pProst(px + 1, y - 18, 3, 2, '#ff5a5f');
    if (g.leci) {
      const d = 3 + Math.floor(Math.random() * 4);
      pProst(px + 1, y - 10, 3, d, '#ff9f1c');
      pProst(px + 2, y - 10, 1, d - 1, '#fff3a0');
    }
  }
  postacNaBuforze(g.id, x, y, ruch, g.faza, g.kier);
  // bańkomiotacz w ręce
  if (g.bron && g.omdlenie <= 0) {
    const gx = g.kier > 0 ? x + 3 : x - 10;
    const gy = y - 11;
    pProst(gx, gy, 7, 3, OBRYS);
    pProst(gx + 1, gy + 1, 5, 1, '#4cc9f0');
    pProst(g.kier > 0 ? gx + 6 : gx, gy + 1, 1, 1, '#ff9f1c');
    pProst(gx + 2, gy - 2, 3, 2, '#b9f3ff');
    pProst(gx + 2, gy + 3, 2, 2, OBRYS);
  }
  if (g.omdlenie > 0) {
    for (let i = 0; i < 3; i++) {
      const a = czas * 4 + (i * Math.PI * 2) / 3;
      const gx = Math.round(x + Math.cos(a) * 7);
      const gy = Math.round(y - 25 + Math.sin(a) * 2);
      pProst(gx - 1, gy, 3, 1, '#ffe14d');
      pProst(gx, gy - 1, 1, 3, '#ffe14d');
    }
  }
}


// =====================================================
//   WROGOWIE I GBUREK
// =====================================================
function rysujBanke(x, y, r) {
  b.globalAlpha = 0.25;
  pKolo(x, y, r, '#b9f3ff');
  b.globalAlpha = 0.9;
  pOkrag(x, y, r, '#d8faff');
  b.globalAlpha = 1;
  pProst(x - Math.round(r * 0.5), y - Math.round(r * 0.6), 2, 2, '#ffffff');
}

function rysujWrogow() {
  for (const e of wrogowie) {
    const x = bx(e.x + e.w / 2);
    if (!widac(x)) continue;
    const dol = by(e.y + e.h);
    if (e.spada) {
      b.save();
      b.translate(0, dol * 2 - Math.round(e.h * P));
      b.scale(1, -1);
    }
    if (e.typ === 'g') {
      if (!e.zywy && !e.spada) {
        const g = SWIATY[swiat].glutek;
        pProst(x - 7, dol - 3, 14, 3, OBRYS);
        pProst(x - 6, dol - 3, 12, 2, g);
      } else {
        rysujObraz(obrazGlutka(Math.floor(e.czas * 4 + e.faza) % 2), x - 7, dol - 11, e.kier < 0);
      }
    } else if (e.typ === 'j') {
      rysujObraz(sprite(`jezyk${Math.floor(e.czas * 6) % 2}`, JEZYK[Math.floor(e.czas * 6) % 2]), x - 8, dol - 11, e.kier < 0);
    } else if (e.typ === 'b') {
      const f = Math.floor(czas * 20) % 2;
      rysujObraz(sprite(`bzyk${f}`, BZYK[f]), x - 7, by(e.y + e.h / 2) - 6, e.kier < 0);
    } else if (e.typ === 'i' && !e.ukryta) {
      const f = Math.floor(czas * 10) % 2;
      const o = sprite(`iskra${f}`, ISKRA[f]);
      const y = by(e.y + e.h / 2) - 5;
      if (e.vy < 0) {
        b.save();
        b.translate(0, y * 2 + 10);
        b.scale(1, -1);
        rysujObraz(o, x - 5, y);
        b.restore();
      } else {
        rysujObraz(o, x - 5, y);
      }
    }
    if (e.spada) b.restore();
    if (e.wBance > 0) rysujBanke(x, by(e.y + e.h / 2), 10);
  }
}

// Kolory sprite'ów z jednej palety (jeżyk, bzyk i iskra mają stałe kolory)
KOLORY_PIKSELI.jezyk0 = KOLORY_PIKSELI.jezyk;
KOLORY_PIKSELI.jezyk1 = KOLORY_PIKSELI.jezyk;
KOLORY_PIKSELI.bzyk0 = KOLORY_PIKSELI.bzyk;
KOLORY_PIKSELI.bzyk1 = KOLORY_PIKSELI.bzyk;
KOLORY_PIKSELI.iskra0 = KOLORY_PIKSELI.iskra;
KOLORY_PIKSELI.iskra1 = KOLORY_PIKSELI.iskra;

function rysujGburka() {
  const gb = gburek;
  if (!gb || gb.pokonany) return;
  const x = bx(gb.x + gb.w / 2);
  if (!widac(x, 60)) return;
  const dol = by(gb.y + gb.h);
  const oszolomiony = gb.stanG === 'oszolomiony';
  const czaruje = gb.stanG === 'czaruje';
  const f = Math.abs(gb.vx) > 0.2 ? Math.floor(czas * 6) % 2 : 0;
  if (oszolomiony && !gb.banka && Math.floor(czas * 14) % 2) b.globalAlpha = 0.55;
  const lewo = gb.kier < 0;
  const o = obrazGburka(f, oszolomiony);
  const x0 = x - 9;
  const y0 = dol - 29;
  rysujObraz(o, x0, y0, lewo);
  // ręka z różdżką
  const reka = lewo ? x0 + 1 : x0 + 16;
  const ry = y0 + (czaruje ? 13 : 20);
  const kier = lewo ? -1 : 1;
  pProst(reka - 1, ry - 1, 3, 3, '#f0d0b0');
  const kx = reka + kier * 5;
  const ky = ry - (czaruje ? 7 : 3);
  pLinia(reka, ry, kx, ky, '#5b3a24');
  const blysk = czaruje ? 2 + (Math.floor(czas * 20) % 2) : 1;
  pProst(kx - blysk, ky, 2 * blysk + 1, 1, '#ffe14d');
  pProst(kx, ky - blysk, 1, 2 * blysk + 1, '#ffe14d');
  if (czaruje) pKolo(kx, ky, 4, 'rgba(255,225,77,0.3)');
  b.globalAlpha = 1;
  if (oszolomiony) {
    for (let i = 0; i < 3; i++) {
      const a = czas * 5 + (i * Math.PI * 2) / 3;
      const gx = Math.round(x + Math.cos(a) * 9);
      const gy = Math.round(dol - 32 + Math.sin(a) * 2);
      pProst(gx - 1, gy, 3, 1, '#ffe14d');
      pProst(gx, gy - 1, 1, 3, '#ffe14d');
    }
  }
  if (gb.banka > 0) rysujBanke(x, dol - 15, 19);
  // serduszka Gburka nad głową
  if (walka) {
    const serce = sprite('serce', SERCE);
    for (let i = 0; i < USTAWIENIA.zyciaGburka; i++) {
      b.globalAlpha = i < gb.zycia ? 1 : 0.25;
      rysujObraz(serce, x - 15 + i * 10, dol - 44);
    }
    b.globalAlpha = 1;
  }
}

function rysujKule() {
  for (const k of kule) {
    const x = bx(k.x);
    const y = by(k.y);
    pKolo(x, y, 6, 'rgba(160,80,255,0.35)');
    pKolo(x, y, 4, '#b070ff');
    pKolo(x, y, 2, '#ffffff');
    const m = Math.floor(czas * 12) % 2;
    pProst(x - 6 - m, y, 2, 1, '#e0a8ff');
    pProst(x + 5 + m, y, 2, 1, '#e0a8ff');
  }
}

function rysujBanki() {
  for (const k of banki) rysujBanke(bx(k.x), by(k.y), 5);
}

function rysujZabe(x, y) {
  rysujObraz(sprite('zaba', ZABA), x - 5, y - 9, true);
}


// =====================================================
//   EFEKTY
// =====================================================
function rysujEfekty() {
  for (const e of efekty) {
    const x = bx(e.x);
    const y = by(e.y);
    const a = Math.max(0, 1 - e.czas / e.dlugosc);
    if (e.typ === 'czastka') {
      b.globalAlpha = Math.min(1, a * 1.6);
      const r = Math.max(1, Math.round(e.r * P));
      if (e.ksztalt === 'gwiazdka') {
        pProst(x - r, y, 2 * r + 1, 1, e.kolor);
        pProst(x, y - r, 1, 2 * r + 1, e.kolor);
      } else {
        pProst(x - Math.floor(r / 2), y - Math.floor(r / 2), r, r, e.kolor);
      }
    } else if (e.typ === 'moneta') {
      rysujMonete(x, y, Math.floor(e.czas * 24));
    } else if (e.typ === 'lot') {
      const t = Math.min(1, e.czas / e.dlugosc);
      const cx = gracz ? gracz.x + gracz.w / 2 : e.x;
      const cy = gracz ? gracz.y + gracz.h / 2 : e.y;
      rysujMonete(bx(e.x + (cx - e.x) * t), by(e.y + (cy - e.y) * t), Math.floor(e.czas * 24));
    } else if (e.typ === 'serce') {
      b.globalAlpha = Math.min(1, a * 2);
      rysujObraz(sprite('serce', SERCE), x - 4, y - 4);
    } else if (e.typ === 'dym') {
      b.globalAlpha = a * 0.7;
      pKolo(x, y, e.r * P, '#d8d4e8');
    } else if (e.typ === 'zaba') {
      b.globalAlpha = Math.min(1, a * 3);
      rysujZabe(x, y);
    }
  }
  b.globalAlpha = 1;
}

// Napisy nad głowami rysujemy już na ekranie (żeby były ostre)
function rysujNapisy() {
  for (const e of efekty) {
    if (e.typ !== 'napis') continue;
    const a = Math.max(0, 1 - e.czas / e.dlugosc);
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.font = czcionka(e.duzy ? L.fs * 1.3 : L.fs, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    tekstZObwodka(e.tekst, sx(e.x), sy(e.y), e.kolor);
  }
  ctx.globalAlpha = 1;
}


// =====================================================
//   ŚWIAT – wszystko razem
// =====================================================
function rysujSwiat() {
  if (stan === 'start' || stan === 'wybor') {
    const zakres = Math.max(0, mapaSzer - L.kolumny);
    if (zakres > 0) {
      const t = (czas * 1.6) % (2 * zakres);
      kamX = t < zakres ? t : 2 * zakres - t;
    } else {
      kamX = (mapaSzer - L.kolumny) / 2;
    }
    kamY = L.wiersze >= WIERSZE ? 0 : WIERSZE - L.wiersze;
  }
  kamPX = Math.round(kamX * P);
  kamPY = Math.round(kamY * P);
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.imageSmoothingEnabled = false;
  b.globalAlpha = 1;
  rysujTlo();
  rysujDekoracje();
  rysujKafle();
  rysujFlagi();
  rysujGwiazdki();
  rysujMoce();
  rysujPlatformy();
  rysujKlatke();
  rysujWrogow();
  rysujGburka();
  rysujUwolnionego();
  rysujGracza();
  rysujKule();
  rysujBanki();
  rysujPlyny();
  rysujEfekty();
  rysujPogode();

  // powiększamy małe płótno na cały ekran – bez rozmazywania!
  let dx = 0;
  let dy = 0;
  if (wstrzas > 0) {
    dx = Math.round((Math.random() - 0.5) * wstrzas * 10) * L.skala;
    dy = Math.round((Math.random() - 0.5) * wstrzas * 10) * L.skala;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bufor, 0, 0, L.bw, L.bh, dx, dy, L.bw * L.skala, L.bh * L.skala);
  rysujNapisy();
  dymkiKlatki();
  dymekUwolnionego();
}


// =====================================================
//   NARZĘDZIA DO NAPISÓW I OKIENEK (na ekranie)
// =====================================================
function sciezkaZaokraglona(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Pikselowa ramka: ciemny brzeg, jasna obwódka, środek
function ramka(x, y, w, h, tlo, brzeg, grubosc = 3) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  const g = grubosc;
  ctx.fillStyle = '#07061a';
  ctx.fillRect(x + g, y, w - 2 * g, h);
  ctx.fillRect(x, y + g, w, h - 2 * g);
  ctx.fillStyle = brzeg;
  ctx.fillRect(x + g, y + g, w - 2 * g, h - 2 * g);
  ctx.fillStyle = tlo;
  ctx.fillRect(x + 2 * g, y + 2 * g, w - 4 * g, h - 4 * g);
}

function czcionka(rozmiar, gruba) {
  return `${gruba ? '800 ' : ''}${Math.round(rozmiar)}px "Segoe UI", system-ui, -apple-system, sans-serif`;
}

function tekstZObwodka(tekst, x, y, kolor, grubosc = 4) {
  ctx.lineWidth = grubosc;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2;
  ctx.strokeStyle = 'rgba(7,6,26,0.85)';
  ctx.strokeText(tekst, x, y);
  ctx.fillStyle = kolor;
  ctx.fillText(tekst, x, y);
}

function zawijajTekst(tekst, maxSzer) {
  const slowa = tekst.split(' ');
  const linie = [];
  let l = '';
  for (const s of slowa) {
    const proba = l ? l + ' ' + s : s;
    if (l && ctx.measureText(proba).width > maxSzer) {
      linie.push(l);
      l = s;
    } else {
      l = proba;
    }
  }
  if (l) linie.push(l);
  return linie;
}

function migotanie() {
  return Math.floor(czas * 2.5) % 2 ? 1 : 0.55;
}

function formatCzasu(s) {
  const c = Math.floor(s);
  return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}`;
}

function dymek(tekst, x, y) {
  const fs = Math.max(11, Math.min(L.fs * 0.9, L.T * 0.42));
  ctx.font = czcionka(fs, true);
  const k = L.skala;
  const w = Math.round(ctx.measureText(tekst).width + fs * 1.2);
  const h = Math.round(fs * 1.9);
  const bxx = ogranicz(x - w / 2, 4, L.W - w - 4);
  const byy = y - h - fs * 0.6;
  ctx.fillStyle = OBRYS;
  ctx.fillRect(bxx - k, byy - k, w + 2 * k, h + 2 * k);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bxx, byy, w, h);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = OBRYS;
    ctx.fillRect(x - (3 - i) * k - k, byy + h + i * k, (3 - i) * 2 * k + 2 * k, k);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - (3 - i) * k, byy + h + i * k - k, (3 - i) * 2 * k, k);
  }
  ctx.fillStyle = '#2b2340';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tekst, bxx + w / 2, byy + h / 2 + 1);
}


// =====================================================
//   GÓRNY PASEK
// =====================================================
function rysujPasek() {
  const { W, hudH, fs } = L;
  ctx.fillStyle = '#14123a';
  ctx.fillRect(0, 0, W, hudH);
  ctx.fillStyle = '#0a0920';
  ctx.fillRect(0, hudH - 4, W, 4);
  ctx.fillStyle = '#3a3380';
  ctx.fillRect(0, hudH - 4, W, 1);
  ctx.textBaseline = 'middle';
  const srodek = (hudH - 4) / 2;

  if (!gracz || stan === 'start' || stan === 'wybor') {
    ctx.textAlign = 'center';
    ctx.font = czcionka(fs * 1.3, true);
    tekstZObwodka('Na ratunek!', W / 2, srodek, '#ffd23f', 4);
    return;
  }

  const k = hudH > 50 ? 3 : 2;
  const serce = sprite('serce', SERCE);
  let x = 12;
  for (let i = 0; i < USTAWIENIA.serca; i++) {
    ctx.globalAlpha = i < gracz.serca ? 1 : 0.22;
    ikonaNaEkranie(serce, x, srodek - (serce.h * k) / 2, k);
    x += serce.w * k + 4;
  }
  ctx.globalAlpha = 1;
  x += 6;
  ikonaNaEkranie(obrazMonety(Math.floor(czas * 6) % 4), x, srodek - 5 * k, k);
  x += 8 * k + 6;
  ctx.textAlign = 'left';
  ctx.font = czcionka(fs * 1.1, true);
  tekstZObwodka(String(monety), x, srodek, '#ffd23f', 3);
  x += ctx.measureText('000').width + 8;

  // moce: plecak (z paliwem), bańkomiotacz, magnes
  const km = 2;
  if (gracz.paliwo > 0) {
    const o = obrazMocy('R');
    ikonaNaEkranie(o, x, srodek - (o.h * km) / 2, km);
    x += o.w * km + 3;
    ctx.fillStyle = '#07061a';
    ctx.fillRect(x, srodek - 9, 8, 18);
    const ile = gracz.paliwo / USTAWIENIA.paliwoPlecaka;
    ctx.fillStyle = ile < 0.25 ? '#ff4d6d' : '#ffb02e';
    const hh = Math.round(14 * ile);
    ctx.fillRect(x + 2, srodek + 7 - hh, 4, hh);
    x += 14;
  }
  if (gracz.bron) {
    const o = obrazMocy('P');
    ikonaNaEkranie(o, x, srodek - (o.h * km) / 2, km);
    x += o.w * km + 8;
  }
  if (gracz.magnes > 0) {
    const o = obrazMocy('N');
    ctx.globalAlpha = gracz.magnes < 3 && Math.floor(czas * 8) % 2 ? 0.35 : 1;
    ikonaNaEkranie(o, x, srodek - (o.h * km) / 2, km);
    ctx.globalAlpha = 1;
    x += o.w * km + 3;
    ctx.font = czcionka(fs * 0.85, true);
    tekstZObwodka(String(Math.ceil(gracz.magnes)), x, srodek, '#ff9f9f', 3);
    x += ctx.measureText('00').width + 6;
  }
  const lewaSzer = x;

  // po prawej: pauza, punkty, gwiazdki
  const prawy = W - 12;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(prawy - 12, srodek - 8, 4, 16);
  ctx.fillRect(prawy - 4, srodek - 8, 4, 16);
  ctx.textAlign = 'right';
  ctx.font = czcionka(fs * 1.1, true);
  const tp = `${punkty} pkt`;
  tekstZObwodka(tp, prawy - 22, srodek, '#e8e6ff', 3);
  let gx = prawy - 22 - ctx.measureText(tp).width - 10;
  const gw = sprite('gwiazdka', GWIAZDKA);
  const kg = 2;
  for (let i = gwiazdki.length - 1; i >= 0; i--) {
    const g = gwiazdki[i];
    gx -= gw.w * kg;
    ctx.globalAlpha = g.zebrana ? 1 : g.miala ? 0.4 : 0.15;
    ikonaNaEkranie(gw, gx, srodek - (gw.h * kg) / 2, kg);
    gx -= 4;
  }
  ctx.globalAlpha = 1;
  const prawaSzer = W - gx;

  const miejsce = W - 2 * Math.max(lewaSzer, prawaSzer) - 12;
  if (miejsce > 60) {
    ctx.textAlign = 'center';
    const t1 = `Etap ${nrEtapu + 1}: ${etap.nazwa}`;
    let t2 = `Uratuj ${porwanyEtapu(nrEtapu).kogo}!`;
    let k2 = '#ff9f9f';
    if (walka) {
      t2 = gracz.bron ? 'Bańka go zatrzyma – wtedy skacz mu na głowę!' : 'Skacz Gburkowi na głowę!';
      k2 = '#c77dff';
    } else if (klatka && klatka.otwarta) {
      t2 = 'Hurra!';
      k2 = '#3ddc97';
    }
    if (wyciszone) t2 += ' · dźwięk wył. (M)';
    for (const [t, rozm, kol, yy] of [[t1, fs, '#e4ddff', srodek - fs * 0.55], [t2, fs * 0.8, k2, srodek + fs * 0.6]]) {
      ctx.font = czcionka(rozm, true);
      const sz = ctx.measureText(t).width;
      if (sz > miejsce) ctx.font = czcionka(Math.max(8, (rozm * miejsce) / sz), true);
      ctx.fillStyle = kol;
      ctx.fillText(t, W / 2, yy);
    }
  }
}


// =====================================================
//   PRZYCISKI NA TELEFONIE
// =====================================================
function polozeniePrzyciskow() {
  const R = L.R;
  const y = L.H - R * 1.35;
  return {
    lewo: { x: R * 1.35, y, r: R },
    prawo: { x: R * 3.75, y, r: R },
    skok: { x: L.W - R * 1.55, y, r: R * 1.2 },
    strzal: { x: L.W - R * 4.2, y: y + R * 0.15, r: R * 0.95 },
  };
}

// Lewa połowa ekranu = bieg (lewo/prawo), prawa połowa = skok (i strzał, gdy masz bańkomiotacz)
function przyciskDotyku(x, y) {
  if (y < L.hudH) return null;
  const p = polozeniePrzyciskow();
  if (x > L.W / 2) {
    if (gracz && gracz.bron && x < (p.strzal.x + p.skok.x) / 2) return 'strzal';
    return 'skok';
  }
  return x < (p.lewo.x + p.prawo.x) / 2 ? 'lewo' : 'prawo';
}

function rysujKontrolki() {
  const p = polozeniePrzyciskow();
  const wcisniete = new Set(wskazniki.values());
  for (const [nazwa, q] of Object.entries(p)) {
    if (nazwa === 'strzal' && !(gracz && gracz.bron)) continue;
    const w = wcisniete.has(nazwa);
    const s = Math.round(q.r * 2);
    ctx.globalAlpha = w ? 0.6 : 0.32;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(q.x - q.r), Math.round(q.y - q.r), s, s);
    ctx.globalAlpha = w ? 0.95 : 0.75;
    ctx.fillStyle = '#16143a';
    const r = Math.round(q.r * 0.4);
    ctx.beginPath();
    if (nazwa === 'lewo') {
      ctx.moveTo(q.x - r, q.y);
      ctx.lineTo(q.x + r * 0.6, q.y - r);
      ctx.lineTo(q.x + r * 0.6, q.y + r);
    } else if (nazwa === 'prawo') {
      ctx.moveTo(q.x + r, q.y);
      ctx.lineTo(q.x - r * 0.6, q.y - r);
      ctx.lineTo(q.x - r * 0.6, q.y + r);
    } else if (nazwa === 'skok') {
      ctx.moveTo(q.x, q.y - r);
      ctx.lineTo(q.x + r, q.y + r * 0.5);
      ctx.lineTo(q.x - r, q.y + r * 0.5);
    } else {
      ctx.arc(q.x, q.y, r * 0.8, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}


// =====================================================
//   DUŻY NAPIS (tytuł etapu, „Gburek!”)
// =====================================================
function rysujBaner() {
  if (!baner || (stan !== 'gra' && stan !== 'pauza')) return;
  const t = baner.czas;
  const alfa = Math.max(0, Math.min(1, t / 0.3, (baner.dlugosc - t) / 0.5));
  const fs = L.fs;
  const y = L.hudH + Math.min(L.H - L.hudH, WIERSZE * L.T) * 0.2;
  ctx.globalAlpha = alfa;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(fs * 2.1, true);
  tekstZObwodka(baner.tytul, L.W / 2, y, '#ffd23f', 7);
  ctx.font = czcionka(fs * 1.3, true);
  tekstZObwodka(baner.pod, L.W / 2, y + fs * 2.2, '#ffffff', 6);
  if (baner.rada) {
    ctx.font = czcionka(fs * 0.95, true);
    zawijajTekst(baner.rada, Math.min(L.W - 40, 620)).forEach((l, i) => {
      tekstZObwodka(l, L.W / 2, y + fs * 3.9 + i * fs * 1.3, '#e8e6ff', 5);
    });
  }
  ctx.globalAlpha = 1;
}


// =====================================================
//   OKIENKA (start, wybór bohatera, pauza, podsumowanie, koniec)
// =====================================================
function elementMenu(fs) {
  return { przycisk: 'menu', tekst: '← Menu gier (Q)', rozmiar: fs * 0.85, gruba: true, kolor: '#e4ddff' };
}

function wymiaryKart(el, wewn) {
  const n = el.bohaterowie.length;
  const odstep = el.rozmiar;
  const cw = Math.min(el.rozmiar * 13, (wewn - odstep * (n - 1)) / n);
  ctx.font = czcionka(el.rozmiar * 0.8, false);
  let linie = 1;
  for (const id of el.bohaterowie) linie = Math.max(linie, zawijajTekst(BOHATEROWIE[id].opis, cw - el.rozmiar).length);
  const ch = el.rozmiar * (0.6 + 5 + 0.4 + 1.6 + 1.3) + linie * el.rozmiar * 1.1 + el.rozmiar * 0.6;
  return { cw, ch, odstep };
}

function wysokoscElementu(el, wewn) {
  if (el.odstep) return el.odstep;
  if (el.etapy) {
    const n = ETAPY.length;
    const bs = Math.min(el.rozmiar * 3.4, (wewn - el.rozmiar * 0.5 * (n - 1)) / n);
    return bs + el.rozmiar * 1.5;
  }
  if (el.bohaterowie) return wymiaryKart(el, wewn).ch;
  if (el.trojka) return el.rozmiar * 5;
  if (el.gwiazdy3) return el.rozmiar * 3;
  return 0;
}

function rysujOkienko(elementy, przyciemnienie = 0.55, zmniejszone = false) {
  const szer = Math.min(L.W - 20, 600);
  const wewn = szer - 44;
  const wiersze = [];
  let wys = 0;
  for (const el of elementy) {
    if (el.tekst === undefined) {
      const h = wysokoscElementu(el, wewn);
      wiersze.push({ ...el, h });
      wys += h;
      continue;
    }
    ctx.font = czcionka(el.rozmiar, el.gruba);
    for (const l of zawijajTekst(el.tekst, wewn)) {
      const h = el.przycisk ? el.rozmiar * 2.5 : el.rozmiar * 1.35;
      wiersze.push({ ...el, tekst: l, h });
      wys += h;
    }
  }
  const dostepne = L.H - L.hudH - 12;
  if (wys + 44 > dostepne && !zmniejszone) {
    const k = Math.max(0.45, (dostepne - 44) / wys);
    rysujOkienko(elementy.map((el) => ({ ...el, rozmiar: el.rozmiar && el.rozmiar * k, odstep: el.odstep && el.odstep * k })),
      przyciemnienie, true);
    return;
  }

  ctx.fillStyle = `rgba(5, 6, 18, ${przyciemnienie})`;
  ctx.fillRect(0, L.hudH, L.W, L.H - L.hudH);
  const panelH = wys + 44;
  const x = (L.W - szer) / 2;
  const y = Math.max(L.hudH + 6, L.hudH + (L.H - L.hudH - panelH) / 2);
  ramka(x, y, szer, panelH, '#1d1a48', '#5b4fd6', 4);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let yy = y + 22;
  for (const w of wiersze) {
    if (w.odstep) {
      yy += w.odstep;
      continue;
    }
    if (w.etapy) rysujWyborEtapu(yy, wewn, w);
    else if (w.bohaterowie) rysujKartyBohaterow(yy, wewn, w);
    else if (w.trojka) rysujTrojke(yy, w);
    else if (w.gwiazdy3) rysujGwiazdyPodsumowania(yy, w);
    if (w.tekst === undefined) {
      yy += w.h;
      continue;
    }
    ctx.font = czcionka(w.rozmiar, w.gruba);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = w.alfa ?? 1;
    if (w.przycisk) {
      const bw = ctx.measureText(w.tekst).width + w.rozmiar * 2;
      const bh = w.rozmiar * 2;
      const bxx = L.W / 2 - bw / 2;
      const byy = yy + (w.h - bh) / 2;
      ramka(bxx, byy, bw, bh, w.tlo || '#2c2766', '#6a5ee8', 2);
      przyciski.push({ x: bxx, y: byy, w: bw, h: bh, akcja: w.przycisk });
    }
    ctx.fillStyle = w.kolor || '#e8e6ff';
    ctx.fillText(w.tekst, L.W / 2, yy + w.h / 2);
    ctx.globalAlpha = 1;
    yy += w.h;
  }
}

function rysujWyborEtapu(y0, wewn, el) {
  const n = ETAPY.length;
  const odstep = el.rozmiar * 0.5;
  const bs = Math.min(el.rozmiar * 3.4, (wewn - odstep * (n - 1)) / n);
  const x0 = L.W / 2 - (n * bs + (n - 1) * odstep) / 2;
  const gw = sprite('gwiazdka', GWIAZDKA);
  for (let i = 0; i < n; i++) {
    const x = Math.round(x0 + i * (bs + odstep));
    const y = Math.round(y0);
    const otwarty = etapOtwarty(i);
    const wybrany = i === wybranyEtap;
    const s = SWIATY[ETAPY[i].swiat] || SWIATY.laka;
    ramka(x, y, bs, bs, otwarty ? s.niebo[0] : '#2a2650', wybrany ? '#ffd23f' : '#4a4290', wybrany ? 3 : 2);
    if (otwarty) {
      ctx.fillStyle = s.niebo[1];
      ctx.fillRect(x + 6, y + bs * 0.4, bs - 12, bs * 0.3);
      ctx.fillStyle = s.ziemia;
      ctx.fillRect(x + 6, y + bs * 0.72, bs - 12, bs * 0.28 - 6);
      ctx.fillStyle = s.wierzch;
      ctx.fillRect(x + 6, y + bs * 0.68, bs - 12, bs * 0.08);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = czcionka(bs * 0.45, true);
      tekstZObwodka(String(i + 1), x + bs / 2, y + bs * 0.42, '#ffffff', 4);
    } else {
      const k = Math.max(2, Math.round(bs / 16));
      const kx = x + bs / 2;
      const ky = y + bs * 0.55;
      ctx.fillStyle = '#8a83c2';
      ctx.fillRect(kx - 2 * k, ky - 4 * k, k, 3 * k);
      ctx.fillRect(kx + k, ky - 4 * k, k, 3 * k);
      ctx.fillRect(kx - 2 * k, ky - 5 * k, 4 * k, k);
      ctx.fillRect(kx - 3 * k, ky - k, 6 * k, 5 * k);
    }
    const zdobyte = postep.gwiazdki[i] || [];
    const kg = Math.max(1, Math.round(el.rozmiar / 11));
    for (let j = 0; j < 3; j++) {
      ctx.globalAlpha = zdobyte[j] ? 1 : 0.2;
      ikonaNaEkranie(gw, x + bs / 2 + (j - 1) * (gw.w * kg + 2) - (gw.w * kg) / 2, y + bs + el.rozmiar * 0.25, kg);
    }
    ctx.globalAlpha = 1;
    przyciski.push({ x, y, w: bs, h: bs + el.rozmiar * 1.3, akcja: `etap:${i}` });
  }
}

function rysujKartyBohaterow(y0, wewn, el) {
  const { cw, ch, odstep } = wymiaryKart(el, wewn);
  const ids = el.bohaterowie;
  const n = ids.length;
  const x0 = L.W / 2 - (n * cw + (n - 1) * odstep) / 2;
  const fs = el.rozmiar;
  ids.forEach((id, i) => {
    const bh = BOHATEROWIE[id];
    const x = x0 + i * (cw + odstep);
    const wybrany = id === wybranyBohater;
    ramka(x, y0, cw, ch, wybrany ? '#2c2766' : '#201c50', wybrany ? bh.wyglad.koszulka : '#3e3780', wybrany ? 3 : 2);
    const fh = fs * 5;
    const stopy = y0 + fs * 0.6 + fh;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(x + cw / 2 - fh * 0.2), Math.round(stopy), Math.round(fh * 0.4), Math.max(2, Math.round(fh / 22)));
    postacNaEkranie(id, x + cw / 2, stopy, fh, wybrany ? 'biegnie' : 'stoi', czas * 16, 1, i);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let yy = stopy + fs * 0.4 + fs * 0.8;
    ctx.font = czcionka(fs * 1.3, true);
    tekstZObwodka(bh.imie, x + cw / 2, yy, bh.wyglad.koszulka, 3);
    yy += fs * 1.45;
    ctx.font = czcionka(fs * 0.95, true);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(bh.moc, x + cw / 2, yy);
    yy += fs * 1.2;
    ctx.font = czcionka(fs * 0.8, false);
    ctx.fillStyle = '#cfc8ff';
    for (const l of zawijajTekst(bh.opis, cw - fs)) {
      ctx.fillText(l, x + cw / 2, yy);
      yy += fs * 1.1;
    }
    przyciski.push({ x, y: y0, w: cw, h: ch, akcja: `bohater:${id}` });
  });
}

function rysujTrojke(y0, el) {
  const h = el.rozmiar * 4.4;
  const stopy = y0 + el.rozmiar * 4.7;
  const odstep = el.rozmiar * 3.6;
  KOLEJNOSC_BOHATEROW.forEach((id, i) => {
    const x = L.W / 2 + (i - 1) * odstep;
    const skok = el.trojka === 'cieszy' ? Math.round(Math.abs(Math.sin(czas * 5 + i * 1.3)) * el.rozmiar * 0.6) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(x - h * 0.18), Math.round(stopy), Math.round(h * 0.36), 3);
    postacNaEkranie(id, x, stopy - skok, h, el.trojka, 0, i === 2 ? -1 : 1, i * 1.1);
  });
}

function rysujGwiazdyPodsumowania(y0, el) {
  const gw = sprite('gwiazdka', GWIAZDKA);
  const k = Math.max(2, Math.round(el.rozmiar / 5));
  for (let i = 0; i < 3; i++) {
    const g = gwiazdki[i];
    const x = L.W / 2 + (i - 1) * (gw.w * k + k * 4) - (gw.w * k) / 2;
    ctx.globalAlpha = g && g.zebrana ? 1 : g && g.miala ? 0.4 : 0.13;
    ikonaNaEkranie(gw, x, y0 + el.rozmiar * 0.3, k);
  }
  ctx.globalAlpha = 1;
}

function rysujStart() {
  const fs = L.fs;
  const e = ETAPY[wybranyEtap];
  const p = porwanyEtapu(wybranyEtap);
  rysujOkienko([
    { trojka: 'macha', rozmiar: fs },
    { tekst: 'Na ratunek!', rozmiar: fs * 2.4, gruba: true, kolor: '#ffd23f' },
    { tekst: 'Zły czarodziej Gburek porywa przyjaciół i zamyka ich w klatkach. Biegnij, skacz i uwolnij ich!', rozmiar: fs * 0.95, kolor: '#cfc8ff' },
    { tekst: 'Szukaj plecaka rakietowego, bańkomiotacza i magnesu!', rozmiar: fs * 0.85, kolor: '#4cc9f0' },
    { odstep: fs * 0.5 },
    { etapy: true, rozmiar: fs },
    { tekst: `Etap ${wybranyEtap + 1}: ${e.nazwa}`, rozmiar: fs * 1.1, gruba: true, kolor: '#ffffff' },
    { tekst: `${p.dziewczynka ? 'Porwana' : 'Porwany'}: ${p.imie}`, rozmiar: fs * 0.9, kolor: '#ff9f9f' },
    { odstep: fs * 0.4 },
    { tekst: 'Kliknij etap albo naciśnij SPACJĘ', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() },
    { tekst: '← → wybór etapu', rozmiar: fs * 0.75, kolor: '#8a83c2' },
    ...(rekord > 0 ? [{ tekst: `Rekord: ${rekord} pkt`, rozmiar: fs * 0.9, gruba: true, kolor: '#3ddc97' }] : []),
    { odstep: fs * 0.3 },
    elementMenu(fs),
  ], 0.35);
}

function rysujWybor() {
  const fs = L.fs;
  const e = ETAPY[wybranyEtap];
  const p = porwanyEtapu(wybranyEtap);
  rysujOkienko([
    { tekst: `Etap ${wybranyEtap + 1}: ${e.nazwa}`, rozmiar: fs * 1.5, gruba: true, kolor: '#ffd23f' },
    { tekst: `Gburek porwał ${p.kogo}!`, rozmiar: fs * 1.1, gruba: true, kolor: '#ff9f9f' },
    { tekst: 'Kto idzie na ratunek?', rozmiar: fs * 1.05, kolor: '#ffffff' },
    { odstep: fs * 0.5 },
    { bohaterowie: dostepniBohaterowie(wybranyEtap), rozmiar: fs },
    { odstep: fs * 0.5 },
    { tekst: 'Kliknij bohatera albo SPACJA – start!', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() },
    { tekst: '← → wybór bohatera', rozmiar: fs * 0.75, kolor: '#8a83c2' },
    ...(kontynuacja ? [{ tekst: `Punkty w tej przygodzie: ${punkty}`, rozmiar: fs * 0.9, kolor: '#ffd23f' }] : []),
    { odstep: fs * 0.2 },
    { przycisk: 'wstecz', tekst: '← Wróć (Esc)', rozmiar: fs * 0.85, gruba: true, kolor: '#e4ddff' },
  ], 0.35);
}

function rysujPauze() {
  const fs = L.fs;
  rysujOkienko([
    { tekst: 'Pauza', rozmiar: fs * 2.1, gruba: true, kolor: '#4cc9f0' },
    { odstep: fs * 0.5 },
    { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby grać dalej', rozmiar: fs, gruba: true, kolor: '#ffffff', alfa: migotanie() },
    { odstep: fs * 0.3 },
    { tekst: '← → bieg · ↑ / SPACJA skok · X strzał bańką', rozmiar: fs * 0.8, kolor: '#a9a3d9' },
    { odstep: fs * 0.3 },
    { przycisk: 'od-nowa', tekst: 'Zacznij etap od nowa (R)', rozmiar: fs * 0.9, gruba: true, kolor: '#e4ddff' },
    { przycisk: 'wyjdz', tekst: 'Wybierz inny etap', rozmiar: fs * 0.9, gruba: true, kolor: '#e4ddff' },
    { tekst: 'M – wycisz / włącz dźwięk', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.3 },
    elementMenu(fs),
  ]);
}

function rysujPodsumowanie() {
  const fs = L.fs;
  const p = porwanyEtapu(nrEtapu);
  const ostatni = nrEtapu + 1 >= ETAPY.length;
  const wszystkie = gwiazdki.every((g) => g.zebrana || g.miala);
  const mozna = czas - zmianaStanu > 1;
  rysujOkienko([
    { tekst: `${p.imie} ${p.dziewczynka ? 'uratowana' : 'uratowany'}!`, rozmiar: fs * 2, gruba: true, kolor: '#3ddc97' },
    { tekst: `Etap ${nrEtapu + 1}: ${etap.nazwa}`, rozmiar: fs * 0.9, kolor: '#a9a3d9' },
    { odstep: fs * 0.3 },
    { gwiazdy3: true, rozmiar: fs },
    { tekst: `Monety: ${monety} · Pokonani wrogowie: ${pokonani}`, rozmiar: fs, kolor: '#e8e6ff' },
    { tekst: `Czas: ${formatCzasu(czasEtapu)} · Bonus za czas: +${bonusCzasu}`, rozmiar: fs, kolor: '#e8e6ff' },
    { odstep: fs * 0.4 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.6, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.15, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekord} pkt`, rozmiar: fs * 0.9, kolor: '#a9a3d9' },
    ...(wszystkie ? [] : [{ tekst: 'Brakuje gwiazdek? Może inny bohater je zdobędzie!', rozmiar: fs * 0.85, kolor: '#c77dff' }]),
    { odstep: fs * 0.4 },
    mozna
      ? { przycisk: 'dalej', tekst: ostatni ? 'Zakończ przygodę ▶ (SPACJA)' : 'Następny etap ▶ (SPACJA)', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', tlo: '#1f6b4e' }
      : { odstep: fs * 2.6 },
    elementMenu(fs),
  ]);
}

function rysujFinal() {
  const fs = L.fs;
  let suma = 0;
  for (let i = 0; i < ETAPY.length; i++) suma += ileGwiazdek(i);
  const wszystkie = ETAPY.length * 3;
  rysujOkienko([
    { trojka: 'cieszy', rozmiar: fs },
    { tekst: 'Hurra! Wszyscy uratowani!', rozmiar: fs * 2, gruba: true, kolor: '#ffd23f' },
    { tekst: 'Gburek zamienił się w żabkę i uciekł. Helenka, Seweryn i Franek znów są razem!', rozmiar: fs * 0.95, kolor: '#cfc8ff' },
    { odstep: fs * 0.4 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.6, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.15, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekord} pkt`, rozmiar: fs * 0.9, kolor: '#a9a3d9' },
    { tekst: `Wszystkie gwiazdki: ${suma} z ${wszystkie}`, rozmiar: fs, gruba: true, kolor: '#ffe14d' },
    suma < wszystkie
      ? { tekst: 'Zagraj innymi bohaterami i znajdź resztę gwiazdek!', rozmiar: fs * 0.85, kolor: '#c77dff' }
      : { tekst: 'Masz wszystkie gwiazdki! Jesteś mistrzem!', rozmiar: fs * 0.85, kolor: '#3ddc97' },
    { odstep: fs * 0.4 },
    czas - zmianaStanu > 1.5
      ? { tekst: 'Kliknij albo SPACJA – wróć do wyboru etapów', rozmiar: fs, gruba: true, kolor: '#ffffff', alfa: migotanie() }
      : { odstep: fs * 1.35 },
    { odstep: fs * 0.3 },
    elementMenu(fs),
  ], 0.4);
}


// =====================================================
//   RYSOWANIE CAŁEGO EKRANU
// =====================================================
function rysuj() {
  przyciski = [];
  rysujSwiat();
  rysujBaner();
  rysujPasek();
  if (stan === 'gra' && dotykowe) rysujKontrolki();
  if (stan === 'start') rysujStart();
  else if (stan === 'wybor') rysujWybor();
  else if (stan === 'pauza') rysujPauze();
  else if (stan === 'podsumowanie') rysujPodsumowanie();
  else if (stan === 'final') rysujFinal();
}

dopasujRozmiar();
pokazPodglad(wybranyEtap);
requestAnimationFrame(petla);
