'use strict';

// =====================================================
//   KUCHNIA HELENKI – przepisy i składniki
// =====================================================
//
//  Tu możesz dopisać nowy przepis albo zmienić stary!
//  Każdy przepis to lista kroków. Rodzaje kroków:
//
//   kroj      – pokrój składnik (stukaj w niego), a potem wrzuć kawałki do naczynia
//               ile: ile razy trzeba przekroić
//   wrzuc     – znajdź właściwy składnik na blacie i przeciągnij go do naczynia
//               ile: ile sztuk trzeba wrzucić
//   polej     – przeciągnij butelkę / solniczkę / torebkę nad naczynie
//   jajko     – stukaj w jajko, aż pęknie
//   mieszaj   – kręć palcem w kółko w naczyniu
//               ile: ile kółek trzeba zrobić
//   gotuj     – włącz kuchenkę i poczekaj (można łapać bąbelki!)
//   smaz      – usmaż naleśnika i przewróć go w powietrzu
//   walkuj    – rozwałkuj ciasto (jeździj palcem tam i z powrotem)
//   smaruj    – maluj palcem po cieście (sos, ser, dżem)
//   uloz      – połóż dodatki na pizzy
//   piecz     – włóż pizzę do piekarnika
//   wyciskaj  – kręć pomarańczą na wyciskarce
//
//  tekst – to mówi i pokazuje gra przy danym kroku


// ---------- SKŁADNIKI ----------
// obrazek: emotka albo nazwa z gwiazdką (*), wtedy gra rysuje go sama
// kolor: jaki kolor ma sok / kawałki tego składnika
// nazwa: jak się nazywa (gra mówi ją, gdy wrzucisz coś nie tak)
// rodzaj: 'plyn' (wlewa się), 'polewa' (polewa wierzch), 'sypkie' (sypie się)
const SKLADNIKI = {
  pomidor:    { obrazek: '🍅', kolor: '#e8432e', nazwa: 'Pomidor' },
  marchewka:  { obrazek: '🥕', kolor: '#f28b1e', nazwa: 'Marchewka' },
  pietruszka: { obrazek: '🌿', kolor: '#3aa84a', nazwa: 'Pietruszka' },
  ziemniak:   { obrazek: '🥔', kolor: '#d9a95b', nazwa: 'Ziemniak' },
  banan:      { obrazek: '🍌', kolor: '#ffe066', nazwa: 'Banan' },
  jablko:     { obrazek: '🍎', kolor: '#f3e3b5', nazwa: 'Jabłko' },
  truskawka:  { obrazek: '🍓', kolor: '#e8304a', nazwa: 'Truskawka' },
  jagody:     { obrazek: '🫐', kolor: '#4b5bb5', nazwa: 'Jagody' },
  winogrona:  { obrazek: '🍇', kolor: '#8e4fb8', nazwa: 'Winogrona' },
  pomarancza: { obrazek: '🍊', kolor: '#ffa62b', nazwa: 'Pomarańcza' },
  cytryna:    { obrazek: '🍋', kolor: '#ffe14d', nazwa: 'Cytryna' },
  gruszka:    { obrazek: '🍐', kolor: '#c9dd6a', nazwa: 'Gruszka' },
  brokul:     { obrazek: '🥦', kolor: '#3d9a3d', nazwa: 'Brokuł' },
  pieczarka:  { obrazek: '*pieczarka', kolor: '#e9d8c4', nazwa: 'Pieczarka' },
  ser:        { obrazek: '🧀', kolor: '#ffd447', nazwa: 'Ser' },
  jajko:      { obrazek: '🥚', kolor: '#fff6d8', nazwa: 'Jajko' },
  mleko:      { obrazek: '🥛', kolor: '#fbfbf6', nazwa: 'Mleko', rodzaj: 'plyn' },
  miod:       { obrazek: '🍯', kolor: '#f2b33d', nazwa: 'Miód', rodzaj: 'polewa' },
  lod:        { obrazek: '🧊', kolor: '#d8f3ff', nazwa: 'Lód' },
  chleb:      { obrazek: '🍞', kolor: '#e0a85a', nazwa: 'Chleb' },
  woda:       { obrazek: '*woda', kolor: '#c4e9f8', nazwa: 'Woda', rodzaj: 'plyn' },
  maka:       { obrazek: '*maka', kolor: '#fbf7ee', nazwa: 'Mąka', rodzaj: 'sypkie' },
  sol:        { obrazek: '*sol', kolor: '#ffffff', nazwa: 'Sól', rodzaj: 'sypkie' },
  sos:        { obrazek: '*sos', kolor: '#d8321f', nazwa: 'Sos pomidorowy' },
  dzem:       { obrazek: '*dzem', kolor: '#d61f4a', nazwa: 'Dżem' },
  salami:     { obrazek: '*salami', kolor: '#c0392b', nazwa: 'Salami' },

  // Śmieszne rzeczy, których się nie je – gra czasem kładzie je na blacie
  but:        { obrazek: '👟', nazwa: 'But', niejadalne: true },
  skarpetka:  { obrazek: '🧦', nazwa: 'Skarpetka', niejadalne: true },
  mis:        { obrazek: '🧸', nazwa: 'Miś', niejadalne: true },
  pilka:      { obrazek: '⚽', nazwa: 'Piłka', niejadalne: true },
};

// Co jeszcze może leżeć na blacie, żeby było z czego wybierać
const NA_BLACIE = ['ziemniak', 'brokul', 'chleb', 'gruszka', 'cytryna', 'winogrona', 'but', 'skarpetka', 'mis', 'pilka'];


// ---------- PRZEPISY ----------
// naczynie: 'garnek' | 'miska' | 'patelnia' | 'pizza' | 'dzbanek'
// porcja: jak podajemy przyjaciołom: 'miseczka' | 'nalesnik' | 'pizza' | 'szklanka'
// kolor: jaki kolor ma gotowa potrawa
// wPorcji: jakie kawałki widać w porcji
const PRZEPISY = [
  {
    id: 'zupa',
    nazwa: 'Zupa pomidorowa',
    naczynie: 'garnek',
    porcja: 'miseczka',
    kolor: '#e0452b',
    wPorcji: ['marchewka', 'pomidor', 'pietruszka'],
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'kroj', skladnik: 'pomidor', ile: 3, tekst: 'Pokrój pomidora' },
      { co: 'kroj', skladnik: 'marchewka', ile: 3, tekst: 'Pokrój marchewkę' },
      { co: 'wrzuc', skladnik: 'pietruszka', ile: 1, tekst: 'Znajdź pietruszkę i wrzuć ją do garnka' },
      { co: 'polej', skladnik: 'sol', tekst: 'Posól zupę' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'mieszaj', ile: 3, tekst: 'Zamieszaj zupę łyżką' },
    ],
  },
  {
    id: 'nalesniki',
    nazwa: 'Naleśniki',
    naczynie: 'miska',
    porcja: 'nalesnik',
    kolor: '#f3dc9b',
    kroki: [
      { co: 'jajko', skladnik: 'jajko', ile: 3, tekst: 'Rozbij jajko. Stukaj w nie!' },
      { co: 'polej', skladnik: 'mleko', tekst: 'Wlej mleko do miski' },
      { co: 'polej', skladnik: 'maka', tekst: 'Wsyp mąkę' },
      { co: 'mieszaj', ile: 3, tekst: 'Wymieszaj ciasto', przybor: 'trzepaczka' },
      { co: 'smaz', naczynie: 'patelnia', tekst: 'Wylej ciasto na patelnię. Stuknij w patelnię!' },
      { co: 'smaruj', skladnik: 'dzem', tekst: 'Posmaruj naleśnika dżemem. Maluj palcem!' },
    ],
  },
  {
    id: 'salatka',
    nazwa: 'Sałatka owocowa',
    naczynie: 'miska',
    porcja: 'miseczka',
    kolor: null,
    wPorcji: ['banan', 'truskawka', 'jagody'],
    kroki: [
      { co: 'kroj', skladnik: 'banan', ile: 3, tekst: 'Pokrój banana' },
      { co: 'kroj', skladnik: 'jablko', ile: 3, tekst: 'Pokrój jabłko' },
      { co: 'kroj', skladnik: 'truskawka', ile: 2, tekst: 'Pokrój truskawkę' },
      { co: 'wrzuc', skladnik: 'jagody', ile: 3, tekst: 'Znajdź jagody i wrzuć trzy do miski' },
      { co: 'polej', skladnik: 'miod', tekst: 'Polej owoce miodem' },
      { co: 'mieszaj', ile: 2, tekst: 'Wymieszaj sałatkę' },
    ],
  },
  {
    id: 'pizza',
    nazwa: 'Pizza',
    naczynie: 'pizza',
    porcja: 'pizza',
    kolor: '#f0c060',
    kroki: [
      { co: 'walkuj', tekst: 'Rozwałkuj ciasto. Jeździj palcem tam i z powrotem!' },
      { co: 'smaruj', skladnik: 'sos', tekst: 'Posmaruj ciasto sosem. Maluj palcem!' },
      { co: 'smaruj', skladnik: 'ser', tekst: 'Posyp pizzę serem' },
      { co: 'uloz', skladnik: 'pieczarka', ile: 4, tekst: 'Połóż na pizzy pieczarki' },
      { co: 'uloz', skladnik: 'salami', ile: 4, tekst: 'Połóż na pizzy salami' },
      { co: 'piecz', tekst: 'Włóż pizzę do piekarnika. Stuknij w piekarnik!' },
    ],
  },
  {
    id: 'sok',
    nazwa: 'Sok pomarańczowy',
    naczynie: 'dzbanek',
    porcja: 'szklanka',
    kolor: '#ffa62b',
    kroki: [
      { co: 'kroj', skladnik: 'pomarancza', ile: 1, tekst: 'Przekrój pomarańczę na pół', tekst2: 'Połóż pomarańczę na wyciskarce' },
      { co: 'wyciskaj', ile: 4, tekst: 'Wyciśnij sok. Kręć palcem w kółko!' },
      { co: 'wrzuc', skladnik: 'lod', ile: 3, tekst: 'Znajdź lód i wrzuć trzy kostki do dzbanka' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj sok' },
    ],
  },
];


// ---------- PRZYJACIELE ----------
// Kto przychodzi na obiad. glos: jak wysoko mówi (1 = zwykle, 2 = bardzo piskliwie)
const PRZYJACIELE = [
  { typ: 'panda', imie: 'Panda', glos: 0.9, mowi: 'Pycha!' },
  { typ: 'jez', imie: 'Jeżyk', glos: 1.6, mowi: 'Mniam, mniam!' },
  { typ: 'malpka', imie: 'Małpka', glos: 1.8, mowi: 'Pyszne!' },
  { typ: 'kotek', imie: 'Kotek', glos: 1.5, mowi: 'Dziękuję!' },
  { typ: 'piesek', imie: 'Piesek', glos: 1.2, mowi: 'Super!' },
];

const POCHWALY = ['Super!', 'Brawo!', 'Świetnie!', 'Pięknie!', 'Ekstra!', 'Wspaniale!'];


// =====================================================
//   MOJA POTRAWA – gotujesz z czego chcesz!
// =====================================================

// Jak coś smakuje: 'slodki' (owoce), 'slony' (warzywa, wędlina),
// 'neutralny' (pasuje do wszystkiego), 'zimny' (pasuje tylko do soku)
const SMAKI = {
  pomidor: 'slony', marchewka: 'slony', pietruszka: 'slony', ziemniak: 'slony',
  brokul: 'slony', pieczarka: 'slony', salami: 'slony',
  banan: 'slodki', jablko: 'slodki', truskawka: 'slodki', jagody: 'slodki',
  winogrona: 'slodki', pomarancza: 'slodki', cytryna: 'slodki', gruszka: 'slodki',
  ser: 'neutralny', chleb: 'neutralny',
  lod: 'zimny',
};

// Warzywa, z których też robi się sok (sok marchewkowy jest pyszny!)
const DO_SOKU_TEZ = ['pomidor', 'marchewka'];

// Co stoi w spiżarni – z tego wybierasz składniki do swojej potrawy
const SPIZARNIA = [
  'pomidor', 'marchewka', 'ziemniak', 'brokul', 'pieczarka', 'pietruszka',
  'ser', 'salami', 'chleb', 'banan', 'jablko', 'truskawka',
  'jagody', 'winogrona', 'pomarancza', 'gruszka', 'lod', 'skarpetka',
];

// Rodzaje własnych potraw.
// smak: jaki smak pasuje do tej potrawy ('slony', 'slodki' albo null = każdy, byle się nie mieszał)
// gdzie: jak się mówi, że coś jest w tej potrawie („Banan w zupie? Dziwne!”)
// Krok 'dowolne' to ten, w którym wrzucasz, co chcesz.
const WLASNE = [
  {
    typ: 'zupa', nazwa: 'Moja zupa', naczynie: 'garnek', porcja: 'miseczka', kolor: '#e8c170',
    gdzie: 'w zupie', smak: 'slony',
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'dowolne', tekst: 'Wrzuć do garnka, co chcesz!' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj zupę łyżką' },
    ],
  },
  {
    typ: 'pizza', nazwa: 'Moja pizza', naczynie: 'pizza', porcja: 'pizza', kolor: '#f0c060',
    gdzie: 'na pizzy', smak: 'slony',
    kroki: [
      { co: 'walkuj', tekst: 'Rozwałkuj ciasto. Jeździj palcem tam i z powrotem!' },
      { co: 'smaruj', skladnik: 'sos', tekst: 'Posmaruj ciasto sosem. Maluj palcem!' },
      { co: 'smaruj', skladnik: 'ser', tekst: 'Posyp pizzę serem' },
      { co: 'dowolne', tekst: 'Połóż na pizzy, co chcesz!' },
      { co: 'piecz', tekst: 'Włóż pizzę do piekarnika. Stuknij w piekarnik!' },
    ],
  },
  {
    typ: 'nalesniki', nazwa: 'Moje naleśniki', naczynie: 'patelnia', porcja: 'nalesnik', kolor: '#f3dc9b',
    gdzie: 'na naleśniku', smak: null,
    kroki: [
      { co: 'smaz', tekst: 'Stuknij w patelnię, żeby usmażyć naleśnika' },
      { co: 'dowolne', tekst: 'Połóż na naleśniku, co chcesz!' },
    ],
  },
  {
    typ: 'salatka', nazwa: 'Moja sałatka', naczynie: 'miska', porcja: 'miseczka', kolor: null,
    gdzie: 'w sałatce', smak: null,
    kroki: [
      { co: 'dowolne', tekst: 'Wrzuć do miski, co chcesz!' },
      { co: 'mieszaj', ile: 2, tekst: 'Wymieszaj sałatkę' },
    ],
  },
  {
    typ: 'sok', nazwa: 'Mój sok', naczynie: 'dzbanek', porcja: 'szklanka', kolor: '#ffa62b',
    gdzie: 'w soku', smak: 'slodki',
    kroki: [
      { co: 'dowolne', tekst: 'Wrzuć do dzbanka, co chcesz!' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj sok' },
    ],
  },
];

// Co mówią przyjaciele, kiedy coś im nie smakuje
const FUJ = ['Bleee!', 'Fuj!', 'Ojej!', 'Dziwne!', 'Brrr!'];
