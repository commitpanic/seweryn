# Gry Seweryna

Gry przeglądarkowe, które wymyślił Seweryn. Kod powstał razem z Claude (AI).

Nic nie trzeba instalować: otwórz plik `index.html` w przeglądarce i wybierz grę.

## 🎹 Spadające nuty

Z góry spadają kolorowe prostokąty. Naciśnij właściwy klawisz pianina, zanim prostokąt do niego doleci. Kiedy trafiasz, grasz melodię, a każdy poziom ma inną piosenkę.

| Klawisze | Co robią |
|---|---|
| `A S D F G H J` | białe klawisze (C D E F G A H) |
| `W E R T Y` | czarne klawisze (od poziomu 20) |
| `Spacja` | start / graj dalej |
| `P` / `Esc` | pauza |
| `M` | wycisz dźwięk |

- 3 życia: przepuszczony prostokąt zabiera jedno.
- Co 10 punktów nowy poziom, a prędkość rośnie o 0,05.

## 🏎️ Wyścigi

Jedziesz czerwonym autem i omijasz inne auta. Każde wyprzedzone auto to punkt.

| Klawisze | Co robią |
|---|---|
| `←` `→` albo `A` `D` | zmiana pasa |
| `Spacja` | start / jedź dalej |
| `P` / `Esc` | pauza |
| `M` | wycisz dźwięk |

- 3 życia: zderzenie zabiera jedno.
- Co 10 punktów nowy poziom i jedziesz szybciej.

## 🏀 Koszykówka

Rzucasz piłką do kosza. Na starcie wybierasz tryb gry:

- **Na czas**: masz 60 sekund, żeby zdobyć jak najwięcej punktów. Każdy nowy poziom daje +5 sekund.
- **Bez czasu**: nie ma zegara, ale masz 3 serca. Każde pudło zabiera jedno.

Każdy tryb ma swój własny rekord.

| Sterowanie | Co robi |
|---|---|
| `←` `→` na starcie | wybór trybu: na czas / bez czasu |
| myszka / palec | pociągnij do tyłu i puść, jak z procy |
| `↑` `↓` albo `W` `S` | kąt rzutu |
| `Spacja` (trzymaj i puść) | rzut; siła rośnie i maleje |
| `P` / `Esc` | pauza |
| `M` | wycisz dźwięk |

- Kosz = 2 pkt, czysty rzut (bez dotykania obręczy i tablicy) = 3 pkt.
- 3 trafienia z rzędu: piłka w ogniu i punkty ×2, aż spudłujesz.
- Kiedy rzucasz, kosz stoi w miejscu. Po każdym trafieniu przenosi się w nowe miejsce: bliżej albo dalej, wyżej albo niżej.
- Co 10 punktów nowy poziom: kosz może stać jeszcze dalej, wyżej i niżej.

## 🐸 Żabi skok

Żabka zaczyna na dole, na chodniku, a na górze jest staw. Po drodze są ulice pełne aut. Skacz pole po polu i nie daj się potrącić!

| Sterowanie | Co robi |
|---|---|
| `←` `↑` `→` `↓` albo `W` `A` `S` `D` | skok o jedno pole |
| palec | przesuń w stronę skoku albo stuknij obok żabki |
| `Spacja` | start / skacz dalej |
| `P` / `Esc` | pauza |
| `M` | wycisz dźwięk |

- Skok do przodu na nowy rząd = 1 pkt, mucha = 5 pkt, wskoczenie do stawu = 10 pkt.
- Złota mucha daje dodatkowe serce (najwięcej 5).
- 3 życia: potrącenie zabiera jedno i żabka wraca na start.
- Na trawie jest bezpiecznie.
- Każdy staw to nowy poziom: nowe ulice i szybsze auta. Od poziomu 2 jeżdżą motory i ciężarówki, a od poziomu 3 autobusy.

## 🦸 Na ratunek!

Przygoda w stylu pixel art. Zły czarodziej Gburek porywa przyjaciół i zamyka ich w klatkach. W każdym z 6 etapów porwany jest ktoś inny, a ty wybierasz, kto z pozostałej dwójki idzie na ratunek. Dobiegnij do klatki i otwórz ją!

| Bohater | Supermoc |
|---|---|
| Helenka | podwójny skok: w powietrzu może skoczyć jeszcze raz |
| Seweryn | biega najszybciej, a rozpędzony biegnie nawet po wodzie |
| Franek | skacze najwyżej i rozbija cegły głową |

Krainy: Słoneczna Łąka, Grzybowy Las, Gorąca Pustynia, Lodowa Kraina (ślisko!), Ognisty Wulkan i Zamek Gburka, gdzie na końcu czeka sam Gburek. Trzeba mu 3 razy skoczyć na głowę.

| Klawisze | Co robią |
|---|---|
| `←` `→` albo `A` `D` | bieg |
| `↑` / `W` / `Spacja` | skok (przytrzymaj, żeby skoczyć wyżej) |
| `↓` | zeskok z cienkiej półki |
| `X` | strzał z bańkomiotacza |
| `P` / `Esc` | pauza |
| `M` | wycisz dźwięk |

- Znajdźki: 🚀 **plecak rakietowy** (trzymaj skok w powietrzu i leć, aż skończy się paliwo), 🫧 **bańkomiotacz** (bańka zamyka wroga, a Gburka na chwilę zatrzymuje) i 🧲 **magnes** (monety same przylatują).
- 3 serca. Upadek do wody, lawy albo przepaści zabiera jedno serce. Bez serc wracasz do ostatniej flagi.
- Na glutki i bzyki można skakać, na jeżyki nie, bo mają kolce!
- W każdym etapie są 3 gwiazdki. Niektóre zdobędzie tylko jeden bohater, więc zagraj każdym!
- Gra zapamiętuje otwarte etapy i zdobyte gwiazdki.

Na telefonie we wszystkich grach steruje się palcem.

## Jak zmieniać gry

Na samej górze każdego pliku `gra.js` jest sekcja **USTAWIENIA**: liczba żyć, prędkość, co ile punktów jest nowy poziom i tak dalej. Zmień liczbę, zapisz plik i odśwież stronę (`F5`).

```
index.html        ← strona startowa z grami
pianino/gra.js    ← Spadające nuty
wyscigi/gra.js    ← Wyścigi
koszykowka/gra.js ← Koszykówka
zaba/gra.js       ← Żabi skok
ratunek/gra.js       ← Na ratunek! (ustawienia, bohaterowie, zasady)
ratunek/poziomy.js   ← mapy etapów narysowane literkami
ratunek/piksele.js   ← postacie narysowane piksel po pikselu
ratunek/rysowanie.js ← kolory krain i rysowanie
```

W grze „Na ratunek!” możesz sam narysować etap: otwórz `ratunek/poziomy.js`, zmień literki na mapie (na górze pliku jest legenda: `#` ziemia, `o` moneta, `g` glutek…) i odśwież stronę.
