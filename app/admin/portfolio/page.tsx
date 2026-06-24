'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

const THEMES = [
  { id: 'techno_rave', label: 'Techno / Rave' },
  { id: 'festival',    label: 'Festiwal' },
  { id: 'adventure',   label: 'Adventure' },
  { id: 'custom',      label: 'Custom' },
]

type Item = { id: string; name: string; theme: string; description: string; original_url: string | null; card_url: string; active: boolean; sort_order: number }

export default function AdminPortfolio() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', theme: 'techno_rave', description: '' })
  const [cardFile, setCardFile] = useState<File | null>(null)
  const [origFile, setOrigFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const cardRef = useRef<HTMLInputElement>(null)
  const origRef = useRef<HTMLInputElement>(null)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('portfolio').select('*').order('sort_order')
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleAdd = async () => {
    if (!form.name || !cardFile) { setMsg({ type: 'err', text: 'Podaj nazwę i wgraj grafikę karty.' }); return }
    setSaving(true); setMsg(null)
    try {
      const id = crypto.randomUUID()
      const cardExt = (cardFile.name.split('.').pop() || 'jpg').toLowerCase()
      const { error: ce } = await supabase.storage.from('order-photos').upload(`portfolio/${id}-card.${cardExt}`, cardFile)
      if (ce) throw ce
      const { data: cardUrl } = supabase.storage.from('order-photos').getPublicUrl(`portfolio/${id}-card.${cardExt}`)

      let origUrl = null
      if (origFile) {
        const origExt = (origFile.name.split('.').pop() || 'jpg').toLowerCase()
        await supabase.storage.from('order-photos').upload(`portfolio/${id}-orig.${origExt}`, origFile)
        const { data: ou } = supabase.storage.from('order-photos').getPublicUrl(`portfolio/${id}-orig.${origExt}`)
        origUrl = ou.publicUrl
      }

      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0
      const { error: ie } = await supabase.from('portfolio').insert([{
        id, name: form.name, theme: form.theme, description: form.description,
        card_url: cardUrl.publicUrl, original_url: origUrl, active: true, sort_order: maxOrder,
      }])
      if (ie) throw ie
      setMsg({ type: 'ok', text: 'Karta dodana do portfolio!' })
      setForm({ name: '', theme: 'techno_rave', description: '' })
      setCardFile(null); setOrigFile(null)
      fetch()
    } catch (e: unknown) {
      setMsg({ type: 'err', text: 'Błąd: ' + (e instanceof Error ? e.message : String(e)) })
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('portfolio').update({ active: !active }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !active } : i))
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Usunąć tę kartę z portfolio?')) return
    await supabase.from('portfolio').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const s = { fontFamily: "'Space Grotesk', sans-serif", color: '#f0eeff' }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', ...s }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      <nav style={{ background: '#0e0e1a', borderBottom: '1px solid rgba(180,77,255,0.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/admin" style={{ color: 'rgba(240,238,255,0.5)', textDecoration: 'none', fontSize: '13px' }}>← Zamówienia</a>
        <span style={{ color: 'rgba(240,238,255,0.2)' }}>|</span>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>Rave<span style={{ color: '#b44dff' }}>Adventure</span></span>
        <span style={{ fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// portfolio</span>
        <a href="/portfolio" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: '12px', color: '#b44dff', textDecoration: 'none' }}>
          Zobacz stronę portfolio →
        </a>
      </nav>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

        {/* DODAJ NOWĄ */}
        <div style={{ background: '#0e0e1a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#b44dff', letterSpacing: '2px', margin: '0 0 16px' }}>// dodaj kartę do portfolio</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(240,238,255,0.5)', marginBottom: '5px' }}>Nazwa karty *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="np. Rave Friends" style={{ width: '100%', boxSizing: 'border-box', background: '#16162a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(240,238,255,0.5)', marginBottom: '5px' }}>Motyw *</label>
              <select value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', background: '#16162a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
                {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(240,238,255,0.5)', marginBottom: '5px' }}>Opis (opcjonalnie)</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="np. Karta dla grupy przyjaciół z Awakenings 2025" style={{ width: '100%', boxSizing: 'border-box', background: '#16162a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(240,238,255,0.5)', marginBottom: '5px' }}>Grafika karty (gotowy projekt) *</label>
              <button onClick={() => cardRef.current?.click()} style={{ width: '100%', background: cardFile ? 'rgba(0,229,160,0.08)' : '#16162a', border: `1px ${cardFile ? 'solid rgba(0,229,160,0.4)' : 'dashed rgba(180,77,255,0.3)'}`, borderRadius: '8px', color: cardFile ? '#00e5a0' : 'rgba(240,238,255,0.4)', padding: '12px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {cardFile ? `✓ ${cardFile.name}` : '+ Wgraj grafikę karty'}
              </button>
              <input ref={cardRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setCardFile(e.target.files[0])} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(240,238,255,0.5)', marginBottom: '5px' }}>Oryginalne zdjęcie (opcjonalnie)</label>
              <button onClick={() => origRef.current?.click()} style={{ width: '100%', background: origFile ? 'rgba(0,229,160,0.08)' : '#16162a', border: `1px ${origFile ? 'solid rgba(0,229,160,0.4)' : 'dashed rgba(180,77,255,0.3)'}`, borderRadius: '8px', color: origFile ? '#00e5a0' : 'rgba(240,238,255,0.4)', padding: '12px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {origFile ? `✓ ${origFile.name}` : '+ Wgraj oryginał (opcjonalnie)'}
              </button>
              <input ref={origRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setOrigFile(e.target.files[0])} />
            </div>
          </div>

          <button onClick={handleAdd} disabled={saving} style={{ background: saving ? 'rgba(180,77,255,0.3)' : '#b44dff', color: '#0a0014', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Dodawanie...' : '+ Dodaj do portfolio'}
          </button>
          {msg && <p style={{ margin: '10px 0 0', fontSize: '13px', color: msg.type === 'ok' ? '#00e5a0' : '#ff4d6d' }}>{msg.text}</p>}
        </div>

        {/* LISTA */}
        <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 12px' }}>// karty w portfolio ({items.length})</p>
        {loading ? (
          <p style={{ color: 'rgba(240,238,255,0.3)', textAlign: 'center', padding: '40px' }}>Ładowanie...</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'rgba(240,238,255,0.3)', textAlign: 'center', padding: '40px' }}>Brak kart w portfolio — dodaj pierwszą powyżej</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={item.card_url} alt="" style={{ width: '44px', height: '62px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '14px' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.4)' }}>{THEMES.find(t => t.id === item.theme)?.label} {item.original_url ? '· z oryginałem' : ''}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: item.active ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.05)', color: item.active ? '#00e5a0' : 'rgba(240,238,255,0.3)', border: `1px solid ${item.active ? 'rgba(0,229,160,0.3)' : 'rgba(255,255,255,0.08)'}`, whiteSpace: 'nowrap' }}>
                  {item.active ? 'Widoczna' : 'Ukryta'}
                </span>
                <button onClick={() => toggleActive(item.id, item.active)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,238,255,0.5)', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {item.active ? 'Ukryj' : 'Pokaż'}
                </button>
                <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Usuń
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
