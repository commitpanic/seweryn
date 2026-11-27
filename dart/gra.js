'use strict';

// =====================================================
//   DART – rzucanie lotkami do tarczy
//   Pomysł: Seweryn
// =====================================================
//
//  Jak rzucać:
//   - Myszka albo palec: złap lotkę i pociągnij w górę. Na tarczy pojawi się celownik.
//     Im wyżej pociągniesz, tym wyżej jest celownik. W bok – ruszasz palcem w bok.
//   - Wokół celownika jest KÓŁKO. Lotka wpadnie gdzieś w to kółko.
//     Trzymaj palec spokojnie, a kółko się zmniejszy (skupiasz się!).
//     Ruszasz palcem – kółko rośnie. Trzymasz za długo – ręka się męczy i kółko też rośnie.
//     Puść, kiedy kółko jest małe i zielone!
//     (W USTAWIENIACH możesz wrócić do starego sposobu: sposobCelowania: 'celownik'.)
//   - Klawiatura: ← → przesuwa rękę, trzymaj SPACJĘ i puść.
//     Żółte kółko jeździ po tarczy w górę i w dół – puść, kiedy jest tam, gdzie chcesz.
//
//  Tarcza:
//   - Każde pole ma swoją liczbę od 1 do 20 – tyle dostajesz punktów.
//   - Wąski pierścień na brzegu tarczy = punkty ×2 (podwójne).
//   - Wąski pierścień w środku tarczy = punkty ×3 (potrójne).
//   - Zielone kółko w środku = 25 pkt, czerwona kropka w samym środku = 50 pkt!
//
//  Zasady (jak w prawdziwym darcie – gra 501 albo 301):
//   - Zaczynasz od 501 (albo 301) i odejmujesz wszystko, co trafisz.
//   - Każdy gracz rzuca w swojej kolejce 3 lotki.
//   - Trzeba zejść dokładnie do zera, a ostatnia lotka musi trafić
//     w pole podwójne (wąski pierścień na brzegu) albo w sam środek (50).
//   - ZA DUŻO! Jeśli zejdziesz poniżej zera, zostanie ci 1 albo dojdziesz do zera
//     nie na podwójnym – cała kolejka się nie liczy i wracasz do tego, co było.
//   - Kto pierwszy zejdzie do zera, wygrywa.
//   - Kiedy zostanie mało, gra podpowiada, jak skończyć (np. 3×20, 3×20, środek).
//
//  DOOKOŁA TARCZY: traf po kolei w 1, 2, 3... aż do 20, a na koniec w środek.
//   Podwójne przeskakuje o 2 liczby, a potrójne o 3! Kto pierwszy obejdzie tarczę, wygrywa.
//
//  Można grać samemu albo we dwóch na zmianę.


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  gry: [501, 301],              // od ilu punktów można zacząć (możesz dopisać np. 101 albo 701)
  dookolaTarczy: true,          // czy na starcie jest też gra DOOKOŁA TARCZY
  koncowkaNaPodwojnym: true,    // true = trzeba skończyć na podwójnym (prawdziwe zasady), false = wystarczy zero
  podwojneSkacza: true,         // DOOKOŁA TARCZY: podwójne przeskakuje o 2 liczby, potrójne o 3
  lotekWKolejce: 3,             // ile lotek rzuca gracz, zanim przyjdzie kolej na następnego
  grubePierscienie: 1.3,        // jak grube są pola podwójne i potrójne (1 = jak na prawdziwej tarczy, więcej = łatwiej)
  duzySrodek: 1.2,              // jak duży jest środek tarczy (1 = jak na prawdziwej tarczy, więcej = łatwiej)
  sposobCelowania: 'kolko',     // 'kolko' = lotka wpada gdzieś w kółko, które maleje, gdy trzymasz spokojnie (trudniej)
                                // 'celownik' = lotka leci dokładnie w celownik (łatwiej, tak było na początku)
  kolkoNaPoczatku: 0.35,        // jak duże jest kółko, kiedy złapiesz lotkę (1 = cała tarcza)
  kolkoNajmniejsze: 0.05,       // jak małe może się zrobić kółko, kiedy trzymasz spokojnie
  czasSkupienia: 1.2,           // ile sekund trzeba trzymać spokojnie, żeby kółko było najmniejsze
  zmeczenieReki: 3,             // po ilu sekundach trzymania ręka się męczy i kółko znowu rośnie
  bujanieCelownika: 0.05,       // jak bardzo celownik się buja, jak trzęsąca się ręka (0 = stoi w miejscu, łatwo!)
  czuloscCelownika: 2,          // o ile pikseli celownik idzie w górę, gdy pociągniesz palcem o 1 piksel
  linkaCelowania: true,         // kreska pokazuje, nad którym miejscem tarczy jest twoja ręka
  podpowiedzi: true,            // pod koniec gry świeci pole, w które warto celować, żeby skończyć
  mowa: true,                   // sędzia mówi, ile punktów rzuciłeś (potrzebny polski głos w komputerze albo telefonie)
  gracze: [                     // imiona i kolory lotek (kolor zapisany jak '#ff5a5f')
    { imie: 'Gracz 1', kolor: '#ff5a5f' },
    { imie: 'Gracz 2', kolor: '#4cc9f0' },
  ],
};

// ---------- Tarcza (wymiary w milimetrach – jak na prawdziwej tarczy) ----------
const NUMERY = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];   // od góry, zgodnie z zegarem
const PROMIEN_TARCZY = 170;      // zewnętrzny brzeg pól podwójnych
const PROMIEN_OBUDOWY = 226;     // czarny pierścień z numerami
const PROMIEN_NUMEROW = 198;     // tu stoją numery
const P = {                      // pierścienie tarczy
  srodek: 6.35 * USTAWIENIA.duzySrodek,          // czerwona kropka: 50 pkt
  zielonyKrag: 15.9 * USTAWIENIA.duzySrodek,     // zielone kółko: 25 pkt
  potrojneOd: 103 - 4 * USTAWIENIA.grubePierscienie,
  potrojneDo: 103 + 4 * USTAWIENIA.grubePierscienie,
  podwojneOd: PROMIEN_TARCZY - 8 * USTAWIENIA.grubePierscienie,
  podwojneDo: PROMIEN_TARCZY,
};
const KOLORY_TARCZY = {
  ciemne: '#2b211b',     // ciemne pola
  jasne: '#d9b27c',      // jasne pola – kolor korka
  czerwone: '#c9283a',
  zielone: '#1a8f55',
  drut: '#cfd3dc',
};
const ZIARENKA_KORKA = 0.35;   // ile ziarenek korka jest na tarczy (0 = gładka tarcza)

const KOLOR_GRY = '#a3e635';
const KOLOR_KREDY = 'rgba(242, 240, 228, 0.92)';
const KOLORY_KONFETTI = ['#ffd23f', '#ff5a5f', '#4cc9f0', '#3ddc97', '#c77dff', '#ff9f1c', '#a3e635'];
const TRYBY = [...USTAWIENIA.gry.map(String), ...(USTAWIENIA.dookolaTarczy ? ['dookola'] : [])];   // np. ['501', '301', 'dookola']
const SMUGI = [[0.28, 0.3, 0.22, 0.07], [0.7, 0.55, 0.26, 0.09], [0.45, 0.82, 0.3, 0.06]];   // smugi po kredzie na tablicy


// =====================================================
//   REKORDY I WYBORY (zapamiętywane w przeglądarce)
// =====================================================
// Rekord = najmniej lotek, żeby zejść do zera (osobno w 501 i w 301)
function wczytajRekord(t) {
  try {
    return parseInt(localStorage.getItem('dart-rekord-' + t), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(t, wynik) {
  try {
    localStorage.setItem('dart-rekord-' + t, String(wynik));
  } catch (e) {
    // trudno – rekord po prostu nie zostanie zapamiętany
  }
}

function wczytaj(klucz, domyslnie) {
  try {
    return localStorage.getItem(klucz) || domyslnie;
  } catch (e) {
    return domyslnie;
  }
}

function zapisz(klucz, wartosc) {
  try {
    localStorage.setItem(klucz, String(wartosc));
  } catch (e) {
    // trudno
  }
}


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');
const plotnoTla = document.createElement('canvas');      // drewniana ściana (rysujemy ją raz)
const plotnoTarczy = document.createElement('canvas');   // tarcza (też rysujemy ją raz)

let stan = 'start';            // 'start' | 'gra' | 'pauza' | 'koniec'
let tryb = TRYBY.includes(wczytaj('dart-tryb', '')) ? wczytaj('dart-tryb', '') : TRYBY[0];   // gra wybrana na starcie: '501' albo '301'
let ileGraczy = wczytaj('dart-gracze', '1') === '2' ? 2 : 1;
let trybGry = tryb;            // gra, która właśnie trwa
let gracze = [];
let ktory = 0;                 // kto teraz rzuca
let runda = 1;

// faza kolejki: 'zmiana' (napis „Rzuca...”), 'celuj', 'koniecKolejki' (wynik), 'zbieranie' (wyciągamy lotki z tarczy)
let faza = 'celuj';
let fazaCzas = 0;
let fazaOd = 0;
let tura = [];                 // lotki rzucone w tej kolejce
let spalona = false;           // trafiłeś za dużo – kolejka się nie liczy
let powodSpalenia = '';
let wygral = -1;               // kto zszedł do zera
let koniecPoKolejce = false;

let lotkiNaTarczy = [];        // lotki wbite w tarczę: { mx, my, kat, kolor, t }
let lot = null;                // lotka, która właśnie leci
let spadajace = [];            // lotki, które nie trafiły i spadają na podłogę
let przeladowanie = 0;         // chwila, zanim w ręce pojawi się nowa lotka
let wReku = 1;                 // jak długo nowa lotka jest już w ręce (do animacji)
let trzymanie = null;          // palec albo myszka trzyma lotkę
let ladowanie = null;          // trzymasz spację
const reka = { dx: 0 };        // gdzie jest ręka (klawiatura): 0 = pod środkiem tarczy
const klawisze = { lewo: false, prawo: false };
let ostatnioKlawiatura = false;
let bezRzutu = true;           // jeszcze nie było rzutu – pokazujemy podpowiedź

let efekty = [];               // napisy, konfetti, pyłek
let baner = null;              // duży napis na środku
let drzenieTarczy = 0;
let zwyciezca = null;
let nowyRekord = null;
const rekordy = {};
for (const t of TRYBY) rekordy[t] = wczytajRekord(t);

let czas = 0;
let koniecOd = 0;
let wyciszone = false;
let przyciski = [];            // przyciski w okienkach: { x, y, w, h, akcja }
let okienko = null;            // gdzie jest okienko na środku: { x, y, w, h }
const dotyk = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const L = {};                  // rozmiary ekranu


// =====================================================
//   POMOCNICY
// =====================================================
function ogranicz(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function roznicaKatow(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

// Losowanie, które za każdym razem daje te same liczby (żeby deski na ścianie nie migały)
function losowanie(ziarno) {
  let s = ziarno;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 1 lotka, 2 lotki, 5 lotek
function odmiana(n, jeden, kilka, wiele) {
  if (n === 1) return jeden;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return kilka;
  return wiele;
}

function slowoLotek(n) {
  return odmiana(n, 'lotka', 'lotki', 'lotek');
}

function hexAlfa(hex, a) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Czy trwa gra DOOKOŁA TARCZY (a nie 501 albo 301)?
function dookola() {
  return trybGry === 'dookola';
}

function nazwaTrybu(t) {
  return t === 'dookola' ? 'Dookoła tarczy' : t;
}

// Dookoła tarczy: cel 1–20 to liczby, 21 to środek, 22 = cała tarcza obejdzona
function liczbaCelu(cel) {
  return cel <= 20 ? cel : 25;
}

function nazwaCelu(cel) {
  return cel <= 20 ? String(cel) : 'środek';
}



// =====================================================
//   ROZMIARY EKRANU
// =====================================================
function dopasujRozmiar() {
  const dpr = window.devicePixelRatio || 1;
  L.dpr = dpr;
  L.W = window.innerWidth;
  L.H = window.innerHeight;
  plotno.width = Math.round(L.W * dpr);
  plotno.height = Math.round(L.H * dpr);
  plotno.style.width = L.W + 'px';
  plotno.style.height = L.H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  L.hudH = 60;                                   // górny pasek
  L.hudW = Math.min(L.W, 820);
  L.hudX = (L.W - L.hudW) / 2;
  L.fs = ogranicz(Math.min(L.W / 34, L.H / 32), 11, 20);   // wielkość napisów
  L.dolH = ogranicz(L.H * 0.21, 84, 200);        // dół ekranu: ręka z lotką

  const gora = L.hudH + 6;
  const dol = L.H - L.dolH;
  const k = PROMIEN_OBUDOWY / PROMIEN_TARCZY;
  L.R = Math.max(50, Math.min((L.W - 16) / 2, (dol - gora) / 2) / k);   // promień tarczy w pikselach
  L.Rz = L.R * k;                                // promień razem z czarnym pierścieniem
  L.mm = L.R / PROMIEN_TARCZY;                   // ile pikseli ma 1 milimetr tarczy
  L.tx = L.W / 2;                                // środek tarczy
  L.ty = gora + (dol - gora) / 2;
  L.rekaY = L.H - L.dolH * 0.5;                  // tu trzymasz lotkę
  L.dlugoscLotki = ogranicz(L.dolH * 0.78, 60, 150);
  L.lotkaNaTarczy = ogranicz(L.R * 0.32, 28, 90);

  // Tablica z kredą wisi obok tarczy – tylko gdy jest dużo miejsca
  const wolne = L.W - (L.tx + L.Rz) - 16;
  if (wolne >= 190 && dol - gora > 260) {
    const w = Math.min(290, wolne - 30);
    const h = Math.min(dol - gora - 30, w * 1.45);
    L.tablica = { x: L.tx + L.Rz + 16 + (wolne - w) / 2, y: L.ty - h / 2, w, h };
  } else {
    L.tablica = null;
  }

  przygotujTlo();
  przygotujTarcze();
}

function rekaX() {
  return L.tx + reka.dx * L.R;
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

    // Szum – losowe drgania. Z niego robimy świst lotki, stuknięcia i krzyk kibiców.
    buforSzumu = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const dane = buforSzumu.getChannelData(0);
    for (let i = 0; i < dane.length; i++) dane[i] = Math.random() * 2 - 1;
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

// Szum przepuszczony przez filtr: wysoki = świst, niski = stuk
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

function dzwiekMachniecia() {
  szum(0.22, 'bandpass', 1500, 0.1, 0, 0.07);        // fiuuu
}

function dzwiekWbicia() {
  szum(0.07, 'lowpass', 1300, 0.5);                    // tuk!
  pisk(160, 0.1, 'sine', 0.22);
  pisk(95, 0.14, 'sine', 0.16, 0.01);
}

function dzwiekObudowy() {
  szum(0.06, 'lowpass', 700, 0.4);
  pisk(115, 0.12, 'sine', 0.2);
}

function dzwiekSciany() {
  szum(0.09, 'lowpass', 500, 0.45);
  pisk(80, 0.12, 'sine', 0.25);
}

function dzwiekPodlogi(opoznienie = 0) {
  [0, 0.08, 0.14].forEach((o, i) => {
    pisk(1900 - i * 350, 0.05, 'triangle', 0.06, opoznienie + o);
    szum(0.04, 'highpass', 3000, 0.08, opoznienie + o);
  });
}

function dzwiekPodwojnego() {
  [659, 988].forEach((f, i) => pisk(f, 0.12, 'square', 0.06, 0.05 + i * 0.07));
}

function dzwiekPotrojnego() {
  [784, 988, 1319].forEach((f, i) => pisk(f, 0.12, 'square', 0.06, 0.05 + i * 0.07));
}

function dzwiekCelu(skok) {
  pisk(880, 0.1, 'triangle', 0.12);
  pisk(1320, 0.14, 'triangle', 0.1, 0.08);
  if (skok > 1) pisk(1760, 0.16, 'triangle', 0.08, 0.16);
}

function dzwiekSrodka() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => pisk(f, 0.14, 'square', 0.07, 0.05 + i * 0.07));
  szum(0.8, 'bandpass', 1100, 0.06, 0.15, 0.15);
}

function dzwiekDopingu() {
  szum(1.1, 'bandpass', 1100, 0.08, 0.05, 0.15);      // kibice krzyczą „Aaaa!”
}

function dzwiek180() {
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => pisk(f, 0.16, 'square', 0.08, i * 0.11));
  szum(1.8, 'bandpass', 1100, 0.12, 0.1, 0.2);
}

function dzwiekZaDuzo() {
  pisk(330, 0.25, 'sawtooth', 0.08);
  pisk(247, 0.3, 'sawtooth', 0.08, 0.22);
  pisk(196, 0.5, 'sawtooth', 0.08, 0.46);
}

function dzwiekKolejki() {
  pisk(660, 0.08, 'square', 0.05);
  pisk(880, 0.1, 'square', 0.05, 0.09);
}

function dzwiekZbierania() {
  szum(0.15, 'highpass', 1800, 0.05, 0, 0.03);
}

function dzwiekWygranej() {
  [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => pisk(f, 0.18, 'square', 0.07, i * 0.12));
  szum(1.5, 'bandpass', 1100, 0.08, 0.2, 0.2);
}

function dzwiekKlik() {
  pisk(700, 0.05, 'square', 0.05);
}


// =====================================================
//   MOWA – sędzia mówi wynik
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

function powiedz(tekst) {
  if (wyciszone || !USTAWIENIA.mowa || !('speechSynthesis' in window)) return;
  if (!glosPL) znajdzGlos();
  if (!glosPL) return;   // nie ma polskiego głosu – nic nie mówimy (angielski głos czytałby śmiesznie)
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.voice = glosPL;
  u.lang = glosPL.lang;
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

function ucisz() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}


// =====================================================
//   TARCZA – w które pole trafiła lotka?
// =====================================================
// mx, my: gdzie wbiła się lotka (w milimetrach od środka tarczy, my rośnie w dół)
function ocenPole(mx, my) {
  const r = Math.hypot(mx, my);
  if (r <= P.srodek) return { liczba: 25, mnoznik: 2, punkty: 50, krotko: '50' };
  if (r <= P.zielonyKrag) return { liczba: 25, mnoznik: 1, punkty: 25, krotko: '25' };
  if (r > P.podwojneDo) return { liczba: 0, mnoznik: 0, punkty: 0, krotko: 'Obok', obok: true };
  let kat = Math.atan2(mx, -my);              // 0 = prosto w górę, rośnie zgodnie z zegarem
  if (kat < 0) kat += Math.PI * 2;
  const nr = Math.floor((kat + Math.PI / 20) / (Math.PI / 10)) % 20;
  const liczba = NUMERY[nr];
  let mnoznik = 1;
  if (r >= P.podwojneOd) mnoznik = 2;
  else if (r >= P.potrojneOd && r <= P.potrojneDo) mnoznik = 3;
  return {
    liczba,
    mnoznik,
    punkty: liczba * mnoznik,
    krotko: mnoznik === 1 ? String(liczba) : `${mnoznik}×${liczba}`,
  };
}

function sumaKolejki() {
  return tura.reduce((s, w) => s + w.punkty, 0);
}

// ---------- Jak skończyć grę? (podpowiedź jak w telewizji) ----------
function rzut(liczba, mnoznik) {
  return { liczba, mnoznik, punkty: liczba * mnoznik };
}

function nazwaRzutu(w) {
  if (w.liczba === 25) return w.mnoznik === 2 ? 'środek' : '25';
  return w.mnoznik === 1 ? String(w.liczba) : `${w.mnoznik}×${w.liczba}`;
}

// Najłatwiejsza jedna lotka, która daje dokładnie v punktów (albo null)
function jednaLotka(v) {
  if (v < 1) return null;
  if (v <= 20) return rzut(v, 1);
  if (v === 25) return rzut(25, 1);
  if (v === 50) return rzut(25, 2);
  if (v % 3 === 0 && v <= 60) return rzut(v / 3, 3);
  if (v % 2 === 0 && v <= 40) return rzut(v / 2, 2);
  return null;
}

// Czym można skończyć grę – najpierw ulubione podwójne zawodowców
const ULUBIONE_PODWOJNE = [20, 16, 18, 12, 10, 8, 19, 17, 15, 14, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1];
const KONCOWKI = USTAWIENIA.koncowkaNaPodwojnym
  ? [...ULUBIONE_PODWOJNE.map((n) => rzut(n, 2)), rzut(25, 2)]
  : [...ULUBIONE_PODWOJNE.map((n) => rzut(n, 1)), rzut(25, 1), rzut(25, 2),
    ...ULUBIONE_PODWOJNE.map((n) => rzut(n, 2)), ...ULUBIONE_PODWOJNE.map((n) => rzut(n, 3))];
// Pierwsza lotka z trzech: najpierw potrójne 20, 19, 18...
const PIERWSZE = [];
for (let n = 20; n >= 1; n--) PIERWSZE.push(rzut(n, 3));
PIERWSZE.push(rzut(25, 2), rzut(25, 1));
for (let n = 20; n >= 1; n--) PIERWSZE.push(rzut(n, 1));

// Zostało z punktów, masz jeszcze ile lotek. Zwraca listę lotek, którymi da się skończyć (albo null).
function zamkniecie(z, ile) {
  if (z < 1 || ile < 1) return null;
  for (const k of KONCOWKI) if (k.punkty === z) return [k];
  if (ile >= 2) {
    for (const k of KONCOWKI) {
      const a = jednaLotka(z - k.punkty);
      if (a) return [a, k];
    }
  }
  if (ile >= 3) {
    for (const k of KONCOWKI) {
      for (const a of PIERWSZE) {
        const b = jednaLotka(z - k.punkty - a.punkty);
        if (b) return [a, b, k];
      }
    }
  }
  return null;
}

// Podpowiedź dla gracza, który teraz rzuca
function podpowiedzZamkniecia() {
  if (!USTAWIENIA.podpowiedzi || stan !== 'gra' || !gracze.length || dookola()) return null;
  if (faza === 'koniecKolejki' || faza === 'zbieranie') return null;
  return zamkniecie(gracze[ktory].wynik, USTAWIENIA.lotekWKolejce - tura.length);
}

// Które pole świeci na tarczy: pierwsza lotka z podpowiedzi albo (dookoła tarczy) liczba, w którą teraz celujesz
function celPodpowiedzi() {
  if (dookola()) {
    if (!USTAWIENIA.podpowiedzi || stan !== 'gra' || !gracze.length) return null;
    if (faza === 'koniecKolejki' || faza === 'zbieranie') return null;
    const cel = gracze[ktory].cel;
    if (cel > 21) return null;
    return { liczba: liczbaCelu(cel), mnoznik: 0 };   // mnoznik 0 = całe pole się liczy
  }
  const z = podpowiedzZamkniecia();
  return z ? z[0] : null;
}


// =====================================================
//   PRZEBIEG GRY
// =====================================================
function nowyGracz(i) {
  const u = USTAWIENIA.gracze[i] || {};
  const start = dookola() ? 0 : Number(trybGry);
  return {
    imie: u.imie || `Gracz ${i + 1}`,
    kolor: u.kolor || KOLORY_KONFETTI[i % KOLORY_KONFETTI.length],
    wynik: start,                // 501 i 301: ile jeszcze zostało do zera
    wynikPrzedKolejka: start,
    cel: 1,                      // dookoła tarczy: w co teraz celujesz (21 = środek, 22 = koniec)
    lotki: 0,                    // ile lotek już rzucił
    historia: [],                // po każdej kolejce: { suma, po, zaDuzo }
    najlepszaKolejka: 0,
    potrojne: 0,
    srodki: 0,
  };
}

function nowaGra() {
  przygotujDzwiek();
  trybGry = tryb;
  gracze = [];
  for (let i = 0; i < ileGraczy; i++) gracze.push(nowyGracz(i));
  ktory = 0;
  runda = 1;
  tura = [];
  spalona = false;
  powodSpalenia = '';
  wygral = -1;
  koniecPoKolejce = false;
  lotkiNaTarczy = [];
  lot = null;
  spadajace = [];
  efekty = [];
  baner = null;
  przeladowanie = 0;
  wReku = 0;
  trzymanie = null;
  ladowanie = null;
  zwyciezca = null;
  nowyRekord = null;
  stan = 'gra';
  rozpocznijKolejke();
}

function ustawFaze(nowa, ileCzasu) {
  faza = nowa;
  fazaCzas = ileCzasu;
  fazaOd = czas;
}

function rozpocznijKolejke() {
  const g = gracze[ktory];
  g.wynikPrzedKolejka = g.wynik;
  ustawFaze('zmiana', 1.0);
  const pod = dookola() ? `Celuj w ${nazwaCelu(g.cel)}` : `Zostało ${g.wynik}`;
  if (gracze.length > 1) pokazBaner(`Rzuca ${g.imie}`, g.kolor, pod, 1.1);
  else pokazBaner(`Runda ${runda}`, '#ffd23f', pod, 1.0);
  dzwiekKolejki();
}

function lotkaGotowa() {
  return stan === 'gra' && (faza === 'celuj' || faza === 'zmiana') && !lot &&
    przeladowanie <= 0 && tura.length < USTAWIENIA.lotekWKolejce;
}

// Celownik buja się powoli w kółko – jak ręka, która trochę drży
function bujanie() {
  const a = USTAWIENIA.bujanieCelownika * L.R;
  return {
    x: a * (0.7 * Math.sin(czas * 1.9) + 0.3 * Math.sin(czas * 3.1 + 1)),
    y: a * (0.7 * Math.sin(czas * 2.3 + 2) + 0.3 * Math.sin(czas * 3.7)),
  };
}

// Ile pikseli pociągnąłeś lotkę w górę
function pociagniecie() {
  return trzymanie ? Math.max(0, trzymanie.startY - trzymanie.y) : 0;
}

// Gdzie jest celownik, kiedy trzymasz lotkę palcem albo myszką:
// w poziomie nad palcem, a im wyżej pociągniesz, tym wyżej na tarczy
// r to promień kółka: lotka wpadnie gdzieś w to kółko
function celownikPalca() {
  const b = bujanie();
  const y = L.ty + L.Rz + 10 - pociagniecie() * USTAWIENIA.czuloscCelownika;
  return { x: trzymanie.x + b.x, y: Math.max(L.hudH + 6, y) + b.y, r: promienKolka() };
}

// Sposób „kółko”: im bardziej skupiony, tym mniejsze kółko. Zmęczona ręka – kółko rośnie.
function promienKolka() {
  if (USTAWIENIA.sposobCelowania !== 'kolko' || !trzymanie) return 0;
  const rMax = USTAWIENIA.kolkoNaPoczatku * L.R;
  const rMin = USTAWIENIA.kolkoNajmniejsze * L.R;
  const zmeczenie = Math.max(0, trzymanie.czasTrzymania - USTAWIENIA.zmeczenieReki);
  return Math.min(rMax * 1.3, rMin + (rMax - rMin) * (1 - trzymanie.skupienie) + zmeczenie * rMax * 0.45);
}

function zmeczonaReka() {
  return !!trzymanie && USTAWIENIA.sposobCelowania === 'kolko' && trzymanie.czasTrzymania > USTAWIENIA.zmeczenieReki;
}

// Co klatkę: spokojny palec = większe skupienie, ruszający się palec = mniejsze
function aktualizujKolko(dt) {
  const t = trzymanie;
  if (!t || dt <= 0) return;
  t.czasTrzymania += dt;
  const predkosc = Math.hypot(t.x - t.px, t.y - t.py) / dt;   // piksele na sekundę
  t.px = t.x;
  t.py = t.y;
  t.skupienie += dt / USTAWIENIA.czasSkupienia;
  if (predkosc > 60) t.skupienie -= (predkosc * dt) / 200;
  t.skupienie = ogranicz(t.skupienie, 0, 1);
}

// Lotka wylatuje z ręki (x0, y0) i leci do (x1, y1) – wszystko w pikselach na ekranie
function wypuscLotke(x0, y0, x1, y1) {
  const mx = (x1 - L.tx) / L.mm;
  const my = (y1 - L.ty) / L.mm;

  let wynik;
  let gdzie = 'tarcza';
  let komentarz = '';
  if (Math.hypot(mx, my) <= PROMIEN_OBUDOWY) {
    wynik = ocenPole(mx, my);
  } else {
    gdzie = 'pudlo';
    wynik = { liczba: 0, mnoznik: 0, punkty: 0, krotko: 'Pudło', pudlo: true };
    komentarz = 'Pudło!';
    if (my > PROMIEN_OBUDOWY * 0.7) komentarz = 'Za słabo!';
    else if (my < -PROMIEN_OBUDOWY * 0.7) komentarz = 'Za mocno!';
  }

  // Wbita lotka patrzy tyłem w stronę ręki, która ją rzuciła (ale głównie w dół i trochę w prawo)
  const wStroneReki = Math.atan2(y0 - y1, x0 - x1);
  const katKoncowy = Math.PI / 2 - 0.3 + ogranicz(roznicaKatow(wStroneReki, Math.PI / 2), -1, 1) * 0.4 + (Math.random() - 0.5) * 0.15;

  const odleglosc = Math.hypot(x1 - x0, y1 - y0);
  lot = {
    x0, y0, mx, my, t: 0,
    czas: ogranicz(0.22 + odleglosc / 2600, 0.24, 0.42),
    wynik, gdzie, komentarz, katKoncowy,
    kolor: gracze[ktory].kolor,
  };
  wReku = 0;
  bezRzutu = false;
  dzwiekMachniecia();
}

// Lotka doleciała
function wbij() {
  const l = lot;
  lot = null;
  przeladowanie = 0.3;
  const x = L.tx + l.mx * L.mm;
  const y = L.ty + l.my * L.mm;
  const w = l.wynik;

  if (l.gdzie === 'pudlo') {
    // Odbija się od ściany i spada na podłogę
    if (x > -60 && x < L.W + 60 && y > -60 && y < L.H) {
      spadajace.push({
        x, y,
        vx: (Math.random() - 0.5) * 160,
        vy: -120,
        kat: l.katKoncowy,
        w: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4),
        kolor: l.kolor,
      });
      dzwiekPodlogi(0.35);
    }
    dzwiekSciany();
    napis(l.komentarz, x, ogranicz(y, L.hudH + 30, L.H - 40), '#ff8fa3', true);
  } else {
    lotkiNaTarczy.push({ mx: l.mx, my: l.my, kat: l.katKoncowy, kolor: l.kolor, t: 0 });
    drzenieTarczy = 1;
    if (w.obok) dzwiekObudowy();
    else dzwiekWbicia();
    pylek(x, y);
  }

  const g = gracze[ktory];
  tura.push(w);
  g.lotki++;
  if (w.mnoznik === 3) g.potrojne++;
  if (w.liczba === 25) g.srodki++;
  const ny = y - L.fs * 1.3;   // tu pokazujemy napis z punktami

  if (dookola()) {
    liczDookola(g, w, x, y, ny);
    if (wygral >= 0 || tura.length >= USTAWIENIA.lotekWKolejce) zakonczKolejke();
    return;
  }

  // 501 i 301: odejmujemy. Ale uwaga na „za dużo”!
  const zostanie = g.wynik - w.punkty;
  const podw = USTAWIENIA.koncowkaNaPodwojnym;
  let powod = '';
  let wyjasnienie = '';
  if (zostanie < 0) {
    powod = 'Za dużo!';
    wyjasnienie = `${w.krotko} – za dużo!`;
  } else if (podw && zostanie === 1) {
    powod = 'Zostałoby 1!';
    wyjasnienie = 'Z 1 nie da się skończyć!';
  } else if (podw && zostanie === 0 && w.mnoznik !== 2) {
    powod = 'Nie na podwójnym!';
    wyjasnienie = 'Ostatnia lotka: podwójne albo środek!';
  }
  if (powod) {
    // Cała kolejka się nie liczy – wracasz do tego, co było przed nią
    w.zaDuzo = true;
    spalona = true;
    powodSpalenia = powod;
    g.wynik = g.wynikPrzedKolejka;
    napis(wyjasnienie, x, ny, '#ff5a5f', true, 1.6);
  } else {
    g.wynik = zostanie;
    pokazTrafienie(w, x, ny);
    if (zostanie === 0) wygral = ktory;
  }

  if (wygral >= 0 || spalona || tura.length >= USTAWIENIA.lotekWKolejce) zakonczKolejke();
}

// Dookoła tarczy: trafiłeś w liczbę, w którą trzeba? To idziesz dalej.
function liczDookola(g, w, x, y, ny) {
  const cel = liczbaCelu(g.cel);
  if (w.liczba > 0 && w.liczba === cel) {
    w.trafionyCel = true;
    const skok = USTAWIENIA.podwojneSkacza && cel !== 25 ? w.mnoznik : 1;
    g.cel = g.cel >= 21 ? 22 : Math.min(21, g.cel + skok);
    if (g.cel === 22) wygral = ktory;
    napis(skok > 1 ? `${w.krotko}! Skok o ${skok}!` : `${cel === 25 ? 'Środek' : cel} ✓`, x, ny, '#3ddc97', true);
    dzwiekCelu(skok);
    if (skok > 1 || cel === 25) konfetti(x, y, 24);
  } else if (!w.pudlo) {
    napis(w.obok ? 'Obok' : (w.liczba === 25 ? 'Środek' : String(w.liczba)), x, ny, 'rgba(255, 255, 255, 0.75)');
  }
}

function pokazTrafienie(w, x, y) {
  if (w.pudlo) return;     // „Pudło!” już jest
  if (w.obok) {
    napis('Obok! 0', x, y, '#ff8fa3');
  } else if (w.punkty === 50) {
    napis('ŚRODEK! 50', x, y, '#ffd23f', true, 1.6);
    konfetti(x, y, 40);
    dzwiekSrodka();
  } else if (w.liczba === 25) {
    napis('25!', x, y, '#3ddc97', true);
    dzwiekPodwojnego();
  } else if (w.mnoznik === 3) {
    napis(`${w.krotko} = ${w.punkty}!`, x, y, '#ff9f1c', true, 1.4);
    konfetti(x, y, 22);
    dzwiekPotrojnego();
  } else if (w.mnoznik === 2) {
    napis(`${w.krotko} = ${w.punkty}`, x, y, '#4cc9f0', true);
    dzwiekPodwojnego();
  } else {
    napis(String(w.punkty), x, y, '#ffffff');
  }
}

function komentarzKolejki(suma) {
  if (suma >= 100) return 'Rewelacja!';
  if (suma >= 60) return 'Super!';
  if (suma >= 40) return 'Brawo!';
  if (suma >= 20) return 'Dobrze!';
  if (suma === 0) return 'Ojej!';
  return '';
}

function zakonczKolejke() {
  const g = gracze[ktory];
  const suma = spalona ? 0 : sumaKolejki();
  g.historia.push({ suma, po: g.wynik, zaDuzo: spalona });
  g.najlepszaKolejka = Math.max(g.najlepszaKolejka, suma);
  trzymanie = null;
  ladowanie = null;
  ustawFaze('koniecKolejki', 1.4);
  koniecPoKolejce = wygral >= 0;
  const nizej = L.ty + L.Rz * 0.62;   // duże napisy niżej, żeby było widać lotki w tarczy

  if (wygral >= 0) {
    ustawFaze('koniecKolejki', 2.6);
    const tytul = gracze.length > 1 ? `Wygrywa ${g.imie}!` : dookola() ? 'Cała tarcza!' : 'Zero! Udało się!';
    pokazBaner(tytul, gracze.length > 1 ? g.kolor : '#ffd23f', `${g.lotki} ${slowoLotek(g.lotki)}`, 2.6, true, nizej);
    for (let i = -1; i <= 1; i++) konfetti(L.tx + i * L.R * 0.7, L.ty - L.R * 0.3, 40, 1.3);
    dzwiekWygranej();
    powiedz(gracze.length > 1 ? `Koniec gry! Wygrywa ${g.imie}!` : 'Koniec gry! Brawo!');
  } else if (spalona) {
    ustawFaze('koniecKolejki', 2.2);
    pokazBaner(powodSpalenia, '#ff5a5f', `Wracasz do ${g.wynik}`, 2.2, false, nizej);
    dzwiekZaDuzo();
    powiedz(powodSpalenia);
  } else if (dookola()) {
    powiedz(`Teraz ${nazwaCelu(g.cel)}`);
  } else if (suma === 180) {
    ustawFaze('koniecKolejki', 2.8);
    pokazBaner('180!', '#ffd23f', 'Najwięcej, ile się da!', 2.8, true, nizej);
    for (let i = -1; i <= 1; i++) konfetti(L.tx + i * L.R * 0.6, L.ty - L.R * 0.5, 50, 1.4);
    dzwiek180();
    powiedz('Sto osiemdziesiąt!');
  } else {
    powiedz(String(suma));
    if (suma >= 100) dzwiekDopingu();
  }
}

function nastepnaKolejka() {
  lotkiNaTarczy = [];
  tura = [];
  spalona = false;
  powodSpalenia = '';
  ktory++;
  if (ktory >= gracze.length) {
    ktory = 0;
    runda++;
  }
  rozpocznijKolejke();
}

// Tapnięcie albo spacja po kolejce – nie czekamy tak długo
function przyspiesz() {
  if (faza === 'koniecKolejki' && czas - fazaOd > 0.5) fazaCzas = Math.min(fazaCzas, 0);
}

function koniecGry() {
  stan = 'koniec';
  koniecOd = czas;
  trzymanie = null;
  ladowanie = null;
  nowyRekord = null;
  // Wygrywa ten, kto pierwszy skończył. Rekord: jak najmniej lotek.
  zwyciezca = gracze[wygral];
  const n = zwyciezca.lotki;
  if (!rekordy[trybGry] || n < rekordy[trybGry]) {
    rekordy[trybGry] = n;
    zapiszRekord(trybGry, n);
    nowyRekord = { gracz: zwyciezca, wartosc: n };
  }
}

function aktualizujGre(dt) {
  // ręka na klawiaturze
  if (klawisze.lewo) reka.dx -= 0.9 * dt;
  if (klawisze.prawo) reka.dx += 0.9 * dt;
  reka.dx = ogranicz(reka.dx, -1.45, 1.45);
  if (ladowanie) ladowanie.t += dt;
  aktualizujKolko(dt);

  if (przeladowanie > 0) przeladowanie = Math.max(0, przeladowanie - dt);
  if (lotkaGotowa()) wReku += dt;
  else if (!trzymanie) wReku = 0;
  drzenieTarczy = Math.max(0, drzenieTarczy - dt * 3.5);
  for (const l of lotkiNaTarczy) l.t += dt;

  if (lot) {
    lot.t += dt;
    if (lot.t >= lot.czas) wbij();
  }

  if (faza === 'zmiana') {
    fazaCzas -= dt;
    if (fazaCzas <= 0) faza = 'celuj';
  } else if (faza === 'koniecKolejki') {
    fazaCzas -= dt;
    if (fazaCzas <= 0) {
      if (koniecPoKolejce) {
        koniecGry();
      } else {
        ustawFaze('zbieranie', 0.45);
        if (lotkiNaTarczy.length) dzwiekZbierania();
      }
    }
  } else if (faza === 'zbieranie') {
    fazaCzas -= dt;
    if (fazaCzas <= 0) nastepnaKolejka();
  }
}


// =====================================================
//   EFEKTY (napisy, konfetti, pyłek)
// =====================================================
function napis(tekst, x, y, kolor, duzy = false, dlugosc = 1.1) {
  if (!tekst) return;
  efekty.push({ typ: 'napis', tekst, x, y, kolor, duzy, t: 0, dlugosc });
}

function konfetti(x, y, ile, sila = 1) {
  for (let i = 0; i < ile; i++) {
    efekty.push({
      typ: 'konfetti',
      x, y,
      vx: (Math.random() - 0.5) * 520 * sila,
      vy: (-Math.random() * 520 - 120) * sila,
      kolor: KOLORY_KONFETTI[i % KOLORY_KONFETTI.length],
      obrot: Math.random() * 6,
      w: (Math.random() - 0.5) * 14,
      rozm: 4 + Math.random() * 5,
      t: 0,
      dlugosc: 1.3 + Math.random() * 0.7,
    });
  }
}

// Mały pyłek, kiedy lotka wbija się w tarczę
function pylek(x, y) {
  for (let i = 0; i < 7; i++) {
    efekty.push({
      typ: 'pylek',
      x, y,
      vx: (Math.random() - 0.5) * 170,
      vy: (Math.random() - 0.8) * 150,
      rozm: 1.2 + Math.random() * 1.8,
      t: 0,
      dlugosc: 0.3 + Math.random() * 0.25,
    });
  }
}

function pokazBaner(tekst, kolor, podtekst = '', dlugosc = 1.2, duzy = false, y = null) {
  baner = { tekst, kolor, podtekst, t: 0, dlugosc, duzy, y };
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.t += dt;
    if (e.typ !== 'napis') {
      e.vy += (e.typ === 'konfetti' ? 700 : 450) * dt;
      e.vx *= 1 - dt * 1.2;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.typ === 'konfetti') e.obrot += e.w * dt;
    }
  }
  efekty = efekty.filter((e) => e.t < e.dlugosc);
  if (baner) {
    baner.t += dt;
    if (baner.t >= baner.dlugosc) baner = null;
  }
}

function aktualizujSpadajace(dt) {
  for (const s of spadajace) {
    s.vy += 2200 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.kat += s.w * dt;
  }
  spadajace = spadajace.filter((s) => s.y < L.H + 200);
}


// =====================================================
//   STEROWANIE
// =====================================================
// Czy (x, y) jest w okienku (pauza, start, koniec)?
function wOkienku(x, y) {
  return !!okienko && x >= okienko.x && x <= okienko.x + okienko.w && y >= okienko.y && y <= okienko.y + okienko.h;
}

function przyciskPod(x, y) {
  for (const p of przyciski) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p.akcja;
  }
  return null;
}

function idzDoMenu() {
  window.location.href = '../index.html';
}

function wybierzTryb(t) {
  tryb = t;
  zapisz('dart-tryb', t);
}

function zmienTryb(krok) {
  const i = TRYBY.indexOf(tryb);
  wybierzTryb(TRYBY[(i + krok + TRYBY.length) % TRYBY.length]);
  dzwiekKlik();
}

function wybierzGraczy(n) {
  ileGraczy = n;
  zapisz('dart-gracze', n);
  dzwiekKlik();
}

function doStartu() {
  stan = 'start';
  gracze = [];
  lot = null;
  lotkiNaTarczy = [];
  spadajace = [];
  baner = null;
  trzymanie = null;
  ladowanie = null;
}

function wykonaj(akcja) {
  if (akcja === 'menu') idzDoMenu();
  else if (akcja.startsWith('tryb:')) {
    wybierzTryb(akcja.slice(5));
    dzwiekKlik();
  } else if (akcja.startsWith('gracze:')) wybierzGraczy(Number(akcja.slice(7)));
  else if (akcja === 'graj') nowaGra();
  else if (akcja === 'znowu') {
    if (czas - koniecOd > 0.8) nowaGra();   // chwila przerwy, żeby nie zacząć przez przypadek
  } else if (akcja === 'dalej') stan = 'gra';
}

function pauza() {
  if (stan !== 'gra') return;
  stan = 'pauza';
  trzymanie = null;
  ladowanie = null;
  klawisze.lewo = false;
  klawisze.prawo = false;
}

// Spacja: żółte kółko jeździ po tarczy w górę i w dół
function silaLadowania() {
  if (!ladowanie) return 0;
  const u = (ladowanie.t * 0.75) % 2;
  return 1 - Math.abs(u - 1);   // 0 → 1 → 0 → 1...
}

function yZnacznika() {
  return L.ty + (0.5 - silaLadowania()) * 3.2 * L.R;
}

function rzutZKlawiatury() {
  const b = bujanie();
  const y1 = yZnacznika() + b.y;
  ladowanie = null;
  if (!lotkaGotowa()) return;
  if (faza === 'zmiana') faza = 'celuj';
  const x = rekaX();
  wypuscLotke(x, L.rekaY - L.dlugoscLotki / 2, x + b.x, y1);
}

window.addEventListener('keydown', (e) => {
  const kod = e.code;
  const spacja = kod === 'Space' || kod === 'Enter' || kod === 'NumpadEnter';
  if (spacja) e.preventDefault();
  if (kod === 'KeyM') {
    wyciszone = !wyciszone;
    if (wyciszone) ucisz();
    return;
  }

  // Na starcie, w pauzie i na końcu: ← → wybiera grę, 1 i 2 – ilu graczy
  if (stan !== 'gra') {
    if (kod === 'ArrowLeft' || kod === 'KeyA') {
      zmienTryb(-1);
      return;
    }
    if (kod === 'ArrowRight' || kod === 'KeyD') {
      zmienTryb(1);
      return;
    }
    if (kod === 'Digit1' || kod === 'Numpad1') {
      wybierzGraczy(1);
      return;
    }
    if (kod === 'Digit2' || kod === 'Numpad2') {
      wybierzGraczy(2);
      return;
    }
    if (kod === 'ArrowUp' || kod === 'ArrowDown' || kod === 'KeyW' || kod === 'KeyS') {
      e.preventDefault();
      wybierzGraczy(ileGraczy === 1 ? 2 : 1);
      return;
    }
    if (kod === 'KeyQ') {
      idzDoMenu();
      return;
    }
  }

  if (stan === 'start') {
    if (spacja && !e.repeat) nowaGra();
    return;
  }

  if (stan === 'koniec') {
    if (spacja && !e.repeat && czas - koniecOd > 1) nowaGra();
    else if (kod === 'Escape') doStartu();
    return;
  }

  if (stan === 'pauza') {
    if ((spacja && !e.repeat) || kod === 'Escape' || kod === 'KeyP') stan = 'gra';
    else if (kod === 'KeyN') nowaGra();
    return;
  }

  // W czasie gry
  if (kod === 'Escape' || kod === 'KeyP') {
    pauza();
    return;
  }
  if (spacja) {
    if (e.repeat) return;
    if (faza === 'koniecKolejki') {
      przyspiesz();
      return;
    }
    if (lotkaGotowa() && !trzymanie && !ladowanie) {
      ladowanie = { t: 0 };
      ostatnioKlawiatura = true;
    }
    return;
  }
  if (kod === 'ArrowLeft' || kod === 'KeyA') {
    e.preventDefault();
    klawisze.lewo = true;
    ostatnioKlawiatura = true;
  } else if (kod === 'ArrowRight' || kod === 'KeyD') {
    e.preventDefault();
    klawisze.prawo = true;
    ostatnioKlawiatura = true;
  }
});

window.addEventListener('keyup', (e) => {
  const kod = e.code;
  if (kod === 'Space' || kod === 'Enter' || kod === 'NumpadEnter') {
    if (ladowanie && stan === 'gra') rzutZKlawiatury();
    ladowanie = null;
  } else if (kod === 'ArrowLeft' || kod === 'KeyA') {
    klawisze.lewo = false;
  } else if (kod === 'ArrowRight' || kod === 'KeyD') {
    klawisze.prawo = false;
  }
});

// Myszka i palec: złap lotkę, pociągnij w górę i puść
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  const x = e.clientX;
  const y = e.clientY;
  if (stan !== 'gra') {
    const akcja = przyciskPod(x, y);
    if (akcja) wykonaj(akcja);
    else if (stan === 'pauza' && !wOkienku(x, y)) stan = 'gra';   // stuknięcie obok okienka = graj dalej
    return;
  }
  if (y < L.hudH) {      // stuknięcie w górny pasek = pauza
    pauza();
    return;
  }
  if (faza === 'koniecKolejki' || faza === 'zbieranie') {
    przyspiesz();
    return;
  }
  if (!lotkaGotowa() || trzymanie || ladowanie) return;
  if (faza === 'zmiana') {
    faza = 'celuj';
    if (baner) baner.t = Math.max(baner.t, baner.dlugosc - 0.2);
  }
  trzymanie = {
    id: e.pointerId, x, y, startX: x, startY: y, vx: 0, t: e.timeStamp,
    px: x, py: y, skupienie: 0, czasTrzymania: 0,   // do kółka
  };
  ostatnioKlawiatura = false;
  try {
    plotno.setPointerCapture(e.pointerId);
  } catch (err) {
    // bez tego też zadziała
  }
});

plotno.addEventListener('pointermove', (e) => {
  if (!trzymanie || e.pointerId !== trzymanie.id) return;
  const dt = Math.max(1, e.timeStamp - trzymanie.t);
  trzymanie.vx = trzymanie.vx * 0.6 + ((e.clientX - trzymanie.x) / dt) * 1000 * 0.4;   // do przechylania lotki
  trzymanie.t = e.timeStamp;
  trzymanie.x = e.clientX;
  trzymanie.y = e.clientY;
});

// Puszczasz lotkę – leci tam, gdzie jest celownik
function puscLotke(e, anuluj) {
  if (!trzymanie || e.pointerId !== trzymanie.id) return;
  trzymanie.x = e.clientX;
  trzymanie.y = e.clientY;
  const cel = celownikPalca();
  const ciag = pociagniecie();
  trzymanie = null;
  if (anuluj || stan !== 'gra' || !lotkaGotowa()) return;
  const czubekX = e.clientX;
  const czubekY = e.clientY - L.dlugoscLotki * 0.35;
  if (ciag < 25) {
    // Prawie nie pociągnąłeś – lotka zostaje w ręce
    napis('Pociągnij lotkę w górę!', czubekX, czubekY - L.fs, '#ffd23f');
    return;
  }
  // Lotka wpada w losowe miejsce w kółku (przy sposobie „celownik” kółko ma 0, więc leci dokładnie w celownik)
  const kat = Math.random() * Math.PI * 2;
  const odl = cel.r * Math.sqrt(Math.random());
  wypuscLotke(czubekX, czubekY, cel.x + Math.cos(kat) * odl, cel.y + Math.sin(kat) * odl);
}

plotno.addEventListener('pointerup', (e) => puscLotke(e, false));
plotno.addEventListener('pointercancel', (e) => puscLotke(e, true));
plotno.addEventListener('contextmenu', (e) => e.preventDefault());

// Gdy przełączysz kartę albo okno – gra sama się pauzuje
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauza();
});
window.addEventListener('blur', pauza);
window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   RYSOWANIE – narzędzia
// =====================================================

// Prostokąt z zaokrąglonymi rogami
function sciezkaZaokraglona(x, y, w, h, r) {
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

// Kawałek pierścienia (jedno pole tarczy). Kąty: 0 = w prawo, rośnie zgodnie z zegarem.
function wycinek(c, cx, cy, r1, r2, a1, a2) {
  c.moveTo(cx + Math.cos(a1) * r2, cy + Math.sin(a1) * r2);
  c.arc(cx, cy, r2, a1, a2);
  c.arc(cx, cy, r1, a2, a1, true);
  c.closePath();
}

function czcionka(rozmiar, gruba) {
  return `${gruba ? '700 ' : ''}${Math.round(rozmiar)}px "Segoe UI", system-ui, -apple-system, sans-serif`;
}

function kreda(rozmiar, gruba) {
  return `${gruba ? '700 ' : ''}${Math.round(rozmiar)}px "Segoe Print", "Chalkboard SE", "Comic Sans MS", cursive`;
}

// Napis z ciemną obwódką – dobrze go widać na każdym tle
function tekstZObwodka(tekst, x, y, kolor, grubosc = 4) {
  ctx.lineWidth = grubosc;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeText(tekst, x, y);
  ctx.fillStyle = kolor;
  ctx.fillText(tekst, x, y);
}

function zawijajTekst(tekst, maxSzer) {
  const slowa = tekst.split(' ');
  const linie = [];
  let wiersz = '';
  for (const s of slowa) {
    const proba = wiersz ? wiersz + ' ' + s : s;
    if (wiersz && ctx.measureText(proba).width > maxSzer) {
      linie.push(wiersz);
      wiersz = s;
    } else {
      wiersz = proba;
    }
  }
  if (wiersz) linie.push(wiersz);
  return linie;
}

// Ustawia czcionkę tak, żeby napis zmieścił się w podanej szerokości
function dopasujCzcionke(tekst, rozmiar, gruba, maxSzer) {
  ctx.font = czcionka(rozmiar, gruba);
  const w = ctx.measureText(tekst).width;
  if (w > maxSzer) ctx.font = czcionka(Math.max(8, (rozmiar * maxSzer) / w), gruba);
}

function przytnij(tekst, maxSzer) {
  if (ctx.measureText(tekst).width <= maxSzer) return tekst;
  let t = tekst;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxSzer) t = t.slice(0, -1);
  return t + '…';
}

function migotanie() {
  return 0.45 + 0.55 * Math.abs(Math.sin(czas * 3));
}


// =====================================================
//   RYSOWANIE – ściana i tarcza (rysowane raz, potem tylko kopiowane)
// =====================================================
function przygotujTlo() {
  const dpr = L.dpr;
  plotnoTla.width = Math.round(L.W * dpr);
  plotnoTla.height = Math.round(L.H * dpr);
  const c = plotnoTla.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const los = losowanie(11);

  // Drewniane deski
  const szerDeski = ogranicz(L.W / 9, 60, 120);
  for (let x = -los() * szerDeski; x < L.W; x += szerDeski) {
    const j = 0.82 + los() * 0.3;
    c.fillStyle = `rgb(${Math.round(70 * j)}, ${Math.round(44 * j)}, ${Math.round(28 * j)})`;
    c.fillRect(x, 0, szerDeski, L.H);
    // słoje drewna
    c.strokeStyle = 'rgba(0, 0, 0, 0.13)';
    c.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const sx = x + 8 + los() * (szerDeski - 16);
      const przes = los() * 10;
      c.beginPath();
      for (let y = 0; y <= L.H + 30; y += 30) {
        const xx = sx + Math.sin(y * 0.012 + przes) * 4;
        if (y === 0) c.moveTo(xx, y);
        else c.lineTo(xx, y);
      }
      c.stroke();
    }
    // sęk
    if (los() < 0.45) {
      const sekY = los() * L.H;
      const sekX = x + szerDeski * (0.3 + los() * 0.4);
      c.fillStyle = 'rgba(30, 16, 8, 0.45)';
      c.beginPath();
      c.ellipse(sekX, sekY, 5, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(30, 16, 8, 0.25)';
      c.beginPath();
      c.ellipse(sekX, sekY, 9, 16, 0, 0, Math.PI * 2);
      c.stroke();
    }
    // szpara między deskami
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.fillRect(x, 0, 2, L.H);
    c.fillStyle = 'rgba(255, 255, 255, 0.05)';
    c.fillRect(x + 2, 0, 1, L.H);
  }

  // Lampa świeci na tarczę
  const sw = c.createRadialGradient(L.tx, L.ty - L.Rz * 0.4, L.Rz * 0.2, L.tx, L.ty, L.Rz * 2.3);
  sw.addColorStop(0, 'rgba(255, 214, 150, 0.32)');
  sw.addColorStop(0.5, 'rgba(255, 214, 150, 0.12)');
  sw.addColorStop(1, 'rgba(255, 214, 150, 0)');
  c.fillStyle = sw;
  c.fillRect(0, 0, L.W, L.H);

  // Ciemne rogi
  const r = Math.hypot(L.W, L.H) / 2;
  const v = c.createRadialGradient(L.W / 2, L.ty, r * 0.35, L.W / 2, L.ty, r * 1.1);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  c.fillStyle = v;
  c.fillRect(0, 0, L.W, L.H);

  // Ciemniejszy dół – tu jest ręka z lotką i napisy
  const d = c.createLinearGradient(0, L.H - L.dolH * 1.1, 0, L.H);
  d.addColorStop(0, 'rgba(8, 6, 20, 0)');
  d.addColorStop(1, 'rgba(8, 6, 20, 0.8)');
  c.fillStyle = d;
  c.fillRect(0, L.H - L.dolH * 1.1, L.W, L.dolH * 1.1);
}

function przygotujTarcze() {
  const dpr = L.dpr;
  const rozm = Math.ceil(L.Rz + L.R * 0.14) * 2;
  L.tarczaRozm = rozm;
  plotnoTarczy.width = Math.round(rozm * dpr);
  plotnoTarczy.height = Math.round(rozm * dpr);
  const c = plotnoTarczy.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = rozm / 2;          // środek
  const mm = L.mm;
  const R = L.R;

  // Cień tarczy na ścianie i czarny pierścień z numerami
  c.save();
  c.shadowColor = 'rgba(0, 0, 0, 0.65)';
  c.shadowBlur = R * 0.1 * dpr;
  c.shadowOffsetY = R * 0.04 * dpr;
  c.beginPath();
  c.arc(s, s, L.Rz, 0, Math.PI * 2);
  c.fillStyle = '#141312';
  c.fill();
  c.restore();
  const go = c.createRadialGradient(s, s - L.Rz * 0.3, L.Rz * 0.1, s, s, L.Rz);
  go.addColorStop(0, '#2c2a28');
  go.addColorStop(1, '#121110');
  c.beginPath();
  c.arc(s, s, L.Rz, 0, Math.PI * 2);
  c.fillStyle = go;
  c.fill();
  c.lineWidth = Math.max(1.5, R * 0.012);
  c.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  c.beginPath();
  c.arc(s, s, L.Rz - c.lineWidth / 2, 0, Math.PI * 2);
  c.stroke();

  // Pola: czarne i jasne, a pierścienie czerwone i zielone
  const krok = Math.PI / 10;
  for (let i = 0; i < 20; i++) {
    const a1 = -Math.PI / 2 + (i - 0.5) * krok;
    const a2 = a1 + krok;
    const parzyste = i % 2 === 0;
    const pole = parzyste ? KOLORY_TARCZY.ciemne : KOLORY_TARCZY.jasne;
    const pierscien = parzyste ? KOLORY_TARCZY.czerwone : KOLORY_TARCZY.zielone;
    const kawalki = [
      [P.zielonyKrag, P.potrojneOd, pole],
      [P.potrojneOd, P.potrojneDo, pierscien],
      [P.potrojneDo, P.podwojneOd, pole],
      [P.podwojneOd, P.podwojneDo, pierscien],
    ];
    for (const [r1, r2, kolor] of kawalki) {
      c.beginPath();
      wycinek(c, s, s, r1 * mm, r2 * mm, a1, a2);
      c.fillStyle = kolor;
      c.fill();
    }
  }
  c.beginPath();
  c.arc(s, s, P.zielonyKrag * mm, 0, Math.PI * 2);
  c.fillStyle = KOLORY_TARCZY.zielone;
  c.fill();
  c.beginPath();
  c.arc(s, s, P.srodek * mm, 0, Math.PI * 2);
  c.fillStyle = KOLORY_TARCZY.czerwone;
  c.fill();

  // Korek: tysiące małych ziarenek – jaśniejszych i ciemniejszych – i trochę dziurek
  c.save();
  c.beginPath();
  c.arc(s, s, R, 0, Math.PI * 2);
  c.clip();
  const los = losowanie(5);
  const skalaZiarna = Math.max(0.7, R / 200);
  const ile = Math.round(R * R * ZIARENKA_KORKA);
  // większe, miękkie plamy – korek nigdy nie ma wszędzie tego samego koloru
  for (let i = 0; i < ile / 25; i++) {
    const a = los() * Math.PI * 2;
    const r = Math.sqrt(los()) * R;
    c.fillStyle = los() < 0.5
      ? `rgba(130, 70, 25, ${0.05 + los() * 0.08})`
      : `rgba(255, 220, 160, ${0.04 + los() * 0.07})`;
    c.beginPath();
    c.arc(s + Math.cos(a) * r, s + Math.sin(a) * r, (2.5 + los() * 5) * skalaZiarna, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < ile; i++) {
    const a = los() * Math.PI * 2;
    const r = Math.sqrt(los()) * R;
    const zx = s + Math.cos(a) * r;
    const zy = s + Math.sin(a) * r;
    const jasne = los() < 0.5;
    c.fillStyle = jasne
      ? `rgba(255, 232, 190, ${0.05 + los() * 0.12})`
      : `rgba(75, 36, 10, ${0.08 + los() * 0.2})`;
    c.beginPath();
    c.ellipse(zx, zy, (0.6 + los() * 1.5) * skalaZiarna, (0.5 + los() * 1.1) * skalaZiarna, los() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = 'rgba(25, 12, 2, 0.4)';
  for (let i = 0; i < ile / 12; i++) {
    const a = los() * Math.PI * 2;
    const r = Math.sqrt(los()) * R;
    c.beginPath();
    c.arc(s + Math.cos(a) * r, s + Math.sin(a) * r, (0.3 + los() * 0.6) * skalaZiarna, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();

  // Delikatny połysk – tarcza wygląda na wypukłą
  const gl = c.createRadialGradient(s - R * 0.3, s - R * 0.35, R * 0.05, s, s, R);
  gl.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gl.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
  gl.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  c.beginPath();
  c.arc(s, s, R, 0, Math.PI * 2);
  c.fillStyle = gl;
  c.fill();

  // Metalowe druciki między polami
  c.strokeStyle = KOLORY_TARCZY.drut;
  c.globalAlpha = 0.8;
  c.lineWidth = Math.max(0.8, R * 0.006);
  for (const r of [P.srodek, P.zielonyKrag, P.potrojneOd, P.potrojneDo, P.podwojneOd, P.podwojneDo]) {
    c.beginPath();
    c.arc(s, s, r * mm, 0, Math.PI * 2);
    c.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI / 2 + (i - 0.5) * krok;
    c.beginPath();
    c.moveTo(s + Math.cos(a) * P.zielonyKrag * mm, s + Math.sin(a) * P.zielonyKrag * mm);
    c.lineTo(s + Math.cos(a) * P.podwojneDo * mm, s + Math.sin(a) * P.podwojneDo * mm);
    c.stroke();
  }
  c.globalAlpha = 1;

  // Numery dookoła
  c.font = czcionka(R * 0.15, true);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#f4f1ea';
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI / 2 + i * krok;
    c.fillText(String(NUMERY[i]), s + Math.cos(a) * PROMIEN_NUMEROW * mm, s + Math.sin(a) * PROMIEN_NUMEROW * mm + 1);
  }
}


// =====================================================
//   RYSOWANIE – lotka
// =====================================================
// Kolor jaśniejszy (k > 0) albo ciemniejszy (k < 0). Kolor musi być zapisany jak '#ff5a5f'.
function zmienJasnosc(hex, k) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const kanal = (c) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
  return `rgb(${kanal((n >> 16) & 255)}, ${kanal((n >> 8) & 255)}, ${kanal(n & 255)})`;
}

// (x, y) to czubek lotki, kat to kierunek od czubka do piór, dl to długość lotki.
// obrot kręci piórami w locie.
// Od czubka: stalowa igła, metalowy korpus z rowkami (żeby nie wyślizgiwał się z palców),
// czarny trzonek z kolorowym pierścieniem i pióra w kolorze gracza.
function rysujLotke(x, y, kat, dl, kolor, obrot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kat);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const ciemny = zmienJasnosc(kolor, -0.45);
  const jasny = zmienJasnosc(kolor, 0.45);

  // ---- pióra (dwa widać płasko, trzecie z boku) ----
  const roz = dl * 0.17 * (0.3 + 0.7 * Math.abs(Math.cos(obrot)));
  for (const strona of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dl * 0.61, 0);
    ctx.quadraticCurveTo(dl * 0.73, strona * roz * 0.45, dl * 0.83, strona * roz * 0.95);
    ctx.lineTo(dl * 0.985, strona * roz);
    ctx.quadraticCurveTo(dl * 1.005, strona * roz * 0.55, dl * 0.955, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, strona * roz);
    g.addColorStop(0, ciemny);
    g.addColorStop(0.45, kolor);
    g.addColorStop(1, jasny);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = Math.max(0.7, dl * 0.01);
    ctx.stroke();
    // biały pasek na piórze
    if (roz > 3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = Math.max(1, dl * 0.018);
      linia(dl * 0.8, strona * roz * 0.3, dl * 0.9, strona * roz * 0.82);
    }
  }
  ctx.strokeStyle = jasny;
  ctx.lineWidth = Math.max(1.2, dl * 0.022);
  linia(dl * 0.64, 0, dl * 0.965, 0);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = Math.max(0.6, dl * 0.006);
  linia(dl * 0.64, 0, dl * 0.965, 0);

  // ---- trzonek ----
  const sw = Math.max(2, dl * 0.042);
  const gs = ctx.createLinearGradient(0, -sw / 2, 0, sw / 2);
  gs.addColorStop(0, '#6a6a78');
  gs.addColorStop(0.35, '#2c2c36');
  gs.addColorStop(1, '#0f0f14');
  sciezkaZaokraglona(dl * 0.48, -sw / 2, dl * 0.32, sw, sw * 0.3);
  ctx.fillStyle = gs;
  ctx.fill();
  ctx.fillStyle = kolor;
  ctx.fillRect(dl * 0.535, -sw / 2, Math.max(1, dl * 0.025), sw);

  // ---- metalowy korpus (beczułka) ----
  const bw = Math.max(3, dl * 0.09);
  ctx.beginPath();
  ctx.moveTo(dl * 0.2, -bw * 0.3);
  ctx.quadraticCurveTo(dl * 0.27, -bw * 0.52, dl * 0.34, -bw * 0.5);
  ctx.lineTo(dl * 0.46, -bw * 0.42);
  ctx.quadraticCurveTo(dl * 0.5, -bw * 0.4, dl * 0.505, -bw * 0.24);
  ctx.lineTo(dl * 0.505, bw * 0.24);
  ctx.quadraticCurveTo(dl * 0.5, bw * 0.4, dl * 0.46, bw * 0.42);
  ctx.lineTo(dl * 0.34, bw * 0.5);
  ctx.quadraticCurveTo(dl * 0.27, bw * 0.52, dl * 0.2, bw * 0.3);
  ctx.closePath();
  const gb = ctx.createLinearGradient(0, -bw / 2, 0, bw / 2);
  gb.addColorStop(0, '#dfe4ee');
  gb.addColorStop(0.22, '#ffffff');
  gb.addColorStop(0.55, '#8a92a3');
  gb.addColorStop(1, '#3a404d');
  ctx.fillStyle = gb;
  ctx.fill();
  ctx.strokeStyle = 'rgba(25, 28, 38, 0.6)';
  ctx.lineWidth = Math.max(0.5, dl * 0.006);
  ctx.stroke();
  if (dl > 30) {
    // rowki na korpusie
    ctx.save();
    ctx.clip();
    ctx.lineWidth = Math.max(0.6, dl * 0.006);
    for (let i = 0; i < 9; i++) {
      const rx = dl * (0.255 + i * 0.022);
      ctx.strokeStyle = 'rgba(30, 34, 46, 0.65)';
      linia(rx, -bw, rx, bw);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      linia(rx + dl * 0.007, -bw, rx + dl * 0.007, bw);
    }
    ctx.restore();
  }

  // ---- stalowa igła ----
  const iw = Math.max(1, dl * 0.015);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(dl * 0.21, -iw);
  ctx.lineTo(dl * 0.21, iw);
  ctx.closePath();
  const gi = ctx.createLinearGradient(0, -iw, 0, iw);
  gi.addColorStop(0, '#f7f9fd');
  gi.addColorStop(1, '#6f7686');
  ctx.fillStyle = gi;
  ctx.fill();
  ctx.restore();
}


// =====================================================
//   RYSOWANIE – scena
// =====================================================
function rysujTarcze(dx) {
  const r = L.tarczaRozm;
  ctx.drawImage(plotnoTarczy, L.tx - r / 2 + dx, L.ty - r / 2, r, r);
}

// Świecące pole: tu warto celować
function rysujPodswietlenie(dx) {
  const cel = celPodpowiedzi();
  if (!cel) return;
  const cx = L.tx + dx;
  const cy = L.ty;
  const mm = L.mm;
  ctx.save();
  ctx.beginPath();
  if (cel.liczba === 25) {
    if (cel.mnoznik === 2) {
      ctx.arc(cx, cy, P.srodek * mm + 1, 0, Math.PI * 2);
    } else if (cel.mnoznik === 1) {
      // tylko zielone kółko (bez czerwonej kropki)
      ctx.arc(cx, cy, P.zielonyKrag * mm + 1, 0, Math.PI * 2);
      ctx.moveTo(cx + P.srodek * mm, cy);
      ctx.arc(cx, cy, P.srodek * mm, Math.PI * 2, 0, true);
    } else {
      ctx.arc(cx, cy, P.zielonyKrag * mm + 1, 0, Math.PI * 2);
    }
  } else {
    const i = NUMERY.indexOf(cel.liczba);
    const a1 = -Math.PI / 2 + (i - 0.5) * (Math.PI / 10);
    const a2 = a1 + Math.PI / 10;
    if (cel.mnoznik === 2) wycinek(ctx, cx, cy, P.podwojneOd * mm, P.podwojneDo * mm, a1, a2);
    else if (cel.mnoznik === 3) wycinek(ctx, cx, cy, P.potrojneOd * mm, P.potrojneDo * mm, a1, a2);
    else if (cel.mnoznik === 1) {
      // zwykłe pole, bez pierścieni (pierścienie dałyby za dużo)
      wycinek(ctx, cx, cy, P.zielonyKrag * mm, P.potrojneOd * mm, a1, a2);
      wycinek(ctx, cx, cy, P.potrojneDo * mm, P.podwojneOd * mm, a1, a2);
    } else {
      wycinek(ctx, cx, cy, P.zielonyKrag * mm, P.podwojneDo * mm, a1, a2);
    }
  }
  const puls = Math.sin(czas * 5);
  ctx.fillStyle = `rgba(255, 238, 110, ${0.5 + 0.2 * puls})`;
  ctx.fill();
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 16 * L.dpr;
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(255, 246, 170, ${0.75 + 0.25 * puls})`;
  ctx.stroke();
  ctx.restore();
}

// Celownik: żółte kółko z krzyżykiem. Lotka poleci dokładnie tam.
function rysujCelownik(x, y) {
  const r = Math.max(8, L.R * 0.065);
  ctx.save();
  ctx.lineCap = 'round';
  for (const [kolor, grubosc] of [['rgba(0, 0, 0, 0.6)', 6], ['#ffd23f', 3]]) {
    ctx.strokeStyle = kolor;
    ctx.lineWidth = grubosc;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    linia(x - r * 1.8, y, x - r * 0.45, y);
    linia(x + r * 0.45, y, x + r * 1.8, y);
    linia(x, y - r * 1.8, x, y - r * 0.45);
    linia(x, y + r * 0.45, x, y + r * 1.8);
  }
  kolo(x, y, 2.2, '#ffd23f');
  ctx.restore();
}

// Kółko wokół celownika: czerwone = duże (lotka poleci byle gdzie), zielone = małe (celnie!)
function rysujKolko(c) {
  const rMax = USTAWIENIA.kolkoNaPoczatku * L.R;
  const rMin = USTAWIENIA.kolkoNajmniejsze * L.R;
  const q = ogranicz((c.r - rMin) / Math.max(1, rMax - rMin), 0, 1);
  const kolor = q < 0.2 ? '61, 220, 151' : q < 0.55 ? '255, 210, 63' : '255, 90, 95';
  ctx.save();
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${kolor}, 0.16)`;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(${kolor}, 0.95)`;
  ctx.stroke();
  ctx.restore();
  if (zmeczonaReka()) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    dopasujCzcionke('Ręka się męczy!', L.fs * 1.05, true, L.W - 20);
    tekstZObwodka('Ręka się męczy!', ogranicz(c.x, 90, L.W - 90), c.y - c.r - L.fs, '#ff8fa3', 4);
  }
}

// Kreska nad ręką i celownik
function rysujLinke() {
  if (stan !== 'gra') return;
  let x;
  if (trzymanie) x = trzymanie.x;
  else if (ostatnioKlawiatura && lotkaGotowa()) x = rekaX();
  else return;
  if (USTAWIENIA.linkaCelowania) {
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    linia(x, L.ty + L.Rz, x, L.ty - L.Rz);
    ctx.restore();
  }
  if (trzymanie) {
    const c = celownikPalca();
    if (c.r > 0) rysujKolko(c);
    rysujCelownik(c.x, c.y);
  } else if (ladowanie) {
    const b = bujanie();
    rysujCelownik(x + b.x, yZnacznika() + b.y);
  }
}

function rysujLotkiNaTarczy(dx) {
  const zbieranie = faza === 'zbieranie' && stan === 'gra' ? 1 - Math.max(0, fazaCzas) / 0.45 : 0;
  for (const l of lotkiNaTarczy) {
    const x = L.tx + l.mx * L.mm + dx;
    const y = L.ty + l.my * L.mm + zbieranie * L.R * 0.25;
    const kiwanie = Math.sin(l.t * 30) * 0.22 * Math.exp(-l.t * 5);   // lotka drga po wbiciu
    ctx.save();
    ctx.globalAlpha = 1 - zbieranie;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6 * L.dpr;
    ctx.shadowOffsetX = L.R * 0.025 * L.dpr;
    ctx.shadowOffsetY = L.R * 0.04 * L.dpr;
    rysujLotke(x, y, l.kat + kiwanie, L.lotkaNaTarczy, l.kolor);
    ctx.restore();
  }
}

function rysujSpadajace() {
  for (const s of spadajace) rysujLotke(s.x, s.y, s.kat, L.lotkaNaTarczy, s.kolor);
}

// Gdzie jest lecąca lotka (e: 0 = w ręce, 1 = w tarczy)
function pozycjaLotu(l, e) {
  const x1 = L.tx + l.mx * L.mm;
  const y1 = L.ty + l.my * L.mm;
  const ee = 1 - (1 - e) * (1 - e);         // z daleka lotka wydaje się zwalniać
  const luk = Math.abs(l.y0 - y1) * 0.18 + 12;
  return {
    x: l.x0 + (x1 - l.x0) * ee,
    y: l.y0 + (y1 - l.y0) * ee - Math.sin(Math.PI * e) * luk,
    ee,
  };
}

function rysujLot() {
  if (!lot) return;
  const e = Math.min(1, lot.t / lot.czas);
  const p = pozycjaLotu(lot, e);
  let kat = lot.katKoncowy;
  if (e < 0.97) {
    const p2 = pozycjaLotu(lot, Math.min(1, e + 0.03));
    kat = Math.atan2(p.y - p2.y, p.x - p2.x);   // pióra z tyłu, czubek do przodu
    if (e > 0.6) kat += roznicaKatow(lot.katKoncowy, kat) * ((e - 0.6) / 0.37);
  }
  const dl = L.dlugoscLotki + (L.lotkaNaTarczy - L.dlugoscLotki) * p.ee;
  rysujLotke(p.x, p.y, kat, dl, lot.kolor, e * 14);
}

function rysujLotkeWRece() {
  const dl = L.dlugoscLotki;
  if (stan === 'start') {
    const kolor = (USTAWIENIA.gracze[0] && USTAWIENIA.gracze[0].kolor) || '#ff5a5f';
    rysujLotke(L.tx, L.rekaY - dl / 2 + Math.sin(czas * 2) * 3, Math.PI / 2, dl, kolor);
    return;
  }
  if (!gracze.length || stan === 'koniec') return;
  const kolor = gracze[ktory].kolor;
  if (trzymanie) {
    // Lotka w palcach – przechyla się, kiedy ruszasz w bok
    const kat = Math.PI / 2 + ogranicz(trzymanie.vx / 3000, -0.5, 0.5);
    const x = trzymanie.x - Math.cos(kat) * dl * 0.35;
    const y = trzymanie.y - Math.sin(kat) * dl * 0.35;
    rysujLotke(x, y, kat, dl, kolor);
    return;
  }
  if (!lotkaGotowa()) return;
  const wysun = Math.pow(1 - Math.min(1, wReku / 0.22), 2) * L.dolH * 0.8;   // nowa lotka wyskakuje z dołu
  const x = rekaX();
  const y = L.rekaY - dl / 2 + wysun + Math.sin(czas * 2.2) * 2.5;
  if (bezRzutu && !ladowanie) {
    // kółko: „złap mnie!”
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + 0.2 * Math.sin(czas * 4)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, L.rekaY + wysun, dl * 0.58, 0, Math.PI * 2);
    ctx.stroke();
  }
  rysujLotke(x, y, Math.PI / 2, dl, kolor);
}

// Podpowiedź przed pierwszym rzutem
function rysujPodpowiedz() {
  if (!bezRzutu || stan !== 'gra' || faza !== 'celuj' || trzymanie || ladowanie || !lotkaGotowa()) return;
  const x = rekaX();
  const tekstY = L.rekaY - L.dlugoscLotki / 2 - L.fs * 1.2;
  // strzałki lecą w górę
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const f = (czas * 0.9 + i * 0.5) % 1;
    const y = tekstY - L.fs * 1.4 - f * Math.min(L.R * 0.9, 130);
    ctx.globalAlpha = Math.sin(f * Math.PI) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 9);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 13, y + 9);
    ctx.stroke();
  }
  ctx.restore();
  let tekst = dotyk ? 'Złap lotkę palcem i pociągnij w górę!' : 'Złap lotkę myszką i pociągnij w górę!';
  if (USTAWIENIA.sposobCelowania === 'kolko') tekst = 'Złap lotkę, pociągnij w górę i trzymaj spokojnie!';
  if (ostatnioKlawiatura) tekst = 'Trzymaj SPACJĘ i puść!';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  dopasujCzcionke(tekst, L.fs * 1.1, true, L.W - 20);
  tekstZObwodka(tekst, ogranicz(x, L.W * 0.3, L.W * 0.7), tekstY, '#ffffff', 5);
}

// Co trafiła lotka – krótki napis na żetonie
function opisLotki(w) {
  if (w.pudlo) return ['Pudło', '0', '#ff8fa3'];
  if (w.obok) return ['Obok', '0', '#ff8fa3'];
  const nazwa = w.liczba === 25 ? 'Środek' : w.krotko;
  if (w.zaDuzo) return [nazwa, 'za dużo', '#ff5a5f'];
  if (dookola()) return [nazwa, w.trafionyCel ? '✓' : '–', w.trafionyCel ? '#3ddc97' : '#cfc8ff'];
  let kolor = '#ffffff';
  if (w.punkty === 50) kolor = '#ffd23f';
  else if (w.liczba === 25) kolor = '#3ddc97';
  else if (w.mnoznik === 3) kolor = '#ff9f1c';
  else if (w.mnoznik === 2) kolor = '#4cc9f0';
  return [nazwa, String(w.punkty), kolor];
}

// Dół ekranu: po lewej lotki tej kolejki, po prawej wynik
function rysujDol() {
  if (stan === 'start' || !gracze.length) return;
  const g = gracze[ktory];
  const fs = L.fs;
  const n = USTAWIENIA.lotekWKolejce;
  const odstep = Math.max(34, L.dlugoscLotki * 0.3);
  ctx.textBaseline = 'middle';

  // ---- po lewej: żetony z lotkami ----
  const cw = Math.min(190, L.tx - odstep - 10);
  const chH = Math.min(fs * 2.1, (L.dolH - 20 - (n - 1) * 6) / n);
  if (cw > 50 && chH > 12) {
    const cx = L.tx - odstep - cw;
    let cy = L.rekaY - (n * chH + (n - 1) * 6) / 2;
    const rozm = Math.max(11, Math.min(chH * 0.5, fs * 0.95));
    for (let i = 0; i < n; i++) {
      const w = tura[i];
      sciezkaZaokraglona(cx, cy, cw, chH, chH / 2);
      ctx.fillStyle = w ? 'rgba(20, 16, 44, 0.88)' : 'rgba(20, 16, 44, 0.55)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = w ? hexAlfa(g.kolor, 0.8) : 'rgba(180, 160, 255, 0.25)';
      ctx.stroke();
      if (w) {
        const [lewy, prawy, kolor] = opisLotki(w);
        ctx.font = czcionka(rozm, true);
        ctx.textAlign = 'left';
        ctx.fillStyle = kolor;
        ctx.fillText(lewy, cx + chH * 0.5, cy + chH / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = w.zaDuzo ? '#ff5a5f' : '#ffd23f';
        ctx.fillText(prawy, cx + cw - chH * 0.5, cy + chH / 2);
      } else {
        // mała lotka czeka na rzut
        const dlMala = Math.min(cw * 0.5, chH * 2.4);
        ctx.globalAlpha = i === tura.length ? 0.95 : 0.4;
        rysujLotke(cx + cw / 2 - dlMala / 2, cy + chH / 2, 0, dlMala, g.kolor);
        ctx.globalAlpha = 1;
      }
      cy += chH + 6;
    }
  }

  // ---- po prawej: ile zostało i jak skończyć ----
  const px = L.tx + odstep;
  const pw = Math.min(210, L.W - px - 10);
  if (pw < 60) return;
  let maly2 = '';
  let maly3 = '';
  let kolor2 = '#cfc8ff';
  let skok = 0;
  const poKolejce = stan === 'gra' && (faza === 'koniecKolejki' || faza === 'zbieranie') && !spalona && wygral < 0;
  const zamk = podpowiedzZamkniecia();
  if (poKolejce) {
    skok = Math.max(0, 1 - (czas - fazaOd) * 4);   // wynik kolejki podskakuje
    maly2 = `Ta kolejka: ${sumaKolejki()}`;
    maly3 = komentarzKolejki(sumaKolejki());
    kolor2 = '#3ddc97';
  } else if (zamk) {
    maly2 = 'Zamknij:';
    maly3 = zamk.map(nazwaRzutu).join(', ');
    kolor2 = '#ffd23f';
  }
  let maly1 = 'Zostało';
  let duzy = String(g.wynik);
  if (dookola()) {
    maly1 = g.cel > 21 ? 'Brawo!' : 'Teraz celuj w';
    duzy = g.cel > 21 ? '✓' : nazwaCelu(g.cel);
    maly2 = `Zaliczone: ${Math.min(21, g.cel - 1)} z 21`;
    maly3 = '';
    kolor2 = '#cfc8ff';
  }
  const y = L.rekaY;
  const k = maly3 ? [-2.05, -0.45, 1.15, 2.35] : [-1.55, 0, 1.55];
  ctx.textAlign = 'left';
  dopasujCzcionke(maly1, fs * 0.85, false, pw);
  ctx.fillStyle = '#a9a3d9';
  ctx.fillText(maly1, px, y + fs * k[0]);
  dopasujCzcionke(duzy, fs * 2.0 * (1 + 0.35 * skok), true, pw);
  tekstZObwodka(duzy, px, y + fs * k[1], '#ffd23f', 4);
  if (maly2) {
    dopasujCzcionke(maly2, fs * 0.85, true, pw);
    ctx.fillStyle = kolor2;
    ctx.fillText(maly2, px, y + fs * k[2]);
  }
  if (maly3) {
    dopasujCzcionke(maly3, fs * 0.95, true, pw);
    ctx.fillStyle = kolor2;
    ctx.fillText(maly3, px, y + fs * k[3]);
  }
}

function rysujEfekty() {
  for (const e of efekty) {
    const f = e.t / e.dlugosc;
    if (e.typ === 'napis') {
      const alfa = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
      const skala = 1 + 0.5 * Math.max(0, 1 - e.t * 7);
      dopasujCzcionke(e.tekst, (e.duzy ? L.fs * 1.7 : L.fs * 1.25) * skala, true, L.W - 16);
      const sz = ctx.measureText(e.tekst).width;
      const x = ogranicz(e.x, sz / 2 + 8, L.W - sz / 2 - 8);
      ctx.globalAlpha = Math.max(0, alfa);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tekstZObwodka(e.tekst, x, e.y - e.t * 38, e.kolor, 5);
      ctx.globalAlpha = 1;
    } else if (e.typ === 'konfetti') {
      ctx.save();
      ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
      ctx.translate(e.x, e.y);
      ctx.rotate(e.obrot);
      ctx.fillStyle = e.kolor;
      ctx.fillRect(-e.rozm / 2, -e.rozm / 4, e.rozm, e.rozm / 2);
      ctx.restore();
    } else {
      ctx.globalAlpha = 1 - f;
      kolo(e.x, e.y, e.rozm, '#d9c49a');
      ctx.globalAlpha = 1;
    }
  }
}

function rysujBaner() {
  if (!baner) return;
  const b = baner;
  const fs = L.fs;
  const wejscie = Math.min(1, b.t / 0.18);
  let skala = 0.6 + 0.4 * (1 - Math.pow(1 - wejscie, 3)) + (b.duzy ? 0.05 * Math.sin(b.t * 8) : 0);
  const alfa = ogranicz((b.dlugosc - b.t) / 0.25, 0, 1);
  const r1 = fs * (b.duzy ? 2.8 : 2.0);
  const r2 = fs;
  ctx.font = czcionka(r1, true);
  const w1 = ctx.measureText(b.tekst).width;
  ctx.font = czcionka(r2, true);
  const w2 = b.podtekst ? ctx.measureText(b.podtekst).width : 0;
  const bw = Math.max(w1, w2) + fs * 3;
  const bh = r1 * 1.5 + (b.podtekst ? r2 * 1.7 : 0);
  skala *= Math.min(1, (L.W - 20) / bw);          // długi napis musi się zmieścić
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(L.tx, b.y ?? L.ty);
  ctx.scale(skala, skala);
  sciezkaZaokraglona(-bw / 2, -bh / 2, bw, bh, 16);
  ctx.fillStyle = 'rgba(12, 10, 34, 0.84)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = b.kolor;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = czcionka(r1, true);
  tekstZObwodka(b.tekst, 0, b.podtekst ? -bh / 2 + r1 * 0.85 : 0, b.kolor, 6);
  if (b.podtekst) {
    ctx.font = czcionka(r2, true);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(b.podtekst, 0, bh / 2 - r2 * 1.05);
  }
  ctx.restore();
}


// =====================================================
//   RYSOWANIE – tablica z kredą (na szerokim ekranie)
// =====================================================
function kredowaLinia(x1, y1, x2, y2, kolor = KOLOR_KREDY) {
  ctx.strokeStyle = kolor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  linia(x1, y1, x2, y2);
}

function rysujTablice() {
  const T = L.tablica;
  if (!T) return;
  // drewniana rama
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 18 * L.dpr;
  ctx.shadowOffsetY = 8 * L.dpr;
  sciezkaZaokraglona(T.x - 12, T.y - 12, T.w + 24, T.h + 24, 10);
  ctx.fillStyle = '#6e4325';
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;
  sciezkaZaokraglona(T.x - 12, T.y - 12, T.w + 24, T.h + 24, 10);
  ctx.stroke();
  // zielona tablica
  const gr = ctx.createLinearGradient(T.x, T.y, T.x + T.w, T.y + T.h);
  gr.addColorStop(0, '#26382f');
  gr.addColorStop(1, '#18241e');
  ctx.fillStyle = gr;
  ctx.fillRect(T.x, T.y, T.w, T.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (const [a, b, c, d] of SMUGI) {
    ctx.beginPath();
    ctx.ellipse(T.x + a * T.w, T.y + b * T.h, c * T.w, d * T.h, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // kawałek kredy na ramie
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(T.x + T.w * 0.66, T.y + T.h + 3, T.w * 0.12, 5);

  const fk = ogranicz(T.w / 12, 12, 22);
  const srodekX = T.x + T.w / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = KOLOR_KREDY;
  if (stan === 'start' || !gracze.length) {
    ctx.font = kreda(fk * 1.8, true);
    ctx.fillText('Dart', srodekX, T.y + T.h * 0.36);
    ctx.font = kreda(fk);
    ctx.fillText('Kto wygra?', srodekX, T.y + T.h * 0.52);
    return;
  }

  ctx.font = kreda(fk * 1.1, true);
  ctx.fillText(nazwaTrybu(trybGry), srodekX, T.y + fk * 1.3);
  kredowaLinia(T.x + T.w * 0.12, T.y + fk * 2.4, T.x + T.w * 0.88, T.y + fk * 2.4);
  const kol = gracze.length;
  const cw = T.w / kol;
  const gora = T.y + fk * 3.5;
  for (let j = 0; j < kol; j++) {
    const g = gracze[j];
    const cx = T.x + cw * (j + 0.5);
    ctx.font = kreda(fk, true);
    ctx.fillStyle = g.kolor;
    ctx.fillText(przytnij(g.imie, cw - 10), cx, gora);
    if (kol > 1 && j === ktory && stan === 'gra') kredowaLinia(cx - cw * 0.3, gora + fk * 0.75, cx + cw * 0.3, gora + fk * 0.75, g.kolor);
    ctx.fillStyle = KOLOR_KREDY;

    if (dookola()) {
      rysujSiatkeDookola(g, cx, gora + fk * 1.6, cw, fk);
      continue;
    }
    // Jak na prawdziwej tablicy: po każdej kolejce skreślamy stary wynik i piszemy, ile zostało
    const wartosci = [Number(trybGry), ...g.historia.map((h) => h.po)];
    const wiersze = wartosci.map((v, i) => ({
      tekst: String(v) + (i > 0 && g.historia[i - 1].zaDuzo ? ' ✗' : ''),
      skreslony: i < wartosci.length - 1,
    }));
    const h = fk * 1.3;
    const dolY = T.y + T.h - fk * 0.6;
    const ile = Math.max(1, Math.floor((dolY - (gora + fk * 1.0)) / h));
    const widoczne = wiersze.slice(-ile);
    ctx.font = kreda(fk * 0.95);
    widoczne.forEach((w, i) => {
      const y = gora + fk * 1.6 + i * h;
      ctx.globalAlpha = w.skreslony ? 0.5 : 1;
      ctx.fillStyle = KOLOR_KREDY;
      ctx.fillText(w.tekst, cx, y);
      if (w.skreslony) {
        const sz = ctx.measureText(w.tekst).width;
        kredowaLinia(cx - sz / 2 - 3, y + 2, cx + sz / 2 + 3, y - 2);
      }
      ctx.globalAlpha = 1;
    });
  }
  if (kol > 1) kredowaLinia(srodekX, gora - fk * 0.7, srodekX, T.y + T.h - fk * 0.5);
}


// =====================================================
//   RYSOWANIE – górny pasek
// =====================================================
// Dookoła tarczy: liczby od 1 do 20 i środek – zaliczone są skreślone
function rysujSiatkeDookola(g, cx, gora, cw, fk) {
  const kolumny = 3;
  const kw = Math.min((cw * 0.85) / kolumny, fk * 2.3);
  const kh = fk * 1.3;
  for (let k = 1; k <= 21; k++) {
    const i = k - 1;
    const x = cx + ((i % kolumny) - (kolumny - 1) / 2) * kw;
    const y = gora + Math.floor(i / kolumny) * kh;
    const tekst = k <= 20 ? String(k) : 'Ś';
    const zaliczony = k < g.cel;
    const teraz = k === g.cel;
    ctx.globalAlpha = zaliczony ? 0.4 : 1;
    ctx.font = kreda(fk * (teraz ? 1.1 : 0.9), teraz);
    ctx.fillStyle = teraz ? '#ffd23f' : KOLOR_KREDY;
    ctx.fillText(tekst, x, y);
    if (zaliczony) {
      const sz = ctx.measureText(tekst).width;
      kredowaLinia(x - sz / 2 - 3, y + 3, x + sz / 2 + 3, y - 3);
    }
    ctx.globalAlpha = 1;
  }
}

function tekstWyniku(g, dlugi) {
  if (dookola()) return g.cel > 21 ? '✓ Koniec' : `Cel: ${nazwaCelu(g.cel)}`;
  return dlugi ? `Zostało: ${g.wynik}` : String(g.wynik);
}

function rysujPasek() {
  const { W, hudH, hudX, hudW, fs } = L;
  const tlo = ctx.createLinearGradient(0, 0, 0, hudH);
  tlo.addColorStop(0, '#16143a');
  tlo.addColorStop(1, '#0e0d28');
  ctx.fillStyle = tlo;
  ctx.fillRect(0, 0, W, hudH);
  ctx.fillStyle = 'rgba(180, 160, 255, 0.25)';
  ctx.fillRect(0, hudH - 1, W, 1);
  ctx.textBaseline = 'middle';

  // ikona pauzy po prawej
  const prawy = hudX + hudW - 14;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillRect(prawy - 12, hudH / 2 - 8, 4, 16);
  ctx.fillRect(prawy - 4, hudH / 2 - 8, 4, 16);
  const koniecMiejsca = prawy - 24;
  const poczatek = hudX + 10;

  if (stan === 'start' || !gracze.length) {
    ctx.textAlign = 'center';
    ctx.font = czcionka(fs * 1.3, true);
    ctx.fillStyle = KOLOR_GRY;
    ctx.fillText('Dart', W / 2, hudH / 2);
    return;
  }

  const opisRundy = `Runda ${runda}`;
  const drugi = nazwaTrybu(trybGry) + (!dookola() && USTAWIENIA.koncowkaNaPodwojnym ? ' · koniec na podwójnym' : '') +
    (wyciszone ? ' · bez dźwięku (M)' : '');

  if (gracze.length === 1) {
    const g = gracze[0];
    ctx.textAlign = 'right';
    dopasujCzcionke(tekstWyniku(g, true), fs * 1.4, true, (koniecMiejsca - poczatek) * 0.5);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(tekstWyniku(g, true), koniecMiejsca, hudH / 2);
    const szerLewej = (koniecMiejsca - poczatek) * 0.48;
    ctx.textAlign = 'left';
    dopasujCzcionke(opisRundy, fs * 1.05, true, szerLewej);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(opisRundy, poczatek + 6, hudH * 0.36);
    dopasujCzcionke(drugi, fs * 0.75, false, szerLewej);
    ctx.fillStyle = '#9b93cf';
    ctx.fillText(drugi, poczatek + 6, hudH * 0.7);
    return;
  }

  // Dwóch graczy: dwa okienka, a to, kto teraz rzuca, świeci
  const bw = Math.min(240, (koniecMiejsca - poczatek - 100) / 2);
  const by = 7;
  const bh = hudH - 14;
  for (let j = 0; j < 2; j++) {
    const g = gracze[j];
    const bx = j === 0 ? poczatek : koniecMiejsca - bw;
    const aktywny = j === ktory && stan !== 'koniec';
    sciezkaZaokraglona(bx, by, bw, bh, 10);
    ctx.fillStyle = aktywny ? hexAlfa(g.kolor, 0.22) : 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.lineWidth = aktywny ? 2.5 : 1;
    ctx.strokeStyle = aktywny ? g.kolor : 'rgba(180, 160, 255, 0.25)';
    ctx.stroke();
    kolo(bx + 13, by + bh * 0.3, 4.5, g.kolor);
    ctx.textAlign = 'left';
    ctx.font = czcionka(fs * 0.8, true);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(przytnij(g.imie, bw - 30), bx + 23, by + bh * 0.3);
    dopasujCzcionke(tekstWyniku(g, false), fs * 1.15, true, bw - 20);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(tekstWyniku(g, false), bx + 10, by + bh * 0.72);
  }
  const miejsce = koniecMiejsca - poczatek - 2 * bw - 12;
  if (miejsce > 50) {
    const sx = (poczatek + koniecMiejsca) / 2;
    ctx.textAlign = 'center';
    dopasujCzcionke(opisRundy, fs * 0.95, true, miejsce);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(opisRundy, sx, hudH * 0.36);
    dopasujCzcionke(drugi, fs * 0.72, false, miejsce);
    ctx.fillStyle = '#9b93cf';
    ctx.fillText(drugi, sx, hudH * 0.7);
  }
}


// =====================================================
//   RYSOWANIE – okienka (start, pauza, koniec)
// =====================================================
function elementMenu(fs) {
  return { przycisk: 'menu', tekst: '← Menu gier (Q)', rozmiar: fs * 0.9 };
}

// Przycisk w kształcie pigułki – zapamiętujemy, gdzie jest, żeby dało się go kliknąć
function rysujPigulke(x, y, w, h, tekst, wybrany, akcja) {
  sciezkaZaokraglona(x, y, w, h, h / 2);
  ctx.fillStyle = wybrany ? KOLOR_GRY : 'rgba(180, 160, 255, 0.14)';
  ctx.fill();
  ctx.lineWidth = wybrany ? 2.5 : 1.5;
  ctx.strokeStyle = wybrany ? '#e2ffb0' : 'rgba(180, 160, 255, 0.5)';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = wybrany ? '#16143a' : '#e4ddff';
  ctx.fillText(tekst, x + w / 2, y + h / 2 + 1);
  if (akcja) przyciski.push({ x, y, w, h, akcja });
}

// Okienko na środku. Elementy: { tekst }, { odstep }, { przycisk }, { przyciski: [...] }
function rysujOkienko(elementy, zmniejszone = false) {
  const szer = Math.min(L.W - 24, 540);
  const wewn = szer - 40;
  const wiersze = [];
  let wys = 0;
  for (const el of elementy) {
    if (el.odstep) {
      wiersze.push({ odstep: el.odstep });
      wys += el.odstep;
      continue;
    }
    if (el.przyciski) {
      // rząd przycisków – jak się nie mieszczą, idą do następnej linijki
      ctx.font = czcionka(el.rozmiar, true);
      const bh = el.rozmiar * 2.2;
      const gap = el.rozmiar * 0.6;
      const linie = [];
      let rzad = [];
      let sz = 0;
      for (const p of el.przyciski) {
        const w = ctx.measureText(p.tekst).width + el.rozmiar * 2;
        if (rzad.length && sz + gap + w > wewn) {
          linie.push({ rzad, sz });
          rzad = [];
          sz = 0;
        }
        sz += (rzad.length ? gap : 0) + w;
        rzad.push({ ...p, w });
      }
      if (rzad.length) linie.push({ rzad, sz });
      const h = linie.length * (bh + gap);
      wiersze.push({ ...el, linie, bh, gap, h });
      wys += h;
      continue;
    }
    if (el.przycisk) {
      const h = el.rozmiar * 2.7;
      wiersze.push({ ...el, h });
      wys += h;
      continue;
    }
    ctx.font = czcionka(el.rozmiar, el.gruba);
    for (const t of zawijajTekst(el.tekst, wewn)) {
      const h = el.rozmiar * 1.38;
      wiersze.push({ ...el, tekst: t, h });
      wys += h;
    }
  }

  // Okienko nie mieści się na ekranie? Zmniejszamy wszystko.
  const dostepne = L.H - L.hudH - 16;
  if (wys + 44 > dostepne && !zmniejszone) {
    const k = Math.max(0.5, (dostepne - 44) / wys);
    rysujOkienko(elementy.map((el) => ({
      ...el,
      rozmiar: el.rozmiar && el.rozmiar * k,
      odstep: el.odstep && el.odstep * k,
    })), true);
    return;
  }

  ctx.fillStyle = 'rgba(5, 6, 18, 0.62)';
  ctx.fillRect(0, L.hudH, L.W, L.H - L.hudH);
  const panelH = wys + 44;
  const x = (L.W - szer) / 2;
  const y = Math.max(L.hudH + 8, L.hudH + (L.H - L.hudH - panelH) / 2);
  okienko = { x, y, w: szer, h: panelH };   // zapamiętujemy, gdzie jest okienko
  ctx.save();
  ctx.shadowColor = 'rgba(140, 100, 255, 0.45)';
  ctx.shadowBlur = 30 * L.dpr;
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
  let yy = y + 22;
  for (const w of wiersze) {
    if (w.odstep) {
      yy += w.odstep;
      continue;
    }
    ctx.globalAlpha = w.alfa ?? 1;
    if (w.linie) {
      ctx.font = czcionka(w.rozmiar, true);
      let ly = yy + w.gap / 2;
      for (const { rzad, sz } of w.linie) {
        let bx = L.W / 2 - sz / 2;
        for (const p of rzad) {
          rysujPigulke(bx, ly, p.w, w.bh, p.tekst, p.wybrany, p.akcja);
          bx += p.w + w.gap;
        }
        ly += w.bh + w.gap;
      }
    } else if (w.przycisk) {
      ctx.font = czcionka(w.rozmiar, true);
      const bw = ctx.measureText(w.tekst).width + w.rozmiar * 2.4;
      const bh = w.rozmiar * 2;
      rysujPigulke(L.W / 2 - bw / 2, yy + (w.h - bh) / 2, bw, bh, w.tekst, !!w.glowny, w.przycisk);
    } else {
      ctx.font = czcionka(w.rozmiar, w.gruba);
      ctx.textAlign = 'center';
      ctx.fillStyle = w.kolor || '#e8e6ff';
      ctx.fillText(w.tekst, L.W / 2, yy + w.h / 2);
    }
    ctx.globalAlpha = 1;
    yy += w.h;
  }
}

function opisTrybu(t) {
  if (t === 'dookola') return 'Traf po kolei w 1, 2, 3… aż do 20, a na koniec w środek!';
  return `Zaczynasz od ${t} i odejmujesz to, co trafisz. Zejdź dokładnie do zera!`;
}

function opisKonca(t) {
  if (t === 'dookola') {
    return USTAWIENIA.podwojneSkacza ? 'Podwójne przeskakuje o 2 liczby, a potrójne o 3!' : 'Każda liczba po kolei.';
  }
  return USTAWIENIA.koncowkaNaPodwojnym
    ? 'Ostatnia lotka musi trafić w podwójne (wąski pierścień na brzegu) albo w sam środek.'
    : 'Możesz skończyć dowolnym polem.';
}

function opisCelowania() {
  return USTAWIENIA.sposobCelowania === 'kolko'
    ? 'Trzymaj spokojnie, aż kółko będzie małe i zielone. Puść!'
    : 'Puść, a lotka poleci tam, gdzie jest celownik!';
}

function tekstRekordu(t) {
  const r = rekordy[t];
  return `Rekord: ${r} ${slowoLotek(r)} (mniej = lepiej)`;
}

// Wielkość napisów w okienkach – na wąskim telefonie trochę większa, żeby łatwo trafić palcem w przycisk
function rozmiarOkna() {
  return ogranicz(Math.min(L.W / 24, L.H / 30), 12, 20);
}

// Przyciski wyboru gry (501, 301, Dookoła tarczy) i liczby graczy – są na starcie, w pauzie i na końcu
function przyciskiTrybow(rozmiar) {
  return { przyciski: TRYBY.map((t) => ({ tekst: nazwaTrybu(t), akcja: 'tryb:' + t, wybrany: tryb === t })), rozmiar };
}

function przyciskiGraczy(rozmiar) {
  return {
    przyciski: [
      { tekst: '1 gracz', akcja: 'gracze:1', wybrany: ileGraczy === 1 },
      { tekst: '2 graczy', akcja: 'gracze:2', wybrany: ileGraczy === 2 },
    ],
    rozmiar,
  };
}

function rysujEkranStartowy() {
  const fs = rozmiarOkna();
  const r = rekordy[tryb];
  rysujOkienko([
    { tekst: 'Dart', rozmiar: fs * 2.3, gruba: true, kolor: KOLOR_GRY },
    { tekst: 'Złap lotkę i pociągnij w górę – pojawi się celownik.', rozmiar: fs * 1.05, gruba: true, kolor: '#ffd23f' },
    { tekst: opisCelowania(), rozmiar: fs * 0.9, kolor: '#cfc8ff' },
    { tekst: 'Klawiatura: ← → ręka, trzymaj SPACJĘ i puść', rozmiar: fs * 0.8, kolor: '#a9a3d9' },
    { odstep: fs * 0.7 },
    przyciskiTrybow(fs * 1.1),
    { tekst: opisTrybu(tryb), rozmiar: fs * 0.88, kolor: '#cfc8ff' },
    { tekst: opisKonca(tryb), rozmiar: fs * 0.88, gruba: true, kolor: '#4cc9f0' },
    r > 0
      ? { tekst: tekstRekordu(tryb), rozmiar: fs * 0.88, gruba: true, kolor: '#3ddc97' }
      : { tekst: 'W tej grze nie masz jeszcze rekordu', rozmiar: fs * 0.82, kolor: '#a9a3d9' },
    { odstep: fs * 0.5 },
    przyciskiGraczy(fs),
    { tekst: '← → wybiera grę · 1 i 2 – ilu graczy', rozmiar: fs * 0.72, kolor: '#8a83c2' },
    { odstep: fs * 0.5 },
    { przycisk: 'graj', tekst: 'Graj!', rozmiar: fs * 1.3, glowny: true },
    { tekst: 'albo naciśnij SPACJĘ', rozmiar: fs * 0.8, kolor: '#ffffff', alfa: migotanie() },
    { odstep: fs * 0.3 },
    elementMenu(fs),
  ]);
}

function rysujPauze() {
  const fs = rozmiarOkna();
  rysujOkienko([
    { tekst: 'Pauza', rozmiar: fs * 2.1, gruba: true, kolor: '#4cc9f0' },
    { odstep: fs * 0.6 },
    { przycisk: 'dalej', tekst: 'Graj dalej', rozmiar: fs * 1.15, glowny: true },
    { tekst: 'albo naciśnij SPACJĘ', rozmiar: fs * 0.8, kolor: '#ffffff', alfa: migotanie() },
    { odstep: fs * 0.7 },
    { tekst: 'Albo zacznij nową grę:', rozmiar: fs * 0.95, gruba: true, kolor: '#ffd23f' },
    przyciskiTrybow(fs),
    przyciskiGraczy(fs * 0.9),
    { przycisk: 'graj', tekst: `Nowa gra: ${nazwaTrybu(tryb)} ▶`, rozmiar: fs * 1.05 },
    { tekst: '← → wybiera grę · 1 i 2 – ilu graczy · N – nowa gra', rozmiar: fs * 0.72, kolor: '#8a83c2' },
    { odstep: fs * 0.4 },
    { tekst: 'M – wycisz / włącz dźwięk', rozmiar: fs * 0.8, kolor: '#a9a3d9' },
    elementMenu(fs),
  ]);
}

function wynikKoncowy(g) {
  if (dookola()) return g.cel > 21 ? `cała tarcza! (${g.lotki} ${slowoLotek(g.lotki)})` : `doszedł do: ${nazwaCelu(g.cel)}`;
  return g.wynik === 0 ? `zero! (${g.lotki} ${slowoLotek(g.lotki)})` : `zostało ${g.wynik}`;
}

// Średnia kolejka (3 lotki) – tak liczą zawodowcy
function sredniaKolejka(g) {
  const zdobyte = Number(trybGry) - g.wynik;
  return g.lotki > 0 ? Math.round((zdobyte / g.lotki) * USTAWIENIA.lotekWKolejce) : 0;
}

function rysujKoniec() {
  const fs = rozmiarOkna();
  const el = [];
  if (gracze.length > 1) {
    el.push({ tekst: `Wygrywa ${zwyciezca.imie}!`, rozmiar: fs * 1.9, gruba: true, kolor: zwyciezca.kolor });
    el.push({ tekst: `Gra: ${nazwaTrybu(trybGry)}`, rozmiar: fs * 0.85, kolor: '#a9a3d9' });
    el.push({ odstep: fs * 0.4 });
    for (const g of gracze) el.push({ tekst: `${g.imie}: ${wynikKoncowy(g)}`, rozmiar: fs * 1.15, gruba: true, kolor: g.kolor });
  } else {
    const g = gracze[0];
    el.push({ tekst: dookola() ? 'Cała tarcza!' : 'Zero! Udało się!', rozmiar: fs * 1.9, gruba: true, kolor: KOLOR_GRY });
    el.push({ tekst: `Gra: ${nazwaTrybu(trybGry)}`, rozmiar: fs * 0.85, kolor: '#a9a3d9' });
    el.push({ odstep: fs * 0.4 });
    el.push({ tekst: `Rzuciłeś ${g.lotki} ${slowoLotek(g.lotki)}`, rozmiar: fs * 1.6, gruba: true, kolor: '#ffd23f' });
  }
  if (nowyRekord) {
    const kto = gracze.length > 1 && nowyRekord.gracz ? ` – ${nowyRekord.gracz.imie}` : '';
    el.push({ tekst: `Nowy rekord!${kto}`, rozmiar: fs * 1.2, gruba: true, kolor: '#3ddc97' });
  } else if (rekordy[trybGry] > 0) {
    el.push({ tekst: tekstRekordu(trybGry), rozmiar: fs, kolor: '#a9a3d9' });
  }
  if (dookola()) {
    if (gracze.length === 1) {
      const g = gracze[0];
      el.push({ tekst: `Potrójne: ${g.potrojne} · W środek: ${g.srodki}`, rozmiar: fs * 0.9, kolor: '#cfc8ff' });
    }
  } else if (gracze.length === 1) {
    const g = gracze[0];
    el.push({
      tekst: `Średnia kolejka: ${sredniaKolejka(g)} · Najlepsza: ${g.najlepszaKolejka} · Potrójne: ${g.potrojne} · W środek: ${g.srodki}`,
      rozmiar: fs * 0.9, kolor: '#cfc8ff',
    });
  } else {
    for (const g of gracze) {
      el.push({ tekst: `${g.imie} – średnia kolejka: ${sredniaKolejka(g)}, najlepsza: ${g.najlepszaKolejka}`, rozmiar: fs * 0.8, kolor: '#cfc8ff' });
    }
  }
  el.push({ odstep: fs * 0.7 });
  // Od razu wybierasz, w co gracie dalej
  el.push({ tekst: 'W co gramy teraz?', rozmiar: fs * 0.95, gruba: true, kolor: '#ffd23f' });
  el.push(przyciskiTrybow(fs));
  el.push(przyciskiGraczy(fs * 0.9));
  el.push({
    przycisk: 'znowu',
    tekst: `Graj: ${nazwaTrybu(tryb)} ▶`,
    rozmiar: fs * 1.2,
    glowny: true,
    alfa: czas - koniecOd > 0.8 ? 1 : 0.5,
  });
  el.push({ tekst: 'SPACJA – graj · ← → wybiera grę · 1 i 2 – ilu graczy', rozmiar: fs * 0.72, kolor: '#8a83c2' });
  el.push({ odstep: fs * 0.3 });
  el.push(elementMenu(fs));
  rysujOkienko(el);
}


// =====================================================
//   RYSUJEMY WSZYSTKO
// =====================================================
function rysuj() {
  przyciski = [];   // przyciski istnieją tylko wtedy, gdy narysuje je okienko
  okienko = null;
  ctx.drawImage(plotnoTla, 0, 0, L.W, L.H);
  rysujTablice();
  const dx = drzenieTarczy * Math.sin(czas * 70) * L.R * 0.008;   // tarcza drży po trafieniu
  rysujTarcze(dx);
  rysujPodswietlenie(dx);
  rysujLinke();
  rysujLotkiNaTarczy(dx);
  rysujDol();
  rysujSpadajace();
  rysujLot();
  rysujLotkeWRece();
  rysujPodpowiedz();
  rysujEfekty();
  rysujBaner();
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
  const dt = ogranicz((teraz - poprzedniaKlatka) / 1000, 0, 0.05);
  poprzedniaKlatka = teraz;
  czas += dt;
  if (stan === 'gra') aktualizujGre(dt);
  if (stan !== 'pauza') {
    aktualizujEfekty(dt);
    aktualizujSpadajace(dt);
  }
  rysuj();
  requestAnimationFrame(petla);
}

dopasujRozmiar();
requestAnimationFrame(petla);
