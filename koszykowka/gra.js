'use strict';

// =====================================================
//   KOSZYKÓWKA – rzuty do kosza
//   Pomysł: Seweryn
// =====================================================
//
//  Dwa tryby gry:
//   - NA CZAS: masz 60 sekund. Rzucaj piłką do kosza, ile tylko zdążysz!
//   - BEZ CZASU: masz 3 serca. Każde pudło zabiera jedno serce.
//
//  Zasady:
//   - Kosz = 2 punkty.
//   - Czysty rzut (piłka nie dotknie obręczy ani tablicy) = 3 punkty.
//   - 3 trafienia z rzędu = piłka w ogniu: punkty x2, aż spudłujesz.
//   - Kiedy rzucasz, kosz stoi w miejscu.
//   - Po każdym trafieniu kosz przenosi się w nowe miejsce: bliżej albo dalej, wyżej albo niżej.
//   - Co 10 punktów nowy poziom: kosz może stać coraz dalej, coraz wyżej i coraz niżej!
//     W trybie na czas dostajesz wtedy jeszcze 5 sekund więcej.
//
//  Sterowanie:
//   - Myszka albo palec: pociągnij do tyłu i puść – jak z procy.
//   - Klawiatura: ↑ ↓ zmienia kąt, trzymaj SPACJĘ i puść (siła rośnie i maleje).


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  czasGry: 60,                  // ile sekund trwa gra w trybie NA CZAS
  zyciaBezCzasu: 3,             // ile serc masz w trybie BEZ CZASU
  punktyZaKosz: 2,              // zwykły kosz
  punktyZaCzysty: 3,            // czysty rzut – piłka nie dotknęła obręczy ani tablicy
  seriaDoOgnia: 3,              // ile trafień z rzędu, żeby piłka zapłonęła
  mnoznikOgnia: 2,              // ile razy więcej punktów daje piłka w ogniu
  punktyNaPoziom: 10,           // co ile punktów nowy poziom
  dodatkowyCzasNaPoziom: 5,     // ile sekund dostajesz za nowy poziom
  koszZmieniaMiejsce: true,     // czy po trafieniu kosz przenosi się w inne miejsce
  koszGoraDol: 0.75,            // o ile metrów kosz może stanąć wyżej albo niżej niż zwykle (0 = zawsze tak samo wysoko)
  koszCiagleJezdzi: false,      // true = kosz CAŁY CZAS jeździ w górę i w dół, nawet gdy rzucasz (dużo trudniej!)
  szerokoscKosza: 1.1,          // jak szeroka jest obręcz (większa = łatwiej trafić)
  kropkiPomocy: 9,              // ile kropek pokazuje, jak poleci piłka (0 = bez pomocy!)
  grawitacja: 11,               // jak mocno piłka spada (na Ziemi naprawdę jest 9.8)
  odbijanie: 0.62,              // jak mocno piłka odbija się od podłogi (0 = wcale, 1 = jak kauczuk)
  numerNaKoszulce: 7,           // numer twojego zawodnika
  kolorKoszulki: '#4cc9f0',     // kolor koszulki
};

// Wszystko na boisku liczymy w metrach – tak jak na prawdziwym boisku
const PROMIEN_PILKI = 0.24;
const GRUBOSC_OBRECZY = 0.05;
const WYSOKOSC_KOSZA = 3.05;     // tyle metrów nad podłogą wisi prawdziwy kosz
const ODSTEP_TABLICY = 0.15;     // przerwa między obręczą a tablicą
const TABLICA_DOL = 0.2;         // o ile tablica wystaje pod obręcz
const TABLICA_GORA = 0.95;       // o ile tablica wystaje nad obręcz
const GRUBOSC_TABLICY = 0.08;
const DLUGOSC_SIATKI = 0.5;
const MIEJSCE_RZUTU = { x: 0.25, y: 2.25 };   // gdzie jest piłka w rękach zawodnika
const NAJWIEKSZA_PREDKOSC = 13.5;              // najmocniejszy rzut (metrów na sekundę)
const CZAS_PRZELADOWANIA = 0.3;                // po ilu sekundach dostajesz nową piłkę
const NAJWIECEJ_PILEK = 4;                     // ile piłek naraz może lecieć

const KOLORY_KONFETTI = ['#ffd23f', '#ff5a5f', '#4cc9f0', '#3ddc97', '#c77dff', '#ff9f1c'];
const KOLORY_KIBICOW = ['#ff5a5f', '#4cc9f0', '#ffd23f', '#3ddc97', '#c77dff', '#ff9f1c', '#f1f1f1'];
const KOLORY_SKORY = ['#f2c79b', '#e0a878', '#c68642', '#8d5524', '#f7d7b5'];


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

let stan = 'start';            // 'start' | 'odliczanie' | 'gra' | 'pauza' | 'koniec'
let tryb = wczytajTryb();      // tryb wybrany w okienku: 'naCzas' albo 'bezCzasu'
let trybGry = tryb;            // tryb, w którym toczy się (albo toczyła) gra
let punkty = 0;
let poziom = 1;
const rekordy = { naCzas: wczytajRekord('naCzas'), bezCzasu: wczytajRekord('bezCzasu') };   // każdy tryb ma swój rekord
let nowyRekord = false;
let pozostalyCzas = USTAWIENIA.czasGry;   // tylko w trybie na czas
let zycia = USTAWIENIA.zyciaBezCzasu;     // tylko w trybie bez czasu
let koniecRzutow = false;      // skończył się czas albo serca – nie można już rzucać
let poKoncu = 0;               // ile sekund minęło od końca rzucania
let ostatniaSekunda = 0;

let rzuty = 0;                 // ile razy rzuciłeś
let trafienia = 0;             // ile razy trafiłeś
let seria = 0;                 // ile trafień z rzędu
let najdluzszaSeria = 0;

let pilki = [];                // lecące piłki
let efekty = [];               // napisy, konfetti, ogień...
let kibice = [];               // ludzie na trybunach
let doping = 0;                // jak mocno kibice skaczą z radości (od 0 do 1)

// Kosz: x to środek obręczy (w metrach od zawodnika), y to wysokość obręczy
const kosz = {
  x: 5,
  y: WYSOKOSC_KOSZA,
  bazaY: WYSOKOSC_KOSZA,         // wysokość kosza bez bujania (bujanie jest tylko przy koszCiagleJezdzi)
  zX: 5, zY: WYSOKOSC_KOSZA,     // skąd kosz jedzie
  doX: 5, doY: WYSOKOSC_KOSZA,   // dokąd kosz jedzie
  przeprowadzka: 'nie',          // 'nie' = stoi, 'czeka' = zaraz pojedzie, 'jedzie' = właśnie jedzie
  czekaj: 0,
  jazda: 1,
  faza: 0,
  siatka: 0,
};

let przeladowanie = 0;         // ile sekund jeszcze do nowej piłki
let wReku = 1;                 // jak długo nowa piłka jest już w rękach (do animacji)
let celowanie = null;          // ciągnięcie myszką/palcem: { id, startX, startY, x, y }
let ladowanie = null;          // trzymanie spacji: { t }
let czekajacyRzut = null;      // rzut, który poleci, gdy tylko będzie nowa piłka
let katKlawiatury = 55 * Math.PI / 180;
let ostatnioKlawiatura = false;
const klawisze = { gora: false, dol: false };
let bezRzutu = true;           // jeszcze nie było rzutu – pokazujemy podpowiedź

let odliczanie = 0;            // 3, 2, 1, START!
let ostatniaCyfra = 0;
let czas = 0;
let koniecOd = 0;
let napisPoziomu = 0;
let wyciszone = false;

const L = {};                  // rozmiary ekranu


// =====================================================
//   ROZMIARY EKRANU
// =====================================================
function ogranicz(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Zamiana metrów z boiska na piksele na ekranie
function sx(x) {
  return L.ox + x * L.metr;
}

function sy(y) {
  return L.podloga - y * L.metr;
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

  L.hudH = 60;                                  // górny pasek
  L.hudW = Math.min(L.W, 760);
  L.hudX = (L.W - L.hudW) / 2;

  const szerSwiata = L.H > L.W ? 9.5 : 12;     // ile metrów boiska widać w poziomie
  const wysSwiata = 5.2;                        // ...i w pionie
  L.metr = Math.min(L.W / szerSwiata, (L.H - L.hudH - 16) / (wysSwiata + 0.7));   // ile pikseli ma 1 metr
  L.podloga = Math.min(L.H - 0.7 * L.metr - 8, L.hudH + (L.H - L.hudH) / 2 + (wysSwiata * L.metr) / 2);
  L.ox = (L.W - szerSwiata * L.metr) / 2 + L.metr;   // gdzie na ekranie stoi zawodnik
  L.prawyBrzeg = (L.W - L.ox) / L.metr;               // prawy brzeg ekranu (w metrach)
  L.lewyBrzeg = -L.ox / L.metr;                       // lewy brzeg ekranu (w metrach)
  L.fs = ogranicz(Math.min(L.W / 34, L.H / 32), 11, 20);   // wielkość napisów
  L.maxCiag = ogranicz(Math.min(L.W, L.H) * 0.4, 110, 300); // tyle pikseli trzeba pociągnąć do najmocniejszego rzutu

  przygotujKibicow();

  // Kosz musi się zmieścić na ekranie
  const [min, max] = zakresKosza();
  kosz.x = ogranicz(kosz.x, min, max);
  kosz.zX = ogranicz(kosz.zX, min, max);
  kosz.doX = ogranicz(kosz.doX, min, max);
}

function srodekSceny() {
  return L.hudH + (L.podloga - L.hudH) * 0.4;
}


// =====================================================
//   DŹWIĘK
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

    // Szum – losowe drgania. Z niego robimy szelest siatki, stuknięcia i krzyk kibiców.
    buforSzumu = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const dane = buforSzumu.getChannelData(0);
    for (let i = 0; i < dane.length; i++) dane[i] = Math.random() * 2 - 1;
  }
  if (audio.state === 'suspended') audio.resume();
  return true;
}

// Krótki dźwięk (pisk, bip)
function pisk(czestotliwosc, dlugosc = 0.15, typ = 'square', glosnosc = 0.12, opoznienie = 0) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime + opoznienie;
  const osc = audio.createOscillator();
  osc.type = typ;
  osc.frequency.value = czestotliwosc;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(glosnosc, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dlugosc);
  osc.connect(g);
  g.connect(wzmacniacz);
  osc.start(t);
  osc.stop(t + dlugosc + 0.02);
}

// Szum przepuszczony przez filtr: wysoki = szelest, niski = stuk
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

function dzwiekRzutu() {
  szum(0.18, 'bandpass', 900, 0.08, 0, 0.06);
}

function dzwiekObreczy(sila) {
  const g = ogranicz(sila / 6, 0.2, 1);
  pisk(587, 0.35, 'triangle', 0.12 * g);
  pisk(1480, 0.2, 'sine', 0.05 * g);
}

function dzwiekTablicy(sila) {
  const g = ogranicz(sila / 6, 0.2, 1);
  szum(0.12, 'lowpass', 600, 0.35 * g);
  pisk(140, 0.12, 'sine', 0.2 * g);
}

function dzwiekPodlogi(sila) {
  const g = ogranicz(sila / 7, 0.15, 1);
  pisk(90, 0.16, 'sine', 0.35 * g);
  szum(0.05, 'lowpass', 400, 0.12 * g);
}

function dzwiekKosza(czysty) {
  szum(0.32, 'highpass', 2500, 0.1, 0, 0.02);   // szszsz – piłka w siatce
  const nuty = czysty ? [784, 988, 1175, 1568] : [784, 1046];
  nuty.forEach((f, i) => pisk(f, 0.14, 'square', 0.06, 0.05 + i * 0.07));
}

function dzwiekDopingu() {
  szum(1.0, 'bandpass', 1100, 0.07, 0.05, 0.15);   // kibice krzyczą „Aaaa!”
}

function dzwiekOgnia() {
  [392, 523, 659, 784, 1046].forEach((f, i) => pisk(f, 0.1, 'sawtooth', 0.05, i * 0.05));
  szum(0.5, 'lowpass', 1500, 0.12, 0, 0.1);
}

function dzwiekPoziomu() {
  [523, 659, 784, 1046].forEach((f, i) => pisk(f, 0.12, 'square', 0.07, i * 0.08));
}

function dzwiekSyreny() {
  pisk(220, 1.0, 'sawtooth', 0.14);
  pisk(233, 1.0, 'square', 0.08);
}

function tik() {
  pisk(1200, 0.05, 'square', 0.05);
}

function dzwiekPudla() {
  pisk(220, 0.25, 'triangle', 0.14);
  pisk(165, 0.3, 'triangle', 0.12, 0.12);
}

function dzwiekKonca() {
  [392, 330, 262, 196].forEach((f, i) => pisk(f, 0.3, 'triangle', 0.18, 0.2 + i * 0.25));
}

// Żeby piłka nie hałasowała 100 razy na sekundę, gdy się toczy
function halas(p, co, sila) {
  if (czas - p.ostatniHalas < 0.07) return;
  p.ostatniHalas = czas;
  if (co === 'obrecz') dzwiekObreczy(sila);
  else if (co === 'tablica') dzwiekTablicy(sila);
  else dzwiekPodlogi(sila);
}


// =====================================================
//   REKORDY I TRYB GRY (zapamiętywane w przeglądarce)
// =====================================================
const KLUCZE_REKORDOW = {
  naCzas: 'koszykowka-rekord',
  bezCzasu: 'koszykowka-rekord-bez-czasu',
};

function wczytajRekord(jakiTryb) {
  try {
    return parseInt(localStorage.getItem(KLUCZE_REKORDOW[jakiTryb]), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(jakiTryb, wynik) {
  try {
    localStorage.setItem(KLUCZE_REKORDOW[jakiTryb], String(wynik));
  } catch (e) {
    // nic się nie stało – rekord po prostu nie zostanie zapamiętany
  }
}

// Gra pamięta, w którym trybie grałeś ostatnio
function wczytajTryb() {
  try {
    return localStorage.getItem('koszykowka-tryb') === 'bezCzasu' ? 'bezCzasu' : 'naCzas';
  } catch (e) {
    return 'naCzas';
  }
}

function wybierzTryb(nowy) {
  tryb = nowy;
  try {
    localStorage.setItem('koszykowka-tryb', nowy);
  } catch (e) {
    // trudno – następnym razem będzie tryb domyślny
  }
}


// =====================================================
//   PRZEBIEG GRY
// =====================================================

// Jak blisko i jak daleko może stać kosz
function zakresKosza() {
  const s = USTAWIENIA.szerokoscKosza / 2;
  const naEkranie = L.prawyBrzeg - s - ODSTEP_TABLICY - GRUBOSC_TABLICY - 0.6;   // miejsce na tablicę i słup
  const naPoziomie = 5.5 + (poziom - 1) * 0.7;   // na wyższych poziomach kosz może stać dalej
  const min = 3.6;
  const max = Math.max(min + 0.4, Math.min(naEkranie, naPoziomie));
  return [min, max];
}

// Jak nisko i jak wysoko może wisieć kosz (na wyższych poziomach rozrzut jest większy)
function zakresWysokosci() {
  const rozrzut = Math.min(USTAWIENIA.koszGoraDol, 0.35 + (poziom - 1) * 0.1);
  return [
    Math.max(2.0, WYSOKOSC_KOSZA - rozrzut),   // niżej nie, bo zawodnik by uderzył głową w siatkę
    Math.min(4.1, WYSOKOSC_KOSZA + rozrzut),   // wyżej nie, bo tablica by się nie zmieściła na ekranie
  ];
}

function nowaGra() {
  przygotujDzwiek();
  punkty = 0;
  poziom = 1;
  nowyRekord = false;
  pozostalyCzas = USTAWIENIA.czasGry;
  zycia = USTAWIENIA.zyciaBezCzasu;
  trybGry = tryb;
  koniecRzutow = false;
  poKoncu = 0;
  ostatniaSekunda = Math.ceil(pozostalyCzas);
  rzuty = 0;
  trafienia = 0;
  seria = 0;
  najdluzszaSeria = 0;
  pilki = [];
  efekty = [];
  przeladowanie = 0;
  wReku = 1;
  celowanie = null;
  ladowanie = null;
  czekajacyRzut = null;
  bezRzutu = true;
  napisPoziomu = 0;
  Object.assign(kosz, {
    y: WYSOKOSC_KOSZA, bazaY: WYSOKOSC_KOSZA, zY: WYSOKOSC_KOSZA, doY: WYSOKOSC_KOSZA,
    przeprowadzka: 'nie', czekaj: 0, jazda: 1, faza: 0, siatka: 0,
  });
  const [min, max] = zakresKosza();
  kosz.x = kosz.zX = kosz.doX = ogranicz(4.6, min, max);
  odliczanie = 3;
  ostatniaCyfra = 4;
  stan = 'odliczanie';
}

function aktualizujOdliczanie(dt) {
  odliczanie -= dt;
  const cyfra = Math.ceil(odliczanie);
  if (cyfra !== ostatniaCyfra) {
    ostatniaCyfra = cyfra;
    if (cyfra >= 1) pisk(440, 0.18, 'square', 0.1);
  }
  if (odliczanie <= 0) {
    stan = 'gra';
    pisk(880, 0.45, 'square', 0.12);
    efekty.push({ typ: 'start', t: 0, dlugosc: 0.9 });
  }
}

// Strzałki zmieniają kąt, a gdy trzymasz spację – rośnie siła
function aktualizujSterowanie(dt) {
  if (klawisze.gora) katKlawiatury += 1.1 * dt;
  if (klawisze.dol) katKlawiatury -= 1.1 * dt;
  katKlawiatury = ogranicz(katKlawiatury, 0.2, 1.45);
  if (ladowanie) ladowanie.t += dt;
}

function aktualizujGre(dt) {
  // Zegar – tylko w trybie na czas
  if (!koniecRzutow && trybGry === 'naCzas') {
    pozostalyCzas -= dt;
    const sek = Math.ceil(pozostalyCzas);
    if (sek !== ostatniaSekunda) {
      ostatniaSekunda = sek;
      if (sek >= 1 && sek <= 5) tik();   // ostatnie sekundy tykają
    }
    if (pozostalyCzas <= 0) syrena();
  } else if (koniecRzutow) {
    // Po końcu czekamy, aż wszystkie lecące piłki spadną – może któraś jeszcze wpadnie!
    poKoncu += dt;
    const wszystkieSpadly = pilki.every((p) => p.rozstrzygnieta);
    if (poKoncu > 1 && (wszystkieSpadly || poKoncu > 4)) {
      koniecGry();
      return;
    }
  }

  aktualizujSterowanie(dt);

  // Nowa piłka w rękach
  if (przeladowanie > 0) {
    przeladowanie -= dt;
    if (przeladowanie <= 0) {
      przeladowanie = 0;
      wReku = 0;
    }
  } else {
    wReku += dt;
  }
  if (czekajacyRzut && moznaRzucic()) {
    rzuc(czekajacyRzut.kat, czekajacyRzut.sila);
    czekajacyRzut = null;
  }

  aktualizujKosz(dt);
  aktualizujPilki(dt);
}

function syrena() {
  pozostalyCzas = 0;
  koniecRzutow = true;
  poKoncu = 0;
  celowanie = null;
  ladowanie = null;
  czekajacyRzut = null;
  dzwiekSyreny();
  napis('Koniec czasu!', L.W / 2, srodekSceny(), '#ff5a5f', true, 1.6);
}

// Tryb bez czasu: skończyły się serca
function koniecSerc() {
  koniecRzutow = true;
  poKoncu = 0;
  celowanie = null;
  ladowanie = null;
  czekajacyRzut = null;
  dzwiekKonca();
  napis('Koniec serc!', L.W / 2, srodekSceny(), '#ff5a5f', true, 1.6);
}

function koniecGry() {
  stan = 'koniec';
  koniecOd = czas;
  for (const p of pilki) p.rozstrzygnieta = true;   // po końcu gry już nic się nie liczy
  if (punkty > rekordy[trybGry]) {
    rekordy[trybGry] = punkty;
    nowyRekord = true;
    zapiszRekord(trybGry, punkty);
  }
}

// ---------- Kosz ----------
function prostokatTablicy() {
  return {
    x: kosz.x + USTAWIENIA.szerokoscKosza / 2 + ODSTEP_TABLICY,
    y: kosz.y - TABLICA_DOL,           // dolna krawędź
    w: GRUBOSC_TABLICY,
    h: TABLICA_DOL + TABLICA_GORA,
  };
}

function aktualizujKosz(dt) {
  kosz.siatka = Math.max(0, kosz.siatka - dt * 1.8);

  // Po trafieniu kosz chwilę czeka (aż piłka wypadnie z siatki i wszystkie piłki spadną),
  // a potem jedzie w nowe miejsce: w przód albo w tył I w górę albo w dół
  if (kosz.przeprowadzka === 'czeka') {
    kosz.czekaj -= dt;
    const nicNieLeci = pilki.every((p) => p.rozstrzygnieta);
    if (kosz.czekaj <= 0 && nicNieLeci) przesunKosz();
  } else if (kosz.przeprowadzka === 'jedzie') {
    kosz.jazda = Math.min(1, kosz.jazda + dt / 0.55);
    const e = kosz.jazda * kosz.jazda * (3 - 2 * kosz.jazda);   // płynnie rusza i płynnie hamuje
    kosz.x = kosz.zX + (kosz.doX - kosz.zX) * e;
    kosz.bazaY = kosz.zY + (kosz.doY - kosz.zY) * e;
    if (kosz.jazda >= 1) kosz.przeprowadzka = 'nie';   // dojechał – można rzucać
  }

  // Tylko gdy włączysz koszCiagleJezdzi: kosz cały czas buja się w górę i w dół
  if (USTAWIENIA.koszCiagleJezdzi) {
    kosz.faza += dt * Math.min(2.2, 1.0 + 0.15 * (poziom - 1));
    kosz.y = kosz.bazaY + Math.sin(kosz.faza) * 0.4;
  } else {
    kosz.y = kosz.bazaY;
  }
}

// Losujemy nowe miejsce dla kosza: bliżej albo dalej, wyżej albo niżej
function przesunKosz() {
  const [minX, maxX] = zakresKosza();
  const [minY, maxY] = zakresWysokosci();
  let x = kosz.x;
  let y = kosz.bazaY;
  for (let i = 0; i < 20; i++) {
    x = minX + Math.random() * (maxX - minX);
    y = minY + Math.random() * (maxY - minY);
    // niech przesunie się porządnie – w bok, w górę/dół albo tu i tu
    const wBok = Math.abs(x - kosz.x) / (maxX - minX);
    const wGore = maxY > minY ? Math.abs(y - kosz.bazaY) / (maxY - minY) : 0;
    if (Math.hypot(wBok, wGore) > 0.4) break;
  }
  kosz.zX = kosz.x;
  kosz.zY = kosz.bazaY;
  kosz.doX = x;
  kosz.doY = y;
  kosz.jazda = 0;
  kosz.przeprowadzka = 'jedzie';
}

// ---------- Rzucanie ----------
function pilkaWRekach() {
  return (stan === 'start' || stan === 'odliczanie' || stan === 'gra' || stan === 'pauza') &&
    !koniecRzutow && przeladowanie <= 0;
}

function moznaRzucic() {
  return stan === 'gra' && !koniecRzutow && przeladowanie <= 0 && kosz.przeprowadzka === 'nie' &&
    pilki.filter((p) => !p.rozstrzygnieta).length < NAJWIECEJ_PILEK;
}

function sprobujRzucic(kat, sila) {
  if (stan !== 'gra' || koniecRzutow) return;
  if (kosz.przeprowadzka !== 'nie') {
    // Kosz właśnie zmienia miejsce – nie rzucamy, bo celowałeś w stare miejsce
    napis('Czekaj na kosz!', sx(MIEJSCE_RZUTU.x + 1.0), sy(MIEJSCE_RZUTU.y + 1.0), '#ffd23f');
    return;
  }
  if (moznaRzucic()) rzuc(kat, sila);
  else czekajacyRzut = { kat, sila };   // poleci, jak tylko będzie nowa piłka
}

// kat: w radianach (0 = prosto w prawo), sila: od 0 do 1
function rzuc(kat, sila) {
  const v = NAJWIEKSZA_PREDKOSC * sila;
  pilki.push({
    x: MIEJSCE_RZUTU.x,
    y: MIEJSCE_RZUTU.y,
    vx: Math.cos(kat) * v,
    vy: Math.sin(kat) * v,
    kat: 0,
    wirowanie: -8,          // piłka kręci się do tyłu – jak u prawdziwych koszykarzy
    obrecz: false,          // czy dotknęła obręczy
    tablica: false,         // czy dotknęła tablicy
    trafiona: false,
    rozstrzygnieta: false,  // już wiadomo: kosz albo pudło
    odDolu: false,          // wleciała w kosz od dołu (to się nie liczy!)
    ogien: seria >= USTAWIENIA.seriaDoOgnia,
    czas: 0,
    naPodlodze: 0,
    alfa: 1,
    ostatniHalas: -1,
  });
  rzuty++;
  bezRzutu = false;
  przeladowanie = CZAS_PRZELADOWANIA;
  dzwiekRzutu();
}

// Siła przy trzymaniu spacji: rośnie, a potem maleje – trzeba puścić w dobrym momencie
function silaLadowania() {
  return 0.25 + 0.75 * (0.5 - 0.5 * Math.cos(ladowanie.t * 2.4));
}

// Z ciągnięcia myszką liczymy kąt i siłę rzutu (ciągniesz do tyłu = piłka leci do przodu)
function strzalZCelowania(c) {
  const wx = c.startX - c.x;
  const wy = c.y - c.startY;
  const dl = Math.hypot(wx, wy);
  if (dl < 12) return null;   // za krótko – to było zwykłe kliknięcie
  return {
    kat: ogranicz(Math.atan2(wy, wx), -0.3, 1.5),
    sila: ogranicz(dl / L.maxCiag, 0.08, 1),
  };
}

function obecnyCel() {
  if (celowanie) return strzalZCelowania(celowanie);
  if (ladowanie) return { kat: katKlawiatury, sila: silaLadowania() };
  return null;
}

// ---------- Piłki i odbicia ----------
function aktualizujPilki(dt) {
  const kroki = Math.max(1, Math.ceil(dt / 0.004));   // małe kroczki, żeby piłka nie przeleciała przez obręcz
  const h = dt / kroki;
  for (const p of pilki) {
    for (let i = 0; i < kroki; i++) ruszPilke(p, h);
    p.czas += dt;
    p.kat += p.wirowanie * dt;

    // Piłka w ogniu zostawia płomienie
    if (p.ogien && p.y > PROMIEN_PILKI + 0.05 && Math.random() < 0.8) plomyk(sx(p.x), sy(p.y));

    // Leży na podłodze? Po chwili znika.
    if (p.y <= PROMIEN_PILKI + 0.02 && Math.abs(p.vy) < 0.6) p.naPodlodze += dt;
    if (p.naPodlodze > 1.0) p.alfa = Math.max(0, p.alfa - dt * 2.5);

    // Wyleciała za ekran albo leci za długo
    const poza = p.x < L.lewyBrzeg - 1 || p.x > L.prawyBrzeg + 1;
    if (!p.rozstrzygnieta && (poza || p.czas > 9)) pudlo(p);
    if (poza || p.czas > 10) p.alfa = 0;
  }
  pilki = pilki.filter((p) => p.alfa > 0);
}

function ruszPilke(p, h) {
  const R = PROMIEN_PILKI;
  const s = USTAWIENIA.szerokoscKosza / 2;
  const przed = p.y - kosz.y;

  // Grawitacja ściąga piłkę w dół
  p.vy -= USTAWIENIA.grawitacja * h;
  p.x += p.vx * h;
  p.y += p.vy * h;

  const po = p.y - kosz.y;
  const nadKoszem = p.x > kosz.x - s && p.x < kosz.x + s;

  // Środek piłki przeleciał przez obręcz z góry na dół – KOSZ!
  if (nadKoszem && przed >= 0 && po < 0 && !p.rozstrzygnieta && !p.odDolu) trafienie(p);
  // Wleciała w kosz od dołu – to się nie liczy
  if (nadKoszem && przed < 0 && po >= 0) p.odDolu = true;

  // W siatce piłka zwalnia i siatka ściąga ją na środek
  if (nadKoszem && po < 0 && po > -DLUGOSC_SIATKI) {
    const opor = Math.min(1, 6 * h);
    p.vx += ((kosz.x - p.x) * 6 - p.vx) * opor;
    if (p.vy < -2) p.vy *= 1 - 2 * h;
  }

  // Obręcz – przedni i tylny brzeg
  for (const ox of [kosz.x - s, kosz.x + s]) {
    const uderzenie = odbijOdPunktu(p, ox, kosz.y, GRUBOSC_OBRECZY, 0.55);
    if (uderzenie > 0) {
      p.obrecz = true;
      if (uderzenie > 0.7) {
        halas(p, 'obrecz', uderzenie);
        p.wirowanie *= -0.6;
      }
    }
  }

  // Tablica
  const uderzenie = odbijOdProstokata(p, prostokatTablicy(), 0.7);
  if (uderzenie > 0) {
    p.tablica = true;
    if (uderzenie > 0.7) halas(p, 'tablica', uderzenie);
  }

  // Podłoga
  if (p.y < R) {
    p.y = R;
    if (p.vy < 0) {
      const sila = -p.vy;
      p.vy = sila > 0.8 ? sila * USTAWIENIA.odbijanie : 0;
      p.vx *= 0.9;
      if (sila > 0.8) halas(p, 'podloga', sila);
      if (!p.rozstrzygnieta) pudlo(p);   // dotknęła podłogi, zanim wpadła – pudło
    }
    p.vx *= 1 - 1.2 * h;    // tarcie o podłogę
    p.wirowanie = p.vx / R; // toczy się
  }
}

// Odbicie piłki od małego kółka (brzegu obręczy albo rogu tablicy).
// Zwraca, jak mocno piłka uderzyła (0 = wcale nie dotknęła).
function odbijOdPunktu(p, ox, oy, r, sprezystosc) {
  const R = PROMIEN_PILKI;
  const dx = p.x - ox;
  const dy = p.y - oy;
  const min = R + r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= min * min) return 0;

  let nx = 0;
  let ny = 1;
  if (d2 > 1e-10) {
    const d = Math.sqrt(d2);
    nx = dx / d;
    ny = dy / d;
  }
  // Wypychamy piłkę na zewnątrz
  p.x = ox + nx * min;
  p.y = oy + ny * min;

  // Leży idealnie na czubku? Lekko ją trącamy, żeby nie została tam na zawsze.
  if (Math.abs(dx) < 0.02 && dy > 0) p.vx += (Math.random() - 0.5) * 0.6;

  const vn = p.vx * nx + p.vy * ny;   // jak szybko piłka leci w stronę przeszkody
  if (vn >= 0) return 0.001;          // dotyka, ale już odlatuje

  const tx = -ny;
  const ty = nx;
  const vt = p.vx * tx + p.vy * ty;   // jak szybko piłka sunie wzdłuż przeszkody
  const noweVn = -vn * sprezystosc;
  const noweVt = vt * 0.9;
  p.vx = nx * noweVn + tx * noweVt;
  p.vy = ny * noweVn + ty * noweVt;
  return -vn;
}

// Odbicie od prostokąta (tablicy): szukamy punktu prostokąta najbliżej piłki
function odbijOdProstokata(p, t, sprezystosc) {
  const nx = ogranicz(p.x, t.x, t.x + t.w);
  const ny = ogranicz(p.y, t.y, t.y + t.h);
  if (nx === p.x && ny === p.y) {
    // Środek piłki wpadł w tablicę – wypychamy ją z powrotem
    const u = Math.abs(p.vx);
    p.x = p.vx > 0 ? t.x - PROMIEN_PILKI : t.x + t.w + PROMIEN_PILKI;
    p.vx = -p.vx * sprezystosc;
    return Math.max(0.001, u);
  }
  return odbijOdPunktu(p, nx, ny, 0, sprezystosc);
}

// ---------- Kosz albo pudło ----------
function trafienie(p) {
  p.trafiona = true;
  p.rozstrzygnieta = true;
  trafienia++;
  seria++;
  najdluzszaSeria = Math.max(najdluzszaSeria, seria);

  const czysty = !p.obrecz && !p.tablica;
  let pkt = czysty ? USTAWIENIA.punktyZaCzysty : USTAWIENIA.punktyZaKosz;
  if (p.ogien) pkt *= USTAWIENIA.mnoznikOgnia;
  punkty += pkt;

  const x = sx(kosz.x);
  const y = sy(kosz.y) - L.metr * 0.9;
  let opis = czysty ? 'Czysto!' : p.tablica ? 'Z tablicy!' : 'Kosz!';
  if (koniecRzutow && trybGry === 'naCzas') opis = 'Rzut z syreną!';
  napis(`+${pkt}`, x, y, '#ffd23f', true);
  napis(opis, x, y - L.fs * 2.4, czysty ? '#3ddc97' : '#ffffff');

  if (seria === USTAWIENIA.seriaDoOgnia) {
    napis(`W ogniu! Punkty ×${USTAWIENIA.mnoznikOgnia}`, L.W / 2, srodekSceny(), '#ff9f1c', true, 1.6);
    dzwiekOgnia();
  }

  konfetti(x, sy(kosz.y), czysty ? 30 : 18);
  kosz.siatka = 1;
  if (USTAWIENIA.koszZmieniaMiejsce && !koniecRzutow) {
    kosz.przeprowadzka = 'czeka';   // za chwilę kosz pojedzie w nowe miejsce
    kosz.czekaj = 0.45;
    czekajacyRzut = null;           // ten rzut był wycelowany w stare miejsce
  }
  doping = czysty ? 1 : 0.7;
  dzwiekKosza(czysty);
  if (czysty) dzwiekDopingu();
  sprawdzPoziom();
}

function pudlo(p) {
  p.rozstrzygnieta = true;
  if (seria >= USTAWIENIA.seriaDoOgnia) {
    napis('Ogień zgasł…', sx(kosz.x), sy(kosz.y) - L.metr * 1.2, '#a9a3d9');
  }
  seria = 0;

  // Tryb bez czasu: pudło zabiera jedno serce
  if (trybGry === 'bezCzasu' && zycia > 0 && stan === 'gra') {
    zycia--;
    dzwiekPudla();
    napis('Pudło! −1 ♥', sx(ogranicz(p.x, L.lewyBrzeg + 1, L.prawyBrzeg - 1)), sy(1.2), '#ff4d6d', true);
    if (zycia <= 0) koniecSerc();
  }
}

function sprawdzPoziom() {
  const nowy = 1 + Math.floor(punkty / USTAWIENIA.punktyNaPoziom);
  if (nowy > poziom) {
    poziom = nowy;
    if (!koniecRzutow && trybGry === 'naCzas') pozostalyCzas += USTAWIENIA.dodatkowyCzasNaPoziom;
    napisPoziomu = 2;
    dzwiekPoziomu();
  }
}


// =====================================================
//   EFEKTY: napisy, konfetti, ogień
// =====================================================
function napis(tekst, x, y, kolor, duzy = false, dlugosc = 0.9) {
  efekty.push({ typ: 'napis', tekst, x, y, kolor, duzy, t: 0, dlugosc });
}

function konfetti(x, y, ile) {
  const m = L.metr;
  for (let i = 0; i < ile; i++) {
    efekty.push({
      typ: 'konfetti', x, y,
      vx: (Math.random() - 0.5) * m * 5,
      vy: -m * (1.5 + Math.random() * 3),
      g: m * 6,
      kolor: KOLORY_KONFETTI[Math.floor(Math.random() * KOLORY_KONFETTI.length)],
      kat: Math.random() * 6.28,
      vk: (Math.random() - 0.5) * 12,
      roz: m * 0.07 * (0.7 + Math.random() * 0.6),
      t: 0, dlugosc: 1 + Math.random() * 0.6,
    });
  }
}

function plomyk(x, y) {
  const m = L.metr;
  efekty.push({
    typ: 'plomien',
    x: x + (Math.random() - 0.5) * m * 0.25,
    y: y + (Math.random() - 0.5) * m * 0.25,
    vx: (Math.random() - 0.5) * 20,
    vy: -30 - Math.random() * 40,
    r: m * (0.08 + Math.random() * 0.1),
    t: 0, dlugosc: 0.35 + Math.random() * 0.2,
  });
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.t += dt;
    if (e.vx !== undefined) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    if (e.g) e.vy += e.g * dt;
    if (e.vk) e.kat += e.vk * dt;
  }
  efekty = efekty.filter((e) => e.t < e.dlugosc);
  napisPoziomu = Math.max(0, napisPoziomu - dt);
  doping = Math.max(0, doping - dt * 0.6);
}


// =====================================================
//   KIBICE NA TRYBUNACH
// =====================================================
function przygotujKibicow() {
  kibice = [];
  const odstep = 0.48 * L.metr;
  for (let rzad = 0; rzad < 3; rzad++) {
    for (let x = (rzad % 2) * odstep * 0.5; x < L.W + odstep; x += odstep) {
      kibice.push({
        x: x + (Math.random() - 0.5) * odstep * 0.3,
        rzad,
        kolor: KOLORY_KIBICOW[Math.floor(Math.random() * KOLORY_KIBICOW.length)],
        skora: KOLORY_SKORY[Math.floor(Math.random() * KOLORY_SKORY.length)],
        faza: Math.random() * 6.28,
        skok: 0.5 + Math.random() * 0.5,
      });
    }
  }
}


// =====================================================
//   STEROWANIE
// =====================================================

// ---------- Przyciski w okienkach ----------
// Okienko zapamiętuje tu, gdzie narysowało przyciski, żeby dało się je kliknąć.
// Każdy przycisk: { x, y, w, h, akcja }, a akcja to 'menu', 'naCzas' albo 'bezCzasu'.
let przyciski = [];

function przyciskPod(x, y) {
  for (const p of przyciski) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p.akcja;
  }
  return null;
}

function idzDoMenu() {
  window.location.href = '../index.html';
}

function elementMenu(fs) {
  return { przycisk: 'menu', tekst: '← Menu gier (Q)', rozmiar: fs * 0.9, gruba: true, kolor: '#e4ddff' };
}

function akcjaGlowna() {
  if (stan === 'start') nowaGra();
  else if (stan === 'pauza') stan = 'gra';
  else if (stan === 'koniec' && czas - koniecOd > 1) nowaGra(); // sekunda przerwy, żeby nie zacząć przez przypadek
}

function przerwijCelowanie() {
  celowanie = null;
  ladowanie = null;
  klawisze.gora = false;
  klawisze.dol = false;
}

function przelaczPauze() {
  if (stan === 'gra') {
    stan = 'pauza';
    przerwijCelowanie();
  } else if (stan === 'pauza') {
    stan = 'gra';
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (e.repeat) return;
    if (stan === 'gra') {
      // W czasie gry spacja ładuje rzut
      if (!koniecRzutow && !ladowanie && !celowanie) {
        ladowanie = { t: 0 };
        ostatnioKlawiatura = true;
      }
    } else {
      akcjaGlowna();
    }
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
  if (e.code === 'KeyQ' && stan !== 'gra' && stan !== 'odliczanie') {
    idzDoMenu();
    return;
  }
  // Na ekranie startowym i na końcu: ← → wybiera tryb gry
  if (stan === 'start' || stan === 'koniec') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') wybierzTryb('naCzas');
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') wybierzTryb('bezCzasu');
    return;
  }
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    klawisze.gora = true;
    ostatnioKlawiatura = true;
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    klawisze.dol = true;
    ostatnioKlawiatura = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (ladowanie) {
      const sila = silaLadowania();
      ladowanie = null;
      sprobujRzucic(katKlawiatury, sila);
    }
  } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    klawisze.gora = false;
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    klawisze.dol = false;
  }
});

// Myszka i dotyk: wciśnij, pociągnij do tyłu i puść
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (stan !== 'gra' && stan !== 'odliczanie') {
    const akcja = przyciskPod(e.clientX, e.clientY);
    if (akcja === 'menu') {
      idzDoMenu();
    } else if (akcja === 'naCzas' || akcja === 'bezCzasu') {
      wybierzTryb(akcja);   // kliknięcie w tryb od razu go włącza
      akcjaGlowna();
    } else {
      akcjaGlowna();
    }
    return;
  }
  if (e.clientY < L.hudH) {   // stuknięcie w górny pasek = pauza
    przelaczPauze();
    return;
  }
  if (koniecRzutow || celowanie || ladowanie) return;
  celowanie = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY };
  ostatnioKlawiatura = false;
  try {
    plotno.setPointerCapture(e.pointerId);
  } catch (err) {
    // bez tego też zadziała
  }
});

plotno.addEventListener('pointermove', (e) => {
  if (celowanie && e.pointerId === celowanie.id) {
    celowanie.x = e.clientX;
    celowanie.y = e.clientY;
  }
});

function puscCelowanie(e, anuluj) {
  if (!celowanie || e.pointerId !== celowanie.id) return;
  const c = celowanie;
  celowanie = null;
  if (anuluj) return;
  c.x = e.clientX;
  c.y = e.clientY;
  const strzal = strzalZCelowania(c);
  if (strzal) sprobujRzucic(strzal.kat, strzal.sila);
}

plotno.addEventListener('pointerup', (e) => puscCelowanie(e, false));
plotno.addEventListener('pointercancel', (e) => puscCelowanie(e, true));
plotno.addEventListener('contextmenu', (e) => e.preventDefault());

// Gdy przełączysz kartę albo okno – gra sama się pauzuje
function pauzaPrzyWyjsciu() {
  if (stan === 'gra') stan = 'pauza';
  przerwijCelowanie();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzaPrzyWyjsciu();
});
window.addEventListener('blur', pauzaPrzyWyjsciu);

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   RYSOWANIE – narzędzia
// =====================================================

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

function kolo(x, y, r, kolor) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = kolor;
  ctx.fill();
}

function linia(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function czcionka(rozmiar, gruba) {
  return `${gruba ? '700 ' : ''}${Math.round(rozmiar)}px "Segoe UI", system-ui, -apple-system, sans-serif`;
}

// Napis z ciemną obwódką – dobrze go widać na każdym tle
function tekstZObwodka(tekst, x, y, kolor, grubosc = 4) {
  ctx.lineWidth = grubosc;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeText(tekst, x, y);
  ctx.fillStyle = kolor;
  ctx.fillText(tekst, x, y);
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

function slowoSekund(n) {
  if (n === 1) return 'sekundę';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'sekundy';
  return 'sekund';
}

function slowoSerc(n) {
  if (n === 1) return 'serce';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'serca';
  return 'serc';
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

// Mała tarcza zegara: (x, y) to środek
function zegarek(x, y, r, kolor, wskazowka) {
  ctx.strokeStyle = kolor;
  ctx.lineWidth = Math.max(1.5, r * 0.25);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  linia(x, y, x + Math.cos(wskazowka) * r * 0.7, y + Math.sin(wskazowka) * r * 0.7);
}


// =====================================================
//   RYSOWANIE – hala, kosz, zawodnik, piłki
// =====================================================
function rysujHale() {
  const { W, H, metr, podloga } = L;

  // Ściana hali
  const g = ctx.createLinearGradient(0, L.hudH, 0, podloga);
  g.addColorStop(0, '#0b1026');
  g.addColorStop(1, '#2a1d63');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, podloga);

  // Lampy pod sufitem
  for (let i = 0; i < 4; i++) {
    const x = W * (0.125 + i * 0.25);
    const y = L.hudH + 4;
    const swiatlo = ctx.createRadialGradient(x, y, 0, x, y, metr * 2.4);
    swiatlo.addColorStop(0, 'rgba(255,240,200,0.16)');
    swiatlo.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = swiatlo;
    ctx.fillRect(x - metr * 2.4, y, metr * 4.8, metr * 2.4);
    sciezkaZaokraglona(x - metr * 0.3, y - 2, metr * 0.6, 6, 3);
    ctx.fillStyle = '#fff6d6';
    ctx.fill();
  }

  rysujKibicow();

  // Bandy reklamowe przy boisku
  const bandaH = 0.42 * metr;
  const bandaY = podloga - bandaH;
  ctx.fillStyle = '#251c5c';
  ctx.fillRect(0, bandaY, W, bandaH);
  ctx.fillStyle = 'rgba(180,160,255,0.35)';
  ctx.fillRect(0, bandaY, W, 2);
  ctx.font = czcionka(Math.max(8, bandaH * 0.48), true);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const reklama = 'GRY SEWERYNA  ★  KOSZYKÓWKA  ★  ';
  const szer = ctx.measureText(reklama).width;
  const przesun = (czas * 25) % szer;
  ctx.fillStyle = 'rgba(255,210,63,0.75)';
  for (let x = -przesun; x < W; x += szer) ctx.fillText(reklama, x, bandaY + bandaH / 2 + 1);

  // Drewniana podłoga
  const pg = ctx.createLinearGradient(0, podloga, 0, H);
  pg.addColorStop(0, '#d39455');
  pg.addColorStop(1, '#9c5f2e');
  ctx.fillStyle = pg;
  ctx.fillRect(0, podloga, W, H - podloga);
  ctx.strokeStyle = 'rgba(90,50,20,0.25)';
  ctx.lineWidth = 1;
  let y = podloga;
  let krok = 0.08 * metr;
  while (y < H) {
    y += krok;
    krok *= 1.35;   // im bliżej nas, tym szersze deski
    linia(0, y, W, y);
  }

  // Pomalowane pole pod koszem i linia rzutu pod zawodnikiem
  const poleH = Math.min(0.35 * metr, H - podloga);
  ctx.fillStyle = 'rgba(199,125,255,0.3)';
  ctx.fillRect(sx(kosz.x - 1.9), podloga, 2.6 * metr, poleH);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(sx(kosz.x - 1.9) - 2, podloga, 3, poleH);
  ctx.fillRect(sx(-0.45), podloga + poleH * 0.45, 0.9 * metr, 3);

  ctx.fillStyle = 'rgba(255,230,190,0.5)';
  ctx.fillRect(0, podloga, W, 2);
}

function rysujKibicow() {
  const m = L.metr;
  const dol = L.podloga - 0.42 * m;   // trybuny kończą się nad bandami
  const rzadH = 0.55 * m;
  const gora = dol - 3 * rzadH - 0.1 * m;

  ctx.fillStyle = '#140f33';
  ctx.fillRect(0, gora, L.W, dol - gora);
  for (let r = 0; r < 3; r++) {
    ctx.fillStyle = r % 2 ? '#18123d' : '#1c1646';
    ctx.fillRect(0, gora + 0.1 * m + r * rzadH, L.W, rzadH);
  }

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#000';
  for (const k of kibice) {
    const baza = gora + 0.1 * m + (k.rzad + 1) * rzadH;
    // Kibice lekko się kołyszą, a po trafieniu skaczą z radości
    const podskok = (Math.abs(Math.sin(czas * 9 + k.faza)) * doping * k.skok + (Math.sin(czas * 1.5 + k.faza) + 1) * 0.03) * 0.3 * m;
    const y = baza - podskok;
    // ręce w górze
    if (doping > 0.25) {
      ctx.strokeStyle = k.skora;
      ctx.lineWidth = Math.max(1.5, 0.05 * m);
      ctx.lineCap = 'round';
      linia(k.x - 0.12 * m, y - 0.26 * m, k.x - 0.2 * m, y - 0.55 * m);
      linia(k.x + 0.12 * m, y - 0.26 * m, k.x + 0.2 * m, y - 0.55 * m);
    }
    sciezkaZaokraglona(k.x - 0.15 * m, y - 0.3 * m, 0.3 * m, 0.3 * m, [0.1 * m, 0.1 * m, 0, 0]);
    ctx.fillStyle = k.kolor;
    ctx.fill();
    kolo(k.x, y - 0.4 * m, 0.11 * m, k.skora);
  }
  ctx.globalAlpha = 1;
}

function rysujCienie() {
  const m = L.metr;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx(0), L.podloga + 2, 0.4 * m, 0.08 * m, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const p of pilki) {
    const wys = Math.max(0, p.y - PROMIEN_PILKI);
    const alfa = 0.3 * Math.max(0, 1 - wys / 6) * p.alfa;
    if (alfa <= 0) continue;
    ctx.fillStyle = `rgba(0,0,0,${alfa})`;
    ctx.beginPath();
    ctx.ellipse(sx(p.x), L.podloga + 2, PROMIEN_PILKI * m * (1 + wys * 0.15), 0.06 * m, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Tył kosza: słup, tablica i tylna część obręczy (piłka przelatuje PRZED nimi)
function rysujKoszTyl() {
  const m = L.metr;
  const s = USTAWIENIA.szerokoscKosza / 2;
  const t = prostokatTablicy();
  const slupX = t.x + t.w + 0.45;
  const ramieY = kosz.y + 0.45;

  // Słup z miękką osłoną na dole
  ctx.fillStyle = '#6f6c8f';
  ctx.fillRect(sx(slupX) - 0.07 * m, sy(ramieY + 0.05), 0.14 * m, L.podloga - sy(ramieY + 0.05));
  sciezkaZaokraglona(sx(slupX) - 0.22 * m, L.podloga - 1.1 * m, 0.44 * m, 1.1 * m + 2, [0.08 * m, 0.08 * m, 0, 0]);
  ctx.fillStyle = '#3a2f8a';
  ctx.fill();

  // Ramię od słupa do tablicy
  ctx.fillStyle = '#8d8aa8';
  ctx.fillRect(sx(t.x + t.w), sy(ramieY + 0.05), (slupX - t.x - t.w) * m, 0.1 * m);
  ctx.strokeStyle = '#8d8aa8';
  ctx.lineWidth = Math.max(2, 0.06 * m);
  linia(sx(t.x + t.w), sy(kosz.y + 0.1), sx(slupX), sy(ramieY));

  // Tablica (widzimy ją z boku, więc jest cienka)
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(sx(t.x), sy(t.y + t.h), t.w * m, t.h * m);
  ctx.fillStyle = '#ff6b1a';
  ctx.fillRect(sx(t.x), sy(kosz.y + 0.45), Math.max(2, t.w * m * 0.35), 0.45 * m);

  // Uchwyt obręczy
  ctx.fillStyle = '#c4501a';
  ctx.fillRect(sx(kosz.x + s), sy(kosz.y) - 0.03 * m, ODSTEP_TABLICY * m, 0.06 * m);

  // Tylna połówka obręczy
  ctx.strokeStyle = '#c4501a';
  ctx.lineWidth = Math.max(2, GRUBOSC_OBRECZY * 2 * m);
  ctx.beginPath();
  ctx.ellipse(sx(kosz.x), sy(kosz.y), s * m, s * m * 0.22, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
}

// Przód kosza: siatka i przednia połówka obręczy (są PRZED piłką)
function rysujKoszPrzod() {
  const m = L.metr;
  const s = USTAWIENIA.szerokoscKosza / 2;

  // Siatka – po trafieniu wydłuża się i buja
  const n = 6;
  const poziomy = 4;
  const dlug = DLUGOSC_SIATKI * (1 + 0.35 * kosz.siatka);
  const bujanie = Math.sin(czas * 22) * kosz.siatka * 0.06;
  const punkt = (i, k) => {
    const f = k / poziomy;
    const xg = kosz.x - s + (i / (n - 1)) * 2 * s;
    const xd = kosz.x + (xg - kosz.x) * 0.55 + bujanie;
    return [sx(xg + (xd - xg) * f), sy(kosz.y - dlug * f)];
  };
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, 0.025 * m);
  ctx.lineCap = 'round';
  for (let k = 0; k < poziomy; k++) {
    for (let i = 0; i < n - 1; i++) {
      linia(...punkt(i, k), ...punkt(i + 1, k + 1));
      linia(...punkt(i + 1, k), ...punkt(i, k + 1));
    }
    linia(...punkt(0, k), ...punkt(0, k + 1));
    linia(...punkt(n - 1, k), ...punkt(n - 1, k + 1));
  }

  // Przednia połówka obręczy
  ctx.strokeStyle = '#ff6b1a';
  ctx.lineWidth = Math.max(2, GRUBOSC_OBRECZY * 2 * m);
  ctx.beginPath();
  ctx.ellipse(sx(kosz.x), sy(kosz.y), s * m, s * m * 0.22, 0, 0, Math.PI);
  ctx.stroke();
}

// Piłka do koszykówki: pomarańczowa z czarnymi liniami
function rysujPilke(x, y, r, kat, ogien) {
  if (ogien) {
    const blask = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2);
    blask.addColorStop(0, 'rgba(255,160,40,0.55)');
    blask.addColorStop(1, 'rgba(255,80,20,0)');
    kolo(x, y, r * 2.2, blask);
  }
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, ogien ? '#ffd27a' : '#ffa458');
  g.addColorStop(0.65, ogien ? '#ff8a1c' : '#ec7424');
  g.addColorStop(1, ogien ? '#d63a12' : '#b8501a');
  kolo(x, y, r, g);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(kat);
  ctx.strokeStyle = 'rgba(40, 18, 8, 0.85)';
  ctx.lineWidth = Math.max(1, r * 0.09);
  linia(-r, 0, r, 0);
  linia(0, -r, 0, r);
  ctx.beginPath();
  ctx.arc(-r * 1.25, 0, r * 0.9, -1.2, 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.25, 0, r * 0.9, Math.PI - 1.2, Math.PI + 1.2);
  ctx.stroke();
  ctx.restore();
}

function rysujPilki() {
  for (const p of pilki) {
    ctx.globalAlpha = p.alfa;
    rysujPilke(sx(p.x), sy(p.y), PROMIEN_PILKI * L.metr, p.kat, p.ogien && !p.rozstrzygnieta);
  }
  ctx.globalAlpha = 1;
}

// Zawodnik, który rzuca – patrzy w prawo, na kosz
function rysujZawodnika() {
  const m = L.metr;
  const skora = '#f2c79b';
  const trzyma = pilkaWRekach();

  // Nogi i buty
  ctx.fillStyle = skora;
  sciezkaZaokraglona(sx(-0.16), sy(0.85), 0.12 * m, 0.8 * m, 0.05 * m);
  ctx.fill();
  sciezkaZaokraglona(sx(0.04), sy(0.85), 0.12 * m, 0.8 * m, 0.05 * m);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  sciezkaZaokraglona(sx(-0.19), sy(0.11), 0.22 * m, 0.11 * m, [0.04 * m, 0.06 * m, 0.02 * m, 0.02 * m]);
  ctx.fill();
  sciezkaZaokraglona(sx(0.02), sy(0.11), 0.25 * m, 0.11 * m, [0.04 * m, 0.06 * m, 0.02 * m, 0.02 * m]);
  ctx.fill();

  // Spodenki i koszulka z numerem
  ctx.fillStyle = '#1d2b4a';
  sciezkaZaokraglona(sx(-0.22), sy(1.0), 0.44 * m, 0.3 * m, 0.06 * m);
  ctx.fill();
  ctx.fillStyle = USTAWIENIA.kolorKoszulki;
  sciezkaZaokraglona(sx(-0.24), sy(1.55), 0.48 * m, 0.62 * m, [0.12 * m, 0.12 * m, 0.04 * m, 0.04 * m]);
  ctx.fill();
  ctx.font = czcionka(0.3 * m, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#16143a';
  ctx.fillText(String(USTAWIENIA.numerNaKoszulce), sx(0), sy(1.24));

  // Głowa, włosy i oko
  kolo(sx(0), sy(1.72), 0.16 * m, skora);
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.arc(sx(-0.01), sy(1.74), 0.165 * m, Math.PI * 1.02, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  kolo(sx(0.08), sy(1.73), Math.max(1, 0.025 * m), '#1b1a24');

  // Ręce: trzymają piłkę nad głową albo są wyciągnięte po rzucie
  const b = MIEJSCE_RZUTU;
  const dlonie = trzyma
    ? [{ x: b.x - 0.2, y: b.y - 0.12 }, { x: b.x + 0.1, y: b.y - 0.19 }]
    : [{ x: 0.42, y: 2.3 }, { x: 0.5, y: 2.18 }];
  ctx.strokeStyle = skora;
  ctx.lineWidth = Math.max(2, 0.1 * m);
  ctx.lineCap = 'round';
  linia(sx(-0.17), sy(1.45), sx(dlonie[0].x), sy(dlonie[0].y));
  linia(sx(0.17), sy(1.45), sx(dlonie[1].x), sy(dlonie[1].y));

  // Piłka w rękach (wyskakuje, gdy dostajesz nową)
  if (trzyma) {
    const skala = Math.min(1, 0.5 + wReku * 4);
    const ogien = seria >= USTAWIENIA.seriaDoOgnia;
    rysujPilke(sx(b.x), sy(b.y), PROMIEN_PILKI * m * skala, 0.3, ogien);
    if (ogien && stan === 'gra' && Math.random() < 0.5) plomyk(sx(b.x), sy(b.y));
    for (const d of dlonie) kolo(sx(d.x), sy(d.y), 0.06 * m, skora);
  }
}

// Płomienie rysujemy ZA piłkami
function rysujPlomienie() {
  ctx.globalCompositeOperation = 'lighter';   // kolory się sumują – płomienie świecą
  for (const e of efekty) {
    if (e.typ !== 'plomien') continue;
    const f = e.t / e.dlugosc;
    ctx.globalAlpha = Math.max(0, 1 - f) * 0.9;
    kolo(e.x, e.y, e.r * (1 - f * 0.6), `hsl(${50 - 45 * f}, 100%, ${65 - 15 * f}%)`);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function rysujEfekty() {
  for (const e of efekty) {
    if (e.typ === 'plomien') continue;
    const f = e.t / e.dlugosc; // od 0 do 1
    ctx.globalAlpha = Math.max(0, 1 - f);
    if (e.typ === 'konfetti') {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.kat);
      ctx.fillStyle = e.kolor;
      ctx.fillRect(-e.roz, -e.roz * 0.5, e.roz * 2, e.roz);
      ctx.restore();
    } else if (e.typ === 'napis') {
      ctx.font = czcionka(L.fs * (e.duzy ? 2 : 1.3), true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tekstZObwodka(e.tekst, e.x, e.y - f * 40, e.kolor);
    } else if (e.typ === 'start') {
      ctx.save();
      ctx.translate(L.W / 2, srodekSceny());
      ctx.scale(1 + f * 0.6, 1 + f * 0.6);
      ctx.font = czcionka(L.fs * 4, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tekstZObwodka('START!', 0, 0, '#3ddc97', 8);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

// Kropki pokazujące, jak poleci piłka, i pasek siły
function rysujCelowanie() {
  if ((stan !== 'gra' && stan !== 'odliczanie') || koniecRzutow) return;
  const m = L.metr;

  // „Gumka procy” – od miejsca, gdzie wcisnąłeś, do palca
  if (celowanie) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    linia(celowanie.startX, celowanie.startY, celowanie.x, celowanie.y);
    ctx.setLineDash([]);
    kolo(celowanie.startX, celowanie.startY, 6, 'rgba(255,255,255,0.5)');
  }

  // Kosz zmienia miejsce – kropki pokażą się, gdy dojedzie
  if (kosz.przeprowadzka !== 'nie') return;

  const cel = obecnyCel();
  if (!cel) {
    // Klawiatura: strzałka pokazuje kąt
    if (ostatnioKlawiatura && pilkaWRekach()) {
      const x1 = sx(MIEJSCE_RZUTU.x);
      const y1 = sy(MIEJSCE_RZUTU.y);
      const x2 = x1 + Math.cos(katKlawiatury) * m;
      const y2 = y1 - Math.sin(katKlawiatury) * m;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      linia(x1, y1, x2, y2);
      ctx.setLineDash([]);
      kolo(x2, y2, 4, 'rgba(255,255,255,0.8)');
    }
    return;
  }

  // Kropki toru lotu
  const v = NAJWIEKSZA_PREDKOSC * cel.sila;
  const vx = Math.cos(cel.kat) * v;
  const vy = Math.sin(cel.kat) * v;
  const n = USTAWIENIA.kropkiPomocy;
  for (let i = 1; i <= n; i++) {
    const t = i * 0.07;
    const px = MIEJSCE_RZUTU.x + vx * t;
    const py = MIEJSCE_RZUTU.y + vy * t - 0.5 * USTAWIENIA.grawitacja * t * t;
    const alfa = 0.9 * (1 - i / (n + 1));
    kolo(sx(px), sy(py), Math.max(2, 0.07 * m * (1 - i / (n * 1.6))), `rgba(255,255,255,${alfa})`);
  }

  // Pasek siły obok zawodnika: zielony = słabo, czerwony = mocno
  const x = sx(-0.62);
  const gora = sy(2.1);
  const wys = 1.4 * m;
  const szer = Math.max(8, 0.14 * m);
  sciezkaZaokraglona(x - szer / 2, gora, szer, wys, szer / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  const h = wys * cel.sila;
  sciezkaZaokraglona(x - szer / 2, gora + wys - h, szer, h, szer / 2);
  ctx.fillStyle = `hsl(${120 - 120 * cel.sila}, 85%, 55%)`;
  ctx.fill();
}

// Podpowiedź przed pierwszym rzutem: „duch” palca pokazuje, jak ciągnąć
function rysujPodpowiedz() {
  if (!bezRzutu || stan !== 'gra' || celowanie || ladowanie || !pilkaWRekach()) return;
  const m = L.metr;
  const f = (czas % 1.6) / 1.6;
  const ruch = Math.min(1, f / 0.7);
  const x0 = sx(MIEJSCE_RZUTU.x + 0.6);
  const y0 = sy(MIEJSCE_RZUTU.y - 0.2);
  const x = x0 - ruch * 1.0 * m;
  const y = y0 + ruch * 0.7 * m;
  ctx.globalAlpha = f < 0.7 ? 0.8 : Math.max(0, 0.8 - (f - 0.7) * 4);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  linia(x0, y0, x, y);
  ctx.setLineDash([]);
  kolo(x, y, Math.max(8, 0.13 * m), 'rgba(255,255,255,0.75)');
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(L.fs * 1.2, true);
  tekstZObwodka('Pociągnij do tyłu i puść!', sx(1.5), sy(4.0), '#ffffff');
  ctx.font = czcionka(L.fs * 0.85, false);
  tekstZObwodka('klawiatura: ↑ ↓ kąt, trzymaj SPACJĘ i puść', sx(1.5), sy(4.0) + L.fs * 1.5, '#cfc8ff', 3);
}

// Piłka poleciała ponad ekran – pokazujemy strzałkę, gdzie jest
function rysujZnaczniki() {
  for (const p of pilki) {
    if (sy(p.y) + PROMIEN_PILKI * L.metr >= L.hudH) continue;
    const x = sx(p.x);
    const y = L.hudH + 6;
    ctx.globalAlpha = p.alfa;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 10);
    ctx.lineTo(x + 7, y + 10);
    ctx.closePath();
    ctx.fillStyle = '#ff8a2b';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function rysujOdliczanie() {
  if (stan !== 'odliczanie') return;
  const cyfra = Math.max(1, Math.ceil(odliczanie));
  const czesc = odliczanie - Math.floor(odliczanie);   // od 1 do 0 w każdej sekundzie
  const y = srodekSceny();
  ctx.save();
  ctx.translate(L.W / 2, y);
  ctx.scale(1 + czesc * 0.6, 1 + czesc * 0.6);
  ctx.font = czcionka(L.fs * 5, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  tekstZObwodka(String(cyfra), 0, 0, '#ffd23f', 8);
  ctx.restore();

  ctx.font = czcionka(L.fs * 1.1, true);
  ctx.textAlign = 'center';
  tekstZObwodka('Pociągnij do tyłu i puść – jak z procy!', L.W / 2, y + L.fs * 4.5, '#ffffff');
}

function rysujNapisPoziomu() {
  if (napisPoziomu <= 0) return;
  const y = srodekSceny() - L.fs * 1.5;
  ctx.globalAlpha = Math.min(1, napisPoziomu / 0.4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(L.fs * 2.2, true);
  tekstZObwodka(`Poziom ${poziom}!`, L.W / 2, y, '#ffd23f', 5);
  ctx.font = czcionka(L.fs * 1.2, true);
  // W trybie na czas nowy poziom daje dodatkowe sekundy
  const bonus = trybGry === 'naCzas'
    ? `+${USTAWIENIA.dodatkowyCzasNaPoziom} ${slowoSekund(USTAWIENIA.dodatkowyCzasNaPoziom)}! `
    : '';
  const podpis = `${bonus || 'Brawo! '}Teraz trudniej!`;
  tekstZObwodka(podpis, L.W / 2, y + L.fs * 2.2, '#ffffff', 5);
  ctx.globalAlpha = 1;
}

function rysujPasek() {
  const { W, hudH, hudX, hudW, fs } = L;
  const g = ctx.createLinearGradient(0, 0, 0, hudH);
  g.addColorStop(0, '#16143a');
  g.addColorStop(1, '#0e0d28');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, hudH);
  ctx.fillStyle = 'rgba(180,160,255,0.25)';
  ctx.fillRect(0, hudH - 1, W, 1);

  // Po lewej: zegar (tryb na czas) albo serca (tryb bez czasu)
  const jakiTryb = stan === 'start' ? tryb : trybGry;
  let lewaSzer;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (jakiTryb === 'naCzas') {
    // W ostatnich 10 sekundach zegar robi się czerwony
    const sek = Math.ceil(pozostalyCzas);
    const malo = stan !== 'start' && sek <= 10;
    const kolorZegara = malo ? '#ff4d6d' : '#e4ddff';
    const zx = hudX + 16 + 11;
    const zy = hudH / 2;
    zegarek(zx, zy, 10, kolorZegara, -Math.PI / 2 + (1 - (pozostalyCzas % 60) / 60) * Math.PI * 2);
    ctx.font = czcionka(fs * 1.25 * (malo ? 1 + 0.12 * Math.abs(Math.sin(czas * 6)) : 1), true);
    ctx.fillStyle = kolorZegara;
    ctx.fillText(`${sek} s`, zx + 18, zy);
    ctx.font = czcionka(fs * 1.25, true);
    lewaSzer = 16 + 22 + 8 + ctx.measureText('60 s').width;
  } else {
    const s = 24;
    const ile = USTAWIENIA.zyciaBezCzasu;
    const pelne = stan === 'start' ? ile : zycia;
    for (let i = 0; i < ile; i++) {
      const cx = hudX + 16 + s / 2 + i * (s + 8);
      serce(cx, hudH / 2 - s / 2 + 1, s, s, i < pelne ? '#ff4d6d' : 'rgba(255,255,255,0.15)');
    }
    lewaSzer = 16 + ile * (s + 8);
    ctx.font = czcionka(fs * 1.25, true);
  }

  // Punkty i ikona pauzy po prawej
  const prawy = hudX + hudW - 16;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(prawy - 12, hudH / 2 - 8, 4, 16);
  ctx.fillRect(prawy - 4, hudH / 2 - 8, 4, 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd23f';
  const tekstPunktow = `${punkty} pkt`;
  ctx.fillText(tekstPunktow, prawy - 24, hudH / 2);
  const prawaSzer = 24 + 16 + ctx.measureText(tekstPunktow).width;

  // Na środku: poziom i seria trafień
  const miejsce = hudW - 2 * Math.max(lewaSzer, prawaSzer) - 12;
  if (miejsce > 40) {
    ctx.textAlign = 'center';
    ctx.font = czcionka(fs * 1.05, true);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(stan === 'start' ? 'Koszykówka' : `Poziom ${poziom}`, W / 2, hudH * 0.36);

    let drugi = 'Trafiaj do kosza!';
    let kolor = '#9b93cf';
    if (seria >= USTAWIENIA.seriaDoOgnia) {
      drugi = `W ogniu! Punkty ×${USTAWIENIA.mnoznikOgnia}`;
      kolor = '#ff9f1c';
    } else if (seria > 0) {
      drugi = `Seria: ${seria}`;
      kolor = '#3ddc97';
    }
    if (wyciszone) drugi += ' · dźwięk wył. (M)';
    const rozmiar2 = fs * 0.75;
    ctx.font = czcionka(rozmiar2, seria > 0);
    const szer2 = ctx.measureText(drugi).width;
    if (szer2 > miejsce) ctx.font = czcionka(Math.max(8, (rozmiar2 * miejsce) / szer2), seria > 0);
    ctx.fillStyle = kolor;
    ctx.fillText(drugi, W / 2, hudH * 0.7);
  }
}

// Dwa przyciski obok siebie: „Na czas” i „Bez czasu”. Wybrany tryb jest pomarańczowy.
function rysujWyborTrybu(yy, h, r) {
  const opcje = [
    { akcja: 'naCzas', tekst: 'Na czas' },
    { akcja: 'bezCzasu', tekst: 'Bez czasu' },
  ];
  const ikona = r * 0.95;
  const bw = Math.max(...opcje.map((o) => ctx.measureText(o.tekst).width)) + ikona + r * 2.4;
  const bh = r * 2.2;
  const odstepX = r * 0.8;
  const by = yy + (h - bh) / 2;
  let bx = L.W / 2 - bw - odstepX / 2;
  for (const o of opcje) {
    const wybrany = tryb === o.akcja;
    sciezkaZaokraglona(bx, by, bw, bh, bh / 2);
    ctx.fillStyle = wybrany ? '#ff9f1c' : 'rgba(180,160,255,0.12)';
    ctx.fill();
    ctx.lineWidth = wybrany ? 2.5 : 1.5;
    ctx.strokeStyle = wybrany ? '#ffd9a0' : 'rgba(180,160,255,0.5)';
    ctx.stroke();

    // ikonka (zegarek albo serce) i napis
    const kolor = wybrany ? '#16143a' : '#e4ddff';
    const tw = ctx.measureText(o.tekst).width;
    const start = bx + (bw - (ikona + r * 0.45 + tw)) / 2;
    const iy = by + bh / 2;
    if (o.akcja === 'naCzas') zegarek(start + ikona / 2, iy, ikona / 2 - 1, kolor, -Math.PI / 3);
    else serce(start + ikona / 2, iy - ikona / 2, ikona, ikona, wybrany ? '#c9184a' : '#ff4d6d');
    ctx.textAlign = 'left';
    ctx.fillStyle = kolor;
    ctx.fillText(o.tekst, start + ikona + r * 0.45, iy);
    ctx.textAlign = 'center';

    przyciski.push({ x: bx, y: by, w: bw, h: bh, akcja: o.akcja });
    bx += bw + odstepX;
  }
}

// Przyciski trybów z opisem i rekordem wybranego trybu
function elementyTrybu(fs) {
  const n = USTAWIENIA.czasGry;
  const z = USTAWIENIA.zyciaBezCzasu;
  const opis = tryb === 'naCzas'
    ? `Masz ${n} ${slowoSekund(n)}. Nowy poziom = +${USTAWIENIA.dodatkowyCzasNaPoziom} s!`
    : `Masz ${z} ${slowoSerc(z)}. Każde pudło zabiera jedno.`;
  const r = rekordy[tryb];
  return [
    { wyborTrybu: true, rozmiar: fs * 1.1, gruba: true },
    { tekst: opis, rozmiar: fs * 0.9, kolor: '#cfc8ff' },
    r > 0
      ? { tekst: `Rekord w tym trybie: ${r} pkt`, rozmiar: fs * 0.9, gruba: true, kolor: '#3ddc97' }
      : { tekst: 'W tym trybie nie masz jeszcze rekordu', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { tekst: '← → zmienia tryb', rozmiar: fs * 0.75, kolor: '#8a83c2' },
  ];
}

// Okienko na środku (start, pauza, koniec gry)
function rysujOkienko(elementy, zmniejszone = false) {
  const szer = Math.min(L.hudW - 32, 520);
  const wewn = szer - 48;
  const wiersze = [];
  let wys = 0;
  for (const el of elementy) {
    if (el.odstep) {
      wiersze.push(el);
      wys += el.odstep;
      continue;
    }
    if (el.wyborTrybu) {
      const h = el.rozmiar * 2.8;
      wiersze.push({ ...el, h });
      wys += h;
      continue;
    }
    ctx.font = czcionka(el.rozmiar, el.gruba);
    for (const linia of zawijajTekst(el.tekst, wewn)) {
      const h = el.przycisk ? el.rozmiar * 2.6 : el.rozmiar * 1.35;
      wiersze.push({ ...el, tekst: linia, h });
      wys += h;
    }
  }

  // Okienko nie mieści się na ekranie? Zmniejszamy wszystkie napisy.
  const dostepne = L.H - L.hudH - 16;
  if (wys + 48 > dostepne && !zmniejszone) {
    const k = Math.max(0.5, (dostepne - 48) / wys);
    const mniejsze = elementy.map((el) => ({
      ...el,
      rozmiar: el.rozmiar && el.rozmiar * k,
      odstep: el.odstep && el.odstep * k,
    }));
    rysujOkienko(mniejsze, true);
    return;
  }

  ctx.fillStyle = 'rgba(5, 6, 18, 0.62)';
  ctx.fillRect(0, L.hudH, L.W, L.H - L.hudH);

  const panelH = wys + 48;
  const x = (L.W - szer) / 2;
  const y = Math.max(L.hudH + 8, L.hudH + (L.H - L.hudH - panelH) / 2);

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
    if (w.wyborTrybu) {
      rysujWyborTrybu(yy, w.h, w.rozmiar);
      yy += w.h;
      continue;
    }
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
      przyciski.push({ x: bx, y: by, w: bw, h: bh, akcja: w.przycisk });
    }
    ctx.fillStyle = w.kolor || '#e8e6ff';
    ctx.fillText(w.tekst, L.W / 2, yy + w.h / 2);
    yy += w.h;
  }
  ctx.globalAlpha = 1;
}

function rysujEkranStartowy() {
  const fs = L.fs;
  rysujOkienko([
    { tekst: 'Koszykówka', rozmiar: fs * 2.1, gruba: true, kolor: '#ff9f1c' },
    { odstep: fs * 0.5 },
    ...(USTAWIENIA.koszCiagleJezdzi
      ? [{ tekst: 'Uwaga: kosz cały czas jeździ w górę i w dół!', rozmiar: fs, gruba: true, kolor: '#ffd23f' }]
      : USTAWIENIA.koszZmieniaMiejsce
        ? [{ tekst: 'Po każdym trafieniu kosz zmienia miejsce!', rozmiar: fs, gruba: true, kolor: '#ffd23f' }]
        : []),
    { tekst: `Kosz = ${USTAWIENIA.punktyZaKosz} pkt. Czysty rzut = ${USTAWIENIA.punktyZaCzysty} pkt!`, rozmiar: fs },
    { tekst: '(czysty = piłka nie dotknie obręczy ani tablicy)', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.5 },
    { tekst: 'Myszka albo palec: pociągnij do tyłu i puść', rozmiar: fs * 1.05, gruba: true, kolor: '#4cc9f0' },
    { tekst: 'Klawiatura: ↑ ↓ kąt, trzymaj SPACJĘ i puść', rozmiar: fs * 0.9, kolor: '#a9a3d9' },
    { tekst: `${USTAWIENIA.seriaDoOgnia} trafienia z rzędu = piłka w ogniu, punkty ×${USTAWIENIA.mnoznikOgnia}!`, rozmiar: fs, kolor: '#ff9f1c' },
    { odstep: fs * 0.8 },
    ...elementyTrybu(fs),
    { odstep: fs * 0.6 },
    { tekst: 'Kliknij tryb albo naciśnij SPACJĘ, żeby zacząć', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() },
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
  const celnosc = rzuty > 0 ? ` (${Math.round((100 * trafienia) / rzuty)}%)` : '';
  const naCzas = trybGry === 'naCzas';
  rysujOkienko([
    { tekst: naCzas ? 'Koniec czasu!' : 'Koniec serc!', rozmiar: fs * 2.1, gruba: true, kolor: '#ff9f1c' },
    { tekst: naCzas ? 'Tryb: na czas' : 'Tryb: bez czasu', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.4 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.7, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.2, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekordy[trybGry]} pkt`, rozmiar: fs, kolor: '#a9a3d9' },
    { tekst: `Trafione: ${trafienia} z ${rzuty} ${rzuty === 1 ? 'rzutu' : 'rzutów'}${celnosc}`, rozmiar: fs, kolor: '#e8e6ff' },
    { tekst: `Najdłuższa seria: ${najdluzszaSeria} · Poziom: ${poziom}`, rozmiar: fs, kolor: '#a9a3d9' },
    { odstep: fs * 0.8 },
    { wyborTrybu: true, rozmiar: fs, gruba: true },
    { tekst: '← → zmienia tryb', rozmiar: fs * 0.75, kolor: '#8a83c2' },
    { odstep: fs * 0.4 },
    mozna
      ? { tekst: 'Zagraj znowu: kliknij tryb albo SPACJĘ', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() }
      : { odstep: fs * 1.4 },
    { odstep: fs * 0.4 },
    elementMenu(fs),
  ]);
}

function rysuj() {
  przyciski = [];   // przyciski istnieją tylko wtedy, gdy narysuje je okienko
  rysujHale();
  rysujCienie();
  rysujKoszTyl();
  rysujPlomienie();
  rysujZawodnika();
  rysujPilki();
  rysujKoszPrzod();
  rysujEfekty();
  rysujCelowanie();
  rysujPodpowiedz();
  rysujZnaczniki();
  rysujOdliczanie();
  rysujNapisPoziomu();

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

  if (stan === 'gra') {
    aktualizujGre(dt);
  } else if (stan === 'start') {
    aktualizujKosz(dt);          // (ważne tylko, gdy koszCiagleJezdzi = true)
  } else if (stan === 'odliczanie') {
    aktualizujOdliczanie(dt);
    aktualizujSterowanie(dt);
    aktualizujKosz(dt);
  } else if (stan === 'koniec') {
    aktualizujKosz(dt);
    aktualizujPilki(dt);
  }
  if (stan !== 'pauza') aktualizujEfekty(dt);
  rysuj();

  requestAnimationFrame(petla);
}

dopasujRozmiar();
requestAnimationFrame(petla);
