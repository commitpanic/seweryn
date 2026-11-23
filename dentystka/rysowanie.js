'use strict';

// =====================================================
//   DENTYSTKA HELENKA – rysowanie
//   (zwierzaki, ząbki, narzędzia, gabinet i poczekalnia)
// =====================================================

const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

const CZCIONKA = '"Chalkboard SE", "Comic Sans MS", "Segoe UI", system-ui, sans-serif';
const CZCIONKA_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';


// =====================================================
//   NARZĘDZIA DO RYSOWANIA
// =====================================================
function hexNaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mieszanie dwóch kolorów: t = 0 → kolor a, t = 1 → kolor b
function mieszajKolory(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const A = hexNaRgb(a);
  const B = hexNaRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function przyciemnij(hex, ile) {
  return mieszajKolory(hex, '#000000', 1 - ile);
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

// Losowe liczby, które za każdym razem są takie same (np. plamki na ząbku)
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
  // Szukamy, gdzie naprawdę jest obrazek (żeby dobrze go wyśrodkować)
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


// =====================================================
//   ZWIERZAKI
//   Główka ma środek w (0, 0) i jest szeroka na mniej więcej 220.
//   z = { typ, otw (jak szeroko otwarta buzia 0..1), mina, oczy, brwi, zeby, woda, naklejka }
//   oczy: 'o' otwarte, 'oo' zdziwione, 'z' zamknięte, 'w' wesołe, 'k' zaciśnięte
//   mina: 'usmiech', 'smutek', 'wielki' (wielki uśmiech z błyszczącymi ząbkami)
// =====================================================

// Gdzie jest buzia i jak szeroko się otwiera
const USTA = { x: 0, y: 44, rx: 76, ry: 52 };

function oczka(dx, y, rodzaj, bialko = false, r = 12) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const kolor = bialko ? '#ffffff' : '#2b2233';
  for (const sx of [-1, 1]) {
    const x = sx * dx;
    if (rodzaj === 'w') {
      // wesołe oczka ^ ^
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.5, r, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (rodzaj === 'k') {
      // zaciśnięte oczy > <
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + sx * r * 0.7, y - r * 0.7);
      ctx.lineTo(x - sx * r * 0.6, y);
      ctx.lineTo(x + sx * r * 0.7, y + r * 0.7);
      ctx.stroke();
    } else if (rodzaj === 'z') {
      // mrugnięcie
      ctx.strokeStyle = kolor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y + r * 0.7, x + r, y);
      ctx.stroke();
    } else {
      const rr = rodzaj === 'oo' ? r * 1.3 : r;
      if (bialko) {
        ctx.fillStyle = '#ffffff';
        kolo(x, y, rr + 4);
        ctx.fill();
      }
      ctx.fillStyle = '#2b2233';
      elipsa(x, y, rr * 0.85, rr);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      kolo(x + rr * 0.3, y - rr * 0.38, rr * 0.34);
      ctx.fill();
    }
  }
}

// Smutne brewki (boli ząbek)
function brewki(dx, y, bialko = false) {
  ctx.strokeStyle = bialko ? '#ffffff' : '#3a2530';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * (dx - 14), y - 30);
    ctx.lineTo(sx * (dx + 12), y - 21);
    ctx.stroke();
  }
}

function rumience(dx, y, alfa = 0.45) {
  ctx.fillStyle = `rgba(255, 120, 150, ${alfa})`;
  for (const sx of [-1, 1]) {
    elipsa(sx * dx, y, 15, 9);
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

function wasy(kolor) {
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    for (const dy of [-8, 2, 12]) {
      ctx.beginPath();
      ctx.moveTo(sx * 58, 2 + dy * 0.4);
      ctx.lineTo(sx * 122, 2 + dy * 1.5);
      ctx.stroke();
    }
  }
}

// Wygląd każdego zwierzaka:
//   tyl   – co jest za główką (uszy, kolce)
//   glowa – główka, pyszczek i nosek
//   przod – co jest przed główką (np. klapnięte uszy pieska)
//   ogon  – ogonek (w poczekalni)
//   oczy  – gdzie są oczka; cialo, brzuch, lapa – kolory
const WYGLAD = {
  panda: {
    oczy: { dx: 44, y: -56, bialko: true },
    cialo: '#2d2b35', brzuch: '#f7f7f2', lapa: '#2d2b35',
    tyl() {
      ctx.fillStyle = '#2d2b35';
      kolo(-80, -78, 34);
      ctx.fill();
      kolo(80, -78, 34);
      ctx.fill();
    },
    glowa() {
      ctx.fillStyle = '#fbfbf7';
      elipsa(0, 0, 114, 104);
      ctx.fill();
      ctx.strokeStyle = '#e2e2da';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#2d2b35';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sx * 44, -54, 25, 31, sx * -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      elipsa(0, -24, 15, 10);
      ctx.fill();
    },
  },

  jez: {
    oczy: { dx: 42, y: -56 },
    cialo: '#c89a6a', brzuch: '#f1d3a8', lapa: '#f1d3a8',
    tyl() {
      kolce(0, -8, 152, 120, 26, '#6b4a2e');
      kolce(0, -8, 136, 110, 26, '#8a6440');
      ctx.fillStyle = '#f1d3a8';
      kolo(-74, -80, 21);
      ctx.fill();
      kolo(74, -80, 21);
      ctx.fill();
      ctx.fillStyle = '#ffb3c1';
      kolo(-74, -80, 11);
      ctx.fill();
      kolo(74, -80, 11);
      ctx.fill();
    },
    glowa() {
      ctx.fillStyle = '#f1d3a8';
      elipsa(0, 2, 108, 102);
      ctx.fill();
      ctx.fillStyle = '#f8e4c6';
      elipsa(0, 26, 88, 70);
      ctx.fill();
      ctx.fillStyle = '#2b2233';
      kolo(0, -24, 13);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      kolo(-4, -28, 4);
      ctx.fill();
    },
    ogon() {
      kolce(0, -62, 86, 66, 16, '#6b4a2e');
    },
  },

  malpka: {
    oczy: { dx: 34, y: -54 },
    cialo: '#8b5a2b', brzuch: '#f2d2a6', lapa: '#8b5a2b',
    tyl() {
      for (const sx of [-1, 1]) {
        ctx.fillStyle = '#8b5a2b';
        kolo(sx * 110, -10, 33);
        ctx.fill();
        ctx.fillStyle = '#f2c79b';
        kolo(sx * 110, -10, 19);
        ctx.fill();
      }
    },
    glowa() {
      ctx.fillStyle = '#8b5a2b';
      elipsa(0, 0, 108, 104);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-16, -98);
      ctx.quadraticCurveTo(0, -136, 22, -120);
      ctx.quadraticCurveTo(6, -116, 10, -98);
      ctx.fill();
      ctx.fillStyle = '#f2d2a6';
      kolo(-34, -52, 38);
      ctx.fill();
      kolo(34, -52, 38);
      ctx.fill();
      elipsa(0, 32, 90, 68);
      ctx.fill();
      ctx.fillStyle = '#5a3a1a';
      kolo(-7, -22, 3.5);
      ctx.fill();
      kolo(7, -22, 3.5);
      ctx.fill();
    },
    ogon(z) {
      ctx.strokeStyle = '#7a4a22';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(40, -16);
      ctx.bezierCurveTo(100, -16, 96, -86 + m, 70, -90 + m);
      ctx.bezierCurveTo(52, -92 + m, 54, -70 + m, 68, -72 + m);
      ctx.stroke();
    },
  },

  kotek: {
    oczy: { dx: 46, y: -54 },
    cialo: '#f4a340', brzuch: '#fff6ea', lapa: '#f4a340',
    tyl() {
      for (const sx of [-1, 1]) {
        ctx.fillStyle = '#f4a340';
        ctx.beginPath();
        ctx.moveTo(sx * 108, -40);
        ctx.lineTo(sx * 96, -136);
        ctx.lineTo(sx * 28, -96);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffb3c1';
        ctx.beginPath();
        ctx.moveTo(sx * 94, -56);
        ctx.lineTo(sx * 88, -118);
        ctx.lineTo(sx * 46, -94);
        ctx.closePath();
        ctx.fill();
      }
    },
    glowa() {
      ctx.fillStyle = '#f4a340';
      elipsa(0, 0, 118, 102);
      ctx.fill();
      ctx.strokeStyle = '#d47f26';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (const [x1, y1, x2, y2] of [[0, -98, 0, -76], [-22, -95, -18, -77], [22, -95, 18, -77]]) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff6ea';
      elipsa(0, 32, 92, 68);
      ctx.fill();
      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.moveTo(-11, -30);
      ctx.lineTo(11, -30);
      ctx.lineTo(0, -18);
      ctx.closePath();
      ctx.fill();
      wasy('#8a5a34');
    },
    ogon(z) {
      ctx.strokeStyle = '#e8923a';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * 2.5) * 10;
      ctx.beginPath();
      ctx.moveTo(42, -20);
      ctx.quadraticCurveTo(110 + m, -40, 92 + m, -106);
      ctx.stroke();
    },
  },

  piesek: {
    oczy: { dx: 44, y: -56 },
    cialo: '#ecc796', brzuch: '#fff4e2', lapa: '#ecc796',
    glowa() {
      ctx.fillStyle = '#ecc796';
      elipsa(0, 0, 110, 104);
      ctx.fill();
      ctx.fillStyle = '#c98f55';
      elipsa(44, -58, 30, 28);
      ctx.fill();
      ctx.fillStyle = '#fff4e2';
      elipsa(0, 30, 90, 68);
      ctx.fill();
      ctx.fillStyle = '#2b2233';
      elipsa(0, -24, 17, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      elipsa(-5, -28, 5, 3);
      ctx.fill();
    },
    przod() {
      ctx.fillStyle = '#8a5a34';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sx * 112, -14, 28, 64, sx * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    ogon(z) {
      ctx.strokeStyle = '#e0b07a';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      const m = Math.sin((z.t || 0) * (z.leczony ? 14 : 3)) * (z.leczony ? 16 : 6);
      ctx.beginPath();
      ctx.moveTo(44, -24);
      ctx.quadraticCurveTo(80, -38, 84 + m, -86);
      ctx.stroke();
    },
  },

  krolik: {
    oczy: { dx: 42, y: -54 },
    cialo: '#f4f1f4', brzuch: '#ffffff', lapa: '#f4f1f4',
    tyl(z) {
      // na fotelu uszy leżą na boki, żeby nie wystawały za ekran
      const rozchyl = z.naFotelu ? 1.0 : 0.18;
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(sx * 44, -90);
        ctx.rotate(sx * (rozchyl + Math.sin((z.t || 0) * 2 + sx) * 0.04));
        ctx.fillStyle = '#f4f1f4';
        elipsa(0, -62, 26, 72);
        ctx.fill();
        ctx.strokeStyle = '#e3dbe3';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffc2d1';
        elipsa(0, -58, 13, 56);
        ctx.fill();
        ctx.restore();
      }
    },
    glowa() {
      ctx.fillStyle = '#f4f1f4';
      elipsa(0, 0, 110, 102);
      ctx.fill();
      ctx.strokeStyle = '#e3dbe3';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      elipsa(0, 28, 88, 68);
      ctx.fill();
      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.moveTo(-10, -30);
      ctx.lineTo(10, -30);
      ctx.quadraticCurveTo(0, -14, -10, -30);
      ctx.fill();
      wasy('#b9aeb9');
    },
    ogon() {
      ctx.fillStyle = '#ffffff';
      kolo(56, -18, 17);
      ctx.fill();
    },
  },
};

// Cała główka zwierzaka. (x, y) to środek główki, s to wielkość.
function rysujGlowe(z, x, y, s) {
  const W = WYGLAD[z.typ];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (z.przechyl) ctx.rotate(z.przechyl);
  if (W.tyl) W.tyl(z);
  W.glowa(z);
  rumience(80, 8);
  oczka(W.oczy.dx, W.oczy.y, z.oczy, !!W.oczy.bialko);
  if (z.brwi) brewki(W.oczy.dx, W.oczy.y, !!W.oczy.bialko);
  if (z.otw > 0.12) rysujUsta(z, z.otw);
  else rysujUsmiech(z);
  if (W.przod) W.przod(z);
  if (z.naklejka) rysujNaklejke(z.naklejka, -84, 26, 22, -0.25);
  ctx.restore();
}

// Zamknięta buzia
function rysujUsmiech(z) {
  const kolor = '#3a2530';
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (z.mina === 'wielki') {
    // wielki uśmiech – widać czyściutkie ząbki
    ctx.beginPath();
    ctx.moveTo(-46, 28);
    ctx.quadraticCurveTo(0, 100, 46, 28);
    ctx.closePath();
    ctx.fillStyle = '#7a2230';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ff6f8a';
    elipsa(0, 66, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-46, 24, 92, 16);
    ctx.strokeStyle = '#e3e8ef';
    ctx.lineWidth = 1.5;
    for (const x of [-24, -8, 8, 24]) {
      ctx.beginPath();
      ctx.moveTo(x, 28);
      ctx.lineTo(x, 40);
      ctx.stroke();
    }
    ctx.restore();
    // obwódka uśmiechu
    ctx.beginPath();
    ctx.moveTo(-46, 28);
    ctx.quadraticCurveTo(0, 100, 46, 28);
    ctx.closePath();
    ctx.strokeStyle = kolor;
    ctx.lineWidth = 4;
    ctx.stroke();
    return;
  }
  if (z.mina === 'smutek') {
    ctx.beginPath();
    ctx.moveTo(-22, 50);
    ctx.quadraticCurveTo(0, 32, 22, 50);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-30, 32);
    ctx.quadraticCurveTo(0, 62, 30, 32);
    ctx.stroke();
  }
  if (z.typ === 'krolik') {
    // dwa duże przednie ząbki
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d8cdb8';
    ctx.lineWidth = 2;
    const y0 = z.mina === 'smutek' ? 40 : 46;
    zaokraglony(-12, y0, 11, 15, 3);
    ctx.fill();
    ctx.stroke();
    zaokraglony(1, y0, 11, 15, 3);
    ctx.fill();
    ctx.stroke();
  }
}

// Szeroko otwarta buzia: dziąsła, język, woda i wszystkie ząbki
function rysujUsta(z, otw) {
  const U = USTA;
  const ry = Math.max(4, U.ry * otw);
  ctx.fillStyle = '#4a1826';
  elipsa(U.x, U.y, U.rx + 5, ry + 5);
  ctx.fill();
  ctx.save();
  elipsa(U.x, U.y, U.rx, ry);
  ctx.clip();
  ctx.fillStyle = '#ff9fb0';
  ctx.fillRect(U.x - U.rx, U.y - ry, U.rx * 2, ry * 2);
  ctx.fillStyle = '#7a2230';
  elipsa(U.x, U.y, U.rx * 0.8, ry * 0.62);
  ctx.fill();
  ctx.fillStyle = '#561522';
  elipsa(U.x, U.y - ry * 0.12, U.rx * 0.42, ry * 0.36);
  ctx.fill();
  // język
  ctx.fillStyle = '#ff6f8a';
  elipsa(U.x, U.y + ry * 0.58, U.rx * 0.56, ry * 0.46);
  ctx.fill();
  ctx.strokeStyle = '#e2506d';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(U.x, U.y + ry * 0.3);
  ctx.lineTo(U.x, U.y + ry * 0.72);
  ctx.stroke();
  // woda na dnie buzi
  if (z.woda > 0.005) {
    const gora = U.y + ry - ry * 1.15 * Math.min(1, z.woda);
    ctx.fillStyle = 'rgba(120, 195, 255, 0.65)';
    ctx.beginPath();
    ctx.moveTo(U.x - U.rx, U.y + ry + 2);
    for (let x = -U.rx; x <= U.rx; x += 6) {
      ctx.lineTo(U.x + x, gora + Math.sin(x * 0.12 + czas * 4) * 2.2);
    }
    ctx.lineTo(U.x + U.rx, U.y + ry + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(U.x - 30, gora + 4);
    ctx.lineTo(U.x - 14, gora + 4);
    ctx.moveTo(U.x + 10, gora + 6);
    ctx.lineTo(U.x + 20, gora + 6);
    ctx.stroke();
  }
  ctx.restore();
  if (otw < 0.3 || !z.zeby) return;   // ząbki widać dopiero, jak buzia jest otwarta
  ctx.save();
  ctx.globalAlpha *= Math.min(1, (otw - 0.3) / 0.3);
  const geo = z.zeby.map((zab) => geometriaZeba(z.typ, zab, otw));
  z.zeby.forEach((zab, i) => {
    if (!zab.wyjety) rysujZab(zab, geo[i]);
  });
  z.zeby.forEach((zab, i) => {
    if (zab.wyjety) return;
    rysujResztke(zab, geo[i]);
    rysujPiane(zab, geo[i]);
    rysujZnacznik(zab, geo[i]);
  });
  ctx.restore();
}


// =====================================================
//   ZĄBKI
//   W każdej buzi jest 6 ząbków na górze i 6 na dole (k = 0..5, od lewej).
// =====================================================
const SZEROKOSCI_ZEBOW = [18, 22, 26, 26, 22, 18];
const WYSOKOSCI_ZEBOW = [20, 23, 28, 28, 23, 20];

// Jaki kształt ma ząbek: kotek i piesek mają kły, a króliczek wielkie przednie ząbki
function ksztaltZeba(typ, gora, k) {
  let w = SZEROKOSCI_ZEBOW[k];
  let h = WYSOKOSCI_ZEBOW[k];
  let szpic = false;
  if ((typ === 'kotek' || typ === 'piesek') && (k === 0 || k === 5)) {
    szpic = true;
    h += 7;
  }
  if (typ === 'krolik' && gora && (k === 2 || k === 3)) {
    w += 3;
    h += 12;
  }
  return { w, h, szpic };
}

// Gdzie stoi ząbek w buzi. Zwraca:
//   (x, y) – korzeń przy dziąśle, (nx, ny) – kierunek do środka buzi, obrot,
//   (sx, sy) – środek ząbka, (kx, ky) – czubek ząbka
function geometriaZeba(typ, zab, otw) {
  const rzad = [0, 1, 2, 3, 4, 5].map((k) => ksztaltZeba(typ, zab.gora, k));
  const ks = rzad[zab.k];
  let suma = 0;
  for (const r of rzad) suma += r.w;
  let x = -suma / 2;
  for (let j = 0; j < zab.k; j++) x += rzad[j].w;
  x += ks.w / 2;
  const ry = Math.max(4, USTA.ry * otw);
  const t = Math.min(0.95, Math.abs(x) / USTA.rx);
  const p = Math.sqrt(1 - t * t);
  const y = USTA.y + (zab.gora ? -1 : 1) * ry * p * 0.9;
  let nx = (-x / (USTA.rx * USTA.rx)) * 0.5;
  let ny = -(y - USTA.y) / (ry * ry);
  const d = Math.hypot(nx, ny) || 1;
  nx /= d;
  ny /= d;
  return {
    x, y, nx, ny,
    obrot: Math.atan2(ny, nx) - Math.PI / 2,
    w: ks.w, h: ks.h, szpic: ks.szpic,
    sx: x + nx * ks.h * 0.5, sy: y + ny * ks.h * 0.5,
    kx: x + nx * ks.h, ky: y + ny * ks.h,
  };
}

// Gdzie jest dziurka w ząbku (w buzi)
function miejsceDziurki(g) {
  return { x: g.x + g.nx * g.h * 0.58, y: g.y + g.ny * g.h * 0.58 };
}

// Kształt ząbka: (0, 0) przy dziąśle, ząbek rośnie w dół (do +h)
function sciezkaZeba(w, h, szpic) {
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  if (szpic) {
    ctx.lineTo(w / 2, h * 0.4);
    ctx.quadraticCurveTo(w * 0.35, h * 0.85, 0, h);
    ctx.quadraticCurveTo(-w * 0.35, h * 0.85, -w / 2, h * 0.4);
  } else {
    const r = w * 0.42;
    ctx.lineTo(w / 2, h - r);
    ctx.quadraticCurveTo(w / 2, h, w / 2 - r, h);
    ctx.lineTo(-w / 2 + r, h);
    ctx.quadraticCurveTo(-w / 2, h, -w / 2, h - r);
  }
  ctx.closePath();
}

function rysujZab(zab, g) {
  ctx.save();
  ctx.translate(g.x + zab.dx, g.y + zab.dy);
  ctx.rotate(g.obrot + zab.kiwanie);
  sciezkaZeba(g.w, g.h, g.szpic);
  ctx.fillStyle = mieszajKolory('#fffdf7', '#e2c878', zab.brud * 0.75);
  ctx.fill();
  ctx.strokeStyle = '#d6c9b3';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(200, 160, 150, 0.3)';
  ctx.fillRect(-g.w / 2, 0, g.w, 3);
  if (zab.brud > 0.02) {
    // plamki brudu
    const los = losowaZNasiona(zab.nasiono);
    ctx.fillStyle = `rgba(150, 105, 35, ${Math.min(0.6, zab.brud * 0.6)})`;
    for (let i = 0; i < 4; i++) {
      kolo((los() - 0.5) * g.w * 0.8, g.h * (0.25 + los() * 0.65), 2.5 + los() * 3.5);
      ctx.fill();
    }
  }
  ctx.restore();
  // błysk
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  elipsa(-g.w * 0.22, g.h * 0.4, g.w * 0.09, g.h * 0.18);
  ctx.fill();
  if (zab.dziurka) rysujDziurke(zab, g);
  if (zab.rusza && !zab.chwycony) {
    // kreseczki: ząbek się rusza
    ctx.strokeStyle = 'rgba(255, 159, 28, 0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * (g.w / 2 + 2), g.h * 0.55, 5, sx > 0 ? -0.9 : Math.PI - 0.9, sx > 0 ? 0.9 : Math.PI + 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx * (g.w / 2 + 2), g.h * 0.55, 9, sx > 0 ? -0.7 : Math.PI - 0.7, sx > 0 ? 0.7 : Math.PI + 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Dziurka: czarna → wywiercona → plomba → twarda, błyszcząca plomba
function rysujDziurke(zab, g) {
  const cx = 0;
  const cy = g.h * 0.58;
  const r = Math.min(g.w, g.h) * 0.28;
  if (zab.dziurka >= 2 || zab.wier > 0) {
    ctx.fillStyle = '#efc2b2';
    kolo(cx, cy, r);
    ctx.fill();
    ctx.strokeStyle = '#c08a78';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = 'rgba(160, 90, 80, 0.35)';
    kolo(cx + r * 0.2, cy + r * 0.2, r * 0.55);
    ctx.fill();
  }
  if (zab.dziurka === 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - zab.wier;
    ctx.fillStyle = '#3a2614';
    kolo(cx, cy, r * 1.05);
    ctx.fill();
    kolo(cx + r * 0.55, cy - r * 0.35, r * 0.6);
    ctx.fill();
    kolo(cx - r * 0.5, cy + r * 0.4, r * 0.5);
    ctx.fill();
    ctx.fillStyle = '#5e4024';
    kolo(cx - r * 0.25, cy - r * 0.2, r * 0.35);
    ctx.fill();
    ctx.restore();
  }
  const p = zab.dziurka >= 3 ? 1 : zab.dziurka === 2 ? zab.plo : 0;
  if (p > 0) {
    ctx.fillStyle = zab.kolorPlomby;
    kolo(cx, cy, r * 1.1 * Math.min(1, p));
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    kolo(cx - r * 0.35, cy - r * 0.35, r * 0.3 * p);
    ctx.fill();
  }
  if (zab.dziurka === 3 && zab.lam > 0) {
    ctx.fillStyle = `rgba(150, 220, 255, ${zab.lam * 0.55})`;
    kolo(cx, cy, r * 1.6);
    ctx.fill();
  }
  if (zab.dziurka === 4) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.5;
    kolo(cx, cy, r * 1.1);
    ctx.stroke();
    rysujIskierke(cx + r * 0.7, cy - r * 0.7, r * 0.8 * (0.7 + 0.3 * Math.sin(czas * 5 + zab.nasiono)));
  }
}

// Piana z pasty do zębów
function rysujPiane(zab, g) {
  if (zab.piana < 0.04) return;   // tak mało piany już nie widać
  const los = losowaZNasiona(zab.nasiono + 7);
  const ile = Math.ceil(zab.piana * 7);
  for (let i = 0; i < 7; i++) {
    const x = g.sx + (los() - 0.5) * g.w * 1.4;
    const y = g.sy + (los() - 0.5) * g.h * 1.2;
    const r = 3 + los() * 4.5;
    if (i >= ile) continue;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    kolo(x, y, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 215, 240, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

// Resztka jedzenia przyklejona do ząbka
function rysujResztke(zab, g) {
  if (!zab.resztka) return;
  const kiw = zab.resztkaKiw ? Math.sin(czas * 30) * 0.35 * zab.resztkaKiw : 0;
  rysujEmotke(zab.resztka, g.kx + g.w * 0.35, g.ky - g.ny * 5, 18, -0.4 + kiw + (zab.nasiono % 7) * 0.1);
}

// Czerwone kółko wokół chorego ząbka (po obejrzeniu lusterkiem)
function rysujZnacznik(zab, g) {
  if (!zab.znaleziony) return;
  const problem = zab.dziurka === 1 || (zab.rusza && !zab.wyjety);
  if (!problem) return;
  const p = 0.5 + 0.5 * Math.sin(czas * 5);
  ctx.strokeStyle = `rgba(255, 90, 95, ${0.45 + 0.35 * p})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 4]);
  kolo(g.sx + zab.dx, g.sy + zab.dy, Math.max(g.w, g.h) * 0.72 + p * 3);
  ctx.stroke();
  ctx.setLineDash([]);
}


// =====================================================
//   CIAŁO ZWIERZAKA
// =====================================================
// Fotel dentystyczny (za pacjentem). (x, y) to środek główki.
function rysujFotelDentystyczny(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#3fb5a8';
  zaokraglony(-152, -60, 304, 460, 72);
  ctx.fill();
  ctx.fillStyle = '#5ccfc1';
  zaokraglony(-132, -44, 264, 440, 60);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  zaokraglony(-110, -30, 40, 200, 20);
  ctx.fill();
  ctx.restore();
}

// Ciało na fotelu, ze śliniaczkiem. (x, y) to środek główki.
function rysujCialoNaFotelu(z, x, y, s) {
  const W = WYGLAD[z.typ];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = W.cialo;
  elipsa(0, 190, 124, 104);
  ctx.fill();
  ctx.fillStyle = W.brzuch;
  elipsa(0, 214, 74, 84);
  ctx.fill();
  // śliniaczek
  ctx.fillStyle = '#8fd3ff';
  ctx.beginPath();
  ctx.moveTo(-80, 96);
  ctx.lineTo(80, 96);
  ctx.lineTo(94, 240);
  ctx.lineTo(-94, 240);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6cc1f5';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#c0c8d0';
  kolo(-76, 102, 7);
  ctx.fill();
  kolo(76, 102, 7);
  ctx.fill();
  ctx.restore();
}

// Zwierzak siedzący na krześle w poczekalni. (x, y) to miejsce, gdzie siedzi.
function rysujPacjentaWPoczekalni(z, x, y, s) {
  const W = WYGLAD[z.typ];
  ctx.save();
  ctx.translate(x + (z.drzenie || 0), y - (z.skok || 0));
  ctx.scale(s, s);
  if (W.ogon) W.ogon(z);
  ctx.fillStyle = W.cialo;
  elipsa(0, -56, 60, 58);
  ctx.fill();
  ctx.fillStyle = W.brzuch;
  elipsa(0, -48, 36, 44);
  ctx.fill();
  ctx.fillStyle = W.lapa;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 2;
  for (const sx of [-1, 1]) {
    elipsa(sx * 28, -4, 20, 13);
    ctx.fill();
    ctx.stroke();
  }
  rysujGlowe(z, 0, -160, 0.6);
  if (!z.leczony) {
    // łapka przy policzku – boli ząbek!
    ctx.fillStyle = W.lapa;
    elipsa(-58, -150, 15, 19);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}


// =====================================================
//   NARZĘDZIA DENTYSTY
//   Czubek narzędzia jest w (0, 0), a rączka idzie w dół (do +y).
//   st = { zoom, kreci, swieci, kolor, zacisk } – co teraz robi narzędzie
// =====================================================
const DLUGOSC_NARZEDZIA = {
  lusterko: 150, szczoteczka: 160, woda: 146, ssak: 144,
  wiertlo: 152, plomba: 132, lampka: 144, kleszcze: 140,
};

// Kropelka wody (np. na rączce spryskiwacza)
function rysujKropelke(x, y, r, kolor) {
  ctx.fillStyle = kolor;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.5);
  ctx.quadraticCurveTo(x + r, y - r * 0.2, x + r, y + r * 0.2);
  ctx.arc(x, y + r * 0.2, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.5);
  ctx.fill();
}

const RYSUJ_NARZEDZIE = {
  lusterko(st) {
    ctx.fillStyle = '#aeb9c5';
    zaokraglony(-3, 18, 6, 40, 3);
    ctx.fill();
    ctx.fillStyle = '#cfd8e1';
    zaokraglony(-7, 52, 14, 98, 7);
    ctx.fill();
    ctx.fillStyle = '#4cc9f0';
    zaokraglony(-8, 96, 16, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#8e9aa7';
    kolo(0, 0, 25);
    ctx.fill();
    if (!st.zoom) {
      ctx.fillStyle = '#dff4ff';
      kolo(0, 0, 20);
      ctx.fill();
    } else {
      ctx.save();
      kolo(0, 0, 20);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#b8c4d0';
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-2, -12);
    ctx.stroke();
  },

  szczoteczka() {
    ctx.fillStyle = '#ff7eb6';
    zaokraglony(-5, -32, 10, 64, 5);
    ctx.fill();
    zaokraglony(-9, 26, 18, 134, 9);
    ctx.fill();
    ctx.fillStyle = '#ffd1e6';
    zaokraglony(-3, 50, 6, 90, 3);
    ctx.fill();
    // włosie
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#ffffff';
      zaokraglony(-25, -29 + i * 10, 21, 8, 3);
      ctx.fill();
      ctx.strokeStyle = '#cfe0ec';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // pasta
    ctx.fillStyle = '#9ff0d6';
    elipsa(-31, -8, 8, 24);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    elipsa(-32, -8, 3, 19);
    ctx.fill();
  },

  woda() {
    ctx.strokeStyle = '#9aa6b2';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3, 18, 0, 32);
    ctx.stroke();
    ctx.fillStyle = '#eef2f6';
    zaokraglony(-10, 28, 20, 118, 10);
    ctx.fill();
    ctx.strokeStyle = '#c3ccd6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a86ff';
    kolo(0, 52, 6);
    ctx.fill();
    rysujKropelke(0, 100, 7, '#3a86ff');
  },

  ssak() {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#b8c4d0';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-7, 26, 0, 50);
    ctx.stroke();
    ctx.strokeStyle = '#f4f8fb';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#5c6774';
    elipsa(0, 1, 5, 3.5);
    ctx.fill();
    ctx.fillStyle = '#8d99ae';
    zaokraglony(-10, 48, 20, 96, 10);
    ctx.fill();
    ctx.fillStyle = '#6c7a8f';
    for (const y of [70, 84, 98]) ctx.fillRect(-10, y, 20, 4);
  },

  wiertlo(st) {
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 14);
    ctx.stroke();
    if (st.kreci) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const y = 1 + ((czas * 70 + i * 4) % 12);
        ctx.beginPath();
        ctx.moveTo(-2.5, y);
        ctx.lineTo(2.5, y + 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#c9d3dc';
    zaokraglony(-9, 12, 18, 22, 7);
    ctx.fill();
    ctx.fillStyle = '#b5c0cb';
    zaokraglony(-6, 30, 12, 30, 5);
    ctx.fill();
    ctx.fillStyle = '#e6ecf1';
    zaokraglony(-10, 56, 20, 96, 10);
    ctx.fill();
    ctx.strokeStyle = '#c3ccd6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9b5de5';
    zaokraglony(-11, 66, 22, 10, 4);
    ctx.fill();
  },

  plomba(st) {
    const kol = st.kolor || KOLORY_PLOMB[0];
    ctx.fillStyle = '#aeb9c5';
    zaokraglony(-2.5, -2, 5, 20, 2.5);
    ctx.fill();
    ctx.fillStyle = kol;
    kolo(0, -2, 5.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    zaokraglony(-11, 16, 22, 76, 7);
    ctx.fill();
    ctx.strokeStyle = '#c9d2dc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = kol;
    zaokraglony(-8, 19, 16, 44, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.5;
    for (const y of [30, 42, 54, 66, 78]) {
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(10, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#f15bb5';
    ctx.fillRect(-3, 90, 6, 34);
    zaokraglony(-16, 122, 32, 10, 4);
    ctx.fill();
  },

  lampka(st) {
    ctx.strokeStyle = '#5f6b78';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-5, 18, 0, 34);
    ctx.stroke();
    ctx.fillStyle = st.swieci ? '#d9f6ff' : '#7fb8d6';
    kolo(0, 1, 6.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 159, 28, 0.85)';
    elipsa(0, 34, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    zaokraglony(-12, 36, 24, 108, 11);
    ctx.fill();
    ctx.strokeStyle = '#c9d2dc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#00a6ed';
    kolo(0, 62, 6);
    ctx.fill();
    zaokraglony(-12, 122, 24, 22, 10);
    ctx.fill();
  },

  kleszcze(st) {
    const roz = 1 - (st.zacisk || 0);   // jak szeroko otwarte są szczęki
    ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = '#a3afbb';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(sx * (3 + roz * 8), -6);
      ctx.quadraticCurveTo(sx * (9 + roz * 6), 16, sx * 3, 36);
      ctx.stroke();
      ctx.strokeStyle = '#c3ccd5';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(0, 38);
      ctx.quadraticCurveTo(sx * 6, 80, sx * (20 + roz * 6), 136);
      ctx.stroke();
      ctx.strokeStyle = '#f4a300';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(sx * (12 + roz * 3), 96);
      ctx.lineTo(sx * (20 + roz * 6), 136);
      ctx.stroke();
    }
    ctx.fillStyle = '#7d8894';
    kolo(0, 38, 7);
    ctx.fill();
  },
};

// Narysuj narzędzie: (x, y) to czubek, obrot – jak przechylona jest rączka
function rysujNarzedzie(id, x, y, s, obrot, st = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(obrot);
  ctx.scale(s, s);
  RYSUJ_NARZEDZIE[id](st);
  ctx.restore();
}

// Gdzie jest koniec rączki (tam podpinamy kabel)
function koniecNarzedzia(id, x, y, s, obrot) {
  const L = DLUGOSC_NARZEDZIA[id] * s;
  return { x: x - Math.sin(obrot) * L, y: y + Math.cos(obrot) * L };
}

// Kabel od tacy do narzędzia
function rysujPrzewod(x0, y0, x1, y1) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#8f9aa6';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 90, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// Niebieskie światło lampki
function rysujSwiatloLampki(x, y, r) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(170, 230, 255, 0.75)');
  g.addColorStop(0.5, 'rgba(90, 180, 255, 0.35)');
  g.addColorStop(1, 'rgba(90, 180, 255, 0)');
  ctx.fillStyle = g;
  kolo(x, y, r);
  ctx.fill();
}


// =====================================================
//   GABINET
// =====================================================
// Ściana gabinetu. W i H to cały ekran (w pikselach), podlogaY – gdzie zaczyna się podłoga.
function rysujScianeGabinetu(W, H, podlogaY, pas) {
  ctx.fillStyle = '#e3f6f3';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let x = (W / 2) % (pas * 2) - pas * 2; x < W; x += pas * 2) ctx.fillRect(x, 0, pas, podlogaY);
  ctx.fillStyle = '#bfe8e1';
  ctx.fillRect(0, podlogaY - pas * 0.35, W, pas * 0.35);
  ctx.fillStyle = '#cfe4f2';
  ctx.fillRect(0, podlogaY, W, H - podlogaY);
}

// Lampa nad fotelem
function rysujLampeGabinetu(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#c9d6df';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-40, -400);
  ctx.lineTo(-40, -60);
  ctx.quadraticCurveTo(-40, -16, 0, -10);
  ctx.stroke();
  ctx.fillStyle = '#eef3f7';
  elipsa(20, 0, 72, 40);
  ctx.fill();
  ctx.strokeStyle = '#c9d6df';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#fff6c9';
  elipsa(26, 12, 54, 22);
  ctx.fill();
  ctx.restore();
}

// Plakat „Myj ząbki!”
function rysujPlakat(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  zaokraglony(-86, -96, 180, 210, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(-90, -104, 180, 210, 16);
  ctx.fill();
  ctx.strokeStyle = '#ff7eb6';
  ctx.lineWidth = 6;
  ctx.stroke();
  rysujIkoneZeba(-10, -14, 46, 'wesoly');
  rysujNarzedzie('szczoteczka', 42, -38, 0.55, 0.5);
  napis('Myj ząbki!', 0, 76, 24, '#ff5a8a');
  ctx.restore();
}

// Pudełeczko na wyrwane ząbki
function rysujPudelko(x, y, s, ile) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  elipsa(0, 44, 70, 10);
  ctx.fill();
  ctx.fillStyle = '#ff9fb0';
  zaokraglony(-60, -10, 120, 56, 12);
  ctx.fill();
  // ząbki w środku
  for (let i = 0; i < Math.min(ile, 6); i++) {
    rysujIkoneZeba(-40 + i * 16, -14, 9, 'wesoly');
  }
  ctx.fillStyle = '#ff7eb6';
  zaokraglony(-66, -30, 132, 26, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  kolo(0, -17, 15);
  ctx.fill();
  rysujIkoneZeba(0, -17, 10, 'wesoly');
  ctx.restore();
}

// Taca z narzędziami
function rysujTace(x, y, w, h) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  zaokraglony(x - w / 2, y - h / 2 + 8, w, h, 28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - w / 2, y - h / 2, w, h, 28);
  ctx.fill();
  ctx.strokeStyle = '#bfe6e0';
  ctx.lineWidth = 5;
  ctx.stroke();
}


// =====================================================
//   POCZEKALNIA
// =====================================================
function rysujScianePoczekalni(W, H, podlogaY, pas) {
  ctx.fillStyle = '#f1ebff';
  ctx.fillRect(0, 0, W, podlogaY);
  // kropeczki na tapecie
  ctx.fillStyle = 'rgba(199, 125, 255, 0.12)';
  for (let y = pas * 0.5; y < podlogaY - pas; y += pas) {
    for (let x = ((y / pas) % 2) * pas * 0.5; x < W; x += pas) {
      kolo(x, y, pas * 0.08);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#d9ccff';
  ctx.fillRect(0, podlogaY - pas * 1.2, W, pas * 1.2);
  ctx.fillStyle = '#c7b5fb';
  ctx.fillRect(0, podlogaY - pas * 1.2, W, pas * 0.18);
  ctx.fillStyle = '#f3d9b1';
  ctx.fillRect(0, podlogaY, W, H - podlogaY);
  ctx.strokeStyle = 'rgba(180, 130, 80, 0.25)';
  ctx.lineWidth = Math.max(1, pas * 0.04);
  for (let y = podlogaY + pas * 0.6; y < H; y += pas * 0.6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

// Szyld z nazwą gabinetu
function rysujSzyld(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  zaokraglony(-250, -48, 500, 104, 30);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(-250, -56, 500, 104, 30);
  ctx.fill();
  ctx.strokeStyle = '#4cc9f0';
  ctx.lineWidth = 6;
  ctx.stroke();
  rysujIkoneZeba(-196, -4, 34, 'wesoly');
  napis('Dentystka Helenka', 28, -4, 42, '#ff5a8a', 'center', '#ffe1ec');
  ctx.restore();
}

function rysujOkno(x, y, w, h) {
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - 10, y - 10, w + 20, h + 20, 16);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8fd3ff');
  g.addColorStop(1, '#d8f1ff');
  ctx.fillStyle = g;
  zaokraglony(x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  for (const [cx, cy, r] of [[0.3, 0.35, 0.1], [0.4, 0.3, 0.13], [0.52, 0.36, 0.09]]) {
    kolo(x + w * cx, y + h * cy, w * r);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd23f';
  kolo(x + w * 0.78, y + h * 0.28, w * 0.1);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + w / 2 - 4, y, 8, h);
  ctx.fillRect(x, y + h / 2 - 4, w, 8);
}

function rysujKrzeslo(x, y, s, kolor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = przyciemnij(kolor, 0.8);
  ctx.fillRect(-58, 6, 10, 64);
  ctx.fillRect(48, 6, 10, 64);
  ctx.fillStyle = kolor;
  zaokraglony(-72, -150, 144, 150, 30);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  zaokraglony(-58, -138, 116, 40, 18);
  ctx.fill();
  ctx.fillStyle = przyciemnij(kolor, 0.9);
  zaokraglony(-78, -6, 156, 18, 9);
  ctx.fill();
  ctx.restore();
}


// =====================================================
//   RÓŻNE OBRAZKI
// =====================================================
// Ząbek z buźką: mina 'smutek' albo 'wesoly'. r to mniej więcej pół szerokości.
function rysujIkoneZeba(x, y, r, mina) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r / 40, r / 40);
  ctx.beginPath();
  ctx.moveTo(-36, -22);
  ctx.bezierCurveTo(-40, -46, -16, -48, 0, -36);
  ctx.bezierCurveTo(16, -48, 40, -46, 36, -22);
  ctx.bezierCurveTo(34, 0, 30, 10, 26, 30);
  ctx.bezierCurveTo(22, 46, 12, 46, 9, 30);
  ctx.bezierCurveTo(6, 16, -6, 16, -9, 30);
  ctx.bezierCurveTo(-12, 46, -22, 46, -26, 30);
  ctx.bezierCurveTo(-30, 10, -34, 0, -36, -22);
  ctx.closePath();
  ctx.fillStyle = mina === 'smutek' ? '#fff3d6' : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#9fb3c8';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#2b2233';
  kolo(-12, -14, 4.5);
  ctx.fill();
  kolo(12, -14, 4.5);
  ctx.fill();
  ctx.strokeStyle = '#2b2233';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mina === 'smutek') {
    ctx.moveTo(-9, 6);
    ctx.quadraticCurveTo(0, -2, 9, 6);
    ctx.stroke();
    ctx.fillStyle = '#5e4024';
    kolo(20, -26, 6);
    ctx.fill();
  } else {
    ctx.moveTo(-11, -2);
    ctx.quadraticCurveTo(0, 10, 11, -2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    kolo(-22, -4, 5);
    ctx.fill();
    kolo(22, -4, 5);
    ctx.fill();
  }
  ctx.restore();
}

// Chmurka z myślą nad główką
function rysujChmurke(x, y, r, rysujTresc) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 3;
  for (const [dx, dy, k] of [[-0.75, 1.3, 0.16], [-0.45, 1.0, 0.24], [0, 0, 1]]) {
    kolo(x + dx * r, y + dy * r, r * k);
    ctx.fill();
    ctx.stroke();
  }
  rysujTresc(x, y, r);
  ctx.restore();
}

// Okrągła naklejka z obrazkiem
function rysujNaklejke(e, x, y, r, obrot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(obrot);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  kolo(1.5, r * 0.12, r);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  kolo(0, 0, r);
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = r * 0.12;
  kolo(0, 0, r * 0.88);
  ctx.stroke();
  rysujEmotke(e, 0, 0, r * 1.2);
  ctx.restore();
}

// Błysk – gwiazdka z 4 ramionami
function rysujIskierke(x, y, r) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 63, 0.9)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
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

// Rączka z podpowiedzią – czubek palca jest w (x, y)
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
  rysujEmotke(ikona, 0, 0, r * 1.1);
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
