'use strict';

// =====================================================
//   ŻABI SKOK – żabka skacze przez ulice do stawu
//   Pomysł: Seweryn
// =====================================================
//
//  Zasady:
//   - Żabka zaczyna na dole, na chodniku. Na samej górze jest staw.
//   - Po drodze są ulice. Jeżdżą po nich auta, a na dalszych poziomach
//     także motory, ciężarówki i autobusy.
//   - Każdy skok to jedno pole: do przodu, do tyłu, w lewo albo w prawo.
//   - Na trawie jest bezpiecznie – można tam odpocząć.
//   - Wskocz do stawu, a zaczniesz nowy poziom: nowe ulice i szybsze auta.
//   - Potrącenie = minus 1 życie i żabka wraca na start.
//   - Łap muchy! Zwykła mucha daje punkty, a złota mucha dodatkowe serce.


// ---------- USTAWIENIA (śmiało je zmieniaj!) ----------
const USTAWIENIA = {
  zycia: 3,                        // ile żyć na start
  najwiecejZyc: 5,                 // więcej serc mieć nie można (złota mucha dodaje serce)
  kolumny: 9,                      // ile pól ma plansza w poziomie (szerokość)
  rzedy: 11,                       // ile rzędów ma plansza – razem ze startem i stawem
  predkoscNaStart: 1.3,            // jak szybko jeżdżą auta na poziomie 1 (ile pól na sekundę)
  wzrostPredkosciNaPoziom: 0.12,   // o ile przyspieszają auta na każdym poziomie (0.12 = o 12%)
  predkoscNajwieksza: 4.5,         // szybciej żaden pojazd nie pojedzie
  przerwaNaStart: 3.5,             // najmniejsza przerwa między autami na poziomie 1 (w polach)
  przerwaNajmniejsza: 1.8,         // ...a mniejszej przerwy nie będzie nigdy, nawet na trudnym poziomie
  punktyZaSkok: 1,                 // skok do przodu na rząd, w którym jeszcze nie było żabki
  punktyZaMuche: 5,                // zjedzona mucha
  punktyZaStaw: 10,                // wskoczenie do stawu
  szansaZlotejMuchy: 0.15,         // jak często przylatuje złota mucha (0.15 = mniej więcej co siódma)
  czasMuchy: 7,                    // ile sekund mucha czeka, zanim odleci
};

const CZAS_SKOKU = 0.13;           // ile sekund trwa jeden skok
const CZAS_PO_POTRACENIU = 1.1;    // ile sekund żabka dochodzi do siebie po potrąceniu
const CZAS_PRZEJSCIA = 1.6;        // ile sekund trwa przejście do nowego poziomu

// Rodzaje pojazdów. Długość i szerokość są w polach planszy.
// szybkosc: 1.5 = półtora raza szybciej niż zwykłe auto
// odPoziomu: od którego poziomu pojazd jeździ po ulicach
// czestosc: im więcej, tym częściej trafia się ulica z takimi pojazdami
const POJAZDY = {
  auto:       { nazwa: 'auta',       dlugosc: 1.3, szerokosc: 0.64, szybkosc: 1.0, odPoziomu: 1, czestosc: 3 },
  motor:      { nazwa: 'motory',     dlugosc: 0.8, szerokosc: 0.38, szybkosc: 1.5, odPoziomu: 2, czestosc: 1 },
  ciezarowka: { nazwa: 'ciężarówki', dlugosc: 2.2, szerokosc: 0.76, szybkosc: 0.8, odPoziomu: 2, czestosc: 1.5 },
  autobus:    { nazwa: 'autobusy',   dlugosc: 2.9, szerokosc: 0.78, szybkosc: 0.7, odPoziomu: 3, czestosc: 1 },
};

const KOLORY_AUT = ['#4cc9f0', '#ffd23f', '#e63946', '#c77dff', '#ff9f1c', '#f1f1f1', '#6c8cff', '#2ec4b6'];
const KOLORY_AUTOBUSOW = ['#ffd23f', '#e63946', '#3a86ff'];
const KOLORY_KWIATOW = ['#ffd23f', '#ff8fa3', '#ffffff', '#c77dff'];


// =====================================================
//   STAN GRY
// =====================================================
const plotno = document.getElementById('gra');
const ctx = plotno.getContext('2d');

const KOL = USTAWIENIA.kolumny;
const RZ = USTAWIENIA.rzedy;

let stan = 'start';            // 'start' | 'gra' | 'pauza' | 'koniec'
let punkty = 0;
let zycia = USTAWIENIA.zycia;
let poziom = 1;
let rekord = wczytajRekord();
let nowyRekord = false;
let muchyZjedzone = 0;

let rzedy = [];                // plansza: rzedy[0] to start na dole, rzedy[RZ - 1] to staw na górze
let liscie = [];               // liście lilii na stawie (ozdoba)
let trzciny = [];              // trzciny na brzegu stawu (ozdoba)
let zaba = nowaZaba();
let najwyzszy = 0;             // najwyższy rząd, do którego doskoczyła żabka na tym poziomie
let mucha = null;              // mucha do złapania: { kol, rzad, t, zlota, faza }
let licznikMuchy = 3;          // za ile sekund przyleci następna mucha
let ranna = 0;                 // ile sekund jeszcze żabka dochodzi do siebie po potrąceniu
let przejscie = 0;             // odlicza przejście do nowego poziomu (po wskoczeniu do stawu)
let poziomGotowy = true;       // czy nowy poziom został już zbudowany w czasie przejścia
let opisPoziomu = '';          // napis pod „Poziom 2!” – co nowego czeka na ulicach
let efekty = [];               // gwiazdki, krople, napisy...

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
  L.pole = Math.max(12, Math.floor(Math.min(L.W / KOL, (L.H - L.hudH) / RZ, 96)));   // wielkość jednego pola
  L.planszaW = KOL * L.pole;
  L.planszaH = RZ * L.pole;
  L.planszaX = Math.round((L.W - L.planszaW) / 2);
  L.planszaY = Math.round(L.hudH + (L.H - L.hudH - L.planszaH) / 2);
  L.zapas = L.planszaX / L.pole + 1;            // ile pól widać z boku planszy (tam wjeżdżają i wyjeżdżają auta)
  L.fs = ogranicz(Math.min(L.W / 26, L.H / 32), 11, 20);   // wielkość napisów
}

// Gdzie na ekranie (y) zaczyna się rząd r. Rząd 0 jest na samym dole.
function yRzedu(r) {
  return L.planszaY + (RZ - 1 - r) * L.pole;
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
    wzmacniacz.gain.value = 0.45;
    const kompresor = audio.createDynamicsCompressor();
    wzmacniacz.connect(kompresor);
    kompresor.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume();
  return true;
}

// Krótki dźwięk o jednej wysokości (pisk, bip)
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

// Szum (jak plusk albo huk) – to losowe drgania przepuszczone przez filtr
function szum(dlugosc, typFiltra, od, doCz, glosnosc) {
  if (wyciszone || !przygotujDzwiek()) return;
  const t = audio.currentTime;
  const bufor = audio.createBuffer(1, Math.floor(audio.sampleRate * dlugosc), audio.sampleRate);
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

function dzwiekSkoku() {
  slizg(260, 640, 0.09, 'sine', 0.1);
}

// „Kum kum!”
function dzwiekKumkania() {
  slizg(190, 120, 0.12, 'square', 0.05);
  slizg(210, 125, 0.14, 'square', 0.05, 0.16);
}

function dzwiekSciany() {
  pisk(150, 0.06, 'square', 0.05);
}

function dzwiekPotracenia() {
  // klakson: dwa dźwięki naraz, dwa razy – „bip bip!”
  for (const opoznienie of [0, 0.2]) {
    pisk(415, 0.14, 'square', 0.07, opoznienie);
    pisk(523, 0.14, 'square', 0.07, opoznienie);
  }
  slizg(700, 110, 0.45, 'triangle', 0.2, 0.05);   // „bojng!”
  szum(0.25, 'lowpass', 1200, 300, 0.4);
}

function dzwiekMuchy() {
  pisk(1100, 0.05, 'square', 0.05);
  pisk(1500, 0.07, 'square', 0.05, 0.05);
}

function dzwiekZlotejMuchy() {
  [784, 988, 1175, 1568].forEach((f, i) => pisk(f, 0.12, 'triangle', 0.1, i * 0.07));
}

function dzwiekPlusku() {
  szum(0.55, 'bandpass', 2200, 280, 0.6);
  slizg(1000, 260, 0.22, 'sine', 0.08);
}

function dzwiekPoziomu() {
  [523, 659, 784, 1046].forEach((f, i) => pisk(f, 0.12, 'square', 0.07, i * 0.08));
}

function dzwiekKonca() {
  [392, 330, 262, 196].forEach((f, i) => pisk(f, 0.3, 'triangle', 0.18, 0.2 + i * 0.25));
}


// =====================================================
//   REKORD (zapamiętywany w przeglądarce)
// =====================================================
function wczytajRekord() {
  try {
    return parseInt(localStorage.getItem('zabi-skok-rekord'), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function zapiszRekord(wynik) {
  try {
    localStorage.setItem('zabi-skok-rekord', String(wynik));
  } catch (e) {
    // nic się nie stało – rekord po prostu nie zostanie zapamiętany
  }
}


// =====================================================
//   BUDOWANIE PLANSZY
// =====================================================
function losowa(min, max) {
  return min + Math.random() * (max - min);
}

function losowaCalkowita(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function wylosuj(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Jakie pojazdy będą jeździć po nowej ulicy? (losujemy spośród tych, które już mogą jeździć)
function losujPojazd() {
  const mozliwe = Object.keys(POJAZDY).filter((t) => POJAZDY[t].odPoziomu <= poziom);
  let suma = 0;
  for (const t of mozliwe) suma += POJAZDY[t].czestosc;
  let los = Math.random() * suma;
  for (const t of mozliwe) {
    los -= POJAZDY[t].czestosc;
    if (los < 0) return t;
  }
  return 'auto';
}

// Jeden pas ulicy. Wszystkie pojazdy na pasie jadą w tę samą stronę i tak samo szybko.
function nowaUlica(kier) {
  const pojazd = losujPojazd();
  const dane = POJAZDY[pojazd];
  const tempo = USTAWIENIA.predkoscNaStart * (1 + (poziom - 1) * USTAWIENIA.wzrostPredkosciNaPoziom);
  const przerwaMin = Math.max(
    USTAWIENIA.przerwaNajmniejsza,
    USTAWIENIA.przerwaNaStart - (poziom - 1) * 0.25
  );
  return {
    typ: 'ulica',
    kier,                                        // 1 = jadą w prawo, -1 = jadą w lewo
    pojazd,
    dl: dane.dlugosc,
    predkosc: Math.min(USTAWIENIA.predkoscNajwieksza, tempo * dane.szybkosc * losowa(0.8, 1.2)),
    przerwaMin,
    przerwaMax: przerwaMin + 3,
    pojazdy: [],                                 // { x, kolor } – x to lewy brzeg pojazdu (w polach)
  };
}

// Kwiatki i kępki trawy (ozdoba). Rozrzucamy je też poza planszą, bo tam też widać trawę.
function noweOzdoby() {
  const ozdoby = [];
  for (let i = 0; i < 40; i++) {
    ozdoby.push({
      x: losowa(-30, KOL + 30),
      y: losowa(0.15, 0.85),
      typ: Math.random() < 0.55 ? 'kepka' : 'kwiat',
      kolor: wylosuj(KOLORY_KWIATOW),
    });
  }
  return ozdoby;
}

function zbudujPoziom() {
  rzedy = [];
  rzedy[0] = { typ: 'start' };

  // Ulice są w grupach (1–4 pasy obok siebie), a między grupami jest trawa.
  // Na wyższych poziomach grupy są szersze, czyli trawy jest mniej.
  const najwiecej = Math.min(4, 1 + poziom);
  const najmniej = poziom >= 4 ? 2 : 1;
  let r = 1;
  let kier = Math.random() < 0.5 ? 1 : -1;
  while (r < RZ - 1) {
    const ile = Math.min(RZ - 1 - r, losowaCalkowita(najmniej, najwiecej));
    for (let i = 0; i < ile; i++) {
      rzedy[r] = nowaUlica(kier);
      kier = -kier;                              // sąsiednie pasy jadą w przeciwne strony
      r++;
    }
    if (r < RZ - 1) {
      rzedy[r] = { typ: 'trawa', ozdoby: noweOzdoby() };
      r++;
    }
  }
  rzedy[RZ - 1] = { typ: 'staw' };

  // Ozdoby stawu
  liscie = [];
  for (let i = 0; i < 70; i++) {
    liscie.push({
      x: losowa(-30, KOL + 30),
      y: losowa(-0.2, 8),                        // ile rzędów nad środkiem rzędu ze stawem
      r: losowa(0.28, 0.42),
      kat: losowa(0, Math.PI * 2),
      kwiat: Math.random() < 0.2,
    });
  }
  trzciny = [];
  for (let x = -30; x < KOL + 30; x += losowa(1.5, 3.5)) trzciny.push({ x, ziarno: losowaCalkowita(0, 2) });

  // Od razu wypełniamy ulice autami, żeby nie były puste na początku
  for (const rz of rzedy) if (rz.typ === 'ulica') uzupelnijPas(rz);
}


// =====================================================
//   RUCH ULICZNY
// =====================================================
function nowyPojazd(rz, x) {
  const kolor = rz.pojazd === 'autobus' ? wylosuj(KOLORY_AUTOBUSOW) : wylosuj(KOLORY_AUT);
  return { x, kolor };
}

function losowaPrzerwa(rz) {
  return losowa(rz.przerwaMin, rz.przerwaMax);
}

// Usuwamy pojazdy, które odjechały za ekran, i dokładamy nowe, które dopiero wjadą.
// Nowe pojazdy ustawiamy w kolejce za ostatnim, zawsze z przerwą – dzięki temu da się przeskoczyć.
function uzupelnijPas(rz) {
  const lewo = -L.zapas - 1;
  const prawo = KOL + L.zapas + 1;
  const dl = rz.dl;
  if (rz.kier > 0) {
    // jadą w prawo: wyjeżdżają z prawej, nowe czekają z lewej
    rz.pojazdy = rz.pojazdy.filter((p) => p.x < prawo);
    if (rz.pojazdy.length === 0) rz.pojazdy.push(nowyPojazd(rz, prawo - dl - losowa(0, rz.przerwaMax)));
    let ostatni = rz.pojazdy[rz.pojazdy.length - 1];
    while (ostatni.x > lewo) {
      ostatni = nowyPojazd(rz, ostatni.x - losowaPrzerwa(rz) - dl);
      rz.pojazdy.push(ostatni);
    }
  } else {
    // jadą w lewo: wyjeżdżają z lewej, nowe czekają z prawej
    rz.pojazdy = rz.pojazdy.filter((p) => p.x + dl > lewo);
    if (rz.pojazdy.length === 0) rz.pojazdy.push(nowyPojazd(rz, lewo + losowa(0, rz.przerwaMax)));
    let ostatni = rz.pojazdy[rz.pojazdy.length - 1];
    while (ostatni.x + dl < prawo) {
      ostatni = nowyPojazd(rz, ostatni.x + dl + losowaPrzerwa(rz));
      rz.pojazdy.push(ostatni);
    }
  }
}

function aktualizujRuch(dt) {
  for (const rz of rzedy) {
    if (rz.typ !== 'ulica') continue;
    for (const p of rz.pojazdy) p.x += rz.kier * rz.predkosc * dt;
    uzupelnijPas(rz);
  }
}


// =====================================================
//   ŻABKA
// =====================================================
function nowaZaba() {
  const kol = Math.floor(KOL / 2);
  return {
    kol, rzad: 0,              // pole, na które żabka skacze (albo na którym siedzi)
    odKol: kol, odRzad: 0,     // pole, z którego skoczyła
    postep: 1,                 // jak daleko jest w skoku: 0 = dopiero wyskoczyła, 1 = wylądowała
    kat: 0,                    // w którą stronę patrzy (0 = do góry)
    kolejka: null,             // następny skok, jeśli naciśniesz klawisz w czasie skoku
  };
}

// Gdzie jest teraz żabka (w polach) i jak wysoko nad ziemią (0–1)
function pozycjaZaby() {
  const p = 1 - (1 - zaba.postep) * (1 - zaba.postep);   // na końcu skoku żabka trochę zwalnia
  return {
    kol: zaba.odKol + (zaba.kol - zaba.odKol) * p,
    rzad: zaba.odRzad + (zaba.rzad - zaba.odRzad) * p,
    skok: Math.sin(Math.PI * zaba.postep),
  };
}

// Środek żabki na ekranie (w pikselach)
function srodekZaby() {
  const poz = pozycjaZaby();
  return { x: L.planszaX + (poz.kol + 0.5) * L.pole, y: yRzedu(poz.rzad) + L.pole / 2 };
}

function zablokowana() {
  return stan !== 'gra' || ranna > 0 || przejscie > 0.4;
}

// Skok o jedno pole. dk: -1 w lewo, 1 w prawo. dr: 1 do przodu (w górę), -1 do tyłu.
function skocz(dk, dr) {
  if (zablokowana()) return;
  if (zaba.postep < 1) {
    zaba.kolejka = [dk, dr];   // żabka jeszcze leci – skoczy, jak tylko wyląduje
    return;
  }
  zaba.kat = Math.atan2(dk, dr);
  const nk = zaba.kol + dk;
  const nr = zaba.rzad + dr;
  if (nk < 0 || nk >= KOL || nr < 0 || nr >= RZ) {
    dzwiekSciany();            // dalej nie ma planszy
    return;
  }
  zaba.odKol = zaba.kol;
  zaba.odRzad = zaba.rzad;
  zaba.kol = nk;
  zaba.rzad = nr;
  zaba.postep = 0;
  dzwiekSkoku();
}

function aktualizujZabe(dt) {
  if (zaba.postep >= 1) return;
  zaba.postep = Math.min(1, zaba.postep + dt / CZAS_SKOKU);
  if (zaba.postep >= 1) wyladowanie();
}

function wyladowanie() {
  const s = srodekZaby();

  if (zaba.rzad === RZ - 1) {
    doStawu();
    return;
  }

  // Nowy rząd, w którym jeszcze nie było żabki = punkt
  if (zaba.rzad > najwyzszy) {
    najwyzszy = zaba.rzad;
    punkty += USTAWIENIA.punktyZaSkok;
    efekty.push({ typ: 'napis', tekst: `+${USTAWIENIA.punktyZaSkok}`, x: s.x, y: s.y - L.pole * 0.55, kolor: '#ffd23f', t: 0, dlugosc: 0.6 });
  }

  // Mucha na tym polu? Mniam!
  if (mucha && mucha.kol === zaba.kol && mucha.rzad === zaba.rzad) zjedzMuche();

  // Kurz spod łapek
  for (const strona of [-1, 1]) {
    efekty.push({
      typ: 'puf', x: s.x + strona * L.pole * 0.25, y: s.y + L.pole * 0.2,
      vx: strona * L.pole * 0.8, vy: 0, r: L.pole * 0.07, t: 0, dlugosc: 0.3,
    });
  }

  if (zaba.kolejka) {
    const [dk, dr] = zaba.kolejka;
    zaba.kolejka = null;
    skocz(dk, dr);
  }
}

// Czy żabkę potrącił jakiś pojazd?
function sprawdzPotracenie() {
  if (ranna > 0 || przejscie > 0) return;
  const r = zaba.postep < 0.5 ? zaba.odRzad : zaba.rzad;   // w połowie skoku żabka „przechodzi” do nowego rzędu
  const rz = rzedy[r];
  if (rz.typ !== 'ulica') return;
  const srodek = pozycjaZaby().kol + 0.5;
  const pol = 0.28;   // połowa szerokości żabki (w polach)
  for (const p of rz.pojazdy) {
    if (srodek + pol > p.x + 0.08 && srodek - pol < p.x + rz.dl - 0.08) {
      potracenie(rz);
      return;
    }
  }
}

function potracenie(rz) {
  zycia--;
  ranna = CZAS_PO_POTRACENIU;
  trzesienie = 0.35;
  zaba.kolejka = null;
  dzwiekPotracenia();

  const s = srodekZaby();
  // Żabka odlatuje kręcąc się, razem z pojazdem
  efekty.push({
    typ: 'auc', x: s.x, y: s.y, vx: rz.kier * rz.predkosc * L.pole * 0.7, vy: 0,
    kat: zaba.kat, vk: rz.kier * 9, t: 0, dlugosc: CZAS_PO_POTRACENIU,
  });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    efekty.push({
      typ: 'gwiazdka', x: s.x, y: s.y, vx: Math.cos(a) * L.pole * 2.2, vy: Math.sin(a) * L.pole * 2.2,
      r: L.pole * 0.12, t: 0, dlugosc: 0.7,
    });
  }
  efekty.push({ typ: 'napis', tekst: 'Auć!', x: s.x, y: s.y - L.pole * 0.6, kolor: '#ff4d6d', t: 0, dlugosc: 1, duzy: true });
}

// Żabka wskoczyła do stawu – brawo!
function doStawu() {
  punkty += USTAWIENIA.punktyZaStaw;
  zaba.kolejka = null;
  zaba.kat = 0;
  const s = srodekZaby();
  efekty.push({ typ: 'napis', tekst: `+${USTAWIENIA.punktyZaStaw}`, x: s.x, y: s.y - L.pole * 0.6, kolor: '#3ddc97', t: 0, dlugosc: 1.1, duzy: true });
  efekty.push({ typ: 'fala', x: s.x, y: s.y, r: L.pole, t: 0, dlugosc: 0.8 });
  efekty.push({ typ: 'fala', x: s.x, y: s.y, r: L.pole, t: -0.2, dlugosc: 0.8 });
  for (let i = 0; i < 14; i++) {
    efekty.push({
      typ: 'kropla', x: s.x, y: s.y, vx: losowa(-1, 1) * L.pole * 2.2, vy: -losowa(1.5, 4) * L.pole,
      g: L.pole * 9, r: losowa(2, 4), t: 0, dlugosc: 0.7,
    });
  }
  dzwiekPlusku();
  dzwiekKumkania();
  if (mucha) muchaOdlatuje();
  przejscie = CZAS_PRZEJSCIA;
  poziomGotowy = false;
}

function aktualizujPrzejscie(dt) {
  if (przejscie <= 0) return;
  przejscie = Math.max(0, przejscie - dt);
  // W środku przejścia ekran jest ciemny – wtedy podmieniamy planszę na nową
  if (!poziomGotowy && przejscie <= 0.7) {
    poziomGotowy = true;
    poziom++;
    zbudujPoziom();
    zaba = nowaZaba();
    najwyzszy = 0;
    mucha = null;
    licznikMuchy = 2.5;
    const nowe = Object.keys(POJAZDY).filter((t) => POJAZDY[t].odPoziomu === poziom);
    opisPoziomu = nowe.length > 0
      ? `Uwaga: ${nowe.map((t) => POJAZDY[t].nazwa).join(' i ')}!`
      : 'Auta jadą szybciej!';
    napisPoziomu = 2.4;
    dzwiekPoziomu();
  }
}


// =====================================================
//   MUCHY
// =====================================================
function nowaMucha() {
  for (let proba = 0; proba < 20; proba++) {
    const kol = losowaCalkowita(0, KOL - 1);
    const rzad = losowaCalkowita(1, RZ - 2);   // nie na starcie i nie w stawie
    if (Math.abs(kol - zaba.kol) + Math.abs(rzad - zaba.rzad) < 2) continue;   // nie tuż przy żabce
    const zlota = zycia < USTAWIENIA.najwiecejZyc && Math.random() < USTAWIENIA.szansaZlotejMuchy;
    mucha = { kol, rzad, t: 0, zlota, faza: losowa(0, 6) };
    return;
  }
  licznikMuchy = 1;   // nie udało się znaleźć miejsca – spróbujemy za chwilę
}

function pozycjaMuchy(m) {
  return {
    x: L.planszaX + (m.kol + 0.5) * L.pole + Math.sin(czas * 3 + m.faza) * L.pole * 0.1,
    y: yRzedu(m.rzad) + L.pole * 0.45 + Math.cos(czas * 4.3 + m.faza) * L.pole * 0.08,
  };
}

function muchaOdlatuje() {
  const p = pozycjaMuchy(mucha);
  efekty.push({
    typ: 'odlot', x: p.x, y: p.y, vx: losowa(-1, 1) * L.pole * 2, vy: -L.pole * 4,
    zlota: mucha.zlota, t: 0, dlugosc: 0.8,
  });
  mucha = null;
}

function aktualizujMuche(dt) {
  if (mucha) {
    mucha.t += dt;
    if (mucha.t > USTAWIENIA.czasMuchy) {
      muchaOdlatuje();
      licznikMuchy = losowa(2, 5);
    }
  } else if (przejscie <= 0) {
    licznikMuchy -= dt;
    if (licznikMuchy <= 0) nowaMucha();
  }
}

function zjedzMuche() {
  const s = srodekZaby();
  if (mucha.zlota) {
    zycia = Math.min(USTAWIENIA.najwiecejZyc, zycia + 1);
    efekty.push({ typ: 'napis', tekst: '+1 ♥', x: s.x, y: s.y - L.pole * 0.9, kolor: '#ff4d6d', t: 0, dlugosc: 1.1, duzy: true });
    dzwiekZlotejMuchy();
  } else {
    punkty += USTAWIENIA.punktyZaMuche;
    efekty.push({ typ: 'napis', tekst: `+${USTAWIENIA.punktyZaMuche}`, x: s.x, y: s.y - L.pole * 0.9, kolor: '#ffd23f', t: 0, dlugosc: 0.9, duzy: true });
    dzwiekMuchy();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    efekty.push({
      typ: 'gwiazdka', x: s.x, y: s.y, vx: Math.cos(a) * L.pole * 1.5, vy: Math.sin(a) * L.pole * 1.5,
      r: L.pole * 0.08, t: 0, dlugosc: 0.45,
    });
  }
  muchyZjedzone++;
  mucha = null;
  licznikMuchy = losowa(3, 6);
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
  muchyZjedzone = 0;
  efekty = [];
  ranna = 0;
  przejscie = 0;
  poziomGotowy = true;
  napisPoziomu = 0;
  zbudujPoziom();
  zaba = nowaZaba();
  najwyzszy = 0;
  mucha = null;
  licznikMuchy = 3;
  stan = 'gra';
  dzwiekKumkania();
  efekty.push({ typ: 'start', t: 0, dlugosc: 0.9 });
}

function aktualizujGre(dt) {
  aktualizujPrzejscie(dt);

  if (ranna > 0) {
    ranna -= dt;
    if (ranna <= 0) {
      ranna = 0;
      if (zycia <= 0) {
        koniecGry();
        return;
      }
      // Żabka wraca na start
      zaba = nowaZaba();
      const s = srodekZaby();
      efekty.push({ typ: 'pojawienie', x: s.x, y: s.y, r: L.pole * 0.6, t: 0, dlugosc: 0.5 });
      dzwiekKumkania();
    }
  } else {
    aktualizujZabe(dt);
    sprawdzPotracenie();
  }
  aktualizujMuche(dt);
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
    if (e.t < 0) continue;              // ten efekt jeszcze czeka na swoją kolej
    if (e.vx !== undefined) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    if (e.g) e.vy += e.g * dt;          // grawitacja (krople spadają)
    if (e.vk) e.kat += e.vk * dt;       // kręcenie się
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

const KLAWISZE_SKOKU = {
  ArrowUp: [0, 1], KeyW: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

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
  const kierunek = KLAWISZE_SKOKU[e.code];
  if (kierunek) {
    e.preventDefault();
    if (e.repeat) return;             // trzymanie klawisza nie skacze – każdy skok to osobne naciśnięcie
    if (stan === 'start') nowaGra();  // strzałka na ekranie startowym też zaczyna grę
    else skocz(kierunek[0], kierunek[1]);
  }
});

// Myszka i dotyk:
//  - przesuń palcem w stronę, w którą żabka ma skoczyć
//  - albo stuknij obok żabki: nad nią = skok do przodu, z boku = w bok, pod nią = do tyłu
let dotyk = null;

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
  dotyk = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try {
    plotno.setPointerCapture(e.pointerId);
  } catch (err) {
    // trudno – zadziała i bez tego
  }
});

plotno.addEventListener('pointerup', (e) => {
  if (!dotyk || dotyk.id !== e.pointerId) return;
  let dx = e.clientX - dotyk.x;
  let dy = e.clientY - dotyk.y;
  dotyk = null;
  if (stan !== 'gra') return;
  if (Math.hypot(dx, dy) < 24) {
    // To było stuknięcie, a nie przesunięcie – patrzymy, gdzie jest palec względem żabki
    const s = srodekZaby();
    dx = e.clientX - s.x;
    dy = e.clientY - s.y;
    if (Math.abs(dx) < L.pole * 0.5 && Math.abs(dy) < L.pole * 0.5) {
      dx = 0;     // stuknięcie w samą żabkę = skok do przodu
      dy = -1;
    }
  }
  if (Math.abs(dx) > Math.abs(dy)) skocz(Math.sign(dx), 0);
  else skocz(0, dy < 0 ? 1 : -1);
});

plotno.addEventListener('pointercancel', () => {
  dotyk = null;
});

plotno.addEventListener('contextmenu', (e) => e.preventDefault());

// Gdy przełączysz kartę albo okno – gra sama się pauzuje
function pauzaPrzyWyjsciu() {
  if (stan === 'gra') stan = 'pauza';
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzaPrzyWyjsciu();
});
window.addEventListener('blur', pauzaPrzyWyjsciu);

window.addEventListener('resize', dopasujRozmiar);


// =====================================================
//   RYSOWANIE – narzędzia
// =====================================================
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

function elipsa(x, y, rx, ry, kat, kolor) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, kat, 0, Math.PI * 2);
  ctx.fillStyle = kolor;
  ctx.fill();
}

function gwiazda(x, y, r, kolor) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
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

// Napis z ciemną obwódką (żeby był czytelny na każdym tle)
function napisZObwodka(tekst, x, y, rozmiar, kolor, obwodka = 5) {
  ctx.font = czcionka(rozmiar, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = obwodka;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeText(tekst, x, y);
  ctx.fillStyle = kolor;
  ctx.fillText(tekst, x, y);
}


// =====================================================
//   RYSOWANIE – staw, chodnik, trawa, ulice
// =====================================================
function rysujTlo() {
  const { W, H, pole, planszaX } = L;
  const odKol = Math.floor(-planszaX / pole) - 1;            // pierwsza widoczna kolumna (może być poza planszą)
  const doKol = Math.ceil((W - planszaX) / pole) + 1;        // ostatnia widoczna kolumna

  // Staw: od górnego paska aż do brzegu
  const brzeg = yRzedu(RZ - 1) + pole;
  const woda = ctx.createLinearGradient(0, L.hudH, 0, brzeg);
  woda.addColorStop(0, '#17578a');
  woda.addColorStop(1, '#2a8fd0');
  ctx.fillStyle = woda;
  ctx.fillRect(-20, -20, W + 40, brzeg + 20);
  rysujFale(L.hudH - pole, brzeg);
  rysujLiscie(brzeg);

  // Rzędy planszy
  for (let r = 0; r < RZ - 1; r++) {
    const rz = rzedy[r];
    const y = yRzedu(r);
    if (rz.typ === 'start') rysujChodnik(y, pole, odKol, doKol);
    else if (rz.typ === 'trawa') rysujTrawnik(rz, r, y, odKol, doKol);
    else if (rz.typ === 'ulica') rysujUlice(r, y);
  }

  // Pod planszą dalej jest chodnik
  const dol = yRzedu(0) + pole;
  if (dol < H) rysujChodnik(dol, H - dol + 20, odKol, doKol);

  // Błotnisty brzeg stawu i trzciny
  const grubosc = Math.max(2, pole * 0.05);
  ctx.fillStyle = '#5c4a2e';
  ctx.fillRect(-20, brzeg - grubosc, W + 40, grubosc);
  rysujTrzciny(brzeg);
}

function rysujFale(gora, dol) {
  const { pole } = L;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = Math.max(1.5, pole * 0.03);
  const krokY = pole * 0.5;
  const krokX = pole * 1.2;
  let n = 0;
  for (let y = dol - pole * 0.25; y > gora; y -= krokY, n++) {
    const przes = (n % 2) * krokX / 2;
    for (let x = -krokX + przes; x < L.W + krokX; x += krokX) {
      const dx = Math.sin(czas * 1.3 + x * 0.02 + n) * pole * 0.12;
      ctx.beginPath();
      ctx.arc(x + dx, y, pole * 0.16, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }
  }
}

function rysujLisc(x, y, r, kat, kwiat) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, kat + 0.16, kat + Math.PI * 2 - 0.16);   // liść ma małe wcięcie
  ctx.closePath();
  ctx.fillStyle = '#2e9e4f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,80,40,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // żyłki na liściu
  ctx.strokeStyle = 'rgba(120,210,140,0.35)';
  ctx.beginPath();
  for (const a of [Math.PI * 0.6, Math.PI, Math.PI * 1.4]) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(kat + a) * r * 0.8, y + Math.sin(kat + a) * r * 0.8);
  }
  ctx.stroke();
  if (kwiat) {
    const kx = x - r * 0.15;
    const ky = y - r * 0.1;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      elipsa(kx + Math.cos(a) * r * 0.22, ky + Math.sin(a) * r * 0.22, r * 0.2, r * 0.11, a, '#ffafcc');
    }
    kolo(kx, ky, r * 0.13, '#ffd23f');
  }
}

function rysujLiscie(brzeg) {
  const { pole, planszaX } = L;
  for (const l of liscie) {
    // Na planszy w rzędzie stawu liści nie ma – tam wskakuje żabka
    if (l.x > -0.6 && l.x < KOL + 0.6 && l.y < 0.8) continue;
    const x = planszaX + l.x * pole;
    const y = brzeg - pole * 0.5 - l.y * pole;
    if (x < -pole || x > L.W + pole || y < L.hudH - pole) continue;
    rysujLisc(x, y, l.r * pole, l.kat, l.kwiat);
  }
}

function rysujTrzciny(brzeg) {
  const { pole, planszaX } = L;
  ctx.lineWidth = Math.max(1.5, pole * 0.03);
  for (const t of trzciny) {
    if (t.x > -0.3 && t.x < KOL + 0.3) continue;   // na planszy nie ma trzcin, żeby nie przeszkadzały
    const x = planszaX + t.x * pole;
    if (x < -pole || x > L.W + pole) continue;
    for (let i = 0; i < 3; i++) {
      const xx = x + (i - 1) * pole * 0.09;
      const wys = pole * (0.45 + 0.15 * ((i + t.ziarno) % 3));
      const kolys = Math.sin(czas * 1.5 + t.x + i) * pole * 0.03;
      ctx.strokeStyle = '#3f7d33';
      ctx.beginPath();
      ctx.moveTo(xx, brzeg);
      ctx.lineTo(xx + kolys, brzeg - wys);
      ctx.stroke();
      elipsa(xx + kolys, brzeg - wys, pole * 0.035, pole * 0.09, 0, '#7a4b25');
    }
  }
}

function rysujChodnik(y, h, odKol, doKol) {
  ctx.fillStyle = '#9a9ba6';
  ctx.fillRect(-20, y, L.W + 40, h);
  // płytki chodnikowe
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  const k = L.pole / 2;
  for (let i = odKol * 2; i <= doKol * 2; i++) ctx.fillRect(L.planszaX + i * k, y, 1, h);
  for (let yy = y; yy < y + h; yy += k) ctx.fillRect(-20, yy, L.W + 40, 1);
}

function rysujTrawnik(rz, r, y, odKol, doKol) {
  const { W, pole, planszaX } = L;
  ctx.fillStyle = '#3a9d4f';
  ctx.fillRect(-20, y, W + 40, pole);
  // jaśniejsza kratka – łatwiej policzyć pola
  ctx.fillStyle = '#43ab59';
  for (let k = odKol; k <= doKol; k++) {
    if ((((k + r) % 2) + 2) % 2 === 0) ctx.fillRect(planszaX + k * pole, y, pole, pole);
  }
  // kępki trawy i kwiatki
  for (const o of rz.ozdoby) {
    const x = planszaX + o.x * pole;
    if (x < -pole || x > W + pole) continue;
    const yy = y + o.y * pole;
    if (o.typ === 'kepka') {
      ctx.strokeStyle = '#2d7f3e';
      ctx.lineWidth = Math.max(1, pole * 0.03);
      ctx.beginPath();
      for (const d of [-1, 0, 1]) {
        ctx.moveTo(x + d * pole * 0.04, yy);
        ctx.lineTo(x + d * pole * 0.09, yy - pole * 0.12);
      }
      ctx.stroke();
    } else {
      const rr = pole * 0.045;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        kolo(x + Math.cos(a) * rr * 1.3, yy + Math.sin(a) * rr * 1.3, rr, o.kolor);
      }
      kolo(x, yy, rr * 0.9, '#ffb703');
    }
  }
}

function rysujUlice(r, y) {
  const { W, pole, planszaX } = L;
  ctx.fillStyle = '#3a3d46';
  ctx.fillRect(-20, y, W + 40, pole);
  const gora = rzedy[r + 1];
  const dol = rzedy[r - 1];
  // krawężniki tam, gdzie ulica się kończy
  const kraw = Math.max(3, pole * 0.07);
  ctx.fillStyle = '#c9c9d1';
  if (!gora || gora.typ !== 'ulica') ctx.fillRect(-20, y, W + 40, kraw);
  if (!dol || dol.typ !== 'ulica') ctx.fillRect(-20, y + pole - kraw, W + 40, kraw);
  // przerywana linia między dwoma pasami
  if (dol && dol.typ === 'ulica') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const kreska = pole * 0.45;
    const okres = pole * 0.8;
    const start = planszaX - Math.ceil(planszaX / okres) * okres;
    for (let x = start; x < W; x += okres) ctx.fillRect(x, y + pole - 2, kreska, 4);
  }
}

// Poza planszą jest trochę ciemniej – tam żabka nie może skakać
function rysujBokiPlanszy() {
  const { W, H, hudH, planszaX, planszaW } = L;
  if (planszaX <= 0) return;
  ctx.fillStyle = 'rgba(5, 6, 18, 0.32)';
  ctx.fillRect(-20, hudH, planszaX + 20, H - hudH + 20);
  ctx.fillRect(planszaX + planszaW, hudH, W - planszaX - planszaW + 20, H - hudH + 20);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(planszaX - 1, hudH, 2, H - hudH);
  ctx.fillRect(planszaX + planszaW - 1, hudH, 2, H - hudH);
}


// =====================================================
//   RYSOWANIE – pojazdy (widziane z góry, przód u góry)
// =====================================================
function bokiGradient(x, w, kolor) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, przyciemnij(kolor, 0.72));
  g.addColorStop(0.5, kolor);
  g.addColorStop(1, przyciemnij(kolor, 0.72));
  return g;
}

function kola(x, w, kw, kh, wysokosci) {
  ctx.fillStyle = '#15151c';
  for (const ky of wysokosci) {
    sciezkaZaokraglona(x - kw * 0.45, ky, kw, kh, 2);
    ctx.fill();
    sciezkaZaokraglona(x + w - kw * 0.55, ky, kw, kh, 2);
    ctx.fill();
  }
}

function rysujAuto(x, y, w, h, kolor) {
  kola(x, w, w * 0.16, h * 0.17, [y + h * 0.14, y + h * 0.68]);
  sciezkaZaokraglona(x, y, w, h, w * 0.28);
  ctx.fillStyle = bokiGradient(x, w, kolor);
  ctx.fill();
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

function rysujCiezarowke(x, y, w, h, kolor) {
  kola(x, w, w * 0.14, h * 0.1, [y + h * 0.08, y + h * 0.58, y + h * 0.8]);
  // skrzynia
  const sy = y + h * 0.3;
  const sh = h - (sy - y);
  sciezkaZaokraglona(x, sy, w, sh, 3);
  ctx.fillStyle = '#e9e6dc';
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.09)';
  for (let i = 1; i < 5; i++) ctx.fillRect(x + 2, sy + (sh * i) / 5, w - 4, 2);
  ctx.fillStyle = kolor;
  ctx.fillRect(x + w * 0.4, sy + 3, w * 0.2, sh - 6);
  // kabina
  const kab = h * 0.27;
  sciezkaZaokraglona(x + w * 0.04, y, w * 0.92, kab, [w * 0.25, w * 0.25, 3, 3]);
  ctx.fillStyle = bokiGradient(x, w, kolor);
  ctx.fill();
  ctx.fillStyle = '#1d2b4a';
  sciezkaZaokraglona(x + w * 0.14, y + kab * 0.2, w * 0.72, kab * 0.28, 3);
  ctx.fill();
  ctx.fillStyle = '#fff6c2';
  ctx.fillRect(x + w * 0.14, y + h * 0.008, w * 0.18, h * 0.022);
  ctx.fillRect(x + w * 0.68, y + h * 0.008, w * 0.18, h * 0.022);
}

function rysujAutobus(x, y, w, h, kolor) {
  kola(x, w, w * 0.14, h * 0.09, [y + h * 0.1, y + h * 0.76]);
  sciezkaZaokraglona(x, y, w, h, w * 0.18);
  ctx.fillStyle = bokiGradient(x, w, kolor);
  ctx.fill();
  // jaśniejszy dach
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  sciezkaZaokraglona(x + w * 0.17, y + h * 0.08, w * 0.66, h * 0.86, w * 0.1);
  ctx.fill();
  // okna po bokach
  ctx.fillStyle = '#1d2b4a';
  const ile = 6;
  const okno = (h * 0.8) / ile;
  for (let i = 0; i < ile; i++) {
    const oy = y + h * 0.12 + i * okno;
    ctx.fillRect(x + w * 0.03, oy, w * 0.1, okno - 3);
    ctx.fillRect(x + w * 0.87, oy, w * 0.1, okno - 3);
  }
  // przednia szyba
  sciezkaZaokraglona(x + w * 0.1, y + h * 0.015, w * 0.8, h * 0.05, 3);
  ctx.fill();
  // klimatyzacja na dachu
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.12);
}

function rysujMotor(x, y, w, h, kolor) {
  // koła
  ctx.fillStyle = '#15151c';
  sciezkaZaokraglona(x + w * 0.3, y, w * 0.4, h * 0.26, w * 0.15);
  ctx.fill();
  sciezkaZaokraglona(x + w * 0.3, y + h * 0.72, w * 0.4, h * 0.28, w * 0.15);
  ctx.fill();
  // rama
  sciezkaZaokraglona(x + w * 0.15, y + h * 0.16, w * 0.7, h * 0.62, w * 0.25);
  ctx.fillStyle = kolor;
  ctx.fill();
  // kierownica
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(x - w * 0.18, y + h * 0.22, w * 1.36, h * 0.06);
  // kierowca: ramiona i kask
  elipsa(x + w / 2, y + h * 0.52, w * 0.62, h * 0.13, 0, '#2b2b33');
  kolo(x + w / 2, y + h * 0.46, w * 0.36, '#f1f1f1');
  ctx.fillStyle = '#1d2b4a';
  ctx.fillRect(x + w * 0.25, y + h * 0.37, w * 0.5, h * 0.05);
  // przednie światło
  kolo(x + w / 2, y + h * 0.02, w * 0.12, '#fff6c2');
}

function rysujPojazdy() {
  const { pole, planszaX } = L;
  for (let r = 0; r < rzedy.length; r++) {
    const rz = rzedy[r];
    if (rz.typ !== 'ulica') continue;
    const dl = rz.dl * pole;
    const sz = POJAZDY[rz.pojazd].szerokosc * pole;
    const cy = yRzedu(r) + pole / 2;
    for (const p of rz.pojazdy) {
      const cx = planszaX + (p.x + rz.dl / 2) * pole;
      if (cx + dl / 2 < -10 || cx - dl / 2 > L.W + 10) continue;
      // cień
      sciezkaZaokraglona(cx - dl / 2 + 3, cy - sz / 2 + 5, dl, sz, sz * 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      // pojazd obracamy przodem w stronę jazdy
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rz.kier > 0 ? Math.PI / 2 : -Math.PI / 2);
      const x = -sz / 2;
      const y = -dl / 2;
      if (rz.pojazd === 'ciezarowka') rysujCiezarowke(x, y, sz, dl, p.kolor);
      else if (rz.pojazd === 'autobus') rysujAutobus(x, y, sz, dl, p.kolor);
      else if (rz.pojazd === 'motor') rysujMotor(x, y, sz, dl, p.kolor);
      else rysujAuto(x, y, sz, dl, p.kolor);
      ctx.restore();
    }
  }
}


// =====================================================
//   RYSOWANIE – żabka i muchy
// =====================================================

// Żabka widziana z góry. kat: w którą stronę patrzy, skok: 0 = siedzi, 1 = najwyżej w skoku
function rysujZabe(cx, cy, s, kat, skok) {
  ctx.save();
  ctx.translate(cx, cy);
  // cień na ziemi – im wyżej żabka, tym mniejszy
  elipsa(s * 0.04, s * 0.1, s * 0.34 * (1 - skok * 0.25), s * 0.3 * (1 - skok * 0.25), 0, 'rgba(0,0,0,0.25)');

  ctx.translate(0, -skok * s * 0.22);   // w czasie skoku żabka jest wyżej...
  ctx.rotate(kat);
  const wiecej = 1 + skok * 0.15;       // ...i wydaje się większa
  ctx.scale(wiecej, wiecej);

  const ciemna = '#1f8a43';
  for (const strona of [-1, 1]) {
    ctx.save();
    ctx.scale(strona, 1);
    // tylne nogi: złożone, a w czasie skoku wyprostowane do tyłu
    const nx = s * (0.25 - 0.08 * skok);
    const ny = s * (0.17 + 0.22 * skok);
    elipsa(nx, ny, s * 0.09, s * (0.16 + 0.06 * skok), -0.5 + 0.4 * skok, ciemna);
    const sx = nx + s * 0.04;
    const sy = ny + s * (0.15 + 0.07 * skok);
    for (const p of [-1, 0, 1]) kolo(sx + p * s * 0.045, sy + s * 0.02 - Math.abs(p) * s * 0.01, s * 0.035, ciemna);
    // przednie łapki
    elipsa(s * 0.22, -s * 0.1, s * 0.05, s * 0.1, 0.6, ciemna);
    kolo(s * 0.27, -s * 0.18, s * 0.03, ciemna);
    ctx.restore();
  }

  // ciało
  const g = ctx.createRadialGradient(-s * 0.06, -s * 0.06, s * 0.05, 0, 0, s * 0.36);
  g.addColorStop(0, '#7af09a');
  g.addColorStop(1, '#2fb257');
  elipsa(0, s * 0.03, s * 0.26, s * 0.32, 0, g);
  // plamki na grzbiecie
  kolo(-s * 0.09, s * 0.1, s * 0.045, 'rgba(25,110,50,0.45)');
  kolo(s * 0.1, s * 0.15, s * 0.035, 'rgba(25,110,50,0.45)');
  kolo(s * 0.03, -s * 0.01, s * 0.03, 'rgba(25,110,50,0.45)');

  // oczy
  for (const strona of [-1, 1]) {
    const ox = strona * s * 0.13;
    const oy = -s * 0.24;
    kolo(ox, oy, s * 0.095, '#2fb257');
    kolo(ox, oy - s * 0.01, s * 0.07, '#ffffff');
    kolo(ox, oy - s * 0.02, s * 0.038, '#15151c');
    kolo(ox - s * 0.015, oy - s * 0.035, s * 0.014, '#ffffff');
  }
  // rumieńce i uśmiech
  kolo(-s * 0.16, -s * 0.12, s * 0.035, 'rgba(255,140,160,0.55)');
  kolo(s * 0.16, -s * 0.12, s * 0.035, 'rgba(255,140,160,0.55)');
  ctx.strokeStyle = '#17642f';
  ctx.lineWidth = Math.max(1, s * 0.025);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -s * 0.16, s * 0.08, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();
}

function rysujZabeGracza() {
  const poz = pozycjaZaby();
  const s = srodekZaby();
  // W stawie żabka siedzi na liściu lilii
  if (zaba.rzad === RZ - 1 && zaba.postep >= 1) rysujLisc(s.x, s.y + L.pole * 0.05, L.pole * 0.42, 0.9, false);
  rysujZabe(s.x, s.y, L.pole * 0.82, zaba.kat, poz.skok);

  // Na początku gry strzałka podpowiada, że trzeba skakać do góry
  if (stan === 'gra' && poziom === 1 && najwyzszy === 0 && zaba.postep >= 1) {
    const y = s.y - L.pole * 0.75 - Math.abs(Math.sin(czas * 5)) * L.pole * 0.15;
    const r = L.pole * 0.16;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(s.x, y - r);
    ctx.lineTo(s.x + r, y + r * 0.6);
    ctx.lineTo(s.x - r, y + r * 0.6);
    ctx.closePath();
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function rysujMuchePostac(x, y, s, zlota) {
  // skrzydła machają bardzo szybko
  const mach = 0.45 + 0.55 * Math.abs(Math.sin(czas * 40));
  for (const strona of [-1, 1]) {
    elipsa(x + strona * s * 0.11, y - s * 0.05, s * 0.12, s * 0.07 * mach + s * 0.01, strona * -0.5, 'rgba(225, 240, 255, 0.8)');
  }
  elipsa(x, y, s * 0.075, s * 0.105, 0, zlota ? '#ffc93c' : '#26262f');
  kolo(x - s * 0.04, y - s * 0.085, s * 0.035, '#e5383b');
  kolo(x + s * 0.04, y - s * 0.085, s * 0.035, '#e5383b');
}

function rysujMuche() {
  const m = mucha;
  if (m.t > USTAWIENIA.czasMuchy - 1.5 && Math.floor(czas * 8) % 2 === 0) return;   // zaraz odleci – miga
  const p = pozycjaMuchy(m);
  const s = L.pole * 1.6;
  // cień na ziemi
  elipsa(p.x, yRzedu(m.rzad) + L.pole * 0.78, L.pole * 0.1, L.pole * 0.04, 0, 'rgba(0,0,0,0.25)');
  // poświata, żeby muchę było widać nawet na ciemnej ulicy
  const puls = 0.8 + 0.2 * Math.sin(czas * 6);
  kolo(p.x, p.y, L.pole * 0.3 * puls, m.zlota ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.18)');
  rysujMuchePostac(p.x, p.y, s, m.zlota);
}


// =====================================================
//   RYSOWANIE – efekty, napisy, pasek, okienka
// =====================================================
function rysujEfekty() {
  for (const e of efekty) {
    if (e.t < 0) continue;
    const f = e.t / e.dlugosc; // od 0 do 1
    ctx.globalAlpha = Math.max(0, 1 - f);
    if (e.typ === 'napis') {
      napisZObwodka(e.tekst, e.x, e.y - f * 40, L.fs * (e.duzy ? 1.9 : 1.2), e.kolor, 4);
    } else if (e.typ === 'gwiazdka') {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.t * 6);
      gwiazda(0, 0, e.r, '#ffd23f');
      ctx.restore();
    } else if (e.typ === 'kropla') {
      kolo(e.x, e.y, e.r, '#bfe6ff');
    } else if (e.typ === 'fala') {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const r = e.r * (0.3 + f * 1.2);
      ctx.ellipse(e.x, e.y, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.typ === 'puf') {
      kolo(e.x, e.y, e.r * (1 + f * 1.5), 'rgba(235,235,245,0.55)');
    } else if (e.typ === 'auc') {
      rysujZabe(e.x, e.y, L.pole * 0.82 * (1 - f * 0.3), e.kat, 0);
    } else if (e.typ === 'odlot') {
      rysujMuchePostac(e.x, e.y, L.pole * 1.6, e.zlota);
    } else if (e.typ === 'pojawienie') {
      ctx.strokeStyle = '#3ddc97';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (0.4 + f), 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.typ === 'start') {
      ctx.save();
      ctx.translate(L.W / 2, L.planszaY + L.planszaH * 0.42);
      ctx.scale(1 + f * 0.6, 1 + f * 0.6);
      napisZObwodka('Skacz!', 0, 0, L.fs * 4, '#3ddc97', 8);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function rysujNapisPoziomu() {
  if (napisPoziomu <= 0) return;
  const y = L.planszaY + L.planszaH * 0.4;
  ctx.globalAlpha = Math.min(1, napisPoziomu / 0.4);
  napisZObwodka(`Poziom ${poziom}!`, L.W / 2, y, L.fs * 2.4, '#ffd23f');
  napisZObwodka(opisPoziomu, L.W / 2, y + L.fs * 2.4, L.fs * 1.2, '#ffffff', 4);
  ctx.globalAlpha = 1;
}

// Po wskoczeniu do stawu ekran na chwilę ciemnieje i pojawia się nowa plansza
function rysujPrzejscie() {
  if (przejscie <= 0) return;
  let alfa = 0;
  if (przejscie > 0.7) alfa = ogranicz((1.0 - przejscie) / 0.3, 0, 1);
  else alfa = ogranicz((przejscie - 0.4) / 0.3, 0, 1);
  if (alfa <= 0) return;
  ctx.fillStyle = `rgba(11, 16, 38, ${alfa})`;
  ctx.fillRect(0, L.hudH, L.W, L.H - L.hudH);
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

  // Serca (życia) – złota mucha może dodać serce, więc czasem jest ich więcej
  const ileSerc = Math.max(USTAWIENIA.zycia, zycia);
  const s = 24;
  for (let i = 0; i < ileSerc; i++) {
    const cx = hudX + 16 + s / 2 + i * (s + 8);
    serce(cx, hudH / 2 - s / 2 + 1, s, s, i < zycia ? '#ff4d6d' : 'rgba(255,255,255,0.15)');
  }
  const lewaSzer = 16 + ileSerc * (s + 8);

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

  // Na środku: poziom i zjedzone muchy
  const miejsce = hudW - 2 * Math.max(lewaSzer, prawaSzer) - 12;
  if (miejsce > 40) {
    ctx.textAlign = 'center';
    const glowny = stan === 'start' ? 'Żabi skok' : `Poziom ${poziom}`;
    ctx.font = czcionka(fs * 1.05, true);
    ctx.fillStyle = '#e4ddff';
    ctx.fillText(glowny, W / 2, hudH * 0.36);
    const drugi = `Muchy: ${muchyZjedzone}${wyciszone ? ' · dźwięk wył. (M)' : ''}`;
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
  const U = USTAWIENIA;
  rysujOkienko([
    { tekst: 'Żabi skok', rozmiar: fs * 2.1, gruba: true, kolor: '#3ddc97' },
    { odstep: fs * 0.6 },
    { tekst: 'Pomóż żabce dojść do stawu!', rozmiar: fs },
    { tekst: 'Skacz przez ulice i uważaj na auta.', rozmiar: fs },
    { odstep: fs * 0.6 },
    { tekst: 'Sterowanie: ← ↑ → ↓  albo  W A S D', rozmiar: fs * 1.1, gruba: true, kolor: '#4cc9f0' },
    { tekst: 'na telefonie: przesuń palcem albo stuknij obok żabki', rozmiar: fs * 0.85, kolor: '#a9a3d9' },
    { odstep: fs * 0.6 },
    { tekst: `Skok do przodu ${U.punktyZaSkok} pkt · mucha ${U.punktyZaMuche} pkt · staw ${U.punktyZaStaw} pkt`, rozmiar: fs * 0.9, kolor: '#ffd23f' },
    { tekst: 'Złota mucha daje dodatkowe serce!', rozmiar: fs * 0.9, kolor: '#ffc93c' },
    { tekst: `Masz ${n} ${slowoZycia(n)}. Każde potrącenie zabiera jedno.`, rozmiar: fs * 0.9, kolor: '#ff8fa3' },
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
    { tekst: 'Kliknij albo naciśnij SPACJĘ, żeby skakać dalej', rozmiar: fs, gruba: true, kolor: '#ffffff', alfa: migotanie() },
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
    { tekst: 'Koniec gry!', rozmiar: fs * 2.1, gruba: true, kolor: '#3ddc97' },
    { odstep: fs * 0.5 },
    { tekst: `Punkty: ${punkty}`, rozmiar: fs * 1.7, gruba: true, kolor: '#ffd23f' },
    nowyRekord
      ? { tekst: 'Nowy rekord!', rozmiar: fs * 1.2, gruba: true, kolor: '#3ddc97' }
      : { tekst: `Rekord: ${rekord} pkt`, rozmiar: fs, kolor: '#a9a3d9' },
    { tekst: `Poziom: ${poziom} · zjedzone muchy: ${muchyZjedzone}`, rozmiar: fs, kolor: '#a9a3d9' },
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
    const m = (trzesienie / 0.35) * 7;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  rysujTlo();
  rysujPojazdy();
  rysujBokiPlanszy();
  if (stan !== 'koniec' && ranna <= 0) rysujZabeGracza();
  if (mucha) rysujMuche();
  rysujEfekty();
  rysujNapisPoziomu();
  ctx.restore();
  rysujPrzejscie();

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

  if (stan !== 'pauza') {
    aktualizujRuch(dt);              // auta jeżdżą też na ekranie startowym i po końcu gry
    if (stan === 'gra') aktualizujGre(dt);
    aktualizujEfekty(dt);
  }
  rysuj();

  requestAnimationFrame(petla);
}

dopasujRozmiar();
zbudujPoziom();
requestAnimationFrame(petla);
