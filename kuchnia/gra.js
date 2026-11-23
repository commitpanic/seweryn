'use strict';

// =====================================================
//   KUCHNIA HELENKI – gotuj i częstuj przyjaciół!
//   Pomysł: Helenka i Seweryn
// =====================================================
//
//  Jak się gra:
//   - Wybierz przepis z książki kucharskiej.
//   - Rób wszystko po kolei: kroisz, wrzucasz, sypiesz, mieszasz, gotujesz...
//   - Gra mówi, co trzeba zrobić. Jak nie wiesz, po chwili pokaże to rączka.
//   - Na końcu częstujesz przyjaciół: pandę, jeżyka, małpkę, kotka i pieska.
//   - Nie ma pośpiechu i nie da się przegrać!
//
//  Przepisy i składniki są w pliku przepisy.js
//  Rysowanie (garnki, zwierzaki...) jest w pliku rysowanie.js


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  czasGotowania: 6,        // ile sekund gotuje się zupa
  czasPieczenia: 5,        // ile sekund piecze się pizza
  czasSmazenia: 3.5,       // ile sekund smaży się naleśnik, zanim trzeba go przewrócić
  podpowiedzPo: 3,         // po ilu sekundach bez ruchu pokazuje się rączka z podpowiedzią
  mowa: true,              // czy gra mówi, co robić (false = nie mówi)
  glosnosc: 0.5,           // jak głośne są dźwięki (od 0 do 1)
};

const KLUCZ_UGOTOWANYCH = 'kuchnia-helenki-ugotowane';
const KLUCZ_REKORDU = 'kuchnia-helenki-rekord';

// Kolor karty każdego przepisu w książce
const KOLORY_PRZEPISOW = {
  zupa: '#ff7b54',
  nalesniki: '#f4a300',
  salatka: '#2fbf71',
  pizza: '#e63946',
  sok: '#ff9f1c',
  wlasna: '#c77dff',
  zupy: '#ff7b54',
  rosol: '#f2a900',
  ogorkowa: '#7cb342',
  barszcz: '#b0243f',
  zurek: '#c9a46a',
  spaghetti: '#e85d3a',
  lody: '#ff7eb6',
};

// Karta „Zupy” – po stuknięciu wybierasz jedną z zup
const KARTA_ZUP = { id: 'zupy', nazwa: 'Zupy', porcja: 'miseczka', kolor: '#e0452b', wPorcji: ['marchewka', 'pomidor', 'pietruszka'] };

// Co jest w książce kucharskiej (po kolei)
function kartyKsiazki() {
  const pojedyncze = PRZEPISY.filter((p) => !p.grupa);
  return [KARTA_ZUP, ...pojedyncze, MOJA_KARTA];
}

// Karta „Moja potrawa” w książce kucharskiej
const MOJA_KARTA = { id: 'wlasna', nazwa: 'Moja potrawa', porcja: 'wlasna' };

// Krótkie nazwy na kartach wyboru własnej potrawy
const NAZWY_WLASNYCH = { zupa: 'Zupa', pizza: 'Pizza', nalesniki: 'Naleśniki', salatka: 'Sałatka', sok: 'Sok', spaghetti: 'Spaghetti', lody: 'Lody' };

const NAJWIECEJ_SKLADNIKOW = 12;   // tyle składników można wrzucić do własnej potrawy


// =====================================================
//   STAN GRY
// =====================================================
let ekran = 'ksiazka';      // 'ksiazka' | 'wybor' | 'wstep' | 'gotowanie' | 'stol' | 'brawo'
let rodzajWyboru = 'wlasna';  // ekran wyboru: 'zupy' albo 'wlasna'
let podgladacz = null;      // przyjaciel, który zagląda przez okno do kuchni
let przepis = null;         // co teraz gotujemy
let nrKroku = 0;            // który krok przepisu
let K = null;               // trwający krok (jego stan)
let N = null;               // naczynie, w którym gotujemy
let napisKroku = '';        // co teraz trzeba zrobić (napis na górze)
let efekty = [];            // iskierki, krople, serduszka...
let babelki = [];           // bąbelki z garnka – można je łapać
let lecace = [];            // rzeczy, które lecą (dodatki na pizzę, porcje dla przyjaciół)
let zwierzaki = [];         // przyjaciele przy stole
let zwierzakiKsiazki = [];  // przyjaciele, którzy zaglądają do książki
let chwyt = null;           // co trzymasz palcem
let przyciski = [];         // przyciski na ekranie (budowane przy każdym rysowaniu)
let wcisnietyPrzycisk = null;
let czas = 0;
let bezczynnosc = 0;        // ile sekund nic nie robisz (wtedy pokazuje się podpowiedź)
let zaslona = 0;            // białe przejście między ekranami
let brawoOd = 0;            // kiedy wszyscy się najedli
let brawoT = 0;
let wyciszone = false;
let ugotowane = wczytajUgotowane();

const wsk = { x: 0, y: 0, wcisniety: false, id: null };   // palec / myszka


// =====================================================
//   ROZMIARY EKRANU
//   Gra jest rysowana w „wirtualnym” rozmiarze (np. 1200 × 800)
//   i potem powiększana albo pomniejszana do ekranu.
// =====================================================
const V = { W: 0, H: 0, dpr: 1, w: 1200, h: 800, s: 1, ox: 0, oy: 0, pion: false };
const M = {};   // gdzie co stoi

function ogranicz(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dopasujRozmiar() {
  V.dpr = window.devicePixelRatio || 1;
  V.W = Math.max(1, window.innerWidth);    // okno może mieć chwilowo rozmiar 0
  V.H = Math.max(1, window.innerHeight);
  plotno.width = Math.round(V.W * V.dpr);
  plotno.height = Math.round(V.H * V.dpr);
  plotno.style.width = V.W + 'px';
  plotno.style.height = V.H + 'px';
  V.pion = V.H > V.W;
  if (V.pion) {
    V.w = 800;
    V.h = ogranicz(800 * V.H / V.W, 1000, 1800);
  } else {
    V.h = 800;
    V.w = ogranicz(800 * V.W / V.H, 1000, 1800);
  }
  V.s = Math.min(V.W / V.w, V.H / V.h);
  V.ox = (V.W - V.w * V.s) / 2;
  V.oy = (V.H - V.h * V.s) / 2;
  ulozMiejsca();
}

function ulozMiejsca() {
  const w = V.w;
  const h = V.h;
  const wlasny = przepis && przepis.wlasny;
  M.blatKsiazki = h - 70;
  if (!V.pion) {
    M.blat = 500;
    M.napisY = 150;
    const nx = w * 0.66;
    M.n = {
      garnek: { x: nx, y: 315 },
      miska: { x: nx, y: 372 },
      patelnia: { x: nx, y: 430 },
      pizza: { x: w * (wlasny ? 0.68 : 0.62), y: 640 },
      dzbanek: { x: nx, y: 270 },
      talerz: { x: w * 0.62, y: 640 },
      rozek: { x: nx, y: 465 },
    };
    const dx = w * 0.26;
    M.deska = { x: dx, y: 650 };
    M.polka = [{ x: dx - 150, y: 650 }, { x: dx, y: 650 }, { x: dx + 150, y: 650 }];
    M.przedmiot = { x: dx, y: 630 };
    M.dodatki = { x: dx, y: 660 };
    M.okno = { x: dx - 120, y: 205, w: 240, h: 190 };
    // spiżarnia (własna potrawa): zakładki, a pod nimi 3 rzędy po 4 rzeczy
    M.zakladki = ZAKLADKI_SPIZARNI.map((z, i) => ({ x: dx + (i - 1.5) * 100, y: 535 }));
    M.spizarnia = Array.from({ length: 12 }, (_, i) => ({ x: dx + (i % 4 - 1.5) * 95, y: 610 + Math.floor(i / 4) * 72 }));
    M.gotowe = { x: w - 125, y: 755 };
    // pudełka z lodami i dodatki do lodów: 2 rzędy po 3
    M.pudelka = [0, 1, 2, 3, 4, 5].map((i) => ({ x: dx + (i % 3 - 1) * 145, y: 585 + Math.floor(i / 3) * 125 }));
    M.polkaDeko = { x: w - 250, y: 240, w: 220 };
    // przy stole
    M.stolY = 520;
    M.zwY = 545;
    M.zwS = 0.95;
    const odst = Math.min(230, w / 5.3);
    M.zwX = [0, 1, 2, 3, 4].map((i) => w / 2 + (i - 2) * odst);
    M.porcjaY = 625;
    M.porcjaS = 0.9;
    M.danie = { x: w / 2, y: 735, s: 0.42 };
  } else {
    M.blat = Math.round(h * 0.6);
    M.napisY = 205;
    const nx = 400;
    M.n = {
      garnek: { x: nx, y: M.blat - 185 },
      miska: { x: nx, y: M.blat - 128 },
      patelnia: { x: nx, y: M.blat - 72 },
      pizza: { x: nx, y: wlasny ? M.blat + 40 : M.blat + (h - M.blat) * 0.42 },
      dzbanek: { x: nx, y: M.blat - 240 },
      talerz: { x: nx, y: M.blat + (h - M.blat) * 0.42 },
      rozek: { x: nx, y: M.blat - 30 },
    };
    const dy = M.blat + (h - M.blat) * 0.55;
    M.deska = { x: 400, y: dy };
    M.polka = [{ x: 160, y: dy }, { x: 400, y: dy }, { x: 640, y: dy }];
    M.przedmiot = { x: 400, y: dy - 20 };
    M.dodatki = { x: 400, y: h - 80 };
    M.okno = { x: 60, y: M.blat - 470, w: 190, h: 160 };
    M.zakladki = ZAKLADKI_SPIZARNI.map((z, i) => ({ x: 130 + i * 120, y: h - 380 }));
    M.spizarnia = Array.from({ length: 12 }, (_, i) => ({ x: 400 + (i % 4 - 1.5) * 150, y: h - 280 + Math.floor(i / 4) * 95 }));
    M.gotowe = { x: 655, y: h - 385 };
    M.pudelka = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 400 + (i % 3 - 1) * 220, y: h - 290 + Math.floor(i / 3) * 140 }));
    M.polkaDeko = { x: 560, y: M.blat - 400, w: 210 };
    M.stolY = Math.round(h * 0.55);
    M.zwY = M.stolY + 20;
    M.zwS = 0.8;
    M.zwX = [80, 240, 400, 560, 720];
    M.porcjaY = M.stolY + 100;
    M.porcjaS = 0.8;
    M.danie = { x: 400, y: h - 170, s: 0.55 };
  }
}

// Palec na ekranie → miejsce w świecie gry
function naWirtualne(e) {
  return { x: (e.clientX - V.ox) / V.s, y: (e.clientY - V.oy) / V.s };
}

function ekranowe() {
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
}

function wirtualne() {
  ctx.setTransform(V.dpr * V.s, 0, 0, V.dpr * V.s, V.dpr * V.ox, V.dpr * V.oy);
}


// =====================================================
//   DŹWIĘK
// =====================================================
let audio = null;
let wzmacniacz = null;

function przygotujDzwiek() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    audio = new AC();
    wzmacniacz = audio.createGain();
    wzmacniacz.gain.value = USTAWIENIA.glosnosc;
    const kompresor = audio.createDynamicsCompressor();
    wzmacniacz.connect(kompresor);
    kompresor.connect(audio.destination);
  }
  if (audio.state !== 'running') {
    audio.resume();
    // iPhone włącza dźwięk dopiero wtedy, gdy coś zagra zaraz po dotknięciu – gramy chwilkę ciszy
    const cisza = audio.createBufferSource();
    cisza.buffer = audio.createBuffer(1, 1, audio.sampleRate);
    cisza.connect(audio.destination);
    cisza.start(0);
  }
  return true;
}

// iPhone: dźwięk gra nawet wtedy, gdy telefon jest wyciszony przełącznikiem z boku
try {
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
} catch (e) {
  // starszy iPhone – trudno
}
// iPhone pozwala włączyć dźwięk (i mowę) dopiero po puszczeniu palca
let mowaOdblokowana = false;
for (const zdarzenie of ['touchend', 'click']) {
  window.addEventListener(zdarzenie, () => {
    przygotujDzwiek();
    if (!mowaOdblokowana && 'speechSynthesis' in window) {
      mowaOdblokowana = true;
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  });
}

function pisk(czestotliwosc, dlugosc = 0.15, typ = 'square', glosnosc = 0.12, opoznienie = 0) {
  slizg(czestotliwosc, czestotliwosc, dlugosc, typ, glosnosc, opoznienie);
}

// Dźwięk, który zjeżdża albo wjeżdża z jednej wysokości na drugą (np. „fiuuu”)
function slizg(od, doCz, dlugosc = 0.15, typ = 'sine', glosnosc = 0.1, opoznienie = 0) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;
  const osc = audio.createOscillator();
  osc.type = typ;
  osc.frequency.setValueAtTime(od, t);
  osc.frequency.exponentialRampToValueAtTime(doCz, t + dlugosc);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(glosnosc, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dlugosc);
  osc.connect(g);
  g.connect(wzmacniacz);
  osc.start(t);
  osc.stop(t + dlugosc + 0.02);
}

// Dźwięk, który po drodze zmienia wysokość kilka razy: punkty = [[czas, częstotliwość], ...]
function melodyjka(punkty, typ = 'sawtooth', glosnosc = 0.1, opoznienie = 0, filtr = 1600) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;
  const koniec = punkty[punkty.length - 1][0];
  const osc = audio.createOscillator();
  osc.type = typ;
  osc.frequency.setValueAtTime(punkty[0][1], t);
  for (const [pt, f] of punkty.slice(1)) osc.frequency.linearRampToValueAtTime(f, t + pt);
  const lp = audio.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = filtr;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(glosnosc, t + 0.03);
  g.gain.setValueAtTime(glosnosc, t + koniec * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + koniec);
  osc.connect(lp);
  lp.connect(g);
  g.connect(wzmacniacz);
  osc.start(t);
  osc.stop(t + koniec + 0.02);
}

// Szum (plusk, syk, szuranie) – losowe drgania przepuszczone przez filtr
function szum(dlugosc, typFiltra, od, doCz, glosnosc, opoznienie = 0) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;
  const bufor = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * dlugosc)), audio.sampleRate);
  const dane = bufor.getChannelData(0);
  for (let i = 0; i < dane.length; i++) dane[i] = (Math.random() * 2 - 1) * (1 - i / dane.length);
  const zrodlo = audio.createBufferSource();
  zrodlo.buffer = bufor;
  const filtr = audio.createBiquadFilter();
  filtr.type = typFiltra;
  filtr.frequency.setValueAtTime(od, t);
  filtr.frequency.exponentialRampToValueAtTime(doCz, t + dlugosc);
  const g = audio.createGain();
  g.gain.setValueAtTime(glosnosc, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dlugosc);
  zrodlo.connect(filtr);
  filtr.connect(g);
  g.connect(wzmacniacz);
  zrodlo.start(t);
}

function losowa(a, b) {
  return a + Math.random() * (b - a);
}

const dzwiekCiach = () => { szum(0.07, 'highpass', 2500, 6000, 0.3); pisk(170, 0.06, 'triangle', 0.2, 0.02); };
const dzwiekPlusk = () => { szum(0.4, 'bandpass', 1800, 300, 0.45); slizg(900, 250, 0.18, 'sine', 0.08); };
const dzwiekPlum = () => slizg(520, 140, 0.2, 'sine', 0.2);
const dzwiekPlop = () => slizg(280, 620, 0.09, 'sine', 0.14);
const dzwiekChwytu = () => slizg(500, 820, 0.06, 'sine', 0.06);
const dzwiekNieTo = () => { slizg(330, 150, 0.22, 'triangle', 0.16); slizg(150, 320, 0.22, 'triangle', 0.13, 0.22); };
const dzwiekSypania = () => szum(0.08, 'highpass', 5000, 7000, 0.07);
const dzwiekLania = () => slizg(losowa(250, 450), losowa(600, 950), 0.07, 'sine', 0.06);
const dzwiekPekania = () => { szum(0.05, 'highpass', 3000, 6000, 0.4); pisk(950, 0.03, 'square', 0.04); };
const dzwiekMieszania = () => szum(0.25, 'bandpass', 700, 1500, 0.14);
const dzwiekBulgotania = (p) => slizg(losowa(150, 330), losowa(400, 700), 0.08, 'sine', 0.05 + 0.06 * p);
const dzwiekPyk = () => slizg(600, 1350, 0.07, 'sine', 0.14);
const dzwiekDing = () => { pisk(1568, 0.9, 'triangle', 0.16); pisk(2093, 1.0, 'triangle', 0.1, 0.12); };
const dzwiekKlik = () => { pisk(1200, 0.03, 'square', 0.06); pisk(700, 0.04, 'square', 0.05, 0.05); };
const dzwiekOgnia = () => szum(0.6, 'lowpass', 700, 250, 0.3);
const dzwiekBrawo = () => [784, 988, 1175].forEach((f, i) => pisk(f, 0.15, 'triangle', 0.13, i * 0.08));
const dzwiekMagii = () => [1046, 1318, 1568, 2093].forEach((f, i) => pisk(f, 0.12, 'sine', 0.08, i * 0.05));
const dzwiekHop = () => slizg(300, 950, 0.22, 'sine', 0.14);
const dzwiekPlask = () => { szum(0.15, 'lowpass', 1500, 400, 0.4); slizg(260, 120, 0.12, 'sine', 0.14); };
const dzwiekSkwierczenia = () => szum(losowa(0.03, 0.08), 'highpass', losowa(3000, 6000), 7000, losowa(0.02, 0.06));
const dzwiekWalkowania = () => szum(0.22, 'lowpass', 320, 200, 0.25);
const dzwiekSmarowania = () => szum(0.14, 'bandpass', 1300, 700, 0.12);
const dzwiekWyciskania = () => { szum(0.16, 'bandpass', 1500, 900, 0.16); slizg(420, 260, 0.1, 'sine', 0.05); };
const dzwiekPodania = () => slizg(380, 900, 0.28, 'sine', 0.09);
const dzwiekMniam = () => { slizg(330, 260, 0.1, 'sine', 0.13); slizg(390, 300, 0.12, 'sine', 0.13, 0.13); };
const dzwiekFuj = () => { melodyjka([[0, 340], [0.12, 300], [0.45, 170]], 'sawtooth', 0.08, 0, 1000); szum(0.3, 'bandpass', 600, 300, 0.12); };
const dzwiekSmutnejTraby = () => [392, 370, 349, 294].forEach((f, i) => melodyjka([[0, f], [i === 3 ? 0.7 : 0.3, f * 0.97]], 'sawtooth', 0.08, i * 0.32, 1100));
const dzwiekNakladania = () => { szum(0.12, 'lowpass', 900, 300, 0.25); slizg(300, 520, 0.12, 'sine', 0.1); };
const dzwiekHihi = () => { slizg(900, 1300, 0.07, 'sine', 0.08); slizg(950, 1400, 0.07, 'sine', 0.08, 0.11); };
const dzwiekMruczenia = () => { for (const o of [0, 0.12, 0.24]) szum(0.1, 'lowpass', 220, 120, 0.4, o); };
const dzwiekFanfary = () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => pisk(f, i === 5 ? 0.6 : 0.2, 'triangle', 0.15, i * 0.14));

// Każdy zwierzak cieszy się po swojemu
function dzwiekZwierzaka(typ) {
  switch (typ) {
    case 'kotek': // miau!
      melodyjka([[0, 620], [0.16, 920], [0.55, 560]], 'sawtooth', 0.09, 0, 1900);
      break;
    case 'piesek': // hau hau!
      for (const o of [0, 0.28]) {
        melodyjka([[0, 330], [0.06, 440], [0.16, 250]], 'square', 0.08, o, 900);
        szum(0.08, 'lowpass', 800, 300, 0.15, o);
      }
      break;
    case 'malpka': // u-u-a-a!
      [[400, 560], [420, 580], [620, 820], [640, 840]].forEach(([a, b], i) =>
        melodyjka([[0, a], [0.11, b]], 'square', 0.07, i * 0.14, 1500));
      break;
    case 'panda': // mmm!
      melodyjka([[0, 220], [0.2, 330], [0.45, 280]], 'triangle', 0.16);
      pisk(1200, 0.08, 'sine', 0.06, 0.5);
      break;
    case 'jez': // niuch, niuch, piiip!
      for (const o of [0, 0.13, 0.26]) szum(0.06, 'highpass', 2000, 4000, 0.22, o);
      slizg(1200, 1700, 0.12, 'sine', 0.08, 0.42);
      break;
  }
}


// =====================================================
//   MOWA – gra mówi, co trzeba zrobić
// =====================================================
let glosPL = null;

function znajdzGlos() {
  if (!('speechSynthesis' in window)) return;
  const glosy = window.speechSynthesis.getVoices();
  glosPL = glosy.find((v) => v.lang && v.lang.toLowerCase().startsWith('pl')) || null;
}

if ('speechSynthesis' in window) {
  znajdzGlos();
  window.speechSynthesis.onvoiceschanged = znajdzGlos;
}

// wysokosc: 1 = zwykły głos, 2 = bardzo piskliwy
function powiedz(tekst, wysokosc = 1.1, szybkosc = 0.95) {
  if (wyciszone || !USTAWIENIA.mowa || !('speechSynthesis' in window)) return;
  if (!glosPL) znajdzGlos();
  if (!glosPL) return;   // nie ma polskiego głosu – nic nie mówimy (angielski głos czytałby śmiesznie)
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.voice = glosPL;
  u.lang = glosPL.lang;
  u.pitch = wysokosc;
  u.rate = szybkosc;
  window.speechSynthesis.speak(u);
}

function ucisz() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function pochwala() {
  return POCHWALY[Math.floor(Math.random() * POCHWALY.length)];
}

function ustawNapis(t) {
  napisKroku = t;
}


// =====================================================
//   ZAPISYWANIE – ile razy ugotowano każdą potrawę
// =====================================================
function wczytajUgotowane() {
  try {
    return JSON.parse(localStorage.getItem(KLUCZ_UGOTOWANYCH)) || {};
  } catch (e) {
    return {};
  }
}

function zapiszUgotowane() {
  try {
    localStorage.setItem(KLUCZ_UGOTOWANYCH, JSON.stringify(ugotowane));
    const suma = Object.values(ugotowane).reduce((a, b) => a + b, 0);
    localStorage.setItem(KLUCZ_REKORDU, String(suma));
  } catch (e) {
    // przeglądarka nie pozwala zapisywać – trudno
  }
}


// =====================================================
//   EFEKTY (iskierki, krople, serduszka, konfetti...)
// =====================================================
function dodajEfekt(e) {
  efekty.push(Object.assign({ t: 0, zycie: 1, vx: 0, vy: 0, g: 0, obrot: 0, wir: 0 }, e));
}

const KOLORY_ISKIER = ['#ffd23f', '#ff7eb6', '#4cc9f0', '#3ddc97', '#c77dff', '#ff9f1c'];

function iskry(x, y, ile = 12) {
  for (let i = 0; i < ile; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = losowa(120, 320);
    dodajEfekt({ typ: 'iskra', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, zycie: losowa(0.5, 0.9), r: losowa(7, 13), kolor: KOLORY_ISKIER[i % KOLORY_ISKIER.length], wir: losowa(-6, 6) });
  }
}

// doY: na jakiej wysokości krople znikają (np. wpadają z powrotem do garnka)
function krople(x, y, kolor, ile = 8, sila = 1, doY = undefined) {
  for (let i = 0; i < ile; i++) {
    dodajEfekt({ typ: 'kropla', x, y, vx: losowa(-200, 200) * sila, vy: losowa(-380, -150) * sila, g: 1300, zycie: 0.7, r: losowa(4, 8), kolor, doY });
  }
}

function serduszka(x, y, ile = 3) {
  for (let i = 0; i < ile; i++) {
    dodajEfekt({ typ: 'serce', x: x + losowa(-30, 30), y: y + losowa(-10, 10), vx: losowa(-30, 30), vy: losowa(-150, -90), zycie: losowa(1.2, 1.7), r: losowa(10, 16) });
  }
}

function para(x, y) {
  dodajEfekt({ typ: 'para', x, y, vx: losowa(-12, 12), vy: losowa(-60, -40), zycie: losowa(1.3, 1.9), r: losowa(14, 24) });
}

function konfetti(ile) {
  for (let i = 0; i < ile; i++) {
    dodajEfekt({ typ: 'konfetti', x: losowa(0, V.w), y: losowa(-200, -10), vx: losowa(-80, 80), vy: losowa(120, 280), g: 60, zycie: losowa(3, 4.5), kolor: KOLORY_ISKIER[i % KOLORY_ISKIER.length], wir: losowa(-8, 8), w: losowa(10, 16), h: losowa(6, 10) });
  }
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.t += dt;
    e.vy += e.g * dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.obrot += e.wir * dt;
  }
  efekty = efekty.filter((e) => e.t < e.zycie && !(e.doY !== undefined && e.y > e.doY));
}

function rysujEfekty() {
  for (const e of efekty) {
    const a = 1 - e.t / e.zycie;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.5));
    switch (e.typ) {
      case 'iskra':
        ctx.translate(e.x, e.y);
        ctx.rotate(e.obrot);
        rysujGwiazdke(0, 0, e.r * (0.5 + a * 0.5), true);
        break;
      case 'kropla':
        ctx.fillStyle = e.kolor;
        kolo(e.x, e.y, e.r);
        ctx.fill();
        break;
      case 'ziarno':
        ctx.fillStyle = e.kolor;
        kolo(e.x, e.y, e.r);
        ctx.fill();
        break;
      case 'serce':
        rysujSerce(e.x, e.y, e.r);
        break;
      case 'para':
        ctx.globalAlpha = 0.45 * a;
        ctx.fillStyle = '#ffffff';
        kolo(e.x, e.y, e.r * (1.6 - a * 0.6));
        ctx.fill();
        break;
      case 'konfetti':
        ctx.translate(e.x, e.y);
        ctx.rotate(e.obrot);
        ctx.fillStyle = e.kolor;
        ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
        break;
      case 'napis':
        napis(e.tekst, e.x, e.y, e.rozmiar || 30, e.kolor || '#ff7b54', 'center', '#ffffff');
        break;
      case 'skorupka':
        rysujKawalek('🥚', e.czesc, 2, e.x, e.y, 90, e.obrot);
        break;
      case 'polowka':
        rysujPolowke(e.x, e.y, 34, e.obrot);
        break;
    }
    ctx.restore();
  }
}


// =====================================================
//   BĄBELKI – rosną z garnka, można je łapać
// =====================================================
function nowyBabelek(x, y, r) {
  babelki.push({ x, y, r, vy: -losowa(40, 80), t: 0, zycie: losowa(2.2, 3.2), faza: Math.random() * 6 });
}

function aktualizujBabelki(dt) {
  for (const b of babelki) {
    b.t += dt;
    b.x += Math.sin(b.t * 3 + b.faza) * 22 * dt;
    b.y += b.vy * dt;
  }
  babelki = babelki.filter((b) => b.t < b.zycie);
}

function trafBabelek(x, y) {
  for (let i = babelki.length - 1; i >= 0; i--) {
    const b = babelki[i];
    if (Math.hypot(x - b.x, y - b.y) < b.r + 18) {
      babelki.splice(i, 1);
      dzwiekPyk();
      iskry(b.x, b.y, 6);
      return true;
    }
  }
  return false;
}

function rysujBabelki() {
  for (const b of babelki) {
    const pojaw = Math.min(1, b.t * 4);
    const r = b.r * pojaw;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    kolo(b.x, b.y, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    kolo(b.x - r * 0.35, b.y - r * 0.35, r * 0.22);
    ctx.fill();
  }
}


// =====================================================
//   RZECZY W LOCIE
// =====================================================
function rzuc(x0, y0, x1, y1, wysokosc, czasLotu, rysuj, koniec) {
  lecace.push({ x0, y0, x1, y1, wys: wysokosc, t: 0, czas: czasLotu, rysuj, koniec });
}

function aktualizujLecace(dt) {
  const skonczone = [];
  for (const l of lecace) {
    l.t += dt;
    if (l.t >= l.czas) skonczone.push(l);
  }
  lecace = lecace.filter((l) => l.t < l.czas);
  for (const l of skonczone) if (l.koniec) l.koniec();
}

function rysujLecace() {
  for (const l of lecace) {
    const p = Math.min(1, l.t / l.czas);
    const x = l.x0 + (l.x1 - l.x0) * p;
    const y = l.y0 + (l.y1 - l.y0) * p - Math.sin(Math.PI * p) * l.wys;
    l.rysuj(x, y, p);
  }
}


// =====================================================
//   NARZĘDZIA
// =====================================================
function blisko(x, y, ox, oy, r) {
  return (x - ox) * (x - ox) + (y - oy) * (y - oy) < r * r;
}

function potasuj(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ruch „z odbiciem” – rzeczy pojawiają się z lekkim podskokiem
function sprezyna(t) {
  t = ogranicz(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function plynnie(t) {
  t = ogranicz(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Złap coś palcem
function chwyc(ob, x, y) {
  chwyt = ob;
  ob.wraca = false;
  ob.dx = ob.x - x;
  ob.dy = ob.y - y - 20;   // trochę nad palcem, żeby było widać, co trzymasz
  dzwiekChwytu();
}

// Rzecz wraca na swoje miejsce
function wracaj(ob, dt) {
  if (!ob.wraca) return;
  const k = Math.min(1, dt * 10);
  ob.x += (ob.domX - ob.x) * k;
  ob.y += (ob.domY - ob.y) * k;
  if (Math.hypot(ob.domX - ob.x, ob.domY - ob.y) < 1) {
    ob.x = ob.domX;
    ob.y = ob.domY;
    ob.wraca = false;
  }
}

function cien(x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  elipsa(x, y, w * 0.4, w * 0.1);
  ctx.fill();
}


// =====================================================
//   NACZYNIE
// =====================================================
function noweNaczynie(typ) {
  return {
    typ,
    plyn: 0,              // ile płynu (0 – nic, 1 – pełno)
    kolor: null,          // kolor płynu
    kawalki: [],          // pokrojone kawałki
    kupki: [],            // kupki mąki
    drobinki: [],         // sól
    polewa: [],           // miód
    zoltka: [],           // jajka
    ogien: 0,             // płomyki pod spodem
    wir: 0,               // jak bardzo zakręcone (do fal na zupie)
    goracy: false,        // czy paruje
    ciasto: typ === 'pizza' ? { r: 0.36 } : typ === 'talerz' ? { r: 0.8 } : null,   // na talerzu: gniazdo makaronu
    galki: [],            // gałki lodów
    posypki: [],          // posypka na lodach
    sos: null,            // sos na lodach
    wisienka: false,
    wafelek: false,
    warstwy: [],          // sos, ser, dżem
    dodatki: [],          // grzybki i salami na pizzy
    upieczenie: 0,
    nalesnik: null,
    wyciskarka: typ === 'dzbanek' && !(przepis && przepis.wlasny) ? 1 : 0,
    polowki: 0,
    wycisk: null,
    zdejmij: false,
    pojaw: 0,
  };
}

function pozN() {
  return M.n[N.typ];
}

// Powierzchnia, na której się pracuje (środek, promień, spłaszczenie)
function geo() {
  const p = pozN();
  const g = NACZYNIA[N.typ];
  if (N.typ === 'dzbanek') return { cx: p.x, cy: p.y + glebokoscPowierzchni(N), R: 78, e: 0.3 };
  if (N.typ === 'garnek' || N.typ === 'miska') return { cx: p.x, cy: p.y + glebokoscPowierzchni(N), R: g.R * 0.85, e: g.e };
  return { cx: p.x, cy: p.y, R: g.R, e: g.e };
}

// Czy to miejsce jest nad naczyniem (czy można tu coś upuścić)
function nadNaczyniem(x, y) {
  const p = pozN();
  const g = NACZYNIA[N.typ];
  switch (N.typ) {
    case 'garnek': return Math.abs(x - p.x) < g.R * 1.25 && y > p.y - 200 && y < p.y + 160;
    case 'miska': return Math.abs(x - p.x) < g.R * 1.25 && y > p.y - 200 && y < p.y + 130;
    case 'dzbanek': return Math.abs(x - p.x) < 160 && y > p.y - 210 && y < p.y + 240;
    default: {
      const dx = (x - p.x) / (g.R * 1.15);
      const dy = (y - p.y) / (g.R * g.e * 1.15 + 40);
      return dx * dx + dy * dy < 1;
    }
  }
}

// Gdzie celuje rączka, kiedy pokazuje „przeciągnij do garnka”
function celUpuszczenia() {
  const p = pozN();
  return { x: p.x, y: p.y - (N.typ === 'dzbanek' ? 70 : 30) };
}

// Miejsce na powierzchni (u, v od -1 do 1) – potrzebne do malowania i dodatków na pizzy
function naUV(x, y) {
  const g = geo();
  return { u: (x - g.cx) / g.R, v: (y - g.cy) / (g.R * g.e) };
}

function pokretlo() {
  const p = pozN();
  return { x: p.x + 232, y: p.y + (N.typ === 'patelnia' ? 60 : 150) };
}

function nowyKawalek(sk, czesc, z) {
  return { sk, czesc, z, a: Math.random() * Math.PI * 2, r: losowa(0.1, 0.72), obrot: losowa(-0.4, 0.4), faza: Math.random() * 6, skala: 1 };
}

function chlupnij() {
  const g = geo();
  if (N.plyn > 0.05 && N.kolor) {
    krople(g.cx, g.cy - 10, N.kolor, 10, 1, g.cy + 12);
    dzwiekPlusk();
  } else {
    dzwiekPlum();
  }
}

// Pokrojone kawałki lądują w naczyniu
function wrzucPlasterki(sk, z) {
  if (N.typ === 'dzbanek' && N.wyciskarka > 0.5) {
    // pomarańcza ląduje na wyciskarce
    N.polowki = z;
    N.wycisk = { obrot: 0, scisk: 0 };
    dzwiekPlop();
    iskry(pozN().x, pozN().y - 60, 8);
    return;
  }
  for (let j = 0; j < z; j++) N.kawalki.push(nowyKawalek(sk, j, z));
  // woda trochę zabarwia się na kolor tego, co do niej wpadło
  if (N.plyn > 0.05 && N.kolor && przepis.kolor) N.kolor = mieszajKolory(N.kolor, SKLADNIKI[sk].kolor, 0.3);
  chlupnij();
}

// Cały składnik ląduje w naczyniu
function dodajCalosc(sk) {
  N.kawalki.push(nowyKawalek(sk, -1, 1));
  chlupnij();
}


// =====================================================
//   KROKI PRZEPISU
//   Każdy rodzaj kroku ma swoje: start, dotyk, ruch, puszczenie,
//   update (co się dzieje z czasem), rysuj i podpowiedz (co pokazuje rączka)
// =====================================================
const MECH = {};

// ---------- KROJENIE ----------
function liniaCiecia(k, nr) {
  const sz = szerokoscEmotki(SKLADNIKI[k.ob.sk].obrazek, k.ob.wielkosc);
  return k.ob.x - sz / 2 + sz * nr / (k.n + 1);
}

MECH.kroj = {
  start(k) {
    k.n = k.def.ile;
    k.ciecia = 0;
    k.noz = 0;
    k.faza = 'krojenie';
    const x = M.deska.x;
    const y = M.deska.y - 8;
    k.ob = { sk: k.def.skladnik, x, y, domX: x, domY: y, wielkosc: 150, widoczny: true, pojaw: 0 };
  },
  dotyk(k, x, y) {
    if (k.faza === 'krojenie') {
      if (Math.abs(x - k.ob.x) < 180 && Math.abs(y - k.ob.y) < 140 && k.noz <= 0.06) {
        k.ciecia++;
        k.noz = 0.24;
        dzwiekCiach();
        krople(liniaCiecia(k, k.ciecia), k.ob.y, SKLADNIKI[k.ob.sk].kolor, 6, 0.6);
        if (k.ciecia >= k.n) k.faza = 'pokrojone';
      }
    } else if (k.faza === 'przenoszenie') {
      if (blisko(x, y, k.ob.x, k.ob.y, 120)) chwyc(k.ob, x, y);
    }
  },
  puszczenie(k) {
    if (chwyt !== k.ob) return;
    chwyt = null;
    if (nadNaczyniem(k.ob.x, k.ob.y)) {
      wrzucPlasterki(k.ob.sk, k.n + 1);
      k.ob.widoczny = false;
      krokGotowy();
    } else {
      k.ob.wraca = true;
    }
  },
  update(k, dt) {
    k.noz = Math.max(0, k.noz - dt);
    k.ob.pojaw = Math.min(1, k.ob.pojaw + dt * 3);
    if (k.faza === 'pokrojone' && k.noz <= 0) {
      k.faza = 'przenoszenie';
      const t = k.def.tekst2 || 'Wrzuć kawałki ' + NACZYNIA[N.typ].doNazwa;
      ustawNapis(t);
      powiedz(pochwala() + ' ' + t);
      bezczynnosc = 0;
    }
    wracaj(k.ob, dt);
  },
  rysuj(k) {
    const ob = k.ob;
    if (!ob.widoczny) return;
    const o = SKLADNIKI[ob.sk].obrazek;
    const z = k.n + 1;
    const c = k.ciecia;
    const wiel = ob.wielkosc * sprezyna(ob.pojaw);
    if (chwyt !== ob) cien(ob.x, ob.y + wiel * 0.42, wiel);
    for (let j = 0; j < z; j++) {
      const dx = j < c ? -(c - j) * 13 : 0;
      rysujPlasterek(o, j, z, ob.x, ob.y, wiel, dx);
    }
    if (k.faza === 'krojenie' || (k.faza === 'pokrojone' && k.noz > 0)) {
      const nr = k.noz > 0 ? k.ciecia : k.ciecia + 1;
      const p = k.noz > 0 ? Math.sin((1 - k.noz / 0.24) * Math.PI) : 0;
      const ny = ob.y - 95 + p * 115 + (k.noz > 0 ? 0 : Math.sin(czas * 4) * 5);
      rysujNoz(liniaCiecia(k, nr), ny);
    }
  },
  podpowiedz(k) {
    if (k.faza === 'krojenie') return { typ: 'stuk', x: liniaCiecia(k, k.ciecia + 1), y: k.ob.y };
    if (k.faza === 'przenoszenie' && chwyt !== k.ob) {
      const c = celUpuszczenia();
      return { typ: 'ciagnij', x: k.ob.x, y: k.ob.y, x2: c.x, y2: c.y };
    }
    return null;
  },
};

// ---------- WRZUCANIE (trzeba znaleźć właściwą rzecz) ----------
MECH.wrzuc = {
  start(k) {
    k.zostalo = k.def.ile;
    const wPrzepisie = new Set(przepis.kroki.map((s) => s.skladnik).filter(Boolean));
    const inne = potasuj(NA_BLACIE.filter((s) => !wPrzepisie.has(s)));
    const smieszne = inne.filter((s) => SKLADNIKI[s].niejadalne);
    const jadalne = inne.filter((s) => !SKLADNIKI[s].niejadalne);
    const wybrane = [jadalne[0] || inne[0], smieszne[0] || inne[1]];
    const sloty = potasuj([0, 1, 2]);
    k.rzeczy = [k.def.skladnik, ...wybrane].map((sk, i) => {
      const m = M.polka[sloty[i]];
      return { sk, poprawny: i === 0, x: m.x, y: m.y, domX: m.x, domY: m.y, wielkosc: 100, pojaw: -i * 0.15, widoczny: true, chwiej: 0, alfa: 1 };
    });
  },
  dotyk(k, x, y) {
    for (const r of k.rzeczy) {
      if (r.widoczny && !r.znika && blisko(x, y, r.x, r.y, 78)) {
        chwyc(r, x, y);
        return;
      }
    }
  },
  puszczenie(k) {
    const r = chwyt;
    if (!r || !k.rzeczy.includes(r)) return;
    chwyt = null;
    if (!nadNaczyniem(r.x, r.y)) {
      r.wraca = true;
      return;
    }
    if (r.poprawny) {
      dodajCalosc(r.sk);
      k.zostalo--;
      if (k.zostalo > 0) {
        r.x = r.domX;
        r.y = r.domY;
        r.pojaw = 0;
        iskry(pozN().x, pozN().y - 40, 6);
      } else {
        r.widoczny = false;
        for (const q of k.rzeczy) q.znika = true;
        krokGotowy();
      }
    } else {
      // To nie to! Rzecz odbija się od garnka i wraca na blat
      r.wraca = true;
      r.chwiej = 0.7;
      dzwiekNieTo();
      const d = SKLADNIKI[r.sk];
      powiedz(d.niejadalne ? `Ha ha! ${d.nazwa}? Tego się nie je!` : `Hmm, to ${d.nazwa.toLowerCase()}. ${k.def.tekst}`);
      bezczynnosc = USTAWIENIA.podpowiedzPo - 1.5;   // za chwilę rączka pokaże, co wziąć
    }
  },
  update(k, dt) {
    for (const r of k.rzeczy) {
      r.pojaw = Math.min(1, r.pojaw + dt * 3.5);
      r.chwiej = Math.max(0, r.chwiej - dt);
      if (r.znika) r.alfa = Math.max(0, r.alfa - dt * 3);
      wracaj(r, dt);
    }
  },
  rysuj(k) {
    const lista = k.rzeczy.filter((r) => r !== chwyt).concat(k.rzeczy.filter((r) => r === chwyt));
    for (const r of lista) {
      if (!r.widoczny || r.alfa <= 0) continue;
      const wiel = r.wielkosc * sprezyna(Math.max(0, r.pojaw));
      if (wiel <= 1) continue;
      const obrot = Math.sin(r.chwiej * 30) * 0.3 * r.chwiej;
      // stosik: jeśli trzeba wrzucić kilka sztuk, widać, ile jeszcze zostało
      if (r.poprawny && k.zostalo > 1) {
        for (let i = k.zostalo - 1; i >= 1; i--) rysujSkladnik(r.sk, r.domX + i * 16, r.domY - i * 8, wiel * 0.85, 0.2, r.alfa);
      }
      if (chwyt !== r) cien(r.x, r.y + wiel * 0.45, wiel);
      rysujSkladnik(r.sk, r.x, r.y, wiel, obrot, r.alfa);
    }
  },
  podpowiedz(k) {
    if (chwyt) return null;
    const r = k.rzeczy[0];
    const c = celUpuszczenia();
    return { typ: 'ciagnij', x: r.domX, y: r.domY, x2: c.x, y2: c.y };
  },
};

// ---------- LANIE I SYPANIE ----------
function miejsceLania() {
  const p = pozN();
  return { x: p.x - NACZYNIA[N.typ].R * 0.55, y: p.y - 140 };
}

function wylot(ob) {
  const [lx, ly] = WYLOTY[ob.sk] || [0, -45];
  const k = ob.wielkosc / 100;
  const c = Math.cos(ob.obrot);
  const s = Math.sin(ob.obrot);
  return { x: ob.x + (lx * c - ly * s) * k, y: ob.y + (lx * s + ly * c) * k };
}

MECH.polej = {
  start(k) {
    const sk = k.def.skladnik;
    k.rodzaj = SKLADNIKI[sk].rodzaj || 'plyn';
    const m = M.przedmiot;
    k.ob = { sk, x: m.x, y: m.y, domX: m.x, domY: m.y, wielkosc: 130, obrot: 0, pojaw: 0, alfa: 1 };
    k.postep = 0;
    k.upuszczony = false;
    k.leje = false;
    k.dzw = 0;
    k.punkt = 0;
    k.cel = null;
    if (k.rodzaj === 'polewa') {
      k.polewa = { kolor: SKLADNIKI[sk].kolor, punkty: [] };
      N.polewa.push(k.polewa);
    }
    if (sk === 'maka') {
      k.kupka = { kolor: '#fbf7ee', w: 0 };
      N.kupki.push(k.kupka);
    }
  },
  dotyk(k, x, y) {
    if (!k.upuszczony && blisko(x, y, k.ob.x, k.ob.y, 95)) chwyc(k.ob, x, y);
  },
  puszczenie(k) {
    if (chwyt !== k.ob) return;
    chwyt = null;
    if (nadNaczyniem(k.ob.x, k.ob.y)) k.upuszczony = true;   // puszczone nad garnkiem – samo się wyleje
    else k.ob.wraca = true;
  },
  update(k, dt) {
    const ob = k.ob;
    ob.pojaw = Math.min(1, ob.pojaw + dt * 3);
    const nad = !k.gotowe && ((chwyt === ob && nadNaczyniem(ob.x, ob.y)) || k.upuszczony);
    if (k.upuszczony && !k.gotowe) {
      const c = miejsceLania();
      ob.x += (c.x - ob.x) * Math.min(1, dt * 6);
      ob.y += (c.y - ob.y) * Math.min(1, dt * 6);
    }
    const docelowy = nad ? (ob.sk === 'sol' ? 2.6 : 1.95) : 0;
    ob.obrot += (docelowy - ob.obrot) * Math.min(1, dt * 7);
    k.leje = nad && ob.obrot > docelowy * 0.75;
    ob.trzes = 0;
    if (k.leje) {
      k.postep += dt / 2.0;
      const w = wylot(ob);
      const g = geo();
      const kolor = SKLADNIKI[ob.sk].kolor;
      k.dzw -= dt;
      if (k.rodzaj === 'sypkie') {
        if (ob.sk === 'sol') ob.trzes = Math.sin(czas * 45) * 9;
        for (let i = 0; i < 2; i++) {
          dodajEfekt({ typ: 'ziarno', x: w.x + losowa(-8, 8), y: w.y + ob.trzes, vx: losowa(-30, 30), vy: losowa(60, 140), g: 900, zycie: 1.5, doY: g.cy + losowa(-12, 12), kolor: '#ffffff', r: ob.sk === 'maka' ? 4.5 : 2.5 });
        }
        if (ob.sk === 'sol' && N.drobinki.length < 70 && Math.random() < 0.5) {
          N.drobinki.push({ u: losowa(-0.6, 0.6), v: losowa(-0.6, 0.6), kolor: '#ffffff' });
        }
        if (k.kupka) k.kupka.w = Math.min(1, k.postep * 1.1);
        if (k.dzw <= 0) {
          k.dzw = 0.11;
          dzwiekSypania();
        }
      } else {
        if (k.rodzaj === 'plyn') {
          N.kolor = N.plyn < 0.02 || !N.kolor ? kolor : mieszajKolory(N.kolor, kolor, dt * 0.9);
          N.plyn = Math.min(N.typ === 'garnek' ? 0.8 : 0.55, N.plyn + dt * 0.4);
        }
        if (k.rodzaj === 'polewa') {
          k.punkt -= dt;
          const u = Math.sin(czas * 2.7) * 0.55;
          const v = Math.sin(czas * 4.3) * 0.5;
          if (k.punkt <= 0) {
            k.punkt = 0.04;
            k.polewa.punkty.push([u, v]);
          }
          k.cel = { x: g.cx + u * NACZYNIA[N.typ].R, y: g.cy - 12 + v * NACZYNIA[N.typ].R * g.e };
        } else {
          k.cel = { x: g.cx - g.R * 0.25, y: g.cy };
        }
        if (Math.random() < dt * 8) krople(k.cel.x, k.cel.y, N.kolor || kolor, 1, 0.4, k.cel.y + 10);
        if (k.dzw <= 0) {
          k.dzw = 0.13;
          dzwiekLania();
        }
      }
    }
    if (k.postep >= 1 && !k.gotowe) {
      krokGotowy();
      ob.odlot = true;
    }
    if (ob.odlot) {
      ob.obrot += (0 - ob.obrot) * Math.min(1, dt * 6);
      ob.y -= dt * 500;
      ob.alfa = Math.max(0, ob.alfa - dt * 2);
    }
    wracaj(ob, dt);
  },
  rysuj(k) {
    const ob = k.ob;
    if (ob.alfa <= 0) return;
    // strumień płynu
    if (k.leje && k.rodzaj !== 'sypkie' && k.cel) {
      const w = wylot(ob);
      const kolor = SKLADNIKI[ob.sk].kolor;
      ctx.strokeStyle = k.rodzaj === 'polewa' ? kolor : (ob.sk === 'woda' ? '#62bdf0' : kolor);
      ctx.lineWidth = k.rodzaj === 'polewa' ? 9 : 13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x, w.y);
      ctx.quadraticCurveTo(w.x + 14, (w.y + k.cel.y) / 2, k.cel.x, k.cel.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (chwyt !== ob && !k.upuszczony && !ob.odlot) cien(ob.x, ob.y + 70, 120);
    rysujSkladnik(ob.sk, ob.x, ob.y + (ob.trzes || 0), ob.wielkosc * sprezyna(ob.pojaw), ob.obrot, ob.alfa);
  },
  podpowiedz(k) {
    if (k.upuszczony || chwyt) return null;
    const c = miejsceLania();
    return { typ: 'ciagnij', x: k.ob.domX, y: k.ob.domY, x2: c.x, y2: c.y + 40 };
  },
};

// ---------- JAJKO ----------
MECH.jajko = {
  start(k) {
    const x = M.deska.x;
    const y = M.deska.y - 12;
    k.ob = { x, y, wielkosc: 130, pojaw: 0, widoczny: true };
    k.stuki = 0;
    k.pekniecia = [];
    k.chwiej = 0;
    k.lot = -1;
  },
  dotyk(k, x, y) {
    if (k.lot >= 0 || !blisko(x, y, k.ob.x, k.ob.y, 110)) return;
    k.stuki++;
    k.chwiej = 0.35;
    dzwiekPekania();
    // nowe pęknięcie na skorupce
    const py = losowa(-24, 22);
    const linia = [];
    for (let i = 0; i <= 5; i++) linia.push([-30 + i * 12, py + (i % 2 ? 7 : -7) + losowa(-3, 3)]);
    k.pekniecia.push(linia);
    if (k.stuki >= k.def.ile) {
      k.lot = 0;
      k.start = { x: k.ob.x, y: k.ob.y };
    }
  },
  update(k, dt) {
    k.ob.pojaw = Math.min(1, k.ob.pojaw + dt * 3);
    k.chwiej = Math.max(0, k.chwiej - dt);
    if (k.lot >= 0 && k.ob.widoczny) {
      k.lot += dt / 0.6;
      const p = Math.min(1, k.lot);
      const c = pozN();
      k.ob.x = k.start.x + (c.x - k.start.x) * p;
      k.ob.y = k.start.y + (c.y - 70 - k.start.y) * p - Math.sin(Math.PI * p) * 170;
      if (k.lot >= 1) {
        // jajko pęka nad miską: skorupki odpadają, żółtko wpada
        k.ob.widoczny = false;
        N.zoltka.push({ u: 0.05, v: 0, alfa: 1 });
        dzwiekPlum();
        for (const czesc of [0, 1]) {
          dodajEfekt({ typ: 'skorupka', czesc, x: c.x + (czesc ? 20 : -20), y: c.y - 60, vx: czesc ? 220 : -220, vy: -260, g: 1300, zycie: 0.9, wir: czesc ? 6 : -6 });
        }
        krokGotowy();
      }
    }
  },
  rysuj(k) {
    const ob = k.ob;
    if (!ob.widoczny) return;
    const obrot = Math.sin(k.chwiej * 45) * 0.25 * (k.chwiej / 0.35);
    const wiel = ob.wielkosc * sprezyna(ob.pojaw);
    if (k.lot < 0) cien(ob.x, ob.y + wiel * 0.45, wiel);
    rysujEmotke('🥚', ob.x, ob.y, wiel, obrot);
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.rotate(obrot);
    ctx.strokeStyle = '#8a6d4a';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    for (const linia of k.pekniecia) {
      ctx.beginPath();
      linia.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    ctx.restore();
  },
  podpowiedz(k) {
    if (k.lot >= 0) return null;
    return { typ: 'stuk', x: k.ob.x, y: k.ob.y };
  },
};

// ---------- MIESZANIE ----------
function katWokol(g, x, y) {
  return Math.atan2((y - g.cy) / Math.max(g.e, 0.45), x - g.cx);
}

function roznicaKata(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return ogranicz(d, -0.8, 0.8);
}

MECH.mieszaj = {
  start(k) {
    k.kat = 0;
    k.potrzeba = k.def.ile * Math.PI * 2;
    k.mieszam = false;
    k.dzw = 0;
    const g = geo();
    k.lyzka = { x: g.cx + g.R * 0.35, y: g.cy };
    k.kolorStart = N.kolor;
    for (const kp of N.kupki) kp.w0 = kp.w;
  },
  dotyk(k, x, y) {
    const g = geo();
    if (Math.abs(x - g.cx) < g.R * 1.4 && Math.abs(y - g.cy) < g.R * g.e + 140) {
      k.mieszam = true;
      k.ost = katWokol(g, x, y);
    }
  },
  ruch(k, x, y) {
    if (!k.mieszam) return;
    const g = geo();
    const a = katWokol(g, x, y);
    const d = roznicaKata(a, k.ost);
    k.ost = a;
    k.kat += Math.abs(d);
    N.wir += d;
    for (const kw of N.kawalki) {
      kw.a += d * 0.8;
      kw.obrot += d * 0.3;
    }
    // miód kręci się razem z łyżką
    const c = Math.cos(d * 0.8);
    const s = Math.sin(d * 0.8);
    for (const p of N.polewa) p.punkty = p.punkty.map(([u, v]) => [u * c - v * s, u * s + v * c]);
    k.dzw += Math.abs(d);
    if (k.dzw > 1.2) {
      k.dzw = 0;
      dzwiekMieszania();
    }
    // łyżka idzie za palcem, ale nie wychodzi z garnka
    let dx = (x - g.cx) / (g.R * 0.8);
    let dy = (y - g.cy) / (g.R * g.e * 0.8);
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    k.lyzka.x = g.cx + dx * g.R * 0.8;
    k.lyzka.y = g.cy + dy * g.R * g.e * 0.8;
  },
  puszczenie(k) {
    k.mieszam = false;
  },
  update(k) {
    const w = Math.min(1, k.kat / k.potrzeba);
    if (przepis.kolor && N.plyn > 0 && k.kolorStart) N.kolor = mieszajKolory(k.kolorStart, przepis.kolor, w);
    for (const kp of N.kupki) kp.w = (kp.w0 || 0) * (1 - w);
    for (const z of N.zoltka) z.alfa = 1 - w;
    for (const d of N.drobinki) d.alfa = 1 - w;
    if (w >= 1 && !k.gotowe) krokGotowy();
  },
  rysuj(k) {
    rysujLyzke(k.lyzka.x, k.lyzka.y, k.def.przybor || 'lyzka');
  },
  podpowiedz(k) {
    if (k.mieszam) return null;
    const g = geo();
    return { typ: 'kolo', x: g.cx, y: g.cy, r: g.R * 0.55, e: Math.max(g.e, 0.45) };
  },
};

// ---------- GOTOWANIE ----------
function rysujZegarek(x, y, r, p) {
  ctx.fillStyle = '#ffffff';
  kolo(x, y, r);
  ctx.fill();
  ctx.fillStyle = '#ffb703';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r * 0.86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff7b54';
  ctx.lineWidth = 5;
  kolo(x, y, r);
  ctx.stroke();
  ctx.fillStyle = '#ff7b54';
  zaokraglony(x - 7, y - r - 12, 14, 10, 3);
  ctx.fill();
}

MECH.gotuj = {
  start(k) {
    k.faza = 'czeka';
    k.t = 0;
    k.kolorStart = N.kolor;
    k.bab = 0.6;
    k.bul = 0;
  },
  dotyk(k, x, y) {
    if (k.faza !== 'czeka') return;
    const p = pokretlo();
    if (blisko(x, y, p.x, p.y, 85) || nadNaczyniem(x, y)) {
      k.faza = 'gotuje';
      dzwiekKlik();
      dzwiekOgnia();
      ustawNapis('Gotuje się… Łap bąbelki!');
      powiedz('Gotuje się! Łap bąbelki!');
    }
  },
  update(k, dt) {
    if (k.faza !== 'gotuje') return;
    k.t += dt;
    const p = k.t / USTAWIENIA.czasGotowania;
    if (przepis.kolor && k.kolorStart) N.kolor = mieszajKolory(k.kolorStart, przepis.kolor, Math.min(1, p) * 0.85);
    const g = geo();
    k.bab -= dt;
    if (k.bab <= 0) {
      k.bab = losowa(0.3, 0.55);
      nowyBabelek(g.cx + losowa(-0.6, 0.6) * g.R, g.cy + losowa(-0.4, 0.4) * g.R * g.e, losowa(16, 28));
    }
    k.bul -= dt;
    if (k.bul <= 0) {
      k.bul = losowa(0.15, 0.35);
      dzwiekBulgotania(Math.min(1, p));
    }
    if (Math.random() < dt * 3) para(g.cx + losowa(-0.5, 0.5) * g.R, g.cy - 20);
    if (p >= 1) {
      k.faza = 'koniec';
      N.goracy = true;
      dzwiekDing();
      krokGotowy();
    }
  },
  rysuj(k) {
    if (k.faza === 'gotuje') {
      const p = pozN();
      rysujZegarek(p.x + 232, p.y - 40, 32, k.t / USTAWIENIA.czasGotowania);
    }
  },
  podpowiedz(k) {
    if (k.faza === 'czeka') {
      const p = pokretlo();
      return { typ: 'stuk', x: p.x, y: p.y };
    }
    if (k.faza === 'gotuje' && babelki.length) {
      const b = babelki[babelki.length - 1];
      return { typ: 'stuk', x: b.x, y: b.y };
    }
    return null;
  },
};

// ---------- SMAŻENIE NALEŚNIKA ----------
MECH.smaz = {
  start(k) {
    k.faza = 'czeka';
    k.t = 0;
    k.skw = 0;
  },
  dotyk(k, x, y) {
    if (!nadNaczyniem(x, y)) return;
    if (k.faza === 'czeka') {
      k.faza = 'nalewa';
      k.t = 0;
      dzwiekLania();
    } else if (k.faza === 'przewroc') {
      k.faza = 'skok';
      k.t = 0;
      dzwiekHop();
    }
  },
  update(k, dt) {
    k.t += dt;
    if (k.faza === 'nalewa') {
      if (!N.nalesnik) N.nalesnik = { r: 0, smazenie: 0, skok: 0, skalaY: 1, zloty: false, dziurki: [] };
      N.nalesnik.r = 0.8 * Math.min(1, k.t / 1.1);
      if (Math.random() < dt * 8) dzwiekLania();
      if (k.t > 1.3) {
        k.faza = 'smazy';
        k.t = 0;
      }
    } else if (k.faza === 'smazy') {
      const nl = N.nalesnik;
      nl.smazenie = Math.min(1, k.t / USTAWIENIA.czasSmazenia);
      if (Math.random() < dt * 6 && nl.dziurki.length < 24) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.8;
        nl.dziurki.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, r: losowa(3, 6) });
      }
      if (k.t >= USTAWIENIA.czasSmazenia) {
        k.faza = 'przewroc';
        const t = 'Przewróć naleśnika! Stuknij w patelnię!';
        ustawNapis(t);
        powiedz(t);
        bezczynnosc = 0;
      }
    } else if (k.faza === 'skok') {
      const nl = N.nalesnik;
      const p = Math.min(1, k.t / 0.9);
      nl.skok = Math.sin(Math.PI * p) * 190;
      nl.skalaY = Math.cos(2 * Math.PI * p);
      if (p > 0.25) nl.zloty = true;
      if (p >= 1) {
        nl.skok = 0;
        nl.skalaY = 1;
        k.faza = 'smazy2';
        k.t = 0;
        dzwiekPlask();
        iskry(pozN().x, pozN().y - 20, 10);
      }
    } else if (k.faza === 'smazy2' && k.t > 1.6) {
      k.faza = 'koniec';
      dzwiekDing();
      krokGotowy();
    }
    // skwierczenie na patelni
    if (['nalewa', 'smazy', 'przewroc', 'skok', 'smazy2'].includes(k.faza)) {
      k.skw -= dt;
      if (k.skw <= 0) {
        k.skw = losowa(0.05, 0.12);
        dzwiekSkwierczenia();
      }
    }
  },
  rysuj(k) {
    if (k.faza !== 'czeka' && k.faza !== 'nalewa') return;
    // miska z ciastem przechyla się nad patelnią
    const p = pozN();
    const bx = p.x - 130;
    const by = p.y - 170;
    const przechyl = k.faza === 'nalewa' ? Math.min(1, k.t * 3) * 0.9 : 0;
    const zostalo = k.faza === 'nalewa' ? 1 - Math.min(1, k.t / 1.1) : 1;
    const miska = noweNaczynie('miska');
    miska.plyn = 0.5 * zostalo;
    miska.kolor = przepis.kolor;
    if (k.faza === 'nalewa' && zostalo > 0.02) {
      const kx = bx + Math.cos(przechyl) * 64;
      const ky = by + Math.sin(przechyl) * 64;
      ctx.strokeStyle = przepis.kolor;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.quadraticCurveTo(kx + 30, (ky + p.y) / 2, p.x - 10, p.y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(przechyl);
    rysujNaczynie(miska, 0, 0, 0.4, czas);
    ctx.restore();
  },
  podpowiedz(k) {
    if (k.faza === 'czeka' || k.faza === 'przewroc') {
      const p = pozN();
      return { typ: 'stuk', x: p.x, y: p.y };
    }
    return null;
  },
};

// ---------- MALOWANIE PALCEM (sos, ser, dżem) ----------
function nowePlotno(rozmiar) {
  const c = document.createElement('canvas');
  c.width = rozmiar;
  c.height = rozmiar;
  return c;
}

// Jedno „pacnięcie” pędzlem na warstwie. u, v od -1 do 1, r – wielkość pędzla
function stempel(w, g, u, v, r) {
  const S = 256;
  const px = (u + 1) * S / 2;
  const py = (v + 1) * S / 2;
  const pr = r * S / 2;
  if (w.styl === 'parmezan') {
    // parmezan na spaghetti: drobne jasne płatki
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#fff8e1' : '#f3e3a6';
      g.beginPath();
      g.arc(px + losowa(-1, 1) * pr * 0.9, py + losowa(-1, 1) * pr * 0.9, losowa(1.5, 3), 0, Math.PI * 2);
      g.fill();
    }
  } else if (w.sk === 'cukier') {
    // cukier puder: dużo malutkich białych kropeczek
    g.fillStyle = 'rgba(255, 255, 255, 0.95)';
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc(px + losowa(-1, 1) * pr * 0.9, py + losowa(-1, 1) * pr * 0.9, losowa(1, 2.2), 0, Math.PI * 2);
      g.fill();
    }
  } else if (w.sk === 'ser') {
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI;
      const l = losowa(6, 11);
      const x = px + losowa(-1, 1) * pr * 0.8;
      const y = py + losowa(-1, 1) * pr * 0.8;
      g.strokeStyle = '#f0b51a';
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
      g.strokeStyle = '#ffe47e';
      g.lineWidth = 2.5;
      g.stroke();
    }
  } else {
    g.fillStyle = SKLADNIKI[w.sk].kolor;
    g.beginPath();
    g.arc(px, py, pr, 0, Math.PI * 2);
    g.fill();
    if (Math.random() < 0.3) {
      g.fillStyle = w.sk === 'dzem' ? 'rgba(255, 200, 210, 0.7)' : w.sk === 'krem' ? 'rgba(140, 90, 60, 0.6)' : 'rgba(150, 20, 10, 0.4)';
      g.beginPath();
      g.arc(px + losowa(-pr, pr) * 0.6, py + losowa(-pr, pr) * 0.6, pr * 0.15, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function nowaWarstwa(sk, promien, styl = sk) {
  const w = { sk, styl, plotno: nowePlotno(256), pelnePlotno: nowePlotno(256), pelne: 0, pelneCel: 0 };
  w.g = w.plotno.getContext('2d');
  // „pełna” wersja: tak wygląda, kiedy wszystko jest pomalowane (pokazuje się na końcu)
  const g = w.pelnePlotno.getContext('2d');
  if (sk === 'ser' || sk === 'cukier') {
    for (let i = 0; i < (styl === 'parmezan' ? 90 : sk === 'cukier' ? 110 : 220); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * promien;
      stempel(w, g, Math.cos(a) * r, Math.sin(a) * r, 0.15);
    }
  } else {
    g.fillStyle = SKLADNIKI[sk].kolor;
    g.beginPath();
    g.arc(128, 128, promien * 128, 0, Math.PI * 2);
    g.fill();
  }
  return w;
}

MECH.smaruj = {
  start(k) {
    // pizza: całe ciasto; spaghetti: środek talerza; naleśnik: prawie cały
    if (N.typ === 'talerz') k.promien = N.ciasto.r * 0.6;
    else if (N.ciasto) k.promien = N.ciasto.r * 0.86;
    else k.promien = N.nalesnik ? N.nalesnik.r * 0.78 : 0.7;
    k.w = nowaWarstwa(k.def.skladnik, k.promien, N.typ === 'talerz' && k.def.skladnik === 'ser' ? 'parmezan' : k.def.skladnik);
    N.warstwy.push(k.w);
    k.komorki = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const u = -1 + (i + 0.5) * 2 / n;
        const v = -1 + (j + 0.5) * 2 / n;
        if (u * u + v * v < (k.promien * 0.9) * (k.promien * 0.9)) k.komorki.push({ u, v, ok: false });
      }
    }
    k.pokryte = 0;
    k.maluje = false;
    k.ost = null;
    k.pedzel = 0.2;
    k.dzw = 0;
  },
  maluj(k, uv) {
    const l = Math.hypot(uv.u, uv.v);
    if (l > k.promien) {
      uv = { u: uv.u / l * k.promien, v: uv.v / l * k.promien };
    }
    stempel(k.w, k.w.g, uv.u, uv.v, k.pedzel);
    const r2 = (k.pedzel * 1.1) * (k.pedzel * 1.1);
    for (const c of k.komorki) {
      if (!c.ok && (c.u - uv.u) * (c.u - uv.u) + (c.v - uv.v) * (c.v - uv.v) < r2) {
        c.ok = true;
        k.pokryte++;
      }
    }
  },
  dotyk(k, x, y) {
    const uv = naUV(x, y);
    if (Math.hypot(uv.u, uv.v) < k.promien * 1.25) {
      k.maluje = true;
      k.ost = uv;
      MECH.smaruj.maluj(k, uv);
    }
  },
  ruch(k, x, y) {
    if (!k.maluje) return;
    const uv = naUV(x, y);
    const d = Math.hypot(uv.u - k.ost.u, uv.v - k.ost.v);
    const ile = Math.ceil(d / 0.04);
    for (let i = 1; i <= ile; i++) {
      const t = i / ile;
      MECH.smaruj.maluj(k, { u: k.ost.u + (uv.u - k.ost.u) * t, v: k.ost.v + (uv.v - k.ost.v) * t });
    }
    k.ost = uv;
    k.dzw += d;
    if (k.dzw > 0.5) {
      k.dzw = 0;
      dzwiekSmarowania();
    }
  },
  puszczenie(k) {
    k.maluje = false;
  },
  update(k, dt) {
    if (!k.gotowe && k.pokryte / k.komorki.length >= 0.8) {
      k.w.pelneCel = 1;
      k.maluje = false;
      krokGotowy();
    }
    if (k.w.pelneCel) k.w.pelne = Math.min(1, k.w.pelne + dt * 2);
  },
  rysuj(k) {
    const x = k.maluje ? wsk.x - 20 : M.dodatki.x;
    const y = k.maluje ? wsk.y - 40 : M.dodatki.y - 20;
    if (!k.maluje) cien(x, y + 50, 110);
    rysujSkladnik(k.def.skladnik, x, y, k.maluje ? 80 : 110, k.maluje ? -0.3 : 0);
  },
  podpowiedz(k) {
    if (k.maluje) return null;
    const g = geo();
    return { typ: 'maluj', x: g.cx, y: g.cy, r: g.R * k.promien * 0.7, e: g.e };
  },
};

// ---------- WAŁKOWANIE ----------
MECH.walkuj = {
  start(k) {
    k.droga = 0;
    k.potrzeba = 2000;
    k.walkuje = false;
    k.obrot = 0;
    k.dzw = 0;
    const p = pozN();
    k.walek = { x: p.x, y: p.y + 160 };
  },
  dotyk(k, x, y) {
    const p = pozN();
    if (Math.abs(x - p.x) < 240 && Math.abs(y - p.y) < 190) {
      k.walkuje = true;
      k.ost = { x, y };
      k.walek.y = ogranicz(y, p.y - 110, p.y + 110);
    }
  },
  ruch(k, x, y) {
    if (!k.walkuje) return;
    const d = Math.hypot(x - k.ost.x, y - k.ost.y);
    k.droga += Math.min(d, 90);
    k.obrot += (y - k.ost.y) * 0.05;
    k.ost = { x, y };
    const p = pozN();
    k.walek.x = p.x;
    k.walek.y = ogranicz(y, p.y - 110, p.y + 110);
    k.dzw += d;
    if (k.dzw > 140) {
      k.dzw = 0;
      dzwiekWalkowania();
      if (Math.random() < 0.6) para(p.x + losowa(-120, 120), k.walek.y + 10);
    }
  },
  puszczenie(k) {
    k.walkuje = false;
  },
  update(k) {
    const p = Math.min(1, k.droga / k.potrzeba);
    N.ciasto.r = 0.36 + (0.9 - 0.36) * p;
    if (p >= 1 && !k.gotowe) {
      k.walkuje = false;
      krokGotowy();
    }
  },
  rysuj(k) {
    rysujWalek(k.walek.x, k.walek.y, k.obrot);
  },
  podpowiedz(k) {
    if (k.walkuje) return null;
    const p = pozN();
    return { typ: 'tam', x: p.x, y: p.y, dx: 0, dy: 80 };
  },
};

// ---------- DODATKI NA PIZZĘ ----------
function naPizzy(x, y) {
  const uv = naUV(x, y);
  return Math.hypot(uv.u, uv.v) < N.ciasto.r * 0.95;
}

const MIEJSCA_DODATKOW = [[-0.4, -0.3], [0.38, -0.32], [-0.32, 0.38], [0.42, 0.3], [0, -0.55], [0.02, 0.05], [-0.6, 0.05], [0.62, 0]];

function polozDodatek(k, x0, y0, x1, y1, odRazu) {
  k.zostalo--;
  let uv = naUV(x1, y1);
  const l = Math.hypot(uv.u, uv.v);
  const max = N.ciasto.r * 0.72;
  if (l > max) uv = { u: uv.u / l * max, v: uv.v / l * max };
  const dodatek = { sk: k.def.skladnik, u: uv.u, v: uv.v, obrot: losowa(-0.5, 0.5) };
  const g = geo();
  const cx = g.cx + uv.u * g.R;
  const cy = g.cy + uv.v * g.R * g.e - 4;
  const wyladuj = () => {
    N.dodatki.push(dodatek);
    dzwiekPlop();
    iskry(cx, cy, 5);
  };
  if (odRazu) {
    wyladuj();
    return;
  }
  k.lecace++;
  rzuc(x0, y0, cx, cy, 90, 0.4, (x, y) => rysujSkladnik(dodatek.sk, x, y, 56), () => {
    k.lecace--;
    wyladuj();
  });
}

function rysujMiseczkeDodatkow(x, y, sk, ile) {
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  elipsa(x, y + 40, 80, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, 82, 50, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff7eb6';
  ctx.fillRect(x - 70, y + 18, 140, 7);
  ctx.fillStyle = '#f1f4f8';
  elipsa(x, y, 80, 24);
  ctx.fill();
  const miejsca = [[-34, -6], [0, -12], [34, -6], [-18, 4], [18, 4], [0, -2]];
  for (let i = 0; i < Math.min(ile, miejsca.length); i++) {
    rysujSkladnik(sk, x + miejsca[i][0], y + miejsca[i][1] - 10, 50, (i - 2) * 0.3);
  }
}

MECH.uloz = {
  start(k) {
    k.zostalo = k.def.ile;
    k.lecace = 0;
    k.miska = { x: M.dodatki.x, y: M.dodatki.y };
    k.trzymany = null;
  },
  dotyk(k, x, y) {
    if (k.zostalo <= 0) return;
    if (blisko(x, y, k.miska.x, k.miska.y, 100)) {
      const ob = { sk: k.def.skladnik, x: k.miska.x, y: k.miska.y - 20 };
      k.trzymany = ob;
      chwyc(ob, x, y);
      return;
    }
    if (naPizzy(x, y)) polozDodatek(k, k.miska.x, k.miska.y - 20, x, y, false);
  },
  puszczenie(k) {
    const ob = k.trzymany;
    if (!ob || chwyt !== ob) return;
    chwyt = null;
    k.trzymany = null;
    if (naPizzy(ob.x, ob.y)) {
      polozDodatek(k, ob.x, ob.y, ob.x, ob.y, true);
    } else {
      rzuc(ob.x, ob.y, k.miska.x, k.miska.y - 10, 40, 0.3, (x, y) => rysujSkladnik(ob.sk, x, y, 56), null);
    }
  },
  update(k) {
    if (k.zostalo <= 0 && k.lecace <= 0 && !k.gotowe) krokGotowy();
  },
  rysuj(k) {
    const wMisce = k.zostalo - (k.trzymany ? 1 : 0);
    rysujMiseczkeDodatkow(k.miska.x, k.miska.y, k.def.skladnik, Math.max(0, wMisce));
    if (k.trzymany) rysujSkladnik(k.trzymany.sk, k.trzymany.x, k.trzymany.y, 60);
  },
  podpowiedz(k) {
    if (chwyt || k.zostalo <= 0) return null;
    const g = geo();
    const [u, v] = MIEJSCA_DODATKOW[N.dodatki.length % MIEJSCA_DODATKOW.length];
    const r = N.ciasto.r;
    return { typ: 'stuk', x: g.cx + u * r * g.R, y: g.cy + v * r * g.R * g.e };
  },
};

// ---------- PIECZENIE ----------
MECH.piecz = {
  start(k) {
    k.faza = 'czeka';
    k.t = 0;
    k.pojaw = 0;
  },
  dotyk(k, x, y) {
    const p = pozN();
    if (k.faza === 'czeka' && Math.abs(x - p.x) < 260 && Math.abs(y - (p.y - 30)) < 210) {
      k.faza = 'piecze';
      dzwiekKlik();
      dzwiekOgnia();
      ustawNapis('Piecze się… Mmm, jak pachnie!');
      powiedz('Piecze się! Mmm, jak pachnie!');
    }
  },
  update(k, dt) {
    if (k.faza === 'koniec') k.pojaw = Math.max(0, k.pojaw - dt * 3);
    else k.pojaw = Math.min(1, k.pojaw + dt * 3);
    if (k.faza === 'piecze') {
      k.t += dt;
      N.upieczenie = Math.min(1, k.t / USTAWIENIA.czasPieczenia);
      if (Math.random() < dt * 3) para(pozN().x + losowa(-150, 150), pozN().y - 200);
      if (k.t >= USTAWIENIA.czasPieczenia) {
        k.faza = 'koniec';
        dzwiekDing();
        krokGotowy();
      }
    }
  },
  rysuj(k) {
    if (k.pojaw <= 0.01) return;
    const p = pozN();
    const s = (V.pion ? 0.8 : 0.85) * sprezyna(k.pojaw);
    rysujPiekarnik(p.x, p.y - 30, s, k.faza === 'piecze' ? 1 : 0, k.t / USTAWIENIA.czasPieczenia, () => rysujPizze(N));
  },
  podpowiedz(k) {
    if (k.faza !== 'czeka') return null;
    const p = pozN();
    return { typ: 'stuk', x: p.x, y: p.y - 10 };
  },
};

// ---------- WYCISKANIE SOKU ----------
function srodekWyciskarki() {
  const p = pozN();
  return { x: p.x, y: p.y - 45 };
}

MECH.wyciskaj = {
  start(k) {
    k.kat = 0;
    k.potrzeba = k.def.ile * Math.PI * 2;
    k.krece = false;
    k.naJedna = k.potrzeba / Math.max(1, N.polowki);
    k.zrobione = 0;
    k.dzw = 0;
    N.wycisk = { obrot: 0, scisk: 0 };
    N.kolor = SKLADNIKI.pomarancza.kolor;
  },
  dotyk(k, x, y) {
    const c = srodekWyciskarki();
    if (Math.abs(x - c.x) < 180 && Math.abs(y - c.y) < 140) {
      k.krece = true;
      k.ost = Math.atan2((y - c.y) / 0.45, x - c.x);
    }
  },
  ruch(k, x, y) {
    if (!k.krece || k.gotowe || N.polowki <= 0) return;
    const c = srodekWyciskarki();
    const a = Math.atan2((y - c.y) / 0.45, x - c.x);
    const d = roznicaKata(a, k.ost);
    k.ost = a;
    k.kat += Math.abs(d);
    N.wycisk.obrot += d;
    N.plyn = Math.min(0.85, N.plyn + Math.abs(d) / k.potrzeba * 0.85);
    k.dzw += Math.abs(d);
    if (k.dzw > 0.9) {
      k.dzw = 0;
      dzwiekWyciskania();
      const p = pozN();
      dodajEfekt({ typ: 'kropla', x: p.x + losowa(-14, 14), y: p.y + 6, vx: 0, vy: 40, g: 1200, zycie: 2, doY: p.y + glebokoscPowierzchni(N), r: 6, kolor: N.kolor });
    }
    const wTej = k.kat - k.zrobione * k.naJedna;
    N.wycisk.scisk = Math.min(1, wTej / k.naJedna);
    if (wTej >= k.naJedna) {
      // ta połówka już wyciśnięta – odlatuje, następna wskakuje na wyciskarkę
      k.zrobione++;
      N.polowki--;
      N.wycisk.scisk = 0;
      dodajEfekt({ typ: 'polowka', x: c.x, y: c.y - 20, vx: losowa(200, 300) * (Math.random() < 0.5 ? -1 : 1), vy: -320, g: 1300, zycie: 1, wir: 8 });
      dzwiekHop();
      if (N.polowki <= 0) {
        k.krece = false;
        N.zdejmij = true;
        krokGotowy();
      }
    }
  },
  puszczenie(k) {
    k.krece = false;
  },
  podpowiedz(k) {
    if (k.krece) return null;
    const c = srodekWyciskarki();
    return { typ: 'kolo', x: c.x, y: c.y - 10, r: 60, e: 0.45 };
  },
};


// ---------- WYBÓR (np. czym posmarować naleśnika) ----------
function miejscaOpcji(ile) {
  const m = V.pion ? { x: 400, y: M.deska.y } : { x: M.deska.x, y: M.deska.y };
  const odst = V.pion ? 220 : 172;
  return Array.from({ length: ile }, (_, i) => ({ x: m.x + (i - (ile - 1) / 2) * odst, y: m.y }));
}

function wybierzOpcje(k, opcja) {
  dzwiekKlik();
  const pozostale = k.def.opcje.filter((o) => o !== opcja);
  const nowe = [JSON.parse(JSON.stringify(opcja.krok))];
  // potem można wybrać jeszcze coś (albo skończyć)
  if (pozostale.length) nowe.push({ ...k.def, opcje: pozostale, mozeSkonczyc: true, tekst: k.def.tekstPotem || k.def.tekst });
  przepis.kroki.splice(nrKroku, 1, ...nowe);
  przepis.wybrane = (przepis.wybrane || []).concat(opcja.skladnik);
  zacznijKrok(false);
}

function skonczWybieranie() {
  if (K.gotowe) return;
  dzwiekKlik();
  przepis.kroki.splice(nrKroku, 1);   // ten krok znika z paska
  nrKroku--;
  krokGotowy();
}

MECH.wybierz = {
  start(k) {
    const m = miejscaOpcji(k.def.opcje.length);
    k.opcje = k.def.opcje.map((o, i) => ({ o, x: m[i].x, y: m[i].y, pojaw: -i * 0.12 }));
  },
  dotyk(k, x, y) {
    for (const r of k.opcje) {
      if (blisko(x, y, r.x, r.y, 75)) {
        wybierzOpcje(k, r.o);
        return;
      }
    }
  },
  update(k, dt) {
    for (const r of k.opcje) r.pojaw = Math.min(1, r.pojaw + dt * 3);
  },
  rysuj(k) {
    for (const r of k.opcje) {
      const wiel = 120 * sprezyna(Math.max(0, r.pojaw));
      if (wiel <= 1) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      kolo(r.x, r.y, 74 * sprezyna(Math.max(0, r.pojaw)));
      ctx.fill();
      rysujSkladnik(r.o.skladnik, r.x, r.y - 6 + Math.sin(czas * 3 + r.x) * 3, wiel * 0.85);
      napis(SKLADNIKI[r.o.skladnik].nazwa, r.x, r.y + 86, dopasujRozmiarNapisu(SKLADNIKI[r.o.skladnik].nazwa, 160, 20), '#8a4b1c', 'center', '#ffffff');
    }
    if (k.def.mozeSkonczyc && !k.gotowe) {
      const b = M.gotowe;
      rysujPrzyciskTekst(b.x, b.y, 210, 76, 'Gotowe ✓', '#3ddc97', 32, czyWcisniety('gotowe'));
      dodajPrzycisk('gotowe', b.x, b.y, 210, 80, skonczWybieranie);
    }
  },
  podpowiedz(k) {
    if (k.def.mozeSkonczyc) return { typ: 'stuk', x: M.gotowe.x, y: M.gotowe.y };
    const r = k.opcje[0];
    return { typ: 'stuk', x: r.x, y: r.y };
  },
};

// ---------- LODY: nakładanie gałek ----------
function pozycjaGalki(i) {
  const p = pozN();
  return { x: p.x, y: p.y + pozycjaGalkiLok(i) };
}

function zapiszLody() {
  przepis.galki = N.galki.map((g) => g.kolor);
  przepis.smaki = N.galki.map((g) => g.smak);
  przepis.posypki = N.posypki;
  przepis.sos = N.sos;
  przepis.wisienka = N.wisienka;
  przepis.wafelek = N.wafelek;
  przepis.dodatkiLodow = N.dodatki;
}

function zakonczGalki(k) {
  if (k.gotowe || k.lecace > 0 || !N.galki.length) return;
  zapiszLody();
  krokGotowy();
}

MECH.galki = {
  start(k) {
    k.lecace = 0;
    k.pudelka = SMAKI_LODOW.map((smak, i) => ({ smak, x: M.pudelka[i].x, y: M.pudelka[i].y, pojaw: -i * 0.08, chwiej: 0 }));
  },
  dotyk(k, x, y) {
    if (N.galki.length + k.lecace >= k.def.ile) return;
    for (const p of k.pudelka) {
      if (Math.abs(x - p.x) < 70 && Math.abs(y - p.y) < 62) {
        // łyżka nabiera gałkę i gałka leci na rożek
        p.chwiej = 0.4;
        k.lecace++;
        dzwiekNakladania();
        powiedz(p.smak.nazwa);
        const cel = pozycjaGalki(N.galki.length + k.lecace - 1);
        const smak = p.smak;
        rzuc(p.x, p.y - 30, cel.x, cel.y, 140, 0.5, (lx, ly) => {
          ctx.fillStyle = smak.kolor;
          kolo(lx, ly, 34);
          ctx.fill();
        }, () => {
          k.lecace--;
          N.galki.push({ kolor: smak.kolor, smak: smak.id, pojaw: 0 });
          dzwiekPlop();
          iskry(cel.x, cel.y, 6);
        });
        return;
      }
    }
  },
  update(k, dt) {
    for (const p of k.pudelka) {
      p.pojaw = Math.min(1, p.pojaw + dt * 4);
      p.chwiej = Math.max(0, p.chwiej - dt);
    }
    for (const g of N.galki) g.pojaw = Math.min(1, g.pojaw + dt * 4);
    if (N.galki.length >= k.def.ile) zakonczGalki(k);
  },
  rysuj(k) {
    for (const p of k.pudelka) {
      const s = sprezyna(Math.max(0, p.pojaw));
      if (s <= 0.01) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.chwiej * 40) * 0.1 * p.chwiej);
      rysujPudelkoLodow(0, 0, p.smak, s);
      ctx.restore();
    }
    if (N.galki.length && !k.gotowe) {
      const b = M.gotowe;
      rysujPrzyciskTekst(b.x, b.y, 210, 76, 'Gotowe ✓', '#3ddc97', 32, czyWcisniety('gotowe'));
      dodajPrzycisk('gotowe', b.x, b.y, 210, 80, () => zakonczGalki(k));
    }
  },
  podpowiedz(k) {
    const p = k.pudelka[(N.galki.length * 2 + 1) % k.pudelka.length];
    return { typ: 'stuk', x: p.x, y: p.y };
  },
};

// ---------- LODY: dekorowanie ----------
const KOLORY_POSYPKI = ['#ff5a5f', '#ffd23f', '#3ddc97', '#4cc9f0', '#c77dff', '#ffffff'];

function udekoruj(k, r) {
  r.chwiej = 0.4;
  k.ile++;
  const n = N.galki.length;
  const gora = pozycjaGalki(n - 1);
  const sk = r.sk;
  powiedz(SKLADNIKI[sk].nazwa);
  if (sk === 'posypka' || sk === 'posypkaCzek') {
    for (let i = 0; i < 22; i++) {
      // najwięcej posypki na górnej gałce
      const ktora = Math.max(0, n - 1 - Math.floor(Math.random() * Math.random() * n));
      N.posypki.push({
        i: ktora, a: Math.random() * Math.PI * 2, d: Math.sqrt(Math.random()) * 0.85, obrot: Math.random() * Math.PI,
        kolor: sk === 'posypka' ? KOLORY_POSYPKI[i % KOLORY_POSYPKI.length] : ['#4a2a18', '#6b3d22'][i % 2],
      });
    }
    for (let i = 0; i < 3; i++) setTimeout(dzwiekSypania, i * 90);
    for (let i = 0; i < 14; i++) {
      dodajEfekt({ typ: 'ziarno', x: gora.x + losowa(-50, 50), y: gora.y - 140, vx: 0, vy: losowa(100, 200), g: 900, zycie: 1, doY: gora.y - 20, kolor: sk === 'posypka' ? KOLORY_POSYPKI[i % 6] : '#4a2a18', r: 3 });
    }
  } else if (sk === 'sosCzek' || sk === 'sosTrusk') {
    N.sos = SKLADNIKI[sk].kolor;
    dzwiekLania();
    setTimeout(dzwiekLania, 120);
    krople(gora.x, gora.y - 50, N.sos, 6, 0.4, gora.y);
  } else if (sk === 'wisienka' || sk === 'wafelek') {
    if (N[sk]) {
      dzwiekNieTo();
      return;
    }
    rzuc(r.x, r.y, gora.x, gora.y - 70, 120, 0.45, (x, y) => rysujSkladnik(sk, x, y, 60), () => {
      N[sk] = true;
      dzwiekPlop();
      iskry(gora.x, gora.y - 70, 8);
    });
  }
}

function zakonczDekorowanie(k) {
  if (k.gotowe) return;
  zapiszLody();
  krokGotowy();
}

MECH.dekoruj = {
  start(k) {
    k.ile = 0;
    k.rzeczy = DEKORACJE_LODOW.map((sk, i) => ({ sk, x: M.pudelka[i].x, y: M.pudelka[i].y, pojaw: -i * 0.08, chwiej: 0 }));
  },
  dotyk(k, x, y) {
    for (const r of k.rzeczy) {
      if (blisko(x, y, r.x, r.y, 66)) {
        udekoruj(k, r);
        return;
      }
    }
  },
  update(k, dt) {
    for (const r of k.rzeczy) {
      r.pojaw = Math.min(1, r.pojaw + dt * 4);
      r.chwiej = Math.max(0, r.chwiej - dt);
    }
  },
  rysuj(k) {
    for (const r of k.rzeczy) {
      const wiel = 100 * sprezyna(Math.max(0, r.pojaw));
      if (wiel <= 1) continue;
      cien(r.x, r.y + 46, 100);
      rysujSkladnik(r.sk, r.x, r.y, wiel, Math.sin(r.chwiej * 40) * 0.2 * r.chwiej);
    }
    if (k.ile && !k.gotowe) {
      const b = M.gotowe;
      rysujPrzyciskTekst(b.x, b.y, 210, 76, 'Gotowe ✓', '#3ddc97', 32, czyWcisniety('gotowe'));
      dodajPrzycisk('gotowe', b.x, b.y, 210, 80, () => zakonczDekorowanie(k));
    }
  },
  podpowiedz(k) {
    if (k.ile >= 3) return { typ: 'stuk', x: M.gotowe.x, y: M.gotowe.y };
    const r = k.rzeczy[k.ile % k.rzeczy.length];
    return { typ: 'stuk', x: r.x, y: r.y };
  },
};


// ---------- MOJA POTRAWA: wrzucasz, co chcesz ----------
function nadCelemDowolnego(x, y) {
  if (N.typ === 'rozek') {
    const p = pozN();
    return Math.abs(x - p.x) < 120 && y > p.y - 320 && y < p.y + 180;
  }
  if (N.ciasto) return naPizzy(x, y) || nadNaczyniem(x, y);
  return nadNaczyniem(x, y);
}

function dodajDowolny(sk, x, y) {
  const d = SKLADNIKI[sk];
  if (N.typ === 'rozek') {
    // na lodach: przyklejamy do gałki (najczęściej do górnej)
    const n = N.galki.length;
    const ktora = Math.max(0, n - 1 - Math.floor(Math.random() * Math.random() * n));
    N.dodatki.push({ sk, i: ktora, a: losowa(-Math.PI, 0), d: losowa(0.2, 0.7), obrot: losowa(-0.5, 0.5) });
    dzwiekPlop();
    const g = pozycjaGalki(ktora);
    iskry(g.x, g.y, 5);
  } else if (N.ciasto || N.typ === 'patelnia') {
    // na pizzy, spaghetti i naleśniku składnik leży tam, gdzie go puścisz
    let uv = naUV(x, y);
    const r = (N.ciasto ? N.ciasto.r : N.nalesnik.r) * 0.7;
    const l = Math.hypot(uv.u, uv.v);
    if (l > r) uv = { u: uv.u / l * r, v: uv.v / l * r };
    N.dodatki.push({ sk, u: uv.u, v: uv.v, obrot: losowa(-0.5, 0.5) });
    dzwiekPlop();
    const g = geo();
    iskry(g.cx + uv.u * g.R, g.cy + uv.v * g.R * g.e, 5);
  } else if (N.typ === 'dzbanek') {
    // w dzbanku owoce zamieniają się w sok i go zabarwiają
    N.kolor = N.plyn < 0.02 || !N.kolor ? d.kolor : mieszajKolory(N.kolor, d.kolor, 0.4);
    N.plyn = Math.min(0.85, N.plyn + 0.14);
    if (sk === 'lod' || d.niejadalne) N.kawalki.push(nowyKawalek(sk, -1, 1));   // to pływa w soku
    chlupnij();
  } else if (d.niejadalne) {
    dodajCalosc(sk);   // skarpetki nie kroimy :)
  } else {
    wrzucPlasterki(sk, 2);
  }
}

function sredniKolor(lista) {
  const suma = [0, 0, 0];
  for (const sk of lista) hexNaRgb(SKLADNIKI[sk].kolor).forEach((v, i) => (suma[i] += v));
  return '#' + suma.map((v) => Math.round(v / lista.length).toString(16).padStart(2, '0')).join('');
}

// Czy składniki pasują do siebie? Zwraca null (pasują) albo zdanie, co jest dziwne.
function ocenSmak(p, lista) {
  const nazwa = (sk) => SKLADNIKI[sk].nazwa;
  const smieszne = lista.filter((sk) => SKLADNIKI[sk].niejadalne);
  if (smieszne.length) return `${nazwa(smieszne[0])} ${p.gdzie}? Fuuu!`;
  const zimne = lista.filter((sk) => SMAKI[sk] === 'zimny');
  if (zimne.length && p.typ !== 'sok' && p.typ !== 'lody') return `${nazwa(zimne[0])} ${p.gdzie}? Brrr, dziwne!`;
  const slodkie = lista.filter((sk) => SMAKI[sk] === 'slodki');
  let slone = lista.filter((sk) => SMAKI[sk] === 'slony');
  if (p.typ === 'sok') slone = slone.filter((sk) => !DO_SOKU_TEZ.includes(sk));
  if (p.smak === 'slony' && slodkie.length) return `${nazwa(slodkie[0])} ${p.gdzie}? Dziwne!`;
  if (p.smak === 'slodki' && slone.length) return `${nazwa(slone[0])} ${p.gdzie}? Dziwne!`;
  if (slodkie.length && slone.length) return `${nazwa(slodkie[0])} i ${nazwa(slone[0]).toLowerCase()}? Dziwne połączenie!`;
  return null;
}

function zakonczDowolne(k) {
  if (k.gotowe || !k.dodane.length) return;
  dzwiekKlik();
  przepis.wPorcji = [...new Set(k.dodane)].slice(0, 5);
  if (przepis.typ === 'zupa') przepis.kolor = mieszajKolory(sredniKolor(k.dodane), '#e8c170', 0.35);
  if (przepis.typ === 'sok' && N.kolor) przepis.kolor = N.kolor;
  przepis.dziwne = ocenSmak(przepis, k.dodane);
  // co mówią przyjaciele, kiedy zjedzą skarpetkę albo but
  przepis.fujTeksty = [].concat(...k.dodane.map((sk) => SKLADNIKI[sk].fuj || []));
  if (N.typ === 'rozek') zapiszLody();
  krokGotowy();
}

function otworzZakladke(k, nr) {
  k.zakladka = nr;
  k.rzeczy = ZAKLADKI_SPIZARNI[nr].skladniki.map((sk, i) => ({ sk, x: M.spizarnia[i].x, y: M.spizarnia[i].y, pojaw: -i * 0.04 }));
}

MECH.dowolne = {
  start(k) {
    k.dodane = [];
    k.trzymany = null;
    otworzZakladke(k, 0);
  },
  dotyk(k, x, y) {
    for (let i = 0; i < M.zakladki.length; i++) {
      const z = M.zakladki[i];
      if (blisko(x, y, z.x, z.y, 46)) {
        if (k.zakladka !== i) {
          dzwiekKlik();
          otworzZakladke(k, i);
          powiedz(ZAKLADKI_SPIZARNI[i].nazwa);
        }
        return;
      }
    }
    for (const r of k.rzeczy) {
      if (blisko(x, y, r.x, r.y, 44)) {
        // bierzemy z półki kopię – w spiżarni zawsze czegoś jest pod dostatkiem
        const ob = { sk: r.sk, x: r.x, y: r.y, domX: r.x, domY: r.y };
        k.trzymany = ob;
        chwyc(ob, x, y);
        return;
      }
    }
  },
  puszczenie(k) {
    const ob = k.trzymany;
    if (!ob || chwyt !== ob) return;
    chwyt = null;
    k.trzymany = null;
    const wroc = () => rzuc(ob.x, ob.y, ob.domX, ob.domY, 40, 0.3, (x, y) => rysujSkladnik(ob.sk, x, y, 62), null);
    if (!nadCelemDowolnego(ob.x, ob.y)) {
      wroc();
      return;
    }
    const d = SKLADNIKI[ob.sk];
    if (k.dodane.length >= NAJWIECEJ_SKLADNIKOW) {
      wroc();
      powiedz('Już pełno! Stuknij: Gotowe!');
      return;
    }
    dodajDowolny(ob.sk, ob.x, ob.y);
    k.dodane.push(ob.sk);
    powiedz(d.niejadalne ? `Ha ha! ${d.nazwa}!` : d.nazwa);
  },
  update(k, dt) {
    for (const r of k.rzeczy) r.pojaw = Math.min(1, r.pojaw + dt * 4);
  },
  rysuj(k) {
    // tacka pod spiżarnią
    const xs = M.spizarnia.map((m) => m.x);
    const ys = M.spizarnia.map((m) => m.y);
    const x0 = Math.min(...xs) - 50;
    const y0 = Math.min(...ys) - 48;
    const x1 = Math.max(...xs) + 50;
    const y1 = Math.max(...ys) + 46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    zaokraglony(x0, y0, x1 - x0, y1 - y0, 26);
    ctx.fill();
    // zakładki: warzywa, owoce, inne, śmieszne rzeczy
    M.zakladki.forEach((z, i) => {
      const wybrana = k.zakladka === i;
      ctx.fillStyle = wybrana ? '#ffd23f' : 'rgba(255,255,255,0.85)';
      kolo(z.x, z.y, wybrana ? 40 : 34);
      ctx.fill();
      ctx.strokeStyle = wybrana ? '#f4a300' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 4;
      ctx.stroke();
      rysujEmotke(ZAKLADKI_SPIZARNI[i].ikona, z.x, z.y, wybrana ? 46 : 38);
    });
    for (const r of k.rzeczy) {
      const wiel = 62 * sprezyna(Math.max(0, r.pojaw));
      if (wiel <= 1) continue;
      cien(r.x, r.y + 30, 64);
      rysujSkladnik(r.sk, r.x, r.y, wiel);
    }
    if (k.trzymany) rysujSkladnik(k.trzymany.sk, k.trzymany.x, k.trzymany.y, 76);
    if (k.dodane.length && !k.gotowe) {
      const b = M.gotowe;
      const puls = k.dodane.length >= 3 ? 1 + Math.sin(czas * 5) * 0.04 : 1;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(puls, puls);
      rysujPrzyciskTekst(0, 0, 210, 76, 'Gotowe ✓', '#3ddc97', 32, czyWcisniety('gotowe'));
      ctx.restore();
      dodajPrzycisk('gotowe', b.x, b.y, 210, 80, () => zakonczDowolne(k));
    }
  },
  podpowiedz(k) {
    if (chwyt) return null;
    if (k.dodane.length >= 3) return { typ: 'stuk', x: M.gotowe.x, y: M.gotowe.y };
    if (k.dodane.length === 0) {
      const r = k.rzeczy[0];
      const c = celUpuszczenia();
      return { typ: 'ciagnij', x: r.x, y: r.y, x2: c.x, y2: c.y };
    }
    return null;
  },
};


// =====================================================
//   PRZEBIEG GOTOWANIA
// =====================================================
function pokazKsiazke() {
  ekran = 'ksiazka';
  zaslona = 1;
  K = null;
  chwyt = null;
  babelki = [];
  lecace = [];
  efekty = [];
  ucisz();
}

// Wszystkie składniki przepisu (razem z tymi do wyboru)
function skladnikiPrzepisu(p) {
  const lista = [];
  const dodaj = (sk) => {
    if (sk && !lista.includes(sk)) lista.push(sk);
  };
  for (const k of p.kroki) {
    dodaj(k.skladnik);
    for (const o of k.opcje || []) dodaj(o.skladnik);
  }
  return lista;
}

function wybierzPrzepis(p) {
  // kopia, bo w czasie gotowania przepis się zmienia (np. wybrane dodatki do naleśnika)
  przepis = JSON.parse(JSON.stringify(p));
  ekran = 'wstep';
  zaslona = 1;
  bezczynnosc = 0;
  const nazwy = skladnikiPrzepisu(p).map((sk) => SKLADNIKI[sk].nazwa.toLowerCase());
  powiedz(nazwy.length ? `${p.nazwa}! Potrzebujemy: ${nazwy.join(', ')}. Gotujemy?` : `${p.nazwa}! Robimy?`);
}

function pokazWybor(rodzaj = 'wlasna') {
  rodzajWyboru = rodzaj;
  ekran = 'wybor';
  zaslona = 1;
  K = null;
  chwyt = null;
  babelki = [];
  lecace = [];
  efekty = [];
  bezczynnosc = 0;
  powiedz(rodzaj === 'zupy' ? 'Jaką zupę ugotujemy? Wybierz!' : 'Co chcesz ugotować? Wybierz!');
}

function wybierzWlasna(w) {
  // kopia, żeby kolor i składniki tej potrawy nie zostały na następny raz
  przepis = JSON.parse(JSON.stringify(w));
  przepis.id = 'wlasna';
  przepis.wlasny = true;
  zacznijGotowanie();
}

function zacznijGotowanie() {
  ekran = 'gotowanie';
  zaslona = 1;
  ulozMiejsca();   // własna potrawa ma trochę inny układ (spiżarnia)
  N = noweNaczynie(przepis.naczynie);
  nrKroku = 0;
  efekty = [];
  babelki = [];
  lecace = [];
  zacznijKrok(false);
}

function zacznijKrok(zPochwala) {
  const def = przepis.kroki[nrKroku];
  if (def.naczynie && def.naczynie !== N.typ) {
    // nowe naczynie (np. patelnia do naleśników) pojawia się jak za dotknięciem różdżki
    N = noweNaczynie(def.naczynie);
    dzwiekMagii();
  }
  K = { def, gotowe: false, poGotowym: 0 };
  MECH[def.co].start(K);
  bezczynnosc = 0;
  ustawNapis(def.tekst);
  powiedz((zPochwala ? pochwala() + ' ' : '') + def.tekst);
}

// Czasem ktoś z przyjaciół zagląda przez okno, bo ładnie pachnie
function zaprosPodgladacza() {
  if (podgladacz) return;
  const p = PRZYJACIELE[Math.floor(Math.random() * PRZYJACIELE.length)];
  podgladacz = { z: { ...p, i: 0, oczy: 'w', buzia: 0, jezyk: p.typ === 'piesek', t: 0, skok: 0, przechyl: 0 }, t: 0 };
}

function wysuniecieZaOkna() {
  const t = podgladacz.t;
  if (t < 0.5) return sprezyna(t / 0.5);
  if (t > 3) return Math.max(0, 1 - (t - 3) / 0.5);
  return 1;
}

function aktualizujPodgladacza(dt) {
  if (!podgladacz) return;
  podgladacz.t += dt;
  const z = podgladacz.z;
  z.t += dt;
  z.przechyl = Math.sin(z.t * 3) * 0.12;
  if (podgladacz.t > 3.5) podgladacz = null;
}

function rysujPodgladacza() {
  if (!podgladacz) return;
  const o = M.okno;
  const s = o.w / 260;
  const w = wysuniecieZaOkna();
  const x = o.x + o.w / 2;
  const baza = o.y + o.h + 40 * s + (1 - w) * 160 * s;
  ctx.save();
  zaokraglony(o.x, o.y, o.w, o.h, 8);
  ctx.clip();
  rysujZwierzaka(podgladacz.z, x, baza, s);
  ctx.restore();
  if (w > 0.7) rysujLapki(podgladacz.z, x, o.y + o.h + 4, s);
}

function dotykOkna(x, y) {
  const o = M.okno;
  if (!podgladacz || x < o.x || x > o.x + o.w || y < o.y || y > o.y + o.h + 30) return false;
  podgladacz.t = Math.min(podgladacz.t, 0.6);
  podgladacz.z.skok = 0;
  dzwiekZwierzaka(podgladacz.z.typ);
  serduszka(o.x + o.w / 2, o.y + 20, 3);
  return true;
}

function krokGotowy() {
  if (!K || K.gotowe) return;
  if (['gotuj', 'piecz', 'smaz'].includes(K.def.co) || Math.random() < 0.3) zaprosPodgladacza();
  K.gotowe = true;
  K.poGotowym = 0;
  chwyt = null;
  dzwiekBrawo();
  const g = geo();
  iskry(g.cx, g.cy - 40, 16);
}

function nastepnyKrok() {
  nrKroku++;
  if (nrKroku >= przepis.kroki.length) zacznijStol();
  else zacznijKrok(true);
}


// =====================================================
//   STÓŁ – częstujemy przyjaciół
// =====================================================
function noweZwierzaki() {
  return PRZYJACIELE.map((p, i) => ({
    ...p, i, stan: 'czeka', t: Math.random() * 5, t2: 0, porcja: 0,
    oczy: 'o', buzia: 0, jezyk: false, skok: 0, przechyl: 0, mrug: losowa(1, 4), merdanie: false,
  }));
}

// Wszystko, co jest w potrawie (żeby przyjaciele wiedzieli, czy jest tam ich ulubione)
function coJestWPotrawie() {
  return new Set([...skladnikiPrzepisu(przepis), ...(przepis.wybrane || []), ...(przepis.wPorcji || []), ...(przepis.smaki || [])]);
}

function zacznijStol() {
  ekran = 'stol';
  zaslona = 1;
  K = null;
  chwyt = null;
  babelki = [];
  lecace = [];
  brawoOd = 0;
  N.ogien = 0;
  N.pojaw = 1;
  N.naStole = true;
  zwierzaki = noweZwierzaki();
  const wPotrawie = coJestWPotrawie();
  for (const z of zwierzaki) z.ulubiony = (z.ulubione || []).find((sk) => wPotrawie.has(sk)) || null;
  ustawNapis('Poczęstuj przyjaciół! Stuknij w talerzyk');
  powiedz(`${pochwala()} Gotowe! Teraz poczęstuj przyjaciół. Stuknij w talerzyk!`);
  bezczynnosc = 0;
}

function mrugaj(z, dt) {
  z.mrug -= dt;
  if (z.mrug < 0) {
    z.oczy = 'z';
    if (z.mrug < -0.13) {
      z.mrug = losowa(2, 5);
      z.oczy = 'o';
    }
  } else {
    z.oczy = 'o';
  }
}

function podaj(z) {
  z.stan = 'podane';
  dzwiekPodania();
  const d = M.danie;
  rzuc(d.x, d.y - 60, M.zwX[z.i], M.porcjaY, 170, 0.6,
    (x, y, p) => rysujPorcje(przepis, x, y, M.porcjaS * (0.6 + 0.4 * p), 1),
    () => {
      z.porcja = 1;
      z.stan = 'je';
      z.t2 = 0;
      z.mniam = 0;
      dzwiekPlop();
    });
}

function dotykStol(x, y) {
  for (const z of zwierzaki) {
    const zx = M.zwX[z.i];
    const naTalerzu = blisko(x, y, zx, M.porcjaY - 40 * M.porcjaS, 90 * M.porcjaS + 20);
    const naGlowie = blisko(x, y, zx, M.zwY - 112 * M.zwS, 85 * M.zwS + 10);
    if (!naTalerzu && !naGlowie) continue;
    if (z.stan === 'czeka') {
      podaj(z);
    } else if (z.stan === 'skrzywiony') {
      z.t3 = 0;
      dzwiekFuj();
    } else if (z.stan === 'zadowolony') {
      // pogłaskany przyjaciel cieszy się jeszcze raz
      z.t3 = 0;
      dzwiekZwierzaka(z.typ);
      serduszka(zx, M.zwY - 200 * M.zwS, 2);
    }
    return;
  }
}

function aktualizujZwierzaki(dt) {
  for (const z of zwierzaki) {
    z.t += dt;
    const zx = M.zwX[z.i];
    if (z.stan === 'czeka' || z.stan === 'podane') {
      mrugaj(z, dt);
      z.jezyk = Math.sin(z.t * 1.3 + z.i * 1.7) > 0.88;
      z.przechyl = Math.sin(z.t * 1.5 + z.i) * 0.06;
      z.skok = 0;
    } else if (z.stan === 'je' && przepis.dziwne && z.t2 > 0.8) {
      // fuj! coś tu nie pasuje – zwierzak się krzywi i nie dojada
      z.t2 += dt;
      if (!z.fuj) {
        z.fuj = true;
        dzwiekFuj();
        dodajEfekt({ typ: 'napis', tekst: 'bleee!', x: zx, y: M.zwY - 230 * M.zwS, vy: -40, zycie: 1.2, rozmiar: 26, kolor: '#4caf50' });
      }
      z.oczy = 'k';
      z.buzia = 0;
      z.jezyk = false;
      z.drzenie = Math.sin(z.t2 * 45) * 5 * Math.max(0, 1 - (z.t2 - 0.8) / 1.6);
      z.przechyl = Math.sin(z.t2 * 7) * 0.12;
      if (z.t2 >= 2.4) {
        z.stan = 'skrzywiony';
        z.t3 = 0;
        z.drzenie = 0;
        const teksty = przepis.fujTeksty && przepis.fujTeksty.length ? przepis.fujTeksty : FUJ;
        const slowo = teksty[Math.floor(Math.random() * teksty.length)];
        if (przepis.fujTeksty && przepis.fujTeksty.length) z.dymek = { tekst: slowo, t: 0 };
        setTimeout(() => powiedz(slowo, z.glos, 1.05), 300);
      }
    } else if (z.stan === 'je') {
      z.t2 += dt;
      z.oczy = 'w';
      z.jezyk = false;
      z.buzia = 0.5 + 0.5 * Math.sin(z.t2 * 10);
      z.porcja = Math.max(przepis.dziwne ? 0.65 : 0, 1 - z.t2 / 2.4);
      z.przechyl = Math.sin(z.t2 * 5) * 0.05;
      z.mniam -= dt;
      if (z.mniam <= 0) {
        z.mniam = 0.5;
        dzwiekMniam();
        dodajEfekt({ typ: 'napis', tekst: 'mniam!', x: zx + losowa(-30, 30), y: M.zwY - 220 * M.zwS, vy: -50, zycie: 0.9, rozmiar: 24, kolor: '#ff7b54' });
      }
      if (przepis.id === 'lody') {
        // lody się liże
        z.buzia = 0;
        z.jezyk = Math.sin(z.t2 * 9) > -0.2;
        z.przechyl = Math.sin(z.t2 * 4.5) * 0.12;
      }
      if (z.t2 >= 2.4) {
        z.stan = 'zadowolony';
        z.t3 = 0;
        z.buzia = 0;
        dzwiekZwierzaka(z.typ);
        // ulubione jedzenie = wielka radość
        const slowa = z.ulubiony ? 'Moje ulubione!' : z.mowi;
        setTimeout(() => powiedz(slowa, z.glos, 1.05), 600);
        serduszka(zx, M.zwY - 200 * M.zwS, z.ulubiony ? 9 : 4);
        if (z.ulubiony) dodajEfekt({ typ: 'napis', tekst: 'ulubione!', x: zx, y: M.zwY - 250 * M.zwS, vy: -40, zycie: 1.6, rozmiar: 26, kolor: '#ff5a7a' });
      }
    } else if (z.stan === 'zadowolony') {
      z.t3 += dt;
      z.oczy = 'w';
      z.jezyk = z.typ === 'piesek';
      z.merdanie = true;
      // z ulubionym jedzeniem skacze dwa razy wyżej i dłużej
      const skoki = z.ulubiony ? 1.8 : 0.6;
      z.skok = z.t3 < skoki ? Math.abs(Math.sin(z.t3 / 0.6 * Math.PI)) * (z.ulubiony ? 60 : 40) : 0;
      z.przechyl = Math.sin(z.t * 3) * 0.08;
      if (Math.random() < dt * 0.4) serduszka(zx, M.zwY - 200 * M.zwS, 1);
    } else if (z.stan === 'skrzywiony') {
      // kręci głową: nie, nie, to mi nie smakuje
      z.t3 += dt;
      if (z.dymek) {
        z.dymek.t += dt;
        if (z.dymek.t > 3.5) z.dymek = null;
      }
      z.fuj = true;
      z.oczy = z.t3 < 1.2 ? 'k' : 'o';
      z.drzenie = z.t3 < 0.5 ? Math.sin(z.t3 * 45) * 5 : 0;
      z.przechyl = Math.sin(z.t * 2.2) * 0.1;
      z.skok = 0;
    }
  }
  for (const z of zwierzaki) poGlaskaniu(z, dt);
  // wszyscy najedzeni?
  if (ekran === 'stol' && zwierzaki.every((z) => z.stan === 'zadowolony' || z.stan === 'skrzywiony')) {
    if (!brawoOd) brawoOd = czas;
    if (czas - brawoOd > 1.6) pokazBrawo();
  }
  // na ekranie „brawo” wszyscy podskakują po kolei
  if (ekran === 'brawo' && !przepis.dziwne) {
    for (const z of zwierzaki) {
      const f = ((brawoT * 0.9 + z.i * 0.18) % 1.4);
      z.skok = f < 0.5 ? Math.sin(f / 0.5 * Math.PI) * 50 : 0;
    }
  }
}

function pokazBrawo() {
  ekran = 'brawo';
  brawoT = 0;
  if (przepis.dziwne) {
    dzwiekSmutnejTraby();
    powiedz(`Ojej! ${przepis.dziwne} Spróbuj jeszcze raz!`);
    return;
  }
  ugotowane[przepis.id] = (ugotowane[przepis.id] || 0) + 1;
  zapiszUgotowane();
  dzwiekFanfary();
  konfetti(90);
  powiedz('Brawo! Wszyscy najedzeni! Dziękujemy, kucharzu!');
}


// =====================================================
//   PRZYCISKI
// =====================================================
function dodajPrzycisk(id, x, y, w, h, akcja) {
  przyciski.push({ id, x: x - w / 2, y: y - h / 2, w, h, akcja });
}

function przyciskW(x, y) {
  for (let i = przyciski.length - 1; i >= 0; i--) {
    const b = przyciski[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

function czyWcisniety(id) {
  return wcisnietyPrzycisk && wcisnietyPrzycisk.id === id && wsk.wcisniety;
}

function wroc() {
  if (ekran === 'ksiazka') window.location.href = '../index.html';
  else pokazKsiazke();
}

function przelaczDzwiek() {
  wyciszone = !wyciszone;
  if (wyciszone) ucisz();
}

function rysujGornePrzyciski() {
  rysujPrzyciskOkragly(52, 52, 38, ekran === 'ksiazka' ? '🏠' : '📖', '#ffffff', czyWcisniety('wroc'));
  dodajPrzycisk('wroc', 52, 52, 90, 90, wroc);
  rysujPrzyciskOkragly(V.w - 52, 52, 38, wyciszone ? '🔇' : '🔊', '#ffffff', czyWcisniety('dzwiek'));
  dodajPrzycisk('dzwiek', V.w - 52, 52, 90, 90, przelaczDzwiek);
}


// =====================================================
//   EKRANY
// =====================================================
// ---------- Książka kucharska ----------
// Karty w rzędach: na leżąco 1 albo 2 rzędy, na stojąco 2 albo 3 kolumny
function ukladKart(lista) {
  const n = lista.length;
  const kol = V.pion ? (n > 6 ? 3 : 2) : (n > 6 ? Math.ceil(n / 2) : n);
  const rzedy = Math.ceil(n / kol);
  const gora = V.pion ? 250 : 170;
  const dol = V.h - (V.pion ? 210 : 150);
  const odstY = Math.min(V.pion ? 300 : 330, (dol - gora) / rzedy);
  const kh = Math.min(V.pion ? 270 : 290, odstY - 18);
  const kw = Math.min(V.pion ? 345 : 215, (V.w - 60) / kol - 16);
  const gora0 = gora + ((dol - gora) - odstY * rzedy) / 2;
  return lista.map((p, i) => {
    const rzad = Math.floor(i / kol);
    const wRzedzie = Math.min(kol, n - rzad * kol);
    const k = i % kol;
    return { p, x: V.w / 2 + (k - (wRzedzie - 1) / 2) * (kw + 16), y: gora0 + odstY * (rzad + 0.5), w: kw, h: kh };
  });
}

function dopasujRozmiarNapisu(tekst, maxW, rozmiar) {
  ctx.font = `bold ${rozmiar}px ${CZCIONKA}`;
  const w = ctx.measureText(tekst).width;
  return w > maxW ? rozmiar * maxW / w : rozmiar;
}

function rysujKarte(k, wcisnieta, gwiazdki = true) {
  const { p, x, y, w, h } = k;
  const kolor = KOLORY_PRZEPISOW[p.id] || '#ff7b54';
  ctx.save();
  ctx.translate(0, wcisnieta ? 4 : Math.sin(czas * 2 + x * 0.01) * 3);
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  zaokraglony(x - w / 2, y - h / 2 + 8, w, h, 28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - w / 2, y - h / 2, w, h, 28);
  ctx.fill();
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.save();
  zaokraglony(x - w / 2, y - h / 2, w, h, 28);
  ctx.clip();
  ctx.fillStyle = rozjasnij(kolor, 0.82);
  ctx.fillRect(x - w / 2, y - h / 2, w, h * 0.58);
  ctx.restore();
  const s = Math.min(w, h * 1.1) / 200;
  rysujPorcje(p, x, y + h * 0.04 + (p.porcja === 'szklanka' ? 0 : -h * 0.04), s * (p.porcja === 'szklanka' ? 0.9 : 1.15), 1);
  const rozmiar = dopasujRozmiarNapisu(p.nazwa, w - 24, 26);
  napis(p.nazwa, x, y + h * 0.2, rozmiar, przyciemnij(kolor, 0.8));
  if (gwiazdki) {
    const ile = p.id === 'zupy'
      ? PRZEPISY.filter((q) => q.grupa === 'zupy').reduce((a, q) => a + (ugotowane[q.id] || 0), 0)
      : ugotowane[p.id] || 0;
    for (let i = 0; i < 3; i++) rysujGwiazdke(x + (i - 1) * 34, y + h * 0.37, 14, i < ile);
  }
  ctx.restore();
}

function rysujLadeZeZwierzakami(lista, baza, s, odst) {
  for (const z of lista) rysujZwierzaka(z, V.w / 2 + (z.i - 2) * odst, baza, s);
  // brzeg lady, za którą siedzą
  ctx.fillStyle = '#d59a5c';
  ctx.fillRect(-2000, baza - 30, V.w + 4000, 4000);
  ctx.fillStyle = '#f6cf9c';
  ctx.fillRect(-2000, baza - 30, V.w + 4000, 8);
  for (const z of lista) rysujLapki(z, V.w / 2 + (z.i - 2) * odst, baza - 26, s);
}

function rysujKsiazke() {
  napis('Kuchnia Helenki', V.w / 2, V.pion ? 130 : 78, V.pion ? 66 : 62, '#ff7b54', 'center', '#ffffff');
  napis('Co dziś ugotujemy?', V.w / 2, V.pion ? 200 : 140, 30, '#b5651d');
  for (const k of ukladKart(kartyKsiazki())) {
    const id = 'karta-' + k.p.id;
    rysujKarte(k, czyWcisniety(id));
    dodajPrzycisk(id, k.x, k.y, k.w, k.h, () => otworzKarte(k.p));
  }
  const { s, odst } = ladaZwierzakow();
  rysujLadeZeZwierzakami(zwierzakiKsiazki, V.h - 20, s, odst);
}

// ---------- Wybór własnej potrawy ----------
// Na kartach są obrazki zwykłych przepisów, ale z krótkimi nazwami
function kartyWyboru() {
  return WLASNE.map((w) => {
    const wzor = PRZEPISY.find((p) => p.id === w.typ) || w;
    return { ...wzor, nazwa: NAZWY_WLASNYCH[w.typ] || w.nazwa, wlasna: w };
  });
}

function otworzKarte(p) {
  if (p === MOJA_KARTA) pokazWybor('wlasna');
  else if (p === KARTA_ZUP) pokazWybor('zupy');
  else wybierzPrzepis(p);
}

function kartyZup() {
  return PRZEPISY.filter((p) => p.grupa === 'zupy');
}

function rysujWybor() {
  const zupy = rodzajWyboru === 'zupy';
  napis(zupy ? 'Zupy' : 'Moja potrawa', V.w / 2, V.pion ? 130 : 78, V.pion ? 66 : 62, zupy ? '#ff7b54' : '#c77dff', 'center', '#ffffff');
  napis(zupy ? 'Jaką zupę ugotujemy?' : 'Co chcesz ugotować?', V.w / 2, V.pion ? 200 : 140, 30, '#b5651d');
  const lista = zupy ? kartyZup() : kartyWyboru();
  for (const k of ukladKart(lista)) {
    const id = 'wybor-' + (zupy ? k.p.id : k.p.wlasna.typ);
    rysujKarte(k, czyWcisniety(id), zupy);
    dodajPrzycisk(id, k.x, k.y, k.w, k.h, () => (zupy ? wybierzPrzepis(k.p) : wybierzWlasna(k.p.wlasna)));
  }
  const { s, odst } = ladaZwierzakow();
  rysujLadeZeZwierzakami(zwierzakiKsiazki, V.h - 20, s, odst);
}

function dotykKsiazka(x, y) {
  const { s, odst } = ladaZwierzakow();
  for (const z of zwierzakiKsiazki) {
    const zx = V.w / 2 + (z.i - 2) * odst;
    if (blisko(x, y, zx, V.h - 20 - 112 * s, 80 * s + 10)) {
      z.t3 = 0;
      dzwiekZwierzaka(z.typ);
      serduszka(zx, V.h - 20 - 200 * s, 2);
      return;
    }
  }
}

function aktualizujZwierzakiKsiazki(dt) {
  for (const z of zwierzakiKsiazki) {
    z.t += dt;
    z.t3 = (z.t3 === undefined ? 99 : z.t3) + dt;
    mrugaj(z, dt);
    z.przechyl = Math.sin(z.t * 1.2 + z.i) * 0.08;
    z.skok = z.t3 < 0.6 ? Math.sin(z.t3 / 0.6 * Math.PI) * 40 : Math.max(0, Math.sin(z.t * 2 + z.i * 1.3)) * 6;
    if (z.t3 < 1.2) z.oczy = 'w';
    poGlaskaniu(z, dt);
  }
}

// ---------- Głaskanie: przesuń palcem po głowie przyjaciela ----------
function glaszcz(lista, gdzie, x, y, d) {
  for (const z of lista) {
    const g = gdzie(z);
    if (!blisko(x, y, g.x, g.y - 112 * g.s, 85 * g.s + 10)) continue;
    z.glaszcze = 0.4;
    z.glaskanie = (z.glaskanie || 0) + d;
    if (z.glaskanie > 110) {
      z.glaskanie = 0;
      serduszka(g.x, g.y - 210 * g.s, 1);
      if (z.typ === 'kotek') dzwiekMruczenia();
      else dzwiekHihi();
    }
  }
}

// Głaskany przyjaciel zamyka oczy z radości i przechyla główkę
function poGlaskaniu(z, dt) {
  if (!z.glaszcze || z.glaszcze <= 0) return;
  z.glaszcze -= dt;
  z.oczy = 'w';
  z.przechyl = Math.sin(czas * 5) * 0.14;
}

function ladaZwierzakow() {
  const dwaRzedy = kartyKsiazki().length > 6 && !V.pion;
  return { s: V.pion ? 0.62 : dwaRzedy ? 0.7 : 0.8, odst: V.pion ? 150 : 200 };
}

// ---------- Wstęp do przepisu ----------
function rysujWstep() {
  const p = przepis;
  const kolor = KOLORY_PRZEPISOW[p.id] || '#ff7b54';
  const w = Math.min(760, V.w - 60);
  const h = V.pion ? Math.min(800, V.h - 280) : 600;
  const x = V.w / 2;
  const y = V.pion ? V.h / 2 + 40 : 430;
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  zaokraglony(x - w / 2, y - h / 2 + 10, w, h, 36);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - w / 2, y - h / 2, w, h, 36);
  ctx.fill();
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 8;
  ctx.stroke();
  napis(p.nazwa, x, y - h / 2 + 58, dopasujRozmiarNapisu(p.nazwa, w - 60, 52), przyciemnij(kolor, 0.85));
  // obrazek potrawy
  const obrazekY = V.pion ? y - h / 2 + 330 : y - 40;
  const skala = p.porcja === 'szklanka' ? 1.05 : 1.45;
  rysujPorcje(p, x, obrazekY, V.pion ? skala * 1.2 : skala, 1);
  // składniki
  const lista = [];
  for (const sk of skladnikiPrzepisu(p)) lista.push(sk);
  const naRzad = V.pion ? 4 : 7;
  const odst = Math.min(100, (w - 40) / Math.min(naRzad, lista.length));
  const skY = V.pion ? obrazekY + 80 : y + 30;
  if (lista.length) napis('Potrzebujemy:', x, skY - 8, 22, '#9a8a7a');
  lista.forEach((sk, i) => {
    const rzad = Math.floor(i / naRzad);
    const wRzedzie = Math.min(naRzad, lista.length - rzad * naRzad);
    const ix = x + ((i % naRzad) - (wRzedzie - 1) / 2) * odst;
    const iy = skY + 60 + rzad * 110 + Math.sin(czas * 3 + i) * 3;
    ctx.fillStyle = '#fff4dc';
    kolo(ix, iy, 38);
    ctx.fill();
    rysujSkladnik(sk, ix, iy, 54);
    napis(SKLADNIKI[sk].nazwa, ix, iy + 52, 15, '#7a6a5a');
  });
  const by = y + h / 2 - 70;
  const bw = 330;
  rysujPrzyciskTekst(x, by, bw, 84, 'Gotujemy! ▶', '#3ddc97', 36, czyWcisniety('gotujemy'));
  dodajPrzycisk('gotujemy', x, by, bw, 90, zacznijGotowanie);
}

// ---------- Gotowanie ----------
function ikonaKroku(def) {
  switch (def.co) {
    case 'mieszaj': return '🥄';
    case 'gotuj': return '🔥';
    case 'smaz': return '🍳';
    case 'walkuj': return '*walek';
    case 'piecz': return '*piec';
    case 'wyciskaj': return '🍊';
    case 'jajko': return '🥚';
    case 'dowolne': return '🧺';
    case 'wybierz': return '✨';
    case 'galki': return '🍨';
    case 'dekoruj': return '🍒';
    default: return SKLADNIKI[def.skladnik].obrazek;
  }
}

// Pasek z krokami przepisu na górze ekranu
function rysujPasek() {
  const kroki = przepis.kroki;
  const n = kroki.length + 1;
  const x0 = 104;
  const x1 = V.w - 104;
  const odst = Math.min(88, (x1 - x0 - 30) / n);
  const start = V.w / 2 - odst * (n - 1) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  zaokraglony(start - odst / 2 - 6, 14, odst * n + 12, 78, 39);
  ctx.fill();
  const wStole = ekran === 'stol' || ekran === 'brawo';
  for (let i = 0; i < n; i++) {
    const cx = start + i * odst;
    const cy = 53;
    const aktywny = wStole ? i === n - 1 : i === nrKroku;
    const zrobiony = wStole ? (i < n - 1 || ekran === 'brawo') : (i < nrKroku || (i === nrKroku && K && K.gotowe));
    const r = (aktywny ? 34 : 26) * Math.min(1, odst / 80);
    if (aktywny) {
      ctx.fillStyle = `rgba(255, 183, 3, ${0.35 + Math.sin(czas * 5) * 0.15})`;
      kolo(cx, cy, r + 8);
      ctx.fill();
    }
    ctx.fillStyle = zrobiony ? '#d4f5dd' : aktywny ? '#fff1c4' : '#f1f1f1';
    kolo(cx, cy, r);
    ctx.fill();
    const ikona = i < kroki.length ? ikonaKroku(kroki[i]) : '🍽️';
    rysujObrazek(ikona, cx, cy, r * 1.25, 0, zrobiony || aktywny ? 1 : 0.45);
    if (i < kroki.length && kroki[i].co === 'kroj') rysujEmotke('🔪', cx - r * 0.7, cy + r * 0.6, r * 0.7, -0.5);
    if (zrobiony) {
      ctx.fillStyle = '#2fbf71';
      kolo(cx + r * 0.72, cy + r * 0.66, 11);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.72 - 5, cy + r * 0.66);
      ctx.lineTo(cx + r * 0.72 - 1, cy + r * 0.66 + 4);
      ctx.lineTo(cx + r * 0.72 + 6, cy + r * 0.66 - 4);
      ctx.stroke();
    }
  }
  // co teraz robimy
  if (napisKroku) {
    const maxW = V.w - 160;
    const rozmiar = dopasujRozmiarNapisu(napisKroku, maxW - 90, V.pion ? 32 : 30);
    ctx.font = `bold ${rozmiar}px ${CZCIONKA}`;
    const tw = ctx.measureText(napisKroku).width;
    const bw = tw + 100;
    const by = M.napisY;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    zaokraglony(V.w / 2 - bw / 2, by - 30, bw, 60, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffd6a5';
    ctx.lineWidth = 4;
    ctx.stroke();
    napis(napisKroku, V.w / 2 - 28, by + 1, rozmiar, '#8a4b1c');
    // głośniczek: powtórz polecenie
    const gx = V.w / 2 + bw / 2 - 36;
    rysujEmotke('🔈', gx, by, czyWcisniety('powtorz') ? 30 : 34);
    dodajPrzycisk('powtorz', gx, by, 70, 70, () => powiedz(napisKroku));
  }
}

function potrzebnaKuchenka() {
  return N && (N.typ === 'garnek' || N.typ === 'patelnia');
}

function rysujGotowanie() {
  rysujOkno(M.okno.x, M.okno.y, M.okno.w, M.okno.h);
  rysujPolke(M.polkaDeko.x, M.polkaDeko.y, M.polkaDeko.w);
  rysujPodgladacza();
  if (!['pizza', 'talerz', 'rozek'].includes(N.typ) && !przepis.wlasny && przepis.id !== 'spaghetti') rysujDeske(M.deska.x, M.deska.y + 24);
  if (potrzebnaKuchenka()) {
    const p = pokretlo();
    const podswietl = K && K.def.co === 'gotuj' && K.faza === 'czeka' ? 0.6 + Math.sin(czas * 6) * 0.4 : 0;
    rysujPokretlo(p.x, p.y, N.ogien, podswietl);
  }
  const ukryte = K && K.def.co === 'piecz' && K.pojaw > 0.6;
  if (!ukryte) {
    const p = pozN();
    rysujNaczynie(N, p.x, p.y, sprezyna(N.pojaw), czas);
  }
  rysujBabelki();
  if (K && MECH[K.def.co].rysuj) MECH[K.def.co].rysuj(K);
  rysujLecace();
}

// ---------- Stół ----------
// Dymek z tym, co mówi przyjaciel (np. „Fuuu! To smakuje jak stara skarpeta!”)
function rysujDymek(z, zx) {
  const d = z.dymek;
  const pojaw = sprezyna(Math.min(1, d.t * 4)) * Math.min(1, (3.5 - d.t) * 3);
  if (pojaw <= 0.01) return;
  const rozmiar = V.pion ? 17 : 19;
  const maxW = V.pion ? 140 : 190;
  ctx.font = `bold ${rozmiar}px ${CZCIONKA}`;
  // dzielimy zdanie na linijki
  const linie = [];
  for (const slowo of d.tekst.split(' ')) {
    const ost = linie[linie.length - 1];
    if (ost && ctx.measureText(ost + ' ' + slowo).width < maxW) linie[linie.length - 1] = ost + ' ' + slowo;
    else linie.push(slowo);
  }
  const w = Math.max(...linie.map((l) => ctx.measureText(l).width)) + 24;
  const h = linie.length * rozmiar * 1.2 + 16;
  const x = ogranicz(zx, w / 2 + 6, V.w - w / 2 - 6);
  const y = M.zwY - 215 * M.zwS - h / 2;
  ctx.save();
  ctx.translate(x, y + h / 2);
  ctx.scale(pojaw, pojaw);
  ctx.translate(-x, -(y + h / 2));
  ctx.fillStyle = '#ffffff';
  zaokraglony(x - w / 2, y - h / 2, w, h, 16);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(zx - 10, y + h / 2 - 2);
  ctx.lineTo(zx + 10, y + h / 2 - 2);
  ctx.lineTo(zx, y + h / 2 + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9bd77f';
  ctx.lineWidth = 3;
  zaokraglony(x - w / 2, y - h / 2, w, h, 16);
  ctx.stroke();
  linie.forEach((l, i) => napis(l, x, y - h / 2 + 8 + rozmiar * 0.6 + i * rozmiar * 1.2, rozmiar, '#3d8b37'));
  ctx.restore();
}

// Chmurka nad głową: „wiem, co tu jest – to moje ulubione!”
function rysujChmurke(z, zx) {
  const s = M.zwS;
  const x = zx + 62 * s;
  const y = M.zwY - 245 * s + Math.sin(czas * 2 + z.i) * 4;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  kolo(zx + 34 * s, M.zwY - 190 * s, 6 * s);
  ctx.fill();
  kolo(zx + 46 * s, M.zwY - 210 * s, 9 * s);
  ctx.fill();
  for (const [dx, dy, r] of [[-22, 4, 24], [0, -8, 30], [24, 2, 24], [0, 12, 24]]) {
    kolo(x + dx * s, y + dy * s, r * s);
    ctx.fill();
  }
  const smak = SMAKI_LODOW.find((l) => l.id === z.ulubiony);
  if (smak) {
    ctx.fillStyle = smak.kolor;
    kolo(x, y, 20 * s);
    ctx.fill();
  } else {
    rysujSkladnik(z.ulubiony, x, y, 42 * s);
  }
  rysujSerce(x + 26 * s, y - 20 * s, 9 * s);
}

function rysujStol() {
  rysujGirlande(-20, V.w + 20, V.pion ? 270 : 150);
  // zwierzaki
  for (const z of zwierzaki) rysujZwierzaka(z, M.zwX[z.i], M.zwY, M.zwS);
  // obrus (na całą szerokość ekranu)
  ekranowe();
  rysujObrus(V.W, V.H, V.oy + M.stolY * V.s, 56 * V.s);
  wirtualne();
  for (const z of zwierzaki) {
    const zx = M.zwX[z.i];
    rysujLapki(z, zx, M.stolY + 10, M.zwS);
    if (z.stan === 'czeka') {
      // pusty talerzyk czeka
      const p = { ...przepis };
      rysujPorcje(p, zx, M.porcjaY, M.porcjaS, 0);
      if (z.ulubiony) rysujChmurke(z, zx);
    } else if (z.stan === 'je' || z.stan === 'zadowolony' || z.stan === 'skrzywiony') {
      rysujPorcje(przepis, zx, M.porcjaY, M.porcjaS, z.porcja);
    }
  }
  for (const z of zwierzaki) if (z.dymek) rysujDymek(z, M.zwX[z.i]);
  // garnek z potrawą
  const d = M.danie;
  if (N.typ === 'rozek') rysujNaczynie(N, d.x, d.y - 10, d.s * 0.75, czas);   // wysoki rożek – trochę mniejszy
  else rysujNaczynie(N, d.x, d.y - (N.typ === 'pizza' || N.typ === 'talerz' ? 0 : 60), d.s, czas);
  if (N.goracy && Math.random() < 0.05) para(d.x + losowa(-40, 40), d.y - 80);
  rysujLecace();
}

function rysujBrawo() {
  if (przepis.dziwne) {
    rysujOjej();
    return;
  }
  const w = Math.min(560, V.w - 80);
  const h = 360;
  const x = V.w / 2;
  const y = V.pion ? V.h * 0.3 : 300;
  const pojaw = sprezyna(Math.min(1, brawoT * 2.5));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pojaw, pojaw);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  zaokraglony(-w / 2, -h / 2 + 10, w, h, 40);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(-w / 2, -h / 2, w, h, 40);
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 8;
  ctx.stroke();
  napis('Brawo!', 0, -h / 2 + 70, 70, '#ff7b54', 'center', '#ffe9a8');
  napis('Wszyscy najedzeni!', 0, -h / 2 + 135, 30, '#8a4b1c');
  for (let i = 0; i < 3; i++) {
    const p = sprezyna(Math.min(1, Math.max(0, brawoT * 2.5 - 0.6 - i * 0.35)));
    if (p > 0) rysujGwiazdke((i - 1) * 90, -h / 2 + 215 - (i === 1 ? 14 : 0), 40 * p, true);
  }
  ctx.restore();
  const by = y + h / 2 + 70 * pojaw;
  rysujPrzyciskTekst(x, by, 420, 84, 'Ugotuj coś jeszcze ▶', '#3ddc97', 32, czyWcisniety('jeszcze'));
  dodajPrzycisk('jeszcze', x, by, 420, 90, pokazKsiazke);
}


// Koniec, kiedy składniki nie pasowały do siebie
function rysujOjej() {
  const w = Math.min(600, V.w - 60);
  const h = 360;
  const x = V.w / 2;
  const y = V.pion ? V.h * 0.3 : 300;
  const pojaw = sprezyna(Math.min(1, brawoT * 2.5));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pojaw, pojaw);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  zaokraglony(-w / 2, -h / 2 + 10, w, h, 40);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  zaokraglony(-w / 2, -h / 2, w, h, 40);
  ctx.fill();
  ctx.strokeStyle = '#9bd77f';
  ctx.lineWidth = 8;
  ctx.stroke();
  napis('Ojej!', 0, -h / 2 + 66, 66, '#4caf50', 'center', '#e3f5d6');
  napis(przepis.dziwne, 0, -h / 2 + 135, dopasujRozmiarNapisu(przepis.dziwne, w - 50, 30), '#8a4b1c');
  const lista = przepis.wPorcji || [];
  lista.forEach((sk, i) => {
    rysujSkladnik(sk, (i - (lista.length - 1) / 2) * 80, -h / 2 + 230 + Math.sin(czas * 4 + i) * 4, 62);
  });
  ctx.restore();
  const by = y + h / 2 + 70 * pojaw;
  rysujPrzyciskTekst(x, by, 440, 84, 'Spróbuj jeszcze raz ▶', '#c77dff', 32, czyWcisniety('jeszcze'));
  dodajPrzycisk('jeszcze', x, by, 440, 90, () => pokazWybor('wlasna'));
}


// =====================================================
//   PODPOWIEDŹ – rączka pokazuje, co zrobić
// =====================================================
function obecnaPodpowiedz() {
  if (ekran === 'gotowanie') {
    if (!K || K.gotowe) return null;
    const m = MECH[K.def.co];
    return m.podpowiedz ? m.podpowiedz(K) : null;
  }
  if (ekran === 'stol') {
    const z = zwierzaki.find((q) => q.stan === 'czeka');
    if (!z || zwierzaki.some((q) => q.stan === 'je')) return null;
    return { typ: 'stuk', x: M.zwX[z.i], y: M.porcjaY - 30 * M.porcjaS };
  }
  if (ekran === 'wstep') {
    const w = V.pion ? Math.min(800, V.h - 280) : 600;
    const y = V.pion ? V.h / 2 + 40 : 430;
    return { typ: 'stuk', x: V.w / 2 + 80, y: y + w / 2 - 70 };
  }
  return null;
}

function rysujPodpowiedz() {
  const czekaj = ekran === 'wstep' ? 4 : USTAWIENIA.podpowiedzPo;
  if (bezczynnosc < czekaj || wsk.wcisniety || chwyt) return;
  const p = obecnaPodpowiedz();
  if (!p) return;
  const t = bezczynnosc - czekaj;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 3);
  switch (p.typ) {
    case 'stuk': {
      const f = (t * 1.1) % 1;
      const wc = f > 0.35 && f < 0.6;
      rysujRaczke(p.x, p.y - (wc ? 0 : 20 * Math.sin(f * Math.PI)), wc);
      break;
    }
    case 'ciagnij': {
      const f = (t * 0.5) % 1;
      if (f >= 0.9) break;
      let x = p.x;
      let y = p.y;
      if (f >= 0.15 && f < 0.75) {
        const q = plynnie((f - 0.15) / 0.6);
        x = p.x + (p.x2 - p.x) * q;
        y = p.y + (p.y2 - p.y) * q;
      } else if (f >= 0.75) {
        x = p.x2;
        y = p.y2;
      }
      // przerywana strzałka pokazuje drogę
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.strokeStyle = '#ff9f1c';
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -czas * 40;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo((p.x + p.x2) / 2, Math.min(p.y, p.y2) - 80, p.x2, p.y2);
      ctx.stroke();
      ctx.restore();
      rysujRaczke(x, y, f > 0.07 && f < 0.75);
      break;
    }
    case 'kolo': {
      ctx.save();
      ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = '#ff9f1c';
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -czas * 40;
      elipsa(p.x, p.y, p.r, p.r * p.e);
      ctx.stroke();
      ctx.restore();
      const a = t * 3.2;
      rysujRaczke(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r * p.e, true);
      break;
    }
    case 'tam': {
      const s = Math.sin(t * 4);
      rysujRaczke(p.x + (p.dx || 0) * s, p.y + (p.dy || 0) * s, true);
      break;
    }
    case 'maluj': {
      const f = (t * 0.45) % 1;
      const x = p.x + (f * 2 - 1) * p.r;
      const y = p.y + Math.sin(f * Math.PI * 6) * p.r * p.e * 0.7;
      rysujRaczke(x, y, true);
      break;
    }
  }
  ctx.restore();
}


// =====================================================
//   PĘTLA GRY
// =====================================================
function aktualizuj(dt) {
  bezczynnosc += dt;
  zaslona = Math.max(0, zaslona - dt * 3);
  aktualizujEfekty(dt);
  aktualizujBabelki(dt);
  aktualizujLecace(dt);
  aktualizujPodgladacza(dt);
  if (ekran === 'gotowanie' && N) {
    N.pojaw = Math.min(1, N.pojaw + dt * 3);
    const grzeje = K && ((K.def.co === 'gotuj' && K.faza === 'gotuje') ||
      (K.def.co === 'smaz' && ['nalewa', 'smazy', 'przewroc', 'skok', 'smazy2'].includes(K.faza)));
    N.ogien += ((grzeje ? 1 : 0) - N.ogien) * Math.min(1, dt * 4);
    if (N.zdejmij) N.wyciskarka = Math.max(0, N.wyciskarka - dt * 2);
    if (N.goracy && Math.random() < dt * 2.5) {
      const g = geo();
      para(g.cx + losowa(-0.5, 0.5) * g.R, g.cy - 20);
    }
    if (K) {
      const m = MECH[K.def.co];
      if (m.update) m.update(K, dt);
      if (K.gotowe) {
        K.poGotowym += dt;
        if (K.poGotowym > 1.2) nastepnyKrok();
      }
    }
  }
  if (ekran === 'brawo') brawoT += dt;
  if (ekran === 'stol' || ekran === 'brawo') aktualizujZwierzaki(dt);
  if (ekran === 'ksiazka' || ekran === 'wybor') aktualizujZwierzakiKsiazki(dt);
}

function rysuj() {
  ekranowe();
  const kafel = 56 * V.s;
  if (ekran === 'stol' || ekran === 'brawo') {
    rysujJadalnie(V.W, V.H, V.oy + M.stolY * V.s, kafel);
  } else {
    const blat = ekran === 'gotowanie' ? M.blat : M.blatKsiazki;
    rysujScianeKuchni(V.W, V.H, V.oy + blat * V.s, kafel);
  }
  wirtualne();
  przyciski = [];
  switch (ekran) {
    case 'ksiazka': rysujKsiazke(); break;
    case 'wybor': rysujWybor(); break;
    case 'wstep': rysujWstep(); break;
    case 'gotowanie': rysujPasek(); rysujGotowanie(); break;
    case 'stol': rysujStol(); rysujPasek(); break;
    case 'brawo': rysujStol(); rysujPasek(); break;
  }
  rysujEfekty();
  if (ekran === 'brawo') rysujBrawo();
  rysujGornePrzyciski();
  rysujPodpowiedz();
  if (zaslona > 0) {
    ekranowe();
    ctx.fillStyle = `rgba(255, 250, 240, ${zaslona})`;
    ctx.fillRect(0, 0, V.W, V.H);
  }
}

let ostatniaKlatka = performance.now();

function klatka(teraz) {
  const dt = Math.min(0.05, (teraz - ostatniaKlatka) / 1000);
  ostatniaKlatka = teraz;
  czas += dt;
  aktualizuj(dt);
  rysuj();
  requestAnimationFrame(klatka);
}


// =====================================================
//   STEROWANIE – palec i myszka
// =====================================================
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (wsk.wcisniety && wsk.id !== e.pointerId) return;   // drugi palec nie przeszkadza
  const p = naWirtualne(e);
  wsk.x = p.x;
  wsk.y = p.y;
  wsk.wcisniety = true;
  wsk.id = e.pointerId;
  bezczynnosc = 0;
  try {
    plotno.setPointerCapture(e.pointerId);
  } catch (err) {
    // trudno – zadziała i bez tego
  }
  const b = przyciskW(p.x, p.y);
  if (b) {
    wcisnietyPrzycisk = b;
    return;
  }
  if (ekran === 'gotowanie') {
    if (trafBabelek(p.x, p.y) || dotykOkna(p.x, p.y)) return;
    if (K && !K.gotowe) {
      const m = MECH[K.def.co];
      if (m.dotyk) m.dotyk(K, p.x, p.y);
    }
  } else if (ekran === 'stol') {
    dotykStol(p.x, p.y);
  } else if (ekran === 'ksiazka' || ekran === 'wybor') {
    dotykKsiazka(p.x, p.y);
  }
});

plotno.addEventListener('pointermove', (e) => {
  if (!wsk.wcisniety || e.pointerId !== wsk.id) return;
  const p = naWirtualne(e);
  bezczynnosc = 0;
  const d = Math.hypot(p.x - wsk.x, p.y - wsk.y);
  wsk.x = p.x;
  wsk.y = p.y;
  if (chwyt) {
    chwyt.x = p.x + chwyt.dx;
    chwyt.y = p.y + chwyt.dy;
  }
  if (ekran === 'ksiazka' || ekran === 'wybor') {
    const { s, odst } = ladaZwierzakow();
    glaszcz(zwierzakiKsiazki, (z) => ({ x: V.w / 2 + (z.i - 2) * odst, y: V.h - 20, s }), p.x, p.y, d);
  } else if (ekran === 'stol' || ekran === 'brawo') {
    glaszcz(zwierzaki.filter((z) => z.stan !== 'je'), (z) => ({ x: M.zwX[z.i], y: M.zwY, s: M.zwS }), p.x, p.y, d);
  }
  if (ekran === 'gotowanie' && K && !K.gotowe) {
    const m = MECH[K.def.co];
    if (m.ruch) m.ruch(K, p.x, p.y);
  }
});

function puscPalec(e, anulowane) {
  if (e.pointerId !== wsk.id) return;
  const p = naWirtualne(e);
  wsk.wcisniety = false;
  wsk.id = null;
  if (wcisnietyPrzycisk) {
    const b = przyciskW(p.x, p.y);
    const akcja = !anulowane && b && b.id === wcisnietyPrzycisk.id ? b.akcja : null;
    wcisnietyPrzycisk = null;
    if (akcja) akcja();
    return;
  }
  if (ekran === 'gotowanie' && K) {
    const m = MECH[K.def.co];
    if (m.puszczenie) m.puszczenie(K, p.x, p.y);
  }
  if (chwyt) {
    // coś zostało w ręce – wraca na miejsce
    if (chwyt.domX !== undefined) chwyt.wraca = true;
    chwyt = null;
  }
}

plotno.addEventListener('pointerup', (e) => puscPalec(e, false));
plotno.addEventListener('pointercancel', (e) => puscPalec(e, true));
plotno.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') przelaczDzwiek();
  else if (e.code === 'Escape' || e.code === 'KeyQ') wroc();
  else if ((e.code === 'Space' || e.code === 'Enter') && ekran === 'wstep') zacznijGotowanie();
  else if ((e.code === 'Space' || e.code === 'Enter') && ekran === 'brawo') (przepis.dziwne ? pokazWybor('wlasna') : pokazKsiazke());
  else if (ekran === 'ksiazka') {
    const karty = kartyKsiazki();
    const nr = parseInt(e.key, 10);
    if (nr >= 1 && nr <= karty.length) otworzKarte(karty[nr - 1]);
  } else if (ekran === 'wybor') {
    const nr = parseInt(e.key, 10);
    if (rodzajWyboru === 'zupy' && nr >= 1 && nr <= kartyZup().length) wybierzPrzepis(kartyZup()[nr - 1]);
    else if (rodzajWyboru !== 'zupy' && nr >= 1 && nr <= WLASNE.length) wybierzWlasna(WLASNE[nr - 1]);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) ucisz();
});

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   START
// =====================================================
dopasujRozmiar();
zwierzakiKsiazki = noweZwierzaki();
requestAnimationFrame(klatka);
