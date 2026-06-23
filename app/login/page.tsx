'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!username || !password) { setError('Wpisz login i hasło.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/admin')
      } else {
        const data = await res.json()
        setError(data.error || 'Błąd logowania.')
      }
    } catch {
      setError('Błąd połączenia.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      <div style={{ background: '#0e0e1a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '16px', padding: '40px 36px', maxWidth: '400px', width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#f0eeff' }}>
            Rave<span style={{ color: '#b44dff' }}>Adventure</span>
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '3px' }}>// panel admina</p>
        </div>

        {/* Formularz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(240,238,255,0.5)', marginBottom: '6px' }}>Login</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="wpisz login"
              autoComplete="username"
              style={{ width: '100%', boxSizing: 'border-box', background: '#16162a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '12px 16px', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#b44dff'}
              onBlur={e => e.target.style.borderColor = 'rgba(180,77,255,0.2)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(240,238,255,0.5)', marginBottom: '6px' }}>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="wpisz hasło"
              autoComplete="current-password"
              style={{ width: '100%', boxSizing: 'border-box', background: '#16162a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '12px 16px', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#b44dff'}
              onBlur={e => e.target.style.borderColor = 'rgba(180,77,255,0.2)'}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: '13px', color: '#ff4d6d', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ background: loading ? 'rgba(180,77,255,0.3)' : '#b44dff', color: '#0a0014', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'rgba(240,238,255,0.2)' }}>
          RaveAdventure · Panel administracyjny
        </p>
      </div>
    </div>
  )
}
