'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ReviewContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const action = params.get('action')

  const [step, setStep] = useState<'loading' | 'approve' | 'reject' | 'success-approve' | 'success-reject' | 'error'>(
    action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'error'
  )
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (action === 'approve' && token) handleApprove()
  }, [])

  const handleApprove = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
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
    <div style={{ width: '64px', height: '64px', background: '#00e5a0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>✓</div>
    <h2 style={{ color: '#00e5a0', fontSize: '22px', margin: '0 0 12px' }}>Projekt zatwierdzony!</h2>
    <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px' }}>
      Dziękujemy! Twoja karta trafi do druku. Wyślemy ją w ciągu 3–5 dni roboczych na podany adres.
    </p>
    <p style={{ color: 'rgba(240,238,255,0.4)', fontSize: '13px', margin: 0 }}>
      Pytania? Napisz na <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#b44dff' }}>kontakt@raveadventure.pl</a>
    </p>
  </>)

  if (step === 'success-reject') return box(<>
    <div style={{ width: '64px', height: '64px', background: '#ff4d6d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>✎</div>
    <h2 style={{ color: '#ff4d6d', fontSize: '22px', margin: '0 0 12px' }}>Uwagi wysłane!</h2>
    <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
      Otrzymaliśmy Twoje uwagi. Przygotujemy poprawiony projekt i wyślemy go wkrótce.
    </p>
  </>)

  if (step === 'reject') return box(<>
    <h2 style={{ color: '#f0eeff', fontSize: '20px', margin: '0 0 8px' }}>Twoje uwagi do projektu</h2>
    <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' }}>
      Opisz dokładnie jakie poprawki chcesz wprowadzić — kolor, tekst, układ, zdjęcie. Jeśli mieliśmy do Ciebie pytania, odpowiedz na nie tutaj.
    </p>
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
