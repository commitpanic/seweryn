'use strict';

// =====================================================
//   KUCHNIA HELENKI – rysowanie
//   (kuchnia, garnki, składniki, zwierzaki, porcje)
// =====================================================

const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

const CZCIONKA = '"Chalkboard SE", "Comic Sans MS", "Segoe UI", system-ui, sans-serif';
const CZCIONKA_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// Naczynia: R to promień otworu, e to jak bardzo spłaszczony jest otwór (perspektywa)
const NACZYNIA = {
  garnek:   { R: 150, e: 0.36, doNazwa: 'do garnka', wielkoscKawalka: 58 },
  miska:    { R: 160, e: 0.36, doNazwa: 'do miski', wielkoscKawalka: 62 },
  patelnia: { R: 140, e: 0.5,  doNazwa: 'na patelnię', wielkoscKawalka: 50 },
  pizza:    { R: 175, e: 0.72, doNazwa: 'na pizzę', wielkoscKawalka: 50 },
  dzbanek:  { R: 92,  e: 0.3,  doNazwa: 'do dzbanka', wielkoscKawalka: 46 },
};


// =====================================================
//   NARZĘDZIA
// =====================================================
function hexNaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mieszanie dwóch kolorów: t = 0 → kolor a, t = 1 → kolor b
function mieszajKolory(a, b, t) {
  if (!a) return b;
  if (!b) return a;
  t = Math.max(0, Math.min(1, t));
  const A = hexNaRgb(a);
  const B = hexNaRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function przyciemnij(hex, ile) {
  return mieszajKolory(hex, '#000000', 1 - ile);
}

function rozjasnij(hex, ile) {
  return mieszajKolory(hex, '#ffffff', ile);
}

function elipsa(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, Math.abs(rx)), Math.max(0.01, Math.abs(ry)), 0, 0, Math.PI * 2);
}

function kolo(x, y, r) {
  elipsa(x, y, r, r);
}

// Prostokąt z zaokrąglonymi rogami
function zaokraglony(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
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

function napis(tekst, x, y, rozmiar, kolor, wyrownanie = 'center', obrys = null) {
  ctx.font = `bold ${rozmiar}px ${CZCIONKA}`;
  ctx.textAlign = wyrownanie;
  ctx.textBaseline = 'middle';
  if (obrys) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = rozmiar * 0.22;
    ctx.strokeStyle = obrys;
    ctx.strokeText(tekst, x, y);
  }
  ctx.fillStyle = kolor;
  ctx.fillText(tekst, x, y);
}

// Losowe liczby, które za każdym razem są takie same (np. kropki na cieście)
function losowaZNasiona(nasiono) {
  let s = nasiono;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}


// =====================================================
//   EMOTKI
//   Każdą emotkę rysujemy raz na małym płótnie i potem tylko je kopiujemy.
//   Dzięki temu można ją też pokroić na plasterki!
// =====================================================
const pamiecEmotek = {};

function emotka(e) {
  if (pamiecEmotek[e]) return pamiecEmotek[e];
  const B = 160;
  const c = document.createElement('canvas');
  c.width = B;
  c.height = B;
  const g = c.getContext('2d');
  g.font = `116px ${CZCIONKA_EMOJI}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(e, B / 2, B / 2 + 6);
  // Szukamy, gdzie naprawdę jest obrazek (żeby dobrze go wyśrodkować i pokroić)
  let x0 = B, y0 = B, x1 = -1, y1 = -1;
  try {
    const d = g.getImageData(0, 0, B, B).data;
    for (let y = 0; y < B; y++) {
      for (let x = 0; x < B; x++) {
        if (d[(y * B + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
  } catch (err) {
    // przeglądarka nie pozwala czytać pikseli – trudno, bierzemy całość
  }
  if (x1 < x0) {
    x0 = 16; y0 = 16; x1 = B - 16; y1 = B - 16;
  }
  const wynik = { c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  pamiecEmotek[e] = wynik;
  return wynik;
}

// Cała emotka. wielkosc = dłuższy bok.
function rysujEmotke(e, x, y, wielkosc, obrot = 0, alfa = 1) {
  const o = emotka(e);
  const k = wielkosc / Math.max(o.w, o.h);
  ctx.save();
  ctx.translate(x, y);
  if (obrot) ctx.rotate(obrot);
  ctx.globalAlpha *= alfa;
  ctx.drawImage(o.c, o.x, o.y, o.w, o.h, -o.w * k / 2, -o.h * k / 2, o.w * k, o.h * k);
  ctx.restore();
}

// Jeden plasterek emotki: czesc = który (od lewej), z = na ile części pokrojona
// (x, y) to środek całej emotki, a plasterek rysuje się tam, gdzie był w całości (+ przesunięcie dx)
function rysujPlasterek(e, czesc, z, x, y, wielkosc, dx = 0, obrot = 0, alfa = 1) {
  const o = emotka(e);
  const k = wielkosc / Math.max(o.w, o.h);
  const sw = o.w / z;
  ctx.save();
  ctx.translate(x, y);
  if (obrot) ctx.rotate(obrot);
  ctx.globalAlpha *= alfa;
  ctx.drawImage(o.c, o.x + sw * czesc, o.y, sw + 0.5, o.h,
    -o.w * k / 2 + sw * k * czesc + dx, -o.h * k / 2, (sw + 0.5) * k, o.h * k);
  ctx.restore();
}

// Kawałek leżący osobno (np. w garnku): plasterek przesunięty tak, żeby jego środek był w (x, y)
function rysujKawalek(e, czesc, z, x, y, wielkosc, obrot = 0, alfa = 1) {
  if (e[0] === '*') {
    // rysunek (np. salami) – nie kroimy go, tylko rysujemy trochę mniejszy
    rysujObrazek(e, x, y, wielkosc * 0.75, obrot, alfa);
    return;
  }
  if (czesc < 0) {
    rysujEmotke(e, x, y, wielkosc, obrot, alfa);
    return;
  }
  const o = emotka(e);
  const k = wielkosc / Math.max(o.w, o.h);
  const sw = o.w / z;
  ctx.save();
  ctx.translate(x, y);
  if (obrot) ctx.rotate(obrot);
  ctx.globalAlpha *= alfa;
  ctx.drawImage(o.c, o.x + sw * czesc, o.y, sw + 0.5, o.h, -sw * k / 2, -o.h * k / 2, (sw + 0.5) * k, o.h * k);
  ctx.restore();
}

// Szerokość narysowanej emotki (potrzebne, żeby wiedzieć, gdzie kroić)
function szerokoscEmotki(e, wielkosc) {
  const o = emotka(e);
  return o.w * wielkosc / Math.max(o.w, o.h);
}


// =====================================================
//   RYSUNKI – rzeczy, których nie ma w emotkach
//   Każdy rysunek mieści się w kwadracie 100 × 100 ze środkiem w (0, 0)
// =====================================================
const RYSUNKI = {
  // dzbanek z wodą – dziobek w prawym górnym rogu, tamtędy leje się woda
  woda() {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6f9fc2';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(-33, 2, 17, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-32, -38);
    ctx.lineTo(26, -38);
    ctx.lineTo(44, -48);
    ctx.lineTo(34, -28);
    ctx.lineTo(32, 38);
    ctx.quadraticCurveTo(32, 46, 24, 46);
    ctx.lineTo(-24, 46);
    ctx.quadraticCurveTo(-32, 46, -32, 38);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232, 246, 255, 0.95)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#62bdf0';
    ctx.beginPath();
    ctx.moveTo(-40, -12);
    for (let x = -40; x <= 50; x += 10) ctx.lineTo(x, -12 + Math.sin(x * 0.2) * 3);
    ctx.lineTo(50, 50);
    ctx.lineTo(-40, 50);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#6f9fc2';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    zaokraglony(-24, -30, 7, 60, 3);
    ctx.fill();
  },

  // torebka z mąką
  maka() {
    ctx.fillStyle = '#f2e4c6';
    ctx.strokeStyle = '#c4aa7c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, -30);
    ctx.lineTo(30, -30);
    ctx.lineTo(32, 44);
    ctx.lineTo(-32, 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e7d4ad';
    ctx.beginPath();
    ctx.moveTo(-30, -30);
    ctx.lineTo(-24, -44);
    ctx.lineTo(24, -44);
    ctx.lineTo(30, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    elipsa(0, -42, 22, 7);
    ctx.fill();
    ctx.fillStyle = '#e25b45';
    ctx.fillRect(-31, 0, 62, 20);
    napis('MĄKA', 0, 11, 13, '#ffffff');
  },

  // solniczka (dziurki na górze)
  sol() {
    zaokraglony(-22, -18, 44, 62, 12);
    ctx.fillStyle = 'rgba(240, 250, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#9bb4c6';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    zaokraglony(-18, 6, 36, 34, 9);
    ctx.fill();
    ctx.fillStyle = '#dfe8ef';
    for (let i = 0; i < 8; i++) {
      kolo(-12 + (i % 4) * 8, 14 + Math.floor(i / 4) * 12, 1.6);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(-24, 0, 24, 0);
    g.addColorStop(0, '#9aa3ad');
    g.addColorStop(0.4, '#e9edf2');
    g.addColorStop(1, '#8b939c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-24, -16);
    ctx.lineTo(-24, -30);
    ctx.quadraticCurveTo(0, -50, 24, -30);
    ctx.lineTo(24, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5b636c';
    for (const [x, y] of [[-9, -33], [0, -36], [9, -33]]) {
      kolo(x, y, 2.4);
      ctx.fill();
    }
    napis('S', 0, -4, 14, '#9bb4c6');
  },

  // miseczka z sosem pomidorowym
  sos() {
    ctx.strokeStyle = '#b9a58f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(40, -40);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -4, 42, 40, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#d9d2c8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#6fb3d9';
    ctx.fillRect(-38, 10, 76, 5);
    ctx.fillStyle = '#d8321f';
    elipsa(0, -4, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#f0634c';
    elipsa(-10, -7, 12, 4);
    ctx.fill();
  },

  // słoik z dżemem
  dzem() {
    zaokraglony(-30, -22, 60, 66, 12);
    ctx.fillStyle = '#c8173f';
    ctx.fill();
    ctx.strokeStyle = '#8f0f2c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    zaokraglony(-22, -14, 7, 46, 3);
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    elipsa(4, 14, 20, 16);
    ctx.fill();
    rysujEmotke('🍓', 4, 14, 22);
    // ściereczka w kratkę na pokrywce
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-38, -24);
    ctx.lineTo(-30, -42);
    ctx.lineTo(30, -42);
    ctx.lineTo(38, -24);
    ctx.quadraticCurveTo(0, -18, -38, -24);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#e8303f';
    for (let x = -40; x < 40; x += 10) {
      for (let y = -44; y < -16; y += 10) {
        if (((x + y) / 10) % 2 === 0) ctx.fillRect(x, y, 10, 10);
      }
    }
    ctx.restore();
  },

  // plasterek salami
  salami() {
    kolo(0, 0, 44);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.strokeStyle = '#8e2a20';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#f2a59a';
    for (const [x, y, r] of [[-16, -14, 5], [12, -20, 4], [20, 8, 5], [-6, 16, 4], [-22, 10, 3], [4, -2, 3]]) {
      kolo(x, y, r);
      ctx.fill();
    }
  },

  // plasterek pieczarki (emotka 🍄 to muchomor – tego na pizzę nie kładziemy!)
  pieczarka() {
    ctx.fillStyle = '#f3e6d2';
    zaokraglony(-14, -4, 28, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9ab88';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#d9b98f';
    ctx.beginPath();
    ctx.moveTo(-44, 2);
    ctx.bezierCurveTo(-44, -44, 44, -44, 44, 2);
    ctx.quadraticCurveTo(0, -8, -44, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a98560';
    ctx.beginPath();
    ctx.moveTo(-40, 1);
    ctx.quadraticCurveTo(0, -10, 40, 1);
    ctx.quadraticCurveTo(0, 6, -40, 1);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    elipsa(-14, -22, 12, 6);
    ctx.fill();
  },

  // wałek do ciasta
  walek() {
    ctx.save();
    ctx.rotate(-0.5);
    ctx.fillStyle = '#b8743c';
    zaokraglony(-50, -6, 16, 12, 5);
    ctx.fill();
    zaokraglony(34, -6, 16, 12, 5);
    ctx.fill();
    const g = ctx.createLinearGradient(0, -14, 0, 14);
    g.addColorStop(0, '#f3c98d');
    g.addColorStop(0.5, '#e2a860');
    g.addColorStop(1, '#c68a46');
    ctx.fillStyle = g;
    zaokraglony(-36, -14, 72, 28, 10);
    ctx.fill();
    ctx.restore();
  },

  // mały piekarnik
  piec() {
    zaokraglony(-42, -38, 84, 76, 10);
    ctx.fillStyle = '#eef0f3';
    ctx.fill();
    ctx.strokeStyle = '#a9b0bb';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#d9dde3';
    ctx.fillRect(-40, -36, 80, 16);
    ctx.fillStyle = '#ff9f1c';
    for (const x of [-24, -10]) {
      kolo(x, -28, 4);
      ctx.fill();
    }
    zaokraglony(-32, -12, 64, 42, 6);
    ctx.fillStyle = '#ffb347';
    ctx.fill();
    ctx.strokeStyle = '#8b6b4a';
    ctx.stroke();
  },
};

// Skąd wylewa się płyn albo sypie się proszek (w kwadracie 100 × 100, przed obróceniem)
const WYLOTY = {
  woda: [44, -48],
  mleko: [28, -44],
  miod: [22, -38],
  maka: [0, -44],
  sol: [0, -44],
};

// Emotka albo rysunek z gwiazdką
function rysujObrazek(o, x, y, wielkosc, obrot = 0, alfa = 1) {
  if (o[0] === '*') {
    const f = RYSUNKI[o.slice(1)];
    if (!f) return;
    ctx.save();
    ctx.translate(x, y);
    if (obrot) ctx.rotate(obrot);
    ctx.globalAlpha *= alfa;
    const k = wielkosc / 100;
    ctx.scale(k, k);
    f();
    ctx.restore();
  } else {
    rysujEmotke(o, x, y, wielkosc, obrot, alfa);
  }
}

function rysujSkladnik(sk, x, y, wielkosc, obrot = 0, alfa = 1) {
  const d = SKLADNIKI[sk];
  if (d) rysujObrazek(d.obrazek, x, y, wielkosc, obrot, alfa);
}


// =====================================================
//   NARZĘDZIA KUCHENNE (nóż, łyżka, trzepaczka, wałek)
// =====================================================
// Nóż stoi pionowo, czubkiem w dół; (x, y) to czubek ostrza
function rysujNoz(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(34, -120);
  ctx.lineTo(10, -120);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(-14, 0, 14, 0);
  g.addColorStop(0, '#f4f6f8');
  g.addColorStop(0.6, '#c9d1da');
  g.addColorStop(1, '#9aa5b1');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-14, -18);
  ctx.lineTo(-14, -112);
  ctx.lineTo(14, -112);
  ctx.lineTo(14, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8c97a3';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ef6f5e';
  zaokraglony(-11, -186, 22, 78, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (const yy of [-170, -150, -130]) {
    kolo(0, yy, 3);
    ctx.fill();
  }
  ctx.restore();
}

// Łyżka albo trzepaczka: (x, y) to miejsce w garnku, a trzonek wystaje w prawo do góry
function rysujLyzke(x, y, rodzaj = 'lyzka') {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  if (rodzaj === 'trzepaczka') {
    ctx.strokeStyle = '#b9c3cd';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -18, 10 + Math.abs(i) * 4, 30, 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#ff7eb6';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(26, -52);
    ctx.lineTo(90, -150);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#c88a4c';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(90, -160);
    ctx.stroke();
    ctx.fillStyle = '#d89a5c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 26, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b97a3e';
    ctx.beginPath();
    ctx.ellipse(-1, 2, 11, 17, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Wałek leży poziomo, (x, y) to jego środek
function rysujWalek(x, y, obrot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  elipsa(0, 26, 150, 10);
  ctx.fill();
  ctx.fillStyle = '#b8743c';
  zaokraglony(-190, -9, 52, 18, 8);
  ctx.fill();
  zaokraglony(138, -9, 52, 18, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -24, 0, 24);
  g.addColorStop(0, '#f6d29b');
  g.addColorStop(0.45, '#e5ac64');
  g.addColorStop(1, '#bf8340');
  ctx.fillStyle = g;
  zaokraglony(-140, -24, 280, 48, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 95, 40, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const xx = -120 + (((i * 48 + obrot * 40) % 240) + 240) % 240;
    ctx.beginPath();
    ctx.moveTo(xx, -20);
    ctx.lineTo(xx, 20);
    ctx.stroke();
  }
  ctx.restore();
}

// Deska do krojenia
function rysujDeske(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  zaokraglony(-172, -62, 352, 140, 30);
  ctx.fill();
  ctx.fillStyle = '#b97b45';
  zaokraglony(-176, -66, 352, 136, 30);
  ctx.fill();
  ctx.fillStyle = '#dba46a';
  zaokraglony(-176, -74, 352, 132, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 100, 50, 0.35)';
  ctx.lineWidth = 2;
  for (const yy of [-48, -22, 6, 32]) {
    ctx.beginPath();
    ctx.moveTo(-140, yy);
    ctx.bezierCurveTo(-60, yy - 6, 40, yy + 6, 140, yy);
    ctx.stroke();
  }
  ctx.fillStyle = '#b97b45';
  zaokraglony(130, -20, 26, 14, 7);
  ctx.fill();
  ctx.restore();
}


// =====================================================
//   NACZYNIA
//   (0, 0) to środek otworu naczynia
// =====================================================
// Jak głęboko w naczyniu jest powierzchnia (płyn albo kawałki)
function glebokoscPowierzchni(n) {
  switch (n.typ) {
    case 'garnek': return n.plyn > 0 ? 6 + (1 - n.plyn) * 40 : 30;
    case 'miska': return n.plyn > 0 ? 6 + (1 - n.plyn) * 40 : 30;
    case 'dzbanek': return 26 + (1 - n.plyn) * 196;
    default: return 0;
  }
}

function rysujNaczynie(n, x, y, s = 1, czas = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (n.typ) {
    case 'garnek': rysujGarnek(n, czas); break;
    case 'miska': rysujMiske(n, czas); break;
    case 'patelnia': rysujPatelnie(n, czas); break;
    case 'pizza': rysujPizze(n); break;
    case 'dzbanek': rysujDzbanek(n, czas); break;
  }
  ctx.restore();
}

// Palnik kuchenki pod garnkiem / patelnią. dol = gdzie jest dno naczynia
function rysujPalnik(n, R, dol, czas) {
  if (n.naStole) {
    // na stole stoi sam garnek, bez kuchenki – tylko podkładka
    ctx.fillStyle = '#c98d55';
    elipsa(0, dol + 6, R * 0.95, 16);
    ctx.fill();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  elipsa(0, dol + 30, R + 34, 14);
  ctx.fill();
  ctx.fillStyle = '#3b3f4c';
  zaokraglony(-R - 30, dol + 8, 2 * R + 60, 24, 10);
  ctx.fill();
  ctx.fillStyle = '#545a6b';
  zaokraglony(-R - 30, dol + 8, 2 * R + 60, 8, 4);
  ctx.fill();
  // płomyki
  if (n.ogien > 0.02) {
    for (let i = -4; i <= 4; i++) {
      const fx = i * R * 0.19;
      const h = (16 + Math.sin(czas * 17 + i * 2.1) * 5) * n.ogien;
      ctx.fillStyle = 'rgba(70, 140, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(fx - 8, dol + 10);
      ctx.quadraticCurveTo(fx - 7, dol + 2 - h * 0.5, fx, dol + 2 - h);
      ctx.quadraticCurveTo(fx + 7, dol + 2 - h * 0.5, fx + 8, dol + 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 200, 80, 0.9)';
      ctx.beginPath();
      ctx.moveTo(fx - 4, dol + 10);
      ctx.quadraticCurveTo(fx - 3, dol + 6 - h * 0.3, fx, dol + 6 - h * 0.6);
      ctx.quadraticCurveTo(fx + 3, dol + 6 - h * 0.3, fx + 4, dol + 10);
      ctx.fill();
    }
  }
}

// Pokrętło kuchenki – (x, y) środek, wlaczone 0..1
function rysujPokretlo(x, y, wlaczone, podswietl = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (podswietl > 0) {
    ctx.fillStyle = `rgba(255, 220, 90, ${0.45 * podswietl})`;
    kolo(0, 0, 52);
    ctx.fill();
  }
  ctx.fillStyle = '#3b3f4c';
  zaokraglony(-40, -40, 80, 80, 16);
  ctx.fill();
  ctx.fillStyle = '#e9ecf1';
  kolo(0, 0, 28);
  ctx.fill();
  ctx.strokeStyle = '#a7afba';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.rotate(-Math.PI / 2 + wlaczone * Math.PI * 0.75);
  ctx.fillStyle = '#e25b45';
  zaokraglony(-5, -26, 10, 26, 5);
  ctx.fill();
  ctx.restore();
  // kropka: czy włączone
  ctx.fillStyle = wlaczone > 0.5 ? '#ff7b2e' : '#6b7280';
  kolo(x + 30, y - 30, 6);
  ctx.fill();
}

// Wszystko, co jest w środku garnka / miski (płyn, kawałki, mąka...)
function rysujZawartosc(n, R, e, czas) {
  const gl = glebokoscPowierzchni(n);
  ctx.save();
  elipsa(0, 0, R * 0.95, R * e * 0.95);
  ctx.clip();
  if (n.plyn > 0.01 && n.kolor) {
    ctx.fillStyle = n.kolor;
    elipsa(0, gl, R * 0.97, R * e * 0.97);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    elipsa(-R * 0.35, gl - R * e * 0.35, R * 0.3, R * e * 0.18);
    ctx.fill();
    // fale, kiedy się miesza albo gotuje
    if (n.wir || n.ogien > 0.2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, gl, R * 0.25 * i, R * e * 0.25 * i, 0, (n.wir || 0) + i, (n.wir || 0) + i + 1.6);
        ctx.stroke();
      }
    }
  }
  // kupka mąki
  for (const k of n.kupki) {
    if (k.w <= 0.01) continue;
    ctx.fillStyle = k.kolor;
    elipsa(R * 0.1, gl - 4 * k.w, R * 0.45 * k.w, R * e * 0.4 * k.w + 6 * k.w);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    elipsa(R * 0.02, gl - 10 * k.w, R * 0.18 * k.w, R * e * 0.12 * k.w);
    ctx.fill();
  }
  // żółtka
  for (const z of n.zoltka) {
    const a = z.alfa === undefined ? 1 : z.alfa;
    if (a <= 0.01) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,255,248,0.9)';
    elipsa(z.u * R, gl + z.v * R * e, 44, 20);
    ctx.fill();
    ctx.fillStyle = '#ffb81c';
    elipsa(z.u * R, gl + z.v * R * e - 2, 19, 11);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    elipsa(z.u * R - 6, gl + z.v * R * e - 6, 5, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // drobinki (sól)
  for (const d of n.drobinki) {
    ctx.fillStyle = d.kolor;
    ctx.globalAlpha = d.alfa === undefined ? 1 : d.alfa;
    ctx.fillRect(d.u * R, gl + d.v * R * e, 3, 3);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // kawałki (od najdalszych do najbliższych)
  const wielkosc = NACZYNIA[n.typ].wielkoscKawalka;
  const lista = n.kawalki.slice().sort((a, b) => Math.sin(a.a) * a.r - Math.sin(b.a) * b.r);
  for (const k of lista) {
    const kx = Math.cos(k.a) * k.r * R * 0.85;
    const ky = gl + Math.sin(k.a) * k.r * R * e * 0.85 - 8 + (n.plyn > 0 ? Math.sin(czas * 2 + k.faza) * 2.5 : 0);
    rysujKawalek(SKLADNIKI[k.sk].obrazek, k.czesc, k.z, kx, ky, wielkosc * (k.skala || 1), k.obrot + (n.plyn > 0 ? Math.sin(czas * 1.5 + k.faza) * 0.08 : 0));
  }

  // polewa (miód)
  for (const p of n.polewa) {
    if (p.punkty.length < 2) continue;
    ctx.strokeStyle = p.kolor;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    p.punkty.forEach(([u, v], i) => {
      const px = u * R;
      const py = gl - 12 + v * R * e;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function rysujGarnek(n, czas) {
  const R = 150, e = 0.36, H = 150;
  rysujPalnik(n, R, H, czas);
  // uchwyty
  ctx.fillStyle = '#3b3f4c';
  zaokraglony(-R - 30, 14, 40, 18, 9);
  ctx.fill();
  zaokraglony(R - 10, 14, 40, 18, 9);
  ctx.fill();
  // ciało garnka
  const g = ctx.createLinearGradient(-R, 0, R, 0);
  g.addColorStop(0, '#c23d35');
  g.addColorStop(0.32, '#f2746a');
  g.addColorStop(0.6, '#e2554b');
  g.addColorStop(1, '#a8302a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-R, 0);
  ctx.lineTo(-R * 0.95, H - 20);
  ctx.quadraticCurveTo(-R * 0.94, H, -R * 0.8, H);
  ctx.lineTo(R * 0.8, H);
  ctx.quadraticCurveTo(R * 0.94, H, R * 0.95, H - 20);
  ctx.lineTo(R, 0);
  ctx.ellipse(0, 0, R, R * e, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  // białe kropki
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 3; j++) {
      const kx = -R + 25 + i * 42 + (j % 2) * 21;
      const ky = 70 + j * 30;
      kolo(kx, ky, 6);
      ctx.fill();
    }
  }
  ctx.restore();
  // środek
  ctx.fillStyle = '#5b2420';
  elipsa(0, 0, R * 0.96, R * e * 0.96);
  ctx.fill();
  rysujZawartosc(n, R, e, czas);
  // brzeg
  ctx.strokeStyle = '#f58f85';
  ctx.lineWidth = 9;
  elipsa(0, 0, R * 0.98, R * e * 0.98);
  ctx.stroke();
  ctx.strokeStyle = '#c23d35';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 4, R, R * e, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function rysujMiske(n, czas) {
  const R = 160, e = 0.36;
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  elipsa(0, 126, R * 0.6, 16);
  ctx.fill();
  // stopka
  ctx.fillStyle = '#4ea5d3';
  zaokraglony(-60, 104, 120, 22, 10);
  ctx.fill();
  const g = ctx.createLinearGradient(-R, 0, R, 0);
  g.addColorStop(0, '#5fb3dd');
  g.addColorStop(0.35, '#a8ddf5');
  g.addColorStop(1, '#4b9fcb');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, R, 118, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  // paski
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(-R, 46, 2 * R, 10);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(-R, 62, 2 * R, 6);
  ctx.restore();
  // środek
  ctx.fillStyle = '#e6f5fc';
  elipsa(0, 0, R * 0.96, R * e * 0.96);
  ctx.fill();
  ctx.fillStyle = '#c7e6f4';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.96, R * e * 0.96, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  rysujZawartosc(n, R, e, czas);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  elipsa(0, 0, R * 0.98, R * e * 0.98);
  ctx.stroke();
}

function rysujPatelnie(n, czas) {
  const R = 140, e = 0.5;
  rysujPalnik(n, R * 0.85, 30, czas);
  // rączka
  ctx.fillStyle = '#7a4c2a';
  ctx.save();
  ctx.rotate(-0.08);
  zaokraglony(R - 10, -4, 170, 26, 12);
  ctx.fill();
  ctx.fillStyle = '#9c6538';
  zaokraglony(R + 40, 0, 110, 8, 4);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2c2e37';
  elipsa(0, 16, R, R * e);
  ctx.fill();
  ctx.fillStyle = '#4a4d5a';
  elipsa(0, 0, R, R * e);
  ctx.fill();
  ctx.fillStyle = '#353844';
  elipsa(0, 3, R * 0.9, R * e * 0.9);
  ctx.fill();
  rysujNalesnik(n, R, e, czas);
}

// Naleśnik na patelni (albo w powietrzu, gdy go przewracamy)
function rysujNalesnik(n, R, e) {
  const nl = n.nalesnik;
  if (!nl || nl.r <= 0.01) return;
  const rx = nl.r * R;
  const ry = Math.max(2, nl.r * R * e * Math.abs(nl.skalaY));
  const y = 3 - nl.skok;
  if (nl.skok > 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    elipsa(0, 3, rx * 0.8, nl.r * R * e * 0.8);
    ctx.fill();
  }
  const zloty = nl.zloty;
  ctx.save();
  elipsa(0, y, rx, ry);
  ctx.fillStyle = zloty ? '#e9b45a' : mieszajKolory('#f8ecc0', '#f1d98f', nl.smazenie || 0);
  ctx.fill();
  ctx.clip();
  if (zloty) {
    ctx.fillStyle = 'rgba(255, 230, 160, 0.6)';
    elipsa(0, y, rx * 0.55, ry * 0.55);
    ctx.fill();
    const los = losowaZNasiona(7);
    ctx.fillStyle = 'rgba(150, 85, 30, 0.45)';
    for (let i = 0; i < 18; i++) {
      const a = los() * Math.PI * 2;
      const r = Math.sqrt(los()) * 0.9;
      elipsa(Math.cos(a) * r * rx, y + Math.sin(a) * r * ry, 4 + los() * 6, (3 + los() * 4) * Math.abs(nl.skalaY));
      ctx.fill();
    }
  } else if (nl.dziurki) {
    for (const d of nl.dziurki) {
      ctx.fillStyle = 'rgba(190, 150, 70, 0.5)';
      elipsa(d.u * rx, y + d.v * ry, d.r, d.r * 0.6);
      ctx.fill();
    }
  }
  // dżem i dodatki
  if (nl.skok < 1) rysujWarstwy(n, R, e, y);
  ctx.restore();
  if (nl.skok < 1) {
    for (const d of n.dodatki) rysujObrazek(SKLADNIKI[d.sk].obrazek, d.u * R, y + d.v * R * e - 6, 50, d.obrot);
  }
  ctx.strokeStyle = zloty ? 'rgba(170, 100, 30, 0.6)' : 'rgba(210, 180, 110, 0.7)';
  ctx.lineWidth = 3;
  elipsa(0, y, rx, ry);
  ctx.stroke();
}

// Warstwy malowane palcem (sos, ser, dżem). Płótno warstwy ma współrzędne od -1 do 1.
function rysujWarstwy(n, R, e, y = 0) {
  for (const w of n.warstwy) {
    ctx.save();
    ctx.translate(0, y);
    ctx.scale(R, R * e);
    if (w.pelne > 0) {
      ctx.globalAlpha = w.pelne;
      ctx.drawImage(w.pelnePlotno, -1, -1, 2, 2);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(w.plotno, -1, -1, 2, 2);
    ctx.restore();
  }
}

function rysujPizze(n) {
  const R = 175, e = 0.72;
  // deska
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  elipsa(6, 26, R + 4, R * e + 4);
  ctx.fill();
  ctx.fillStyle = '#a8723f';
  zaokraglony(R - 20, -8, 110, 34, 16);
  ctx.fill();
  ctx.fillStyle = '#c98d55';
  zaokraglony(R - 20, -14, 110, 34, 16);
  ctx.fill();
  ctx.fillStyle = '#7a4c2a';
  kolo(R + 66, 2, 7);
  ctx.fill();
  ctx.fillStyle = '#a8723f';
  elipsa(0, 14, R, R * e);
  ctx.fill();
  ctx.fillStyle = '#d9a066';
  elipsa(0, 0, R, R * e);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 95, 45, 0.3)';
  ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    elipsa(0, 0, R * 0.3 * i, R * e * 0.3 * i);
    ctx.stroke();
  }
  // ciasto
  const c = n.ciasto;
  if (!c) return;
  const rx = c.r * R;
  const ry = rx * e;
  const grubosc = Math.max(6, (0.9 - c.r) * 70 + 6);
  const kolorCiasta = mieszajKolory('#f5deaa', '#e4a44c', n.upieczenie);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  elipsa(0, grubosc * 0.6 + 4, rx, ry);
  ctx.fill();
  ctx.fillStyle = przyciemnij(kolorCiasta, 0.85);
  elipsa(0, grubosc * 0.5, rx, ry);
  ctx.fill();
  ctx.fillStyle = kolorCiasta;
  elipsa(0, -grubosc * 0.5 + 3, rx, ry);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  elipsa(-rx * 0.25, -grubosc * 0.5 - ry * 0.3, rx * 0.35, ry * 0.25);
  ctx.fill();
  // brzeg pizzy
  if (c.r > 0.6) {
    ctx.strokeStyle = przyciemnij(kolorCiasta, 0.92);
    ctx.lineWidth = 4;
    elipsa(0, -grubosc * 0.5 + 3, rx * 0.9, ry * 0.9);
    ctx.stroke();
  }
  // sos i ser
  ctx.save();
  elipsa(0, -grubosc * 0.5 + 3, rx * 0.9, ry * 0.9);
  ctx.clip();
  rysujWarstwy(n, R, e, -grubosc * 0.5 + 3);
  // zarumieniony ser
  if (n.upieczenie > 0 && n.warstwy.length) {
    const los = losowaZNasiona(3);
    ctx.fillStyle = `rgba(190, 110, 30, ${0.35 * n.upieczenie})`;
    for (let i = 0; i < 26; i++) {
      const a = los() * Math.PI * 2;
      const r = Math.sqrt(los()) * 0.8;
      elipsa(Math.cos(a) * r * rx, Math.sin(a) * r * ry, 5 + los() * 7, 3 + los() * 5);
      ctx.fill();
    }
  }
  ctx.restore();
  // dodatki
  for (const d of n.dodatki) {
    const o = SKLADNIKI[d.sk].obrazek;
    const w = d.sk === 'salami' ? 46 : 60;
    const jas = n.upieczenie > 0 ? 1 - n.upieczenie * 0.15 : 1;
    ctx.save();
    ctx.filter = jas < 1 ? `brightness(${jas})` : 'none';
    rysujObrazek(o, d.u * R, d.v * R * e - 4, w, d.obrot);
    ctx.restore();
  }
}

// Połówka pomarańczy widziana od strony przekrojenia
function rysujPolowke(x, y, r, obrot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(obrot);
  ctx.fillStyle = '#f28a10';
  kolo(0, 0, r);
  ctx.fill();
  ctx.fillStyle = '#fff1cc';
  kolo(0, 0, r * 0.88);
  ctx.fill();
  ctx.fillStyle = '#ffb53b';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a + 0.08) * r * 0.12, Math.sin(a + 0.08) * r * 0.12);
    ctx.lineTo(Math.cos(a + 0.12) * r * 0.8, Math.sin(a + 0.12) * r * 0.8);
    ctx.arc(0, 0, r * 0.8, a + 0.12, a + Math.PI / 4 - 0.12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function rysujDzbanek(n, czas) {
  const W = 92, H = 230;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  elipsa(0, H + 4, W + 10, 14);
  ctx.fill();
  // ucho
  ctx.strokeStyle = 'rgba(140, 185, 212, 0.95)';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W - 4, 44);
  ctx.bezierCurveTo(W + 74, 44, W + 74, 176, W - 4, 182);
  ctx.stroke();
  // kształt dzbanka
  const ksztalt = () => {
    ctx.beginPath();
    ctx.moveTo(-W, 0);
    ctx.lineTo(-W, H - 22);
    ctx.quadraticCurveTo(-W, H, -W + 22, H);
    ctx.lineTo(W - 22, H);
    ctx.quadraticCurveTo(W, H, W, H - 22);
    ctx.lineTo(W, 0);
    ctx.closePath();
  };
  ksztalt();
  ctx.fillStyle = 'rgba(214, 238, 252, 0.55)';
  ctx.fill();
  // sok
  const ys = glebokoscPowierzchni(n);
  if (n.plyn > 0.005) {
    ctx.save();
    ksztalt();
    ctx.clip();
    ctx.fillStyle = n.kolor || '#ffa62b';
    ctx.fillRect(-W, ys, 2 * W, H);
    ctx.fillStyle = rozjasnij(n.kolor || '#ffa62b', 0.25);
    elipsa(0, ys, W - 2, (W - 2) * 0.3);
    ctx.fill();
    ctx.restore();
  }
  // lód i inne kawałki na powierzchni
  for (const k of n.kawalki) {
    const kx = Math.cos(k.a) * k.r * W * 0.75;
    const ky = ys + Math.sin(k.a) * k.r * W * 0.3 * 0.75 - 6 + Math.sin(czas * 2 + k.faza) * 2;
    rysujKawalek(SKLADNIKI[k.sk].obrazek, k.czesc, k.z, kx, ky, NACZYNIA.dzbanek.wielkoscKawalka, k.obrot);
  }
  // szkło z przodu
  ksztalt();
  ctx.strokeStyle = 'rgba(120, 165, 195, 0.95)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  zaokraglony(-W + 12, 24, 10, H - 60, 5);
  ctx.fill();
  // dzióbek i brzeg
  ctx.fillStyle = 'rgba(214, 238, 252, 0.9)';
  ctx.beginPath();
  ctx.moveTo(-W + 6, -6);
  ctx.lineTo(-W - 22, -16);
  ctx.lineTo(-W + 4, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 165, 195, 0.95)';
  ctx.lineWidth = 4;
  ctx.stroke();
  elipsa(0, 0, W, W * 0.3);
  ctx.stroke();

  // wyciskarka na górze
  if (n.wyciskarka > 0.01) {
    ctx.save();
    ctx.globalAlpha = n.wyciskarka;
    ctx.translate(0, -(1 - n.wyciskarka) * 180);
    ctx.fillStyle = '#8ccf6e';
    ctx.beginPath();
    ctx.ellipse(0, -6, 116, 50, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#bfe6a8';
    elipsa(0, -6, 116, 38);
    ctx.fill();
    ctx.fillStyle = '#a6d98c';
    elipsa(0, -6, 100, 30);
    ctx.fill();
    // stożek
    ctx.fillStyle = '#d9f2c9';
    ctx.beginPath();
    ctx.moveTo(-40, -8);
    ctx.quadraticCurveTo(-30, -60, 0, -74);
    ctx.quadraticCurveTo(30, -60, 40, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9fd284';
    ctx.lineWidth = 3;
    for (const dx of [-20, 0, 20]) {
      ctx.beginPath();
      ctx.moveTo(dx * 1.6, -10);
      ctx.lineTo(dx * 0.3, -66);
      ctx.stroke();
    }
    // połówka na stożku: widać skórkę, która kręci się razem z palcem
    if (n.polowki > 0) {
      const w = n.wycisk || { obrot: 0, scisk: 0 };
      const sx = 1 - w.scisk * 0.22;
      const sy = 1 - w.scisk * 0.4;
      ctx.save();
      ctx.translate(0, -52 + w.scisk * 14);
      ctx.fillStyle = '#f28a10';
      ctx.beginPath();
      ctx.ellipse(0, 10, 52 * sx, 40 * sy, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(0, 10, 52 * sx, 12, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 200, 110, 0.6)';
      for (let i = 0; i < 9; i++) {
        const a = w.obrot + (i / 9) * Math.PI * 2;
        const c = Math.cos(a);
        if (Math.sin(a) < 0) continue;
        kolo(c * 40 * sx, -2 - Math.sin(a) * 14 * sy, 2.5);
        ctx.fill();
      }
      ctx.fillStyle = '#4c9a3a';
      const a = w.obrot;
      kolo(Math.cos(a) * 12 * sx, -28 * sy + Math.sin(a) * 4, 5);
      ctx.fill();
      ctx.restore();
      // czekające połówki leżą obok
      for (let i = 1; i < n.polowki; i++) rysujPolowke(-W - 70 - (i - 1) * 50, H - 30, 34, 0.3);
    }
    ctx.restore();
  }
}


// =====================================================
//   PIEKARNIK
// =====================================================
function rysujPiekarnik(x, y, s, swiatlo, postep, wnetrze) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  elipsa(0, 175, 240, 16);
  ctx.fill();
  zaokraglony(-240, -180, 480, 350, 26);
  ctx.fillStyle = '#eef0f4';
  ctx.fill();
  ctx.strokeStyle = '#b4bbc6';
  ctx.lineWidth = 5;
  ctx.stroke();
  // panel z pokrętłami i zegarem
  ctx.fillStyle = '#dde1e7';
  zaokraglony(-228, -168, 456, 64, 18);
  ctx.fill();
  for (const kx of [-180, -120]) {
    ctx.fillStyle = '#ffffff';
    kolo(kx, -136, 20);
    ctx.fill();
    ctx.strokeStyle = '#9aa3ae';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // zegar
  ctx.fillStyle = '#ffffff';
  kolo(160, -136, 24);
  ctx.fill();
  if (postep > 0) {
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(160, -136);
    ctx.arc(160, -136, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, postep));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#9aa3ae';
  ctx.lineWidth = 3;
  kolo(160, -136, 24);
  ctx.stroke();
  // lampka
  ctx.fillStyle = swiatlo > 0.5 ? '#ff7b2e' : '#9aa3ae';
  kolo(60, -136, 9);
  ctx.fill();
  // drzwiczki z okienkiem
  ctx.fillStyle = '#cfd4db';
  zaokraglony(-210, -88, 420, 240, 20);
  ctx.fill();
  ctx.save();
  zaokraglony(-180, -60, 360, 176, 16);
  ctx.fillStyle = '#2b2d36';
  ctx.fill();
  ctx.clip();
  if (wnetrze) {
    ctx.save();
    ctx.translate(-10, 50);
    ctx.scale(0.72, 0.72);
    wnetrze();
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255, 140, 40, ${0.12 + swiatlo * 0.3})`;
  ctx.fillRect(-180, -60, 360, 176);
  // grzałka
  ctx.strokeStyle = swiatlo > 0.3 ? '#ff5a2e' : '#555b66';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const xx = -160 + i * 27;
    ctx.lineTo(xx, -48 + (i % 2) * 10);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(-180, -60);
  ctx.lineTo(-90, -60);
  ctx.lineTo(-180, 60);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // rączka
  ctx.fillStyle = '#9aa3ae';
  zaokraglony(-150, -82, 300, 14, 7);
  ctx.fill();
  ctx.restore();
}


// =====================================================
//   PORCJE – to, co dostają przyjaciele
//   (0, 0) to miejsce, gdzie talerz stoi na stole
// =====================================================
function rysujPorcje(p, x, y, s, zostalo) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  elipsa(0, 2, 72, 14);
  ctx.fill();
  switch (p.porcja) {
    case 'miseczka': porcjaMiseczka(p, zostalo); break;
    case 'nalesnik': porcjaNalesnik(zostalo, p); break;
    case 'pizza': porcjaPizza(zostalo, p); break;
    case 'szklanka': porcjaSzklanka(p, zostalo); break;
    case 'wlasna': porcjaWlasna(); break;
  }
  ctx.restore();
}

function talerz() {
  ctx.fillStyle = '#ffffff';
  elipsa(0, -8, 74, 24);
  ctx.fill();
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#8fd0f5';
  ctx.lineWidth = 2.5;
  elipsa(0, -8, 52, 15);
  ctx.stroke();
}

function porcjaMiseczka(p, zostalo) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -46, 62, 46, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#ff7eb6';
  ctx.fillRect(-70, -22, 140, 8);
  ctx.restore();
  ctx.fillStyle = '#f1f4f8';
  elipsa(0, -46, 58, 17);
  ctx.fill();
  if (zostalo > 0.01) {
    ctx.save();
    elipsa(0, -46, 56, 16);
    ctx.clip();
    if (p.kolor) {
      ctx.fillStyle = p.kolor;
      elipsa(0, -44 + (1 - zostalo) * 12, 56, 16);
      ctx.fill();
    }
    ctx.restore();
    const kawalki = p.wPorcji || [];
    const miejsca = p.kolor
      ? [[-24, -48], [4, -42], [26, -50]]
      : [[-28, -54], [0, -58], [26, -54], [-14, -44], [14, -42]];
    const ile = kawalki.length ? Math.ceil(miejsca.length * zostalo) : 0;
    for (let i = 0; i < ile; i++) {
      const sk = kawalki[i % kawalki.length];
      rysujKawalek(SKLADNIKI[sk].obrazek, p.kolor ? 1 : -1, 3, miejsca[i][0], miejsca[i][1], p.kolor ? 30 : 34, i * 0.7);
    }
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  elipsa(0, -46, 60, 18);
  ctx.stroke();
}

// Karta „Moja potrawa”: miseczka, z której wyskakują różne składniki
function porcjaWlasna() {
  porcjaMiseczka({ kolor: '#d9b3ff', wPorcji: [] }, 1);
  rysujEmotke('🍅', -34, -72, 36, -0.4);
  rysujEmotke('🍌', 0, -92, 40, 0.2);
  rysujEmotke('🧀', 34, -70, 34, 0.35);
  rysujGwiazdke(-58, -104, 9, true);
  rysujGwiazdke(56, -112, 11, true);
  rysujGwiazdke(4, -134, 7, true);
}

// Kawałki własnej potrawy (jeśli to własna potrawa), położone w podanych miejscach
function kawalkiPorcji(p, miejsca, wielkosc) {
  const lista = p.wPorcji || [];
  for (let i = 0; i < Math.min(lista.length, miejsca.length); i++) {
    rysujObrazek(SKLADNIKI[lista[i]].obrazek, miejsca[i][0], miejsca[i][1], wielkosc, (i - 1) * 0.4);
  }
}

function porcjaNalesnik(zostalo, p = {}) {
  talerz();
  if (zostalo <= 0.01) return;
  const L = 120 * Math.max(0.2, zostalo);
  ctx.save();
  ctx.translate(-60, -28);
  ctx.fillStyle = '#e9b45a';
  zaokraglony(0, -16, L, 32, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(150, 85, 30, 0.35)';
  for (let i = 0; i < L / 18; i++) {
    elipsa(12 + i * 18, -6 + (i % 2) * 10, 4, 3);
    ctx.fill();
  }
  // koniec zawijasa z dżemem
  ctx.fillStyle = '#f3d08a';
  kolo(L - 14, 0, 16);
  ctx.fill();
  ctx.strokeStyle = '#c8173f';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.3) {
    const r = 2 + a * 1;
    ctx.lineTo(L - 14 + Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#c8173f';
  elipsa(L * 0.5, 15, 10, 5);
  ctx.fill();
  if (p.wlasny) kawalkiPorcji(p, [[L * 0.3, -18], [L * 0.62, -20]], 30);
  ctx.restore();
}

function porcjaPizza(zostalo, p = {}) {
  talerz();
  if (zostalo <= 0.01) return;
  ctx.save();
  ctx.translate(0, -16);
  const k = 0.45 + 0.55 * zostalo;
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-58, -40);
  ctx.quadraticCurveTo(0, -62, 58, -40);
  ctx.closePath();
  ctx.fillStyle = '#d8321f';
  ctx.fill();
  ctx.fillStyle = '#ffd65c';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-50, -38);
  ctx.quadraticCurveTo(0, -54, 50, -38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e2a64e';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-58, -42);
  ctx.quadraticCurveTo(0, -64, 58, -42);
  ctx.stroke();
  ctx.fillStyle = 'rgba(190, 110, 30, 0.35)';
  for (const [x, y] of [[-20, -30], [14, -22], [28, -38], [-4, -12]]) {
    elipsa(x, y, 6, 3);
    ctx.fill();
  }
  if (p.wlasny) {
    kawalkiPorcji(p, [[-22, -32], [18, -36], [0, -16]], 24);
  } else {
    rysujObrazek('*salami', -22, -32, 22);
    rysujObrazek('*salami', 18, -36, 20);
    rysujObrazek('*pieczarka', 0, -18, 22);
  }
  ctx.restore();
}

function porcjaSzklanka(p, zostalo) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-32, -118);
  ctx.lineTo(32, -118);
  ctx.lineTo(25, 0);
  ctx.lineTo(-25, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 240, 255, 0.55)';
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (zostalo > 0.01) {
    const gora = -104 + (1 - zostalo) * 96;
    ctx.fillStyle = p.kolor || '#ffa62b';
    ctx.fillRect(-40, gora, 80, 120);
    ctx.fillStyle = rozjasnij(p.kolor || '#ffa62b', 0.3);
    ctx.fillRect(-40, gora, 80, 4);
    if (zostalo > 0.3) rysujEmotke('🧊', -6, gora + 8, 22, 0.3);
  }
  ctx.restore();
  // słomka
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(6, -20);
  ctx.lineTo(26, -150);
  ctx.stroke();
  ctx.strokeStyle = '#ff5a7a';
  ctx.setLineDash([9, 9]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(120, 165, 195, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-32, -118);
  ctx.lineTo(-25, 0);
  ctx.lineTo(25, 0);
  ctx.lineTo(32, -118);
  ctx.stroke();
  // plasterek pomarańczy na brzegu
  ctx.save();
  ctx.beginPath();
  ctx.rect(-80, -160, 160, 42);
  ctx.clip();
  rysujPolowke(-30, -118, 20, 0);
  ctx.restore();
  ctx.restore();
}


// =====================================================
//   ZWIERZAKI
//   (0, 0) to miejsce, gdzie zwierzak siedzi przy stole.
//   z = { typ, oczy: 'o' | 'z' | 'w', buzia: 0..1, jezyk, merdanie }
// =====================================================
const KOLORY_LAPEK = {
  panda: '#2d2b35',
  jez: '#f1d3a8',
  malpka: '#8b5a2b',
  kotek: '#f4a340',
  piesek: '#ecc796',
};

function oczka(dx, y, rodzaj, kolor = '#2b2233', r = 8) {
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const x = sx * dx;
    if (rodzaj === 'w') {
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.5, r, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (rodzaj === 'k') {
      // zaciśnięte oczy > < (coś nie smakuje)
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x + sx * r * 0.7, y - r * 0.7);
      ctx.lineTo(x - sx * r * 0.6, y);
      ctx.lineTo(x + sx * r * 0.7, y + r * 0.7);
      ctx.stroke();
    } else if (rodzaj === 'z') {
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y + r * 0.7, x + r, y);
      ctx.stroke();
    } else {
      ctx.fillStyle = kolor;
      elipsa(x, y, r * 0.85, r);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      kolo(x + r * 0.3, y - r * 0.38, r * 0.34);
      ctx.fill();
    }
  }
}

let fujTeraz = false;   // czy rysowany zwierzak się krzywi

function buzka(y, otwarcie, szer = 12, jezyk = false, kolor = '#2b2233') {
  if (fujTeraz) {
    // krzywa buzia i wystawiony język: „bleee!”
    ctx.fillStyle = '#ff7f96';
    ctx.beginPath();
    ctx.ellipse(szer * 0.3, y + 9, 7, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = kolor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const x = -szer * 1.1 + i * szer * 2.2 / 6;
      ctx.lineTo(x, y + 2 + (i % 2 ? -3 : 3));
    }
    ctx.stroke();
    return;
  }
  if (otwarcie > 0.05) {
    ctx.fillStyle = '#7a2230';
    elipsa(0, y + 4, szer * 0.85, 3 + otwarcie * 11);
    ctx.fill();
    ctx.fillStyle = '#ff7f96';
    elipsa(0, y + 6 + otwarcie * 6, szer * 0.55, 2 + otwarcie * 4);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * szer / 2, y, szer / 2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  if (jezyk) {
    ctx.fillStyle = '#ff7f96';
    ctx.beginPath();
    ctx.ellipse(0, y + 10, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0607a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 5);
    ctx.lineTo(0, y + 14);
    ctx.stroke();
  }
}

function rumience(dx, y, alfa = 0.45) {
  ctx.fillStyle = `rgba(255, 120, 150, ${alfa})`;
  for (const sx of [-1, 1]) {
    elipsa(sx * dx, y, 11, 7);
    ctx.fill();
  }
}

// Kolce jeża: gwiazda z wieloma ramionami
function kolce(x, y, rZew, rWew, ile, kolor) {
  ctx.fillStyle = kolor;
  ctx.beginPath();
  for (let i = 0; i < ile * 2; i++) {
    const a = (i / (ile * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rZew : rWew;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

function rysujZwierzaka(z, x, y, s) {
  ctx.save();
  ctx.translate(x + (z.drzenie || 0), y - (z.skok || 0));
  ctx.scale(s, s);
  const rysuj = ZWIERZAKI[z.typ];
  if (rysuj) {
    rysuj.cialo(z);
    ctx.save();
    ctx.translate(0, -70);
    ctx.rotate(z.przechyl || 0);
    ctx.translate(0, 70);
    fujTeraz = !!z.fuj;
    rysuj.glowa(z);
    fujTeraz = false;
    if (z.fuj) {
      // kropelka potu
      ctx.fillStyle = '#8fd0f5';
      ctx.beginPath();
      ctx.moveTo(58, -160);
      ctx.quadraticCurveTo(70, -140, 58, -134);
      ctx.quadraticCurveTo(46, -140, 58, -160);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

// Łapki leżą na stole – rysujemy je po stole, żeby były z przodu
function rysujLapki(z, x, y, s) {
  ctx.save();
  ctx.translate(x, y - (z.skok || 0) * 0.3);
  ctx.scale(s, s);
  ctx.fillStyle = KOLORY_LAPEK[z.typ];
  const ruch = z.buzia > 0.05 ? Math.sin((z.t || 0) * 9) * 3 : 0;
  for (const sx of [-1, 1]) {
    elipsa(sx * 40, 6 + ruch * sx, 20, 12);
    ctx.fill();
  }
  ctx.restore();
}

const ZWIERZAKI = {
  panda: {
    cialo() {
      ctx.fillStyle = '#2d2b35';
      elipsa(0, -10, 68, 60);
      ctx.fill();
      ctx.fillStyle = '#f7f7f2';
      elipsa(0, -4, 44, 50);
      ctx.fill();
    },
    glowa(z) {
      ctx.fillStyle = '#2d2b35';
      kolo(-48, -160, 23);
      ctx.fill();
      kolo(48, -160, 23);
      ctx.fill();
      ctx.fillStyle = '#fbfbf7';
      elipsa(0, -112, 68, 60);
      ctx.fill();
      ctx.strokeStyle = '#e2e2da';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#2d2b35';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sx * 25, -114, 16, 21, sx * -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      oczka(25, -116, z.oczy, '#ffffff', 7.5);
      if (z.oczy === 'o') {
        ctx.fillStyle = '#2d2b35';
        kolo(-25, -115, 3.6);
        ctx.fill();
        kolo(25, -115, 3.6);
        ctx.fill();
      }
      ctx.fillStyle = '#2d2b35';
      elipsa(0, -94, 10, 7);
      ctx.fill();
      buzka(-84, z.buzia, 12, z.jezyk);
      rumience(44, -92);
    },
  },

  jez: {
    cialo() {
      kolce(0, -24, 84, 64, 16, '#6b4a2e');
      ctx.fillStyle = '#c89a6a';
      elipsa(0, -10, 60, 54);
      ctx.fill();
      ctx.fillStyle = '#f1d3a8';
      elipsa(0, -4, 40, 44);
      ctx.fill();
    },
    glowa(z) {
      kolce(0, -118, 92, 70, 22, '#6b4a2e');
      kolce(0, -118, 80, 62, 22, '#8a6440');
      ctx.fillStyle = '#f1d3a8';
      kolo(-42, -158, 13);
      ctx.fill();
      kolo(42, -158, 13);
      ctx.fill();
      ctx.fillStyle = '#ffb3c1';
      kolo(-42, -158, 7);
      ctx.fill();
      kolo(42, -158, 7);
      ctx.fill();
      ctx.fillStyle = '#f1d3a8';
      elipsa(0, -108, 58, 54);
      ctx.fill();
      oczka(21, -118, z.oczy, '#2b2233', 7.5);
      ctx.fillStyle = '#f8e4c6';
      elipsa(0, -90, 22, 17);
      ctx.fill();
      ctx.fillStyle = '#2b2233';
      kolo(0, -98, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      kolo(-3, -101, 2.5);
      ctx.fill();
      buzka(-82, z.buzia, 10, z.jezyk);
      rumience(36, -96);
    },
  },

  malpka: {
    cialo(z) {
      ctx.strokeStyle = '#7a4a22';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(40, -10);
      ctx.bezierCurveTo(100, -10, 96, -80 + m, 70, -84 + m);
      ctx.bezierCurveTo(52, -86 + m, 54, -64 + m, 68, -66 + m);
      ctx.stroke();
      ctx.fillStyle = '#8b5a2b';
      elipsa(0, -10, 60, 56);
      ctx.fill();
      ctx.fillStyle = '#f2d2a6';
      elipsa(0, -4, 36, 42);
      ctx.fill();
    },
    glowa(z) {
      ctx.fillStyle = '#8b5a2b';
      kolo(-64, -114, 23);
      ctx.fill();
      kolo(64, -114, 23);
      ctx.fill();
      ctx.fillStyle = '#f2c79b';
      kolo(-64, -114, 13);
      ctx.fill();
      kolo(64, -114, 13);
      ctx.fill();
      ctx.fillStyle = '#8b5a2b';
      kolo(0, -112, 60);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -166);
      ctx.quadraticCurveTo(0, -192, 14, -178);
      ctx.quadraticCurveTo(4, -176, 6, -166);
      ctx.fill();
      ctx.fillStyle = '#f2d2a6';
      kolo(-19, -122, 24);
      ctx.fill();
      kolo(19, -122, 24);
      ctx.fill();
      elipsa(0, -94, 40, 28);
      ctx.fill();
      oczka(19, -122, z.oczy, '#2b2233', 7.5);
      ctx.fillStyle = '#5a3a1a';
      kolo(-5, -101, 2.6);
      ctx.fill();
      kolo(5, -101, 2.6);
      ctx.fill();
      buzka(-88, z.buzia, 16, z.jezyk);
      rumience(30, -96, 0.35);
    },
  },

  kotek: {
    cialo(z) {
      ctx.strokeStyle = '#e8923a';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * 2.5) * 10;
      ctx.beginPath();
      ctx.moveTo(42, -12);
      ctx.quadraticCurveTo(110 + m, -30, 92 + m, -96);
      ctx.stroke();
      ctx.fillStyle = '#f4a340';
      elipsa(0, -10, 60, 56);
      ctx.fill();
      ctx.fillStyle = '#fff6ea';
      elipsa(0, -4, 36, 42);
      ctx.fill();
    },
    glowa(z) {
      for (const sx of [-1, 1]) {
        ctx.fillStyle = '#f4a340';
        ctx.beginPath();
        ctx.moveTo(sx * 62, -132);
        ctx.lineTo(sx * 50, -188);
        ctx.lineTo(sx * 12, -160);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffb3c1';
        ctx.beginPath();
        ctx.moveTo(sx * 52, -144);
        ctx.lineTo(sx * 46, -175);
        ctx.lineTo(sx * 26, -158);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#f4a340';
      elipsa(0, -112, 68, 56);
      ctx.fill();
      ctx.strokeStyle = '#d47f26';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (const [x1, y1, x2, y2] of [[0, -166, 0, -148], [-16, -163, -13, -149], [16, -163, 13, -149]]) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff6ea';
      kolo(-12, -92, 16);
      ctx.fill();
      kolo(12, -92, 16);
      ctx.fill();
      oczka(25, -118, z.oczy, '#2b2233', 8);
      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.moveTo(-7, -103);
      ctx.lineTo(7, -103);
      ctx.lineTo(0, -95);
      ctx.closePath();
      ctx.fill();
      buzka(-90, z.buzia, 11, z.jezyk);
      ctx.strokeStyle = '#8a5a34';
      ctx.lineWidth = 2;
      for (const sx of [-1, 1]) {
        for (const dy of [-6, 0, 6]) {
          ctx.beginPath();
          ctx.moveTo(sx * 30, -94 + dy * 0.5);
          ctx.lineTo(sx * 62, -98 + dy * 1.6);
          ctx.stroke();
        }
      }
      rumience(42, -100);
    },
  },

  piesek: {
    cialo(z) {
      ctx.strokeStyle = '#e0b07a';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * (z.merdanie ? 14 : 3)) * (z.merdanie ? 18 : 6);
      ctx.beginPath();
      ctx.moveTo(44, -16);
      ctx.quadraticCurveTo(80, -30, 84 + m, -78);
      ctx.stroke();
      ctx.fillStyle = '#ecc796';
      elipsa(0, -10, 60, 56);
      ctx.fill();
      ctx.fillStyle = '#fff4e2';
      elipsa(0, -4, 36, 42);
      ctx.fill();
    },
    glowa(z) {
      ctx.fillStyle = '#ecc796';
      elipsa(0, -112, 64, 58);
      ctx.fill();
      ctx.fillStyle = '#c98f55';
      elipsa(22, -122, 21, 19);
      ctx.fill();
      ctx.fillStyle = '#fff4e2';
      elipsa(0, -92, 32, 23);
      ctx.fill();
      ctx.fillStyle = '#8a5a34';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sx * 60, -108, 20, 44, sx * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      oczka(22, -120, z.oczy, '#2b2233', 8);
      ctx.fillStyle = '#2b2233';
      elipsa(0, -103, 12, 8.5);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      elipsa(-4, -106, 3.5, 2);
      ctx.fill();
      buzka(-90, z.buzia, 12, z.jezyk);
      rumience(40, -96);
    },
  },
};


// =====================================================
//   RĄCZKA – podpowiedź, co zrobić
// =====================================================
function rysujRaczke(x, y, wcisnieta) {
  if (wcisnieta) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    kolo(x, y, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 160, 60, 0.9)';
    ctx.lineWidth = 4;
    kolo(x, y, 28);
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  rysujEmotke('👆', x + 8, y + 36, wcisnieta ? 70 : 76, -0.15);
  ctx.restore();
}


// =====================================================
//   TŁA
// =====================================================
// Kuchnia: ściana w kafelki i drewniany blat. W i H to cały ekran (w pikselach), blatY gdzie zaczyna się blat.
function rysujScianeKuchni(W, H, blatY, kafel) {
  ctx.fillStyle = '#fff4dc';
  ctx.fillRect(0, 0, W, blatY);
  ctx.strokeStyle = '#f1dfba';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = (W / 2) % kafel; x < W; x += kafel) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, blatY);
  }
  for (let y = blatY % kafel; y < blatY; y += kafel) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  // pasek kafelków nad blatem
  ctx.fillStyle = '#ffd6a5';
  ctx.fillRect(0, blatY - kafel * 0.5, W, kafel * 0.5);
  // blat
  const g = ctx.createLinearGradient(0, blatY, 0, H);
  g.addColorStop(0, '#e9b47a');
  g.addColorStop(1, '#d59a5c');
  ctx.fillStyle = g;
  ctx.fillRect(0, blatY, W, H - blatY);
  ctx.fillStyle = '#f6cf9c';
  ctx.fillRect(0, blatY, W, Math.max(4, kafel * 0.12));
  ctx.strokeStyle = 'rgba(170, 110, 55, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const y = blatY + (H - blatY) * (i / 6);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(W * 0.3, y - 6, W * 0.6, y + 6, W, y);
    ctx.stroke();
  }
}

// Okno z firanką (w świecie gry)
function rysujOkno(x, y, w, h) {
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - 10, y - 10, w + 20, h + 20, 14);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8fd3ff');
  g.addColorStop(1, '#d4f1ff');
  ctx.fillStyle = g;
  zaokraglony(x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#ffe066';
  kolo(x + w * 0.75, y + h * 0.3, h * 0.12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  elipsa(x + w * 0.3, y + h * 0.35, w * 0.14, h * 0.07);
  ctx.fill();
  elipsa(x + w * 0.4, y + h * 0.3, w * 0.1, h * 0.07);
  ctx.fill();
  ctx.fillStyle = '#7cc47f';
  elipsa(x + w * 0.5, y + h, w * 0.7, h * 0.28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + w / 2 - 4, y, 8, h);
  ctx.fillRect(x, y + h / 2 - 4, w, 8);
  // firanki
  ctx.fillStyle = '#ff9bb3';
  for (const sx of [0, 1]) {
    ctx.beginPath();
    const bx = sx ? x + w + 14 : x - 14;
    const dx = sx ? -1 : 1;
    ctx.moveTo(bx, y - 16);
    ctx.lineTo(bx + dx * w * 0.32, y - 16);
    ctx.quadraticCurveTo(bx + dx * w * 0.1, y + h * 0.5, bx + dx * w * 0.2, y + h + 10);
    ctx.lineTo(bx, y + h + 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e7739a';
  zaokraglony(x - 24, y - 24, w + 48, 12, 6);
  ctx.fill();
}

// Półka ze słoikami (w świecie gry)
function rysujPolke(x, y, w) {
  ctx.fillStyle = '#c98d55';
  zaokraglony(x, y, w, 14, 5);
  ctx.fill();
  const sloiki = [['#ffd23f', 34], ['#ff7eb6', 44], ['#8fd0f5', 30], ['#9bd77f', 40]];
  let sx = x + 18;
  for (const [kolor, h] of sloiki) {
    if (sx + 40 > x + w) break;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    zaokraglony(sx, y - h, 38, h, 8);
    ctx.fill();
    ctx.fillStyle = kolor;
    zaokraglony(sx + 4, y - h * 0.7, 30, h * 0.7 - 4, 6);
    ctx.fill();
    ctx.fillStyle = '#e25b45';
    zaokraglony(sx - 2, y - h - 8, 42, 10, 4);
    ctx.fill();
    sx += 52;
  }
}

// Jadalnia: tapeta w kropki, girlanda z chorągiewek i stół z obrusem w kratkę
function rysujJadalnie(W, H, stolY, kafel) {
  ctx.fillStyle = '#dff3ff';
  ctx.fillRect(0, 0, W, stolY);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let y = kafel * 0.5, r = 0; y < stolY; y += kafel, r++) {
    for (let x = (r % 2) * kafel * 0.5; x < W; x += kafel) {
      kolo(x, y, kafel * 0.08);
      ctx.fill();
    }
  }
}

function rysujGirlande(x0, x1, y) {
  const kolory = ['#ff5a5f', '#ffd23f', '#3ddc97', '#4cc9f0', '#c77dff'];
  ctx.strokeStyle = '#8a5a34';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 40, x1, y);
  ctx.stroke();
  const ile = Math.floor((x1 - x0) / 60);
  for (let i = 1; i < ile; i++) {
    const t = i / ile;
    const x = x0 + (x1 - x0) * t;
    const yy = y + 4 * 40 * t * (1 - t) * 0.5 * 2;
    ctx.fillStyle = kolory[i % kolory.length];
    ctx.beginPath();
    ctx.moveTo(x - 18, yy);
    ctx.lineTo(x + 18, yy);
    ctx.lineTo(x, yy + 34);
    ctx.closePath();
    ctx.fill();
  }
}

function rysujObrus(W, H, stolY, kafel) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, stolY, W, H - stolY);
  ctx.fillStyle = 'rgba(255, 90, 110, 0.55)';
  const k = kafel * 0.6;
  for (let x = 0; x < W; x += k * 2) ctx.fillRect(x, stolY, k, H - stolY);
  for (let y = stolY; y < H; y += k * 2) ctx.fillRect(0, y, W, k);
  ctx.fillStyle = '#ff7b8f';
  ctx.fillRect(0, stolY, W, Math.max(5, kafel * 0.14));
}


// =====================================================
//   PRZYCISKI
// =====================================================
function rysujPrzyciskOkragly(x, y, r, ikona, kolor = '#ffffff', wcisniety = false) {
  ctx.save();
  ctx.translate(x, y + (wcisniety ? 3 : 0));
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  kolo(0, 5, r);
  ctx.fill();
  ctx.fillStyle = kolor;
  kolo(0, 0, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 3;
  ctx.stroke();
  rysujObrazek(ikona, 0, 0, r * 1.1);
  ctx.restore();
}

function rysujPrzyciskTekst(x, y, w, h, tekst, kolor, rozmiar, wcisniety = false) {
  ctx.save();
  ctx.translate(0, wcisniety ? 3 : 0);
  ctx.fillStyle = przyciemnij(kolor, 0.75);
  zaokraglony(x - w / 2, y - h / 2 + 6, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = kolor;
  zaokraglony(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  zaokraglony(x - w / 2 + 12, y - h / 2 + 6, w - 24, h * 0.3, h * 0.15);
  ctx.fill();
  napis(tekst, x, y + 1, rozmiar, '#ffffff', 'center', 'rgba(0,0,0,0.18)');
  ctx.restore();
}

// Gwiazdka (pełna albo pusta)
function rysujGwiazdke(x, y, r, pelna = true) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.48;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = pelna ? '#ffd23f' : 'rgba(0,0,0,0.12)';
  ctx.fill();
  if (pelna) {
    ctx.strokeStyle = '#f4a300';
    ctx.lineWidth = r * 0.12;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function rysujSerce(x, y, r, kolor = '#ff5a7a') {
  ctx.fillStyle = kolor;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  ctx.fill();
}
