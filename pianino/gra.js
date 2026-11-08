'use strict';

// =====================================================
//   SPADAJĄCE NUTY – gra o pianinie
//   Pomysł: Seweryn
// =====================================================
//
//  Zasady:
//   - Z góry spadają kolorowe prostokąty.
//   - Każdy prostokąt leci na jeden klawisz pianina.
//   - Kiedy prostokąt doleci do klawiatury, naciśnij ten klawisz!
//   - Trafienie = 1 punkt.
//   - Przepuszczony prostokąt = minus 1 życie.
//   - Masz 3 życia. Gra trwa, aż wszystkie stracisz.


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  zycia: 3,                       // ile żyć na start
  punktyNaPoziom: 10,             // co ile punktów gra przyspiesza
  czasSpadaniaNaStart: 3.0,       // ile sekund prostokąt leci z góry na dół, gdy prędkość = 1
  predkoscNaStart: 1.0,           // prędkość na poziomie 1 (2 = dwa razy szybciej)
  wzrostPredkosciNaPoziom: 0.05,  // o ile rośnie prędkość na każdym nowym poziomie
  predkoscNajwieksza: 2.7,        // szybciej już nie będzie
  odstepNaStart: 0.85,            // co ile sekund pojawia się nowy prostokąt na początku
  odstepNajkrotszy: 0.38,         // ...a co ile najczęściej
  skracanieOdstepuNaPoziom: 0.035,

  // Jak wcześnie można nacisnąć klawisz, zanim prostokąt doleci.
  // To kawałek wysokości planszy: 0.06 = trochę, 0.2 = sporo, 1 = od razu, jak tylko się pojawi.
  zapasWczesnie: 1,
  // Jak późno można jeszcze nacisnąć, kiedy prostokąt wjeżdża w klawisze
  zapasPozno: 0.07,

  // Od którego poziomu prostokąty spadają też na czarne klawisze (W E R T Y)
  poziomCzarnych: 20,
  // Jak często wtedy pojawia się czarny prostokąt (0.3 = mniej więcej co trzeci)
  szansaCzarnych: 0.3,
};


// ---------- KLAWISZE PIANINA ----------
// Białe klawisze – na nie spadają prostokąty.
// "klawisz" to litera na klawiaturze komputera, "czestotliwosc" to wysokość dźwięku.
const BIALE = [
  { nuta: 'C', klawisz: 'A', kod: 'KeyA', czestotliwosc: 261.63, kolor: '#ff5a5f' },
  { nuta: 'D', klawisz: 'S', kod: 'KeyS', czestotliwosc: 293.66, kolor: '#ff9f1c' },
  { nuta: 'E', klawisz: 'D', kod: 'KeyD', czestotliwosc: 329.63, kolor: '#ffd23f' },
  { nuta: 'F', klawisz: 'F', kod: 'KeyF', czestotliwosc: 349.23, kolor: '#3ddc97' },
  { nuta: 'G', klawisz: 'G', kod: 'KeyG', czestotliwosc: 392.00, kolor: '#4cc9f0' },
  { nuta: 'A', klawisz: 'H', kod: 'KeyH', czestotliwosc: 440.00, kolor: '#6c8cff' },
  { nuta: 'H', klawisz: 'J', kod: 'KeyJ', czestotliwosc: 493.88, kolor: '#c77dff' },
];

// Czarne klawisze – można na nich grać dla zabawy, ale prostokąty na nie nie spadają.
// "po" mówi, za którym białym klawiszem leży czarny (0 = za C, 1 = za D, ...).
const CZARNE = [
  { nuta: 'Cis', klawisz: 'W', kod: 'KeyW', czestotliwosc: 277.18, po: 0 },
  { nuta: 'Dis', klawisz: 'E', kod: 'KeyE', czestotliwosc: 311.13, po: 1 },
  { nuta: 'Fis', klawisz: 'R', kod: 'KeyR', czestotliwosc: 369.99, po: 3 },
  { nuta: 'Gis', klawisz: 'T', kod: 'KeyT', czestotliwosc: 415.30, po: 4 },
  { nuta: 'B',   klawisz: 'Y', kod: 'KeyY', czestotliwosc: 466.16, po: 5 },
];
const KOLOR_CZARNYCH = '#b9a6ff';   // kolor poświaty czarnych prostokątów
// Litery czarnych klawiszy do napisów, np. "W E R T Y" (zmieniają się same, gdy zmienisz klawisze wyżej)
const LITERY_CZARNYCH = CZARNE.map((kl) => kl.klawisz).join(' ');


// ---------- PIOSENKI ----------
// Prostokąty spadają w kolejności nut z piosenki, więc trafiając – grasz melodię!
// Każdy poziom ma inną piosenkę (po ostatniej wracamy do pierwszej).
// Możesz dopisać własną – wystarczy skopiować jedną piosenkę i zmienić nazwę i nuty.
// Liczby to numery białych klawiszy: 0=C 1=D 2=E 3=F 4=G 5=A 6=H
const PIOSENKI = [
  {
    nazwa: 'Wlazł kotek na płotek',
    nuty: [4, 2, 2, 3, 1, 1, 0, 2, 4, 4, 2, 2, 3, 1, 1, 0, 2, 0],
  },
  {
    nazwa: 'Panie Janie',
    nuty: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4, 4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0],
  },
  {
    nazwa: 'Oda do radości',
    nuty: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1,
           2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0],
  },
  {
    nazwa: 'Twinkle, Twinkle, Little Star',
    nuty: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0,
           4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1,
           0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
  },
  {
    nazwa: 'Mary Had a Little Lamb',
    nuty: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4,
           2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0],
  },
  {
    nazwa: 'London Bridge',
    nuty: [4, 5, 4, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4,
           4, 5, 4, 3, 2, 3, 4, 1, 4, 2, 0],
  },
  {
    nazwa: 'Jingle Bells',
    nuty: [2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2,
           3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 2, 1, 4,
           2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2,
           3, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 3, 1, 0],
  },
];


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

let stan = 'start';            // 'start' | 'gra' | 'pauza' | 'koniec'
let punkty = 0;
let zycia = USTAWIENIA.zycia;
let poziom = 1;
let rekord = wczytajRekord();
let nowyRekord = false;

let prostokaty = [];           // spadające prostokąty: { kolumna, poz, czarny }
let efekty = [];               // błyski, iskry i napisy
let licznikPojawiania = 0;     // odlicza czas do następnego prostokąta
let piosenkaNr = 0;
let nutaNr = 0;
let przerwa = 0;               // ile pustych miejsc zostało do następnej nuty (przerwa między piosenkami)
let nazwaPiosenki = '';

let czas = 0;                  // ile sekund minęło od włączenia strony
let koniecOd = 0;              // kiedy skończyła się gra
let napisPoziomu = 0;          // jak długo jeszcze pokazywać „Poziom X!”
let trzesienie = 0;            // trzęsienie ekranu po pudle
let wyciszone = false;

const wcisnieteBiale = new Array(BIALE.length).fill(-10);   // kiedy naciśnięto klawisz
const wcisnieteCzarne = new Array(CZARNE.length).fill(-10);

// Rozmiary planszy – liczone od nowa, gdy zmienia się okno
const L = {};


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

  L.gameW = Math.min(L.W, 760);                 // szerokość pianina
  L.offX = (L.W - L.gameW) / 2;                 // odstęp z lewej (żeby było na środku)
  L.hudH = 60;                                  // górny pasek z sercami i punktami
  L.kbH = ogranicz(L.H * 0.24, 110, 220);       // wysokość klawiatury
  L.kbTop = L.H - L.kbH;                        // gdzie zaczyna się klawiatura
  L.playTop = L.hudH;
  L.playH = Math.max(100, L.kbTop - L.playTop); // wysokość planszy, po której spadają prostokąty
  L.laneW = L.gameW / BIALE.length;             // szerokość jednej kolumny
  L.tileH = ogranicz(L.playH * 0.13, 40, 110);  // wysokość prostokąta
  L.czarnyW = L.laneW * 0.58;                   // szerokość czarnego klawisza
  L.czarnyH = (L.kbH - 6) * 0.56;               // wysokość czarnego klawisza
  L.fs = ogranicz(Math.min(L.gameW / 30, L.playH / 20), 11, 20); // wielkość napisów
}


// =====================================================
//   DŹWIĘK (pianino zrobione z fal dźwiękowych)
// =====================================================
let audio = null;
let wzmacniacz = null;

function przygotujDzwiek() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    audio = new AC();
    wzmacniacz = audio.createGain();
    wzmacniacz.gain.value = 0.45;
    const kompresor = audio.createDynamicsCompressor();
    wzmacniacz.connect(kompresor);
    kompresor.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume();
  return true;
}

function grajNute(czestotliwosc, opoznienie = 0, glosnosc = 1) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;

  // Obwiednia: dźwięk szybko się zaczyna i powoli cichnie – jak w pianinie
  const obwiednia = audio.createGain();
  obwiednia.gain.setValueAtTime(0.0001, t);
  obwiednia.gain.exponentialRampToValueAtTime(0.5 * glosnosc, t + 0.01);
  obwiednia.gain.exponentialRampToValueAtTime(0.18 * glosnosc, t + 0.3);
  obwiednia.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

  // Filtr: z czasem dźwięk robi się bardziej miękki
  const filtr = audio.createBiquadFilter();
  filtr.type = 'lowpass';
  filtr.frequency.setValueAtTime(czestotliwosc * 10, t);
  filtr.frequency.exponentialRampToValueAtTime(czestotliwosc * 2.5, t + 0.8);

  obwiednia.connect(filtr);
  filtr.connect(wzmacniacz);

  // Kilka fal naraz (podstawowa + wyższe tony) brzmi bogaciej niż jedna
  const tony = [[1, 1, 'triangle'], [2, 0.4, 'sine'], [3, 0.18, 'sine'], [4, 0.08, 'sine']];
  for (const [mnoznik, sila, typ] of tony) {
    const osc = audio.createOscillator();
    osc.type = typ;
    osc.frequency.value = czestotliwosc * mnoznik;
    const g = audio.createGain();
    g.gain.value = sila;
    osc.connect(g);
    g.connect(obwiednia);
    osc.start(t);
    osc.stop(t + 1.7);
  }
}

function dzwiekPudla() {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.35);
  const filtr = audio.createBiquadFilter();
  filtr.type = 'lowpass';
  filtr.frequency.value = 700;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(filtr);
  filtr.connect(g);
  g.connect(wzmacniacz);
  osc.start(t);
  osc.stop(t + 0.42);
}

function dzwiekPoziomu() {
  [261.63, 329.63, 392.0, 523.25].forEach((f, i) => grajNute(f, 0.15 + i * 0.08, 0.6));
}

function dzwiekKonca() {
  [392.0, 329.63, 261.63, 196.0].forEach((f, i) => grajNute(f, 0.2 + i * 0.3, 0.8));
}


// =====================================================
//   REKORD (zapamiętywany w przeglądarce)
// =====================================================
function wczytajRekord() {
  try {
    return parseInt(localStorage.getItem('spadajace-nuty-rekord'), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(wynik) {
  try {
    localStorage.setItem('spadajace-nuty-rekord', String(wynik));
  } catch (e) {
    // nic się nie stało – rekord po prostu nie zostanie zapamiętany
  }
}


// =====================================================
//   PRZEBIEG GRY
// =====================================================
function nowaGra() {
  przygotujDzwiek();
  punkty = 0;
  zycia = USTAWIENIA.zycia;
  poziom = 1;
  nowyRekord = false;
  prostokaty = [];
  efekty = [];
  licznikPojawiania = 0.6;
  piosenkaNr = 0;
  nutaNr = 0;
  przerwa = 0;
  nazwaPiosenki = '';
  napisPoziomu = 0;
  stan = 'gra';
}

// Prędkość na obecnym poziomie: 1,00 → 1,05 → 1,10 → ...
function predkosc() {
  return Math.min(
    USTAWIENIA.predkoscNajwieksza,
    USTAWIENIA.predkoscNaStart + (poziom - 1) * USTAWIENIA.wzrostPredkosciNaPoziom
  );
}

// Prędkość zapisana po polsku, z przecinkiem, np. "1,05"
function tekstPredkosci() {
  return predkosc().toFixed(2).replace('.', ',');
}

// Ile sekund prostokąt leci z góry na dół (im większa prędkość, tym krócej)
function czasSpadania() {
  return USTAWIENIA.czasSpadaniaNaStart / predkosc();
}

function odstepMiedzyProstokatami() {
  return Math.max(
    USTAWIENIA.odstepNajkrotszy,
    USTAWIENIA.odstepNaStart - (poziom - 1) * USTAWIENIA.skracanieOdstepuNaPoziom
  );
}

// Od jakiego miejsca prostokąt można już trafić
// (poz = 0 → dół prostokąta na górze planszy, poz = 1 → dół prostokąta dotyka klawiatury)
function progTrafienia() {
  // 0.02 = prostokąt musi już choć trochę wystawać spod górnego paska, żeby trafić
  return Math.max(0.02, 1 - L.tileH / L.playH - USTAWIENIA.zapasWczesnie);
}

// Najniższy prostokąt w tej kolumnie, który można już trafić (albo null, jeśli żadnego nie ma).
// czarny = true → szukamy w kolumnach czarnych klawiszy
function najnizszyDoTrafienia(k, czarny = false) {
  const prog = progTrafienia();
  let najlepszy = null;
  for (const p of prostokaty) {
    if (p.kolumna !== k || p.czarny !== czarny || p.poz < prog) continue;
    if (!najlepszy || p.poz > najlepszy.poz) najlepszy = p;
  }
  return najlepszy;
}

// Gdzie leży prostokąt i jak wygląda (czarne leżą między białymi i są węższe)
function wygladProstokata(p) {
  if (p.czarny) {
    const kl = CZARNE[p.kolumna];
    return {
      x: L.offX + (kl.po + 1) * L.laneW - L.czarnyW / 2,
      w: L.czarnyW,
      kolor: KOLOR_CZARNYCH,
      napis: kl.klawisz,
    };
  }
  const kl = BIALE[p.kolumna];
  const pad = Math.max(3, L.laneW * 0.07);
  return { x: L.offX + p.kolumna * L.laneW + pad, w: L.laneW - 2 * pad, kolor: kl.kolor, napis: kl.nuta };
}

// Nad którym czarnym klawiszem jest palec / myszka (albo -1)
function czarnyPodPalcem(x) {
  for (let c = 0; c < CZARNE.length; c++) {
    const srodek = L.offX + (CZARNE[c].po + 1) * L.laneW;
    if (Math.abs(x - srodek) < L.czarnyW / 2) return c;
  }
  return -1;
}

function pojawNastepnyProstokat() {
  // Przerwa między piosenkami – tym razem nic nie spada
  if (przerwa > 0) {
    przerwa--;
    return;
  }

  // Od wysokiego poziomu czasem zamiast nuty z piosenki spada prostokąt na czarny klawisz
  if (poziom >= USTAWIENIA.poziomCzarnych && Math.random() < USTAWIENIA.szansaCzarnych) {
    prostokaty.push({ kolumna: Math.floor(Math.random() * CZARNE.length), poz: 0, czarny: true });
    return;
  }

  const piosenka = PIOSENKI[piosenkaNr];
  if (nutaNr === 0) nazwaPiosenki = piosenka.nazwa;
  prostokaty.push({ kolumna: piosenka.nuty[nutaNr], poz: 0, czarny: false });
  nutaNr++;

  // Koniec piosenki: krótka przerwa i gramy ją jeszcze raz.
  // Inna piosenka przyjdzie razem z nowym poziomem.
  if (nutaNr >= piosenka.nuty.length) {
    nutaNr = 0;
    przerwa = 2;
  }
}

// Nowy poziom = nowa piosenka (zaczynamy ją od początku, po krótkiej przerwie)
function zmienPiosenke() {
  piosenkaNr = (poziom - 1) % PIOSENKI.length;
  nutaNr = 0;
  przerwa = 2;
  nazwaPiosenki = PIOSENKI[piosenkaNr].nazwa;
}

function aktualizujGre(dt) {
  // Czas na nowy prostokąt?
  licznikPojawiania -= dt;
  if (licznikPojawiania <= 0) {
    licznikPojawiania += odstepMiedzyProstokatami();
    pojawNastepnyProstokat();
  }

  // Prostokąty spadają
  const predkosc = 1 / czasSpadania();
  for (const p of prostokaty) p.poz += predkosc * dt;

  // Prostokąt przeleciał przez klawiaturę – pudło!
  for (let i = prostokaty.length - 1; i >= 0; i--) {
    if (prostokaty[i].poz > 1 + USTAWIENIA.zapasPozno) {
      const p = prostokaty.splice(i, 1)[0];
      pudlo(p);
      if (stan !== 'gra') return;
    }
  }
}

function nacisnijBialy(k) {
  grajNute(BIALE[k].czestotliwosc);
  wcisnieteBiale[k] = czas;
  if (stan !== 'gra') return;

  // Trafiamy najniższy prostokąt w tej kolumnie
  const p = najnizszyDoTrafienia(k);
  if (p) {
    prostokaty.splice(prostokaty.indexOf(p), 1);
    trafienie(p);
  }
}

function nacisnijCzarny(c) {
  grajNute(CZARNE[c].czestotliwosc);
  wcisnieteCzarne[c] = czas;
  if (stan !== 'gra') return;

  const p = najnizszyDoTrafienia(c, true);
  if (p) {
    prostokaty.splice(prostokaty.indexOf(p), 1);
    trafienie(p);
  }
}

function trafienie(p) {
  punkty++;

  // Efekty: błysk, iskry i „+1”
  const { x, w, kolor } = wygladProstokata(p);
  const y = L.playTop + p.poz * L.playH - L.tileH;
  efekty.push({ typ: 'blysk', x, y, w, h: L.tileH, kolor, t: 0, dlugosc: 0.35 });
  efekty.push({ typ: 'napis', tekst: '+1', x: x + w / 2, y: y - 6, kolor, t: 0, dlugosc: 0.8 });
  for (let i = 0; i < 10; i++) {
    efekty.push({
      typ: 'iskra', x: x + w / 2, y: L.kbTop,
      vx: (Math.random() - 0.5) * 320, vy: -160 - Math.random() * 260,
      kolor, t: 0, dlugosc: 0.6,
    });
  }

  // Nowy poziom?
  const nowyPoziom = 1 + Math.floor(punkty / USTAWIENIA.punktyNaPoziom);
  if (nowyPoziom > poziom) {
    poziom = nowyPoziom;
    // na poziomie z czarnymi klawiszami napis wisi dłużej, żeby zdążyć przeczytać
    napisPoziomu = poziom === USTAWIENIA.poziomCzarnych ? 3.5 : 1.8;
    zmienPiosenke();
    dzwiekPoziomu();
  }
}

function pudlo(p) {
  zycia--;
  trzesienie = 0.3;
  dzwiekPudla();
  const { x, w } = wygladProstokata(p);
  efekty.push({ typ: 'blad', x, w, t: 0, dlugosc: 0.6 });   // czerwony błysk w kolumnie
  efekty.push({
    typ: 'napis', tekst: 'Pudło!',
    x: x + w / 2, y: L.kbTop - L.tileH * 0.5,
    kolor: '#ff4d6d', t: 0, dlugosc: 0.9,
  });
  if (zycia <= 0) koniecGry();
}

function koniecGry() {
  stan = 'koniec';
  koniecOd = czas;
  if (punkty > rekord) {
    rekord = punkty;
    nowyRekord = true;
    zapiszRekord(rekord);
  }
  dzwiekKonca();
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.t += dt;
    if (e.typ === 'iskra') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 700 * dt; // grawitacja
    }
  }
  efekty = efekty.filter((e) => e.t < e.dlugosc);
  trzesienie = Math.max(0, trzesienie - dt);
  napisPoziomu = Math.max(0, napisPoziomu - dt);
}


// =====================================================
//   STEROWANIE
// =====================================================
// ---------- Powrót do menu z grami ----------
let przyciskMenu = null;   // gdzie na ekranie jest przycisk „Menu gier” (żeby dało się go kliknąć)

function idzDoMenu() {
  window.location.href = '../index.html';
}

function wPrzyciskuMenu(x, y) {
  const p = przyciskMenu;
  return p !== null && x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
}

function elementMenu(fs) {
  return { przycisk: true, tekst: '← Menu gier (Q)', rozmiar: fs * 0.9, gruba: true, kolor: '#e4ddff' };
}

function akcjaGlowna() {
  if (stan === 'start') nowaGra();
  else if (stan === 'pauza') stan = 'gra';
  else if (stan === 'koniec' && czas - koniecOd > 1) nowaGra(); // sekunda przerwy, żeby nie zacząć przez przypadek
}

function przelaczPauze() {
  if (stan === 'gra') stan = 'pauza';
  else if (stan === 'pauza') stan = 'gra';
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!e.repeat) akcjaGlowna();
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') {
    przelaczPauze();
    return;
  }
  if (e.code === 'KeyM') {
    wyciszone = !wyciszone;
    return;
  }
  if (e.code === 'KeyQ' && stan !== 'gra') {
    idzDoMenu();
    return;
  }
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

  const b = BIALE.findIndex((kl) => kl.kod === e.code);
  if (b >= 0) {
    e.preventDefault();
    nacisnijBialy(b);
    return;
  }
  const c = CZARNE.findIndex((kl) => kl.kod === e.code);
  if (c >= 0) {
    e.preventDefault();
    nacisnijCzarny(c);
  }
});

// Myszka i dotyk: klikasz w kolumnę albo w klawisz
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (stan !== 'gra') {
    if (wPrzyciskuMenu(e.clientX, e.clientY)) idzDoMenu();
    else akcjaGlowna();
    return;
  }
  if (e.clientY < L.hudH) {   // stuknięcie w górny pasek = pauza
    przelaczPauze();
    return;
  }
  // Czarny klawisz: kiedy stukasz w sam czarny klawisz
  // albo nad nim, gdy czeka tam czarny prostokąt do trafienia
  const c = czarnyPodPalcem(e.clientX);
  if (c >= 0) {
    const naCzarnymKlawiszu = e.clientY >= L.kbTop && e.clientY < L.kbTop + 6 + L.czarnyH;
    if (naCzarnymKlawiszu || najnizszyDoTrafienia(c, true)) {
      nacisnijCzarny(c);
      return;
    }
  }
  const k = Math.floor((e.clientX - L.offX) / L.laneW);
  if (k >= 0 && k < BIALE.length) nacisnijBialy(k);
});

plotno.addEventListener('contextmenu', (e) => e.preventDefault());

// Gdy przełączysz kartę albo okno – gra sama się pauzuje
document.addEventListener('visibilitychange', () => {
  if (document.hidden && stan === 'gra') stan = 'pauza';
});
window.addEventListener('blur', () => {
  if (stan === 'gra') stan = 'pauza';
});

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   RYSOWANIE – narzędzia
// =====================================================
function kolorAlfa(hex, alfa) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

// Prostokąt z zaokrąglonymi rogami.
// r to liczba albo [lewy górny, prawy górny, prawy dolny, lewy dolny]
function sciezkaZaokraglona(x, y, w, h, r) {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + a, y);
  ctx.lineTo(x + w - b, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + b);
  ctx.lineTo(x + w, y + h - c);
  ctx.quadraticCurveTo(x + w, y + h, x + w - c, y + h);
  ctx.lineTo(x + d, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - d);
  ctx.lineTo(x, y + a);
  ctx.quadraticCurveTo(x, y, x + a, y);
  ctx.closePath();
}

function czcionka(rozmiar, gruba) {
  return `${gruba ? '700 ' : ''}${Math.round(rozmiar)}px "Segoe UI", system-ui, -apple-system, sans-serif`;
}

// Serce: (x, y) to środek górnej krawędzi
function serce(x, y, szer, wys, kolor) {
  const gora = wys * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y + gora);
  ctx.bezierCurveTo(x, y, x - szer / 2, y, x - szer / 2, y + gora);
  ctx.bezierCurveTo(x - szer / 2, y + (wys + gora) / 2, x, y + (wys + gora) / 2, x, y + wys);
  ctx.bezierCurveTo(x, y + (wys + gora) / 2, x + szer / 2, y + (wys + gora) / 2, x + szer / 2, y + gora);
  ctx.bezierCurveTo(x + szer / 2, y, x, y, x, y + gora);
  ctx.closePath();
  ctx.fillStyle = kolor;
  ctx.fill();
}

function zawijajTekst(tekst, maxSzer) {
  const slowa = tekst.split(' ');
  const linie = [];
  let linia = '';
  for (const s of slowa) {
    const proba = linia ? linia + ' ' + s : s;
    if (linia && ctx.measureText(proba).width > maxSzer) {
      linie.push(linia);
      linia = s;
    } else {
      linia = proba;
    }
  }
  if (linia) linie.push(linia);
  return linie;
}

function migotanie() {
  return 0.45 + 0.55 * Math.abs(Math.sin(czas * 3));
}

function slowoZycia(n) {
  if (n === 1) return 'życie';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'życia';
  return 'żyć';
}


// =====================================================
//   RYSOWANIE – części gry
// =====================================================
function rysujTlo() {
  const g = ctx.createLinearGradient(0, 0, 0, L.H);
  g.addColorStop(0, '#0b1026');
  g.addColorStop(1, '#1d1245');
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, L.W + 40, L.H + 40);
}

function rysujKolumny() {
  const { offX, playTop, playH, laneW, kbTop } = L;
  for (let k = 0; k < BIALE.length; k++) {
    const x = offX + k * laneW;
    ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)';
    ctx.fillRect(x, playTop, laneW, playH);

    // Kolorowe światło nad naciśniętym klawiszem
    const sila = 1 - (czas - wcisnieteBiale[k]) / 0.3;
    if (sila > 0) {
      const wys = playH * 0.6;
      const g = ctx.createLinearGradient(0, kbTop, 0, kbTop - wys);
      g.addColorStop(0, kolorAlfa(BIALE[k].kolor, 0.35 * sila));
      g.addColorStop(1, kolorAlfa(BIALE[k].kolor, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, kbTop - wys, laneW, wys);
    }

  }

  // Światło nad naciśniętym czarnym klawiszem
  for (let c = 0; c < CZARNE.length; c++) {
    const sila = 1 - (czas - wcisnieteCzarne[c]) / 0.3;
    if (sila <= 0) continue;
    const wys = playH * 0.6;
    const x = offX + (CZARNE[c].po + 1) * laneW - L.czarnyW / 2;
    const g = ctx.createLinearGradient(0, kbTop, 0, kbTop - wys);
    g.addColorStop(0, kolorAlfa(KOLOR_CZARNYCH, 0.35 * sila));
    g.addColorStop(1, kolorAlfa(KOLOR_CZARNYCH, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, kbTop - wys, L.czarnyW, wys);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let k = 1; k < BIALE.length; k++) ctx.fillRect(offX + k * laneW - 0.5, playTop, 1, playH);
}

// Jaśniejszy pas nad klawiaturą: kiedy dół prostokąta jest w tym pasie, można go trafić
function rysujStrefeTrafien() {
  const { offX, gameW, kbTop, playTop, playH } = L;
  const gora = playTop + progTrafienia() * playH;
  const g = ctx.createLinearGradient(0, gora, 0, kbTop);
  g.addColorStop(0, 'rgba(180,160,255,0)');
  g.addColorStop(1, 'rgba(180,160,255,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(offX, gora, gameW, kbTop - gora);

  ctx.save();
  ctx.shadowColor = '#b9a6ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(215,205,255,0.85)';
  ctx.fillRect(offX, kbTop - 2, gameW, 2);
  ctx.restore();
}

function rysujProstokaty() {
  const { offX, playTop, playH, tileH, gameW, H } = L;

  // W każdej kolumnie zaznaczymy ten prostokąt, który zostanie trafiony po naciśnięciu klawisza
  const doTrafienia = new Set();
  for (let k = 0; k < BIALE.length; k++) {
    const p = najnizszyDoTrafienia(k);
    if (p) doTrafienia.add(p);
  }
  for (let c = 0; c < CZARNE.length; c++) {
    const p = najnizszyDoTrafienia(c, true);
    if (p) doTrafienia.add(p);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(offX, playTop, gameW, H - playTop); // nie rysuj na górnym pasku
  ctx.clip();

  // Najpierw białe, potem czarne – żeby czarne były na wierzchu
  const kolejnosc = [...prostokaty.filter((p) => !p.czarny), ...prostokaty.filter((p) => p.czarny)];
  for (const p of kolejnosc) {
    const { x, w, kolor, napis } = wygladProstokata(p);
    const y = playTop + p.poz * playH - tileH;
    const r = Math.min(10, w * 0.2);

    const g = ctx.createLinearGradient(0, y, 0, y + tileH);
    if (p.czarny) {
      g.addColorStop(0, '#2c2744');
      g.addColorStop(1, '#0f0d18');
    } else {
      g.addColorStop(0, kolorAlfa(kolor, 0.45));
      g.addColorStop(1, kolor);
    }
    ctx.save();
    ctx.shadowColor = kolor;
    ctx.shadowBlur = 14;
    sciezkaZaokraglona(x, y, w, tileH, r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // Czarne prostokąty mają jasną obwódkę, żeby było je widać na ciemnym tle
    if (p.czarny) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = kolorAlfa(kolor, 0.85);
      sciezkaZaokraglona(x, y, w, tileH, r);
      ctx.stroke();
    }

    // Biała ramka = „ten prostokąt trafisz, jak teraz naciśniesz”
    if (stan === 'gra' && doTrafienia.has(p)) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      sciezkaZaokraglona(x, y, w, tileH, r);
      ctx.stroke();
    }

    const fsNuty = ogranicz(w * 0.35, 12, 26);
    ctx.font = czcionka(fsNuty, true);
    ctx.fillStyle = p.czarny ? 'rgba(255,255,255,0.85)' : 'rgba(20,10,40,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(napis, x + w / 2, y + tileH - fsNuty);
  }
  ctx.restore();
}

function rysujKlawiature() {
  const { offX, gameW, kbTop, kbH, laneW, W } = L;

  // Obudowa pianina i czerwony filc
  ctx.fillStyle = '#140d26';
  ctx.fillRect(0, kbTop, W, kbH);
  const filc = 6;
  ctx.fillStyle = '#8a1538';
  ctx.fillRect(offX, kbTop, gameW, filc);

  const yK = kbTop + filc;
  const hK = kbH - filc;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Białe klawisze
  for (let k = 0; k < BIALE.length; k++) {
    const kl = BIALE[k];
    const wcis = czas - wcisnieteBiale[k] < 0.15;
    const x = offX + k * laneW + 1.5;
    const w = laneW - 3;
    const cx = x + w / 2;

    const g = ctx.createLinearGradient(0, yK, 0, yK + hK);
    if (wcis) {
      g.addColorStop(0, kolorAlfa(kl.kolor, 0.6));
      g.addColorStop(1, kl.kolor);
    } else {
      g.addColorStop(0, '#f1ede4');
      g.addColorStop(0.85, '#ffffff');
      g.addColorStop(1, '#d6cfbf');
    }
    sciezkaZaokraglona(x, yK, w, hK - (wcis ? 2 : 5), [0, 0, 8, 8]);
    ctx.fillStyle = g;
    ctx.fill();

    // Kolorowa kropka z nazwą nuty
    const r = ogranicz(laneW * 0.15, 8, 15);
    const yKropki = yK + hK * 0.66;
    ctx.beginPath();
    ctx.arc(cx, yKropki, r, 0, Math.PI * 2);
    ctx.fillStyle = wcis ? '#ffffff' : kl.kolor;
    ctx.fill();
    ctx.font = czcionka(r * 1.1, true);
    ctx.fillStyle = wcis ? kl.kolor : '#1b1530';
    ctx.fillText(kl.nuta, cx, yKropki + 1);

    // Litera z klawiatury komputera
    ctx.font = czcionka(ogranicz(laneW * 0.3, 14, 30), true);
    ctx.fillStyle = wcis ? '#ffffff' : '#2b2840';
    ctx.fillText(kl.klawisz, cx, yK + hK * 0.85);
  }

  // Czarne klawisze
  const bw = L.czarnyW;
  const bh = L.czarnyH;
  const fsCzarne = ogranicz(laneW * 0.17, 10, 16);
  for (let c = 0; c < CZARNE.length; c++) {
    const kl = CZARNE[c];
    const wcis = czas - wcisnieteCzarne[c] < 0.15;
    const x = offX + (kl.po + 1) * laneW - bw / 2;

    const g = ctx.createLinearGradient(0, yK, 0, yK + bh);
    g.addColorStop(0, wcis ? '#6b6585' : '#2e2b3d');
    g.addColorStop(1, wcis ? '#3d3852' : '#0c0b12');
    sciezkaZaokraglona(x, yK, bw, bh, [0, 0, 5, 5]);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.08)';   // połysk
    ctx.fillRect(x + bw * 0.15, yK, bw * 0.12, bh * 0.85);

    ctx.font = czcionka(fsCzarne, true);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(kl.klawisz, x + bw / 2, yK + bh - fsCzarne);
  }
}

function rysujEfekty() {
  for (const e of efekty) {
    const f = e.t / e.dlugosc; // od 0 do 1
    ctx.globalAlpha = Math.max(0, 1 - f);
    if (e.typ === 'blysk') {
      const roz = 1 + f * 0.35;
      const w = e.w * roz;
      const h = e.h * roz;
      sciezkaZaokraglona(e.x + e.w / 2 - w / 2, e.y + e.h / 2 - h / 2, w, h, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = e.kolor;
      ctx.stroke();
    } else if (e.typ === 'blad') {
      ctx.fillStyle = 'rgba(255, 40, 70, 0.35)';
      ctx.fillRect(e.x, L.playTop, e.w, L.playH);
    } else if (e.typ === 'iskra') {
      ctx.fillStyle = e.kolor;
      ctx.fillRect(e.x - 3, e.y - 3, 6, 6);
    } else if (e.typ === 'napis') {
      ctx.font = czcionka(L.fs * 1.3, true);
      ctx.fillStyle = e.kolor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.tekst, e.x, e.y - f * 40);
    }
  }
  ctx.globalAlpha = 1;
}

function rysujNapisPoziomu() {
  if (napisPoziomu <= 0) return;
  const y = L.playTop + L.playH * 0.35;
  ctx.globalAlpha = Math.min(1, napisPoziomu / 0.4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(L.fs * 2.2, true);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(`Poziom ${poziom}!`, L.W / 2, y);
  ctx.font = czcionka(L.fs * 1.2, true);
  ctx.fillStyle = '#ffffff';
  const podpis = poziom === USTAWIENIA.poziomCzarnych
    ? `Teraz także czarne klawisze: ${LITERY_CZARNYCH}!`
    : `Szybciej! Prędkość: ${tekstPredkosci()}`;
  ctx.fillText(podpis, L.W / 2, y + L.fs * 2.2);
  if (nazwaPiosenki) {
    ctx.font = czcionka(L.fs, false);
    ctx.fillStyle = '#cfc8ff';
    ctx.fillText(`Nowa melodia: ♪ ${nazwaPiosenki}`, L.W / 2, y + L.fs * 4);
  }
  ctx.globalAlpha = 1;
}

function rysujPasek() {
  const { W, hudH, offX, gameW, fs } = L;
  const g = ctx.createLinearGradient(0, 0, 0, hudH);
  g.addColorStop(0, '#16143a');
  g.addColorStop(1, '#0e0d28');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, hudH);
  ctx.fillStyle = 'rgba(180,160,255,0.25)';
  ctx.fillRect(0, hudH - 1, W, 1);

  // Serca (życia)
  const s = 24;
  for (let i = 0; i < USTAWIENIA.zycia; i++) {
    const cx = offX + 16 + s / 2 + i * (s + 8);
    serce(cx, hudH / 2 - s / 2 + 1, s, s, i < zycia ? '#ff4d6d' : 'rgba(255,255,255,0.15)');
  }
  const lewaSzer = 16 + USTAWIENIA.zycia * (s + 8);

  // Punkty i ikona pauzy po prawej
  const prawy = offX + gameW - 16;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(prawy - 12, hudH / 2 - 8, 4, 16);
  ctx.fillRect(prawy - 4, hudH / 2 - 8, 4, 16);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(fs * 1.25, true);
  ctx.fillStyle = '#ffd23f';
  const tekstPunktow = `${punkty} pkt`;
  ctx.fillText(tekstPunktow, prawy - 24, hudH / 2);
  const prawaSzer = 24 + 16 + ctx.measureText(tekstPunktow).width;

  // Na środku: piosenka i poziom
  const miejsce = gameW - 2 * Math.max(lewaSzer, prawaSzer) - 12;
  ctx.textAlign = 'center';
  if (miejsce > 40) {
    const glowny = stan === 'start' ? 'Spadające nuty' : (nazwaPiosenki ? '♪ ' + nazwaPiosenki : '');
    if (glowny) {
      let rozmiar = fs * 0.95;
      ctx.font = czcionka(rozmiar, true);
      const szer = ctx.measureText(glowny).width;
      if (szer > miejsce) rozmiar = Math.max(9, (rozmiar * miejsce) / szer);
      ctx.font = czcionka(rozmiar, true);
      ctx.fillStyle = '#e4ddff';
      ctx.fillText(glowny, W / 2, hudH * 0.36);
    }
    const drugi = `Poziom ${poziom} · prędkość ${tekstPredkosci()}${wyciszone ? ' · dźwięk wył. (M)' : ''}`;
    const rozmiar2 = fs * 0.75;
    ctx.font = czcionka(rozmiar2, false);
    const szer2 = ctx.measureText(drugi).width;
    if (szer2 > miejsce) ctx.font = czcionka(Math.max(8, (rozmiar2 * miejsce) / szer2), false);
    ctx.fillStyle = '#9b93cf';
    ctx.fillText(drugi, W / 2, hudH * 0.7);
  }
}

// Okienko na środku (start, pauza, koniec gry)
function rysujOkienko(elementy) {
  ctx.fillStyle = 'rgba(5, 6, 18, 0.72)';
  ctx.fillRect(0, 0, L.W, L.kbTop);   // klawiatura zostaje odsłonięta – można na niej grać!

  const szer = Math.min(L.gameW - 32, 520);
  const wewn = szer - 48;
  const wiersze = [];
  let wys = 0;
  for (const el of elementy) {
    if (el.odstep) {
      wiersze.push(el);
      wys += el.odstep;
      continue;
    }
    ctx.font = czcionka(el.rozmiar, el.gruba);
    for (const linia of zawijajTekst(el.tekst, wewn)) {
      const h = el.przycisk ? el.rozmiar * 2.6 : el.rozmiar * 1.35;
      wiersze.push({ ...el, tekst: linia, h });
      wys += h;
    }
  }

  const panelH = wys + 48;
  const x = (L.W - szer) / 2;
  const y = Math.max(L.hudH + 8, L.playTop + (L.playH - panelH) / 2);

  ctx.save();
  ctx.shadowColor = 'rgba(140, 100, 255, 0.45)';
  ctx.shadowBlur = 30;
  sciezkaZaokraglona(x, y, szer, panelH, 18);
  ctx.fillStyle = 'rgba(24, 21, 56, 0.97)';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(180, 160, 255, 0.35)';
  sciezkaZaokraglona(x, y, szer, panelH, 18);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let yy = y + 24;
  for (const w of wiersze) {
    if (w.odstep) {
      yy += w.odstep;
      continue;
    }
    ctx.font = czcionka(w.rozmiar, w.gruba);
    ctx.globalAlpha = w.alfa ?? 1;
    if (w.przycisk) {
      // Przycisk w kształcie pigułki – zapamiętujemy, gdzie jest, żeby dało się go kliknąć
      const bw = ctx.measureText(w.tekst).width + w.rozmiar * 2;
      const bh = w.rozmiar * 2;
      const bx = L.W / 2 - bw / 2;
      const by = yy + (w.h - bh) / 2;
      sciezkaZaokraglona(bx, by, bw, bh, bh / 2);
      ctx.fillStyle = 'rgba(180,160,255,0.15)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(180,160,255,0.55)';
      ctx.stroke();
      przyciskMenu = { x: bx, y: by, w: bw, h: bh };
    }
    ctx.fillStyle = w.kolor || '#e8e6ff';
    ctx.fillText(w.tekst, L.W / 2, yy + w.h / 2);
    yy += w.h;
  }
  ctx.globalAlpha = 1;
}

function rysujEkranStartowy() {
  const fs = L.fs;
  const n = USTAWIENIA.zycia;
  rysujOkienko([
    { tekst: 'Spadające nuty', rozmiar: fs * 2.1, gruba: true, kolor: '#ffd23f' },
    { odstep: fs * 0.6 },
    { tekst: 'Z góry spadają kolorowe prostokąty.', rozmiar: fs },
    { tekst: 'Naciśnij właściwy klawisz pianina, zanim prostokąt do niego doleci!', rozmiar: fs },
    { odstep: fs * 0.6 },
    { tekst: 'Klawisze: A S D F G H J', rozmiar: fs * 1.1, gruba: true, kolor: '#4cc9f0' },
    { tekst: 'albo klikaj myszką / stukaj palcem w kolumny', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { tekst: `Od poziomu ${USTAWIENIA.poziomCzarnych} także czarne klawisze: ${LITERY_CZARNYCH}`, rozmiar: fs * 0.85, kolor: KOLOR_CZARNYCH },
    { odstep: fs * 0.6 },
    { tekst: `Masz ${n} ${slowoZycia(n)}. Każdy przepuszczony prostokąt zabiera jedno.`, rozmiar: fs, kolor: '#ff8fa3' },
    ...(rekord > 0 ? [{ tekst: `Twój rekord: ${rekord} pkt`, rozmiar: fs, gruba: true, kolor: '#3ddc97' }] : []),
    { odstep: fs * 0.9 },
    { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby zacząć', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() },
    { odstep: fs * 0.4 },
    elementMenu(fs),
  ]);
}

function rysujPauze() {
  const fs = L.fs;
  rysujOkienko([
    { tekst: 'Pauza', rozmiar: fs * 2.1, gruba: true, kolor: '#4cc9f0' },
    { odstep: fs * 0.6 },
    { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby grać dalej', rozmiar: fs, gruba: true, kolor: '#ffffff', alfa: migotanie() },
    { odstep: fs * 0.4 },
    { tekst: 'M – wycisz / włącz dźwięk', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.4 },
    elementMenu(fs),
  ]);
}

function rysujKoniec() {
  const fs = L.fs;
  const mozna = czas - koniecOd > 1;
  rysujOkienko([
    { tekst: 'Koniec gry!', rozmiar: fs * 2.1, gruba: true, kolor: '#ff5a5f' },
    { odstep: fs * 0.5 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.7, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.2, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekord} pkt`, rozmiar: fs, kolor: '#a9a3d9' },
    { tekst: `Poziom: ${poziom}`, rozmiar: fs, kolor: '#a9a3d9' },
    { odstep: fs * 0.9 },
    mozna
      ? { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby zagrać znowu', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() }
      : { odstep: fs * 1.4 },
    { odstep: fs * 0.4 },
    elementMenu(fs),
  ]);
}

function rysuj() {
  przyciskMenu = null;   // przycisk menu istnieje tylko wtedy, gdy narysuje go okienko
  ctx.save();
  if (trzesienie > 0) {
    const m = (trzesienie / 0.3) * 6;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  rysujTlo();
  rysujKolumny();
  rysujStrefeTrafien();
  rysujProstokaty();
  rysujKlawiature();
  rysujEfekty();
  rysujNapisPoziomu();
  ctx.restore();

  rysujPasek();
  if (stan === 'start') rysujEkranStartowy();
  else if (stan === 'pauza') rysujPauze();
  else if (stan === 'koniec') rysujKoniec();
}


// =====================================================
//   GŁÓWNA PĘTLA – działa około 60 razy na sekundę
// =====================================================
let poprzedniaKlatka = performance.now();

function petla(teraz) {
  const dt = Math.min((teraz - poprzedniaKlatka) / 1000, 0.05);
  poprzedniaKlatka = teraz;
  czas += dt;

  if (stan === 'gra') aktualizujGre(dt);
  if (stan !== 'pauza') aktualizujEfekty(dt);
  rysuj();

  requestAnimationFrame(petla);
}

dopasujRozmiar();
requestAnimationFrame(petla);
