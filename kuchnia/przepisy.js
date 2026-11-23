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
//   wybierz   – wybierasz jedną z kilku rzeczy (np. czym posmarować naleśnika);
//               opcje: lista { skladnik, krok } – krok to, co się potem robi
//   galki     – nakładasz gałki lodów (stukasz w pudełka)
//   dekoruj   – posypujesz i dekorujesz lody
//   gofrownica – wylewasz ciasto do gofrownicy, zamykasz ją i otwierasz, kiedy dzwoni
//
//  naczynie przy kroku – zmienia naczynie (np. makaron z garnka na talerz)
//  grupa: 'zupy' – przepis jest w książce pod kartą „Zupy”
//
//  tekst – to mówi i pokazuje gra przy danym kroku


// ---------- SKŁADNIKI ----------
// obrazek: emotka albo nazwa z gwiazdką (*), wtedy gra rysuje go sama
// kolor: jaki kolor ma sok / kawałki tego składnika
// nazwa: jak się nazywa (gra mówi ją, gdy wrzucisz coś nie tak)
// rodzaj: 'plyn' (wlewa się), 'polewa' (polewa wierzch), 'sypkie' (sypie się)
// sloik: to się nakłada łyżką albo sypie (w Mojej potrawie robi plamę albo polewę, a nie leży w całości)
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
  miod:       { obrazek: '🍯', kolor: '#f2b33d', nazwa: 'Miód', rodzaj: 'polewa', sloik: true },
  lod:        { obrazek: '🧊', kolor: '#d8f3ff', nazwa: 'Lód' },
  chleb:      { obrazek: '🍞', kolor: '#e0a85a', nazwa: 'Chleb' },
  woda:       { obrazek: '*woda', kolor: '#c4e9f8', nazwa: 'Woda', rodzaj: 'plyn' },
  maka:       { obrazek: '*maka', kolor: '#fbf7ee', nazwa: 'Mąka', rodzaj: 'sypkie' },
  sol:        { obrazek: '*sol', kolor: '#ffffff', nazwa: 'Sól', rodzaj: 'sypkie' },
  sos:        { obrazek: '*sos', kolor: '#d8321f', nazwa: 'Sos pomidorowy' },
  dzem:       { obrazek: '*dzem', kolor: '#d61f4a', nazwa: 'Dżem' },
  salami:     { obrazek: '*salami', kolor: '#c0392b', nazwa: 'Salami' },
  ogorek:     { obrazek: '🥒', kolor: '#7cb342', nazwa: 'Ogórek' },
  burak:      { obrazek: '*burak', kolor: '#9b1b3f', nazwa: 'Burak' },
  czosnek:    { obrazek: '🧄', kolor: '#f3ece0', nazwa: 'Czosnek' },
  cebula:     { obrazek: '🧅', kolor: '#e8c08a', nazwa: 'Cebula' },
  kurczak:    { obrazek: '🍗', kolor: '#e0a25a', nazwa: 'Kurczak' },
  kielbasa:   { obrazek: '*kielbasa', kolor: '#b5533c', nazwa: 'Kiełbasa' },
  jajkoGot:   { obrazek: '*jajkoGot', kolor: '#fff6d8', nazwa: 'Jajko na twardo' },
  makaron:    { obrazek: '*makaron', kolor: '#f2d06b', nazwa: 'Makaron' },
  smietana:   { obrazek: '*smietana', kolor: '#fffaf0', nazwa: 'Śmietana', rodzaj: 'plyn', sloik: true },
  pulpet:     { obrazek: '*pulpet', kolor: '#8a4b2a', nazwa: 'Klopsik' },
  krem:       { obrazek: '*krem', kolor: '#5a3220', nazwa: 'Krem czekoladowy', sloik: true },
  cukier:     { obrazek: '*cukier', kolor: '#ffffff', nazwa: 'Cukier puder', sloik: true },
  bitaSmietana: { obrazek: '*bitaSmietana', kolor: '#ffffff', nazwa: 'Bita śmietana' },

  // Dodatki do lodów
  posypka:     { obrazek: '*posypka', kolor: '#ff7eb6', nazwa: 'Kolorowa posypka', sloik: true },
  posypkaCzek: { obrazek: '*posypkaCzek', nazwa: 'Czekoladowa posypka' },
  sosCzek:     { obrazek: '*sosCzek', kolor: '#5a3220', nazwa: 'Sos czekoladowy' },
  sosTrusk:    { obrazek: '*sosTrusk', kolor: '#e8304a', nazwa: 'Sos truskawkowy' },
  wisienka:    { obrazek: '🍒', kolor: '#c8102e', nazwa: 'Wisienka' },
  wafelek:     { obrazek: '*wafelek', kolor: '#e2a860', nazwa: 'Wafelek' },

  // Śmieszne rzeczy, których się nie je – leżą na blacie i w spiżarni (dla zabawy!)
  // fuj: co mówią przyjaciele, kiedy ktoś im to ugotuje
  skarpetka:  { obrazek: '🧦', kolor: '#8fb3d9', nazwa: 'Skarpetka', niejadalne: true,
                fuj: ['Fuuu! To smakuje jak stara skarpeta!', 'Bleee! Śmierdząca skarpeta!'] },
  but:        { obrazek: '👟', kolor: '#4a90d9', nazwa: 'But', niejadalne: true,
                fuj: ['Bleee! To smakuje jak stary but!', 'Fuj! Gumowa podeszwa!'] },
  szalik:     { obrazek: '🧣', kolor: '#e74c3c', nazwa: 'Szalik', niejadalne: true,
                fuj: ['Fuj! Szalik drapie mnie w język!', 'Bleee! Pełno włóczki w buzi!'] },
  kartka:     { obrazek: '📄', kolor: '#f2f2f2', nazwa: 'Kartka papieru', niejadalne: true,
                fuj: ['Bleee! To smakuje jak papier!', 'Fuj! Sucha kartka!'] },
  kredka:     { obrazek: '🖍️', kolor: '#ff9f1c', nazwa: 'Kredka', niejadalne: true,
                fuj: ['Fuj! Mam kolorowy język!', 'Bleee! Kredki są do rysowania!'] },
  mis:        { obrazek: '🧸', kolor: '#b5733c', nazwa: 'Miś', niejadalne: true,
                fuj: ['Ojej! Misia się nie je!', 'Fuj! Pluszowe futerko!'] },
  pilka:      { obrazek: '⚽', kolor: '#dddddd', nazwa: 'Piłka', niejadalne: true,
                fuj: ['Bleee! Gumowa piłka!', 'Fuj! Twarde jak piłka!'] },
};

// Co jeszcze może leżeć na blacie, żeby było z czego wybierać
const NA_BLACIE = ['ziemniak', 'brokul', 'chleb', 'gruszka', 'cytryna', 'winogrona', 'but', 'skarpetka', 'mis', 'pilka', 'szalik', 'kartka', 'kredka'];


// ---------- PRZEPISY ----------
// naczynie: 'garnek' | 'miska' | 'patelnia' | 'pizza' | 'dzbanek'
// porcja: jak podajemy przyjaciołom: 'miseczka' | 'nalesnik' | 'pizza' | 'szklanka'
// kolor: jaki kolor ma gotowa potrawa
// wPorcji: jakie kawałki widać w porcji
const PRZEPISY = [
  // ---------- ZUPY (w książce pod kartą „Zupy”) ----------
  {
    id: 'zupa',
    grupa: 'zupy',
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
    id: 'rosol',
    grupa: 'zupy',
    nazwa: 'Rosół',
    naczynie: 'garnek',
    porcja: 'miseczka',
    kolor: '#f2c14e',
    wPorcji: ['makaron', 'marchewka', 'pietruszka'],
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'wrzuc', skladnik: 'kurczak', ile: 1, tekst: 'Znajdź kurczaka i wrzuć go do garnka' },
      { co: 'kroj', skladnik: 'marchewka', ile: 3, tekst: 'Pokrój marchewkę' },
      { co: 'wrzuc', skladnik: 'pietruszka', ile: 1, tekst: 'Znajdź pietruszkę i wrzuć ją do garnka' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'wrzuc', skladnik: 'makaron', ile: 1, tekst: 'Dodaj makaron' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj rosół łyżką' },
    ],
  },
  {
    id: 'ogorkowa',
    grupa: 'zupy',
    nazwa: 'Ogórkowa',
    naczynie: 'garnek',
    porcja: 'miseczka',
    kolor: '#d4d79a',
    wPorcji: ['ogorek', 'ziemniak', 'marchewka'],
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'kroj', skladnik: 'ziemniak', ile: 3, tekst: 'Pokrój ziemniaka' },
      { co: 'kroj', skladnik: 'ogorek', ile: 3, tekst: 'Pokrój ogórka' },
      { co: 'kroj', skladnik: 'marchewka', ile: 2, tekst: 'Pokrój marchewkę' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'polej', skladnik: 'smietana', tekst: 'Dodaj śmietanę' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj zupę łyżką' },
    ],
  },
  {
    id: 'barszcz',
    grupa: 'zupy',
    nazwa: 'Barszcz czerwony',
    naczynie: 'garnek',
    porcja: 'miseczka',
    kolor: '#a3123a',
    wPorcji: ['burak', 'marchewka'],
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'kroj', skladnik: 'burak', ile: 3, tekst: 'Pokrój buraka' },
      { co: 'kroj', skladnik: 'marchewka', ile: 2, tekst: 'Pokrój marchewkę' },
      { co: 'wrzuc', skladnik: 'czosnek', ile: 1, tekst: 'Znajdź czosnek i wrzuć go do garnka' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj barszcz łyżką' },
    ],
  },
  {
    id: 'zurek',
    grupa: 'zupy',
    nazwa: 'Żurek',
    naczynie: 'garnek',
    porcja: 'miseczka',
    kolor: '#e3d3ad',
    wPorcji: ['jajkoGot', 'kielbasa', 'ziemniak'],
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'kroj', skladnik: 'kielbasa', ile: 3, tekst: 'Pokrój kiełbasę' },
      { co: 'kroj', skladnik: 'ziemniak', ile: 3, tekst: 'Pokrój ziemniaka' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'polej', skladnik: 'smietana', tekst: 'Dodaj śmietanę' },
      { co: 'kroj', skladnik: 'jajkoGot', ile: 1, tekst: 'Przekrój jajko na pół' },
      { co: 'mieszaj', ile: 2, tekst: 'Zamieszaj żurek łyżką' },
    ],
  },

  // ---------- INNE POTRAWY ----------
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
      {
        co: 'wybierz',
        tekst: 'Czym posmarować naleśnika? Wybierz!',
        tekstPotem: 'Coś jeszcze? Wybierz albo stuknij Gotowe',
        opcje: [
          { skladnik: 'dzem', krok: { co: 'smaruj', skladnik: 'dzem', tekst: 'Posmaruj naleśnika dżemem. Maluj palcem!' } },
          { skladnik: 'krem', krok: { co: 'smaruj', skladnik: 'krem', tekst: 'Posmaruj naleśnika kremem czekoladowym!' } },
          { skladnik: 'cukier', krok: { co: 'smaruj', skladnik: 'cukier', tekst: 'Posyp naleśnika cukrem pudrem. Maluj palcem!' } },
        ],
      },
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
    id: 'gofry',
    nazwa: 'Gofry',
    naczynie: 'miska',
    porcja: 'gofr',
    kolor: '#f3dc9b',
    wybrane: ['bitaSmietana', 'truskawka'],   // tak wyglądają na karcie w książce
    kroki: [
      { co: 'jajko', skladnik: 'jajko', ile: 3, tekst: 'Rozbij jajko. Stukaj w nie!' },
      { co: 'polej', skladnik: 'mleko', tekst: 'Wlej mleko do miski' },
      { co: 'polej', skladnik: 'maka', tekst: 'Wsyp mąkę' },
      { co: 'mieszaj', ile: 3, tekst: 'Wymieszaj ciasto', przybor: 'trzepaczka' },
      { co: 'gofrownica', naczynie: 'gofrownica', tekst: 'Wylej ciasto do gofrownicy. Stuknij w nią!' },
      {
        co: 'wybierz',
        naczynie: 'gofr',
        tekst: 'Co położyć na gofrze? Wybierz!',
        tekstPotem: 'Coś jeszcze? Wybierz albo stuknij Gotowe',
        opcje: [
          { skladnik: 'bitaSmietana', krok: { co: 'uloz', skladnik: 'bitaSmietana', ile: 3, tekst: 'Połóż bitą śmietanę. Stukaj w gofra!' } },
          { skladnik: 'truskawka', krok: { co: 'uloz', skladnik: 'truskawka', ile: 4, tekst: 'Połóż truskawki. Stukaj w gofra!' } },
          { skladnik: 'jagody', krok: { co: 'uloz', skladnik: 'jagody', ile: 4, tekst: 'Połóż jagody. Stukaj w gofra!' } },
          { skladnik: 'krem', krok: { co: 'smaruj', skladnik: 'krem', tekst: 'Posmaruj gofra kremem czekoladowym!' } },
          { skladnik: 'cukier', krok: { co: 'smaruj', skladnik: 'cukier', tekst: 'Posyp gofra cukrem pudrem. Maluj palcem!' } },
        ],
      },
    ],
  },
  {
    id: 'spaghetti',
    nazwa: 'Spaghetti',
    naczynie: 'garnek',
    porcja: 'spaghetti',
    kolor: '#d8321f',
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'wrzuc', skladnik: 'makaron', ile: 1, tekst: 'Znajdź makaron i wrzuć go do garnka' },
      { co: 'polej', skladnik: 'sol', tekst: 'Posól wodę' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'smaruj', skladnik: 'sos', naczynie: 'talerz', tekst: 'Polej makaron sosem. Maluj palcem!' },
      { co: 'smaruj', skladnik: 'ser', tekst: 'Posyp spaghetti serem' },
      { co: 'uloz', skladnik: 'pulpet', ile: 3, tekst: 'Połóż na makaronie klopsiki' },
    ],
  },
  {
    id: 'lody',
    nazwa: 'Lody',
    naczynie: 'rozek',
    porcja: 'lody',
    kolor: null,
    galki: ['#ff9fb5', '#7b4a2a', '#b8db8a'],   // tak wyglądają na karcie w książce
    wisienka: true,
    kroki: [
      { co: 'galki', ile: 3, tekst: 'Wybierz smaki lodów! Stuknij w pudełko' },
      { co: 'dekoruj', tekst: 'Udekoruj lody! Stuknij, co chcesz' },
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
// ulubione: co każdy najbardziej lubi (składniki i smaki lodów).
// Jak to jest w potrawie, przyjaciel pokazuje to w chmurce i bardzo się cieszy.
const PRZYJACIELE = [
  { typ: 'panda', imie: 'Panda', glos: 0.9, mowi: 'Pycha!', ulubione: ['jablko', 'pistacjowe', 'ogorek'] },
  { typ: 'jez', imie: 'Jeżyk', glos: 1.6, mowi: 'Mniam, mniam!', ulubione: ['pieczarka', 'jagody', 'jagodowe', 'jablko'] },
  { typ: 'malpka', imie: 'Małpka', glos: 1.8, mowi: 'Pyszne!', ulubione: ['banan', 'czekoladowe', 'krem'] },
  { typ: 'kotek', imie: 'Kotek', glos: 1.5, mowi: 'Dziękuję!', ulubione: ['smietana', 'bitaSmietana', 'mleko', 'ser', 'waniliowe'] },
  { typ: 'piesek', imie: 'Piesek', glos: 1.2, mowi: 'Super!', ulubione: ['kielbasa', 'pulpet', 'kurczak', 'salami', 'truskawkowe'] },
];

const POCHWALY = ['Super!', 'Brawo!', 'Świetnie!', 'Pięknie!', 'Ekstra!', 'Wspaniale!'];


// =====================================================
//   MOJA POTRAWA – gotujesz z czego chcesz!
// =====================================================

// Jak coś smakuje: 'slodki' (owoce), 'slony' (warzywa, wędlina),
// 'neutralny' (pasuje do wszystkiego), 'zimny' (pasuje tylko do soku)
// 'zimny' (pasuje tylko do soku i lodów). Rzeczy niejadalne zawsze smakują okropnie!
const SMAKI = {
  pomidor: 'slony', marchewka: 'slony', pietruszka: 'slony', ziemniak: 'slony',
  brokul: 'slony', pieczarka: 'slony', salami: 'slony', ogorek: 'slony', burak: 'slony',
  czosnek: 'slony', cebula: 'slony', kurczak: 'slony', kielbasa: 'slony', pulpet: 'slony',
  jajkoGot: 'slony',
  banan: 'slodki', jablko: 'slodki', truskawka: 'slodki', jagody: 'slodki',
  winogrona: 'slodki', pomarancza: 'slodki', cytryna: 'slodki', gruszka: 'slodki',
  krem: 'slodki', miod: 'slodki', cukier: 'slodki', bitaSmietana: 'slodki', posypka: 'slodki', wisienka: 'slodki',
  ser: 'neutralny', chleb: 'neutralny', makaron: 'neutralny', smietana: 'neutralny',
  lod: 'zimny',
};

// Warzywa, z których też robi się sok (sok marchewkowy jest pyszny!)
const DO_SOKU_TEZ = ['pomidor', 'marchewka', 'burak'];

// Spiżarnia ma zakładki – w każdej najwyżej 12 rzeczy
const ZAKLADKI_SPIZARNI = [
  { ikona: '🥕', nazwa: 'Warzywa', skladniki: ['pomidor', 'marchewka', 'ziemniak', 'ogorek', 'brokul', 'pieczarka', 'burak', 'cebula', 'czosnek', 'pietruszka'] },
  { ikona: '🍎', nazwa: 'Owoce', skladniki: ['banan', 'jablko', 'truskawka', 'jagody', 'winogrona', 'pomarancza', 'gruszka', 'cytryna'] },
  { ikona: '🧀', nazwa: 'Inne', skladniki: ['ser', 'salami', 'kielbasa', 'kurczak', 'pulpet', 'jajkoGot', 'makaron', 'chleb', 'smietana', 'lod'] },
  { ikona: '🍰', nazwa: 'Słodkie', skladniki: ['krem', 'miod', 'cukier', 'bitaSmietana', 'posypka', 'wisienka'] },
  { ikona: '🧦', nazwa: 'Śmieszne rzeczy', skladniki: ['skarpetka', 'but', 'szalik', 'kartka', 'kredka', 'mis', 'pilka'] },
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
    typ: 'spaghetti', nazwa: 'Moje spaghetti', naczynie: 'garnek', porcja: 'spaghetti', kolor: '#d8321f',
    gdzie: 'na spaghetti', smak: 'slony',
    kroki: [
      { co: 'polej', skladnik: 'woda', tekst: 'Nalej wody do garnka' },
      { co: 'wrzuc', skladnik: 'makaron', ile: 1, tekst: 'Znajdź makaron i wrzuć go do garnka' },
      { co: 'gotuj', tekst: 'Włącz kuchenkę' },
      { co: 'smaruj', skladnik: 'sos', naczynie: 'talerz', tekst: 'Polej makaron sosem. Maluj palcem!' },
      { co: 'dowolne', tekst: 'Połóż na makaronie, co chcesz!' },
    ],
  },
  {
    typ: 'gofry', nazwa: 'Moje gofry', naczynie: 'gofrownica', porcja: 'gofr', kolor: '#f3dc9b',
    gdzie: 'na gofrze', smak: 'slodki',
    kroki: [
      { co: 'gofrownica', tekst: 'Wylej ciasto do gofrownicy. Stuknij w nią!' },
      { co: 'dowolne', naczynie: 'gofr', tekst: 'Połóż na gofrze, co chcesz!' },
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
  {
    typ: 'lody', nazwa: 'Moje lody', naczynie: 'rozek', porcja: 'lody', kolor: null,
    gdzie: 'na lodach', smak: 'slodki',
    kroki: [
      { co: 'galki', ile: 3, tekst: 'Wybierz smaki lodów! Stuknij w pudełko' },
      { co: 'dowolne', tekst: 'Połóż na lodach, co chcesz!' },
    ],
  },
];

// Co mówią przyjaciele, kiedy coś im nie smakuje
const FUJ = ['Bleee!', 'Fuj!', 'Ojej!', 'Dziwne!', 'Brrr!'];


// =====================================================
//   LODY
// =====================================================
// Smaki lodów: kolor gałki i obrazek na pudełku
const SMAKI_LODOW = [
  { id: 'waniliowe', nazwa: 'Waniliowe', kolor: '#fff1c1', ikona: '🍦' },
  { id: 'czekoladowe', nazwa: 'Czekoladowe', kolor: '#7b4a2a', ikona: '🍫' },
  { id: 'truskawkowe', nazwa: 'Truskawkowe', kolor: '#ff9fb5', ikona: '🍓' },
  { id: 'pistacjowe', nazwa: 'Pistacjowe', kolor: '#b8db8a', ikona: '🥜' },
  { id: 'mietowe', nazwa: 'Miętowe', kolor: '#9fe8d2', ikona: '🌿' },
  { id: 'jagodowe', nazwa: 'Jagodowe', kolor: '#a99ae8', ikona: '🫐' },
];

// Czym można udekorować lody
const DEKORACJE_LODOW = ['posypka', 'posypkaCzek', 'sosCzek', 'sosTrusk', 'wisienka', 'wafelek'];
