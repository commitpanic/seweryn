'use strict';

// =====================================================
//   DENTYSTKA HELENKA – myj i lecz ząbki zwierzątkom!
//   Pomysł: Seweryn (dla Helenki)
// =====================================================
//
//  Jak się gra:
//   - W poczekalni siedzą zwierzątka. Stuknij w jedno, a usiądzie na fotelu.
//   - Stuknij w buzię, żeby powiedziało „aaa”.
//   - Bierz narzędzia z tacy PO KOLEI: lusterko, szczoteczka, woda, ssak,
//     a jak trzeba, to jeszcze wiertło, plomba, lampka i kleszcze.
//   - Gra mówi, co teraz. Jak nie wiesz, po chwili pokaże to rączka.
//   - Na koniec dzielny pacjent dostaje naklejkę.
//   - Nie ma pośpiechu i nie da się przegrać!
//
//  Pacjenci, narzędzia i naklejki są w pliku dane.js
//  Rysowanie (zwierzaki, ząbki, narzędzia) jest w pliku rysowanie.js


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  podpowiedzPo: 3,          // po ilu sekundach bez ruchu pokazuje się rączka z podpowiedzią
  powtorzPo: 12,            // po ilu sekundach bez ruchu gra jeszcze raz mówi, co robić
  szansaNaDziurke: 0.75,    // jak często pacjent ma dziurkę (0 = nigdy, 1 = zawsze)
  szansaNaRuszajacy: 0.45,  // jak często pacjent ma ruszający się ząbek
  czasWiercenia: 1.5,       // ile sekund trzeba wiercić jedną dziurkę
  czasPlomby: 0.8,          // ile sekund trzeba zalepiać jedną dziurkę
  czasLampki: 1.2,          // ile sekund trzeba świecić lampką na plombę
  mowa: true,               // czy gra mówi, co robić (false = nie mówi)
  glosnosc: 0.5,            // jak głośne są dźwięki (od 0 do 1)
};

const KLUCZ_REKORDU = 'dentystka-helenka-rekord';

// Kolory krzeseł w poczekalni
const KOLORY_KRZESEL = ['#ff9fb0', '#8fd3ff', '#ffd166', '#b5f28c', '#c9a7ff', '#ffb38a'];

// Jak leżą narzędzia: na tacy prawie poziomo, w ręce trochę ukosem
const OBROT_NA_TACY = -1.15;
const OBROT_W_RECE = -0.6;

// Narzędzia, które mają kabel
const Z_KABLEM = ['woda', 'ssak', 'wiertlo', 'lampka'];


// =====================================================
//   STAN GRY
// =====================================================
let ekran = 'poczekalnia';   // 'poczekalnia' | 'fotel'
let pacjenci = [];           // zwierzątka w poczekalni
let pacjent = null;          // kto siedzi na fotelu
let kroki = [];              // co trzeba zrobić po kolei (np. 'aaa', 'lusterko', 'szczoteczka'...)
let nrKroku = 0;
let krokSkonczony = false;
let poKroku = 0;             // ile sekund minęło od skończenia kroku
let koniecWizyty = false;    // naklejka przyklejona – brawo!
let koniecT = 0;
let wszyscyT = -1;           // wszyscy wyleczeni – świętujemy w poczekalni
let efekty = [];             // iskierki, krople, serduszka...
let lecace = [];             // rzeczy, które lecą (wyrwany ząbek, naklejka)
let przyciski = [];          // przyciski na ekranie (budowane przy każdym rysowaniu)
let wcisnietyPrzycisk = null;
let czas = 0;
let bezczynnosc = 0;         // ile sekund nic nie robisz (wtedy pokazuje się podpowiedź)
let powtorzone = false;      // czy gra już powtórzyła polecenie
let zaslona = 0;             // białe przejście między ekranami
let wyciszone = false;
let napisKroku = '';
let wyleczeni = wczytajRekord();
let zabkiWPudelku = 0;       // ile ząbków jest w pudełeczku
let nrOgladania = 0;         // ile ząbków obejrzano lusterkiem (dźwięk jest coraz wyższy)
let powiedzianoDziurke = false;
let powiedzianoRusza = false;

// palec / myszka
const wsk = { x: 0, y: 0, wcisniety: false, id: null, mysz: false, dotyk: false, nadPlotnem: false, droga: 0, kandydat: null };

// narzędzie w ręce
const narz = {
  id: null, x: 0, y: 0, px: 0, py: 0, obrot: OBROT_W_RECE, skala: 1,
  trzymany: false,   // czy palec trzyma narzędzie
  wraca: false,      // czy wraca na tacę
  cel: null,         // dokąd samo jedzie (np. odłożone obok buzi)
  chwycony: null,    // ząbek złapany kleszczami
  startX: 0, startY: 0, zacisk: 0, skrzyp: 0,
  szur: 0, laskotki: 0, krople: 0,
  kreci: false, swieci: false, naZebie: false, zoom: false, kolor: null,
};

// drganie i podskakiwanie narzędzi na tacy
const taca = NARZEDZIA.map(() => ({ trzes: 0, skacz: 0 }));


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
  V.W = Math.max(1, window.innerWidth);
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
  if (!V.pion) {
    M.pasekY = 48;
    M.napisY = 108;
    M.tacaGora = h - 122;
    M.tacaY = h - 62;
    const odst = Math.min(142, (w - 60) / 8);
    M.taca = NARZEDZIA.map((n, i) => ({ x: w / 2 + (i - 3.5) * odst, y: M.tacaY }));
    M.tacaW = odst * 8 + 30;
    M.tacaH = 112;
    M.tacaS = 0.7;
    const odstN = Math.min(150, (w - 60) / 6);
    M.naklejki = NAKLEJKI.map((n, i) => ({ x: w / 2 + (i - 2.5) * odstN, y: M.tacaY }));
    M.rNaklejki = 44;
    const wolne = M.tacaGora - 140;
    const s = Math.min(2.0, wolne / 285);
    M.g = { x: w / 2, y: 140 + 160 * s + Math.max(0, wolne - 285 * s) * 0.45, s };
    M.lampa = { x: Math.min(190, w * 0.16), y: 125, s: 1 };
    M.plakat = { x: w - Math.min(150, w * 0.13), y: 260, s: 0.9 };
    M.pudelko = { x: w - Math.min(140, w * 0.12), y: M.tacaGora - 70, s: 1 };
    // poczekalnia
    const odstP = Math.min(185, (w - 60) / 6);
    M.krzesla = PACJENCI.map((p, i) => ({ x: w / 2 + (i - 2.5) * odstP, y: 600 }));
    M.pS = Math.min(0.95, odstP / 190);
    M.podloga = 668;
    M.szyld = { x: w / 2, y: 112, s: 1 };
    M.okno = { x: 60, y: 165, w: 170, h: 125 };
    M.plakatP = { x: w - 130, y: 230, s: 0.72 };
    M.nowyDzien = { x: w / 2, y: h - 62 };
  } else {
    M.pasekY = 50;
    M.napisY = 112;
    M.tacaGora = h - 290;
    M.tacaY = h - 150;
    M.taca = NARZEDZIA.map((n, i) => ({ x: 400 + ((i % 4) - 1.5) * 186, y: h - 218 + Math.floor(i / 4) * 130 }));
    M.tacaW = 780;
    M.tacaH = 280;
    M.tacaS = 0.85;
    M.naklejki = NAKLEJKI.map((n, i) => ({ x: 400 + ((i % 3) - 1) * 220, y: h - 218 + Math.floor(i / 3) * 130 }));
    M.rNaklejki = 52;
    const wolne = M.tacaGora - 140;
    const s = Math.min(2.5, wolne / 290);
    M.g = { x: 400, y: 140 + 165 * s + Math.max(0, wolne - 290 * s) * 0.4, s };
    M.lampa = { x: 100, y: 190, s: 0.7 };
    M.plakat = { x: 705, y: 235, s: 0.6 };
    M.pudelko = { x: 690, y: M.tacaGora - 60, s: 0.8 };
    // poczekalnia: dwa rzędy po trzy krzesła, na środku wolnego miejsca
    M.pS = Math.min(1.35, (h - 400) / 700);
    const rzad = 335 * M.pS;
    const gora = 230 + Math.max(0, (h - 360) - (2 * rzad + 40)) / 2;
    const y1 = gora + 260 * M.pS;
    M.krzesla = PACJENCI.map((p, i) => ({ x: 400 + ((i % 3) - 1) * 250, y: y1 + Math.floor(i / 3) * (rzad + 40) }));
    M.podloga = y1 + 72 * M.pS;
    M.szyld = { x: 400, y: 150, s: 0.95 };
    M.okno = null;
    M.plakatP = null;
    M.nowyDzien = { x: 400, y: h - 80 };
  }
  // tu czeka narzędzie wzięte z tacy (obok buzi)
  M.gotowe = { x: Math.min(M.g.x + 170 * M.g.s, w - 120), y: M.g.y + 10 * M.g.s };
  M.skalaReki = 0.55 * M.g.s;
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

// Główka pacjenta na fotelu: miejsce na ekranie ↔ miejsce na główce
function glowaY() {
  return M.g.y - (pacjent ? pacjent.skok : 0);
}

function naLokalne(x, y) {
  return { x: (x - M.g.x) / M.g.s, y: (y - glowaY()) / M.g.s };
}

function naEkran(lx, ly) {
  return { x: M.g.x + lx * M.g.s, y: glowaY() + ly * M.g.s };
}

// Czy punkt (na główce) jest w buzi. k > 1 = trochę większa buzia (łatwiej trafić)
function wBuzi(L, k) {
  const rx = USTA.rx * k;
  const ry = USTA.ry * pacjent.otw * k + 4;
  return ((L.x - USTA.x) / rx) ** 2 + ((L.y - USTA.y) / ry) ** 2 <= 1;
}

function geometrie() {
  return pacjent.zeby.map((z) => geometriaZeba(pacjent.typ, z, pacjent.otw));
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

const NUTY = [523, 587, 659, 784, 880, 1046, 1175, 1318, 1568, 1760, 2093, 2349];

const dzwiekChwytu = () => slizg(500, 820, 0.06, 'sine', 0.08);
const dzwiekNieTo = () => { slizg(330, 150, 0.22, 'triangle', 0.16); slizg(150, 320, 0.22, 'triangle', 0.13, 0.22); };
const dzwiekOgladania = (n) => pisk(NUTY[Math.min(NUTY.length - 1, n)], 0.25, 'sine', 0.1);
const dzwiekOjej = () => { pisk(660, 0.14, 'triangle', 0.14); pisk(494, 0.3, 'triangle', 0.14, 0.15); };
const dzwiekSzczotki = () => szum(0.12, 'bandpass', losowa(2500, 3500), 1800, 0.2);
const dzwiekCzysty = () => { pisk(1568, 0.25, 'sine', 0.08); pisk(2093, 0.3, 'sine', 0.06, 0.06); };
const dzwiekPyk = () => slizg(600, 1350, 0.07, 'sine', 0.14);
const dzwiekDing = () => { pisk(1568, 0.9, 'triangle', 0.16); pisk(2093, 1.0, 'triangle', 0.1, 0.12); };
const dzwiekKlik = () => { pisk(1200, 0.03, 'square', 0.06); pisk(700, 0.04, 'square', 0.05, 0.05); };
const dzwiekBrawo = () => [784, 988, 1175].forEach((f, i) => pisk(f, 0.15, 'triangle', 0.13, i * 0.08));
const dzwiekMagii = () => [1046, 1318, 1568, 2093].forEach((f, i) => pisk(f, 0.12, 'sine', 0.08, i * 0.05));
const dzwiekHihi = () => { slizg(900, 1300, 0.07, 'sine', 0.08); slizg(950, 1400, 0.07, 'sine', 0.08, 0.11); slizg(1000, 1450, 0.07, 'sine', 0.07, 0.22); };
const dzwiekMruczenia = () => { for (const o of [0, 0.12, 0.24]) szum(0.1, 'lowpass', 220, 120, 0.4, o); };
const dzwiekPlomby = () => { szum(0.25, 'lowpass', 900, 300, 0.25); slizg(300, 520, 0.2, 'sine', 0.08); };
const dzwiekSkrzypu = () => slizg(losowa(200, 260), losowa(380, 460), 0.08, 'sawtooth', 0.04);
const dzwiekKleszczy = () => { pisk(1800, 0.03, 'square', 0.06); pisk(1200, 0.04, 'square', 0.05, 0.04); };
const dzwiekWyrwania = () => { slizg(300, 1500, 0.12, 'sine', 0.2); szum(0.06, 'highpass', 3000, 6000, 0.3); };
const dzwiekPlum = () => slizg(520, 140, 0.2, 'sine', 0.2);
const dzwiekNaklejki = () => { szum(0.08, 'highpass', 2000, 5000, 0.2); slizg(400, 900, 0.12, 'sine', 0.1, 0.05); };
const dzwiekFanfary = () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => pisk(f, i === 5 ? 0.6 : 0.2, 'triangle', 0.15, i * 0.14));

// „Aaaa!” – każdy zwierzak ma swój głos
function dzwiekAaa(glos) {
  const f = 200 * glos;
  melodyjka([[0, f * 0.9], [0.12, f * 1.1], [0.5, f * 1.15], [0.9, f * 1.05], [1.1, f * 0.95]], 'sawtooth', 0.13, 0, 1200);
  melodyjka([[0, f * 1.8], [0.12, f * 2.2], [0.5, f * 2.3], [0.9, f * 2.1], [1.1, f * 1.9]], 'triangle', 0.05, 0, 2000);
}

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
    case 'krolik': // niuch, niuch, pi-pi!
      for (const o of [0, 0.1, 0.2]) szum(0.05, 'highpass', 2500, 5000, 0.18, o);
      slizg(1400, 1900, 0.1, 'sine', 0.08, 0.35);
      slizg(1500, 2000, 0.1, 'sine', 0.08, 0.5);
      break;
  }
}

// ---------- Dźwięki, które grają, dopóki narzędzie pracuje (wiertło, woda...) ----------
let petla = null;
let buforSzumu = null;

function zacznijPetle(nazwa) {
  const t = audio.currentTime;
  const g = audio.createGain();
  const glosnosc = { wiertlo: 0.06, woda: 0.14, ssak: 0.22, lampka: 0.035 }[nazwa];
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(glosnosc, t + 0.06);
  g.connect(wzmacniacz);
  const zrodla = [];
  let ton = null;
  if (nazwa === 'wiertlo') {
    // bzzzz!
    const o = audio.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 700;
    const lfo = audio.createOscillator();
    lfo.frequency.value = 45;
    const lg = audio.createGain();
    lg.gain.value = 30;
    lfo.connect(lg);
    lg.connect(o.frequency);
    const f = audio.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2200;
    o.connect(f);
    f.connect(g);
    zrodla.push(o, lfo);
    ton = o;
  } else if (nazwa === 'woda' || nazwa === 'ssak') {
    if (!buforSzumu) {
      buforSzumu = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const d = buforSzumu.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const z = audio.createBufferSource();
    z.buffer = buforSzumu;
    z.loop = true;
    const f = audio.createBiquadFilter();
    if (nazwa === 'woda') {
      // pssss
      f.type = 'highpass';
      f.frequency.value = 3000;
    } else {
      // siorb, siorb!
      f.type = 'bandpass';
      f.frequency.value = 500;
      f.Q.value = 2;
      const lfo = audio.createOscillator();
      lfo.frequency.value = 7;
      const lg = audio.createGain();
      lg.gain.value = 250;
      lfo.connect(lg);
      lg.connect(f.frequency);
      zrodla.push(lfo);
    }
    z.connect(f);
    f.connect(g);
    zrodla.push(z);
  } else {
    // lampka cichutko brzęczy
    for (const fr of [520, 523]) {
      const o = audio.createOscillator();
      o.type = 'sine';
      o.frequency.value = fr;
      o.connect(g);
      zrodla.push(o);
    }
  }
  for (const z of zrodla) z.start(t);
  return {
    nazwa,
    ton,
    stop() {
      const t2 = audio.currentTime;
      g.gain.cancelScheduledValues(t2);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t2);
      g.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.08);
      for (const z of zrodla) z.stop(t2 + 0.1);
    },
  };
}

// nazwa = który dźwięk ma teraz grać (null = cisza), mocno = wiertło dotyka ząbka
function ustawPetle(nazwa, mocno = false) {
  if (petla && petla.nazwa !== nazwa) {
    petla.stop();
    petla = null;
  }
  if (!nazwa || wyciszone) {
    if (petla) {
      petla.stop();
      petla = null;
    }
    return;
  }
  if (!petla) {
    if (!audio || audio.state !== 'running') return;
    petla = zacznijPetle(nazwa);
  }
  if (petla.ton) petla.ton.frequency.setTargetAtTime(mocno ? 950 : 700, audio.currentTime, 0.05);
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

// wysokosc: 1 = zwykły głos, 2 = bardzo piskliwy; przerwij = czy przerwać to, co gra teraz mówi
function powiedz(tekst, wysokosc = 1.1, szybkosc = 0.95, przerwij = true) {
  if (wyciszone || !USTAWIENIA.mowa || !('speechSynthesis' in window)) return;
  if (!glosPL) znajdzGlos();
  if (!glosPL) return;   // nie ma polskiego głosu – nic nie mówimy (angielski głos czytałby śmiesznie)
  if (przerwij) window.speechSynthesis.cancel();
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
//   ZAPISYWANIE – ilu pacjentów wyleczono
// =====================================================
function wczytajRekord() {
  try {
    return parseInt(localStorage.getItem(KLUCZ_REKORDU), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord() {
  try {
    localStorage.setItem(KLUCZ_REKORDU, String(wyleczeni));
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

function serduszka(x, y, ile = 3) {
  for (let i = 0; i < ile; i++) {
    dodajEfekt({ typ: 'serce', x: x + losowa(-30, 30), y: y + losowa(-10, 10), vx: losowa(-30, 30), vy: losowa(-150, -90), zycie: losowa(1.2, 1.7), r: losowa(10, 16) });
  }
}

function blysk(x, y, r = 14) {
  dodajEfekt({ typ: 'blysk', x, y, zycie: 0.6, r });
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
      case 'okruch':
        ctx.fillStyle = '#a08a74';
        kolo(e.x, e.y, e.r);
        ctx.fill();
        break;
      case 'blysk':
        rysujIskierke(e.x, e.y, e.r * (0.4 + Math.sin(Math.min(1, e.t / e.zycie) * Math.PI)));
        break;
      case 'resztka':
        rysujEmotke(e.e, e.x, e.y, e.r, e.obrot);
        break;
      case 'serce':
        rysujSerce(e.x, e.y, e.r);
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
    }
    ctx.restore();
  }
}


// =====================================================
//   RZECZY W LOCIE (wyrwany ząbek, naklejka)
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
//   POMOCNICZE
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

// Zwierzak mruga oczkami
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


// =====================================================
//   POCZEKALNIA
// =====================================================
function nowiPacjenci() {
  return PACJENCI.map((def, i) => ({
    def, typ: def.typ, i,
    leczony: false, naklejka: null,
    otw: 0, mina: 'smutek', brwi: true, oczy: 'o', mrug: losowa(1, 4),
    t: losowa(0, 5), skok: 0, przechyl: 0, glaszcze: 0, glaskanie: 0,
  }));
}

function pacjentW(x, y) {
  for (const p of pacjenci) {
    const k = M.krzesla[p.i];
    if (Math.abs(x - k.x) < 78 * M.pS && y > k.y - 240 * M.pS && y < k.y + 24) return p;
  }
  return null;
}

// Głaskanie: przesuń palcem po główce
function glaszcz(x, y, d) {
  for (const p of pacjenci) {
    const k = M.krzesla[p.i];
    const hy = k.y - 160 * M.pS;
    if (!blisko(x, y, k.x, hy, 72 * M.pS)) continue;
    p.glaszcze = 0.4;
    p.glaskanie += d;
    if (p.glaskanie > 110) {
      p.glaskanie = 0;
      serduszka(k.x, hy - 60 * M.pS, 1);
      if (p.typ === 'kotek') dzwiekMruczenia();
      else dzwiekHihi();
    }
  }
}

function aktualizujPoczekalnie(dt) {
  if (wszyscyT >= 0) wszyscyT += dt;
  for (const p of pacjenci) {
    p.t += dt;
    if (p.glaszcze > 0) {
      p.glaszcze -= dt;
      p.oczy = 'w';
      p.przechyl = Math.sin(czas * 5) * 0.14;
    } else {
      mrugaj(p, dt);
      p.przechyl = Math.sin(p.t * 1.4 + p.i) * 0.05;
    }
    p.mina = p.leczony ? 'wielki' : p.glaszcze > 0 ? 'usmiech' : 'smutek';
    p.brwi = !p.leczony && !(p.glaszcze > 0);
    // wszyscy wyleczeni – skaczą z radości po kolei
    if (wszyscyT >= 0 && wszyscyT < 5) {
      const f = (wszyscyT * 0.9 + p.i * 0.18) % 1.2;
      p.skok = f < 0.5 ? Math.sin(f / 0.5 * Math.PI) * 40 : 0;
    } else {
      p.skok = 0;
    }
  }
}

function wrocDoPoczekalni() {
  ustawPetle(null);
  ucisz();
  pacjent = null;
  narz.id = null;
  narz.chwycony = null;
  narz.trzymany = false;
  ekran = 'poczekalnia';
  zaslona = 1;
  efekty = [];
  lecace = [];
  bezczynnosc = 0;
  powtorzone = false;
  ustawNapis('');
  if (pacjenci.every((p) => p.leczony)) {
    wszyscyT = 0;
    konfetti(90);
    dzwiekFanfary();
    powiedz('Hurra! Wszyscy mają zdrowe ząbki! Jesteś super dentystką!');
  } else {
    powiedz('Kto następny? Stuknij w pacjenta.');
  }
}

function nowyDzien() {
  pacjenci = nowiPacjenci();
  wszyscyT = -1;
  zaslona = 1;
  bezczynnosc = 0;
  dzwiekMagii();
  powiedz('Nowy dzień w gabinecie! Kto pierwszy?');
}


// =====================================================
//   WIZYTA – pacjent na fotelu
// =====================================================
// Ząbki pacjenta: brudne, z resztkami jedzenia, czasem z dziurką albo ruszające się
function przygotujZeby(def) {
  const zeby = [];
  for (const gora of [true, false]) {
    for (let k = 0; k < 6; k++) {
      zeby.push({
        gora, k,
        brud: losowa(0.18, 0.32),
        resztka: null, resztkaZycie: 0, resztkaKiw: 0,
        dziurka: 0, wier: 0, plo: 0, lam: 0, kolorPlomby: null,
        rusza: false, wyjety: false, chwycony: false,
        piana: 0, obejrzany: false, znaleziony: false,
        nasiono: 1 + Math.floor(Math.random() * 100000),
        dx: 0, dy: 0, kiwanie: 0,
      });
    }
  }
  // 6 bardzo brudnych ząbków
  potasuj(zeby).slice(0, 6).forEach((z) => { z.brud = losowa(0.65, 1); });
  // ruszający się ząbek – przedni na dole (jak u dzieci!)
  let ruszajacy = null;
  if (Math.random() < USTAWIENIA.szansaNaRuszajacy) {
    ruszajacy = zeby[6 + (Math.random() < 0.5 ? 2 : 3)];
    ruszajacy.rusza = true;
  }
  // dziurki – raczej w bocznych ząbkach (a jak nic się nie rusza, to dziurka jest na pewno)
  let ileDziurek = 0;
  if (Math.random() < USTAWIENIA.szansaNaDziurke || !ruszajacy) ileDziurek = Math.random() < 0.6 ? 1 : 2;
  const boczne = potasuj(zeby.filter((z) => z !== ruszajacy && z.k !== 2 && z.k !== 3));
  boczne.slice(0, ileDziurek).forEach((z) => {
    z.dziurka = 1;
    z.kolorPlomby = KOLORY_PLOMB[Math.floor(Math.random() * KOLORY_PLOMB.length)];
  });
  // resztki jedzenia (a jak są dziurki, to i słodycze!)
  const jedzenie = def.jedzenie.concat(ileDziurek ? SLODYCZE : []);
  potasuj(zeby.filter((z) => z !== ruszajacy)).slice(0, 3).forEach((z) => {
    z.resztka = jedzenie[Math.floor(Math.random() * jedzenie.length)];
    z.resztkaZycie = 1;
    z.brud = Math.max(z.brud, 0.5);
  });
  return zeby;
}

function zacznijWizyte(p) {
  pacjent = {
    p, def: p.def, typ: p.typ,
    otw: 0, otwCel: 0, mina: 'usmiech', brwi: false, oczy: 'o', mrug: 2, oczyNa: null, oczyT: 0,
    woda: 0, naklejka: null, naklejkaLeci: null, naFotelu: true,
    skok: 0, drzenie: 0, przechyl: 0, t: 0,
    zeby: przygotujZeby(p.def),
  };
  kroki = ['aaa', 'lusterko', 'szczoteczka', 'woda', 'ssak'];
  if (pacjent.zeby.some((z) => z.dziurka)) kroki.push('wiertlo', 'plomba', 'lampka');
  if (pacjent.zeby.some((z) => z.rusza)) kroki.push('kleszcze');
  kroki.push('naklejka');
  nrKroku = 0;
  krokSkonczony = false;
  poKroku = 0;
  koniecWizyty = false;
  koniecT = 0;
  nrOgladania = 0;
  powiedzianoDziurke = false;
  powiedzianoRusza = false;
  narz.id = null;
  narz.wraca = false;
  narz.chwycony = null;
  narz.trzymany = false;
  narz.cel = null;
  efekty = [];
  lecace = [];
  ekran = 'fotel';
  zaslona = 1;
  bezczynnosc = 0;
  powtorzone = false;
  ustawNapis(napisDlaKroku('aaa'));
  dzwiekZwierzaka(p.typ);
  powiedz(`Dzień dobry, ${p.def.wolacz}! Otwórz buzię i powiedz aaa!`);
}

function krok() {
  return kroki[nrKroku];
}

function ileDziurek() {
  return pacjent ? pacjent.zeby.filter((z) => z.dziurka).length : 0;
}

function wstawDziurki(t) {
  return t.replace('{dziurke}', ileDziurek() > 1 ? 'dziurki' : 'dziurkę');
}

function nrNarzedzia(id) {
  return NARZEDZIA.findIndex((n) => n.id === id);
}

function polecenieKroku(id) {
  if (id === 'aaa') return 'Stuknij w buzię i powiedz aaa!';
  if (id === 'naklejka') return `Wszystko gotowe! Wybierz naklejkę dla ${pacjent.def.dla}.`;
  return wstawDziurki(NARZEDZIA[nrNarzedzia(id)].polecenie);
}

function napisDlaKroku(id) {
  if (id === 'aaa') return 'Stuknij w buzię';
  if (id === 'naklejka') return 'Wybierz naklejkę';
  return wstawDziurki(NARZEDZIA[nrNarzedzia(id)].napis);
}

function czyKrokGotowy(id) {
  const Z = pacjent.zeby;
  switch (id) {
    case 'aaa': return pacjent.otw > 0.97;
    case 'lusterko': return Z.every((z) => z.obejrzany || z.wyjety);
    case 'szczoteczka': return Z.every((z) => z.wyjety || (z.brud < 0.06 && !z.resztka));
    case 'woda': return Z.every((z) => z.piana < 0.04);
    case 'ssak': return pacjent.woda <= 0.001;
    case 'wiertlo': return Z.every((z) => z.dziurka !== 1);
    case 'plomba': return Z.every((z) => z.dziurka !== 2);
    case 'lampka': return Z.every((z) => z.dziurka !== 3);
    case 'kleszcze': return Z.every((z) => !z.rusza || z.wyjety);
    default: return false;   // naklejkę sprawdzamy, kiedy doleci
  }
}

function sprawdzKrok() {
  if (krokSkonczony || koniecWizyty) return;
  const id = krok();
  if (!czyKrokGotowy(id)) return;
  krokSkonczony = true;
  poKroku = 0;
  if (narz.chwycony) {
    narz.chwycony.chwycony = false;
    narz.chwycony = null;
  }
  if (id === 'aaa') return;
  if (id === 'woda') {
    pacjent.woda = Math.max(pacjent.woda, 0.55);   // żeby było co wyssać
    // ostatnie malutkie bąbelki pękają, żeby nic nie zasłaniało dziurek
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.piana <= 0) return;
      z.piana = 0;
      const e = naEkran(G[i].sx, G[i].sy);
      blysk(e.x, e.y, 10);
    });
  }
  dzwiekBrawo();
  pacjent.oczyNa = 'w';
  pacjent.oczyT = 1.0;
  const c = naEkran(0, USTA.y - 30);
  iskry(c.x, c.y, 10);
}

function nastepnyKrok() {
  odlozNarzedzie();
  nrKroku++;
  krokSkonczony = false;
  poKroku = 0;
  bezczynnosc = 0;
  powtorzone = false;
  const id = krok();
  ustawNapis(napisDlaKroku(id));
  if (id === 'naklejka') {
    // wszystkie ząbki błyszczą!
    dzwiekMagii();
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.wyjety) return;
      const e = naEkran(G[i].sx, G[i].sy);
      setTimeout(() => blysk(e.x, e.y, 16), i * 60);
    });
  }
  powiedz(`${nrKroku === 1 ? 'Szeroko!' : pochwala()} ${polecenieKroku(id)}`);
}

function powiedzAaa() {
  pacjent.otwCel = 1;
  dzwiekAaa(pacjent.def.glos);
  const c = naEkran(118, -92);
  dodajEfekt({ typ: 'napis', tekst: 'Aaaa!', x: c.x, y: c.y, vy: -40, zycie: 1.4, rozmiar: 44, kolor: '#ff5a8a' });
}

function aktualizujPacjenta(dt) {
  const p = pacjent;
  p.t += dt;
  p.otw += (p.otwCel - p.otw) * Math.min(1, dt * 6);
  if (Math.abs(p.otwCel - p.otw) < 0.004) p.otw = p.otwCel;
  p.drzenie *= Math.max(0, 1 - dt * 20);
  if (p.oczyT > 0) {
    p.oczyT -= dt;
    p.oczy = p.oczyNa;
  } else if (koniecWizyty) {
    p.oczy = 'w';
  } else {
    mrugaj(p, dt);
  }
  if (koniecWizyty) {
    koniecT += dt;
    const f = koniecT % 1.3;
    p.skok = koniecT < 4 && f < 0.5 ? Math.sin(f / 0.5 * Math.PI) * 30 : 0;
    if (Math.random() < dt * 2.5) {
      const e = naEkran(losowa(-40, 40), losowa(30, 45));
      blysk(e.x, e.y, 16);
    }
  } else {
    p.skok = 0;
  }
}

function aktualizujZeby(dt) {
  for (const z of pacjent.zeby) {
    z.resztkaKiw = Math.max(0, z.resztkaKiw - dt * 3);
    if (!z.chwycony) {
      const k = Math.max(0, 1 - dt * 12);
      z.dx *= k;
      z.dy *= k;
      z.kiwanie = z.rusza && !z.wyjety ? Math.sin(czas * 14 + z.nasiono) * 0.07 : 0;
    }
  }
}


// =====================================================
//   NARZĘDZIA – branie z tacy i odkładanie
// =====================================================
// Gdzie jest czubek narzędzia leżącego na tacy
function czubekNaTacy(i) {
  const n = NARZEDZIA[i];
  const m = M.taca[i];
  const L = DLUGOSC_NARZEDZIA[n.id] * M.tacaS;
  const t = taca[i];
  const drg = t.trzes > 0 ? Math.sin(czas * 50) * 7 * t.trzes * 2 : 0;
  const hop = t.skacz > 0 ? -Math.abs(Math.sin(czas * 9)) * 16 : 0;
  return { x: m.x + drg + Math.sin(OBROT_NA_TACY) * L / 2, y: m.y + hop - Math.cos(OBROT_NA_TACY) * L / 2 };
}

// Palcem trzymamy rączkę, a czubek jest trochę wyżej (żeby palec go nie zasłaniał)
function przesuniecieCzubka() {
  return wsk.dotyk ? { x: -24, y: -52 } : { x: 0, y: 0 };
}

function ustawCzubek(x, y) {
  const o = przesuniecieCzubka();
  narz.x = x + o.x;
  narz.y = y + o.y;
  narz.cel = null;
}

function wezNarzedzie(i) {
  const n = NARZEDZIA[i];
  const t = czubekNaTacy(i);
  narz.id = n.id;
  narz.x = t.x;
  narz.y = t.y;
  narz.px = t.x;
  narz.py = t.y;
  narz.obrot = OBROT_NA_TACY;
  narz.skala = M.tacaS;
  narz.trzymany = wsk.wcisniety;
  narz.wraca = false;
  narz.cel = wsk.wcisniety ? null : { x: M.gotowe.x, y: M.gotowe.y };
  narz.chwycony = null;
  narz.kolor = null;
  dzwiekChwytu();
}

function odlozNarzedzie() {
  if (!narz.id) return;
  if (narz.chwycony) {
    narz.chwycony.chwycony = false;
    narz.chwycony = null;
  }
  narz.wraca = true;
  narz.trzymany = false;
  narz.cel = null;
  ustawPetle(null);
}

// Wzięte złe narzędzie: drży, a to dobre podskakuje
function zleNarzedzie(i) {
  taca[i].trzes = 0.5;
  dzwiekNieTo();
  const id = krok();
  const j = nrNarzedzia(id);
  if (j >= 0) {
    taca[j].skacz = 1.8;
    powiedz(`Jeszcze nie! Teraz weź ${NARZEDZIA[j].biernik}.`);
  } else if (id === 'aaa') {
    powiedz('Jeszcze nie! Najpierw stuknij w buzię.');
  }
  bezczynnosc = USTAWIENIA.podpowiedzPo - 0.6;   // zaraz pokaże się rączka
}

function dotykTacy(x, y) {
  for (let i = 0; i < NARZEDZIA.length; i++) {
    const m = M.taca[i];
    if (!blisko(x, y, m.x, m.y, 68 * M.tacaS + 14)) continue;
    const n = NARZEDZIA[i];
    if (narz.id === n.id || krokSkonczony) return true;
    if (n.id === krok()) wezNarzedzie(i);
    else zleNarzedzie(i);
    return true;
  }
  return false;
}

// Czy narzędzie teraz pracuje (myje, wierci, świeci...)
function narzedzieDziala() {
  if (!narz.id || narz.wraca || krokSkonczony || koniecWizyty) return false;
  if (narz.y > M.tacaGora - 10) return false;
  return narz.trzymany || (wsk.mysz && wsk.nadPlotnem && !wsk.wcisniety);
}

function aktualizujNarzedzie(dt) {
  for (const t of taca) {
    t.trzes = Math.max(0, t.trzes - dt);
    t.skacz = Math.max(0, t.skacz - dt);
  }
  narz.zacisk += ((narz.chwycony ? 1 : 0) - narz.zacisk) * Math.min(1, dt * 12);
  narz.kreci = false;
  narz.swieci = false;
  narz.naZebie = false;
  if (!narz.id) {
    ustawPetle(null);
    return;
  }
  if (narz.wraca) {
    // narzędzie wraca na tacę
    const t = czubekNaTacy(nrNarzedzia(narz.id));
    const k = Math.min(1, dt * 9);
    narz.x += (t.x - narz.x) * k;
    narz.y += (t.y - narz.y) * k;
    narz.obrot += (OBROT_NA_TACY - narz.obrot) * k;
    narz.skala += (M.tacaS - narz.skala) * k;
    if (Math.hypot(t.x - narz.x, t.y - narz.y) < 4) {
      narz.id = null;
      narz.wraca = false;
    }
    ustawPetle(null);
    return;
  }
  if (narz.cel) {
    const k = Math.min(1, dt * 7);
    narz.x += (narz.cel.x - narz.x) * k;
    narz.y += (narz.cel.y - narz.y) * k;
    if (Math.hypot(narz.cel.x - narz.x, narz.cel.y - narz.y) < 2) narz.cel = null;
  }
  const k = Math.min(1, dt * 10);
  narz.obrot += (OBROT_W_RECE - narz.obrot) * k;
  narz.skala += (M.skalaReki - narz.skala) * k;
  const ruch = Math.hypot(narz.x - narz.px, narz.y - narz.py);
  narz.px = narz.x;
  narz.py = narz.y;
  if (narz.chwycony) {
    ciagnijZab();
    ustawPetle(null);
    return;
  }
  if (!narzedzieDziala()) {
    ustawPetle(null);
    return;
  }
  const dzwiek = DZIALANIE[narz.id](dt, ruch);
  ustawPetle(dzwiek || null, narz.naZebie);
}


// =====================================================
//   CO ROBI KAŻDE NARZĘDZIE
//   (dt – ile sekund minęło, ruch – o ile przesunęło się narzędzie)
//   Funkcja zwraca nazwę dźwięku, który ma grać, albo null.
// =====================================================
const DZIALANIE = {
  // Lusterko: oglądamy każdy ząbek
  lusterko() {
    const L = naLokalne(narz.x, narz.y);
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.obejrzany || z.wyjety) return;
      const g = G[i];
      if (Math.hypot(L.x - g.sx, L.y - g.sy) > 26) return;
      z.obejrzany = true;
      dzwiekOgladania(nrOgladania++);
      const e = naEkran(g.sx, g.sy);
      blysk(e.x, e.y, 12);
      if (z.dziurka === 1 || z.rusza) {
        z.znaleziony = true;
        dzwiekOjej();
        pacjent.oczyNa = 'oo';
        pacjent.oczyT = 0.7;
        if (z.dziurka === 1 && !powiedzianoDziurke) {
          powiedzianoDziurke = true;
          powiedz(ZNALEZIONA_DZIURKA, 1.1, 1, false);
        } else if (z.rusza && !powiedzianoRusza) {
          powiedzianoRusza = true;
          powiedz(ZNALEZIONY_RUSZAJACY, 1.1, 1, false);
        }
      }
    });
    return null;
  },

  // Szczoteczka: szoruj, szoruj! Brud znika, robi się piana, resztki odpadają
  szczoteczka(dt, ruch) {
    if (ruch < 0.5) return null;
    const L = naLokalne(narz.x, narz.y);
    const G = geometrie();
    let dotyka = false;
    pacjent.zeby.forEach((z, i) => {
      if (z.wyjety) return;
      const g = G[i];
      if (Math.hypot(L.x - g.sx, L.y - g.sy) > 30) return;
      dotyka = true;
      const byl = z.brud >= 0.06;
      z.brud = Math.max(0, z.brud - ruch * 0.0045);
      z.piana = Math.min(1, z.piana + ruch * 0.004);
      if (byl && z.brud < 0.06) {
        z.brud = 0;
        dzwiekCzysty();
        const e = naEkran(g.sx, g.sy);
        blysk(e.x, e.y, 14);
      }
      if (z.resztka) {
        z.resztkaZycie -= ruch * 0.006;
        z.resztkaKiw = 1;
        if (z.resztkaZycie <= 0) odpadnijResztka(z, g);
      }
    });
    if (dotyka) {
      narz.szur += ruch;
      if (narz.szur > 50) {
        narz.szur = 0;
        dzwiekSzczotki();
      }
      // łaskocze!
      narz.laskotki += ruch;
      if (narz.laskotki > 900) {
        narz.laskotki = 0;
        dzwiekHihi();
        pacjent.oczyNa = 'w';
        pacjent.oczyT = 0.6;
      }
    }
    return null;
  },

  // Woda: spłukuje pianę, a woda zbiera się w buzi
  woda(dt) {
    const L = naLokalne(narz.x, narz.y);
    if (!wBuzi(L, 1.3)) return null;
    narz.krople += dt;
    const dno = naEkran(0, USTA.y + USTA.ry * pacjent.otw * 0.8).y;
    while (narz.krople > 0.025) {
      narz.krople -= 0.025;
      dodajEfekt({ typ: 'kropla', x: narz.x + losowa(-3, 3), y: narz.y + 4, vx: losowa(-70, 70), vy: losowa(80, 200), g: 900, zycie: 0.8, r: losowa(3, 5.5), kolor: 'rgba(100, 180, 255, 0.85)', doY: dno });
    }
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.piana <= 0) return;
      const g = G[i];
      if (Math.hypot(L.x - g.sx, L.y - g.sy) < 36) z.piana = Math.max(0, z.piana - dt * 1.5);
    });
    pacjent.woda = Math.min(1, pacjent.woda + dt * 0.2);
    return 'woda';
  },

  // Ssak: wysysa wodę z buzi
  ssak(dt) {
    const L = naLokalne(narz.x, narz.y);
    if (!wBuzi(L, 1.3)) return null;
    if (pacjent.woda > 0) {
      const nizej = L.y > USTA.y;
      pacjent.woda = Math.max(0, pacjent.woda - dt * (nizej ? 0.42 : 0.28));
      if (Math.random() < dt * 30) {
        const ry = USTA.ry * pacjent.otw;
        const gora = USTA.y + ry - ry * 1.15 * pacjent.woda;
        const p = naEkran(losowa(-50, 50), gora);
        dodajEfekt({ typ: 'kropla', x: p.x, y: p.y, vx: (narz.x - p.x) * 3.2, vy: (narz.y - p.y) * 3.2, zycie: 0.3, r: losowa(3, 5), kolor: 'rgba(100, 180, 255, 0.85)' });
      }
    }
    return 'ssak';
  },

  // Wiertło: czyści czarną dziurkę
  wiertlo(dt) {
    const L = naLokalne(narz.x, narz.y);
    if (!wBuzi(L, 1.3)) return null;
    narz.kreci = true;
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.dziurka !== 1) return;
      const d = miejsceDziurki(G[i]);
      if (Math.hypot(L.x - d.x, L.y - d.y) > 20) return;
      narz.naZebie = true;
      z.wier = Math.min(1, z.wier + dt / USTAWIENIA.czasWiercenia);
      const e = naEkran(d.x, d.y);
      if (Math.random() < dt * 35) {
        dodajEfekt({ typ: 'okruch', x: e.x, y: e.y, vx: losowa(-150, 150), vy: losowa(-220, -60), g: 800, zycie: 0.5, r: losowa(2, 3.5) });
      }
      if (z.wier >= 1) {
        z.dziurka = 2;
        z.plo = 0;
        dzwiekDing();
        iskry(e.x, e.y, 8);
      }
    });
    if (narz.naZebie) {
      // pacjent jest dzielny i zaciska oczka
      pacjent.oczyNa = 'k';
      pacjent.oczyT = 0.25;
      pacjent.drzenie = Math.sin(czas * 60) * 1.5;
    }
    return 'wiertlo';
  },

  // Plomba: zalepia wyczyszczoną dziurkę kolorową pastą
  plomba(dt) {
    const L = naLokalne(narz.x, narz.y);
    const G = geometrie();
    const nastepny = pacjent.zeby.find((z) => z.dziurka === 2);
    if (nastepny) narz.kolor = nastepny.kolorPlomby;
    pacjent.zeby.forEach((z, i) => {
      if (z.dziurka !== 2) return;
      const d = miejsceDziurki(G[i]);
      if (Math.hypot(L.x - d.x, L.y - d.y) > 20) return;
      narz.kolor = z.kolorPlomby;
      if (z.plo === 0) dzwiekPlomby();
      z.plo = Math.min(1, z.plo + dt / USTAWIENIA.czasPlomby);
      if (z.plo >= 1) {
        z.dziurka = 3;
        z.lam = 0;
        dzwiekPyk();
        const e = naEkran(d.x, d.y);
        iskry(e.x, e.y, 6);
      }
    });
    return null;
  },

  // Lampka: niebieskie światło utwardza plombę
  lampka(dt) {
    narz.swieci = true;
    const L = naLokalne(narz.x, narz.y);
    if (!wBuzi(L, 1.4)) return null;
    const G = geometrie();
    pacjent.zeby.forEach((z, i) => {
      if (z.dziurka !== 3) return;
      const d = miejsceDziurki(G[i]);
      if (Math.hypot(L.x - d.x, L.y - d.y) > 26) return;
      narz.naZebie = true;
      z.lam = Math.min(1, z.lam + dt / USTAWIENIA.czasLampki);
      if (z.lam >= 1) {
        z.dziurka = 4;
        dzwiekDing();
        const e = naEkran(d.x, d.y);
        iskry(e.x, e.y, 12);
      }
    });
    return 'lampka';
  },

  // Kleszcze działają inaczej: łapiesz ząbek i ciągniesz (patrz niżej)
  kleszcze() {
    return null;
  },
};

function odpadnijResztka(z, g) {
  const e = naEkran(g.kx + g.w * 0.35, g.ky - g.ny * 5);
  dodajEfekt({ typ: 'resztka', e: z.resztka, x: e.x, y: e.y, vx: losowa(-220, 220), vy: losowa(-380, -220), g: 1300, zycie: 1.1, r: 18 * M.g.s, wir: losowa(-10, 10) });
  z.resztka = null;
  dzwiekPyk();
}

// Kleszcze: złap ruszający się ząbek
function sprobujChwycic() {
  if (narz.id !== 'kleszcze' || krokSkonczony) return;
  const L = naLokalne(narz.x, narz.y);
  const G = geometrie();
  pacjent.zeby.forEach((z, i) => {
    if (narz.chwycony || !z.rusza || z.wyjety) return;
    if (Math.hypot(L.x - G[i].sx, L.y - G[i].sy) > 26) return;
    narz.chwycony = z;
    z.chwycony = true;
    narz.startX = narz.x;
    narz.startY = narz.y;
    narz.skrzyp = 0;
    dzwiekKleszczy();
  });
}

// ...i ciągnij, aż wyskoczy!
function ciagnijZab() {
  const z = narz.chwycony;
  const vx = (narz.x - narz.startX) / M.g.s;
  const vy = (narz.y - narz.startY) / M.g.s;
  const d = Math.hypot(vx, vy);
  const k = d > 14 ? 14 / d : 1;
  z.dx = vx * k;
  z.dy = vy * k;
  z.kiwanie = Math.sin(czas * 40) * 0.14 * Math.min(1, d / 40);
  pacjent.oczyNa = 'k';
  pacjent.oczyT = 0.2;
  if (d - narz.skrzyp > 8) {
    narz.skrzyp = d;
    dzwiekSkrzypu();
  }
  if (d < narz.skrzyp - 8) narz.skrzyp = d;
  if (d > 45) wyrwijZab(z);
}

function wyrwijZab(z) {
  const g = geometriaZeba(pacjent.typ, z, pacjent.otw);
  const start = naEkran(g.sx + z.dx, g.sy + z.dy);
  z.wyjety = true;
  z.chwycony = false;
  z.dx = 0;
  z.dy = 0;
  z.kiwanie = 0;
  narz.chwycony = null;
  dzwiekWyrwania();
  iskry(start.x, start.y, 14);
  pacjent.oczyNa = 'oo';
  pacjent.oczyT = 0.9;
  const P = M.pudelko;
  const wielkosc = 13 * M.g.s;
  rzuc(start.x, start.y, P.x, P.y - 20 * P.s, 220, 0.9,
    (x, y, p) => rysujIkoneZeba(x, y, wielkosc * (1 - p * 0.4), 'wesoly'),
    () => {
      zabkiWPudelku++;
      dzwiekPlum();
      iskry(P.x, P.y - 20 * P.s, 10);
    });
}

// Gdzie teraz trzeba użyć narzędzia (dla podpowiedzi)
function celNarzedzia(id) {
  const Z = pacjent.zeby;
  const G = geometrie();
  let wybor = -1;
  if (id === 'lusterko') {
    wybor = Z.findIndex((z) => !z.obejrzany && !z.wyjety);
  } else if (id === 'szczoteczka') {
    let naj = -1;
    Z.forEach((z, i) => {
      const w = z.brud + (z.resztka ? 1 : 0);
      if (!z.wyjety && (z.brud >= 0.06 || z.resztka) && w > naj) {
        naj = w;
        wybor = i;
      }
    });
  } else if (id === 'woda') {
    let naj = 0.04;
    Z.forEach((z, i) => {
      if (z.piana > naj) {
        naj = z.piana;
        wybor = i;
      }
    });
  } else if (id === 'ssak') {
    return naEkran(0, USTA.y + USTA.ry * pacjent.otw * 0.6);
  } else if (id === 'wiertlo' || id === 'plomba' || id === 'lampka') {
    const stan = { wiertlo: 1, plomba: 2, lampka: 3 }[id];
    wybor = Z.findIndex((z) => z.dziurka === stan);
    if (wybor >= 0) {
      const d = miejsceDziurki(G[wybor]);
      return naEkran(d.x, d.y);
    }
  } else if (id === 'kleszcze') {
    wybor = Z.findIndex((z) => z.rusza && !z.wyjety);
  }
  if (wybor < 0) return null;
  const e = naEkran(G[wybor].sx, G[wybor].sy);
  e.gora = Z[wybor].gora;
  return e;
}


// =====================================================
//   NAKLEJKA – nagroda dla dzielnego pacjenta
// =====================================================
function wybierzNaklejke(i) {
  if (krok() !== 'naklejka' || pacjent.naklejka || pacjent.naklejkaLeci) return;
  const e = NAKLEJKI[i];
  const m = M.naklejki[i];
  pacjent.naklejkaLeci = e;
  dzwiekKlik();
  const cel = naEkran(-84, 26);
  const r0 = M.rNaklejki;
  const r1 = 22 * M.g.s;
  rzuc(m.x, m.y, cel.x, cel.y, 160, 0.7,
    (x, y, p) => rysujNaklejke(e, x, y, r0 + (r1 - r0) * p, -0.25 * p),
    () => przyklejNaklejke(e));
}

function dotykNaklejek(x, y) {
  for (let i = 0; i < NAKLEJKI.length; i++) {
    const m = M.naklejki[i];
    if (blisko(x, y, m.x, m.y, M.rNaklejki + 12)) {
      wybierzNaklejke(i);
      return;
    }
  }
}

function przyklejNaklejke(e) {
  if (!pacjent) return;
  const p = pacjent;
  p.naklejka = e;
  p.naklejkaLeci = null;
  dzwiekNaklejki();
  koniecWizyty = true;
  koniecT = 0;
  krokSkonczony = true;
  p.otwCel = 0;
  p.mina = 'wielki';
  p.oczyT = 0;
  dzwiekFanfary();
  setTimeout(() => dzwiekZwierzaka(p.typ), 700);
  konfetti(70);
  const c = naEkran(0, -60);
  serduszka(c.x, c.y, 6);
  wyleczeni++;
  zapiszRekord();
  p.p.leczony = true;
  p.p.naklejka = e;
  ustawNapis(`${p.def.nazwa} ma zdrowe ząbki!`);
  powiedz(`Brawo! ${p.def.nazwa} ma zdrowe ząbki!`);
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
  if (ekran === 'poczekalnia') window.location.href = '../index.html';
  else wrocDoPoczekalni();
}

function przelaczDzwiek() {
  wyciszone = !wyciszone;
  if (wyciszone) {
    ucisz();
    ustawPetle(null);
  }
}

function rysujGornePrzyciski() {
  rysujPrzyciskOkragly(52, 52, 38, ekran === 'poczekalnia' ? '🏠' : '🚪', '#ffffff', czyWcisniety('wroc'));
  dodajPrzycisk('wroc', 52, 52, 90, 90, wroc);
  rysujPrzyciskOkragly(V.w - 52, 52, 38, wyciszone ? '🔇' : '🔊', '#ffffff', czyWcisniety('dzwiek'));
  dodajPrzycisk('dzwiek', V.w - 52, 52, 90, 90, przelaczDzwiek);
}


// =====================================================
//   RYSOWANIE EKRANÓW
// =====================================================
function rysujEkranPoczekalni() {
  if (M.okno) rysujOkno(M.okno.x, M.okno.y, M.okno.w, M.okno.h);
  if (M.plakatP) rysujPlakat(M.plakatP.x, M.plakatP.y, M.plakatP.s);
  rysujSzyld(M.szyld.x, M.szyld.y, M.szyld.s);
  for (const p of pacjenci) {
    const k = M.krzesla[p.i];
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    elipsa(k.x, k.y + 72 * M.pS, 80 * M.pS, 12 * M.pS);
    ctx.fill();
    rysujKrzeslo(k.x, k.y, M.pS, KOLORY_KRZESEL[p.i]);
  }
  for (const p of pacjenci) {
    const k = M.krzesla[p.i];
    rysujPacjentaWPoczekalni(p, k.x, k.y, M.pS);
    const hx = k.x;
    const hy = k.y - (160 * M.pS) - p.skok;
    if (!p.leczony) {
      // w chmurce: ząbek, który boli
      const bob = Math.sin(czas * 2 + p.i) * 4;
      rysujChmurke(hx + 74 * M.pS, hy - 96 * M.pS + bob, 32 * M.pS, (x, y, r) => rysujIkoneZeba(x, y + 2, r * 0.62, 'smutek'));
    } else {
      rysujIskierke(hx + 26 * M.pS, hy + 18 * M.pS, 9 * M.pS * (0.6 + 0.4 * Math.sin(czas * 4 + p.i)));
    }
  }
  if (pacjenci.every((p) => p.leczony)) {
    const n = M.nowyDzien;
    rysujPrzyciskTekst(n.x, n.y, 380, 80, 'Nowy dzień ☀', '#ffb703', 32, czyWcisniety('dzien'));
    dodajPrzycisk('dzien', n.x, n.y, 380, 88, nowyDzien);
  }
  // licznik wyleczonych
  if (wyleczeni > 0) {
    const y = M.szyld.y + (V.pion ? 75 : 70);
    const tekst = `Wyleczeni pacjenci: ${wyleczeni}`;
    ctx.font = `bold 22px ${CZCIONKA}`;
    const tw = ctx.measureText(tekst).width;
    rysujIkoneZeba(V.w / 2 - tw / 2 - 6, y, 11, 'wesoly');
    napis(tekst, V.w / 2 + 12, y, 22, '#7a5bd6');
  }
}

function rysujEkranFotela() {
  const G = M.g;
  const p = pacjent;
  const gy = glowaY();
  const gx = G.x + p.drzenie * G.s;
  // gabinet
  rysujPlakat(M.plakat.x, M.plakat.y, M.plakat.s);
  ctx.fillStyle = 'rgba(255, 246, 200, 0.3)';
  ctx.beginPath();
  ctx.moveTo(M.lampa.x + 20 * M.lampa.s, M.lampa.y + 20 * M.lampa.s);
  ctx.lineTo(G.x - 70 * G.s, G.y + 110 * G.s);
  ctx.lineTo(G.x + 80 * G.s, G.y - 50 * G.s);
  ctx.closePath();
  ctx.fill();
  rysujLampeGabinetu(M.lampa.x, M.lampa.y, M.lampa.s);
  rysujPudelko(M.pudelko.x, M.pudelko.y, M.pudelko.s, zabkiWPudelku);
  // fotel i pacjent
  rysujFotelDentystyczny(G.x, G.y, G.s);
  rysujCialoNaFotelu(p, gx, gy, G.s);
  rysujGlowe(p, gx, gy, G.s);
  rysujPowiekszenie(gx, gy);
  // taca, naklejki albo przycisk „Następny pacjent”
  if (koniecWizyty) {
    if (koniecT > 1) {
      const s = sprezyna(Math.min(1, (koniecT - 1) * 3));
      ctx.save();
      ctx.translate(V.w / 2, M.tacaY);
      ctx.scale(s, s);
      rysujPrzyciskTekst(0, 0, 480, 88, 'Następny pacjent ▶', '#3ddc97', 34, czyWcisniety('dalej'));
      ctx.restore();
      dodajPrzycisk('dalej', V.w / 2, M.tacaY, 480, 96, wrocDoPoczekalni);
    }
  } else if (krok() === 'naklejka') {
    rysujArkuszNaklejek();
  } else {
    rysujTaceZNarzedziami();
  }
  if (narz.id) rysujNarzedzieWRece();
  rysujPasek();
}

// Lusterko pokazuje ząbki powiększone
function rysujPowiekszenie(gx, gy) {
  narz.zoom = false;
  if (narz.id !== 'lusterko' || narz.wraca) return;
  const L = naLokalne(narz.x, narz.y);
  if (Math.abs(L.x) > 125 || Math.abs(L.y) > 120) return;
  narz.zoom = true;
  const r = 20 * narz.skala;
  ctx.save();
  kolo(narz.x, narz.y, r);
  ctx.clip();
  ctx.fillStyle = '#e3f6f3';
  ctx.fillRect(narz.x - r, narz.y - r, r * 2, r * 2);
  ctx.translate(narz.x, narz.y);
  ctx.scale(1.8, 1.8);
  ctx.translate(-narz.x, -narz.y);
  rysujGlowe(pacjent, gx, gy, M.g.s);
  ctx.restore();
}

function rysujTaceZNarzedziami() {
  rysujTace(V.w / 2, M.tacaY, M.tacaW, M.tacaH);
  NARZEDZIA.forEach((n, i) => {
    const m = M.taca[i];
    const t = taca[i];
    const r = 58 * M.tacaS + 6;
    ctx.fillStyle = n.kolor + '26';
    kolo(m.x, m.y, r);
    ctx.fill();
    if (t.skacz > 0) {
      ctx.strokeStyle = `rgba(255, 190, 40, ${0.55 + 0.45 * Math.sin(czas * 10)})`;
      ctx.lineWidth = 6;
      kolo(m.x, m.y, r + 4);
      ctx.stroke();
    }
    if (narz.id === n.id) {
      // narzędzie jest w ręce – zostało puste miejsce
      ctx.strokeStyle = n.kolor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      kolo(m.x, m.y, r - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const c = czubekNaTacy(i);
    rysujNarzedzie(n.id, c.x, c.y, M.tacaS, OBROT_NA_TACY, { kolor: KOLORY_PLOMB[0] });
  });
}

function rysujArkuszNaklejek() {
  rysujTace(V.w / 2, M.tacaY, M.tacaW, M.tacaH);
  NAKLEJKI.forEach((e, i) => {
    const m = M.naklejki[i];
    const hop = Math.sin(czas * 3 + i) * 3;
    rysujNaklejke(e, m.x, m.y + hop, M.rNaklejki, Math.sin(i * 2.3) * 0.15);
  });
}

function rysujNarzedzieWRece() {
  let x = narz.x;
  let y = narz.y;
  if (narz.chwycony) {
    // kleszcze trzymają ząbek
    const z = narz.chwycony;
    const g = geometriaZeba(pacjent.typ, z, pacjent.otw);
    const e = naEkran(g.sx + z.dx, g.sy + z.dy);
    x = e.x;
    y = e.y;
  }
  if (Z_KABLEM.includes(narz.id)) {
    const m = M.taca[nrNarzedzia(narz.id)];
    const k = koniecNarzedzia(narz.id, x, y, narz.skala, narz.obrot);
    rysujPrzewod(m.x, M.tacaGora + 16, k.x, k.y);
  }
  if (narz.swieci) rysujSwiatloLampki(x, y, 30 * narz.skala + 20);
  rysujNarzedzie(narz.id, x, y, narz.skala, narz.obrot, {
    zoom: narz.zoom, kreci: narz.kreci, swieci: narz.swieci,
    kolor: narz.kolor || KOLORY_PLOMB[0], zacisk: narz.zacisk,
  });
}

// Mały obrazek kroku na pasku u góry
function rysujIkoneKroku(id, r) {
  if (id === 'aaa') {
    ctx.fillStyle = '#7a2230';
    elipsa(0, 2, r * 0.62, r * 0.5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.2);
    ctx.fillStyle = '#ff6f8a';
    elipsa(0, r * 0.3, r * 0.32, r * 0.15);
    ctx.fill();
    return;
  }
  if (id === 'naklejka') {
    rysujGwiazdke(0, 0, r * 0.66, true);
    return;
  }
  const L = DLUGOSC_NARZEDZIA[id];
  const s = (r * 1.9) / L;
  const ob = -0.78;
  rysujNarzedzie(id, Math.sin(ob) * L * s / 2, -Math.cos(ob) * L * s / 2, s, ob, { kolor: KOLORY_PLOMB[0] });
}

// Pasek z krokami (kolejność narzędzi) i napis, co teraz robić
function rysujPasek() {
  if (koniecWizyty) {
    const s = sprezyna(Math.min(1, koniecT * 2.5));
    ctx.save();
    ctx.translate(V.w / 2, M.pasekY + 14);
    ctx.scale(s, s);
    napis('Brawo!', 0, 0, 62, '#ff5a8a', 'center', '#ffffff');
    for (const sx of [-1, 1]) rysujGwiazdke(sx * 150, 2, 30, true);
    ctx.restore();
  } else {
    const n = kroki.length;
    const odst = Math.min(60, (V.w - 260) / n);
    const r = Math.min(24, odst * 0.42);
    const x0 = V.w / 2 - (n - 1) * odst / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    zaokraglony(x0 - odst / 2 - 6, M.pasekY - r - 10, (n - 1) * odst + odst + 12, r * 2 + 20, r + 10);
    ctx.fill();
    kroki.forEach((id, i) => {
      const x = x0 + i * odst;
      const y = M.pasekY;
      const teraz = i === nrKroku;
      const zrobione = i < nrKroku || (teraz && krokSkonczony);
      const s = teraz && !zrobione ? 1.15 + Math.sin(czas * 5) * 0.06 : 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = zrobione ? '#c9f5e1' : '#ffffff';
      kolo(0, 0, r);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = teraz && !zrobione ? '#ff9f1c' : zrobione ? '#3ddc97' : 'rgba(0, 0, 0, 0.1)';
      ctx.stroke();
      ctx.globalAlpha = i > nrKroku ? 0.5 : 1;
      rysujIkoneKroku(id, r);
      ctx.restore();
      if (zrobione) {
        // ptaszek: zrobione!
        ctx.fillStyle = '#3ddc97';
        kolo(x + r * 0.7, y + r * 0.7, r * 0.42);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y + r * 0.72);
        ctx.lineTo(x + r * 0.66, y + r * 0.86);
        ctx.lineTo(x + r * 0.9, y + r * 0.56);
        ctx.stroke();
      }
    });
  }
  if (napisKroku) {
    ctx.font = `bold 28px ${CZCIONKA}`;
    const tw = ctx.measureText(napisKroku).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    zaokraglony(V.w / 2 - tw / 2 - 22, M.napisY - 22, tw + 44, 44, 22);
    ctx.fill();
    napis(napisKroku, V.w / 2, M.napisY + 1, 28, '#1f7a70');
  }
}


// =====================================================
//   PODPOWIEDŹ – rączka pokazuje, co zrobić
// =====================================================
function obecnaPodpowiedz() {
  if (zaslona > 0) return null;
  if (ekran === 'poczekalnia') {
    const p = pacjenci.find((q) => !q.leczony);
    if (!p) return { typ: 'stuk', x: M.nowyDzien.x, y: M.nowyDzien.y };
    const k = M.krzesla[p.i];
    return { typ: 'stuk', x: k.x, y: k.y - 150 * M.pS };
  }
  if (!pacjent) return null;
  if (koniecWizyty) return koniecT > 2.5 ? { typ: 'stuk', x: V.w / 2, y: M.tacaY } : null;
  if (krokSkonczony) return null;
  const id = krok();
  if (id === 'aaa') {
    const c = naEkran(0, 40);
    return { typ: 'stuk', x: c.x, y: c.y };
  }
  if (id === 'naklejka') {
    if (pacjent.naklejkaLeci) return null;
    const m = M.naklejki[0];
    return { typ: 'stuk', x: m.x, y: m.y };
  }
  if (narz.id !== id || narz.wraca) {
    const m = M.taca[nrNarzedzia(id)];
    return { typ: 'stuk', x: m.x, y: m.y };
  }
  const cel = celNarzedzia(id);
  if (!cel) return null;
  // palec trzymamy trochę niżej niż czubek narzędzia
  const o = przesuniecieCzubka();
  const x = cel.x - o.x;
  const y = cel.y - o.y;
  if (id === 'kleszcze') return { typ: 'ciagnij', x, y, x2: x, y2: y + (cel.gora ? -1 : 1) * 120 };
  if (id === 'szczoteczka' || id === 'lusterko' || id === 'woda') return { typ: 'tam', x, y, dx: 26, dy: 0 };
  return { typ: 'trzymaj', x, y };
}

function rysujPodpowiedz() {
  if (bezczynnosc < USTAWIENIA.podpowiedzPo || wsk.wcisniety) return;
  const p = obecnaPodpowiedz();
  if (!p) return;
  const t = bezczynnosc - USTAWIENIA.podpowiedzPo;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 3);
  switch (p.typ) {
    case 'stuk': {
      const f = (t * 1.1) % 1;
      const wc = f > 0.35 && f < 0.6;
      rysujRaczke(p.x, p.y - (wc ? 0 : 20 * Math.sin(f * Math.PI)), wc);
      break;
    }
    case 'trzymaj': {
      const f = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(255, 159, 28, ${0.4 + 0.4 * f})`;
      ctx.lineWidth = 5;
      kolo(p.x, p.y, 30 + f * 10);
      ctx.stroke();
      rysujRaczke(p.x, p.y, true);
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
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.strokeStyle = '#ff9f1c';
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -czas * 40;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
      ctx.restore();
      rysujRaczke(x, y, f > 0.07 && f < 0.75);
      break;
    }
    case 'tam': {
      const s = Math.sin(t * 5);
      rysujRaczke(p.x + (p.dx || 0) * s, p.y + (p.dy || 0) * s, true);
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
  aktualizujLecace(dt);
  if (ekran === 'poczekalnia') {
    aktualizujPoczekalnie(dt);
  } else if (pacjent) {
    aktualizujPacjenta(dt);
    aktualizujZeby(dt);
    aktualizujNarzedzie(dt);
    sprawdzKrok();
    if (krokSkonczony && !koniecWizyty) {
      poKroku += dt;
      const id = krok();
      const czekaj = id === 'aaa' ? 0.4 : id === 'lusterko' ? 1.8 : 1.1;
      if (poKroku > czekaj) nastepnyKrok();
    }
  }
  // długo nic się nie dzieje – gra jeszcze raz mówi, co robić
  if (!powtorzone && bezczynnosc > USTAWIENIA.powtorzPo) {
    powtorzone = true;
    if (ekran === 'poczekalnia' && pacjenci.some((p) => !p.leczony)) {
      powiedz('Stuknij w pacjenta, którego chcesz wyleczyć.');
    } else if (ekran === 'fotel' && pacjent && !krokSkonczony && !koniecWizyty) {
      powiedz(polecenieKroku(krok()));
    }
  }
}

function rysuj() {
  ekranowe();
  const pas = 56 * V.s;
  if (ekran === 'poczekalnia') rysujScianePoczekalni(V.W, V.H, V.oy + M.podloga * V.s, pas);
  else rysujScianeGabinetu(V.W, V.H, V.oy + (M.tacaGora + 30) * V.s, pas);
  wirtualne();
  przyciski = [];
  if (ekran === 'poczekalnia') rysujEkranPoczekalni();
  else if (pacjent) rysujEkranFotela();
  rysujEfekty();
  rysujLecace();
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
function dotykFotel(x, y) {
  if (koniecWizyty) return;
  const id = krok();
  if (id === 'naklejka') {
    dotykNaklejek(x, y);
    return;
  }
  if (y > M.tacaGora - 10 && dotykTacy(x, y)) return;
  if (narz.id && !narz.wraca) {
    // narzędzie idzie tam, gdzie palec
    ustawCzubek(x, y);
    narz.px = narz.x;
    narz.py = narz.y;
    narz.trzymany = true;
    if (narz.id === 'kleszcze') sprobujChwycic();
    return;
  }
  // bez narzędzia w ręce
  const L = naLokalne(x, y);
  const naGlowie = (L.x / 125) ** 2 + (L.y / 115) ** 2 < 1;
  if (id === 'aaa') {
    if (naGlowie && pacjent.otwCel === 0) powiedzAaa();
    return;
  }
  if (naGlowie && !krokSkonczony) {
    // stuknięcie w buzię bez narzędzia – podpowiadamy, co wziąć
    const j = nrNarzedzia(id);
    if (j >= 0) {
      taca[j].skacz = 1.6;
      dzwiekKlik();
      powiedz(`Weź ${NARZEDZIA[j].biernik} z tacy.`);
    }
  }
}

plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (wsk.wcisniety && wsk.id !== e.pointerId) return;   // drugi palec nie przeszkadza
  wsk.mysz = e.pointerType === 'mouse';
  wsk.dotyk = !wsk.mysz;
  wsk.nadPlotnem = true;
  const p = naWirtualne(e);
  wsk.x = p.x;
  wsk.y = p.y;
  wsk.wcisniety = true;
  wsk.id = e.pointerId;
  wsk.droga = 0;
  wsk.kandydat = null;
  bezczynnosc = 0;
  powtorzone = false;
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
  if (ekran === 'poczekalnia') {
    wsk.kandydat = pacjentW(p.x, p.y);
  } else if (ekran === 'fotel' && pacjent) {
    dotykFotel(p.x, p.y);
  }
});

plotno.addEventListener('pointermove', (e) => {
  const p = naWirtualne(e);
  wsk.nadPlotnem = true;
  if (!wsk.wcisniety) {
    // myszka bez wciśnięcia: narzędzie idzie za kursorem
    if (e.pointerType === 'mouse') {
      wsk.mysz = true;
      wsk.dotyk = false;
      if (Math.hypot(p.x - wsk.x, p.y - wsk.y) > 0.5) bezczynnosc = 0;
      wsk.x = p.x;
      wsk.y = p.y;
      if (ekran === 'fotel' && narz.id && !narz.wraca && !narz.chwycony) ustawCzubek(p.x, p.y);
    }
    return;
  }
  if (e.pointerId !== wsk.id) return;
  const d = Math.hypot(p.x - wsk.x, p.y - wsk.y);
  wsk.x = p.x;
  wsk.y = p.y;
  wsk.droga += d;
  bezczynnosc = 0;
  if (ekran === 'poczekalnia') {
    glaszcz(p.x, p.y, d);
  } else if (ekran === 'fotel' && narz.id && !narz.wraca && narz.trzymany) {
    ustawCzubek(p.x, p.y);
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
  if (ekran === 'poczekalnia') {
    // stuknięcie (a nie głaskanie) w pacjenta – zapraszamy na fotel
    const k = wsk.kandydat;
    wsk.kandydat = null;
    if (!anulowane && k && wsk.droga < 30 && pacjentW(p.x, p.y) === k && zaslona < 0.3) zacznijWizyte(k);
    return;
  }
  if (narz.chwycony) {
    // puszczony ząbek wraca na miejsce
    narz.chwycony.chwycony = false;
    narz.chwycony = null;
  }
  if (narz.trzymany) {
    narz.trzymany = false;
    // odłożone na tacę? to czeka obok buzi
    if (narz.id && !narz.wraca && !wsk.mysz && narz.y > M.tacaGora - 40) {
      narz.cel = { x: M.gotowe.x, y: M.gotowe.y };
    }
  }
}

plotno.addEventListener('pointerup', (e) => puscPalec(e, false));
plotno.addEventListener('pointercancel', (e) => puscPalec(e, true));
plotno.addEventListener('pointerleave', () => {
  if (!wsk.wcisniety) wsk.nadPlotnem = false;
});
plotno.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  const nr = parseInt(e.key, 10);
  const enter = e.code === 'Space' || e.code === 'Enter';
  if (e.code === 'KeyM') {
    przelaczDzwiek();
  } else if (e.code === 'Escape' || e.code === 'KeyQ') {
    wroc();
  } else if (ekran === 'poczekalnia') {
    if (nr >= 1 && nr <= pacjenci.length) zacznijWizyte(pacjenci[nr - 1]);
    else if (enter && pacjenci.every((p) => p.leczony)) nowyDzien();
  } else if (ekran === 'fotel' && pacjent) {
    if (koniecWizyty) {
      if (enter && koniecT > 1) wrocDoPoczekalni();
      return;
    }
    const id = krok();
    if (id === 'aaa' && enter && pacjent.otwCel === 0) powiedzAaa();
    else if (id === 'naklejka' && nr >= 1 && nr <= NAKLEJKI.length) wybierzNaklejke(nr - 1);
    else if (id !== 'naklejka' && nr >= 1 && nr <= NARZEDZIA.length) dotykTacy(M.taca[nr - 1].x, M.taca[nr - 1].y);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    ucisz();
    ustawPetle(null);
  }
});

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   START
// =====================================================
pacjenci = nowiPacjenci();
dopasujRozmiar();
requestAnimationFrame(klatka);
