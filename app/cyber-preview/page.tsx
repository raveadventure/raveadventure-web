'use client'
// Tymczasowa strona do podglądu nowego szablonu CyberCard — do usunięcia po akceptacji designu.
import CyberCard from '../../components/CyberCard'

export default function CyberPreview() {
  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '900px' }}>
        <CyberCard
          year="2026"
          title="RAVE FAMILY"
          attr1Label="ENERGY"
          attr1Value="x5"
          photoSrc="/anim-photo.jpg"
        />
      </div>
    </div>
  )
}
