# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Język komunikacji

Zawsze odpowiadaj po polsku w tej konwersacji (tekst do użytkownika, komentarze w podsumowaniach) — Michał komunikuje się po polsku. Kod, nazwy zmiennych/plików i commity mogą zostać po angielsku zgodnie z istniejącą konwencją w repo.

## Co to za projekt

RaveAdventure to serwis, w którym klienci zamieniają zdjęcia z festiwali techno/rave w spersonalizowane, kolekcjonerskie karty (format karty bankomatowej, PVC lub wizytówki). Klient wgrywa zdjęcie → dostaje mail potwierdzający → właściciel (Michał) ręcznie tworzy grafikę w Pixlr → wysyła projekt do akceptacji → klient płaci (BLIK/przelew) → karta idzie do druku i wysyłki.

To jest hobby/pasja, nie skalowany biznes VC. Michał prowadzi to solo, obok pracy na etacie, jako niezarejestrowana działalność (limit przychodu kwartalnego). Nie sugeruj rozwiązań zakładających duży zespół, duży budżet infrastruktury czy enterprise-scale — priorytet to prostota utrzymania przez jedną osobę.

## Niezmienniki biznesowe i bezpieczeństwo

- Michał prowadzi projekt solo, jako działalność nierejestrowaną — to hobby/pasja, nie skalowany biznes. Budżet ograniczony, priorytet to prostota utrzymania przez jedną osobę. Nie proponuj rozwiązań zakładających zespół, duży budżet infrastruktury czy enterprise-scale.
- **[W TRAKCIE, od 2026-07-28] Automatyczne płatności online — decyzja zmieniona, wdrażamy PayByLink (Blue Media).** Wcześniej świadomie brak automatycznych płatności; teraz Michał założył osobne, dedykowane konto bankowe firmowe dla RaveAdventure (płatności BLIK już przekierowane na nowe konto) i czeka na aktywację konta PayByLink — jak dostanie dostęp/dokumentację API, przekaże ją do integracji. **Stripe został odrzucony na rzecz PayByLink** (natywne BLIK, lepiej pasuje do polskiego rynku i obecnego flow "link w mailu zamiast ręcznych danych") — nie proponuj Stripe/PayU. Do czasu aktywacji konta płatność działa jak dotąd: BLIK/przelew ręczny, dane wysyłane w mailu z projektem karty (`/api/send-design`, stałe `BLIK_PHONE`/`BANK_ACCOUNT`/`BANK_RECIPIENT` na górze pliku — `BANK_ACCOUNT` zaktualizowany 2026-07-28 na nowe dedykowane konto).
- Nienaruszalna logika cenowa (pełne szczegóły, w tym lista kodów rabatowych, patrz „Logika cenowa" niżej):
  - `unitPrice`: Karta PVC = 40 zł, Wizytówki (100 szt.) = 50 zł
  - Rabat ilościowy: -35% przy zamówieniu ≥ 3 sztuk (obniżone z -50% 2026-07-30 — realny koszt wytworzenia w BOM pokazał, że -50% na 3+ szt. wychodziło na zero/stratę)
  - Kody rabatowe: dodatkowy % nakładany OSOBNO od rabatu ilościowego
  - NFC/RFID (tylko karta PVC): +15 zł/kartę przy ≤3 sztukach, +8 zł/kartę przy >3 sztukach — liczone OSOBNO od rabatu -35%, żeby nie zdublować przeceny
  - Wysyłka: stałe 15 zł, doliczane zawsze
- Nienaruszalna paleta kolorów marki (dokładne kody hex):
  ```
  Tło:            #07070f / #0a0014
  Neon fioletowy: #b44dff (główny akcent)
  Cyjan:          #00f0ff (drugi akcent)
  Sukces:         #00e5a0
  Błąd:           #ff4d6d
  Ostrzeżenie:    #f59e0b
  ```
- Zachować w całości: schemat bazy Supabase (tabela `orders`, wszystkie kolumny), konwencje nazw plików w Storage (bucket `order-photos`), oraz logikę maili transakcyjnych przez Resend (`/api/send-order`, `/api/send-design`) — mogą zmienić wygląd HTML maila, ale nie strukturę danych ani flow (token recenzji, BLIK/przelew, statusy zamówienia).
- Zachować całą sekcję „Lekcje wyciągnięte" bez skracania (patrz niżej): kolejność SQL-przed-kodem, limit 4.5MB na Vercelu (upload bezpośrednio przeglądarka→Supabase Storage), błąd reużywania komponentów bez `key` w Reakcie, optymalizacja Cached Egress (kompresja canvas + lazy-load na kliknięcie), dynamiczny pomiar `navHeight` przez `ResizeObserver` zamiast sztywnych marginesów.

## Aktualny redesign — kontekst ważny dla pracy w tym repo

Trwa kompletny redesign robiony lokalnie (WSL + VS Code), zanim cokolwiek trafi na produkcję. Obecna wersja online (raveadventure.pl) działa i **nie jest ruszana**, dopóki redesign nie będzie gotowy do podmiany.

Zakres redesignu — otwarty na duże zmiany:

- Całkowicie nowa estetyka wizualna, nowoczesne rozwiązania (wizualizacje 3D, animacje) — eksperymentować śmiało.
- **Zachować**: główną kolorystykę marki (patrz niżej). Reszta layoutu/komponentów/UX jest otwarta na przeprojektowanie.
- **Nie może się zepsuć**: logika biznesowa (ceny, rabaty, przepływ statusów zamówienia), integracja Supabase/Resend, maile transakcyjne — mogą zmienić wygląd, ale muszą zachować funkcjonalność.

### Kolorystyka marki (protected — nie zmieniać bez pytania)

Patrz „Niezmienniki biznesowe i bezpieczeństwo" wyżej — dokładne kody hex.

### Architektura i stack redesignu

**Restart, nie migracja w tle**: Michał zdecydował się na budowę strony **całkowicie od nowa** na poniższym stacku, zamiast stopniowo migrować to, co powstało we wcześniejszych, pierwszych podejściach do redesignu (np. `components/LogoEqualizer.tsx` — animowane logo z equalizerem, redesign kart w `app/portfolio/`, migający tekst marki w `app/page.tsx`/`app/page.module.css`). Te komponenty istnieją w repo jako **pierwsza iteracja, do przebudowania**, nie jako docelowy stan — nie traktuj ich jako wzorca do naśladowania w nowym podejściu, chyba że Michał wyraźnie powie inaczej.

Docelowy stack (żaden z poniższych pakietów nie jest jeszcze zainstalowany w `package.json` — to kierunek, nie stan obecny):

- **Styling**: **Tailwind CSS + Motion** (pakiet npm nazywa się `motion`, import z `motion/react` — Framer Motion to stara nazwa tej samej biblioteki, używaj aktualnej nazwy w przykładach kodu). Zastępuje inline style objects + CSS modules.
- **Płynny scroll**: **Lenis** — efekt „maślanego" przewijania.
- **Karta w Hero**: prawdziwe 3D — **Three.js (przez React Three Fiber + drei) albo Spline**, z dynamicznym, reflektywnym błyskiem PVC/glossy reagującym na ruch myszy/scroll. To świadomy wybór najnowocześniejszego podejścia, NIE uproszczony Parallax Tilt. Parallax Tilt może zostać wspomniany jako fallback/lżejsza wersja na słabszych urządzeniach mobilnych, ale główny kierunek to prawdziwe 3D.
- **Portfolio**: krótkie wideo jako podgląd hover-to-play (fizyczna karta w dłoni, odbicie światła) — zamiast/obok statycznych zdjęć. Wymaga nowej kolumny w tabeli `portfolio` (np. `video_url`) — pamiętaj o kolejności SQL-przed-kodem (Lekcja #1 niżej).

Panel admina i strona główna mają fixed nav bez stałej wysokości (`.nav { position: fixed }`, zawija się inaczej na mobile). Zamiast sztywnych `marginTop: '57px'`, wysokość nava jest mierzona dynamicznie przez `ResizeObserver` (`navRef`/`navHeight` w `page.tsx`) — trzymaj się tego wzorca (albo jego odpowiednika w Motion/Tailwind) zamiast hardkodować piksele w nowym designie.

## Zakres i priorytet redesignu (MVP)

Priorytet nr 1: efektowny, nowoczesny Landing Page „WOW" (Cyber-Luxe/Dark Neon) zachęcający do złożenia zamówienia.

Struktura sekcji landing page'a (w tej kolejności):

1. Hero Section z interaktywną kartą 3D (Three.js/Spline) i CTA
2. „Jak to działa" — 4 proste kroki
3. Interaktywny slider „Przed / Po" — transformacja zdjęcia imprezowego w kartę
4. Dynamiczna Galeria Portfolio z podglądem wideo + zdjęciami fizycznych kart
5. Formularz zamówienia — **zachować obecny podział na 5 kroków, jest dobrze przemyślany i ma zostać bez zmian w tej liczbie**: (1) typ karty, (2) motyw + zdjęcie + atrybuty, (3) opcje tyłu karty, (4) ilość + podsumowanie ceny, (5) dane kontaktowe + kod rabatowy + zgoda. Redesign zmienia WYGLĄD tych kroków, nie ich liczbę ani kolejność.
6. Sekcja FAQ i Opinie

### Roadmap (poza obecnym zakresem MVP)

Docelowo: autorskie narzędzie z API Google Gemini/Nano do automatycznego generowania grafiki karty na podstawie zdjęcia klienta, wpięte w szablon. NA TEN MOMENT strona tylko zbiera wytyczne/opis wizji od klienta — generowanie grafiki nadal odbywa się ręcznie (Pixlr, przez Michała). To jest przyszły etap, nie obecny — nie sugeruj wdrażania tego w bieżącym redesignie, chyba że Michał o to poprosi.

## Commands

```bash
npm install
npm run dev     # localhost:3000
npm run build
npm run start
```

Brak testów, lintera i konfiguracji CI w repo.

## Environment

Wymagane w `.env.local` (patrz `README.md` / `SUPABASE_SETUP.md` dla schematu Supabase):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — klient Supabase po stronie przeglądarki (`lib/supabase.ts`)
- `SUPABASE_SERVICE_KEY` — klucz service-role używany server-side w API routes (omija RLS)
- `RESEND_API_KEY` — maile transakcyjne (potwierdzenie zamówienia, projekt do akceptacji, powiadomienia approve/reject)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` — logowanie do `/admin`; sesja to pojedynczy współdzielony sekret w cookie, nie per-user
- `NEXT_PUBLIC_BASE_URL` — do budowania absolutnych linków w mailach (fallback: `https://raveadventure.pl`)
- `NEXT_PUBLIC_MAINTENANCE` — `'true'` chowa całą stronę za `/maintenance` (patrz middleware)

## Stack

_Aktualnie zainstalowane pakiety — docelowy stack redesignu (Tailwind, Motion, Lenis, Three.js/R3F/drei lub Spline) opisany w „Architektura i stack redesignu" wyżej jeszcze nie jest dodany do `package.json`._

- Next.js 14.2.35 (App Router), React 18, TypeScript 5
- Supabase (`@supabase/supabase-js` ^2.43.4) — baza danych + Storage
- Resend — maile transakcyjne, wysyłane bezpośrednio przez `fetch('https://api.resend.com/emails')`, bez SDK
- Hosting: Vercel
- Package manager: npm

## Struktura kluczowych plików

```
app/page.tsx                    — strona główna + 5-krokowy formularz zamówienia
app/admin/page.tsx               — panel administracyjny (lista zamówień, wysyłka projektów)
app/admin/portfolio/page.tsx     — zarządzanie zdjęciami portfolio na /portfolio
app/api/send-order/route.ts      — mail przy złożeniu zamówienia (do klienta + do admina)
app/api/send-design/route.ts     — mail z projektem do akceptacji (BLIK/przelew, token recenzji)
app/api/approve/route.ts         — klient zatwierdza projekt (token-based)
app/api/reject/route.ts          — klient odrzuca projekt z uwagami (token-based)
app/api/login/route.ts           — logowanie admina
app/review/page.tsx              — strona klienta do zatwierdzenia/odrzucenia projektu (token-based)
app/status/page.tsx              — strona sprawdzania statusu zamówienia
lib/translations.tsx             — T, CARD_TYPES_I18N, FRONT_THEMES_I18N, BACK_OPTIONS_I18N, Lang
lib/supabase.ts                  — klient Supabase
components/HeroCardAnimation.tsx — animacja „zdjęcie → karta" w hero
components/PortfolioCarousel.tsx — karuzela portfolio z flipem 3D
middleware.ts                    — auth /admin + maintenance mode
```

**Dług techniczny do posprzątania przy redesignie**: ceny i część etykiet (CARD_TYPES, BACK_OPTIONS) są obecnie nadpisywane lokalnie w `page.tsx` przez `.map()` nad danymi z `translations.tsx`, zamiast być edytowane bezpośrednio w źródle. Warto to skonsolidować z powrotem do `translations.tsx`, żeby nie było dwóch źródeł prawdy dla cen.

## Architektura — cykl życia zamówienia

Pojedyncza tabela `orders` w Supabase napędza wszystko. Status to liniowy pipeline, zdefiniowany raz w `app/admin/page.tsx` (stała `STATUSES`) i referencjonowany indziej jako zwykłe stringi (brak współdzielonego enuma/typu):

`new → in_project → approval → awaiting_payment → production → shipped → done`

- **new**: klient wysyła formularz na stronie głównej (`app/page.tsx`) → `POST /api/send-order` wysyła maile potwierdzające (admin + klient) przez Resend, dwujęzycznie wg `lang`.
- **in_project → approval**: admin wgrywa projekt w `/admin` (upload idzie bezpośrednio z przeglądarki do Supabase Storage), potem `POST /api/send-design` zapisuje URL(e) projektu, generuje losowy `review_token`, ustawia status na `approval` i wysyła klientowi mail z linkiem approve/reject (`/review?token=...&action=...`).
- **approval → awaiting_payment / in_project**: klient wchodzi na `/review` i zatwierdza lub odrzuca (z uwagami). Trafia to do `POST /api/approve` lub `POST /api/reject`, które szukają zamówienia **po `review_token`, nie po id** — token jest jedyną autoryzacją tego endpointu. Approve powiadamia admina z instrukcją płatności; reject wysyła uwagi klienta na maila admina.
- **awaiting_payment → production**: admin ręcznie oznacza płatność jako otrzymaną w `/admin` (`togglePaid`); to automatycznie przesuwa status na `production`.
- **production / shipped**: admin zmienia status ręcznie z `/admin`; przejścia `production` i `shipped` zapisują znaczniki czasu `approved_at`/`shipped_at`.
- Klienci mogą sprawdzić postęp w dowolnym momencie na `/status?token=<order id>` (ten token to surowe UUID zamówienia, inny niż `review_token`).

### Admin auth

`middleware.ts` chroni każdą ścieżkę zaczynającą się od `/admin`: sprawdza cookie (`admin_session` === `ADMIN_SESSION_SECRET`) ustawiane przez `/api/login`. To nie JWT ani session store — pojedynczy współdzielony sekret dla jednego admina. To samo middleware obsługuje też globalne przekierowania trybu konserwacji sterowane przez `NEXT_PUBLIC_MAINTENANCE`.

## Logika cenowa (musi zostać zachowana funkcjonalnie)

```
unitPrice = cena_typu_karty + cena_opcji_tyłu
  - Karta PVC: 40 zł
  - Wizytówka (100 szt.): 50 zł

hasDiscount (ilość ≥ 3) → -35% na (unitPrice × ilość)  [baseTotal]
  (QUANTITY_DISCOUNT_RATE w app/page.tsx — obniżone z -50% 2026-07-30, bo realny
  koszt wytworzenia z BOM pokazał zerową/ujemną marżę na zamówieniach 3+ szt.)
kod rabatowy → dodatkowy % od baseTotal (jedyny aktywny kod: LSF2026 — 25%,
  czasowy, promocja Łódź Summer Festival, ważny do 27.07.2026, do usunięcia po dacie)

NFC/RFID (tylko dla karty PVC, opcjonalny dodatek):
  - ≤3 sztuki: +15 zł/kartę
  - >3 sztuki: +8 zł/kartę
  - LICZONE OSOBNO od rabatu ilościowego -35% (świadoma decyzja — inaczej
    NFC zostałoby podwójnie przecenione)

Wykończenie karty (card_finish, tylko dla karty PVC, patrz CARD_FINISH_I18N
w lib/translations.tsx) — jedna z 6 opcji, wybór wykluczający się wzajemnie:
  - standard: bez dopłaty (domyślne)
  - magnes: +5 zł/kartę
  - top_holder: +20 zł/kartę
  - top_holder_magnes: +25 zł/kartę
  - top_holder_stojak: +30 zł/kartę
  - zestaw_promocyjny: 80 zł/kpl. — WYJĄTEK: ta cena ZASTĘPUJE bazową cenę
    karty PVC (40 zł) zamiast być dopłatą na wierzchu (płynie przez unitPrice
    i rabat ilościowy -35% jak zwykła cena karty). Zestaw = 2 karty (jedna
    luzem + jedna w Top Holderze ze stojakiem) + naklejka magnetyczna.
  - Pozostałe 4 opcje (magnes/holder/kombinacje) liczone OSOBNO od rabatu
    ilościowego -35%, dokładnie jak NFC/RFID.

Wysyłka: stałe 15 zł, doliczane zawsze

totalPrice = baseTotal - discountSaved + SHIPPING_COST + nfcTotal + cardFinishAddonTotal
```

## Schemat bazy danych — tabela `orders` (Supabase)

```
id, created_at, theme, name, email, phone, address, card_text, notes,
photo_url, status, design_url, review_token, review_notes,
card_type, back_option, quantity, unit_price, total_price, has_discount,
custom_desc, qr_link, card_year, card_rarity, card_name_custom,
attr1_label, attr1_value, card_skill, attr2_label, attr2_value, card_desc,
discount_code, discount_pct, approved_at, shipped_at,
design_back_url, notes_back, paid, lang,
nfc_enabled, nfc_price, card_finish,
design_original_url, design_back_original_url,
card_bottom_text, frame_color, holo_effect,
design_url_2, design_original_url_2, approved_design_option,
delivery_method, paczkomat_id
```

### Tabela `page_views` (licznik odwiedzin strony głównej)

```sql
CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
```

Jeden wiersz na odwiedziny strony głównej (`app/page.tsx`, `POST /api/track-visit` przy montowaniu komponentu) — łączna liczba to `select count(*)`, wstawianie wierszy zamiast inkrementacji jednego licznika unika race condition przy równoczesnych wejściach. Panel admina (`GET /api/track-visit`) pokazuje wynik w nagłówku, obok liczby zamówień. Lokalnie (placeholder Supabase) licznik trzyma prostą liczbę w `.dev-page-views/count.json` zamiast prawdziwej tabeli.

### Dostawa do paczkomatu InPost (w budowie — Poziom 1 gotowy, Poziom 2 zaplanowany)

Krok 5 formularza ma przełącznik „Adres wysyłki" / „Paczkomat InPost" (`delivery_method`). Przy paczkomacie:
- `paczkomat_id` — kod/nazwa wybranego paczkomatu (do użycia w API InPost przy generowaniu etykiety, Poziom 2)
- `address` — czytelny tekst do wyświetlenia (adres paczkomatu lub zwykły adres — reużywane wszędzie, gdzie kod już czyta `order.address`, więc panel admina/maile nie wymagały zmian)

**Michał nie ma zarejestrowanej działalności → nie może wygenerować `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN`** (Geowidget wymaga danych firmowych/faktury na `manager.paczkomaty.pl`). Komponent `components/InpostGeowidget.tsx` (oficjalna mapka Geowidget v5) zostaje w kodzie na wypadek gdyby to się kiedyś zmieniło, ale **w praktyce token prawdopodobnie nigdy nie zostanie ustawiony** — traktować `components/InpostAutocomplete.tsx` jako docelowe, stałe rozwiązanie, nie tymczasowy fallback.

Wybór paczkomatu domyślnie idzie przez `components/InpostAutocomplete.tsx` — podpowiedzi na żywo (miasto/ulica/kod) z darmowego, publicznego API InPost (`api-pl-points.easypack24.net`, bez żadnego konta/tokenu, zweryfikowane działa). To API blokuje żądania bezpośrednio z przeglądarki (CORS) — stąd serwerowy proxy `app/api/inpost-search/route.ts`. Pod polem jest link do oficjalnej wyszukiwarki InPost dla klientów, którzy wolą znaleźć paczkomat na mapie. Wybrany punkt: `paczkomat_id` = sam kod (np. `SSA01M`), `address` = `"{kod} — {ulica}, {miasto}"` (kod już zawarty w adresie — panel admina nie dubluje kodu w nawiasie, sprawdza `address.includes(paczkomat_id)`).

**Poziom 2 (prawdopodobnie nieaktualne)**: integracja z API InPost ShipX do automatycznego generowania etykiet wymagałaby tego samego konta biznesowego co Geowidget — odpada z tego samego powodu. Nadawanie paczek zostaje ręczne przez aplikację InPost Mobile (nie wymaga firmy).

### Konwencje nazw plików w Storage (bucket `order-photos`)

```
{id}-front.ext                        — zdjęcie klienta
{id}-custom.ext                       — grafika referencyjna (custom theme)
{id}-ref-back.ext                     — grafika referencyjna tyłu
designs/{id}-{timestamp}-original.ext — oryginał projektu (pełna rozdzielczość, NIE ładowany automatycznie nigdzie)
designs/{id}-{timestamp}.jpg          — skompresowany podgląd projektu (trafia do maila i podglądu w adminie)
designs/{id}-{timestamp}-back-original.ext / -back.jpg — analogicznie dla tyłu
closed-orders/<oryginalna-ścieżka>     — archiwum: pliki zamówień ze statusem "done", patrz niżej
```

**Archiwizacja zdjęć zakończonych zamówień** (`app/admin/page.tsx`, `archiveOrderFiles`/`archiveAllDone`): gdy zamówienie zmienia status na `done`, pliki powiązane z nim (`photo_url`, `design_url`, `design_url_2`, `design_back_url`, `design_original_url`, `design_original_url_2`, `design_back_original_url`) są automatycznie przenoszone (`supabase.storage.move()`) do folderu `closed-orders/`, a odpowiednie kolumny w `orders` aktualizowane na nowe publiczne URL-e — inaczej stare linki (mail, panel) prowadziłyby donikąd. Przycisk „🗄 Zarchiwizuj zakończone" w nagłówku panelu robi to samo zbiorczo dla już istniejących zamówień `done` (jednorazowa migracja, bezpieczna do wielokrotnego kliknięcia — pomija pliki już przeniesione). Cel: Michał może okresowo ściągnąć zawartość `closed-orders/` na dysk i skasować ją z Supabase, żeby zwolnić miejsce na Free Planie (5GB limit, patrz Lekcja #5 o Cached Egress). Działa tylko na prawdziwym Supabase — lokalnie (placeholder) przycisk się nie pokazuje.

## ⚠️ Lekcje wyciągnięte (nie powtarzać tych błędów)

1. **Nowa kolumna w Supabase = najpierw SQL, potem kod.** Dodanie pola do `insert()`/`update()` zanim kolumna istnieje w bazie → błąd `Could not find the 'x' column of 'orders' in the schema cache`. Zawsze najpierw `ALTER TABLE orders ADD COLUMN ...`, dopiero potem deploy kodu, który z niego korzysta.
2. **Literalne nowe linie w JSX template literals psują build** (`Unexpected token div`). Zamiast `\n` wewnątrz template literala renderowanego jako JSX, używać `.split('\n').join('<br>')` albo konkatenacji stringów.
3. **Vercel ma limit 4.5MB na body requestu API.** Dlatego wszystkie uploady zdjęć (zamówienia i projekty w adminie) idą bezpośrednio z przeglądarki do Supabase Storage, a do API route trafiają tylko wygenerowane URL-e — nigdy nie przesyłać binarnych plików przez `/api/*`.
4. **React reużywa komponenty bez `key` → stary lokalny state „wycieka" między elementami.** W panelu admina komponent do lazy-loadingu zdjęć (`LazyImage`, stan `show`) trzymał `show=true` po przełączeniu na inne zamówienie, bo komponent nie był re-mountowany. Rozwiązanie: `key={order.id}` (albo bardziej specyficzny klucz) na każdym komponencie, którego lokalny stan MUSI się zresetować przy zmianie danych nadrzędnych.
5. **Optymalizacja Cached Egress na Supabase Free Plan (5GB/mies.)** — dwa mechanizmy działające razem:
   - Kompresja obrazu w przeglądarce (canvas, `compressImage()` w `admin/page.tsx`) przed uploadem — oryginał i skompresowany podgląd jako dwa osobne pliki, podgląd używany wszędzie gdzie coś się automatycznie wyświetla.
   - `LazyImage` — żadne zdjęcie w panelu admina nie ładuje się automatycznie, tylko na kliknięcie (ikona 🖼 jako placeholder).
   - Storage Image Transformations (auto-thumbnaile) wymaga płatnego planu Supabase — niedostępne na Free.

## Maile transakcyjne (Resend)

Dwa route'y, oba dwujęzyczne (PL/EN wg pola `lang` zamówienia), HTML budowany ręcznie jako tabele (email-safe, bez Flexboxa):

- `/api/send-order` — potwierdzenie do klienta + powiadomienie do admina zaraz po złożeniu zamówienia
- `/api/send-design` — projekt do akceptacji, generuje `review_token`, zawiera dane do płatności (stałe `BLIK_PHONE`, `BANK_ACCOUNT`, `BANK_RECIPIENT` na górze pliku), linki approve/reject do `/review?token=...`

Obie zawierają plakietkę typu karty (PVC/Wizytówka) + NFC, jeśli dotyczy — dane albo z body requestu (`send-order`), albo bezpośrednio z `order.*` pobranego z bazy (`send-design`, tam i tak robimy `select('*')`).

Płatność (BLIK/przelew) jest ręczna i offline — `send-design` hardkoduje dane odbiorcy płatności; brak integracji z bramką płatniczą.

## System i18n

`lib/translations.tsx` eksportuje `T` (pełny słownik tekstów UI, w tym fragmenty JSX dla rich textu i funkcje dla stringów z interpolacją, np. `T[lang].order.step4.discountBadge(qty)`), `CARD_TYPES_I18N`, `FRONT_THEMES_I18N`, `BACK_OPTIONS_I18N`, typ `Lang = 'pl' | 'en'`. Przełącznik języka to zwykły stan React (`useState<Lang>`), bez routingu URL (brak `/en/...`) — obie wersje żyją pod tym samym adresem.

Maile (`send-order`, `send-design`) duplikują podobny wzorzec `L = {pl: {...}, en: {...}}[lang]` inline, niezależnie od `lib/translations.tsx`, bo renderują HTML mailowy server-side.

## Dostęp i dane projektu

- Supabase project ID: `jhdakluuhjnuyrgxqgxg`, bucket Storage: `order-photos`
- Panel admina: `/admin`, login `ravemaster` — hasło patrz `ADMIN_PASSWORD` w `.env.local` (celowo nie wpisane tutaj — plik trafia do gita; hasło i tak zostanie zmienione przed podmianą produkcji)
- GitHub: `raveadventure/raveadventure-web`
- Domena produkcyjna: raveadventure.pl (obecna wersja online — nie dotykać do czasu ukończenia redesignu)

## Pytania, które warto zadać Michałowi zanim zrobisz coś dużego

- Czy dana zmiana dotyczy tylko wyglądu, czy też przepływu/logiki biznesowej (te drugie wymagają większej ostrożności).
- Czy zmiana w bazie wymaga migracji SQL — jeśli tak, przypomnieć o kolejności (najpierw SQL, patrz Lekcja #1).
- Michał lubi rozumieć dlaczego, nie tylko co — krótkie uzasadnienie decyzji technicznej jest mile widziane, ale bez przesadnego rozwlekania.
