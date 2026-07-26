'use client'
import { useEffect, useState } from 'react'

// Mapka wyboru paczkomatu InPost (Geowidget v5) — ładowana TYLKO gdy klient wybierze dostawę
// do paczkomatu, żeby nie obciążać reszty strony niepotrzebnym JS-em/CSS-em.
//
// Wymaga NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN (publiczny token: manager.paczkomaty.pl —
// lub sandbox-manager.paczkomaty.pl do testów — zakładka "Moje konto" → "Dane", uzupełnić adres
// firmy i dane do faktury, potem "API" → "Geowidget" → Generate). Bez tokenu ten komponent nic
// nie renderuje — wywołujący (app/page.tsx) pokazuje wtedy ręczne pole tekstowe jako fallback.
//
// Nieprzetestowane na żywym tokenie (środowisko deweloperskie nie ma dostępu do prawdziwego
// konta InPost) — kod jest zgodny z oficjalną dokumentacją (geowidget.inpost.pl/docs), ale
// dokumentacja InPost jest miejscami niespójna co do kształtu zdarzenia wyboru punktu, stąd
// obronne odczytywanie kilku wariantów pola `event.detail` niżej. Do zweryfikowania na sandboxie.

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'inpost-geowidget': any
    }
  }
}

type SelectedPoint = { id: string; address: string }

export default function InpostGeowidget({ lang, onSelect }: { lang: 'pl' | 'en'; onSelect: (point: SelectedPoint) => void }) {
  const [scriptReady, setScriptReady] = useState(false)
  const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN

  useEffect(() => {
    if (!token) return
    if (!document.querySelector('link[data-inpost-geowidget]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://geowidget.inpost.pl/inpost-geowidget.css'
      link.setAttribute('data-inpost-geowidget', 'true')
      document.head.appendChild(link)
    }
    const existing = document.querySelector('script[data-inpost-geowidget]')
    if (existing) {
      setScriptReady(true)
    } else {
      const script = document.createElement('script')
      script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js'
      script.defer = true
      script.setAttribute('data-inpost-geowidget', 'true')
      script.onload = () => setScriptReady(true)
      document.body.appendChild(script)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    const handlePointSelect = (event: any) => {
      // Kształt zdarzenia wg dokumentacji InPost bywa niespójny (`event.detail` vs `event.details`,
      // punkt bezpośrednio vs zagnieżdżony w `.point`) — obsługujemy kilka wariantów defensywnie.
      const raw = event?.detail?.point || event?.detail || event?.details?.point || event?.details || {}
      const name: string = raw.name || raw.id || ''
      const addressDetails = raw.address_details || {}
      const line = raw.address?.line1 || [addressDetails.street, addressDetails.building_number].filter(Boolean).join(' ')
      const city = addressDetails.city || ''
      const addressText = [line, city].filter(Boolean).join(', ')
      if (!name) return
      onSelect({ id: name, address: addressText ? `${name} — ${addressText}` : name })
    }
    document.addEventListener('onpointselect', handlePointSelect)
    return () => document.removeEventListener('onpointselect', handlePointSelect)
  }, [token, onSelect])

  if (!token) return null

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', minHeight: scriptReady ? undefined : '80px' }}>
      {scriptReady ? (
        <inpost-geowidget token={token} language={lang} config="parcelCollect" style={{ display: 'block', width: '100%', height: '420px' }} />
      ) : (
        <p style={{ margin: 0, padding: '28px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {lang === 'pl' ? 'Ładowanie mapy paczkomatów…' : 'Loading parcel locker map…'}
        </p>
      )}
    </div>
  )
}
