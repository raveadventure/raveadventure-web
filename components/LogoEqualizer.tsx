'use client'
import { useEffect, useRef } from 'react'

// Animowana wersja logo (public/logo_strona.svg) — patrz pamięć project-logo-symbolism dla pełnej
// interpretacji. Michał narysował w Inkscape referencyjne linie DOKŁADNIE tam, gdzie mają
// przebiegać kropki (na tym samym viewBox 1024x383 co ta animacja) — współrzędne poniżej są
// przepisane 1:1 z tych linii (path2/path3 = pierwsza fala przed ramką, path13/path14 = druga
// fala po ramce, path15/path15-2 = rozjazd po dużej kropce, rect39 po transformie = złota ramka),
// nie estymowane ręcznie jak poprzednio. Kropki poruszają się przez natywne SVG
// animateMotion/mpath (CSS offset-path liczy współrzędne jako surowe piksele względem kontenera,
// nie jako skalowalny viewBox — SVG viewBox skaluje się poprawnie responsywnie).
//
// Choreografia w pętli, sterowana przez fazy czasowe zdefiniowane niżej (T):
//  1) dwie kropki jadą od lewej ZE STAŁĄ prędkością (bez przyspieszania) do lewej krawędzi ramki
//  2) obie kropki spotykają się przy pierwszym słupku wchodząc do ramki, wtedy mocno zwalniają
//     (prędkość w ramce jest bardzo mała): CIEMNA jedzie w prawo płasko, bez podskoku; FIOLETOWA
//     robi 4 kolejne, oddzielne podbicia — delikatne przy 1. słupku, coraz wyższe przy 2. i 3.,
//     każde z powolnym opadaniem między nimi — aż do 4. (najwyższego) słupka
//  3) na szczycie 4. słupka zatrzymują się — fioletowa jest wtedy na samym szczycie tego podbicia —
//     DOPIERO WTEDY rama błyska jak flesz aparatu (mocny rdzeń w ramce + delikatny poblask na
//     zewnątrz), a JEDNOCZEŚNIE sama fioletowa kropka też błyska własnym blaskiem; ciemna nie błyska
//  4) po flashu fioletowa nadal podskakuje (ciemna nadal jedzie płasko) aż dojedzie do miejsca,
//     gdzie linia w tle zaczyna piąć się do góry — od tego momentu obie jadą już PO LINII, bez
//     żadnych podskoków
//  5) POZA ramką prędkość jest wszędzie taka sama (jak w etapie 1) — bez żadnego przyspieszania —
//     w tym tempie dojeżdżają do dużej FIOLETOWEJ kropki na końcu i OBIE się zatrzymują w jednym miejscu
//  6) złota strzałka wypełnia się (nie linia — realny kształt grota, przycinany rosnącym
//     prostokątem) TYLKO do końca grota, nigdy na kropkę — gdy dobiegnie do końca, mała fioletowa
//     kropka zapala się własnym błyskiem (czarna nie)
//  7) dopiero wtedy małe kropki ruszają POWOLI: ciemna wolno w dół, fioletowa tylko trochę
//     szybciej w górę (delikatny kontrast tempa, nie efekt "szybko")
//  8) pętla od nowa

// Mnożnik tempa całej sekwencji (czas trwania = SPEED × baza; im mniejszy SPEED, tym szybciej).
// Był (2/1.4)x, teraz dodatkowo przyspieszony x3 względem tego: (2/1.4)/3. Skaluje LOOP_S
// i wszystkie fazy czasowe T; ułamki KP_DARK/KP_VIOLET (czysto geometryczne) bez zmian.
const SPEED = (2 / 1.4) / 3

// Jedna, wspólna prędkość "przez słupki" (od 1. do 11., cała strefa ramka+ogon) — TA SAMA przed
// i po pierwszym błysku, żeby ruch w prawo nie zmieniał tempa w połowie drogi. V_BARS≈25 j./s,
// wyraźnie wolniej niż V_out≈60 poza ramką. Pozycje X: wejście do ramki/1. słupek=402.26,
// 4. (najwyższy) słupek=474.10, prawa krawędź ramki=522.04, koniec ogona/11. słupek=640.86
// (te same liczby co BRIDGE_X/BAR_DATA niżej). BAR_CYCLE (czas jednego "taktu" podbicia 1-4)
// jest wyliczony z V_BARS, nie wpisany na sztywno — więc oba odcinki mają dokładnie tę samą prędkość.
const V_BARS = 12.5
const BAR_RISE_FRAC = 0.18
const BASE_FRAME_L = 8.7
// Płaski "dojazd" od wejścia do ramki (x=402.26) — obie kropki łączą się na poziomie zero przy
// 1. słupku (x=405.63) i JADĄ DALEJ płasko aż do środka 2. słupka (x=427.91) — dopiero tam
// fioletowa zaczyna pierwsze podbicie. Stąd 3 podbicia (słupki 2,3,4), nie 4.
const BAR2_LEAD = (427.91 - 402.26) / V_BARS
const N_BOUNCES = 3 // słupki 2, 3, 4 — 1. słupek to tylko punkt spotkania na zero
const BAR_CYCLE = (474.10 - 427.91) / V_BARS / (N_BOUNCES - 1 + BAR_RISE_FRAC)
const BASE_CENTER = BASE_FRAME_L + BAR2_LEAD + (N_BOUNCES - 1 + BAR_RISE_FRAC) * BAR_CYCLE
// UWAGA: BASE_* są w "sekundach bazowych", które SPEED później skaluje (T.x = BASE_x * SPEED) —
// więc żeby pauza w ramce trwała naprawdę 1 sekundę na żywo (nie 1s×SPEED, czyli realnie mniej
// przy przyspieszonym SPEED<1), dzielimy tutaj przez SPEED, żeby po przemnożeniu wyszło dokładnie 1s.
const BASE_CENTER_END = BASE_CENTER + 1.0 / SPEED
const BASE_FRAME_R = BASE_CENTER_END + (522.04 - 474.10) / V_BARS
const BASE_TAIL_END = BASE_FRAME_R + (640.86 - 522.04) / V_BARS
const BASE_JUNCTION = BASE_TAIL_END + 8.3
const BASE_JUNCTION_END = BASE_JUNCTION + 1.0
// Odjazd po drugim błysku (gdy fioletowa zaświeci po wypełnieniu strzałki) — tempo V_out/2, czyli
// o połowę wolniej niż odcinek od startu do ramki (V_out≈60 j./s). Długości łuków: path15 (ciemna,
// w dół) = 181.24, path15-2 (fioletowa, w górę) = 199.81 — przy tej samej prędkości fioletowa
// jedzie dłużej (bo ma dłuższą drogę), więc to ona wyznacza koniec pętli.
const FINAL_SPEED = 30
const BASE_DARK_DONE = BASE_JUNCTION_END + 181.24 / FINAL_SPEED
const BASE_VIOLET_DONE = BASE_JUNCTION_END + 199.81 / FINAL_SPEED
// Zanikanie TUŻ PRZED końcem — każda kropka gaśnie w ostatniej chwili swojego DOJAZDU (kończy
// znikać dokładnie gdy dojeżdża do końca przerywanej linii), więc nigdy nie widać jak się
// zatrzymuje i stoi. Ciemna i fioletowa kończą w różnych momentach, więc mają OSOBNE zanikanie
// (patrz dotFadeDarkKf/dotFadeVioletKf niżej) — każda gaśnie względem WŁASNEGO czasu dojazdu.
const FADE_LEAD = 0.35
// Po tym jak obie zgasły — chwila całkowitej niewidoczności zanim pętla się zawinie i (po krótkim
// starcie) pojawią się od nowa. Celowo hojny margines (POST_GAP + START_HOLD niżej) — CSS
// (opacity) i SMIL (animateMotion) to dwa NIEZALEŻNE zegary w przeglądarce; zbyt ciasny margines
// między "zgasło" a "zawinięcie pętli" mógł powodować sporadyczne, krótkie mignięcie kropki w
// starej pozycji przez drobny poślizg między tymi zegarami — stąd też START_HOLD (kropka NIE
// zaczyna pojawiać się od razu na 0%, tylko dopiero kawałek później, gdy pozycja na pewno już
// zresetowała się na start trasy).
// Podane w realnych sekundach (dzielone przez SPEED jak pauza w ramce wyżej) — niezależnie od
// aktualnego SPEED margines bezpieczeństwa ma trwać naprawdę tyle na żywo, nie mniej.
const POST_GAP = 1.0 / SPEED
const START_HOLD = 0.4 / SPEED
const BASE_LOOP = Math.max(BASE_DARK_DONE, BASE_VIOLET_DONE) + POST_GAP

const LOOP_S = BASE_LOOP * SPEED

// Fazy czasowe (sekundy w pętli). Poza ramką jedna, stała prędkość referencyjna V_out≈60
// jednostek/s wszędzie (etap 1, "ogon" po ramce i dojazd do dużej kropki — każdy odcinek dobrany
// wg długości łuku tej trasy, więc żadna kropka nigdy nie przyspiesza ponad ten pułap). W ramce
// prędkość jest wielokrotnie mniejsza (V_in≈15 jednostek/s) — "bardzo mała".
const T = {
  frameL: BASE_FRAME_L * SPEED,           // dojazd do lewej krawędzi ramki / 1. słupka — stałe tempo V_out
  center: BASE_CENTER * SPEED,            // szczyt 4. (najwyższego) słupka — start pauzy
  centerEnd: BASE_CENTER_END * SPEED,     // koniec pauzy (1s) — flesz
  frameR: BASE_FRAME_R * SPEED,           // prawa krawędź ramki (nadal V_in, dalsze słupki 5+)
  tailEnd: BASE_TAIL_END * SPEED,         // koniec "ogona" tuż za ramką — od tąd znów V_out
  junction: BASE_JUNCTION * SPEED,        // dotarcie do dużej kropki — cała droga tailEnd→junction w jednym tempie V_out
  junctionEnd: BASE_JUNCTION_END * SPEED, // koniec pauzy — wypełnienie strzałki się kończy, kropka błyska fioletowo
  darkDone: BASE_DARK_DONE * SPEED,       // ciemna dojechała w dół (tempo V_out/2) — i w tej samej chwili gaśnie
  violetDone: BASE_VIOLET_DONE * SPEED,   // fioletowa dojechała w górę (tempo V_out/2) — i w tej samej chwili gaśnie
}
const pct = (s: number) => +(s / LOOP_S * 100).toFixed(3)
// SMIL keyTimes (animateMotion) wymaga ułamków 0–1, NIE procentów 0–100 jak CSS @keyframes —
// osobna funkcja, żeby nie pomylić jednostek (to właśnie spowodowało, że animateMotion było
// całkowicie odrzucane przez przeglądarkę: "Invalid value" w konsoli).
const frac = (s: number) => +(s / LOOP_S).toFixed(4)

// Ułamki długości ścieżki (keyPoints) — policzone (flattening beziera) z realnej długości łuku
// każdej trasy. Kropka CIEMNA jedzie teraz po NIŻSZEJ (płytszej) fali z tła (dawne path3/path14),
// a FIOLETOWA po WYŻSZEJ fali (dawne path2/path13) — tak by w pierwszym etapie ciemna była na
// dole, a fioletowa na górze. "junction" jest geometrycznie stałe (koniec drugiej fali). Odcinek
// tailEnd→junction jest teraz JEDNĄ nogą o stałej prędkości (bez pośredniego "przyspieszania").
// "center" przeliczony na pozycję 4. (najwyższego) słupka x≈474.1, nie na geometryczny środek ramki.
const KP_DARK = { frameL: 0.381, center: 0.4445, frameR: 0.485, tailEnd: 0.589, junction: 0.843 }
const KP_VIOLET = { frameL: 0.359, center: 0.4078, frameR: 0.441, tailEnd: 0.522, junction: 0.863 }

// Trasy 1:1 z linii referencyjnych w logo_strona.svg. Ciemna = niższa fala (path3+path14) + rozjazd
// w dół (path15-2 → UWAGA: w dół idzie oryginalny "path15", patrz niżej). Fioletowa = wyższa fala
// (path2+path13) + rozjazd w górę.
const PATH_DARK = 'M15.92,244.53 C16.14,244.40 76.74,238.84 90.70,231.52 C103.91,224.59 134.06,191.19 161.25,190.89 C188.37,190.59 205.48,229.81 232.52,227.69 C259.37,225.59 269.85,181.85 296.32,180.61 C317.04,179.65 329.49,207.72 350.01,210.73 C367.23,213.25 401.78,197.82 401.78,197.82 L641.94,199.73 C641.94,199.73 712.44,199.80 719.95,194.83 C732.44,186.57 740.82,152.84 750.17,152.77 C759.24,152.71 773.06,192.69 781.47,192.68 C787.14,192.68 792.25,163.21 807.71,193.22 C821.05,219.12 833.94,192.08 867.30,188.86 L868.38,188.50 C911.41,276.37 951.95,307.57 994.06,304.65'
const PATH_VIOLET = 'M16.07,244.42 C43.23,230.03 104.75,152.69 119.36,152.65 C133.96,152.62 137.51,180.49 159.32,181.33 C182.06,182.21 209.50,101.98 230.11,100.79 C256.41,99.28 270.47,155.74 295.36,155.28 C308.31,155.05 318.25,140.04 323.77,139.99 C353.00,139.68 349.92,186.65 402.26,197.82 L640.86,199.49 C678.89,210.69 709.46,87.33 715.98,86.69 C725.44,85.77 729.01,105.90 735.00,103.18 C748.15,97.21 750.05,23.95 764.37,21.21 C776.21,20.70 790.76,92.83 793.75,84.78 L797.12,75.70 C812.66,33.83 819.15,167.53 869.83,189.46 L869.15,186.25 C936.95,164.17 945.42,36.56 995.31,41.79'
// Prawdziwy, wypełniony kształt grota strzałki — przepisany 1:1 z path50 w logo_strona.svg
// (to ten sam kontur co statyczna złota strzałka w tle). Efekt animacji to NIE rysowanie cienkiej
// linii, tylko rosnący prostokąt przycinający (clipPath), który odsłania ten kształt od strony
// ramki w stronę grota — więc "wypełnienie" z definicji kończy się dokładnie tam, gdzie kończy się
// realny grot, i nigdy nie wchodzi na dużą kropkę.
const PATH_ARROW_FILL = 'm 520.37057,340.62442 c 9.23083,19.64737 57.21679,20.15036 90.57227,17.91283 124.24093,-9.48258 188.26446,-79.49411 219.28019,-117.95434 l -16.34386,-2.36583 42.56214,-29.40409 -2.72396,50.35872 -9.53391,-14.19506 c -49.58677,51.11164 -107.86616,105.09174 -232.21914,117.95433 -49.18947,4.13794 -88.01652,0.15551 -102.83018,-22.64454 z'
// Bounding box grota (policzony z powyższej ścieżki): x 509–856, y 209–367 — prostokąt przycinający
// jest o kilka jednostek większy z każdej strony, żeby margines nie ucinał krawędzi kształtu.
const ARROW_CLIP_X = 500
const ARROW_CLIP_Y = 195
const ARROW_CLIP_H = 185
const ARROW_CLIP_FULL_W = 380
// Duża kropka (zbieżność tras) — środek elipsy z logo_strona.svg po transformie Inkscape
const JUNCTION_X = 865
const JUNCTION_Y = 187.5

const BAR_HEIGHTS = [20, 34, 50, 64, 70, 64, 50, 34, 20]
// Equalizer w ramce wyłączony na prośbę (przeszkadzał wizualnie) — kod zostaje, żeby łatwo
// przywrócić przełącznikiem, gdy będzie potrzebny.
const SHOW_EQUALIZER = false

const darkKeyTimes = [0, T.frameL, T.center, T.centerEnd, T.frameR, T.tailEnd, T.junction, T.junctionEnd, T.darkDone, LOOP_S].map(frac).join(';')
const darkKeyPoints = [0, KP_DARK.frameL, KP_DARK.center, KP_DARK.center, KP_DARK.frameR, KP_DARK.tailEnd, KP_DARK.junction, KP_DARK.junction, 1, 1].join(';')

const violetKeyTimes = [0, T.frameL, T.center, T.centerEnd, T.frameR, T.tailEnd, T.junction, T.junctionEnd, T.violetDone, LOOP_S].map(frac).join(';')
const violetKeyPoints = [0, KP_VIOLET.frameL, KP_VIOLET.center, KP_VIOLET.center, KP_VIOLET.frameR, KP_VIOLET.tailEnd, KP_VIOLET.junction, KP_VIOLET.junction, 1, 1].join(';')

// 11 realnych słupków equalizera z logo_strona.svg (x środka + wysokość szczytu ponad linią bazową
// kropki w ramce, y≈198.5) — kropka fioletowa "surfuje" po ich szczytach, zamiast generycznej fali.
const BASELINE_Y = 198.5
const BAR_DATA = [
  { x: 405.63, top: 173.68 },
  { x: 427.91, top: 157.70 },
  { x: 451.88, top: 120.19 },
  { x: 474.10, top: 74.75 },  // najwyższy słupek
  { x: 497.55, top: 123.47 },
  { x: 523.44, top: 143.60 },
  { x: 545.18, top: 161.51 },
  { x: 568.96, top: 118.23 },
  { x: 591.49, top: 142.86 },
  { x: 615.27, top: 168.13 },
  { x: 636.15, top: 185.14 },
].map(b => ({ x: b.x, h: BASELINE_Y - b.top }))

function barHeightAtX(x: number) {
  if (x <= BAR_DATA[0].x) return BAR_DATA[0].h
  if (x >= BAR_DATA[BAR_DATA.length - 1].x) return BAR_DATA[BAR_DATA.length - 1].h
  for (let i = 0; i < BAR_DATA.length - 1; i++) {
    const a = BAR_DATA[i], b = BAR_DATA[i + 1]
    if (x >= a.x && x <= b.x) return a.h + (b.h - a.h) * (x - a.x) / (b.x - a.x)
  }
  return 0
}

// Od 10. słupka fioletowa już schodzi w dół do wysokości ciemnej (0), tak by przy 11. (ostatnim)
// słupku jechać już równo z ciemną, po linii — zamiast dalej "surfować" po realnej (niskiej, ale
// niezerowej) wysokości ostatnich dwóch słupków.
function violetTailHeightAtX(x: number) {
  const bar10 = BAR_DATA[9], bar11 = BAR_DATA[10]
  if (x < bar10.x) return barHeightAtX(x)
  if (x >= bar11.x) return 0
  const h10 = barHeightAtX(bar10.x)
  return h10 * (1 - (x - bar10.x) / (bar11.x - bar10.x))
}

// Pozycja X kropki wewnątrz "mostka" przez ramkę w chwili t — mostek to prosta linia, więc X jest
// liniowe względem czasu w każdym odcinku (te same punkty co keyPoints fioletowej: wejście do
// mostka, środek ramki, wyjście z ramki, koniec mostka za ramką).
const BRIDGE_X = { frameL: 402.26, center: 474.10, frameR: 522.04, tailEnd: 640.86 }
function xAtT(t: number) {
  if (t <= T.frameL) return BRIDGE_X.frameL
  if (t <= T.center) return BRIDGE_X.frameL + (BRIDGE_X.center - BRIDGE_X.frameL) * (t - T.frameL) / (T.center - T.frameL)
  if (t <= T.centerEnd) return BRIDGE_X.center
  if (t <= T.frameR) return BRIDGE_X.center + (BRIDGE_X.frameR - BRIDGE_X.center) * (t - T.centerEnd) / (T.frameR - T.centerEnd)
  if (t <= T.tailEnd) return BRIDGE_X.frameR + (BRIDGE_X.tailEnd - BRIDGE_X.frameR) * (t - T.frameR) / (T.tailEnd - T.frameR)
  return BRIDGE_X.tailEnd
}

// Generuje @keyframes podskoku fioletowej kropki. Dwie różne fazy:
//  A) frameL→center: obie kropki łączą się na poziomie zero przy 1. słupku i jadą płasko dalej —
//     DOPIERO od 2. słupka fioletowa robi 3 ODDZIELNE, dyskretne podbicia (słupki 2,3,4) — każde
//     szybko rośnie do wysokości TEGO słupka i powoli opada (poza ostatnim: 4. słupek, najwyższy,
//     kończy się na szczycie bez opadania — to jest dokładnie T.center, start pauzy/flesza).
//  B) centerEnd→tailEnd: ciągłe "surfowanie" po szczytach pozostałych słupków (5-11), tak jak
//     wcześniej — wysokość w każdej chwili = wysokość realnego słupka aktualnie mijanego.
function buildDotBounce(suffix: string) {
  const step = 0.05
  const stops: { t: number; v: number }[] = []
  stops.push({ t: 0, v: 0 })
  stops.push({ t: T.frameL, v: 0 })
  const cyclesStart = T.frameL + BAR2_LEAD * SPEED // płaski dojazd do środka 2. słupka przed startem podskoków
  stops.push({ t: cyclesStart, v: 0 })
  for (let i = 0; i < N_BOUNCES; i++) {
    const h = BAR_DATA[i + 1].h // słupki 2,3,4 = BAR_DATA[1..3]
    const cycleStart = cyclesStart + i * BAR_CYCLE * SPEED
    const riseLen = BAR_CYCLE * SPEED * BAR_RISE_FRAC
    const peakT = cycleStart + riseLen
    stops.push({ t: peakT, v: -h }) // szybki wzrost do wysokości słupka i+2
    if (i < N_BOUNCES - 1) {
      const fallEndT = cycleStart + BAR_CYCLE * SPEED
      stops.push({ t: fallEndT, v: 0 }) // powolne opadanie z powrotem do linii bazowej
    }
  }
  const vCenter = -BAR_DATA[3].h // szczyt 4. (najwyższego) słupka — bez opadania, trzyma się aż do T.center
  stops.push({ t: T.center, v: vCenter })
  stops.push({ t: T.centerEnd, v: vCenter }) // zamrożona wysokość przez całą pauzę
  for (let t = T.centerEnd; t < T.tailEnd; t += step) stops.push({ t, v: -violetTailHeightAtX(xAtT(t)) })
  stops.push({ t: T.tailEnd, v: -violetTailHeightAtX(xAtT(T.tailEnd)) }) // już 0 — równo z ciemną na 11. słupku
  stops.push({ t: LOOP_S, v: 0 })

  const seen = new Set<string>()
  const body = stops
    .filter(s => { const k = s.t.toFixed(3); if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => a.t - b.t)
    .map(s => `${pct(s.t)}% { transform: translateY(${s.v.toFixed(2)}px); }`)
    .join('\n          ')
  return `@keyframes dotBounceKf${suffix} {\n          ${body}\n        }`
}

// Klasy wszystkich elementów sterowanych przez CSS @keyframes (osobny "zegar" od SMIL
// animateMotion poniżej) — używane przez efekt synchronizujący do wymuszenia jednoczesnego
// restartu obu zegarów po zamontowaniu.
const CSS_ANIMATED_SELECTOR = '.dotBounceViolet, .violetGlow, .violetGlowGold, .dotFadeDark, .dotFadeViolet, .arrowFillRect, .junctionFlash, .frameFlashCore, .frameFlashHalo'

export default function LogoEqualizer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // CSS animations i SMIL (animateMotion) to dwa NIEZALEŻNE zegary w przeglądarce — nawet przy
  // identycznej długości pętli (LOOP_S) startują w nieco innych momentach (zwłaszcza przy
  // hydratacji), więc kropki (SMIL) i ich podskoki/błyski/zanikanie (CSS) rozjeżdżają się i
  // zostają rozjechane na stałe (ta sama różnica co pętlę). Wymuszamy tu jednoczesny restart
  // obu zegarów zaraz po zamontowaniu, żeby zawsze startowały z tego samego momentu — bez tego
  // synchronizacja zależała od przypadku (stąd "działa dopiero po odświeżeniu", ale nie zawsze).
  useEffect(() => {
    const svg = svgRef.current
    const root = rootRef.current
    if (!svg || !root) return

    const cssEls = root.querySelectorAll<HTMLElement | SVGElement>(CSS_ANIMATED_SELECTOR)
    cssEls.forEach(el => { (el as HTMLElement).style.animation = 'none' })

    const motions = svg.querySelectorAll('animateMotion')
    motions.forEach(m => {
      const anim = m as unknown as { beginElement?: () => void }
      try { anim.beginElement?.() } catch { /* SMIL beginElement niedostępne (bardzo stara przeglądarka) — SVG i tak wystartuje samo, tylko bez wymuszonej synchronizacji */ }
    })

    // Wymuszony reflow — bez odczytu layoutu przeglądarka mogłaby zbatchować "none" i przywrócenie
    // animacji w jedną klatkę i restart by się nie wydarzył.
    void root.offsetHeight

    cssEls.forEach(el => { (el as HTMLElement).style.animation = '' })
  }, [])

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      <img src="/logo_white.png" alt="RaveAdventure" style={{ width: '100%', height: 'auto', display: 'block' }} />

      {/* equalizer w ramce — pozycja 1:1 ze złotej ramki (rect39 po transformie) w logo_strona.svg.
          Wyłączony (SHOW_EQUALIZER=false) na prośbę, kod zostaje na później. */}
      {SHOW_EQUALIZER && (
        <div style={{
          position: 'absolute',
          left: '37.15%', width: '13.84%',
          top: '12.66%', height: '75.87%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3%',
        }}>
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: '3px',
              background: 'linear-gradient(180deg, #e0b3ff, var(--neon) 60%, #7a1fd6)',
              boxShadow: '0 0 8px rgba(180,77,255,0.9), 0 0 16px rgba(180,77,255,0.5)',
              animation: 'eqPulse 1.8s ease-in-out infinite',
              transformOrigin: 'center',
            }} />
          ))}
        </div>
      )}

      {/* błysk ramki (flesz) — mocny rdzeń w ramce + osobna, szersza i rozmyta warstwa dająca
          delikatny poblask poza jej krawędziami; obie zapalają się dopiero gdy podskoki ustają */}
      <div className="frameFlashCore" style={{
        position: 'absolute',
        left: '37.15%', width: '13.84%', top: '12.66%', height: '75.87%',
        borderRadius: '18px',
        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,235,180,0.95) 40%, rgba(245,180,0,0.65) 72%, transparent 100%)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />
      <div className="frameFlashHalo" style={{
        position: 'absolute',
        left: '28%', width: '30%', top: '-2%', height: '104%',
        borderRadius: '50px',
        background: 'radial-gradient(circle, rgba(255,225,150,0.5) 0%, rgba(245,180,0,0.22) 50%, transparent 78%)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        filter: 'blur(6px)',
      }} />

      {/* kropki + blask strzałki + błysk dużej kropki — natywne SVG, viewBox skaluje się razem z obrazkiem */}
      <svg ref={svgRef} viewBox="0 0 1024 383" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <radialGradient id="gradDark" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#cfc2e0" />
            <stop offset="35%" stopColor="#6b5a80" />
            <stop offset="70%" stopColor="#2a1638" />
            <stop offset="100%" stopColor="#150a1e" />
          </radialGradient>
          <radialGradient id="gradViolet" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#f0e0ff" />
            <stop offset="40%" stopColor="#d199ff" />
            <stop offset="75%" stopColor="#b44dff" />
            <stop offset="100%" stopColor="#4a1480" />
          </radialGradient>
          <radialGradient id="gradJunctionFlash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#e0b3ff" />
            <stop offset="60%" stopColor="#b44dff" />
            <stop offset="100%" stopColor="#b44dff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arrowFillGrad" x1="520" y1="340" x2="856" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe694" />
            <stop offset="100%" stopColor="#fff8dd" />
          </linearGradient>
          <filter id="glowBlur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="arrowFillClip">
            <rect x={ARROW_CLIP_X} y={ARROW_CLIP_Y} width="0" height={ARROW_CLIP_H} className="arrowFillRect" />
          </clipPath>
        </defs>

        {/* błysk dużej kropki — zapala się dopiero gdy wypełnienie strzałki dobiegnie do grota */}
        <circle cx={JUNCTION_X} cy={JUNCTION_Y} r="44" fill="url(#gradJunctionFlash)"
          className="junctionFlash" style={{ mixBlendMode: 'screen' }} />

        {/* wypełnienie strzałki — poświata pod spodem + jasny rdzeń na wierzchu, oba przycięte tym
            samym rosnącym prostokątem, więc "napełniają się" razem od strony ramki w stronę grota */}
        <path d={PATH_ARROW_FILL} fill="#ffcf5c" opacity="0.85" filter="url(#glowBlur)"
          clipPath="url(#arrowFillClip)" />
        <path d={PATH_ARROW_FILL} fill="url(#arrowFillGrad)" clipPath="url(#arrowFillClip)" />

        {/* kropka ciemna — BEZ podskoku, jedzie płasko, i BEZ żadnego efektu glow (nawet małego) —
            tylko sam solidny punkt. Gaśnie tuż przed własnym dojazdem (dotFadeDark), nie po nim. */}
        <g className="dotBounce">
          <circle r="9" fill="url(#gradDark)" stroke="rgba(240,238,255,0.85)" strokeWidth="1.6" className="dotFadeDark">
            <animateMotion dur={`${LOOP_S}s`} repeatCount="indefinite" calcMode="linear"
              keyPoints={darkKeyPoints} keyTimes={darkKeyTimes} path={PATH_DARK} />
          </circle>
        </g>

        {/* kropka fioletowa — osobny halo glow POD spodem, którego widoczność steruje własną
            choreografią (violetGlowKf, patrz niżej): brak na starcie → duży (biało-fioletowy) błysk
            zaraz po fleszu ramki → gaśnie stopniowo aż do dużej kropki. Właściwa kropka na wierzchu
            gaśnie tuż przed własnym dojazdem (dotFadeViolet), nie po nim. */}
        <g className="dotBounce dotBounceViolet">
          <circle r="28" fill="#ffffff" filter="url(#glowBlur)" className="violetGlow">
            <animateMotion dur={`${LOOP_S}s`} repeatCount="indefinite" calcMode="linear"
              keyPoints={violetKeyPoints} keyTimes={violetKeyTimes} path={PATH_VIOLET} />
          </circle>
        </g>
        {/* drugi błysk fioletowej — od dużej kropki, gdy wypełni się złota strzałka — tym razem
            ZŁOTY (jak ramka i strzałka), nie biało-fioletowy. Osobny krąg/keyframe od powyższego. */}
        <g className="dotBounce dotBounceViolet">
          <circle r="34" fill="#ffcf5c" filter="url(#glowBlur)" className="violetGlowGold">
            <animateMotion dur={`${LOOP_S}s`} repeatCount="indefinite" calcMode="linear"
              keyPoints={violetKeyPoints} keyTimes={violetKeyTimes} path={PATH_VIOLET} />
          </circle>
        </g>
        <g className="dotBounce dotBounceViolet">
          <circle r="9" fill="url(#gradViolet)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" className="dotFadeViolet">
            <animateMotion dur={`${LOOP_S}s`} repeatCount="indefinite" calcMode="linear"
              keyPoints={violetKeyPoints} keyTimes={violetKeyTimes} path={PATH_VIOLET} />
          </circle>
        </g>
      </svg>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes eqPulse {
          0%   { transform: scaleY(0.6); }
          15%  { transform: scaleY(1.05); }
          30%  { transform: scaleY(0.75); }
          45%  { transform: scaleY(1.2); }
          60%  { transform: scaleY(0.65); }
          75%  { transform: scaleY(1.1); }
          90%  { transform: scaleY(0.8); }
          100% { transform: scaleY(0.6); }
        }

        .frameFlashCore, .frameFlashHalo { animation: frameFlash ${LOOP_S}s linear infinite; }
        @keyframes frameFlash {
          0%, ${pct(T.center)}%, ${pct(T.center + 0.3 * SPEED)}%, ${pct(T.centerEnd)}%, 100% { opacity: 0; }
          ${pct(T.center + 0.55 * SPEED)}% { opacity: 1; }
          ${pct(T.center + 0.9 * SPEED)}%  { opacity: 0; }
        }

        /* Pierwszy glow fioletowej kropki (biało-fioletowy) — nie stała wartość, tylko choreografia:
           0) od startu pętli do flesza ramki: brak (0)
           1) zaraz po fleszu ramki: duży błysk (1)
           2) stopniowo gaśnie (liniowo) przez całą drogę pod górę i z powrotem w dół, aż do 0
              dokładnie w chwili dotarcia do dużej kropki (T.junction) */
        .violetGlow { animation: violetGlowKf ${LOOP_S}s linear infinite; }
        @keyframes violetGlowKf {
          0%, ${pct(T.center + 0.3 * SPEED)}% { opacity: 0; }
          ${pct(T.center + 0.55 * SPEED)}%    { opacity: 1; }
          ${pct(T.junction)}%                 { opacity: 0; }
          100%                                { opacity: 0; }
        }

        /* Drugi glow fioletowej kropki — ZŁOTY (jak ramka/strzałka), zaczyna się "od dużej kropki"
           gdy złota strzałka się wypełni (T.junctionEnd), gaśnie w drodze w górę do T.violetDone. */
        .violetGlowGold { animation: violetGlowGoldKf ${LOOP_S}s linear infinite; }
        @keyframes violetGlowGoldKf {
          0%, ${pct(T.junctionEnd)}%          { opacity: 0; }
          ${pct(T.junctionEnd + 0.3 * SPEED)}% { opacity: 1; }
          ${pct(T.violetDone)}%                { opacity: 0; }
          100%                                 { opacity: 0; }
        }

        .dotBounce { transform-box: fill-box; transform-origin: center; }
        ${buildDotBounce('Violet')}
        .dotBounceViolet { animation: dotBounceKfViolet ${LOOP_S}s linear infinite; }

        /* Każda kropka gaśnie TUŻ PRZED własnym dojazdem do końca (nie po nim) — nigdy nie widać,
           że się zatrzymuje. Osobne dla ciemnej i fioletowej, bo kończą w różnych momentach. Potem
           przerwa w całkowitej niewidoczności, dopiero potem pojawiają się od nowa na starcie. */
        .dotFadeDark { animation: dotFadeDarkKf ${LOOP_S}s linear infinite; }
        @keyframes dotFadeDarkKf {
          0%                                       { opacity: 0; }
          ${pct(START_HOLD * SPEED)}%               { opacity: 0; }
          ${pct(START_HOLD * SPEED + 0.2)}%         { opacity: 1; }
          ${pct(T.darkDone - FADE_LEAD * SPEED)}%   { opacity: 1; }
          ${pct(T.darkDone)}%                       { opacity: 0; }
          100%                                      { opacity: 0; }
        }
        .dotFadeViolet { animation: dotFadeVioletKf ${LOOP_S}s linear infinite; }
        @keyframes dotFadeVioletKf {
          0%                                        { opacity: 0; }
          ${pct(START_HOLD * SPEED)}%               { opacity: 0; }
          ${pct(START_HOLD * SPEED + 0.2)}%         { opacity: 1; }
          ${pct(T.violetDone - FADE_LEAD * SPEED)}% { opacity: 1; }
          ${pct(T.violetDone)}%                     { opacity: 0; }
          100%                                      { opacity: 0; }
        }

        .arrowFillRect { animation: arrowFillKf ${LOOP_S}s linear infinite; }
        @keyframes arrowFillKf {
          0%, ${pct(T.junction)}% { width: 0px; }
          ${pct(T.junctionEnd)}%  { width: ${ARROW_CLIP_FULL_W}px; }
          97%       { width: ${ARROW_CLIP_FULL_W}px; }
          99%, 100% { width: 0px; }
        }

        .junctionFlash { animation: junctionFlashKf ${LOOP_S}s linear infinite; }
        @keyframes junctionFlashKf {
          0%, ${pct(T.junctionEnd)}% { opacity: 0; }
          ${pct(T.junctionEnd + 0.3 * SPEED)}% { opacity: 1; }
          ${pct(T.junctionEnd + 1.2 * SPEED)}% { opacity: 0; }
          100% { opacity: 0; }
        }
      ` }} />
    </div>
  )
}
