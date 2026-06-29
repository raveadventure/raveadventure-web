export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      color: '#f0eeff',
      textAlign: 'center',
      padding: '20px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <img src="/logo.png" alt="RaveAdventure" style={{ width: '100%', maxWidth: '600px', marginBottom: '48px' }} />

      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#b44dff', letterSpacing: '3px', margin: '0 0 16px' }}>
        // przerwa techniczna
      </p>

      <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.2 }}>
        Wracamy wkrótce
      </h1>

      <p style={{ fontSize: '16px', color: 'rgba(240,238,255,0.6)', maxWidth: '460px', lineHeight: 1.7, margin: '0 0 40px' }}>
        Pracujemy nad nową wersją RaveAdventure. Wrócimy za kilka dni z nowościami. Dziękujemy za cierpliwość!
      </p>

      <a href="mailto:kontakt@raveadventure.pl" style={{
        display: 'inline-block',
        padding: '12px 28px',
        border: '1px solid rgba(180,77,255,0.4)',
        borderRadius: '8px',
        color: '#b44dff',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
      }}>
        kontakt@raveadventure.pl
      </a>
    </div>
  )
}
