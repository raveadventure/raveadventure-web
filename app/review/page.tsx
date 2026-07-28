'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ReviewContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const action = params.get('action')
  const option = params.get('option')

  const [step, setStep] = useState<'loading' | 'approve' | 'reject' | 'success-approve' | 'success-reject' | 'error'>(
    action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'error'
  )
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [designInfo, setDesignInfo] = useState<{
    design_url: string | null
    design_url_2: string | null
    design_back_url: string | null
    approved_design_option: number | null
  } | null>(null)

  useEffect(() => {
    if (action === 'approve' && token) handleApprove()
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`/api/review-info?token=${encodeURIComponent(token)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setDesignInfo(data))
      .catch(() => {})
  }, [token])

  const handleApprove = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, option }),
      })
      if (res.ok) setStep('success-approve')
      else setStep('error')
    } catch { setStep('error') }
    setSending(false)
  }

  const handleReject = async () => {
    if (!notes.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, notes }),
      })
      if (res.ok) setStep('success-reject')
      else setStep('error')
    } catch { setStep('error') }
    setSending(false)
  }

  const designPreview = (() => {
    if (!designInfo) return null
    const fronts = [designInfo.design_url, designInfo.design_url_2].filter(Boolean) as string[]
    if (fronts.length === 0 && !designInfo.design_back_url) return null
    return (
      <div style={{ margin: '0 0 20px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(240,238,255,0.4)', fontFamily: 'monospace', letterSpacing: '1px', margin: '0 0 10px' }}>// podgląd projektu</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {fronts.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'block' }}>
              <img
                src={url}
                alt={`Wariant ${i + 1}`}
                style={{
                  width: '110px', height: 'auto', borderRadius: '8px', display: 'block',
                  border: designInfo.approved_design_option === i + 1 ? '2px solid #00e5a0' : '1px solid rgba(180,77,255,0.3)',
                }}
              />
              {fronts.length > 1 && (
                <span style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(8,8,16,0.75)', color: '#f0eeff' }}>
                  {i + 1}
                </span>
              )}
            </a>
          ))}
          {designInfo.design_back_url && (
            <a href={designInfo.design_back_url} target="_blank" rel="noopener noreferrer">
              <img src={designInfo.design_back_url} alt="Tył karty" style={{ width: '110px', height: 'auto', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', display: 'block' }} />
            </a>
          )}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(240,238,255,0.35)', margin: '8px 0 0' }}>Stuknij grafikę, żeby powiększyć</p>
      </div>
    )
  })()

  const backNav = (
    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
      <button
        onClick={() => window.history.back()}
        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f0eeff', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        ← Wróć do maila
      </button>
      <a
        href="/"
        style={{ flex: 1, background: 'rgba(180,77,255,0.12)', border: '1px solid rgba(180,77,255,0.3)', borderRadius: '10px', color: '#b44dff', padding: '12px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        Strona główna →
      </a>
    </div>
  )

  const box = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ background: '#0e0e1a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '16px', padding: '40px 36px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <p style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700, color: '#f0eeff' }}>
          Rave<span style={{ color: '#b44dff' }}>Adventure</span>
        </p>
        {children}
      </div>
    </div>
  )

  if (step === 'loading' || (action === 'approve' && sending)) return box(
    <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '15px' }}>Przetwarzam...</p>
  )

  if (step === 'success-approve') return box(<>
    <div style={{ width: '64px', height: '64px', background: '#ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>💳</div>
    <h2 style={{ color: '#ec4899', fontSize: '22px', margin: '0 0 12px' }}>Projekt zatwierdzony!</h2>
    {designPreview}
    {option && (
      <p style={{ color: '#00e5a0', fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Wybrany wariant: {option}</p>
    )}
    <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
      Świetnie! Jeszcze tylko jeden krok — dokonaj płatności zgodnie z danymi które otrzymałeś/aś w mailu z projektem. Po zaksięgowaniu wpłaty od razu przekazujemy kartę do produkcji.
    </p>
    <p style={{ color: 'rgba(240,238,255,0.4)', fontSize: '13px', margin: 0 }}>
      Pytania? Napisz na <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#b44dff' }}>kontakt@raveadventure.pl</a>
    </p>
    {backNav}
  </>)

  if (step === 'success-reject') return box(<>
    <div style={{ width: '64px', height: '64px', background: '#ff4d6d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>✎</div>
    <h2 style={{ color: '#ff4d6d', fontSize: '22px', margin: '0 0 12px' }}>Uwagi wysłane!</h2>
    {designPreview}
    <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
      Otrzymaliśmy Twoje uwagi. Przygotujemy poprawiony projekt i wyślemy go wkrótce.
    </p>
    {backNav}
  </>)

  if (step === 'reject') return box(<>
    <h2 style={{ color: '#f0eeff', fontSize: '20px', margin: '0 0 8px' }}>Twoje uwagi do projektu</h2>
    <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' }}>
      Opisz dokładnie jakie poprawki chcesz wprowadzić — kolor, tekst, układ, zdjęcie. Jeśli mieliśmy do Ciebie pytania, odpowiedz na nie tutaj.
    </p>
    {designPreview}
    <p style={{ color: 'rgba(240,238,255,0.4)', fontSize: '12px', margin: '0 0 8px', fontFamily: 'monospace', letterSpacing: '1px' }}>// twoje uwagi i odpowiedzi na pytania</p>
    <textarea
      value={notes}
      onChange={e => setNotes(e.target.value)}
      placeholder="np. Chciałbym zmienić kolor tła na ciemniejszy, powiększyć moje imię i przesunąć zdjęcie bardziej w lewo...&#10;&#10;Odpowiedź na pytania: ..."
      style={{ width: '100%', minHeight: '180px', background: '#16162a', border: '1px solid rgba(180,77,255,0.3)', borderRadius: '10px', color: '#f0eeff', padding: '14px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
    />
    <button
      onClick={handleReject}
      disabled={!notes.trim() || sending}
      style={{ width: '100%', background: notes.trim() ? '#ff4d6d' : 'rgba(255,77,109,0.3)', color: notes.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: notes.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
    >
      {sending ? 'Wysyłam uwagi...' : 'Wyślij uwagi →'}
    </button>
  </>)

  return box(<>
    <p style={{ color: '#ff4d6d', fontSize: '16px' }}>Coś poszło nie tak.</p>
    <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px' }}>Napisz do nas: <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#b44dff' }}>kontakt@raveadventure.pl</a></p>
  </>)
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(240,238,255,0.4)', fontFamily: 'sans-serif' }}>Ładowanie...</p>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  )
}
