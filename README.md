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

Na telefonie we wszystkich grach steruje się palcem.

## Jak zmieniać gry

Na samej górze każdego pliku `gra.js` jest sekcja **USTAWIENIA**: liczba żyć, prędkość, co ile punktów jest nowy poziom i tak dalej. Zmień liczbę, zapisz plik i odśwież stronę (`F5`).

```
index.html        ← strona startowa z grami
pianino/gra.js    ← Spadające nuty
wyscigi/gra.js    ← Wyścigi
koszykowka/gra.js ← Koszykówka
```
