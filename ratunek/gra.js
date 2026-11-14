'use strict';

// =====================================================
//   NA RATUNEK! – przygoda Helenki, Seweryna i Franka
//   Pomysł: Seweryn
// =====================================================
//
//  Zły czarodziej Gburek porywa przyjaciół i zamyka ich w klatkach.
//  W każdym etapie porwany jest ktoś inny. Wybierz, kto z pozostałej
//  dwójki idzie na ratunek, dobiegnij do klatki i uwolnij przyjaciela!
//
//  Każdy bohater ma swoją supermoc:
//   - Helenka: podwójny skok – w powietrzu może skoczyć jeszcze raz,
//   - Seweryn: biega najszybciej, a rozpędzony biegnie nawet po wodzie,
//   - Franek: skacze najwyżej i rozbija cegły głową.
//
//  W każdym etapie są 3 gwiazdki. Niektóre zdobędzie tylko jeden bohater!
//
//  Po drodze można znaleźć:
//   - plecak rakietowy: trzymaj skok w powietrzu i leć (aż skończy się paliwo),
//   - bańkomiotacz: X strzela bańkami, które zamykają wrogów,
//   - magnes: sam przyciąga monety.
//
//  Sterowanie:
//   ← → (albo A D) – bieg,  ↑ / W / SPACJA – skok,  ↓ – zeskok z półki
//   X (albo K, Shift) – strzał bańką,  P / Esc – pauza,  M – dźwięk.
//   Na telefonie: przyciski na ekranie.
//
//  Mapy etapów są w pliku poziomy.js – możesz je zmieniać!
//  Obrazki postaci (piksel po pikselu) są w piksele.js,
//  a wszystko, co widać na ekranie, rysuje plik rysowanie.js.


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  serca: 3,                     // ile serc ma bohater
  grawitacja: 34,               // jak mocno ciągnie w dół (w kratkach na sekundę do kwadratu)
  najszybszeSpadanie: 22,       // szybciej niż tyle kratek na sekundę się nie spada
  trampolina: 7.5,              // na ile kratek w górę wyrzuca trampolina
  punktyZaMonete: 10,
  punktyZaWroga: 50,
  punktyZaGwiazdke: 500,
  punktyZaUratowanie: 1000,
  punktyZaGburka: 2000,
  limitCzasu: 180,              // za każdą sekundę poniżej tego limitu dostajesz bonus
  punktyZaSekunde: 10,          // ...tyle punktów za sekundę
  zyciaGburka: 3,               // ile razy trzeba skoczyć Gburkowi na głowę
  paliwoPlecaka: 4,             // ile sekund można lecieć plecakiem rakietowym
  czasMagnesu: 15,              // ile sekund działa magnes na monety
  zasiegMagnesu: 4,             // z ilu kratek magnes przyciąga monety
  czasBanki: 2.2,               // ile sekund wróg siedzi w bańce, zanim pęknie
  muzyka: true,                 // false = bez muzyki (tylko dźwięki)
  wszystkieEtapyOtwarte: false, // true = od razu można grać w każdy etap
};

// ---------- BOHATEROWIE (zmieniaj kolory i supermoce!) ----------
//  predkosc – ile kratek na sekundę biega,  skok – na ile kratek skacze
const BOHATEROWIE = {
  helenka: {
    imie: 'Helenka', kogo: 'Helenkę', wolacz: 'Helenko', dziewczynka: true,
    moc: 'Podwójny skok',
    opis: 'W powietrzu może skoczyć jeszcze raz!',
    predkosc: 7,
    skok: 4.2,
    podwojnySkok: true,
    drugiSkok: 3.2,               // na ile kratek skacze drugi raz w powietrzu
    wyglad: {
      skora: '#f6cfa8', wlosy: '#9c5a2e', fryzura: 'dluga', kokarda: '#ffd23f',
      koszulka: '#ff7eb6', spodnica: '#c77dff', spodnie: '#7b4fd6', buty: '#ffffff', znakKolor: '#ffffff',
    },
  },
  seweryn: {
    imie: 'Seweryn', kogo: 'Seweryna', wolacz: 'Sewerynie', dziewczynka: false,
    moc: 'Błyskawica',
    opis: 'Biega najszybciej, a rozpędzony biegnie nawet po wodzie!',
    predkosc: 9.5,
    skok: 4.4,
    biegaPoWodzie: true,
    wyglad: {
      skora: '#f2c79b', wlosy: '#5a3a22', fryzura: 'krotka',
      koszulka: '#4cc9f0', spodnie: '#1d2b4a', buty: '#ff5a5f', znakKolor: '#ffd23f',
    },
  },
  franek: {
    imie: 'Franek', kogo: 'Franka', wolacz: 'Franku', dziewczynka: false,
    moc: 'Siłacz',
    opis: 'Skacze najwyżej i rozbija cegły głową!',
    predkosc: 6.8,
    skok: 5.3,
    rozbijaCegly: true,
    wyglad: {
      skora: '#f2c79b', wlosy: '#e8b84a', fryzura: 'czupryna',
      koszulka: '#3ddc97', spodnie: '#8a5a2b', nogi: '#f2c79b', buty: '#ff9f1c', znakKolor: '#ffd23f',
    },
  },
};
const KOLEJNOSC_BOHATEROW = ['helenka', 'seweryn', 'franek'];

// ---------- Stałe świata (wszystko liczymy w kratkach) ----------
const WIERSZE = 15;               // każdy etap ma 15 kratek wysokości
const SZER_GRACZA = 0.7;
const WYS_GRACZA = 1.4;
const PRZYSPIESZENIE = 60;        // jak szybko bohater się rozpędza
const PRZYSP_W_POWIETRZU = 38;
const HAMOWANIE = 70;
const PRZYSP_NA_LODZIE = 16;      // na lodzie trudno się rozpędzić...
const HAMOWANIE_NA_LODZIE = 7;    // ...i jeszcze trudniej zatrzymać!
const CZAS_KOJOTA = 0.1;          // chwilę po zejściu z krawędzi można jeszcze skoczyć
const BUFOR_SKOKU = 0.14;         // skok wciśnięty chwilę przed lądowaniem też się liczy
const KROK = 1 / 120;             // fizyka liczy się 120 razy na sekundę
const EPS = 0.001;
const ZASIEG_PLATFORMY = 4;       // o ile kratek jeździ ruchoma platforma i winda
const OKRES_PLATFORMY = 4.5;      // ile sekund trwa jazda tam i z powrotem
const NIETYKALNOSC = 1.6;         // tyle sekund po zranieniu nic cię nie rani
const GRAWITACJA_KUL = 9;         // czarodziejskie kule Gburka lecą łukiem


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

let stan = 'start';   // 'start' | 'wybor' | 'gra' | 'pauza' | 'uratowanie' | 'podsumowanie' | 'final'
let czas = 0;
let wyciszone = false;

const postep = wczytajPostep();    // odblokowane etapy i zdobyte gwiazdki
let rekord = wczytajRekord();
let nowyRekord = false;

let wybranyEtap = Math.min(postep.odblokowane, ETAPY.length) - 1;
let wybranyBohater = wczytajBohatera();
let kontynuacja = false;           // true = gramy dalej tę samą przygodę (punkty się sumują)

let nrEtapu = 0;
let etap = ETAPY[0];
let swiat = 'laka';
let podglad = -1;                  // który etap widać w tle menu

let mapa = [];
let mapaSzer = 0;
let wrogowie = [];
let platformy = [];
let flagi = [];
let gwiazdki = [];
let kule = [];
let banki = [];                    // bańki z bańkomiotacza
let moce = [];                     // znajdźki: plecak (R), bańkomiotacz (P), magnes (N)
let efekty = [];
let klatka = null;
let gburek = null;
let bramaKol = -1;                 // kolumna kraty przed Gburkiem
let krataZamknieta = false;
let walka = false;
let start = { x: 2, y: 10 };
let punktKontrolny = { x: 2, y: 10 };
const podskoki = new Map();        // kafelki podbite głową: "k,w" -> kiedy
const trampoliny = new Map();      // kiedy ktoś się odbił od trampoliny

let gracz = null;
let uwolniony = null;              // uratowany przyjaciel (po otwarciu klatki)
let punkty = 0;                    // punkty całej przygody
let punktyEtapu = 0;
let monety = 0;
let pokonani = 0;
let czasEtapu = 0;
let bonusCzasu = 0;
let kamX = 0;
let kamY = 0;
let baner = null;                  // duży napis na środku: { tytul, pod, rada, czas, dlugosc }
let wstrzas = 0;
let uratowanieCzas = 0;
let zmianaStanu = 0;               // kiedy ostatnio zmienił się ekran (żeby nie kliknąć przez przypadek)
let akumulator = 0;

const klawisze = { lewo: false, prawo: false, skok: false, dol: false, strzal: false };
let skokNowy = false;
let strzalNowy = false;
let dotykowe = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const wskazniki = new Map();       // palce na przyciskach: id -> 'lewo' | 'prawo' | 'skok'


// =====================================================
//   DŹWIĘK I MUZYKA
// =====================================================
let audio = null;
let wzmacniacz = null;
let buforSzumu = null;

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
    buforSzumu = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const dane = buforSzumu.getChannelData(0);
    for (let i = 0; i < dane.length; i++) dane[i] = Math.random() * 2 - 1;
  }
  if (audio.state === 'suspended') audio.resume();
  return true;
}

// Jeden dźwięk o stałej wysokości. kiedy = dokładny czas w zegarze dźwięku.
function ton(czestotliwosc, dlugosc, typ, glosnosc, kiedy) {
  const osc = audio.createOscillator();
  osc.type = typ;
  osc.frequency.value = czestotliwosc;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, kiedy);
  g.gain.exponentialRampToValueAtTime(glosnosc, kiedy + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, kiedy + dlugosc);
  osc.connect(g);
  g.connect(wzmacniacz);
  osc.start(kiedy);
  osc.stop(kiedy + dlugosc + 0.02);
}

function pisk(czestotliwosc, dlugosc = 0.15, typ = 'square', glosnosc = 0.12, opoznienie = 0) {
  if (wyciszone || !przygotujDzwiek()) return;
  ton(czestotliwosc, dlugosc, typ, glosnosc, audio.currentTime + opoznienie);
}

// Dźwięk, który zjeżdża albo wjeżdża w górę (fiuuu!)
function swist(od, doCz, dlugosc, typ = 'square', glosnosc = 0.1, opoznienie = 0) {
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

function szum(dlugosc, typFiltra, czestotliwosc, glosnosc, opoznienie = 0, narastanie = 0.005) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;
  const zrodlo = audio.createBufferSource();
  zrodlo.buffer = buforSzumu;
  const filtr = audio.createBiquadFilter();
  filtr.type = typFiltra;
  filtr.frequency.value = czestotliwosc;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(glosnosc, t + narastanie);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dlugosc);
  zrodlo.connect(filtr);
  filtr.connect(g);
  g.connect(wzmacniacz);
  zrodlo.start(t, Math.random() * 0.8, dlugosc + 0.05);
}

function dzwiekSkoku() { swist(260, 620, 0.16, 'square', 0.06); }
function dzwiekDrugiegoSkoku() { swist(420, 980, 0.16, 'square', 0.05); }
function dzwiekMonety() { pisk(988, 0.07, 'square', 0.05); pisk(1319, 0.2, 'square', 0.05, 0.07); }
function dzwiekGwiazdki() { [784, 988, 1175, 1568, 1976].forEach((f, i) => pisk(f, 0.12, 'triangle', 0.1, i * 0.06)); }
function dzwiekDeptania() { swist(320, 110, 0.13, 'square', 0.1); szum(0.08, 'lowpass', 500, 0.15); }
function dzwiekAu() { swist(620, 180, 0.32, 'sawtooth', 0.08); }
function dzwiekPluskuWody() { szum(0.45, 'lowpass', 1100, 0.3, 0, 0.02); swist(500, 150, 0.25, 'sine', 0.08); }
function dzwiekLawy() { szum(0.5, 'lowpass', 450, 0.35, 0, 0.02); swist(300, 80, 0.4, 'sawtooth', 0.06); }
function dzwiekDziury() { swist(700, 120, 0.6, 'triangle', 0.12); }
function dzwiekPuku() { pisk(140, 0.08, 'square', 0.08); szum(0.05, 'lowpass', 600, 0.1); }
function dzwiekCegly() { szum(0.3, 'lowpass', 1300, 0.35); pisk(110, 0.15, 'square', 0.1); }
function dzwiekTrampoliny() { swist(180, 820, 0.28, 'sine', 0.18); }
function dzwiekFlagi() { [523, 659, 784, 1046].forEach((f, i) => pisk(f, 0.14, 'square', 0.06, i * 0.09)); }
function dzwiekSerca() { pisk(659, 0.12, 'sine', 0.15); pisk(880, 0.25, 'sine', 0.15, 0.1); }
function dzwiekOmdlenia() { [523, 440, 349, 262].forEach((f, i) => pisk(f, 0.25, 'triangle', 0.15, i * 0.18)); }
function dzwiekUratowania() {
  [523, 659, 784, 1046, 784, 1046, 1319].forEach((f, i) => pisk(f, 0.18, 'square', 0.07, i * 0.11));
  szum(1.0, 'bandpass', 1200, 0.05, 0.1, 0.2);
}
function dzwiekKraty() { szum(0.5, 'lowpass', 300, 0.5); pisk(70, 0.4, 'square', 0.12); }
function dzwiekCzaru() { swist(300, 1200, 0.35, 'sine', 0.08); swist(310, 1250, 0.35, 'triangle', 0.05); }
function dzwiekPuf() { szum(0.3, 'highpass', 1800, 0.15, 0, 0.02); }
function dzwiekTrafieniaGburka() { swist(500, 140, 0.35, 'square', 0.12); szum(0.2, 'lowpass', 800, 0.25); }
function dzwiekLadowaniaGburka() { pisk(60, 0.3, 'sine', 0.35); szum(0.2, 'lowpass', 300, 0.25); }
function dzwiekZwyciestwa() { [392, 523, 659, 784, 1046, 1319, 1568].forEach((f, i) => pisk(f, 0.2, 'square', 0.07, i * 0.1)); }
function dzwiekMocy() { [523, 784, 659, 1046, 1319].forEach((f, i) => pisk(f, 0.1, 'square', 0.07, i * 0.07)); }
function dzwiekBanki() { swist(260, 720, 0.12, 'sine', 0.12); }
function dzwiekPekniecia() { szum(0.07, 'highpass', 2500, 0.18); pisk(1400, 0.05, 'sine', 0.08); }
function dzwiekPlecaka() { szum(0.12, 'bandpass', 700, 0.06); }
function dzwiekKoncaPaliwa() { swist(500, 160, 0.4, 'square', 0.06); }

// ---------- Muzyka ----------
//  Nuty: litera, (#), oktawa, a po dwukropku – ile ósemek trwa. R = cisza.
//  (Tak jak na pianinie: C D E F G A H.)
const MELODIE = {
  wesola: {
    nuty: 'C5:2 E5:1 G5:1 A5:2 G5:2 | E5:2 C5:1 D5:1 E5:4 | F5:2 A5:1 G5:1 F5:2 E5:2 | D5:2 E5:1 D5:1 C5:4 | ' +
          'E5:1 G5:1 C6:2 H5:2 G5:2 | A5:2 F5:1 A5:1 G5:4 | F5:2 E5:1 D5:1 E5:2 C5:2 | D5:3 H4:1 C5:4',
    bas: 'C3:2 G3:2 C3:2 G3:2 | C3:2 G3:2 C3:2 G3:2 | F2:2 C3:2 F2:2 C3:2 | G2:2 D3:2 G2:2 D3:2 | ' +
         'C3:2 G3:2 C3:2 G3:2 | F2:2 C3:2 F2:2 C3:2 | F2:2 C3:2 G2:2 D3:2 | G2:2 D3:2 C3:4',
  },
  przygoda: {
    nuty: 'A4:1 C5:1 E5:2 D5:1 C5:1 H4:2 | A4:1 H4:1 C5:2 E5:4 | F5:2 E5:1 D5:1 C5:2 D5:2 | E5:6 R:2 | ' +
          'A4:1 C5:1 E5:2 G5:2 F5:1 E5:1 | D5:2 F5:1 E5:1 D5:2 C5:2 | H4:2 C5:1 D5:1 E5:2 G#4:2 | A4:6 R:2',
    bas: 'A2:2 E3:2 A2:2 E3:2 | A2:2 E3:2 A2:2 E3:2 | F2:2 C3:2 F2:2 C3:2 | E2:2 H2:2 E2:2 H2:2 | ' +
         'A2:2 E3:2 C3:2 E3:2 | D3:2 A2:2 D3:2 A2:2 | E2:2 H2:2 E2:2 G#2:2 | A2:2 E3:2 A2:4',
  },
  gburek: {
    nuty: 'E5:1 E5:1 R:1 E5:1 G5:1 E5:1 D5:1 C5:1 | D5:1 D5:1 R:1 D5:1 F5:1 D5:1 C5:1 H4:1 | ' +
          'C5:1 C5:1 R:1 C5:1 E5:1 C5:1 H4:1 A4:1 | H4:2 G#4:2 H4:2 E5:2',
    bas: 'A2:1 A2:1 A2:1 A2:1 A2:1 A2:1 A2:1 A2:1 | G2:1 G2:1 G2:1 G2:1 G2:1 G2:1 G2:1 G2:1 | ' +
         'F2:1 F2:1 F2:1 F2:1 F2:1 F2:1 F2:1 F2:1 | E2:2 E2:2 E2:2 E2:2',
  },
};

function czestotliwoscNuty(nazwa) {
  const m = /^([A-H])(#?)(\d)$/.exec(nazwa);
  if (!m) return 0;
  const polozenie = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, H: 11, B: 10 }[m[1]] + (m[2] ? 1 : 0);
  const midi = (parseInt(m[3], 10) + 1) * 12 + polozenie;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function rozbierzNuty(tekst) {
  return tekst.split(/\s+/).filter((s) => s && s !== '|').map((s) => {
    const [n, d] = s.split(':');
    return [n === 'R' ? 0 : czestotliwoscNuty(n), parseFloat(d) || 1];
  });
}
for (const m of Object.values(MELODIE)) {
  m.nuty = rozbierzNuty(m.nuty);
  m.bas = rozbierzNuty(m.bas);
}

let muzyka = null;   // { nazwa, instrument, tempo, iN, iB, tN, tB }

function wlaczMuzyke(nazwa, instrument = 'square', tempo = 140) {
  if (!nazwa) {
    muzyka = null;
    return;
  }
  muzyka = { nazwa, instrument, tempo, iN: 0, iB: 0, tN: -1, tB: -1 };
}

function grajMuzyke() {
  if (!muzyka || !USTAWIENIA.muzyka || wyciszone || !audio || audio.state !== 'running') return;
  if (stan !== 'gra' && stan !== 'uratowanie') return;
  const m = MELODIE[muzyka.nazwa];
  const osemka = 30 / muzyka.tempo;
  const teraz = audio.currentTime;
  if (muzyka.tN < teraz - 0.25) {     // po pauzie zaczynamy od początku
    muzyka.tN = muzyka.tB = teraz + 0.08;
    muzyka.iN = muzyka.iB = 0;
  }
  while (muzyka.tN < teraz + 0.2) {
    const [f, d] = m.nuty[muzyka.iN];
    if (f) ton(f, d * osemka * 0.85, muzyka.instrument, muzyka.instrument === 'sine' ? 0.05 : 0.028, muzyka.tN);
    muzyka.tN += d * osemka;
    muzyka.iN = (muzyka.iN + 1) % m.nuty.length;
  }
  while (muzyka.tB < teraz + 0.2) {
    const [f, d] = m.bas[muzyka.iB];
    if (f) ton(f, d * osemka * 0.8, 'triangle', 0.07, muzyka.tB);
    muzyka.tB += d * osemka;
    muzyka.iB = (muzyka.iB + 1) % m.bas.length;
  }
}

function muzykaSwiata() {
  const s = SWIATY[swiat];
  wlaczMuzyke(s.muzyka, s.instrument, s.tempo);
}


// =====================================================
//   ZAPAMIĘTYWANIE (rekord, postęp, ostatni bohater)
// =====================================================
const KLUCZ_REKORDU = 'na-ratunek-rekord';
const KLUCZ_POSTEPU = 'na-ratunek-postep';
const KLUCZ_BOHATERA = 'na-ratunek-bohater';

function wczytajRekord() {
  try {
    return parseInt(localStorage.getItem(KLUCZ_REKORDU), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(wynik) {
  try {
    localStorage.setItem(KLUCZ_REKORDU, String(wynik));
  } catch (e) {
    // trudno – rekord nie zostanie zapamiętany
  }
}

function wczytajPostep() {
  const p = { odblokowane: 1, gwiazdki: ETAPY.map(() => [false, false, false]) };
  try {
    const z = JSON.parse(localStorage.getItem(KLUCZ_POSTEPU));
    if (z && typeof z.odblokowane === 'number') {
      p.odblokowane = Math.max(1, Math.min(ETAPY.length, Math.floor(z.odblokowane)));
      if (Array.isArray(z.gwiazdki)) {
        z.gwiazdki.forEach((g, i) => {
          if (p.gwiazdki[i] && Array.isArray(g)) p.gwiazdki[i] = [0, 1, 2].map((j) => !!g[j]);
        });
      }
    }
  } catch (e) {
    // zaczynamy od nowa
  }
  return p;
}

function zapiszPostep() {
  try {
    localStorage.setItem(KLUCZ_POSTEPU, JSON.stringify(postep));
  } catch (e) {
    // trudno
  }
}

function wczytajBohatera() {
  try {
    const b = localStorage.getItem(KLUCZ_BOHATERA);
    if (BOHATEROWIE[b]) return b;
  } catch (e) {
    // nic
  }
  return 'helenka';
}

function zapiszBohatera(id) {
  try {
    localStorage.setItem(KLUCZ_BOHATERA, id);
  } catch (e) {
    // nic
  }
}

function etapOtwarty(i) {
  return USTAWIENIA.wszystkieEtapyOtwarte || i < postep.odblokowane;
}

function ileGwiazdek(i) {
  return postep.gwiazdki[i] ? postep.gwiazdki[i].filter(Boolean).length : 0;
}

// Kto może iść na ratunek w danym etapie? Wszyscy oprócz porwanego.
function dostepniBohaterowie(i) {
  return KOLEJNOSC_BOHATEROW.filter((id) => id !== ETAPY[i].porwany);
}

function porwanyEtapu(i) {
  return BOHATEROWIE[ETAPY[i].porwany] || BOHATEROWIE.seweryn;
}


// =====================================================
//   MAPA ETAPU
// =====================================================
function kafel(k, w) {
  if (k < 0 || k >= mapaSzer) return 'B';      // brzegi świata to ściany
  if (w < 0 || w >= WIERSZE) return ' ';
  return mapa[w][k];
}

function twardy(z) {
  return z === '#' || z === 'B' || z === '=' || z === '?' || z === '+' || z === 'u' || z === 'T' ||
    (z === 'Z' && krataZamknieta);
}

function wczytajMape(i) {
  const def = ETAPY[i];
  const surowa = def.mapa;
  swiat = SWIATY[def.swiat] ? def.swiat : 'laka';
  mapaSzer = 0;
  for (const r of surowa) mapaSzer = Math.max(mapaSzer, r.length);
  mapa = [];
  for (let w = 0; w < WIERSZE; w++) mapa.push((surowa[w] || '').padEnd(mapaSzer, ' ').split(''));

  wrogowie = [];
  platformy = [];
  flagi = [];
  gwiazdki = [];
  kule = [];
  banki = [];
  moce = [];
  klatka = null;
  gburek = null;
  bramaKol = -1;
  krataZamknieta = false;
  walka = false;
  podskoki.clear();
  trampoliny.clear();
  start = { x: 1.5, y: 12 - WYS_GRACZA };
  const posiadane = postep.gwiazdki[i] || [];

  for (let w = 0; w < WIERSZE; w++) {
    for (let k = 0; k < mapaSzer; k++) {
      const z = mapa[w][k];
      if (z === 'S') {
        start = { x: k + 0.5 - SZER_GRACZA / 2, y: w + 1 - WYS_GRACZA };
        mapa[w][k] = ' ';
      } else if (z === 'K') {
        klatka = { x: k, dol: w + 1, wys: 2.3, otwarta: false, otwarcie: 0, prosba: -10 };
        mapa[w][k] = ' ';
      } else if (z === 'F') {
        flagi.push({ k, w, zdobyta: false, czas: 0 });
        mapa[w][k] = ' ';
      } else if (z === '*') {
        gwiazdki.push({ k, w, nr: gwiazdki.length, zebrana: false, miala: !!posiadane[gwiazdki.length] });
        mapa[w][k] = ' ';
      } else if (z === 'g' || z === 'j' || z === 'b') {
        wrogowie.push(nowyWrog(z, k, w));
        mapa[w][k] = ' ';
      } else if (z === 'i') {
        mapa[w][k] = 'L';
        wrogowie.push(nowyWrog('i', k, w));
      } else if (z === 'G') {
        gburek = nowyGburek(k, w);
        mapa[w][k] = ' ';
      } else if (z === 'R' || z === 'P' || z === 'N') {
        moce.push({ typ: z, k, w, zebrana: false });
        mapa[w][k] = ' ';
      } else if (z === 'Z') {
        if (bramaKol < 0) bramaKol = k;
      } else if (z === 'M' || z === 'W') {
        let d = 0;
        while (k + d < mapaSzer && mapa[w][k + d] === z) {
          mapa[w][k + d] = ' ';
          d++;
        }
        platformy.push({ typ: z, x0: k, y0: w, x: k, y: w, w: d, h: 0.4, dx: 0, dy: 0, t: 0 });
      }
    }
  }
}

function nowyWrog(typ, k, w) {
  const rozmiary = { g: [0.85, 0.7], j: [0.9, 0.72], b: [0.8, 0.7], i: [0.6, 0.6] };
  const [sz, wys] = rozmiary[typ];
  const e = {
    typ, x: k + 0.5 - sz / 2, y: w + 1 - wys, w: sz, h: wys, vx: 0, vy: 0, kier: -1,
    predkosc: typ === 'g' ? 1.6 : 1.3, zywy: true, aktywny: false, czas: 0, faza: Math.random() * 6,
    naZiemi: false,
  };
  if (typ === 'b') {
    e.y0 = w + 0.5;
    e.y = e.y0 - wys / 2;
  }
  if (typ === 'i') {
    let r = w;
    while (r > 0 && mapa[r - 1][k] === 'L') r--;
    e.powierzchnia = r;
    e.stanI = 'czeka';
    e.licznik = 0.5 + Math.random() * 2;
    e.ukryta = true;
    e.y = r + 0.3;
  }
  return e;
}

function nowyGburek(k, w) {
  const sz = 1.3;
  const wys = 1.9;
  const x = k + 0.5 - sz / 2;
  const y = w + 1 - wys;
  return {
    x, y, x0: x, y0: y, w: sz, h: wys, vx: 0, vy: 0, kier: -1, zycia: USTAWIENIA.zyciaGburka,
    stanG: 'czeka', licznik: 0, czasStanu: 0, pokonany: false, naZiemi: true, trafiony: -10, banka: 0,
  };
}


// =====================================================
//   FIZYKA – ruch i zderzenia z kafelkami
// =====================================================
function predkoscSkoku(wysokosc) {
  return Math.sqrt(2 * USTAWIENIA.grawitacja * wysokosc);
}

function przesunPoziomo(c, dx) {
  if (dx === 0) return;
  c.x += dx;
  const w0 = Math.floor(c.y + EPS);
  const w1 = Math.floor(c.y + c.h - EPS);
  if (dx > 0) {
    const k = Math.floor(c.x + c.w - EPS);
    for (let w = w0; w <= w1; w++) {
      if (twardy(kafel(k, w))) {
        c.x = k - c.w;
        c.vx = 0;
        c.uderzylSciane = 1;
        return;
      }
    }
  } else {
    const k = Math.floor(c.x + EPS);
    for (let w = w0; w <= w1; w++) {
      if (twardy(kafel(k, w))) {
        c.x = k + 1;
        c.vx = 0;
        c.uderzylSciane = -1;
        return;
      }
    }
  }
}

// Przesuwa ciało (gracza, wroga, Gburka) i pilnuje, żeby nie wchodziło w ściany.
function ruszCialo(c, dt) {
  c.uderzylSciane = 0;
  c.uderzylGlowa = null;
  przesunPoziomo(c, c.vx * dt);

  const dolPrzed = c.y + c.h;
  c.y += c.vy * dt;
  c.naZiemi = false;
  c.naPolce = false;
  c.podloze = null;
  if (c.gracz) c.naPlatformie = null;
  const k0 = Math.floor(c.x + EPS);
  const k1 = Math.floor(c.x + c.w - EPS);

  if (c.vy > 0) {
    // Spadamy – czy jest pod nami coś twardego?
    const w = Math.floor(c.y + c.h);
    let twarde = null;
    let polka = false;
    for (let k = k0; k <= k1; k++) {
      const z = kafel(k, w);
      if (twardy(z)) {
        if (z === 'T') {
          twarde = 'T';
          c.podlozeK = k;
        } else if (!twarde) {
          twarde = z;
        }
      } else if (dolPrzed <= w + EPS && !(c.zeskok > 0) && z === '-') {
        polka = true;
      } else if (dolPrzed <= w + EPS && z === '~' && c.poWodzie && kafel(k, w - 1) !== '~') {
        polka = true;
        c.naWodzie = true;
      }
    }
    if (twarde || polka) {
      c.y = w - c.h;
      c.vy = 0;
      c.naZiemi = true;
      c.podloze = twarde || '-';
      c.naPolce = !twarde;
    } else if (c.gracz && !(c.zeskok > 0)) {
      for (const p of platformy) {
        if (c.x + c.w > p.x + 0.05 && c.x < p.x + p.w - 0.05 && dolPrzed <= p.y + EPS && c.y + c.h >= p.y) {
          c.y = p.y - c.h;
          c.vy = 0;
          c.naZiemi = true;
          c.naPlatformie = p;
          c.naPolce = true;
          c.podloze = 'M';
          break;
        }
      }
    }
  } else if (c.vy < 0) {
    // Lecimy w górę – czy uderzamy głową?
    const w = Math.floor(c.y);
    const lewy = twardy(kafel(k0, w));
    const prawy = k1 !== k0 && twardy(kafel(k1, w));
    if (lewy || prawy) {
      if (c.gracz && lewy && !prawy && k1 !== k0 && k0 + 1 - c.x < 0.3) {
        c.x = k0 + 1 + EPS;                 // tylko zahaczył rogiem – przesuwamy go lekko w bok
      } else if (c.gracz && prawy && !lewy && c.x + c.w - k1 < 0.3) {
        c.x = k1 - c.w - EPS;
      } else {
        c.y = w + 1;
        c.vy = 0;
        const srodek = Math.floor(c.x + c.w / 2);
        const k = twardy(kafel(srodek, w)) ? srodek : (lewy ? k0 : k1);
        c.uderzylGlowa = { k, w };
      }
    }
  }
}

// Jeden krok bohatera. sym = true oznacza próbę (bez dźwięków, monet itp.)
function krokGracza(g, dt, wej, sym) {
  const b = BOHATEROWIE[g.id];
  const naLodzie = swiat === 'lod' && g.naZiemi && !g.naPlatformie && !g.naWodzie;

  // --- bieg w lewo i w prawo ---
  const kierunek = (wej.prawo ? 1 : 0) - (wej.lewo ? 1 : 0);
  if (kierunek !== 0) {
    g.kier = kierunek;
    let a = g.naZiemi ? (naLodzie ? PRZYSP_NA_LODZIE : PRZYSPIESZENIE) : PRZYSP_W_POWIETRZU;
    if (g.vx * kierunek < 0 && !naLodzie) a *= 1.8;      // zawracanie idzie szybciej
    g.vx += kierunek * a * dt;
    if (g.vx * kierunek > b.predkosc) g.vx = kierunek * b.predkosc;
  } else {
    const ham = g.naZiemi ? (naLodzie ? HAMOWANIE_NA_LODZIE : HAMOWANIE) : 6;
    if (g.vx > 0) g.vx = Math.max(0, g.vx - ham * dt);
    else if (g.vx < 0) g.vx = Math.min(0, g.vx + ham * dt);
  }
  // Seweryn biegnie po wodzie, kiedy jest naprawdę rozpędzony
  g.poWodzie = !!b.biegaPoWodzie && Math.abs(g.vx) >= b.predkosc * 0.85;

  // --- skok ---
  if (g.naZiemi) {
    g.kojot = CZAS_KOJOTA;
    g.skoki = 0;
  } else {
    g.kojot -= dt;
  }
  if (wej.skokNowy) g.bufor = BUFOR_SKOKU;
  else g.bufor -= dt;
  if (wej.dol && g.naZiemi && g.naPolce && !g.naWodzie) g.zeskok = 0.22;   // ↓ na półce = zeskocz w dół
  if (g.bufor > 0 && !(g.zeskok > 0)) {
    if (g.kojot > 0) {
      g.vy = -predkoscSkoku(b.skok);
      g.skacze = true;
      g.naZiemi = false;
      g.naPlatformie = null;
      g.kojot = 0;
      g.bufor = 0;
      if (!sym) dzwiekSkoku();
    } else if (b.podwojnySkok && g.skoki < 1) {
      g.vy = -predkoscSkoku(b.drugiSkok);
      g.skoki = 1;
      g.skacze = true;
      g.bufor = 0;
      if (!sym) {
        dzwiekDrugiegoSkoku();
        for (let i = 0; i < 8; i++) {
          czastka(g.x + g.w / 2, g.y + g.h, (Math.random() - 0.5) * 5, Math.random() * 2, '#ffffff', { r: 0.12, g: -2, dlugosc: 0.4 });
        }
      }
    }
  }
  // Puszczony przycisk skoku = niższy skok
  if (g.skacze && !wej.skok && g.vy < 0) {
    g.vy *= 0.5;
    g.skacze = false;
  }
  if (g.vy >= 0) g.skacze = false;
  if (g.zeskok > 0) g.zeskok -= dt;

  // Plecak rakietowy: trzymaj skok w powietrzu, żeby lecieć
  g.leci = false;
  if (g.paliwo > 0 && wej.skok && !g.naZiemi && g.vy > -3) {
    g.vy = Math.max(g.vy - 80 * dt, -7.5);
    g.paliwo -= dt;
    g.leci = true;
    if (!sym) {
      if (Math.random() < 0.6) {
        czastka(g.x + g.w / 2 - g.kier * 0.45, g.y + g.h - 0.45, (Math.random() - 0.5) * 2, 4 + Math.random() * 3,
          Math.random() < 0.5 ? '#ff9f1c' : '#ffe066', { r: 0.07, g: 0, dlugosc: 0.3 });
      }
      if (Math.random() < dt * 9) dzwiekPlecaka();
      if (g.paliwo <= 0) {
        g.paliwo = 0;
        napis('Koniec paliwa!', g.x + g.w / 2, g.y - 0.5, '#ff9f9f');
        dzwiekKoncaPaliwa();
      }
    }
  }

  g.vy = Math.min(g.vy + USTAWIENIA.grawitacja * dt, USTAWIENIA.najszybszeSpadanie);
  g.naWodzie = false;
  ruszCialo(g, dt);
  if (g.y < -0.6) {               // niewidzialny sufit nad mapą
    g.y = -0.6;
    if (g.vy < 0) g.vy = 0;
  }

  if (g.uderzylGlowa && !sym) uderzKafel(g.uderzylGlowa.k, g.uderzylGlowa.w, g);

  // Trampolina wyrzuca wysoko w górę
  if (g.naZiemi && g.podloze === 'T') {
    g.vy = -predkoscSkoku(USTAWIENIA.trampolina);
    g.naZiemi = false;
    g.skacze = false;
    g.skoki = 0;
    if (!sym) {
      dzwiekTrampoliny();
      trampoliny.set(g.podlozeK, czas);
    }
  }

  if (!sym) {
    g.faza += Math.abs(g.vx) * dt * 2.3;
    // rozpryski, gdy Seweryn biegnie po wodzie
    if (g.naWodzie && Math.random() < 0.5) {
      czastka(g.x + g.w / 2 - g.kier * 0.3, g.y + g.h, -g.kier * (1 + Math.random() * 2), -2 - Math.random() * 3,
        SWIATY[swiat].woda2, { r: 0.07, dlugosc: 0.45 });
      if (Math.random() < 0.08) szum(0.12, 'highpass', 2500, 0.05);
    }
  }
}

// Czy coś groźnego dotyka ciała? Zwraca 'woda', 'lawa', 'kolce', 'dziura' albo null.
function zagrozenie(c) {
  if (c.y > WIERSZE + 0.5) return 'dziura';
  const k0 = Math.floor(c.x + EPS);
  const k1 = Math.floor(c.x + c.w - EPS);
  const w0 = Math.max(0, Math.floor(c.y + EPS));
  const w1 = Math.min(WIERSZE - 1, Math.floor(c.y + c.h - EPS));
  for (let w = w0; w <= w1; w++) {
    for (let k = k0; k <= k1; k++) {
      const z = kafel(k, w);
      if (z === '~' || z === 'L') {
        const powierzchnia = kafel(k, w - 1) === z ? w : w + 0.3;
        if (c.y + c.h > powierzchnia + EPS) return z === 'L' ? 'lawa' : 'woda';
      } else if (z === '^') {
        if (c.x + c.w > k + 0.12 && c.x < k + 0.88 && c.y + c.h > w + 0.5) return 'kolce';
      }
    }
  }
  return null;
}

function nachodza(a, b, m = 0) {
  return a.x < b.x + b.w - m && a.x + a.w > b.x + m && a.y < b.y + b.h - m && a.y + a.h > b.y + m;
}


// =====================================================
//   PRZEBIEG GRY
// =====================================================
function nowyGracz(id) {
  return {
    id, gracz: true, x: start.x, y: start.y, w: SZER_GRACZA, h: WYS_GRACZA, vx: 0, vy: 0, kier: 1,
    naZiemi: false, naPlatformie: null, naPolce: false, naWodzie: false, kojot: 0, bufor: 0, skoki: 0,
    skacze: false, zeskok: 0, poWodzie: false, nietykalny: 0, serca: USTAWIENIA.serca, faza: 0,
    powrot: 0, omdlenie: 0, ukryty: false, bezpieczne: { x: start.x, y: start.y },
    paliwo: 0, leci: false, bron: false, przeladowanie: 0, magnes: 0,
  };
}

// Pokazuje etap w tle menu (bez bohatera)
function pokazPodglad(i) {
  if (podglad === i) return;
  podglad = i;
  nrEtapu = i;
  etap = ETAPY[i];
  wczytajMape(i);
  gracz = null;
  efekty = [];
  kamX = 0;
  kamY = 0;
}

function idzDoStartu() {
  stan = 'start';
  zmianaStanu = czas;
  kontynuacja = false;
  wlaczMuzyke(null);
  podglad = -1;
  pokazPodglad(wybranyEtap);
}

function idzDoWyboru(dalejPrzygoda) {
  if (!etapOtwarty(wybranyEtap)) return;
  kontynuacja = dalejPrzygoda;
  const dostepni = dostepniBohaterowie(wybranyEtap);
  if (!dostepni.includes(wybranyBohater)) wybranyBohater = dostepni[0];
  pokazPodglad(wybranyEtap);
  stan = 'wybor';
  zmianaStanu = czas;
}

function zacznijEtap(nr, nowaPrzygoda) {
  nrEtapu = nr;
  etap = ETAPY[nr];
  podglad = -1;
  wczytajMape(nr);
  if (nowaPrzygoda) {
    punkty = 0;
    nowyRekord = false;
  }
  gracz = nowyGracz(wybranyBohater);
  zapiszBohatera(wybranyBohater);
  punktKontrolny = { x: start.x, y: start.y };
  uwolniony = null;
  punktyEtapu = 0;
  monety = 0;
  pokonani = 0;
  czasEtapu = 0;
  bonusCzasu = 0;
  efekty = [];
  wstrzas = 0;
  akumulator = 0;
  wskazniki.clear();
  klawisze.lewo = klawisze.prawo = klawisze.skok = klawisze.dol = klawisze.strzal = false;
  const p = porwanyEtapu(nr);
  baner = { tytul: `Etap ${nr + 1}: ${etap.nazwa}`, pod: `Uratuj ${p.kogo}!`, rada: etap.rada, czas: 0, dlugosc: 4 };
  stan = 'gra';
  zmianaStanu = czas;
  aktualizujKamere(0, true);
  muzykaSwiata();
}

function dodajPunkty(n, x, y, kolor = '#ffd23f') {
  punkty += n;
  punktyEtapu += n;
  if (x !== undefined) napis(`+${n}`, x, y, kolor);
}

function wejscie() {
  const naPrzyciskach = { lewo: false, prawo: false, skok: false, strzal: false };
  for (const p of wskazniki.values()) naPrzyciskach[p] = true;
  const w = {
    lewo: klawisze.lewo || naPrzyciskach.lewo,
    prawo: klawisze.prawo || naPrzyciskach.prawo,
    skok: klawisze.skok || naPrzyciskach.skok,
    dol: klawisze.dol,
    strzal: klawisze.strzal || naPrzyciskach.strzal,
    skokNowy,
    strzalNowy,
  };
  skokNowy = false;
  strzalNowy = false;
  return w;
}

function krokGry(dt) {
  czasEtapu += dt;
  const g = gracz;
  const wej = wejscie();
  aktualizujPlatformy(dt);

  if (g.omdlenie > 0) {
    g.omdlenie -= dt;
    g.vx = 0;
    if (g.omdlenie <= 0) wrocDoFlagi();
  } else if (g.powrot > 0) {
    g.powrot -= dt;
    if (g.powrot <= 0) {
      g.x = g.bezpieczne.x;
      g.y = g.bezpieczne.y;
      g.vx = 0;
      g.vy = 0;
      g.naPlatformie = null;
      g.nietykalny = NIETYKALNOSC;
    }
  } else {
    przewiezNaPlatformie(g);
    krokGracza(g, dt, wej, false);
    sprawdzZagrozenia(g);
    zbierajRzeczy(g);
    sprawdzFlagi(g);
    sprawdzKlatke(g);
    // bańkomiotacz: przytrzymany przycisk strzela co chwilę
    if (g.przeladowanie > 0) g.przeladowanie -= dt;
    if (g.bron && (wej.strzalNowy || wej.strzal) && g.przeladowanie <= 0 && stan === 'gra') wystrzel(g);
    if (g.magnes > 0) g.magnes = Math.max(0, g.magnes - dt);
  }

  aktualizujWrogow(dt);
  aktualizujGburka(dt);
  aktualizujKule(dt);
  aktualizujBanki(dt);
  if (stan === 'gra') zderzeniaZWrogami(g);
  if (g.nietykalny > 0) g.nietykalny -= dt;
}

function aktualizujPlatformy(dt) {
  for (const p of platformy) {
    p.t += dt;
    const s = (1 - Math.cos((p.t / OKRES_PLATFORMY) * Math.PI * 2)) / 2;
    const nx = p.typ === 'M' ? p.x0 + s * ZASIEG_PLATFORMY : p.x0;
    const ny = p.typ === 'W' ? p.y0 - s * ZASIEG_PLATFORMY : p.y0;
    p.dx = nx - p.x;
    p.dy = ny - p.y;
    p.x = nx;
    p.y = ny;
  }
}

// Stoisz na ruchomej platformie? Jedziesz razem z nią.
function przewiezNaPlatformie(c) {
  const p = c.naPlatformie;
  if (!p) return;
  const vx = c.vx;
  przesunPoziomo(c, p.dx);
  c.vx = vx;
  c.y += p.dy;
}

function bezpiecznieStoi(g) {
  if (!g.naZiemi || g.naPlatformie || g.naPolce) return false;
  const w = Math.floor(g.y + g.h + 0.01);
  const lewy = kafel(Math.floor(g.x + 0.05), w);
  const prawy = kafel(Math.floor(g.x + g.w - 0.05), w);
  return twardy(lewy) && twardy(prawy) && lewy !== 'T' && prawy !== 'T';
}

function sprawdzZagrozenia(g) {
  const z = zagrozenie(g);
  if (!z) {
    if (bezpiecznieStoi(g)) g.bezpieczne = { x: g.x, y: g.y };
    return;
  }
  if (z === 'kolce') zranGracza(0, true);
  else wpadka(z);
}

function zranGracza(kierunek, odKolcow) {
  const g = gracz;
  if (g.nietykalny > 0 || g.powrot > 0 || g.omdlenie > 0 || stan !== 'gra') return;
  g.serca--;
  dzwiekAu();
  wstrzas = 0.25;
  if (g.serca <= 0) {
    omdlej(false);
    return;
  }
  g.nietykalny = NIETYKALNOSC;
  g.vy = -predkoscSkoku(odKolcow ? 2.2 : 1.5);
  g.skacze = false;
  g.naZiemi = false;
  g.naPlatformie = null;
  if (kierunek) g.vx = kierunek * 6;
}

// Bohater wpadł do wody, lawy albo przepaści
function wpadka(rodzaj) {
  const g = gracz;
  const x = g.x + g.w / 2;
  if (rodzaj === 'woda') {
    plusk(x, Math.min(g.y + g.h, WIERSZE), SWIATY[swiat].woda2);
    dzwiekPluskuWody();
  } else if (rodzaj === 'lawa') {
    plusk(x, Math.min(g.y + g.h, WIERSZE), '#ffb02e');
    dym(x, g.y + g.h - 0.3, 5);
    dzwiekLawy();
  } else {
    dzwiekDziury();
  }
  g.serca--;
  g.vx = 0;
  g.vy = 0;
  g.naPlatformie = null;
  if (g.serca <= 0) {
    omdlej(true);
    return;
  }
  g.powrot = 0.8;
  napis('Ojej!', x, Math.min(g.y, WIERSZE - 3), '#ffffff', true);
}

// Koniec serc – bohater mdleje i wraca do flagi
function omdlej(ukryty) {
  const g = gracz;
  g.serca = 0;
  g.omdlenie = 2.2;
  g.powrot = 0;
  g.vx = 0;
  g.ukryty = ukryty;
  g.paliwo = 0;             // znajdźki przepadają
  g.bron = false;
  g.magnes = 0;
  dzwiekOmdlenia();
  napis('Ojej! Spróbuj jeszcze raz!', g.x + g.w / 2, Math.min(g.y - 0.5, WIERSZE - 4), '#ffffff', true, 2);
}

function wrocDoFlagi() {
  const g = gracz;
  g.x = punktKontrolny.x;
  g.y = punktKontrolny.y;
  g.vx = 0;
  g.vy = 0;
  g.serca = USTAWIENIA.serca;
  g.nietykalny = 2;
  g.ukryty = false;
  g.naPlatformie = null;
  g.bezpieczne = { x: punktKontrolny.x, y: punktKontrolny.y };
  if (walka) przerwijWalke();
  aktualizujKamere(0, true);
}

// Uderzenie głową w kafelek od dołu
function uderzKafel(k, w, g) {
  const z = kafel(k, w);
  const klucz = `${k},${w}`;
  if (z === '?') {
    mapa[w][k] = 'u';
    podskoki.set(klucz, czas);
    efekty.push({ typ: 'moneta', x: k + 0.5, y: w - 0.3, vy: -9, czas: 0, dlugosc: 0.55 });
    monety++;
    dodajPunkty(USTAWIENIA.punktyZaMonete);
    dzwiekMonety();
  } else if (z === '+') {
    mapa[w][k] = 'u';
    podskoki.set(klucz, czas);
    efekty.push({ typ: 'serce', x: k + 0.5, y: w - 0.3, czas: 0, dlugosc: 1.1 });
    if (g.serca < USTAWIENIA.serca) {
      g.serca++;
      napis('+1 serce', k + 0.5, w - 1.2, '#ff7eb6');
    } else {
      dodajPunkty(100, k + 0.5, w - 1.2);
    }
    dzwiekSerca();
  } else if (z === '=') {
    if (BOHATEROWIE[g.id].rozbijaCegly) {
      mapa[w][k] = ' ';
      const s = SWIATY[swiat];
      for (let i = 0; i < 4; i++) {
        czastka(k + 0.25 + (i % 2) * 0.5, w + 0.25 + Math.floor(i / 2) * 0.5, (i % 2 ? 1 : -1) * (2 + Math.random() * 2),
          -7 - Math.random() * 4, i % 2 ? s.cegla : s.cegla2, { r: 0.17, g: 30, dlugosc: 1.2, ksztalt: 'kwadrat' });
      }
      dodajPunkty(5);
      dzwiekCegly();
      wstrzas = Math.max(wstrzas, 0.08);
    } else {
      podskoki.set(klucz, czas);
      dzwiekPuku();
    }
  } else {
    dzwiekPuku();
  }
  podbijWrogow(k, w);
}

// Wrogowie stojący na podbitym kafelku spadają w dół
function podbijWrogow(k, w) {
  for (const e of wrogowie) {
    if (!e.zywy || e.typ === 'b' || e.typ === 'i' || !e.naZiemi) continue;
    if (Math.abs(e.y + e.h - w) < 0.05 && e.x + e.w > k && e.x < k + 1) {
      e.zywy = false;
      e.spada = true;
      e.vy = -8;
      e.vx = (Math.random() < 0.5 ? -1 : 1) * 2;
      pokonani++;
      dodajPunkty(USTAWIENIA.punktyZaWroga, e.x + e.w / 2, e.y - 0.3);
      dzwiekDeptania();
    }
  }
}

function zbierajRzeczy(g) {
  const k0 = Math.floor(g.x + EPS);
  const k1 = Math.floor(g.x + g.w - EPS);
  const w0 = Math.max(0, Math.floor(g.y + EPS));
  const w1 = Math.min(WIERSZE - 1, Math.floor(g.y + g.h - EPS));
  for (let w = w0; w <= w1; w++) {
    for (let k = k0; k <= k1; k++) {
      if (mapa[w][k] !== 'o') continue;
      if (g.x < k + 0.8 && g.x + g.w > k + 0.2 && g.y < w + 0.85 && g.y + g.h > w + 0.15) {
        mapa[w][k] = ' ';
        monety++;
        dodajPunkty(USTAWIENIA.punktyZaMonete);
        dzwiekMonety();
        for (let i = 0; i < 5; i++) {
          czastka(k + 0.5, w + 0.5, (Math.random() - 0.5) * 4, -Math.random() * 4, '#ffe066', { r: 0.06, g: 4, dlugosc: 0.4 });
        }
      }
    }
  }
  // Magnes przyciąga monety z daleka
  if (g.magnes > 0) {
    const cx = g.x + g.w / 2;
    const cy = g.y + g.h / 2;
    const R = USTAWIENIA.zasiegMagnesu;
    for (let w = Math.max(0, Math.floor(cy - R)); w <= Math.min(WIERSZE - 1, Math.ceil(cy + R)); w++) {
      for (let k = Math.max(0, Math.floor(cx - R)); k <= Math.min(mapaSzer - 1, Math.ceil(cx + R)); k++) {
        if (mapa[w][k] !== 'o' || (k + 0.5 - cx) ** 2 + (w + 0.5 - cy) ** 2 > R * R) continue;
        mapa[w][k] = ' ';
        monety++;
        dodajPunkty(USTAWIENIA.punktyZaMonete);
        efekty.push({ typ: 'lot', x: k + 0.5, y: w + 0.5, czas: 0, dlugosc: 0.3 });
        dzwiekMonety();
      }
    }
  }
  // Znajdźki: plecak rakietowy, bańkomiotacz, magnes
  for (const m of moce) {
    if (m.zebrana) continue;
    if (g.x < m.k + 0.9 && g.x + g.w > m.k + 0.1 && g.y < m.w + 0.9 && g.y + g.h > m.w + 0.1) {
      m.zebrana = true;
      dzwiekMocy();
      let tekst;
      let rada;
      if (m.typ === 'R') {
        g.paliwo = USTAWIENIA.paliwoPlecaka;
        tekst = 'Plecak rakietowy!';
        rada = 'Trzymaj skok w powietrzu, żeby lecieć!';
      } else if (m.typ === 'P') {
        g.bron = true;
        tekst = 'Bańkomiotacz!';
        rada = dotykowe ? 'Okrągły przycisk strzela bańkami!' : 'Naciśnij X, żeby strzelać bańkami!';
      } else {
        g.magnes = USTAWIENIA.czasMagnesu;
        tekst = 'Magnes!';
        rada = 'Monety same do ciebie przylecą!';
      }
      baner = { tytul: tekst, pod: rada, rada: '', czas: 0, dlugosc: 2.4 };
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        czastka(m.k + 0.5, m.w + 0.5, Math.cos(a) * 5, Math.sin(a) * 5, i % 2 ? '#4cc9f0' : '#ffffff', { r: 0.08, g: 0, dlugosc: 0.5 });
      }
    }
  }
  for (const gw of gwiazdki) {
    if (gw.zebrana) continue;
    if (g.x < gw.k + 0.85 && g.x + g.w > gw.k + 0.15 && g.y < gw.w + 0.85 && g.y + g.h > gw.w + 0.15) {
      gw.zebrana = true;
      gw.czas = czas;
      dodajPunkty(USTAWIENIA.punktyZaGwiazdke);
      napis('Gwiazdka!', gw.k + 0.5, gw.w - 0.3, '#ffe14d', true, 1.4);
      dzwiekGwiazdki();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        czastka(gw.k + 0.5, gw.w + 0.5, Math.cos(a) * 5, Math.sin(a) * 5, i % 2 ? '#ffe14d' : '#ffffff',
          { r: 0.09, g: 0, dlugosc: 0.6, ksztalt: 'gwiazdka' });
      }
    }
  }
}

function sprawdzFlagi(g) {
  for (const f of flagi) {
    if (f.zdobyta) continue;
    if (g.x + g.w > f.k + 0.3 && g.x < f.k + 0.7) {
      f.zdobyta = true;
      f.czas = czas;
      punktKontrolny = { x: f.k + 0.5 - g.w / 2, y: f.w + 1 - g.h };
      napis('Punkt kontrolny!', f.k + 0.5, f.w - 2, '#3ddc97', true, 1.5);
      dzwiekFlagi();
    }
  }
}

function sprawdzKlatke(g) {
  if (!klatka || klatka.otwarta) return;
  if (g.x + g.w > klatka.x - 0.1 && g.x < klatka.x + 2.1 && g.y + g.h > klatka.dol - klatka.wys && g.y < klatka.dol) {
    if (gburek && !gburek.pokonany) {
      klatka.prosba = czas;
      return;
    }
    uwolnijPrzyjaciela();
  }
}

function uwolnijPrzyjaciela() {
  klatka.otwarta = true;
  klatka.otwarcie = czas;
  const g = gracz;
  const zLewej = g.x + g.w / 2 < klatka.x + 1;
  uwolniony = {
    id: etap.porwany, x: klatka.x + 1, y: klatka.dol, startX: klatka.x + 1,
    celX: zLewej ? klatka.x - 0.7 : klatka.x + 2.7, kier: zLewej ? -1 : 1,
  };
  g.kier = zLewej ? 1 : -1;
  g.nietykalny = 0;
  stan = 'uratowanie';
  uratowanieCzas = 0;
  zmianaStanu = czas;
  kule = [];
  wlaczMuzyke(null);
  dzwiekUratowania();
  konfetti(klatka.x + 1, klatka.dol - 2, 40);
}

// Animacja po otwarciu klatki: przyjaciel wyskakuje, wszyscy się cieszą
function krokUratowania(dt) {
  uratowanieCzas += dt;
  const g = gracz;
  aktualizujPlatformy(dt);
  przewiezNaPlatformie(g);
  krokGracza(g, dt, { lewo: false, prawo: false, skok: false, dol: false, skokNowy: false }, true);
  g.kier = uwolniony.x > g.x + g.w / 2 ? 1 : -1;
  if (g.naZiemi && uratowanieCzas > 0.9 && Math.random() < dt * 2.5) {
    g.vy = -predkoscSkoku(1.2);
    g.naZiemi = false;
  }
  if (Math.random() < dt * 3) konfetti(klatka.x + 1 + (Math.random() - 0.5) * 6, klatka.dol - 4 - Math.random() * 2, 6);
  if (uratowanieCzas > 4) zakonczEtap();
}

function zakonczEtap() {
  bonusCzasu = Math.max(0, Math.round(USTAWIENIA.limitCzasu - czasEtapu)) * USTAWIENIA.punktyZaSekunde;
  dodajPunkty(USTAWIENIA.punktyZaUratowanie + bonusCzasu);
  const zapamietane = postep.gwiazdki[nrEtapu];
  for (const gw of gwiazdki) {
    if (gw.zebrana && zapamietane) zapamietane[gw.nr] = true;
  }
  if (nrEtapu + 1 < ETAPY.length) postep.odblokowane = Math.max(postep.odblokowane, nrEtapu + 2);
  zapiszPostep();
  if (punkty > rekord) {
    rekord = punkty;
    nowyRekord = true;
    zapiszRekord(rekord);
  }
  stan = 'podsumowanie';
  zmianaStanu = czas;
}

function dalejPoPodsumowaniu() {
  if (nrEtapu + 1 < ETAPY.length) {
    wybranyEtap = nrEtapu + 1;
    idzDoWyboru(true);
  } else {
    stan = 'final';
    zmianaStanu = czas;
    dzwiekZwyciestwa();
  }
}

function zacznijOdNowa() {
  punkty -= punktyEtapu;
  zacznijEtap(nrEtapu, false);
}


// =====================================================
//   WROGOWIE
// =====================================================
function aktualizujWrogow(dt) {
  const lewo = kamX - 3;
  const prawo = kamX + L.kolumny + 3;
  for (const e of wrogowie) {
    if (!e.aktywny) {
      if (e.x < prawo && e.x + e.w > lewo) e.aktywny = true;
      else continue;
    }
    e.czas += dt;
    if (!e.zywy) {
      if (e.spada) {
        e.vy += USTAWIENIA.grawitacja * dt;
        e.y += e.vy * dt;
        e.x += e.vx * dt;
        if (e.y > WIERSZE + 3) e.usun = true;
      } else {
        e.zgnieciony -= dt;
        if (e.zgnieciony <= 0) e.usun = true;
      }
      continue;
    }
    if (e.wBance > 0) {
      // zamknięty w bańce – powoli odlatuje w górę, aż bańka pęknie
      e.wBance -= dt;
      e.y -= 1.1 * dt;
      e.x += Math.sin(e.czas * 3) * 0.3 * dt;
      if (e.wBance <= 0) pekniecieBanki(e);
      continue;
    }

    if (e.typ === 'g' || e.typ === 'j') {
      // Chodzi w lewo i w prawo, zawraca przy ścianie i na krawędzi
      e.vx = e.kier * e.predkosc;
      e.vy = Math.min(e.vy + USTAWIENIA.grawitacja * dt, 20);
      ruszCialo(e, dt);
      if (e.uderzylSciane) {
        e.kier = -e.kier;
      } else if (e.naZiemi) {
        const kx = Math.floor(e.kier > 0 ? e.x + e.w + 0.05 : e.x - 0.05);
        const pod = kafel(kx, Math.floor(e.y + e.h + 0.1));
        if (!twardy(pod) && pod !== '-') e.kier = -e.kier;
      }
      const z = zagrozenie(e);
      if (z === 'dziura' || z === 'woda' || z === 'lawa') e.usun = true;
    } else if (e.typ === 'b') {
      // Bzyk lata w górę i w dół
      e.y = e.y0 - e.h / 2 + Math.sin(e.czas * 2.4 + e.faza) * 1.5;
      if (gracz) e.kier = gracz.x + gracz.w / 2 > e.x + e.w / 2 ? 1 : -1;
    } else if (e.typ === 'i') {
      // Iskra co chwilę wyskakuje z lawy
      if (e.stanI === 'czeka') {
        e.licznik -= dt;
        e.ukryta = true;
        if (e.licznik <= 0) {
          e.stanI = 'leci';
          e.y = e.powierzchnia - e.h * 0.3;
          e.vy = -predkoscSkoku(4.6);
          e.ukryta = false;
          if (e.x > kamX - 1 && e.x < kamX + L.kolumny + 1) {
            for (let i = 0; i < 5; i++) {
              czastka(e.x + e.w / 2, e.powierzchnia, (Math.random() - 0.5) * 3, -3 - Math.random() * 3, '#ffb02e', { r: 0.07 });
            }
          }
        }
      } else {
        e.vy += USTAWIENIA.grawitacja * dt;
        e.y += e.vy * dt;
        if (e.vy > 0 && e.y > e.powierzchnia + 0.2) {
          e.stanI = 'czeka';
          e.licznik = 1.4 + Math.random() * 1.2;
          e.ukryta = true;
        }
      }
    }
  }
  wrogowie = wrogowie.filter((e) => !e.usun);
}

function zgniec(e) {
  e.zywy = false;
  e.zgnieciony = 0.5;
  pokonani++;
  dodajPunkty(USTAWIENIA.punktyZaWroga, e.x + e.w / 2, e.y - 0.2);
  dzwiekDeptania();
  for (let i = 0; i < 6; i++) {
    czastka(e.x + e.w / 2, e.y + e.h, (Math.random() - 0.5) * 5, -Math.random() * 3, '#ffffff', { r: 0.08, dlugosc: 0.35 });
  }
}

// ---------- Bańkomiotacz ----------
function wystrzel(g) {
  if (banki.length >= 4) return;
  banki.push({ x: g.x + g.w / 2 + g.kier * 0.55, y: g.y + 0.72, vx: g.kier * 10, czas: 0 });
  g.przeladowanie = 0.3;
  dzwiekBanki();
}

function pekBanka(k) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    czastka(k.x, k.y, Math.cos(a) * 3, Math.sin(a) * 3, '#d8faff', { r: 0.06, g: 0, dlugosc: 0.3 });
  }
  dzwiekPekniecia();
}

function pekniecieBanki(e) {
  e.wBance = 0;
  e.zywy = false;
  e.spada = true;
  e.vy = -5;
  e.vx = 0;
  pokonani++;
  dodajPunkty(USTAWIENIA.punktyZaWroga, e.x + e.w / 2, e.y - 0.3);
  pekBanka({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
}

function aktualizujBanki(dt) {
  for (const k of banki) {
    k.czas += dt;
    if (k.czas < 0.55) {
      k.x += k.vx * dt;
    } else {
      k.vx *= Math.pow(0.05, dt);
      k.x += k.vx * dt;
      k.y -= 1.6 * dt;
    }
    if (k.czas > 1.5 || twardy(kafel(Math.floor(k.x), Math.floor(k.y)))) {
      k.usun = true;
      pekBanka(k);
      continue;
    }
    for (const e of wrogowie) {
      if (!e.zywy || e.wBance > 0 || e.ukryta || !e.aktywny) continue;
      if (k.x > e.x - 0.25 && k.x < e.x + e.w + 0.25 && k.y > e.y - 0.25 && k.y < e.y + e.h + 0.25) {
        k.usun = true;
        if (e.typ === 'i') {
          pekBanka(k);               // iskra jest za gorąca – bańka pęka
        } else {
          e.wBance = USTAWIENIA.czasBanki;
          e.vx = 0;
          dzwiekBanki();
        }
        break;
      }
    }
    const gb = gburek;
    if (!k.usun && gb && !gb.pokonany && walka && gb.stanG !== 'oszolomiony' &&
      k.x > gb.x - 0.2 && k.x < gb.x + gb.w + 0.2 && k.y > gb.y - 0.2 && k.y < gb.y + gb.h + 0.2) {
      k.usun = true;
      gb.banka = 1.8;
      gb.vx = 0;
      ustawStanGburka('oszolomiony', 1.8);
      napis('Teraz skacz!', gb.x + gb.w / 2, gb.y - 1, '#4cc9f0', true);
      dzwiekBanki();
    }
  }
  banki = banki.filter((k) => !k.usun);
}

function odbijSie(g, wysoko) {
  const trzyma = klawisze.skok || [...wskazniki.values()].includes('skok');
  g.vy = -predkoscSkoku(wysoko ? 4 : trzyma ? 3.6 : 2.2);
  g.skacze = trzyma && !wysoko;
  g.skoki = 0;
  g.naZiemi = false;
  g.naPlatformie = null;
}

function zderzeniaZWrogami(g) {
  if (g.powrot > 0 || g.omdlenie > 0) return;
  for (const e of wrogowie) {
    if (!e.zywy || !e.aktywny || e.ukryta) continue;
    if (!nachodza(g, e, 0.1)) continue;
    if (e.wBance > 0) {
      pekniecieBanki(e);             // dotknięcie bańki z wrogiem – pęka i wróg znika
      continue;
    }
    const zGory = g.vy > 0 && g.y + g.h - e.y < 0.55;
    if (zGory && (e.typ === 'g' || e.typ === 'b')) {
      zgniec(e);
      odbijSie(g, false);
    } else if (zGory && e.typ === 'j') {
      zranGracza(0, true);           // au! jeżyk ma kolce
    } else {
      zranGracza(Math.sign(g.x + g.w / 2 - (e.x + e.w / 2)) || 1);
    }
  }
}


// =====================================================
//   GBUREK – zły czarodziej
// =====================================================
function zacznijWalke() {
  const gb = gburek;
  walka = true;
  krataZamknieta = true;
  if (gracz.x < bramaKol + 1 + EPS) gracz.x = bramaKol + 1 + EPS;
  gb.stanG = 'chodzi';
  gb.licznik = 1.5;
  gb.czasStanu = 0;
  wstrzas = 0.4;
  dzwiekKraty();
  baner = { tytul: 'Gburek!', pod: `Skocz mu ${USTAWIENIA.zyciaGburka} razy na głowę!`, rada: '', czas: 0, dlugosc: 2.6 };
  wlaczMuzyke('gburek', 'square', 170);
}

function przerwijWalke() {
  const gb = gburek;
  walka = false;
  krataZamknieta = false;
  kule = [];
  banki = [];
  if (gb && !gb.pokonany) {
    gb.banka = 0;
    gb.stanG = 'czeka';
    gb.x = gb.x0;
    gb.y = gb.y0;
    gb.vx = 0;
    gb.vy = 0;
  }
  muzykaSwiata();
}

function ustawStanGburka(nowy, licznik) {
  gburek.stanG = nowy;
  gburek.licznik = licznik;
  gburek.czasStanu = 0;
}

function aktualizujGburka(dt) {
  const gb = gburek;
  if (!gb || gb.pokonany) return;
  const g = gracz;
  if (gb.stanG === 'czeka') {
    if (bramaKol >= 0 && g.x > bramaKol + 1.3 && g.powrot <= 0 && g.omdlenie <= 0 && stan === 'gra') zacznijWalke();
    return;
  }
  gb.czasStanu += dt;
  if (gb.banka > 0) gb.banka = Math.max(0, gb.banka - dt);
  const gx = g.x + g.w / 2;
  const bx = gb.x + gb.w / 2;
  const zlosc = USTAWIENIA.zyciaGburka - gb.zycia;     // im mniej żyć, tym szybszy

  if (gb.stanG === 'chodzi') {
    gb.kier = gx > bx ? 1 : -1;
    gb.vx = Math.abs(gx - bx) < 0.4 ? 0 : gb.kier * (1.6 + zlosc * 0.8);
    gb.licznik -= dt;
    if (gb.licznik <= 0) {
      if (Math.random() < 0.55) {
        ustawStanGburka('czaruje', 0.8);
        dzwiekCzaru();
      } else {
        ustawStanGburka('skacze', 0);
        gb.vy = -predkoscSkoku(3.5);
        gb.vx = Math.max(-7, Math.min(7, gx - bx));
        gb.naZiemi = false;
      }
    }
  } else if (gb.stanG === 'czaruje') {
    gb.vx = 0;
    gb.kier = gx > bx ? 1 : -1;
    gb.licznik -= dt;
    if (gb.licznik <= 0) {
      rzucKule(1 + zlosc);
      ustawStanGburka('chodzi', 1.4 + Math.random());
    }
  } else if (gb.stanG === 'skacze') {
    if (gb.naZiemi && gb.czasStanu > 0.15) {
      gb.vx = 0;
      wstrzas = 0.3;
      dzwiekLadowaniaGburka();
      dym(bx, gb.y + gb.h, 4);
      ustawStanGburka('chodzi', 1.2 + Math.random());
    }
  } else if (gb.stanG === 'oszolomiony') {
    gb.vx = 0;
    gb.licznik -= dt;
    if (gb.licznik <= 0) ustawStanGburka('chodzi', 0.8);
  }

  gb.vy = Math.min(gb.vy + USTAWIENIA.grawitacja * dt, 20);
  ruszCialo(gb, dt);

  if (stan !== 'gra' || g.powrot > 0 || g.omdlenie > 0) return;
  if (nachodza(g, gb, 0.15)) {
    const zGory = g.vy > 0 && g.y + g.h - gb.y < 0.7;
    if (gb.banka > 0) {
      if (zGory) trafGburka();       // Gburek w bańce – można skoczyć mu na głowę
    } else if (gb.stanG !== 'oszolomiony') {
      if (zGory) trafGburka();
      else zranGracza(Math.sign(gx - bx) || 1);
    }
  }
}

function trafGburka() {
  const gb = gburek;
  gb.zycia--;
  gb.trafiony = czas;
  gb.banka = 0;
  odbijSie(gracz, true);
  dzwiekTrafieniaGburka();
  wstrzas = 0.3;
  napis(gb.zycia > 0 ? 'Au!' : 'Aaaa!', gb.x + gb.w / 2, gb.y - 1, '#ffffff', true);
  for (let i = 0; i < 10; i++) {
    czastka(gb.x + gb.w / 2, gb.y, (Math.random() - 0.5) * 6, -Math.random() * 5, '#ffe14d', { r: 0.09, ksztalt: 'gwiazdka' });
  }
  if (gb.zycia <= 0) pokonajGburka();
  else ustawStanGburka('oszolomiony', 1.3);
}

function pokonajGburka() {
  const gb = gburek;
  gb.pokonany = true;
  walka = false;
  krataZamknieta = false;
  kule = [];
  const x = gb.x + gb.w / 2;
  const y = gb.y + gb.h;
  dym(x, y - 1, 14);
  dzwiekPuf();
  efekty.push({ typ: 'zaba', x, y, podloga: y, vx: -3, vy: -6, czas: 0, dlugosc: 7 });
  dodajPunkty(USTAWIENIA.punktyZaGburka);
  pokonani++;
  baner = { tytul: 'Gburek pokonany!', pod: 'Zamienił się w żabkę! Otwórz klatkę!', rada: '', czas: 0, dlugosc: 3 };
  dzwiekZwyciestwa();
  muzykaSwiata();
}

function rzucKule(ile) {
  const gb = gburek;
  const g = gracz;
  const sx0 = gb.x + gb.w / 2 + gb.kier * 0.7;
  const sy0 = gb.y + 0.2;
  const gx = g.x + g.w / 2;
  const gy = g.y + g.h / 2;
  for (let i = 0; i < ile; i++) {
    const t = 0.95 + i * 0.3;
    const vx = (gx - sx0) / t;
    const vy = (gy - sy0 - 0.5 * GRAWITACJA_KUL * t * t) / t;
    kule.push({ x: sx0, y: sy0, vx, vy, r: 0.28, czas: 0 });
  }
  dzwiekCzaru();
}

function aktualizujKule(dt) {
  const g = gracz;
  for (const k of kule) {
    k.czas += dt;
    k.vy += GRAWITACJA_KUL * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    if (twardy(kafel(Math.floor(k.x), Math.floor(k.y))) || k.czas > 5 || k.y > WIERSZE + 1) {
      k.usun = true;
      for (let i = 0; i < 6; i++) czastka(k.x, k.y, (Math.random() - 0.5) * 4, -Math.random() * 3, '#d9a6ff', { r: 0.07 });
      continue;
    }
    if (g && g.powrot <= 0 && g.omdlenie <= 0 && stan === 'gra') {
      const nx = Math.max(g.x, Math.min(k.x, g.x + g.w));
      const ny = Math.max(g.y, Math.min(k.y, g.y + g.h));
      if ((nx - k.x) ** 2 + (ny - k.y) ** 2 < k.r * k.r) {
        k.usun = true;
        zranGracza(Math.sign(k.vx) || 1);
      }
    }
  }
  kule = kule.filter((k) => !k.usun);
}


// =====================================================
//   EFEKTY (iskierki, napisy, konfetti...)
// =====================================================
function czastka(x, y, vx, vy, kolor, o = {}) {
  efekty.push({
    typ: 'czastka', x, y, vx, vy, kolor, r: o.r ?? 0.08, g: o.g ?? 12, czas: 0, dlugosc: o.dlugosc ?? 0.6,
    ksztalt: o.ksztalt || 'kolo', obrot: Math.random() * 6, wobrot: (Math.random() - 0.5) * 12,
  });
}

function napis(tekst, x, y, kolor, duzy = false, dlugosc = 0.9) {
  efekty.push({ typ: 'napis', tekst, x, y, kolor, duzy, czas: 0, dlugosc });
}

function plusk(x, y, kolor) {
  for (let i = 0; i < 14; i++) {
    czastka(x + (Math.random() - 0.5) * 0.6, y, (Math.random() - 0.5) * 5, -4 - Math.random() * 5, kolor, { r: 0.09, dlugosc: 0.8, g: 20 });
  }
}

function dym(x, y, ile) {
  for (let i = 0; i < ile; i++) {
    efekty.push({
      typ: 'dym', x: x + (Math.random() - 0.5) * 1.2, y: y - Math.random() * 0.8, vx: (Math.random() - 0.5) * 2,
      vy: -0.5 - Math.random(), r: 0.25 + Math.random() * 0.25, czas: 0, dlugosc: 0.7 + Math.random() * 0.4,
    });
  }
}

const KOLORY_KONFETTI = ['#ffd23f', '#ff5a5f', '#4cc9f0', '#3ddc97', '#c77dff', '#ff9f1c', '#ff7eb6'];

function konfetti(x, y, ile) {
  for (let i = 0; i < ile; i++) {
    czastka(x, y, (Math.random() - 0.5) * 10, -3 - Math.random() * 7, KOLORY_KONFETTI[i % KOLORY_KONFETTI.length],
      { r: 0.09, g: 9, dlugosc: 1.6 + Math.random(), ksztalt: 'kwadrat' });
  }
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.czas += dt;
    if (e.typ === 'czastka') {
      e.vy += e.g * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.obrot += e.wobrot * dt;
    } else if (e.typ === 'moneta') {
      e.vy += 30 * dt;
      e.y += e.vy * dt;
    } else if (e.typ === 'serce' || e.typ === 'napis') {
      e.y -= dt * 1.2;
    } else if (e.typ === 'dym') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.r += dt * 0.6;
    } else if (e.typ === 'zaba') {
      e.vy += 25 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.y >= e.podloga) {
        e.y = e.podloga;
        e.vy = -6;
      }
    }
  }
  efekty = efekty.filter((e) => e.czas < e.dlugosc);
}


// =====================================================
//   KAMERA
// =====================================================
function aktualizujKamere(dt, natychmiast) {
  const g = gracz;
  if (!g) return;
  const widac = L.kolumny;
  let cel = g.x + g.w / 2 - widac * 0.42 + g.kier * widac * 0.05;
  if (walka && bramaKol >= 0) cel = Math.max(cel, bramaKol - 0.5);
  cel = mapaSzer > widac ? Math.max(0, Math.min(mapaSzer - widac, cel)) : (mapaSzer - widac) / 2;
  kamX = natychmiast ? cel : kamX + (cel - kamX) * Math.min(1, dt * 6);

  if (L.wiersze >= WIERSZE) {
    kamY = 0;
  } else {
    let celY = g.y + g.h / 2 - L.wiersze * 0.55;
    celY = Math.max(0, Math.min(WIERSZE - L.wiersze, celY));
    kamY = natychmiast ? celY : kamY + (celY - kamY) * Math.min(1, dt * 6);
  }
}


// =====================================================
//   STEROWANIE
// =====================================================
let przyciski = [];     // przyciski narysowane w okienku: { x, y, w, h, akcja }

function przyciskPod(x, y) {
  for (let i = przyciski.length - 1; i >= 0; i--) {
    const p = przyciski[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p.akcja;
  }
  return null;
}

function idzDoMenu() {
  window.location.href = '../index.html';
}

function pauza() {
  if (stan === 'gra') {
    stan = 'pauza';
    zmianaStanu = czas;
    wskazniki.clear();
    klawisze.lewo = klawisze.prawo = klawisze.skok = klawisze.dol = klawisze.strzal = false;
  }
}

function grajDalej() {
  if (stan === 'pauza') {
    stan = 'gra';
    zmianaStanu = czas;
  }
}

function zmienEtap(o) {
  let i = wybranyEtap;
  for (let n = 0; n < ETAPY.length; n++) {
    i = (i + o + ETAPY.length) % ETAPY.length;
    if (etapOtwarty(i)) break;
  }
  wybranyEtap = i;
  pokazPodglad(i);
}

function zmienBohatera(o) {
  const d = dostepniBohaterowie(wybranyEtap);
  const i = Math.max(0, d.indexOf(wybranyBohater));
  wybranyBohater = d[(i + o + d.length) % d.length];
}

function wykonaj(akcja) {
  if (!akcja) return false;
  if (akcja === 'menu') idzDoMenu();
  else if (akcja.startsWith('etap:')) {
    const i = parseInt(akcja.slice(5), 10);
    if (etapOtwarty(i)) {
      wybranyEtap = i;
      idzDoWyboru(false);
    }
  } else if (akcja.startsWith('bohater:')) {
    wybranyBohater = akcja.slice(8);
    zacznijEtap(wybranyEtap, !kontynuacja);
  } else if (akcja === 'wstecz' || akcja === 'wyjdz') idzDoStartu();
  else if (akcja === 'graj') grajDalej();
  else if (akcja === 'od-nowa') zacznijOdNowa();
  else if (akcja === 'dalej') dalejPoPodsumowaniu();
  else return false;
  return true;
}

// Kliknięcie albo SPACJA poza przyciskami
function akcjaGlowna() {
  if (czas - zmianaStanu < 0.4) return;
  if (stan === 'start') idzDoWyboru(false);
  else if (stan === 'wybor') zacznijEtap(wybranyEtap, !kontynuacja);
  else if (stan === 'pauza') grajDalej();
  else if (stan === 'podsumowanie' && czas - zmianaStanu > 1) dalejPoPodsumowaniu();
  else if (stan === 'final' && czas - zmianaStanu > 1.5) idzDoStartu();
}

window.addEventListener('keydown', (e) => {
  const kod = e.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(kod)) e.preventDefault();
  przygotujDzwiek();
  if (kod === 'KeyM') {
    if (!e.repeat) wyciszone = !wyciszone;
    return;
  }

  if (stan === 'gra') {
    if (kod === 'Escape' || kod === 'KeyP') pauza();
    else if (kod === 'ArrowLeft' || kod === 'KeyA') klawisze.lewo = true;
    else if (kod === 'ArrowRight' || kod === 'KeyD') klawisze.prawo = true;
    else if (kod === 'ArrowDown' || kod === 'KeyS') klawisze.dol = true;
    else if (kod === 'ArrowUp' || kod === 'KeyW' || kod === 'Space' || kod === 'Enter') {
      if (!e.repeat) {
        klawisze.skok = true;
        skokNowy = true;
      }
    } else if (kod === 'KeyX' || kod === 'KeyK' || kod === 'ShiftLeft' || kod === 'ShiftRight') {
      if (!e.repeat) {
        klawisze.strzal = true;
        strzalNowy = true;
      }
    }
    return;
  }
  if (e.repeat) return;
  const potwierdz = kod === 'Space' || kod === 'Enter';

  if (stan === 'start') {
    if (kod === 'ArrowLeft' || kod === 'KeyA') zmienEtap(-1);
    else if (kod === 'ArrowRight' || kod === 'KeyD') zmienEtap(1);
    else if (potwierdz) akcjaGlowna();
    else if (kod === 'KeyQ' || kod === 'Escape') idzDoMenu();
    else if (/^Digit[1-9]$/.test(kod)) wykonaj(`etap:${parseInt(kod.slice(5), 10) - 1}`);
  } else if (stan === 'wybor') {
    if (kod === 'ArrowLeft' || kod === 'KeyA') zmienBohatera(-1);
    else if (kod === 'ArrowRight' || kod === 'KeyD') zmienBohatera(1);
    else if (potwierdz) akcjaGlowna();
    else if (kod === 'Escape' || kod === 'Backspace') idzDoStartu();
    else if (kod === 'KeyQ') idzDoMenu();
  } else if (stan === 'pauza') {
    if (potwierdz || kod === 'Escape' || kod === 'KeyP') grajDalej();
    else if (kod === 'KeyR') zacznijOdNowa();
    else if (kod === 'KeyQ') idzDoMenu();
  } else if (stan === 'podsumowanie' || stan === 'final') {
    if (potwierdz) akcjaGlowna();
    else if (kod === 'KeyQ') idzDoMenu();
  }
});

window.addEventListener('keyup', (e) => {
  const kod = e.code;
  if (kod === 'ArrowLeft' || kod === 'KeyA') klawisze.lewo = false;
  else if (kod === 'ArrowRight' || kod === 'KeyD') klawisze.prawo = false;
  else if (kod === 'ArrowDown' || kod === 'KeyS') klawisze.dol = false;
  else if (kod === 'ArrowUp' || kod === 'KeyW' || kod === 'Space' || kod === 'Enter') klawisze.skok = false;
  else if (kod === 'KeyX' || kod === 'KeyK' || kod === 'ShiftLeft' || kod === 'ShiftRight') klawisze.strzal = false;
});

// Myszka i palec
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (e.pointerType === 'touch' && !dotykowe) {
    dotykowe = true;
    dopasujRozmiar();
  }
  if (stan === 'gra') {
    if (e.clientY < L.hudH) {
      pauza();
      return;
    }
    if (!dotykowe) return;      // myszką w czasie gry się nie steruje – tylko klawiaturą
    const p = przyciskDotyku(e.clientX, e.clientY);
    if (p) {
      wskazniki.set(e.pointerId, p);
      if (p === 'skok') skokNowy = true;
      if (p === 'strzal') strzalNowy = true;
      try {
        plotno.setPointerCapture(e.pointerId);
      } catch (err) {
        // bez tego też zadziała
      }
    }
    return;
  }
  if (stan === 'uratowanie') return;
  if (!wykonaj(przyciskPod(e.clientX, e.clientY))) akcjaGlowna();
});

plotno.addEventListener('pointermove', (e) => {
  const teraz = wskazniki.get(e.pointerId);
  if (!teraz || teraz === 'skok' || teraz === 'strzal') return;
  const p = przyciskDotyku(e.clientX, e.clientY);
  if (p === 'lewo' || p === 'prawo') wskazniki.set(e.pointerId, p);   // przesuwanie palca między strzałkami
});

function puscPalec(e) {
  if (wskazniki.has(e.pointerId)) wskazniki.delete(e.pointerId);
}
plotno.addEventListener('pointerup', puscPalec);
plotno.addEventListener('pointercancel', puscPalec);
plotno.addEventListener('contextmenu', (e) => e.preventDefault());

function pauzaPrzyWyjsciu() {
  pauza();
  klawisze.lewo = klawisze.prawo = klawisze.skok = klawisze.dol = klawisze.strzal = false;
  wskazniki.clear();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzaPrzyWyjsciu();
});
window.addEventListener('blur', pauzaPrzyWyjsciu);
window.addEventListener('resize', () => dopasujRozmiar());


// =====================================================
//   GŁÓWNA PĘTLA – działa około 60 razy na sekundę
// =====================================================
let poprzedniaKlatka = performance.now();

function petla(teraz) {
  const dt = Math.min((teraz - poprzedniaKlatka) / 1000, 0.05);
  poprzedniaKlatka = teraz;
  czas += dt;

  if (stan === 'gra') {
    akumulator += dt;
    while (akumulator >= KROK && stan === 'gra') {
      krokGry(KROK);
      akumulator -= KROK;
    }
    aktualizujKamere(dt);
  } else if (stan === 'uratowanie') {
    akumulator += dt;
    while (akumulator >= KROK && stan === 'uratowanie') {
      krokUratowania(KROK);
      akumulator -= KROK;
    }
    aktualizujKamere(dt);
  } else if (stan === 'start' || stan === 'wybor') {
    aktualizujPlatformy(dt);
  } else if (stan === 'final' && Math.random() < dt * 2.5) {
    konfetti(kamX + Math.random() * L.kolumny, kamY + 2 + Math.random() * 4, 18);
    if (!wyciszone && Math.random() < 0.5) szum(0.3, 'bandpass', 1500, 0.04);
  }

  if (stan !== 'pauza') {
    aktualizujEfekty(dt);
    if (wstrzas > 0) wstrzas = Math.max(0, wstrzas - dt);
    if (baner) {
      baner.czas += dt;
      if (baner.czas > baner.dlugosc) baner = null;
    }
  }
  grajMuzyke();
  rysuj();
  requestAnimationFrame(petla);
}
