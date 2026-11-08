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

Na telefonie w obu grach stuka się w ekran.

## Jak zmieniać gry

Na samej górze każdego pliku `gra.js` jest sekcja **USTAWIENIA**: liczba żyć, prędkość, co ile punktów jest nowy poziom i tak dalej. Zmień liczbę, zapisz plik i odśwież stronę (`F5`).

```
index.html        ← strona startowa z grami
pianino/gra.js    ← Spadające nuty
wyscigi/gra.js    ← Wyścigi
```
