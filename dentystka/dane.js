'use strict';

// =====================================================
//   DENTYSTKA HELENKA – pacjenci, narzędzia i naklejki
//   Tu możesz zmieniać, kto przychodzi do gabinetu
//   i co mówi gra.
// =====================================================

// Pacjenci w poczekalni.
//   nazwa    – jak się nazywa („Panda ma zdrowe ząbki!”)
//   wolacz   – jak się do niego mówi („Dzień dobry, pando!”)
//   dla      – „naklejka dla pandy”
//   jedzenie – co mu zostaje w ząbkach (emotki)
//   glos     – jak wysoko mówi „aaa” (1 = zwykle, więcej = piskliwie)
const PACJENCI = [
  { typ: 'panda',   nazwa: 'Panda',     wolacz: 'pando',     dla: 'pandy',     jedzenie: ['🌿', '🍙'], glos: 0.8 },
  { typ: 'jez',     nazwa: 'Jeżyk',     wolacz: 'jeżyku',    dla: 'jeżyka',    jedzenie: ['🍎', '🍄'], glos: 1.5 },
  { typ: 'malpka',  nazwa: 'Małpka',    wolacz: 'małpko',    dla: 'małpki',    jedzenie: ['🍌', '🥜'], glos: 1.2 },
  { typ: 'kotek',   nazwa: 'Kotek',     wolacz: 'kotku',     dla: 'kotka',     jedzenie: ['🐟', '🧀'], glos: 1.4 },
  { typ: 'piesek',  nazwa: 'Piesek',    wolacz: 'piesku',    dla: 'pieska',    jedzenie: ['🦴', '🍖'], glos: 1.0 },
  { typ: 'krolik',  nazwa: 'Króliczek', wolacz: 'króliczku', dla: 'króliczka', jedzenie: ['🥕', '🥬'], glos: 1.6 },
];

// Słodycze – od nich robią się dziurki w ząbkach!
const SLODYCZE = ['🍬', '🍭', '🍫'];

// Narzędzia na tacy (po kolei, od lewej).
//   biernik   – „Teraz weź ...”
//   polecenie – co mówi gra (zamiast {dziurke} wstawi „dziurkę” albo „dziurki”)
//   napis     – napis na górze ekranu
const NARZEDZIA = [
  { id: 'lusterko',    biernik: 'lusterko',     polecenie: 'Weź lusterko i obejrzyj wszystkie ząbki.',  napis: 'Obejrzyj ząbki lusterkiem',      kolor: '#4cc9f0' },
  { id: 'szczoteczka', biernik: 'szczoteczkę',  polecenie: 'Teraz szczoteczka! Umyj wszystkie ząbki.',   napis: 'Umyj ząbki szczoteczką',         kolor: '#ff7eb6' },
  { id: 'woda',        biernik: 'wodę',         polecenie: 'Spłucz pianę wodą.',                         napis: 'Spłucz pianę wodą',              kolor: '#3a86ff' },
  { id: 'ssak',        biernik: 'ssak',         polecenie: 'Teraz ssak. Wyssij całą wodę!',              napis: 'Wyssij wodę ssakiem',            kolor: '#8d99ae' },
  { id: 'wiertlo',     biernik: 'wiertło',      polecenie: 'Wyczyść {dziurke} wiertłem.',                napis: 'Wyczyść {dziurke} wiertłem',     kolor: '#9b5de5' },
  { id: 'plomba',      biernik: 'plombę',       polecenie: 'Zalep {dziurke} plombą.',                    napis: 'Zalep {dziurke} plombą',         kolor: '#f15bb5' },
  { id: 'lampka',      biernik: 'lampkę',       polecenie: 'Zaświeć lampką na plombę, żeby stwardniała.', napis: 'Zaświeć lampką na plombę',      kolor: '#00a6ed' },
  { id: 'kleszcze',    biernik: 'kleszcze',     polecenie: 'Ten ząbek się rusza. Wyciągnij go kleszczami!', napis: 'Wyciągnij ruszający się ząbek', kolor: '#f4a300' },
];

// Naklejki dla dzielnych pacjentów
const NAKLEJKI = ['⭐', '🌈', '🦄', '🌸', '🦋', '🦷'];

// Kolory plomb (tak, w tym gabinecie plomby są kolorowe!)
const KOLORY_PLOMB = ['#ff8fc8', '#7ad7ff', '#ffe066', '#b5f28c', '#c9a7ff'];

const POCHWALY = ['Super!', 'Brawo!', 'Świetnie!', 'Pięknie!', 'Doskonale!', 'Ekstra!'];

// Co mówi gra, kiedy zobaczy coś lusterkiem
const ZNALEZIONA_DZIURKA = 'Oj, dziurka! Za dużo cukierków!';
const ZNALEZIONY_RUSZAJACY = 'Ten ząbek się rusza!';
