'use strict';

// =====================================================
//   PIKSELE – obrazki narysowane literkami
// =====================================================
//
//  Każda literka to jeden piksel, a kropka to piksel przezroczysty.
//  Możesz przerysować bohatera, wroga albo przedmiot – zmień literki,
//  zapisz plik i odśwież grę (F5). Wszystkie linijki obrazka muszą być
//  tak samo długie!
//
//  Kolory bohaterów (włosy, koszulka...) ustawiasz w gra.js w BOHATEROWIE.
//  Literki u bohaterów:
//    k obrys   h włosy   s skóra   S skóra w cieniu   e oko   r buzia   R rumieniec
//    t koszulka   T koszulka w cieniu   y znaczek na koszulce
//    u spodenki/spódniczka   l nogi   b buty   o kokardka

const OBRYS = '#1d1630';

// ---------- GŁOWY BOHATERÓW (12 pikseli szerokości) ----------
const GLOWY = {
  seweryn: [
    '....k.k.k...',
    '...khkhkhk..',
    '..khhhhhhhk.',
    '.khhhhhhhhhk',
    'khhhhhhhhhhk',
    'khhhhshhshsk',
    'khhssssesesk',
    'khSssssesesk',
    'kkSsssssssRk',
    '.kSssssrrsk.',
  ],
  franek: [
    '..kk.kk.kk..',
    '.khhkhhkhhk.',
    'khhhhhhhhhhk',
    'khhhhhhhhhhk',
    'khhhhhhhhhhk',
    'khhhhhhhhssk',
    'khhssssesesk',
    'khhssssesesk',
    'kkhsssssssRk',
    '.kSssssrrsk.',
  ],
  helenka: [
    '....kkkkk...',
    'ooo.khhhhhk.',
    'oyokhhhhhhhk',
    'ooohhhhhhhhk',
    'khhhhhhhhhhk',
    'khhhhhhhshsk',
    'khhhsssesesk',
    'khhhsssesesk',
    'khhSssssssRk',
    'khhkSssrrsk.',
    'khhk........',
    'khhk........',
    '.khk........',
    '..k.........',
  ],
};

// ---------- CIAŁO BOHATERA (14 pikseli szerokości, wiersze 8–21) ----------
const CIALA = {
  stoi: [
    '..............',
    '..............',
    '....kttttk....',
    '...kttttttk...',
    '..kttttyyttk..',
    '..kTtttyyttk..',
    '..kTtttttttk..',
    '..ksuuuuuusk..',
    '...kuuuuuuk...',
    '....ll..ll....',
    '....ll..ll....',
    '....ll..ll....',
    '...bbbb.bbbb..',
    '...kkkk.kkkk..',
  ],
  bieg1: [
    '..............',
    '..............',
    '....kttttk....',
    '...kttttttk...',
    '..kttttyyttts.',
    '..kTtttyytk...',
    '.skTttttttk...',
    '...kuuuuuuk...',
    '...kuuuuuuk...',
    '...ll....ll...',
    '..ll......ll..',
    '..ll......ll..',
    'bbbb......bbbb',
    'kkkk......kkkk',
  ],
  bieg2: [
    '..............',
    '..............',
    '....kttttk....',
    '...kttttttk...',
    '..kttttyyttk..',
    '..kTtttyyttk..',
    '..kTtttttttk..',
    '..ksuuuuuusk..',
    '...kuuuuuuk...',
    '....ll.ll.....',
    '....ll..ll....',
    '....ll...ll...',
    '...bbbb..bbbb.',
    '...kkkk..kkkk.',
  ],
  skok: [
    '............s.',
    '...........ts.',
    '....kttttktk..',
    '...ktttttttk..',
    '..kttttyytk...',
    '..kTtttyytk...',
    '.skTtttttk....',
    '...kuuuuuuk...',
    '...kuuuuuuk...',
    '...ll..llll...',
    '...ll.....ll..',
    '..bbb....bbbb.',
    '..kkk....kkkk.',
    '..............',
  ],
  cieszy: [
    's............s',
    '.t..........t.',
    '..t.kttttk.t..',
    '...kttttttk...',
    '...ktttyytk...',
    '...kTttyytk...',
    '...kTtttttk...',
    '...kuuuuuuk...',
    '...kuuuuuuk...',
    '....ll..ll....',
    '....ll..ll....',
    '....ll..ll....',
    '...bbbb.bbbb..',
    '...kkkk.kkkk..',
  ],
  macha1: [
    '............s.',
    '...........ts.',
    '....kttttktk..',
    '...ktttttttk..',
    '..kttttyytk...',
    '..kTtttyytk...',
    '..kTttttttk...',
    '..ksuuuuuuk...',
    '...kuuuuuuk...',
    '....ll..ll....',
    '....ll..ll....',
    '....ll..ll....',
    '...bbbb.bbbb..',
    '...kkkk.kkkk..',
  ],
  macha2: [
    '.............s',
    '...........tt.',
    '....kttttkt...',
    '...ktttttttk..',
    '..kttttyytk...',
    '..kTtttyytk...',
    '..kTttttttk...',
    '..ksuuuuuuk...',
    '...kuuuuuuk...',
    '....ll..ll....',
    '....ll..ll....',
    '....ll..ll....',
    '...bbbb.bbbb..',
    '...kkkk.kkkk..',
  ],
};

// ---------- WROGOWIE ----------
// g – kolor glutka (zależy od krainy), G – ciemniejszy, L – jaśniejszy
const GLUTEK = [
  [
    '....kkkkkk....',
    '..kkggggggkk..',
    '.kgLLgggggggk.',
    'kgLkkggggkkggk',
    'kggwwggggwwggk',
    'kggwkggggwkggk',
    'kggggggggggggk',
    'kgggggkkgggggk',
    'kggggggggggggk',
    '.kGGGGGGGGGGk.',
    '..kkkkkkkkkk..',
  ],
  [
    '..............',
    '...kkkkkkkk...',
    '.kkgLLggggggkk',
    'kgLkkggggkkggk',
    'kggwwggggwwggk',
    'kggwkggggwkggk',
    'kggggggggggggk',
    'kgggggkkgggggk',
    'kggggggggggggk',
    'kGGGGGGGGGGGGk',
    '.kkkkkkkkkkkk.',
  ],
];

const JEZYK = [
  [
    '...k.k.k.k......',
    '..kakakakak.....',
    '.kaAaAaAaAak....',
    'kaAAAAAAAAAak...',
    'kAAAAAAAAAAcck..',
    'kAAAAAAAAAceckk.',
    'kAAAAAAAAAcccckk',
    '.kbbbbbbbbccck..',
    '.kbbbbbbbbbbk...',
    '..kkkkkkkkkk....',
    '...kk....kk.....',
  ],
  [
    '...k.k.k.k......',
    '..kakakakak.....',
    '.kaAaAaAaAak....',
    'kaAAAAAAAAAak...',
    'kAAAAAAAAAAcck..',
    'kAAAAAAAAAceckk.',
    'kAAAAAAAAAcccckk',
    '.kbbbbbbbbccck..',
    '.kbbbbbbbbbbk...',
    '..kkkkkkkkkk....',
    '....kk..kk......',
  ],
];

const BZYK = [
  [
    '...ww...ww....',
    '..wWWw.wWWw...',
    '..wWWwwWWw....',
    '....kkkkkk....',
    '...kyykyykk...',
    '..kyykyykyywk.',
    'kkyykyykyyyek.',
    '..kyykyykyyyk.',
    '...kyykyykkk..',
    '....kkkkkk....',
  ],
  [
    '..............',
    '..............',
    '.wWWw..wWWw...',
    '..wwkkkkkkw...',
    '...kyykyykk...',
    '..kyykyykyywk.',
    'kkyykyykyyyek.',
    '..kyykyykyyyk.',
    '...kyykyykkk..',
    '....kkkkkk....',
  ],
];

const ISKRA = [
  [
    '....o.....',
    '...oo..o..',
    '..ooOooo..',
    '.oOOyOOOo.',
    'oOyyyyyyOo',
    'oOykyykyOo',
    'oOyyyyyyOo',
    '.oOyyyyOo.',
    '..oOOOOo..',
    '...oooo...',
  ],
  [
    '.....o....',
    '..o.oo....',
    '..oooOoo..',
    '.oOOyOOOo.',
    'oOyyyyyyOo',
    'oOykyykyOo',
    'oOyyyyyyOo',
    '.oOyyyyOo.',
    '..oOOOOo..',
    '...oooo...',
  ],
];

// Gburek – zły czarodziej (patrzy w prawo)
const GBUREK = [
  '...........kkk....',
  '..........kppk....',
  '.........kppk.....',
  '.........kppk.....',
  '........kpppk.....',
  '........kpypk.....',
  '.......kpyyypk....',
  '.......kppyppk....',
  '......kpppppppk...',
  '...kkkkkkkkkkkkkk.',
  '...kPPPPPPPPPPPPk.',
  '....kkssssssssk...',
  '....kssssGGGsssk..',
  '....ksssssessssnk.',
  '....kssssseesnnnk.',
  '....kwsssssssnnk..',
  '....kwwsssrrsssk..',
  '....kwwwwwwwwwwk..',
  '..kkpkwwwwwwwwkpk.',
  '.kpppkwwwwwwwkppk.',
  '.kpppkwwwwwwwkppk.',
  '.kppppkwwwwwkpppk.',
  'kppyyppkwwwkpppppk',
  'kpppppppkwkpppyppk',
  'kpppppppppppppppk.',
  'kpppypppppppppppk.',
  'kPPPPPPPPPPPPPPPk.',
  '.kkkkkkkkkkkkkkk..',
];
const STOPY_GBURKA = [
  '..kkkk....kkkk....',
  '...kkkk..kkkk.....',
];

const ZABA = [
  '...kpk....',
  '..kpppk...',
  '.kkkkkkk..',
  'kwkgggkwk.',
  'kekgggkek.',
  'kggggggggk',
  'kgrrrrrrgk',
  '.kggggggk.',
  'kgk....kgk',
];

// ---------- PRZEDMIOTY ----------
const GWIAZDKA = [
  '.....k.....',
  '....kyk....',
  '....kyk....',
  'kkkkyyykkkk',
  'kyyyyyyyyyk',
  '.kyeyyyeyk.',
  '..kyyyyyk..',
  '..kyyyyyk..',
  '.kyyykyyyk.',
  '.kyk...kyk.',
  '.kk.....kk.',
];

const SERCE = [
  '.kk...kk.',
  'krrk.krrk',
  'krwrkrrrk',
  'krrrrrrrk',
  '.krrrrrk.',
  '..krrrk..',
  '...krk...',
  '....k....',
];

const PLECAK = [
  '..kk..kk..',
  '.krrkkrrk.',
  '.krRkkrRk.',
  '.kwgkkwgk.',
  '.kwgkkwgk.',
  '.kwgyywgk.',
  '.kwgkkwgk.',
  '.kwgkkwgk.',
  '.kGGkkGGk.',
  '..kk..kk..',
];

const BANKOMIOTACZ = [
  '....kkk.....',
  '...kcwck....',
  '...kccck....',
  'kkkkkkkkkkk.',
  'kbbbbbbbbbok',
  'kbBBBBBBBbok',
  'kkkkbbkkkkk.',
  '...kbbk.....',
  '...kkkk.....',
];

const MAGNES = [
  '..kkkkkkk..',
  '.krrrrrrrk.',
  'krrkkkkkrrk',
  'krk.....krk',
  'krk.....krk',
  'krk.....krk',
  'kwk.....kwk',
  'kwk.....kwk',
  'kkk.....kkk',
];

// Kolory przedmiotów i wrogów
const KOLORY_PIKSELI = {
  jezyk: { k: OBRYS, a: '#eadfcb', A: '#6e5440', c: '#f0c9a0', e: OBRYS, b: '#8a6448' },
  bzyk: { k: OBRYS, w: '#ffffff', W: '#cfefff', y: '#ffd23f', e: OBRYS },
  iskra: { o: '#ff5a1f', O: '#ffb02e', y: '#fff3b0', k: '#5a1a0a' },
  gburek: {
    k: OBRYS, p: '#6a3fb5', P: '#4b2a8a', y: '#ffd23f', s: '#f0d0b0', G: '#55556a', e: OBRYS,
    n: '#e8a87c', w: '#e6e6f0', r: '#8a2b2b',
  },
  zaba: { k: OBRYS, p: '#6a3fb5', g: '#4caf50', w: '#ffffff', e: OBRYS, r: '#2e7d32' },
  gwiazdka: { k: '#a86f00', y: '#ffe14d', e: OBRYS },
  serce: { k: '#7a1030', r: '#ff4d6d', w: '#ffd0da' },
  plecak: { k: OBRYS, r: '#ff5a5f', R: '#c0303a', w: '#e8eaf2', g: '#a8adbf', G: '#6d7186', y: '#ffd23f' },
  bankomiotacz: { k: OBRYS, c: '#b9f3ff', w: '#ffffff', b: '#4cc9f0', B: '#2f8fc0', o: '#ff9f1c' },
  magnes: { k: OBRYS, r: '#ff4d4d', w: '#e8eaf2' },
};
