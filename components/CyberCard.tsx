'use client'

// Nowy szablon karty "CyberCard" — oparty na wektorowym szkicu ramki narysowanym
// przez Michała w Inkscape (cyber_wektor.svg, C:\Users\Administrator\CCode RAVE\Cards_Projects\szablony).
// Współrzędne głównych kształtów (ramka, akcent, marker, equalizer, plakietki) są
// przepisane 1:1 z tego pliku — to prawdziwy wektor, więc w przeciwieństwie do
// anim-card.png/anim-card-2.png (płaskie PNG) każdy detal tutaj jest w pełni
// edytowalny przez kod. Pominięte: najdrobniejsze dekoracje szkicu (mikroskopijne
// prostokąty-"nity" i kropki), jako pierwsze przybliżenie do akceptacji.
//
// viewBox 0 0 1011 638 — proporcje 1:1 z oryginalnego pliku (format poziomy, jak wizytówka).

const FRAME_PATH = 'm 19.149397,153.94873 77.630884,-0.74185 76.523839,-130.715377 210.61362,0.296541 39.57652,48.962592 512.83437,-1.186979 50.09337,59.942123 0.27657,338.2872 -282.29413,-1.18698 -61.71727,59.64541 -273.71459,-2.07724 -71.40382,85.16532 -187.36582,1.4837 L 52.637057,545.64945 54.29762,435.26103 19.149228,394.31048 Z'
const ACCENT_LINE_PATH = 'M 88.062357,537.93436 87.232097,415.67619 54.02105,374.4289 53.190747,176.5012'
const MARKER_PATH = 'm 17.488834,398.46509 0.830303,77.74672 31.827266,40.65378 1.107042,-79.82391 z'

// Mała plakietka equalizera (górny akcent) — pozycje X 1:1 z oryginału (path25*)
const EQ_BARS_X = [603.94, 612.59, 622.33, 631.33, 639.99, 649.72, 657.86, 666.51, 676.24, 685.98, 694.64, 704.37, 711.9]

// Rząd małych "flag" (path23*) — 6 równoległoboków w górnej części karty
const PENNANTS = [
  'm 398.69889,23.836546 38.7482,44.903431 11.54622,-0.419873 -38.35686,-44.90343 z',
  'm 423.33609,22.388394 38.74825,44.90343 11.54617,-0.419873 -38.35682,-44.90343 z',
  'm 450.83136,21.788194 38.74824,44.90343 11.54617,-0.419873 -38.35681,-44.903385 z',
  'm 475.66427,21.179378 38.74825,44.903431 11.54617,-0.419873 -38.35682,-44.90343 z',
  'm 504.24083,21.42314 38.74824,44.90343 11.54617,-0.419419 -38.35682,-44.90343 z',
  'm 531.30174,21.632532 38.74824,44.903431 11.54617,-0.41942 -38.35681,-44.90343 z',
]

const PHOTO_RECT = { x: 144.52116, y: 136.14415, width: 802.60101, height: 312.17377 }

type CyberCardProps = {
  year?: string
  title?: string
  attr1Label?: string
  attr1Value?: string
  photoSrc?: string
  photoAlt?: string
}

export default function CyberCard({
  year = '2026',
  title = 'TYTUŁ KARTY',
  attr1Label = 'ATRYBUT 1',
  attr1Value = 'XXX1',
  photoSrc,
  photoAlt = '',
}: CyberCardProps) {
  return (
    <svg viewBox="0 0 1011 638" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="cyberFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b44dff" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
        <linearGradient id="cyberBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0b3ff" />
          <stop offset="100%" stopColor="#7a1fd6" />
        </linearGradient>
        <clipPath id="cyberPhotoClip">
          <rect {...PHOTO_RECT} />
        </clipPath>
      </defs>

      {/* tło karty */}
      <rect x="0" y="0" width="1011" height="638" rx="6" fill="#07070f" />

      {/* zdjęcie klienta */}
      {photoSrc && (
        <image
          href={photoSrc} x={PHOTO_RECT.x} y={PHOTO_RECT.y} width={PHOTO_RECT.width} height={PHOTO_RECT.height}
          preserveAspectRatio="xMidYMid slice" clipPath="url(#cyberPhotoClip)"
        />
      )}
      <rect {...PHOTO_RECT} fill="none" stroke="#acb9cd" strokeOpacity="0.35" strokeWidth="2" />

      {/* pennanty (górny rząd małych flag) */}
      {PENNANTS.map((d, i) => (
        <path key={i} d={d} fill="rgba(180,77,255,0.15)" stroke="#b44dff" strokeOpacity="0.7" strokeWidth="2" />
      ))}

      {/* mini-equalizer (akcent dźwiękowy, góra) */}
      {EQ_BARS_X.map((x, i) => (
        <rect key={x} x={x - 1.5} y={i % 2 === 0 ? 31 : 33} width="3" height={i % 2 === 0 ? 12 : 9} rx="1"
          fill="url(#cyberBarGrad)" />
      ))}

      {/* główna ramka — 1:1 ze szkicu Inkscape */}
      <path d={FRAME_PATH} fill="none" stroke="url(#cyberFrameGrad)" strokeWidth="4" strokeLinejoin="round" />

      {/* akcent wewnętrzny + biały marker (charakterystyczne detale ze szkicu) */}
      <path d={ACCENT_LINE_PATH} fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeOpacity="0.55" />
      <path d={MARKER_PATH} fill="#b44dff" fillOpacity="0.22" stroke="#b44dff" strokeWidth="2" />

      {/* teksty — rok jako plakietka po prawej, atrybut+wartość w osobnym wierszu niżej (w oryginalnym
          szkicu nachodziły na siebie przy realnej długości tekstu — rozdzielone dla czytelności) */}
      <text x="927" y="103" textAnchor="end" fontFamily="'Space Mono', monospace" fontSize="26" fontWeight={700} fill="#f0eeff" letterSpacing="4">{year}</text>
      <text x="630" y="128" fontFamily="'Space Mono', monospace" fontSize="16" fill="rgba(240,238,255,0.55)" letterSpacing="2">{attr1Label}</text>
      <text x="927" y="128" textAnchor="end" fontFamily="'Space Mono', monospace" fontSize="18" fontWeight={700} fill="#00e5a0" letterSpacing="1">{attr1Value}</text>
      <text x="691.6" y="522.8" fontFamily="'Space Mono', monospace" fontSize="22" fontWeight={700} fill="#f0eeff" letterSpacing="3">{title}</text>
    </svg>
  )
}
