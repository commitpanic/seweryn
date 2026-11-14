'use strict';

// =====================================================
//   ETAPY GRY „NA RATUNEK!”
// =====================================================
//
//  Każdy etap to obrazek z literek. Jedna literka = jedna kratka.
//  Możesz zmieniać etapy, a nawet dorysować własny!
//  (Wszystkie linijki mapy powinny być tak samo długie i jest ich 15.)
//
//  Co znaczą literki:
//    (spacja)  powietrze
//    #   ziemia
//    B   kamienny blok
//    =   cegły (Franek rozbija je głową!)
//    ?   prezent z monetą (uderz go głową od dołu)
//    +   prezent z sercem
//    -   cienka półka (można na nią wskoczyć od dołu)
//    o   moneta
//    *   gwiazdka (w każdym etapie są 3 – znajdziesz wszystkie?)
//    ^   kolce
//    ~   woda (rozpędzony Seweryn biegnie po niej!)
//    L   lawa
//    T   trampolina
//    F   flaga (tu wracasz, gdy stracisz wszystkie serca)
//    S   tu zaczynasz
//    K   klatka z porwanym przyjacielem – meta!
//    g   glutek (można na niego skoczyć)
//    j   jeżyk (ma kolce – nie skacz na niego!)
//    b   bzyk (lata w górę i w dół)
//    i   iskra (wyskakuje z lawy)
//    M   ruchoma platforma (jeździ w prawo i z powrotem)
//    W   winda (jeździ w górę i z powrotem)
//    Z   krata zamku (zamyka się, gdy zaczyna się walka z Gburkiem)
//    G   Gburek – zły czarodziej
//    R   plecak rakietowy (trzymaj skok w powietrzu!)
//    P   bańkomiotacz (strzela bańkami: klawisz X)
//    N   magnes na monety
//
//  świat: 'laka', 'las', 'pustynia', 'lod', 'wulkan' albo 'zamek'
//  porwany: 'helenka', 'seweryn' albo 'franek'

const ETAPY = [
  {
    // ===== ETAP 1 =====
    nazwa: 'Słoneczna Łąka',
    swiat: 'laka',
    porwany: 'seweryn',
    rada: 'Skacz po prezentach i zbieraj monety! Na glutki możesz skakać.',
    mapa: [
      '                                                                                                                                                                     ',
      '                                                                                                                                                                     ',
      '                                                                                                                                                                     ',
      '                                                                                                                                                                     ',
      '                                    *                                                  oooooooo            *                                                         ',
      '                                                                                      ----------                                                                     ',
      '                                                                     ===                                                                                             ',
      '                                                                     =*=                                                                ooo                          ',
      '           ?=?=?                              ?                      ===                                              ?+?               BBB                          ',
      '                                  oooo              oo                                            b             oo                     BBBB                          ',
      '      ooo                        ######                     P             ooo                   R                        N            BBBBB    ooo                   ',
      '  S                g             ######    g             F    g  BB           g         T            g                      g   g    BBBBBB               K          ',
      '#########################   #######################    ##########################   ###########################    ##################################################',
      '#########################   #######################    ##########################   ###########################    ##################################################',
      '#########################   #######################    ##########################   ###########################    ##################################################',
    ],
  },
  {
    // ===== ETAP 2 =====
    nazwa: 'Grzybowy Las',
    swiat: 'las',
    porwany: 'franek',
    rada: 'Uwaga na jeżyki – mają kolce, nie skacz na nie!',
    mapa: [
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                   *                                                                                                                                           ',
      '                                                                                                                          *                ooooooo                             ',
      '                                                                                                                                          ---------                            ',
      '                                oooo                                                                                                                                           ',
      '                                ----                                                                                                                                           ',
      '                                                                                                                                                                               ',
      '         ???                               ?                              ?+?                                                                          ?                       ',
      '                           ----                 ooo   ooo                                 o o o og  o o o o                          oo             b                          ',
      '      ooo                                       ---   ---       P                      BBBBBBBBBBBBBBBBBBBBBB     R      o o                                  ooo              ',
      '  S             j                       g                    F   g    j         g                                    g         j            T              j         K         ',
      '#####################   ######################             ###########################            *           ######################    #######################################',
      '#####################   ######################~~~~~~~~~~~~~################################~~~~~~~~~~~~~~~~#########################    #######################################',
      '#####################   ######################~~~~~~~~~~~~~################################~~~~~~~~~~~~~~~~#########################    #######################################',
    ],
  },
  {
    // ===== ETAP 3 =====
    nazwa: 'Gorąca Pustynia',
    swiat: 'pustynia',
    porwany: 'helenka',
    rada: 'Ruchome platformy przewiozą cię nad przepaścią. Uważaj na kolce!',
    mapa: [
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                                *                                                                                                                              ',
      '                                                                  ===                                                                                                          ',
      '                                                                  =*=                                                       oooo                                               ',
      '          ?=?                        b       oooo                 ===                                     ?+?                                              oo                  ',
      '                        ooo                                               o o o j     o o o        oooo                   MMM               b              BB                  ',
      '      ooo                           R      MMM            P             BBBBBBBBBBBBBBBBBBBB    N                                                         BBB                  ',
      '  S               g     ^^^      j                     F    ^^  g                                  ^^^^        g   g                              j   g  BBBB        K         ',
      '#########################################            ##################           *          ###########################            ###########################################',
      '#########################################            ######################~~~~~~~~~~~~~~~##############################            ###########################################',
      '#########################################            ######################~~~~~~~~~~~~~~~##############################            ###########################################',
    ],
  },
  {
    // ===== ETAP 4 =====
    nazwa: 'Lodowa Kraina',
    swiat: 'lod',
    porwany: 'seweryn',
    rada: 'Ślisko! Na lodzie trudno się zatrzymać. Winda zawiezie cię na górę.',
    mapa: [
      '                                                                                                                                                                               ',
      '                                                                                                                                                                               ',
      '                                                        *                                                                                                                      ',
      '                                                                                               *                                                                               ',
      '                                        ===                    ooo    R oo                                                                                                     ',
      '                                        =*=                 F       g                                                                                                          ',
      '                                        ===               ##################                                                                                                   ',
      '                                   oo                     ##################                                                                                                   ',
      '           ?=?                     BB                     ##################                              ?+?               ?=?            oooo                                ',
      '                       oo          BB                     ##################                                   oo                                       b                      ',
      '      oooo                  P  BB  BB                     ##################    ooo           o o                                        MMM                                   ',
      '  S               g            BB  BB         j       WWW ##################        g     j                            g         j                            g         K      ',
      '######################    ###########################     ####################################################    #####################            ############################',
      '######################~~~~###########################     ####################################################~~~~#####################            ############################',
      '######################~~~~###########################     ####################################################~~~~#####################            ############################',
    ],
  },
  {
    // ===== ETAP 5 =====
    nazwa: 'Ognisty Wulkan',
    swiat: 'wulkan',
    porwany: 'franek',
    rada: 'Nie dotykaj lawy! Iskry co chwilę z niej wyskakują.',
    mapa: [
      '                                                                                                                                                                                    ',
      '                                                                                                                                                                                    ',
      '                                                                                                                                                                                    ',
      '                                                                           *                                                             *                                          ',
      '                                                                                                                                                                                    ',
      '                                                                                                                                                                                    ',
      '                                                                                                                                                                                    ',
      '                                                                                                                                                          oooo                      ',
      '          ?=?                       b            oooo                                                         ?+?                                                                   ',
      '                                                                                       o o o  j    o o                    b                             MMM                         ',
      '      oooo                             ooo R   MMM                N       o o        BBBBBBBBBBBBBBBBBBB   P                                                                        ',
      '  S             g             j                            F    g     j                                             g                    T     ^^  j                   g     K      ',
      '####################    #####################            ###########################           *         #########################    ################            ##################',
      '####################LiLL#####################LLLLLiLLLLLL###############################~~~~~~~~~~~~~~############################LiLL################LLLLLLLiLLLL##################',
      '####################LLLL#####################LLLLLLLLLLLL###############################~~~~~~~~~~~~~~############################LLLL################LLLLLLLLLLLL##################',
    ],
  },
  {
    // ===== ETAP 6 =====
    nazwa: 'Zamek Gburka',
    swiat: 'zamek',
    porwany: 'helenka',
    rada: 'Na końcu czeka sam Gburek. Skocz mu 3 razy na głowę!',
    mapa: [
      '                                                                                                                                                      B                             ',
      '                                                                                                                                                      B                             ',
      '                                                                                                                                                      B                             ',
      '                                                                                        *                                                             B                             ',
      '                                                                                                                                                      B                             ',
      '                                                        ===                                                                                           B                             ',
      '                                                        =*=                            ---                                                            B                             ',
      '                                                        ===                                                                                           B                             ',
      '          ?=?                                      ?+?                  b                     oooo                         oooo           ?+?         B     ----         ----       ',
      '                     o o o g  o o                                                   ---                     ooo            ----                       Z                             ',
      '     oooo          BBBBBBBBBBBBBBBBB    R                             N                     MMM                                               P       Z                             ',
      '  S            g                          j    ^^                 F         g     j                         ^^^   g     j                         F   Z              G          K   ',
      '##################         *         #######################    ##########################            ############################    ##############################################',
      '#####################~~~~~~~~~~~~~##########################LiLL##########################LLLLLLLiLLLL############################LiLL##############################################',
      '#####################~~~~~~~~~~~~~##########################LLLL##########################LLLLLLLLLLLL############################LLLL##############################################',
    ],
  },
];
