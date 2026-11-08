'use strict';

// =====================================================
//   WYŚCIGI – gra samochodowa
//   Pomysł: Seweryn
// =====================================================
//
//  Zasady:
//   - Jedziesz czerwonym autem po drodze z trzema pasami.
//   - Przed tobą jadą inne auta – omijaj je, zmieniając pas.
//   - Każde wyprzedzone auto = 1 punkt.
//   - Zderzenie = minus 1 życie. Masz 3 życia.
//   - Co 10 punktów nowy poziom – jedziesz coraz szybciej!


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  zycia: 3,                       // ile żyć na start
  pasy: 3,                        // ile pasów ma droga (spróbuj 4!)
  punktyNaPoziom: 10,             // co ile punktów nowy poziom
  predkoscNaStart: 1.0,           // prędkość na poziomie 1
  wzrostPredkosciNaPoziom: 0.1,   // o ile rośnie prędkość na każdym nowym poziomie
  predkoscNajwieksza: 2.5,        // szybciej już nie będzie
  kmhNaStart: 100,                // ile km/h pokazuje licznik przy prędkości 1
  odstepAut: 1.3,                 // co ile sekund pojawia się nowy rząd aut (przy prędkości 1)
  szansaDwochAutNaStart: 0.25,    // jak często w rzędzie jadą 2 auta obok siebie (0.25 = co czwarty rząd)
  wzrostSzansyDwochAut: 0.05,     // ...i o ile ta szansa rośnie na każdym poziomie
  czasOchrony: 1.5,               // ile sekund po zderzeniu twoje auto miga i nic mu nie grozi
};

const KOLOR_GRACZA = '#e63946';
const KOLORY_AUT = ['#4cc9f0', '#ffd23f', '#3ddc97', '#c77dff', '#ff9f1c', '#f1f1f1', '#6c8cff', '#2ec4b6'];

const RUCH_AUT = 0.42;    // jak szybko zbliżają się inne auta (ekranów na sekundę przy prędkości 1)
const RUCH_ZIEMI = 1.1;   // jak szybko przesuwa się droga i drzewa
const ZMIANA_PASA = 11;   // ile pasów na sekundę przejeżdża auto przy zmianie pasa


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

let stan = 'start';            // 'start' | 'odliczanie' | 'gra' | 'pauza' | 'koniec'
let punkty = 0;
let zycia = USTAWIENIA.zycia;
let poziom = 1;
let rekord = wczytajRekord();
let nowyRekord = false;

let auta = [];                 // inne auta: { pas, poz, kolor, policzone }
let efekty = [];               // dym, iskry, napisy...
let drzewa = [];               // drzewa i krzaki na trawie
let pasGracza = Math.floor(USTAWIENIA.pasy / 2);   // na który pas jedziesz (0 = lewy)
let xGracza = pasGracza;       // gdzie twoje auto jest teraz (płynnie dojeżdża do swojego pasa)
let licznikRzedu = 0;          // odlicza czas do następnego rzędu aut
let przesuniecie = 0;          // jak daleko przesunęła się droga (do rysowania pasów)
let ochrona = 0;               // ile sekund jeszcze nic ci nie grozi po zderzeniu
let odliczanie = 0;            // 3, 2, 1, START!
let ostatniaCyfra = 0;

let czas = 0;
let koniecOd = 0;
let napisPoziomu = 0;
let trzesienie = 0;
let wyciszone = false;

const L = {};                  // rozmiary ekranu


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

  L.hudH = 60;                                  // górny pasek
  L.hudW = Math.min(L.W, 760);
  L.hudX = (L.W - L.hudW) / 2;
  L.roadW = Math.min(L.W - 24, 460);            // szerokość drogi
  L.roadX = (L.W - L.roadW) / 2;                // gdzie zaczyna się droga
  L.laneW = L.roadW / USTAWIENIA.pasy;          // szerokość jednego pasa
  L.carH = Math.min(L.laneW * 0.56 * 1.85, (L.H - L.hudH) * 0.15);  // długość auta
  L.carW = L.carH / 1.85;                       // szerokość auta
  L.playerY = L.H - L.carH - Math.max(16, L.H * 0.05);              // gdzie jedzie twoje auto
  L.fs = ogranicz(Math.min(L.roadW / 24, L.H / 32), 11, 20);         // wielkość napisów

  przygotujDrzewa();
}


// =====================================================
//   DŹWIĘK
// =====================================================
let audio = null;
let wzmacniacz = null;
let silnik = null;

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

// Huk przy zderzeniu – to „szum”, czyli losowe drgania
function dzwiekZderzenia() {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime;
  const dlugosc = 0.5;
  const bufor = audio.createBuffer(1, Math.floor(audio.sampleRate * dlugosc), audio.sampleRate);
  const dane = bufor.getChannelData(0);
  for (let i = 0; i < dane.length; i++) dane[i] = (Math.random() * 2 - 1) * (1 - i / dane.length);
  const zrodlo = audio.createBufferSource();
  zrodlo.buffer = bufor;
  const filtr = audio.createBiquadFilter();
  filtr.type = 'lowpass';
  filtr.frequency.value = 900;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dlugosc);
  zrodlo.connect(filtr);
  filtr.connect(g);
  g.connect(wzmacniacz);
  zrodlo.start(t);
  pisk(110, 0.35, 'sawtooth', 0.15);
}

function dzwiekPoziomu() {
  [523, 659, 784, 1046].forEach((f, i) => pisk(f, 0.12, 'square', 0.07, i * 0.08));
}

function dzwiekKonca() {
  [392, 330, 262, 196].forEach((f, i) => pisk(f, 0.3, 'triangle', 0.18, 0.2 + i * 0.25));
}

// Warkot silnika: im szybciej jedziesz, tym wyżej brzmi
function aktualizujSilnik() {
  if (!audio) return;
  if (!silnik) {
    const osc = audio.createOscillator();
    osc.type = 'sawtooth';
    const filtr = audio.createBiquadFilter();
    filtr.type = 'lowpass';
    filtr.frequency.value = 320;
    const g = audio.createGain();
    g.gain.value = 0;
    osc.connect(filtr);
    filtr.connect(g);
    g.connect(wzmacniacz);
    osc.start();
    silnik = { osc, g, glosnosc: -1, ton: -1 };
  }
  const glosnosc = stan === 'gra' && !wyciszone ? 0.07 : 0;
  const ton = Math.round(45 + 28 * predkosc() + Math.abs(pasGracza - xGracza) * 15);
  if (glosnosc !== silnik.glosnosc) {
    silnik.g.gain.setTargetAtTime(glosnosc, audio.currentTime, 0.08);
    silnik.glosnosc = glosnosc;
  }
  if (ton !== silnik.ton) {
    silnik.osc.frequency.setTargetAtTime(ton, audio.currentTime, 0.15);
    silnik.ton = ton;
  }
}


// =====================================================
//   REKORD (zapamiętywany w przeglądarce)
// =====================================================
function wczytajRekord() {
  try {
    return parseInt(localStorage.getItem('wyscigi-rekord'), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(wynik) {
  try {
    localStorage.setItem('wyscigi-rekord', String(wynik));
  } catch (e) {
    // nic się nie stało – rekord po prostu nie zostanie zapamiętany
  }
}


// =====================================================
//   PRZEBIEG GRY
// =====================================================

// Prędkość na obecnym poziomie: 1,0 → 1,1 → 1,2 → ...
function predkosc() {
  return Math.min(
    USTAWIENIA.predkoscNajwieksza,
    USTAWIENIA.predkoscNaStart + (poziom - 1) * USTAWIENIA.wzrostPredkosciNaPoziom
  );
}

function kmh() {
  return Math.round(USTAWIENIA.kmhNaStart * predkosc());
}

function szansaDwochAut() {
  return Math.min(0.65, USTAWIENIA.szansaDwochAutNaStart + (poziom - 1) * USTAWIENIA.wzrostSzansyDwochAut);
}

function nowaGra() {
  przygotujDzwiek();
  punkty = 0;
  zycia = USTAWIENIA.zycia;
  poziom = 1;
  nowyRekord = false;
  auta = [];
  efekty = [];
  ochrona = 0;
  napisPoziomu = 0;
  pasGracza = Math.floor(USTAWIENIA.pasy / 2);
  xGracza = pasGracza;
  licznikRzedu = 0.8;
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

// Mieszamy listę w losowej kolejności
function tasuj(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// Nowy rząd aut na górze ekranu: 1 albo 2 auta, ale zawsze zostaje wolny pas
function nowyRzad() {
  const pasy = tasuj([...Array(USTAWIENIA.pasy).keys()]);
  let ile = Math.random() < szansaDwochAut() ? 2 : 1;
  ile = Math.min(ile, USTAWIENIA.pasy - 1);
  for (let i = 0; i < ile; i++) {
    auta.push({
      pas: pasy[i],
      poz: -L.carH / L.H - 0.01,   // tuż nad ekranem
      kolor: KOLORY_AUT[Math.floor(Math.random() * KOLORY_AUT.length)],
      policzone: false,
    });
  }
}

function prostokatGracza() {
  return {
    x: L.roadX + (xGracza + 0.5) * L.laneW - L.carW / 2,
    y: L.playerY,
    w: L.carW,
    h: L.carH,
  };
}

function prostokatAuta(a) {
  return {
    x: L.roadX + (a.pas + 0.5) * L.laneW - L.carW / 2,
    y: a.poz * L.H,
    w: L.carW,
    h: L.carH,
  };
}

// Czy dwa auta na siebie najechały? (trochę wybaczamy na brzegach)
function zderzenie(a, b) {
  const mx = a.w * 0.14;
  const my = a.h * 0.08;
  return a.x + mx < b.x + b.w - mx && a.x + a.w - mx > b.x + mx &&
         a.y + my < b.y + b.h - my && a.y + a.h - my > b.y + my;
}

function aktualizujGre(dt) {
  const v = predkosc();

  // Twoje auto płynnie zjeżdża na wybrany pas
  const roznica = pasGracza - xGracza;
  const krok = ZMIANA_PASA * dt;
  xGracza = Math.abs(roznica) <= krok ? pasGracza : xGracza + Math.sign(roznica) * krok;

  // Czas na nowy rząd aut?
  licznikRzedu -= dt;
  if (licznikRzedu <= 0) {
    licznikRzedu += USTAWIENIA.odstepAut / v;
    nowyRzad();
  }

  // Inne auta zbliżają się
  for (const a of auta) a.poz += RUCH_AUT * v * dt;

  ochrona = Math.max(0, ochrona - dt);

  const g = prostokatGracza();
  for (let i = auta.length - 1; i >= 0; i--) {
    const a = auta[i];
    const p = prostokatAuta(a);

    // Auto zostało za tobą – wyprzedzone!
    if (!a.policzone && p.y > g.y + g.h) {
      a.policzone = true;
      punkt();
    }
    // Auto zniknęło na dole ekranu
    if (p.y > L.H) {
      auta.splice(i, 1);
      continue;
    }
    // Zderzenie!
    if (ochrona <= 0 && zderzenie(g, p)) {
      auta.splice(i, 1);
      kraksa(a, p, g);
      if (stan !== 'gra') return;
    }
  }
}

function punkt() {
  punkty++;
  pisk(1046, 0.06, 'sine', 0.05);
  const g = prostokatGracza();
  efekty.push({ typ: 'napis', tekst: '+1', x: g.x + g.w / 2, y: g.y - 10, kolor: '#ffd23f', t: 0, dlugosc: 0.7 });

  // Nowy poziom?
  const nowyPoziom = 1 + Math.floor(punkty / USTAWIENIA.punktyNaPoziom);
  if (nowyPoziom > poziom) {
    poziom = nowyPoziom;
    napisPoziomu = 1.8;
    dzwiekPoziomu();
  }
}

function kraksa(a, p, g) {
  zycia--;
  ochrona = USTAWIENIA.czasOchrony;
  trzesienie = 0.4;
  dzwiekZderzenia();

  // Miejsce zderzenia – pomiędzy autami
  const cx = (p.x + p.w / 2 + g.x + g.w / 2) / 2;
  const cy = (p.y + p.h + g.y) / 2;

  // Rozbite auto odlatuje w bok, kręcąc się
  const wBok = p.x + p.w / 2 < g.x + g.w / 2 ? -1 : 1;
  efekty.push({
    typ: 'rozbite', x: p.x, y: p.y, w: p.w, h: p.h, kolor: a.kolor,
    vx: wBok * (160 + Math.random() * 80), vy: -60, kat: 0, vk: wBok * 7, t: 0, dlugosc: 0.9,
  });
  for (let i = 0; i < 14; i++) {
    efekty.push({
      typ: 'dym', x: cx, y: cy,
      vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 120,
      r: 6 + Math.random() * 10, t: 0, dlugosc: 0.9 + Math.random() * 0.4,
    });
  }
  for (let i = 0; i < 12; i++) {
    efekty.push({
      typ: 'iskra', x: cx, y: cy,
      vx: (Math.random() - 0.5) * 420, vy: (Math.random() - 0.5) * 420,
      kolor: Math.random() < 0.5 ? '#ffd23f' : '#ff9f1c', t: 0, dlugosc: 0.5,
    });
  }
  efekty.push({ typ: 'napis', tekst: 'Bum!', x: cx, y: cy - 20, kolor: '#ff4d6d', t: 0, dlugosc: 0.9, duzy: true });

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

// Droga, pasy i drzewa przesuwają się w dół – wygląda to, jakbyś jechał do przodu
function przewinZiemie(dt, mnoznik) {
  const ile = RUCH_ZIEMI * mnoznik * L.H * dt;
  przesuniecie += ile;
  for (const d of drzewa) {
    d.y += ile;
    if (d.y - d.r > L.H) Object.assign(d, noweDrzewo(d.strona, d.y - L.H - 2 * d.r - 20));
  }
}

function aktualizujEfekty(dt) {
  for (const e of efekty) {
    e.t += dt;
    if (e.vx !== undefined) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    if (e.typ === 'rozbite') e.kat += e.vk * dt;
  }
  efekty = efekty.filter((e) => e.t < e.dlugosc);
  trzesienie = Math.max(0, trzesienie - dt);
  napisPoziomu = Math.max(0, napisPoziomu - dt);
}


// =====================================================
//   DRZEWA NA TRAWIE
// =====================================================
function noweDrzewo(strona, y) {
  const trawa = L.roadX;   // szerokość trawy z jednej strony drogi
  const r = ogranicz(trawa * 0.18, 10, 26) * (0.75 + Math.random() * 0.5);
  const odDrogi = 14 + r + Math.random() * Math.max(0, trawa - 28 - 2 * r);
  const x = strona < 0 ? L.roadX - odDrogi : L.roadX + L.roadW + odDrogi;
  return { strona, x, y, r, typ: Math.random() < 0.75 ? 'drzewo' : 'krzak' };
}

function przygotujDrzewa() {
  drzewa = [];
  if (L.roadX < 30) return;   // na wąskim ekranie (telefon) nie ma miejsca na drzewa
  const ile = Math.ceil(L.H / 90);
  for (const strona of [-1, 1]) {
    for (let i = 0; i < ile; i++) drzewa.push(noweDrzewo(strona, (i / ile) * L.H + Math.random() * 40));
  }
}


// =====================================================
//   STEROWANIE
// =====================================================
function wLewo() {
  if (stan === 'gra' || stan === 'odliczanie') pasGracza = Math.max(0, pasGracza - 1);
}

function wPrawo() {
  if (stan === 'gra' || stan === 'odliczanie') pasGracza = Math.min(USTAWIENIA.pasy - 1, pasGracza + 1);
}

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
  aktualizujSilnik();
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
  if (e.code === 'KeyQ' && stan !== 'gra' && stan !== 'odliczanie') {
    idzDoMenu();
    return;
  }
  if (e.repeat) return;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    e.preventDefault();
    wLewo();
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    e.preventDefault();
    wPrawo();
  }
});

// Myszka i dotyk: lewa połowa ekranu = w lewo, prawa połowa = w prawo
plotno.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  przygotujDzwiek();
  if (stan !== 'gra' && stan !== 'odliczanie') {
    if (wPrzyciskuMenu(e.clientX, e.clientY)) idzDoMenu();
    else akcjaGlowna();
    return;
  }
  if (e.clientY < L.hudH) {   // stuknięcie w górny pasek = pauza
    przelaczPauze();
    return;
  }
  if (e.clientX < L.W / 2) wLewo();
  else wPrawo();
});

plotno.addEventListener('contextmenu', (e) => e.preventDefault());

// Gdy przełączysz kartę albo okno – gra sama się pauzuje
function pauzaPrzyWyjsciu() {
  if (stan === 'gra') stan = 'pauza';
  aktualizujSilnik();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzaPrzyWyjsciu();
});
window.addEventListener('blur', pauzaPrzyWyjsciu);

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   RYSOWANIE – narzędzia
// =====================================================
function kolorAlfa(hex, alfa) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

function przyciemnij(hex, ile) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * ile);
  const g = Math.round(((n >> 8) & 255) * ile);
  const b = Math.round((n & 255) * ile);
  return `rgb(${r}, ${g}, ${b})`;
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

function kolo(x, y, r, kolor) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = kolor;
  ctx.fill();
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
//   RYSOWANIE – droga, drzewa, auta
// =====================================================
function rysujTrawe() {
  ctx.fillStyle = '#2f8f46';
  ctx.fillRect(-20, -20, L.W + 40, L.H + 40);
  // ciemniejsze pasy trawy też się przesuwają
  const pas = 70;
  const off = przesuniecie % (pas * 2);
  ctx.fillStyle = '#2a8240';
  for (let y = -pas * 2 + off; y < L.H + 20; y += pas * 2) ctx.fillRect(-20, y, L.W + 40, pas);
}

function rysujDroge() {
  const { roadX, roadW, laneW, H } = L;

  // pobocze i asfalt
  ctx.fillStyle = '#5b5f6a';
  ctx.fillRect(roadX - 10, -20, roadW + 20, H + 40);
  ctx.fillStyle = '#3a3d46';
  ctx.fillRect(roadX, -20, roadW, H + 40);

  // krawężniki w czerwono-białe paski
  const k = 28;
  const off = przesuniecie % (k * 2);
  for (let i = -2; i * k < H + k * 2; i++) {
    ctx.fillStyle = Math.abs(i) % 2 === 1 ? '#ffffff' : '#e63946';
    const y = i * k + off;
    ctx.fillRect(roadX - 10, y, 8, k);
    ctx.fillRect(roadX + roadW + 2, y, 8, k);
  }

  // białe linie przy krawędziach
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(roadX + 5, -20, 4, H + 40);
  ctx.fillRect(roadX + roadW - 9, -20, 4, H + 40);

  // przerywane linie między pasami
  const kreska = 34;
  const okres = kreska + 30;
  const off2 = przesuniecie % okres;
  for (let p = 1; p < USTAWIENIA.pasy; p++) {
    const x = roadX + p * laneW - 3;
    for (let y = -okres + off2; y < H; y += okres) ctx.fillRect(x, y, 6, kreska);
  }
}

function rysujDrzewa() {
  for (const d of drzewa) {
    kolo(d.x + d.r * 0.25, d.y + d.r * 0.3, d.r, 'rgba(0,0,0,0.22)');   // cień
    if (d.typ === 'drzewo') {
      kolo(d.x, d.y, d.r, '#1f6b35');
      kolo(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.62, '#2e8b4a');
      kolo(d.x - d.r * 0.4, d.y - d.r * 0.4, d.r * 0.25, '#45a862');
    } else {
      const r = d.r * 0.55;
      kolo(d.x - r * 0.7, d.y, r, '#3c9a52');
      kolo(d.x + r * 0.7, d.y, r, '#3c9a52');
      kolo(d.x, d.y - r * 0.6, r, '#4fb366');
      kolo(d.x + r * 0.3, d.y - r * 0.2, r * 0.25, '#ff8fa3');   // kwiatek
    }
  }
}

// Auto widziane z góry. Przód auta jest u góry.
function rysujAuto(x, y, w, h, kolor, gracz) {
  // cień
  sciezkaZaokraglona(x + 3, y + 5, w, h, w * 0.28);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  // koła
  ctx.fillStyle = '#15151c';
  const kw = w * 0.16;
  const kh = h * 0.17;
  for (const ky of [y + h * 0.14, y + h * 0.68]) {
    sciezkaZaokraglona(x - kw * 0.45, ky, kw, kh, 2);
    ctx.fill();
    sciezkaZaokraglona(x + w - kw * 0.55, ky, kw, kh, 2);
    ctx.fill();
  }

  // karoseria
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, przyciemnij(kolor, 0.72));
  g.addColorStop(0.5, kolor);
  g.addColorStop(1, przyciemnij(kolor, 0.72));
  sciezkaZaokraglona(x, y, w, h, w * 0.28);
  ctx.fillStyle = g;
  ctx.fill();

  // białe paski wyścigowe na twoim aucie
  if (gracz) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(x + w * 0.36, y + 2, w * 0.09, h - 4);
    ctx.fillRect(x + w * 0.55, y + 2, w * 0.09, h - 4);
  }

  // szyby
  ctx.fillStyle = '#1d2b4a';
  sciezkaZaokraglona(x + w * 0.13, y + h * 0.24, w * 0.74, h * 0.17, [w * 0.12, w * 0.12, 3, 3]);
  ctx.fill();
  sciezkaZaokraglona(x + w * 0.16, y + h * 0.7, w * 0.68, h * 0.11, [3, 3, w * 0.1, w * 0.1]);
  ctx.fill();

  // odblask na dachu
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.fillRect(x + w * 0.18, y + h * 0.44, w * 0.64, h * 0.23);

  // światła: przednie żółte, tylne czerwone
  ctx.fillStyle = '#fff6c2';
  ctx.fillRect(x + w * 0.12, y + h * 0.02, w * 0.2, h * 0.045);
  ctx.fillRect(x + w * 0.68, y + h * 0.02, w * 0.2, h * 0.045);
  ctx.fillStyle = '#ff2a3d';
  ctx.fillRect(x + w * 0.1, y + h * 0.935, w * 0.22, h * 0.045);
  ctx.fillRect(x + w * 0.68, y + h * 0.935, w * 0.22, h * 0.045);
}

function rysujAuta() {
  for (const a of auta) {
    const p = prostokatAuta(a);
    rysujAuto(p.x, p.y, p.w, p.h, a.kolor, false);
  }
}

function rysujGracza() {
  const g = prostokatGracza();
  // Po zderzeniu auto miga
  if (ochrona > 0 && Math.floor(czas * 12) % 2 === 0) ctx.globalAlpha = 0.35;
  // Przy zmianie pasa auto lekko się przechyla
  const kat = ogranicz(pasGracza - xGracza, -1, 1) * 0.2;
  ctx.save();
  ctx.translate(g.x + g.w / 2, g.y + g.h / 2);
  ctx.rotate(kat);
  rysujAuto(-g.w / 2, -g.h / 2, g.w, g.h, KOLOR_GRACZA, true);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function rysujEfekty() {
  for (const e of efekty) {
    const f = e.t / e.dlugosc; // od 0 do 1
    ctx.globalAlpha = Math.max(0, 1 - f);
    if (e.typ === 'dym') {
      kolo(e.x, e.y, e.r * (1 + f * 1.5), 'rgba(190,190,200,0.55)');
    } else if (e.typ === 'iskra') {
      ctx.fillStyle = e.kolor;
      ctx.fillRect(e.x - 3, e.y - 3, 6, 6);
    } else if (e.typ === 'rozbite') {
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      ctx.rotate(e.kat);
      rysujAuto(-e.w / 2, -e.h / 2, e.w, e.h, e.kolor, false);
      ctx.restore();
    } else if (e.typ === 'napis') {
      ctx.font = czcionka(L.fs * (e.duzy ? 2 : 1.3), true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeText(e.tekst, e.x, e.y - f * 40);
      ctx.fillStyle = e.kolor;
      ctx.fillText(e.tekst, e.x, e.y - f * 40);
    } else if (e.typ === 'start') {
      ctx.save();
      ctx.translate(L.W / 2, L.hudH + (L.playerY - L.hudH) * 0.45);
      ctx.scale(1 + f * 0.6, 1 + f * 0.6);
      ctx.font = czcionka(L.fs * 4, true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.strokeText('START!', 0, 0);
      ctx.fillStyle = '#3ddc97';
      ctx.fillText('START!', 0, 0);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function rysujOdliczanie() {
  if (stan !== 'odliczanie') return;
  const cyfra = Math.max(1, Math.ceil(odliczanie));
  const czesc = odliczanie - Math.floor(odliczanie);   // od 1 do 0 w każdej sekundzie
  const y = L.hudH + (L.playerY - L.hudH) * 0.45;
  ctx.save();
  ctx.translate(L.W / 2, y);
  ctx.scale(1 + czesc * 0.6, 1 + czesc * 0.6);
  ctx.font = czcionka(L.fs * 5, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeText(String(cyfra), 0, 0);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(String(cyfra), 0, 0);
  ctx.restore();

  ctx.font = czcionka(L.fs * 1.1, true);
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeText('← → zmieniaj pas', L.W / 2, y + L.fs * 4.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('← → zmieniaj pas', L.W / 2, y + L.fs * 4.5);
}

function rysujNapisPoziomu() {
  if (napisPoziomu <= 0) return;
  const y = L.hudH + (L.playerY - L.hudH) * 0.35;
  ctx.globalAlpha = Math.min(1, napisPoziomu / 0.4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.font = czcionka(L.fs * 2.2, true);
  ctx.strokeText(`Poziom ${poziom}!`, L.W / 2, y);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(`Poziom ${poziom}!`, L.W / 2, y);
  ctx.font = czcionka(L.fs * 1.2, true);
  const podpis = `Szybciej! ${kmh()} km/h`;
  ctx.strokeText(podpis, L.W / 2, y + L.fs * 2.2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(podpis, L.W / 2, y + L.fs * 2.2);
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

  // Serca (życia)
  const s = 24;
  for (let i = 0; i < USTAWIENIA.zycia; i++) {
    const cx = hudX + 16 + s / 2 + i * (s + 8);
    serce(cx, hudH / 2 - s / 2 + 1, s, s, i < zycia ? '#ff4d6d' : 'rgba(255,255,255,0.15)');
  }
  const lewaSzer = 16 + USTAWIENIA.zycia * (s + 8);

  // Punkty i ikona pauzy po prawej
  const prawy = hudX + hudW - 16;
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

  // Na środku: licznik km/h i poziom
  const miejsce = hudW - 2 * Math.max(lewaSzer, prawaSzer) - 12;
  if (miejsce > 40) {
    ctx.textAlign = 'center';
    const glowny = stan === 'start' ? 'Wyścigi' : `${kmh()} km/h`;
    ctx.font = czcionka(fs * 1.05, true);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(glowny, W / 2, hudH * 0.36);
    const drugi = `Poziom ${poziom}${wyciszone ? ' · dźwięk wył. (M)' : ''}`;
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
  ctx.fillStyle = 'rgba(5, 6, 18, 0.62)';
  ctx.fillRect(0, L.hudH, L.W, L.H - L.hudH);

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
    ctx.font = czcionka(el.rozmiar, el.gruba);
    for (const linia of zawijajTekst(el.tekst, wewn)) {
      const h = el.przycisk ? el.rozmiar * 2.6 : el.rozmiar * 1.35;
      wiersze.push({ ...el, tekst: linia, h });
      wys += h;
    }
  }

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
    { tekst: 'Wyścigi', rozmiar: fs * 2.1, gruba: true, kolor: '#ff5a5f' },
    { odstep: fs * 0.6 },
    { tekst: 'Jedziesz czerwonym autem. Omijaj inne auta!', rozmiar: fs },
    { tekst: 'Każde wyprzedzone auto to 1 punkt.', rozmiar: fs },
    { odstep: fs * 0.6 },
    { tekst: 'Sterowanie: ← →  albo  A D', rozmiar: fs * 1.1, gruba: true, kolor: '#4cc9f0' },
    { tekst: 'na telefonie: stukaj w lewą albo prawą stronę ekranu', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.6 },
    { tekst: `Masz ${n} ${slowoZycia(n)}. Każde zderzenie zabiera jedno.`, rozmiar: fs, kolor: '#ff8fa3' },
    { tekst: `Co ${USTAWIENIA.punktyNaPoziom} punktów nowy poziom – jedziesz szybciej!`, rozmiar: fs * 0.85, kolor: '#a9a3d9' },
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
    { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby jechać dalej', rozmiar: fs, gruba: true, kolor: '#ffffff', alfa: migotanie() },
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
    { tekst: 'Koniec wyścigu!', rozmiar: fs * 2.1, gruba: true, kolor: '#ff5a5f' },
    { odstep: fs * 0.5 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.7, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.2, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekord} pkt`, rozmiar: fs, kolor: '#a9a3d9' },
    { tekst: `Poziom: ${poziom} · ${kmh()} km/h`, rozmiar: fs, kolor: '#a9a3d9' },
    { odstep: fs * 0.9 },
    mozna
      ? { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby jechać znowu', rozmiar: fs * 1.05, gruba: true, kolor: '#ffffff', alfa: migotanie() }
      : { odstep: fs * 1.4 },
    { odstep: fs * 0.4 },
    elementMenu(fs),
  ]);
}

function rysuj() {
  przyciskMenu = null;   // przycisk menu istnieje tylko wtedy, gdy narysuje go okienko
  ctx.save();
  if (trzesienie > 0) {
    const m = (trzesienie / 0.4) * 8;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  rysujTrawe();
  rysujDroge();
  rysujDrzewa();
  rysujAuta();
  if (stan !== 'start') rysujGracza();
  rysujEfekty();
  rysujOdliczanie();
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

  if (stan === 'gra') {
    przewinZiemie(dt, predkosc());
    aktualizujGre(dt);
  } else if (stan === 'start') {
    przewinZiemie(dt, 0.5);    // na ekranie startowym droga powoli jedzie
  } else if (stan === 'odliczanie') {
    aktualizujOdliczanie(dt);
  }
  if (stan !== 'pauza') aktualizujEfekty(dt);
  aktualizujSilnik();
  rysuj();

  requestAnimationFrame(petla);
}

dopasujRozmiar();
requestAnimationFrame(petla);
