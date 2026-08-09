# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Język komunikacji

Zawsze odpowiadaj po polsku w tej konwersacji (tekst do użytkownika, komentarze w podsumowaniach) — Michał komunikuje się po polsku. Kod, nazwy zmiennych/plików i commity mogą zostać po angielsku zgodnie z istniejącą konwencją w repo.

## Co to za projekt

RaveAdventure to serwis, w którym klienci zamieniają zdjęcia z festiwali techno/rave w spersonalizowane, kolekcjonerskie karty (format karty bankomatowej, PVC lub wizytówki). Klient wgrywa zdjęcie → dostaje mail potwierdzający → właściciel (Michał) tworzy grafikę (patrz „Aplikacja towarzysząca" niżej — dziś głównie przez dedykowaną, osobną aplikację Rave Adventure Cards Creator ze stylizacją AI, wcześniej czysto ręcznie w Pixlr) → wysyła projekt do akceptacji → klient płaci (automatycznie przez Paybylink — BLIK/Przelewy Online — albo ręcznym BLIK/przelewem jako fallback) → karta idzie do druku i wysyłki.

To jest hobby/pasja, nie skalowany biznes VC. Michał prowadzi to solo, obok pracy na etacie, jako niezarejestrowana działalność (limit przychodu kwartalnego). Nie sugeruj rozwiązań zakładających duży zespół, duży budżet infrastruktury czy enterprise-scale — priorytet to prostota utrzymania przez jedną osobę.

## Niezmienniki biznesowe i bezpieczeństwo

- Michał prowadzi projekt solo, jako działalność nierejestrowaną — to hobby/pasja, nie skalowany biznes. Budżet ograniczony, priorytet to prostota utrzymania przez jedną osobę. Nie proponuj rozwiązań zakładających zespół, duży budżet infrastruktury czy enterprise-scale.
- **[✅ ZINTEGROWANE 2026-08-06] Automatyczne płatności online przez Paybylink (BLIK + Przelewy Online).** Faktyczny dostawca to **Paybylink (paybylink.pl)**, usługa świadczona przez **Systemy Płatnicze Robert Paszkowski**, ul. Jana Pawła II 22, 00-133 Warszawa, NIP 1182105129, REGON 360726494, wpisana do rejestru małych instytucji płatniczych (MIP) prowadzonego przez KNF pod numerem MIP31/2019 (prowizja 1.49%, brak opłaty stałej, min. 0.30 zł; reklamacje płatności → platnosci@rpdp.pl, rozdzielone od reklamacji produktu → RaveAdventure). **Nie proponuj Stripe/PayU/Blue Media.**
  - **Jak działa**: po zatwierdzeniu projektu na `/review` (status `awaiting_payment`) klient widzi przycisk „💳 Zapłać teraz (BLIK / Przelew)" obok istniejącej opcji ręcznego BLIK/przelewu (zostaje jako fallback, nie usunięty). Kliknięcie woła `POST /api/paybylink/generate` (publiczny, token-based jak `/api/approve`) → generuje transakcję w Paybylink (`POST https://secure.paybylink.pl/api/v1/transfer/generate`, `control` = pełne `orders.id`, żeby dopasować płatność do zamówienia bez dodatkowej tabeli) → przekierowuje klienta na hostowaną stronę płatności. Po opłaceniu Paybylink woła webhook `POST /api/paybylink/notify` (weryfikacja podpisu SHA-256, patrz `lib/paybylink.ts`), który **automatycznie replikuje logikę `togglePaid` z panelu admina** (`paid: true`, `status: 'awaiting_payment' → 'production'`, `approved_at`) i wysyła mail do admina — bez ręcznego klikania w panelu. Odpowiedź webhooka zawsze `200 OK`/`"OK"`/`text/plain` (kontrakt Paybylink, inaczej dobija do 241 retry), poza przypadkiem nieprawidłowego podpisu (403 — odrzucenie sfałszowanej notyfikacji). Idempotentne (retry na już opłaconym zamówieniu nie duplikuje maila/przejścia statusu). Niezgodność kwoty (opłacono mniej niż `total_price`) → mail ostrzegawczy do admina, **bez** automatycznego oznaczenia jako opłacone (wymaga ręcznej weryfikacji).
  - **Baza**: nowa kolumna `orders.paybylink_transaction_id` (text, nullable) — dodana przez Supabase MCP `apply_migration` 2026-08-06, przechowuje ID transakcji do wsparcia/reconciliacji.
  - **Zmienne środowiskowe**: `PAYBYLINK_API_KEY` (klucz prywatny do podpisów) i `ID_Sklepu` (shop ID) w `.env.local`, wpisane bezpośrednio przez Michała — nigdy nie wklejać/wyświetlać wartości tych sekretów na czacie.
  - **Zweryfikowane end-to-end lokalnie 2026-08-06** (real Paybylink API call z prawdziwymi danymi z `.env.local` — zwrócił poprawny URL płatności; symulowany webhook z poprawnie policzonym podpisem — potwierdzone przejście statusu + mail; idempotencja; odrzucenie sfałszowanego podpisu).
  - `app/regulamin/page.tsx` był już zaktualizowany 2026-08-05 (przed integracją, na wyraźną prośbę Michała) o ujawnienie dostawcy płatności i sekcję "Prawo odstąpienia od umowy" — patrz historia gita, nieaktualne w tym miejscu do powtarzania.
- **[✅ ZROBIONE 2026-08-04] Profesjonalne zdjęcia fizycznych kart w Top Holderach i na lodówce.** Michał wgrał 6 zdjęć produktowych: Top Holder na stojaku (Amsterdam ADE + para kart DJ-skich), Top Holder na lodówce pojedynczo i jako cała kolekcja 3 kart, oraz sam wariant „magnes" (te same 3 karty bez Top Holdera, bezpośrednio na lodówce). Dodane w `components/RealCardsSection.tsx` jako osobna sekcja „Twoja pamiątka w akcesoriach premium" POD wideo z portfelem (świadomie oddzielona od głównej galerii „karta w dłoni" — eskalacja narracji noszenie→wystawienie), przez reużywalny `renderPhotoGrid()`. Przetworzone lokalnie (PIL — brak innego konwertera w sandboxie), oryginały w gitignored `public/real-cards/_originals/`. Komplet wariantów wykończenia z `card_finish` ma teraz zdjęcie dowodowe na stronie.
- Nienaruszalna logika cenowa (pełne szczegóły, w tym lista kodów rabatowych, patrz „Logika cenowa" niżej):
  - `unitPrice`: Karta PVC = 40 zł, Wizytówki (100 szt.) = 50 zł
  - Rabat ilościowy: -35% przy zamówieniu ≥ 3 sztuk (obniżone z -50% 2026-07-30 — realny koszt wytworzenia w BOM pokazał, że -50% na 3+ szt. wychodziło na zero/stratę)
  - Kody rabatowe: dodatkowy % nakładany OSOBNO od rabatu ilościowego
  - NFC/RFID (tylko karta PVC): +15 zł/kartę przy ≤3 sztukach, +8 zł/kartę przy >3 sztukach — liczone OSOBNO od rabatu -35%, żeby nie zdublować przeceny
  - Wysyłka: 15 zł w Polsce (stałe, doliczane zawsze). **Od 2026-08-02 też wysyłka za granicę (UE)**, ustalona z Michałem: 40 zł do paczkomatu InPost, 80 zł na adres — te kwoty ZASTĘPUJĄ (nie dodają się do) standardowych 15 zł. Wybór kraju to nowy toggle „Polska / Zagranica (UE)" w kroku 5 formularza (`shippingRegion` w `app/page.tsx`), zapisywany do nowych kolumn `shipping_region`/`shipping_cost` w `orders`.
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

**[✅ ZAKTUALIZOWANE 2026-08-06] `main` na GitHubie jest podłączony do Vercela — każdy `git push origin main` automatycznie builduje i wdraża raveadventure.pl. Nie ma osobnego kroku "podmiana produkcji".** Redesign (Tailwind CSS v4 + shadcn/ui + GSAP + Lenis) poszedł live 2026-08-02 na wyraźną prośbę Michała i od tego czasu każdy push na `main` trafia bezpośrednio na żywą stronę, z prawdziwym Supabase i prawdziwymi klientami (Vercel ma własne, osobno skonfigurowane zmienne środowiskowe w panelu — niezależne od lokalnego `.env.local`). Zasada „local only, nie pushuj bez wyraźnego polecenia" nadal obowiązuje jako domyślna (patrz sekcja „Workflow" niżej) — ale **wynika teraz z tego, że push = natychmiastowy wpływ na prawdziwych klientów i prawdziwe pieniądze**, nie z tego, że produkcja czeka gdzieś w poczekalni na osobny „swap". Praca lokalna to siatka bezpieczeństwa (testowanie przed dotarciem do klienta), nie krok przygotowawczy przed czymś, co i tak nastąpi później.

**Ważne dla nowych zmiennych środowiskowych**: dodanie/zmiana zmiennej w panelu Vercela NIE działa wstecznie na już wdrożony deployment — trzeba wywołać nowy build (Redeploy w panelu Vercela **czasem nie wystarcza** — zweryfikowane 2026-08-06, że zadziałał dopiero nowy push/commit, nie ręczny redeploy istniejącego). Jeśli po dodaniu zmiennej coś nadal nie działa, zrób pusty commit (`git commit --allow-empty`) i push, żeby wymusić świeży build.

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

## Plan marketingowy — do wdrożenia (zapisany 2026-07-31, brief od Michała)

Michał dostał zewnętrzną analizę/plan marketingowy strony i poprosił o zapisanie każdego punktu — będzie to wdrażane etapami, w kolejności priorytetów niżej. To NIE jest zlecenie do natychmiastowej realizacji — czekać na wyraźne "zrób punkt X", nie zaczynać samodzielnie od góry listy.

**Ustalona kolejność wdrożenia (wg Michała/briefu), od najważniejszego:**
1. Hero + CTA + sekcja „Prawdziwy produkt" (największy wpływ na konwersję)
2. Portfolio kart + „Jak to działa" (4 kroki)
3. Opinie + FAQ (budowa zaufania)
4. Uproszczony, wizualny formularz zamówienia

### ✅ Rozstrzygnięte rozbieżności z briefem (2026-07-31 — Michał potwierdził: zostaje jak było ustalone)
- **Formularz zamówienia — zostaje 5 kroków.** Sugestia briefu (uproszczenie do 4 kroków) **odrzucona** — obowiązuje wcześniejsze ustalenie w „Zakres i priorytet redesignu" niżej: zachować 5 kroków bez zmian liczby, redesign zmienia tylko wygląd.
- **Poprawki projektu — zostają bezpłatne i nieograniczone.** Sugestia briefu (odpowiedź FAQ „masz 2 rundy poprawek w cenie") **odrzucona** — obowiązuje istniejąca logika biznesowa: poprawki bez limitu, aż klient zaakceptuje projekt (patrz „Regulamin"/„Logika cenowa"). Przy wdrażaniu FAQ z briefu (punkt 7 niżej) użyć tej treści, nie sugestii z briefu.

### ✅ Rozstrzygnięte 2026-08-02 (były w „nadal do ustalenia")
- **FAQ — czas realizacji**: Michał podał dokładny rozkład zamiast ogólnikowego „kilka dni do 2 tygodni" z briefu — projekt 1-3 dni, wysyłka następnego dnia roboczego, potem PL paczkomat do 3 dni / adres do 7 dni, zagranica (UE) paczkomat 4-7 dni / adres 7-14 dni. Wdrożone w `components/FaqReviews.tsx` (PL/EN).
- **FAQ — wysyłka za granicę**: tak, wysyłamy do UE — patrz „Wysyłka za granicę (UE)" w „Logika cenowa" wyżej i nowe pytanie FAQ w `components/FaqReviews.tsx`.

### 🔍 Co już mamy (nie budować od nowa) vs. co jest realną luką
- **„Prawdziwy produkt"**: ✅ zrobione — `components/RealCardsSection.tsx` ma teraz podpis pod każdym z 4 zdjęć (PL/EN, `PHOTOS` jako `{id, captionPl, captionEn}`). **Nadal bez zdjęć nowych wariantów** (lodówka/Top Holder) — te dotrą ok. 2026-08-07 (patrz wyżej), do dodania osobno jako kolejne wpisy w `PHOTOS` gdy pliki przyjdą.
- **Portfolio**: ✅ zrobione — `components/PortfolioCarousel.tsx` ma teraz widoczne chipy filtrów (Wszystkie/Rave/Festiwal/Podróże/Custom/**Fan Art** — ten ostatni motyw dodany 2026-08-09 na wyraźną prośbę Michała, wcześniej celowo pominięty w tym skróconym, homepage'owym teaserze, teraz spójny z pełną listą na `/portfolio`) i CTA „Zamów swoją kartę z kolejnego eventu →" pod karuzelą, linkujące do `#order`. Pełna strona `/portfolio` (`app/portfolio/page.tsx`) miała filtry/grid/lightbox (w tym `fan_art` z plakietką „Fan Art · Not for sale") już wcześniej — dopasowano tylko treść jej istniejącego CTA do tego samego sformułowania z briefu.
- **„Jak to działa"**: sekcja już istnieje (`id="jak-zamowic"`), ale krok 3 briefu („Płacisz wygodnie PayByLink") wymaga najpierw aktywacji PayByLink (patrz wyżej) — do zaktualizowania razem z integracją płatności, nie wcześniej. Krok 2 briefu („2 propozycje grafiki do akceptacji") **już jest wspierane w bazie** (`design_url_2`/`design_original_url_2`/`approved_design_option` w `orders`, wysyłka dwóch wariantów w adminie) — to kwestia dopilnowania, żeby treść kroku to odzwierciedlała, nie budowy nowej funkcji.
- **Opinie i FAQ**: **już zbudowane w tej sesji** (`components/FaqReviews.tsx`, `/admin/opinie`) — 9 pytań FAQ, siatka opinii z gwiazdkami/opcjonalnym zdjęciem, formularz dodawania z moderacją. Pomysł briefu na **screenshoty wiadomości/postów** jako format social proof — **✅ zrobione 2026-08-02**: nowa kolumna `reviews.quote` (nullable text), opcjonalne pole „Krótki cytat" w formularzu opinii, wyświetlane jako wyróżniony cytat nad treścią (na stronie i w `/admin/opinie`); `photo_url` już obsługiwał dowolne zdjęcie, więc screenshot da się wgrać bez zmian.
- **Kolejność sekcji na stronie**: ✅ ustalone — obecny, faktyczny porządek w `app/page.tsx` to `quickNav → Hero (H1/CTA) → AdShowcase → PortfolioCarousel → RealCardsSection → WhyUs → „Jak to działa" → Formularz → FaqReviews`. Hero zostało fizycznie przesunięte na górę, zaraz pod `quickNav` — zgodnie z priorytetem #1 briefu (Hero jako pierwszy ekran, ścieżka wzroku animacja→przycisk→formularz).

### Treść z briefu — do wykorzystania przy wdrożeniu (skrót, pełne uzasadnienia w oryginalnej wiadomości Michała)

**1. Hero**: H1 „Zamień swoje zdjęcie z festiwalu w kolekcjonerską kartę.", podtytuł „PVC jak karta bankomatowa, z Twoim zdjęciem, opisem i dodatkami (NFC, magnes, Top Holder).". CTA główne „Zamów swoją kartę", CTA drugorzędne (mniejsze) „Zobacz przykładowe karty". Przycisk blisko animacji karty — ścieżka wzroku animacja→przycisk→formularz.

**2. „Prawdziwy produkt"**: siatka 2×2 lub karuzela, 4 zdjęcia (dłoń / portfel / Top Holder na biurku / magnes na lodówce), każde z krótkim podpisem (przykłady: „Karta z Twojego ulubionego setu, zawsze w portfelu.", „Karta w Top Holderze – mini-plakat z najlepszej nocy.", „Magnes na lodówkę – pamiątka, którą widzisz codziennie.").

**3. Portfolio**: siatka 8–12 zdjęć z podpisami w stylu „Audioriver 2025 – karta z first row.", CTA pod spodem „Zamów swoją kartę z kolejnego eventu". Filtr/tagi RAVE / FESTIWAL / PODRÓŻE / ADVENTURE — opcjonalnie na start wystarczy opis słowny bez realnego filtrowania.

**4. „Jak to działa"**: nagłówek „Jak wygląda proces zamówienia?", 4 kroki w linii (desktop) / pionowo (mobile) z ikonami: (1) wyślij zdjęcie + wybierz typ karty, (2) dostajesz 2 propozycje grafiki do akceptacji, (3) płacisz wygodnie PayByLink, (4) produkcja i wysyłka do paczkomatu. Pod krokami: „Cały proces jest zrobiony tak, żeby był prosty: od zdjęcia, przez projekt, po gotową kartę w Twojej ręce."

**5. „Dlaczego RaveAdventure?"** — **✅ zbudowane 2026-07-31** (`components/WhyUs.tsx`, wpięte w `app/page.tsx` między Hero a „Jak to działa"). Nagłówek „Co wyróżnia RaveAdventure?", 4 karty z ikoną (🎯/🎴/📲/⚙️): personalizacja 1:1 (nie szablon), fizyczny produkt z subkultury rave/techno (nie plik JPG), opcje NFC/magnes/Top Holder/stojak (pamiątka/dekoracja/inteligentny link), proces zoptymalizowany przez inżyniera (szybka realizacja, wysoka jakość, jasna komunikacja) — ostatni punkt to świadome połączenie pasji Michała i jego inżynierskiego backgroundu jako element wiarygodności. **Kotwica w quick-nav dodana 2026-08-02** (`#dlaczego-my`, pigułka „Dlaczego my").

**6. Opinie/social proof**: nagłówek „Co mówią o kartach?", 3-5 bloków, pomysł na screenshoty wiadomości/postów (anonimizowane) + nick + krótki cytat. Tekst zachęcający: „Jeśli zamówisz kartę, możesz dodać swoją opinię razem ze zdjęciem — pomagasz mi rozwijać ten projekt."

**7. FAQ**: 5-7 pytań — czas realizacji (**✅ zaktualizowane 2026-08-02** z dokładnym rozkładem od Michała), poprawki w projekcie, jak działa NFC, wysyłka za granicę (**✅ dodane 2026-08-02** — wysyłamy do UE, 40 zł paczkomat / 80 zł adres, patrz „Logika cenowa"), co jeśli nie mam dobrego zdjęcia (porady: ostrość/światło/kadrowanie — **✅ dodane 2026-08-02** jako 9. pytanie w `components/FaqReviews.tsx`, PL/EN). Patrz sprzeczności wyżej co do dokładnej treści odpowiedzi o poprawkach/czasie (już rozstrzygnięte — poprawki bez limitu).

**8. Formularz** (patrz sprzeczność wyżej — 4 vs 5 kroków, zostaje 5): kafelki z ikoną + dopłatą przy opcji (np. „+15 zł") i podsumowanie z listą wybranych opcji + ceną przed wysyłką — **już było zrobione wcześniej** (tagi cenowe w `BACK_OPTIONS_I18N`, ceny per wariant wykończenia, pełne podsumowanie w kroku 5). Limit znaków w opisie — **✅ dodany 2026-08-02**: 600 znaków (`maxLength` + licznik na żywo) na `customDesc` (motyw Custom) i `notes` (uwagi do zdjęcia) w `app/page.tsx`.

**9. Detale UX**: ✅ wszystkie 3 zrobione 2026-08-02.
  - Mini-animacja/glow karty przy scrollu w portfolio — `components/PortfolioCarousel.tsx`, `IntersectionObserver` na sekcji, jednorazowy puls (`raPortfolioGlowIn` keyframe) na środkowej karcie przy pierwszym wejściu w viewport, spójny ze świeceniem karty w `HeroCardAnimation.tsx` (`raGlowPulse`).
  - Max 2 fonty — usunięty 3. font (Unbounded, był tylko do nagłówków). `app/layout.tsx`/`app/globals.css`: `--font-hero` teraz wskazuje na Space Grotesk (pogrubiony, wszystkie miejsca miały już `font-weight:700`, więc wygląd nagłówków się nie zmienił). Zostają: Space Grotesk (tekst/nagłówki) + Space Mono (etykiety/cyber akcenty).
  - Pasek transparentności „Aktualny czas realizacji: 1–3 dni" — wpięty w istniejący pasek social media pod navem (`app/page.tsx`, stałe `CURRENT_TURNAROUND_PL`/`CURRENT_TURNAROUND_EN` na górze pliku, obok `SHOW_PROMO_BANNER`) — Michał aktualizuje ręcznie te 2 stałe, ma być spójne z liczbą w FAQ „Ile czasu zajmuje realizacja?" (`components/FaqReviews.tsx`).

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

Strona (ten repo) na razie tylko **zbiera** wytyczne/opis wizji od klienta w formularzu (motyw, custom_desc, atrybuty) — samo generowanie grafiki dzieje się POZA tym repo, w osobnej aplikacji (patrz „Aplikacja towarzysząca" niżej). Nie sugeruj wbudowywania generowania AI bezpośrednio w ten Next.js/Supabase projekt, chyba że Michał o to poprosi — to świadomie osobny, dedykowany desktop/lokalny tool, nie funkcja strony.

## Aplikacja towarzysząca — Rave Adventure Cards Creator (osobny projekt, NIE w tym repo)

Michał równolegle z redesignem tej strony buduje **osobną aplikację** do tworzenia grafik kart ze stylizacją AI — to nie jest kod w `raveadventure-web`, ale warto rozumieć jak działa, bo dwa punkty tego repo są jej częścią kontraktu:

- **Co robi**: operator (Michał) wgrywa zdjęcie klienta, wybiera jeden z **8 gotowych stylów AI** (fantasy oil painting, retro/chrome holo, komiksowy, cyberpunk/synthwave, anime klasyczne, anime realistic, GTA5, GTA5 realistic — albo pisze własny opis stylizacji) i jeden z **11 szablonów layoutu karty** (Classic/Custom/Power Bold/Diamond/Postać/Festival/Pokemon Pro/PokemonV1/Avengers/Cyber/LOKI/Mobile) + jeden z **11 motywów kolorystycznych** (ta sama paleta co `FRAME_COLORS` w `app/admin/page.tsx`). Zdjęcie trafia do jednego z **3 niezależnych dostawców AI**, wraca przestylizowane w formacie gotowym do druku (CR80/ID-1, 54×85,6mm, 300dpi), operator ocenia wynik (👍/👎) i pobiera plik. Każde wywołanie (dostawca, styl, czas, sukces/ocena) loguje się automatycznie do lokalnego dziennika jakości.
- **Punkt styku z tym repo — WAŻNE, nie psuć bez namysłu**: aplikacja **importuje jednym kliknięciem** plik `.txt` wygenerowany przyciskiem „eksportuj zamówienie" w panelu admina (`exportOrderAsText` w `app/admin/page.tsx`, patrz „Struktura kluczowych plików" wyżej) — parsuje ten format, żeby wypełnić dane zamówienia (imię/atrybuty/motyw/ilość/NFC) bez ręcznego przepisywania. **Ten `.txt` jest więc de facto nieformalnym API między dwoma projektami** — zmiana formatu/kolejności linii w `exportOrderAsText` może zepsuć import w Cards Creator. Jeśli trzeba zmienić ten eksport, warto to zasygnalizować Michałowi, żeby zaktualizował też parser po swojej stronie.
- **Skala i pozycjonowanie (wg stanu aplikacji, 2026-07-31)**: opisana jako „w codziennym użyciu produkcyjnym", rząd wielkości 10–30 kart dziennie obsługiwanych przez jedną osobę, priorytet to jakość/trafność za pierwszym razem, nie szybkość — nadal proces ręczny/kuratorski (operator przechodzi każde zamówienie krok po kroku), nie zautomatyzowana linia. To pozycjonuje całą markę jako premium/boutique, nie masową — istotne przy każdej rozmowie o marketingu/skalowaniu (patrz niżej).
- **Dlaczego to ważne dla tego repo**: to rozwiązuje wcześniej sygnalizowane ograniczenie mocy przerobowej czysto ręcznej pracy w Pixlr — jeśli w przyszłości padnie pytanie o tempo realizacji zamówień, dodanie nowych opcji na stronie (np. nowych stylów/szablonów jako wybieralnych przez klienta w formularzu) czy o roadmapę „generowania AI na stronie", ten kontekst jest istotnym punktem wyjścia do tej rozmowy — ale sama implementacja stylizacji AI zostaje POZA tym repo, chyba że Michał wyraźnie zdecyduje inaczej.

## SEO i favicon (dodane 2026-08-02)

Podstawowy techniczny SEO pass — bez zmian treści/UX, czysto konfiguracyjne:

- **Favicon/ikona karty**: `app/icon.png` (192×192) i `app/apple-icon.png` (180×180) — wycięte z `public/logo_kwadrat.png` (środkowy motyw: przerywana „karta" ze słupkami equalizera), bo pełne logo z napisem „RAVE ADVENTURE" jest nieczytelne w rozmiarze zakładki przeglądarki. To jedyny element tego passa, który jest decyzją designerską, nie tylko konfiguracją — jeśli Michał wolałby inny kadr/motyw jako ikonę, do podmiany w tych dwóch plikach (+ `public/icon-512.png` dla manifestu).
- **`public/manifest.json`** — nazwa/kolory/ikony pod PWA "dodaj do ekranu głównego" (Android/Chrome), niewymagane ale tanie do dodania przy okazji.
- **`app/robots.ts` / `app/sitemap.ts`** — konwencja Next.js App Router (dynamicznie generowane `/robots.txt` i `/sitemap.xml`, bazowe na `NEXT_PUBLIC_BASE_URL` jak reszta absolutnych linków w repo). Zablokowane dla robotów: `/admin`, `/api`, `/review`, `/status`, `/maintenance` (strony prywatne/tokenowe, nie do indeksowania). Sitemap na razie tylko `/` i `/portfolio` — jedyne dwie publiczne, warte indeksowania strony.
- **`app/layout.tsx`**: dodane `metadataBase` (potrzebne, żeby og:image/canonical budowały się jako pełne URL-e niezależnie od hosta), `icons`/`manifest` w `metadata`, `openGraph.images` + `twitter` card wskazujące na nowy `public/og-image.jpg` (1200×630, wycięty z `public/logo.png`, tło dopasowane do marki żeby nic się nie ucinało), oraz JSON-LD (`schema.org/Organization`) w `<head>` — pomaga wyszukiwarkom rozpoznać markę, nie wpływa na widoczną treść.
- **Poza zakresem tego passa** (świadomie nieruszane): treść/nagłówki stron (już OK), Google Search Console / weryfikacja domeny (do zrobienia dopiero po wdrożeniu na produkcję — wymaga dostępu do DNS/Vercela), realny content marketing (blog/artykuły) — to nie jest coś, co da się „dograć" konfiguracją.

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

_[✅ ZAKTUALIZOWANE 2026-08-06] Redesign z sekcji „Architektura i stack redesignu" wyżej jest już zaimplementowany i na żywo (patrz „Aktualny redesign" wyżej) — z jedną świadomą zmianą kierunku po drodze: Hero zostało na 2D/SVG (`components/HeroCardAnimation.tsx`) wzmocnionym o GSAP tilt/połysk, NIE przepisane na prawdziwe 3D (Three.js/R3F/Spline) — mniejszy koszt utrzymania dla jednoosobowego projektu. „Motion" z pierwotnego planu zastąpiony w całości przez GSAP (jedna biblioteka animacji zamiast dwóch nakładających się)._

- Next.js 14.2.35 (App Router), React 18, TypeScript 5
- Tailwind CSS v4 (`@tailwindcss/postcss`) + shadcn/ui (Accordion, Dialog, Tabs) — zastąpiły inline style/CSS Modules na całej stronie głównej i `/portfolio`; panel admina (`/admin/**`) i `/login` świadomie NIE migrowane, zostają na starym stylu
- GSAP (`gsap`, `@gsap/react`) — animacje, ScrollTrigger.batch() do reveali przy scrollu, tilt/połysk w Hero
- Lenis — płynny scroll, w domyślnym trybie (bez transformowanego wrappera — GSAP ScrollSmoother był testowany i odrzucony, bo łamał `position: fixed` nav), wyłączony na `/admin/**` i `/login`
- Supabase (`@supabase/supabase-js` ^2.43.4) — baza danych + Storage
- Resend — maile transakcyjne, wysyłane bezpośrednio przez `fetch('https://api.resend.com/emails')`, bez SDK
- Hosting: Vercel — auto-deploy z `main` (patrz „Aktualny redesign" wyżej)
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

**Ważne — middleware NIE chroni tras `/api/*`** (matcher tylko dla stron), więc każdy endpoint pod `/api/admin/*` sam sprawdza to samo ciasteczko przez `lib/adminAuth.ts` (`isAdminRequest(req)`), niezależnie od middleware.

### RLS na Supabase — orders/portfolio/reviews/Storage (2026-07-31)

Do 2026-07-31 tabela `orders` miała RLS włączone, ale z politykami `USING (true)` dla SELECT/UPDATE/DELETE — każdy znający publiczny klucz anon (musi być jawny w kodzie strony) mógł czytać/zmieniać/kasować WSZYSTKIE zamówienia (imiona, maile, telefony, adresy, zdjęcia, `review_token`) przez REST API Supabase, z pominięciem loginu do `/admin`. Naprawione: RLS na `orders` jest teraz zamknięte całkowicie dla ról `public`/`anon` (zero polityk — service_role i tak zawsze omija RLS). Wszystkie operacje na `orders` idą przez server-side API kluczem `SUPABASE_SERVICE_KEY`:
- `/api/admin/orders` (GET/PATCH/DELETE, chronione `admin_session`) — panel admina.
- `/api/admin/archive` (POST) — zbiorcza archiwizacja `closed-orders/` (przycisk w adminie); logika w `lib/orderArchive.ts`, używana też przez PATCH w `/api/admin/orders` przy zmianie statusu na `done`.
- `/api/admin/storage-refs` (GET) — listowanie grafik referencyjnych klienta dla `ClientMaterials` w adminie.
- `/api/create-order` (POST insert / PATCH photo_url) — jedyny publiczny, bez logowania, punkt zapisu (formularz zamówienia).
- `/api/order-status` (GET) — publiczny odczyt wąskiego zestawu pól po tokenie (`/status?token=`).

Ten sam wzorzec zastosowany do `portfolio` (SELECT zostaje publiczne — dane marketingowe; INSERT/UPDATE/DELETE tylko przez `/api/admin/portfolio`) i `reviews` (SELECT `approved=true` i INSERT `approved=false` zostają publiczne — obsługują formularz opinii; UPDATE/DELETE tylko przez `/api/admin/reviews`). Storage bucket `order-photos`: INSERT (upload) zostaje publiczne (zdjęcia klienta + projekty admina idą zawsze bezpośrednio z przeglądarki, Lekcja #3 niżej), ale SELECT (listowanie — advisor Supabase flagował to jako `public_bucket_allows_listing`), UPDATE (przenoszenie przy archiwizacji) i DELETE (kasowanie zamówienia) przeniesione server-side — bezpośredni dostęp po znanym URL nadal działa (bucket publiczny), zablokowane jest tylko wyliczanie/kasowanie/przenoszenie plików kluczem anon.

**Wniosek na przyszłość**: nowa tabela z danymi klienta lub panelem admina NIE powinna mieć RLS otwartego na `public`/`anon` dla SELECT/UPDATE/DELETE — pisać od razu przez server-side route kluczem service-role + `isAdminRequest()`, tak jak wyżej. Publiczne INSERT/SELECT są OK tylko gdy to świadomie zamierzona, publiczna funkcja (formularz zamówienia, formularz opinii, publiczne portfolio).

## Logika cenowa (musi zostać zachowana funkcjonalnie)

```
unitPrice = cena_typu_karty + cena_opcji_tyłu
  - Karta PVC: 40 zł
  - Wizytówka (100 szt.): 50 zł

hasDiscount (ilość ≥ 3) → -35% na (unitPrice × ilość)  [baseTotal]
  (QUANTITY_DISCOUNT_RATE w app/page.tsx — obniżone z -50% 2026-07-30, bo realny
  koszt wytworzenia z BOM pokazał zerową/ujemną marżę na zamówieniach 3+ szt.)
kod rabatowy → dodatkowy % od baseTotal (mechanizm gotowy, `DISCOUNT_CODES` w app/page.tsx —
  aktualnie: SIERRA 90% (rabat dla znajomych, celowo bez promocji/banera na stronie),
  RAVE20 20% (rabat na całość zamówienia, dodany 2026-08-09, bez ograniczenia czasowego
  na razie — do wygaszenia ręcznie przez usunięcie z mapy, tak jak wcześniej LSF2026 25%,
  promocja Łódź Summer Festival, wygasła 27.07.2026, usunięta 2026-07-31)

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

Wysyłka (SHIPPING_COST, app/page.tsx) — zależna od kraju wysyłki (shippingRegion) i sposobu dostawy:
  - Polska (domyślne): 15 zł, stałe, niezależnie od adres/paczkomat
  - Zagranica/UE + paczkomat InPost: 40 zł
  - Zagranica/UE + adres: 80 zł
  (od 2026-08-02 — patrz „Wysyłka za granicę (UE)" niżej po sekcji o mieszanym wykończeniu)

totalPrice = baseTotal - discountSaved + SHIPPING_COST + nfcTotal + cardFinishAddonTotal
```

### Mieszane wykończenie w jednym zamówieniu (od 2026-07-31)

Klient może w **kroku 1** zamówić kilka kart NARAZ w różnych wariantach wykończenia (np. 1x magnes
+ 2x Top Holder + 1x Top Holder+stojak), część z NFC — a nie tylko jeden wariant × jedna ilość jak
wcześniej. Ilość NIE jest już wpisywana osobno w kroku 4 — liczy się sama, jako suma wszystkich
wybranych wariantów z kroku 1 (dotyczy tylko karty PVC; Wizytówka nie ma wykończeń, zostaje przy
prostym liczniku `laminatedQty`).

- Stan w `app/page.tsx`: `finishBreakdown: Record<finishId, { qty, nfcQty }>` (domyślnie
  `{ standard: { qty: 1, nfcQty: 0 } }`) zamiast dawnych `cardFinish`/`quantity`/`nfcEnabled`.
  Każdy blok wykończenia w kroku 1 ma własny stepper ilości ORAZ własny sub-stepper NFC (capped —
  nie może przekroczyć ilości sztuk w tym bloku). NFC dotyczy tylko wybranych sztuk w danym bloku,
  nie całego zamówienia naraz (świadoma decyzja — klient może chcieć NFC np. tylko w 2 z 4 kart).
- Cena liczona jako suma po wszystkich aktywnych blokach (`activeFinishLines`): `quantity` = suma
  ilości, `nfcTotalQty` = suma NFC po blokach, rabat ilościowy -35% liczony od SUMY (próg 3+ szt.
  dotyczy całego zamówienia, nie pojedynczego wariantu), dopłaty za wykończenie i NFC nadal OSOBNO
  od rabatu (jak wcześniej), `zestaw_promocyjny` nadal zastępuje bazową cenę i płynie przez rabat.
  `unitPrice` zapisywany do bazy to teraz średnia cena/sztukę (`rawBaseTotal / quantity`) — czysto
  informacyjna, prawdziwy szczegół jest w rozbiciu.
- Zapis: `card_finish` zostaje pojedynczą wartością dla wstecznej kompatybilności (starych zamówień
  z jednym wariantem) — `'mixed'` gdy klient wybrał więcej niż jeden wariant naraz. Prawdziwy
  szczegół (który wariant, ile sztuk, ile z NFC) leży w nowej kolumnie `card_finish_breakdown`
  (jsonb, `[{finish, qty, nfc_qty}]`) — NULL dla starych/prostych zamówień. Nowa kolumna `nfc_qty`
  (int) to łączna liczba kart z NFC w całym zamówieniu (zamiast zakładać, że NFC dotyczy wszystkich
  sztuk — to był ukryty błąd w starym kodzie przy quantity>1, patrz niżej). `nfc_price` teraz
  zawsze przechowuje stawkę ZA SZTUKĘ (15 lub 8 zł), nie sumę — tak jak jest wyświetlane wszędzie
  (badge "+X zł"), więc to była naprawa błędu, nie zmiana znaczenia pola.
- Panel admina (`ClientMaterials`, `exportOrderAsText`) i mail `send-order` czytają
  `card_finish_breakdown` gdy obecne i pokazują pełne rozbicie; dla starych zamówień (NULL) wracają
  do dawnego pojedynczego `card_finish`. `send-design` nie pokazywał nigdy szczegółu wykończenia,
  więc nie wymagał zmian.

### Wysyłka za granicę / UE (od 2026-08-02)

Krok 5 formularza ma nowy toggle „Polska / Zagranica (UE)" (`shippingRegion` w `app/page.tsx`),
nad istniejącym toggle adres/paczkomat — ustalone bezpośrednio z Michałem (wcześniej wysyłka
tylko po Polsce, cena zawsze 15 zł). Ceny (patrz „Logika cenowa" wyżej): paczkomat zagraniczny
40 zł, adres zagraniczny 80 zł — to najtańsze realne stawki, jakie Michał znalazł, **nie zmieniać
bez konsultacji**.

- Darmowe publiczne API InPost używane do podpowiedzi (`app/api/inpost-search`,
  `components/InpostAutocomplete.tsx`) **obejmuje tylko polskie paczkomaty** — sprawdzone wprost
  zapytaniami do `api-pl-points.easypack24.net` (Praga/Bratysława/Wilno zwracają 0 wyników;
  "Berlin"/"Wien" trafiają przypadkiem w polskie miejscowości o podobnej nazwie, nie w prawdziwe
  niemieckie/austriackie paczkomaty). Dlatego przy `shippingRegion === 'intl'` i wybranym
  paczkomacie formularz pokazuje zwykłe pole tekstowe zamiast `InpostAutocomplete`/`InpostGeowidget`
  — klient wpisuje kod + miasto ręcznie (znajdzie go w aplikacji InPost lub lokalnym odpowiedniku
  w swoim kraju). Adres zagraniczny nie wymaga zmian — to od zawsze wolny tekst.
- Zmiana kraju czyści już wybrany/potwierdzony polski paczkomat (`paczkomatConfirmed`/`paczkomatId`/
  `form.address`) — polska wyszukiwarka nie ma sensu dla zagranicy i odwrotnie.
- Telefon jest teraz wymagany także dla każdego zamówienia zagranicznego (nie tylko paczkomatu) —
  kurier/InPost międzynarodowy częściej go potrzebuje niż krajowa dostawa na adres.
- Zapis: nowe kolumny `shipping_region` (`'pl'` | `'intl'`, domyślnie `'pl'`) i `shipping_cost`
  (int, faktyczna kwota policzona za wysyłkę na tym zamówieniu — zapisywana wprost, nie
  przeliczana później z region+metoda, żeby stare zamówienia zostały wiarygodne nawet gdyby
  stawki kiedyś się zmieniły).
- Widoczność dla Michała: badge „🌍 UE" na liście zamówień w `/admin` (obok NFC), badge w mailu
  admina (`/api/send-order`) z kwotą wysyłki, i osobna sekcja „WYSYŁKA ZAGRANICZNA" dopisana na
  samym końcu eksportu `.txt` (`lib/orderExportText.ts`) — TYLKO dla zamówień zagranicznych, więc
  eksport zamówień krajowych (zdecydowana większość) zostaje bajt w bajt identyczny jak wcześniej,
  parser Cards Creator nic nie traci.

### Łączenie wysyłki dwóch różnych zamówień (od 2026-08-09)

Problem: klient zamawiający dwie RÓŻNE karty (dwa osobne zamówienia — inny motyw/zdjęcie każde,
formularz obsługuje tylko jeden motyw na zamówienie) płacił dotąd za wysyłkę dwa razy, mimo że
Michał i tak wysyła je fizycznie razem w jednej kopercie. Rozwiązanie zaprojektowane wspólnie
z Michałem — świadomie **bez** automatycznej walidacji/wyszukiwania referencyjnego zamówienia
(zbędna złożoność przy tej skali, 10-30 kart dziennie, i tak ręcznie kuratorowanej).

- Krok 5 formularza: trzecia opcja w przełączniku „sposób dostawy" — obok „Adres wysyłki" /
  „Paczkomat InPost" — **„🔗 Połącz z innym zamówieniem"** (`deliveryMethod` w `app/page.tsx`
  rozszerzony z `'address' | 'paczkomat'` na `'address' | 'paczkomat' | 'combined'`). Po wybraniu:
  toggle kraju wysyłki (PL/zagranica) i pole adresu/paczkomatu znikają (nieistotne — ta karta
  jedzie z inną przesyłką), pokazuje się jedno pole tekstowe „Numer poprzedniego zlecenia"
  (`linkedOrderRef`, wymagane w tym trybie) z podpowiedzią że wysyłka nie zostanie doliczona.
- `SHIPPING_COST` automatycznie = 0 zł, gdy `deliveryMethod === 'combined'`, niezależnie od
  regionu — liczone deterministycznie z jawnego wyboru w formularzu, bez potrzeby ręcznej korekty
  ceny przez Michała w panelu admina (rozważana wcześniej, odrzucona jako zbędna, skoro pole jest
  ustrukturyzowane, nie wolnym tekstem w uwagach).
- Zapis: nowa kolumna `orders.linked_order_ref` (text, nullable) — surowy tekst, który klient
  wpisał (np. pierwsze 8 znaków ID, ten sam skrót co wszędzie indziej w projekcie), NIE
  zwalidowany względem realnych zamówień w czasie rzeczywistym — Michał ręcznie weryfikuje
  i fizycznie pakuje razem podczas realizacji.
- Widoczność dla Michała: badge „🔗 #XXXXXXXX" na liście zamówień w `/admin` (ten sam wzorzec co
  badge „🌍 UE"), oraz wiersz „🔗 Wysyłka połączona" w szczegółach zamówienia zamiast zwykłego
  adresu.
- Mail potwierdzający (`/api/send-order`) dostał nowy blok tuż pod linkiem do statusu zamówienia:
  „Twój numer zlecenia to #XXXXXXXX. Zamawiasz jeszcze jedną kartę? Podaj ten numer w kroku 5
  formularza..." — bez tego klient nie miałby skąd wziąć numeru do wpisania przy drugim
  zamówieniu.

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
delivery_method, paczkomat_id,
card_finish_breakdown, nfc_qty,
shipping_region, shipping_cost,
paybylink_transaction_id,
linked_order_ref
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

**Od 2026-08-01 — folder per zamówienie (`orders/{id8}/`)**, gdzie `{id8}` to
pierwsze 8 znaków `order.id` (ten sam skrót co w numerze „ZLECENIE #XXXXXXXX"
i w nazwie eksportowanego pliku .txt). Dotyczy TYLKO nowych zamówień od tej daty
— starsze zamówienia zostają przy starej, płaskiej strukturze (patrz niżej),
kod obsługuje oba warianty równolegle (delete/archiwizacja/wyszukiwanie grafik
referencyjnych sprawdzają nowy folder, z fallbackiem na starą strukturę).

```
orders/{id8}/front.ext                              — zdjęcie klienta
orders/{id8}/custom.ext                              — grafika referencyjna (custom theme)
orders/{id8}/ref-back.ext                             — grafika referencyjna tyłu
orders/{id8}/design-front-{timestamp}-original.ext    — oryginał projektu, wariant 1 (pełna rozdzielczość, NIE ładowany automatycznie nigdzie)
orders/{id8}/design-front-{timestamp}.jpg             — skompresowany podgląd projektu, wariant 1 (trafia do maila i podglądu w adminie)
orders/{id8}/design-front-2-{timestamp}-original.ext / design-front-2-{timestamp}.jpg — analogicznie dla wariantu 2 (opcjonalnego)
orders/{id8}/design-back-{timestamp}-original.ext / design-back-{timestamp}.jpg — analogicznie dla tyłu
orders/{id8}/zlecenie-{id8}.txt                       — kopia eksportu .txt (patrz „Eksport zamówienia" niżej), upsert przy każdym kliknięciu eksportu
closed-orders/<oryginalna-ścieżka>                    — archiwum: pliki zamówień ze statusem "done" (działa niezależnie od struktury, patrz niżej)
```

**Cel folderu per zamówienie**: Michał ściąga jedną, kompletną paczkę
(zdjęcie + projekty + .txt) zamiast szukać plików osobno w płaskiej strukturze
— to jednocześnie zastępuje pomysł zapisu na dysk lokalny (`C:\...\Cards_Projects\
orders`, technicznie niemożliwy bez interakcji użytkownika — przeglądarka nie
może pisać na dowolnej ścieżce dysku bez zgody) czymś prostszym i solidniejszym.

**Stara, płaska struktura (zamówienia sprzed 2026-08-01)** — wciąż w użyciu dla
istniejących zamówień, kod ma dla niej fallback:
```
{id}-front.ext                        — zdjęcie klienta
{id}-custom.ext                       — grafika referencyjna (custom theme)
{id}-ref-back.ext                     — grafika referencyjna tyłu
designs/{id}-{timestamp}-original.ext — oryginał projektu (pełna rozdzielczość, NIE ładowany automatycznie nigdzie)
designs/{id}-{timestamp}.jpg          — skompresowany podgląd projektu (trafia do maila i podglądu w adminie)
designs/{id}-{timestamp}-back-original.ext / -back.jpg — analogicznie dla tyłu
```

**Eksport zamówienia jako .txt** (logika w `lib/orderExportText.ts` —
`buildOrderExportLines`, budowanie treści — i `lib/orderExportServer.ts` —
`regenerateOrderTxt`, pobranie zamówienia + wgranie do Storage; ten sam format
co zawsze, patrz „Aplikacja towarzysząca" wyżej, to on jest importowany przez
Cards Creator) trafia do `orders/{id8}/zlecenie-{id8}.txt` w Supabase na DWA
sposoby:
- **Automatycznie** (`/api/generate-order-txt`, publiczny endpoint bez
  logowania) — wywoływane z `app/page.tsx` zaraz po złożeniu zamówienia i
  zapisaniu zdjęcia, więc folder `orders/{id8}/` jest kompletny od razu, bez
  ręcznego klikania w panelu. Nie blokuje potwierdzenia zamówienia, jeśli się
  nie uda (fire-and-forget).
- **Ręcznie** (`/api/admin/export-txt`, chronione `admin_session`) — przycisk
  „📄 Eksportuj dane zlecenia" w panelu, przeliczany na świeżo (odzwierciedla
  aktualny status/płatność/projekt), zwraca treść do panelu, który jednocześnie
  uruchamia zwykłe pobranie pliku na dysk.

Obie ścieżki idą server-side kluczem service-role (`upsert:true` bezpieczne
tylko tam — service-role zawsze omija RLS; klucz anon używany w `app/page.tsx`
do uploadu zdjęcia/grafik referencyjnych celowo NIE ma `upsert:true`, patrz
Lekcja #6 niżej). Działa tylko na prawdziwym Supabase (lokalnie/placeholder
buduje treść w przeglądarce tą samą funkcją `buildOrderExportLines`, bez
uploadu). Plik .txt w Storage NIE jest częścią automatycznej archiwizacji przy
statusie „done" (patrz niżej) — zostaje w `orders/{id8}/` nawet po
przeniesieniu zdjęć/projektów do `closed-orders/`.

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
6. **`upsert: true` w Supabase Storage wymaga uprawnienia UPDATE, nawet dla pliku, który jeszcze nie istnieje.** Po zamknięciu RLS na `storage.objects` (patrz „RLS na Supabase" wyżej) klucz anon ma tylko INSERT — wszystkie uploady klienta (zdjęcie zamówienia, grafiki referencyjne) używały `{ upsert: true }`, mimo że ścieżka zawsze zawiera świeże ID zamówienia i nigdy realnie nie koliduje. Skutek: **każdy upload kończył się cichym błędem 403** (`new row violates row-level security policy`) — zamówienia zapisywały się bez zdjęcia, bez żadnego widocznego komunikatu dla klienta. Zweryfikowane bezpośrednio na produkcyjnym Storage: identyczny request z `upsert:false` → 200, z `upsert:true` → 403, ta sama polityka RLS. **Zasada na przyszłość**: `upsert: true` z kluczem anon/publicznym używać TYLKO gdy naprawdę trzeba nadpisywać istniejący plik (i wtedy dodać politykę UPDATE świadomie) — jeśli ścieżka jest z definicji zawsze nowa (zawiera unikalne ID), używać `upsert: false`. Operacje faktycznie wymagające nadpisania (np. eksport .txt zamówienia, przeliczany wielokrotnie) powinny iść server-side kluczem service-role (zawsze omija RLS), nie klientem z kluczem anon.

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
- Domena produkcyjna: raveadventure.pl — auto-deploy z `main` przez Vercel (patrz „Aktualny redesign" wyżej), na żywo od 2026-08-02

## Pytania, które warto zadać Michałowi zanim zrobisz coś dużego

- Czy dana zmiana dotyczy tylko wyglądu, czy też przepływu/logiki biznesowej (te drugie wymagają większej ostrożności).
- Czy zmiana w bazie wymaga migracji SQL — jeśli tak, przypomnieć o kolejności (najpierw SQL, patrz Lekcja #1).
- Michał lubi rozumieć dlaczego, nie tylko co — krótkie uzasadnienie decyzji technicznej jest mile widziane, ale bez przesadnego rozwlekania.
- Integracja Paybylink jest już zbudowana i zweryfikowana (2026-08-06, patrz „Niezmienniki biznesowe i bezpieczeństwo" wyżej) — nie trzeba już o nią dopytywać jako o rzecz w toku, chyba że pojawi się realny problem/pytanie od Michała po pierwszych prawdziwych płatnościach.
