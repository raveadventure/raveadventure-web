'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { isSupabasePlaceholder, mockListReviews, mockUpdateReview, mockDeleteReview, ReviewItem } from '../../../lib/reviewsLocalMock'

export default function AdminReviews() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  const fetch = async () => {
    setLoading(true)
    if (isSupabasePlaceholder()) {
      const { data } = await mockListReviews()
      setItems(data || [])
    } else {
      const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const approve = async (id: string) => {
    if (isSupabasePlaceholder()) {
      await mockUpdateReview(id, { approved: true })
    } else {
      await supabase.from('reviews').update({ approved: true }).eq('id', id)
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, approved: true } : i))
  }

  const unapprove = async (id: string) => {
    if (isSupabasePlaceholder()) {
      await mockUpdateReview(id, { approved: false })
    } else {
      await supabase.from('reviews').update({ approved: false }).eq('id', id)
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, approved: false } : i))
  }

  const remove = async (id: string) => {
    if (!confirm('Usunąć tę opinię na stałe?')) return
    if (isSupabasePlaceholder()) {
      await mockDeleteReview(id)
    } else {
      await supabase.from('reviews').delete().eq('id', id)
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const s = { fontFamily: "'Space Grotesk', sans-serif", color: '#f0eeff' }
  const visible = items.filter(i => filter === 'pending' ? !i.approved : i.approved)
  const pendingCount = items.filter(i => !i.approved).length

  return (
    <div style={{ minHeight: '100vh', background: '#080810', ...s }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      <nav style={{ background: '#0e0e1a', borderBottom: '1px solid rgba(180,77,255,0.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/admin" style={{ color: 'rgba(240,238,255,0.5)', textDecoration: 'none', fontSize: '13px' }}>← Zamówienia</a>
        <span style={{ color: 'rgba(240,238,255,0.2)' }}>|</span>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>Rave<span style={{ color: '#b44dff' }}>Adventure</span></span>
        <span style={{ fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// opinie</span>
        {pendingCount > 0 && (
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
            {pendingCount} do zatwierdzenia
          </span>
        )}
        <a href="/#faq-opinie" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: '12px', color: '#b44dff', textDecoration: 'none' }}>
          Zobacz sekcję na stronie →
        </a>
      </nav>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setFilter('pending')} style={{ background: filter === 'pending' ? '#b44dff' : 'transparent', color: filter === 'pending' ? '#0a0014' : 'rgba(240,238,255,0.6)', border: '1px solid rgba(180,77,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Oczekujące ({pendingCount})
          </button>
          <button onClick={() => setFilter('approved')} style={{ background: filter === 'approved' ? '#b44dff' : 'transparent', color: filter === 'approved' ? '#0a0014' : 'rgba(240,238,255,0.6)', border: '1px solid rgba(180,77,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Zatwierdzone ({items.filter(i => i.approved).length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(240,238,255,0.3)', textAlign: 'center', padding: '40px' }}>Ładowanie...</p>
        ) : visible.length === 0 ? (
          <p style={{ color: 'rgba(240,238,255,0.3)', textAlign: 'center', padding: '40px' }}>
            {filter === 'pending' ? 'Brak opinii oczekujących na zatwierdzenie.' : 'Brak zatwierdzonych opinii.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visible.map(item => (
              <div key={item.id} style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                  <span style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(240,238,255,0.3)' }}>{new Date(item.created_at).toLocaleDateString('pl-PL')}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: item.approved ? 'rgba(0,229,160,0.1)' : 'rgba(245,158,11,0.1)', color: item.approved ? '#00e5a0' : '#f59e0b', border: `1px solid ${item.approved ? 'rgba(0,229,160,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    {item.approved ? 'Zatwierdzona' : 'Oczekuje'}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(240,238,255,0.7)', lineHeight: '1.6' }}>{item.content}</p>
                {item.photo_url && <img src={item.photo_url} alt="" style={{ maxWidth: '140px', borderRadius: '8px', display: 'block', marginBottom: '10px' }} />}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!item.approved ? (
                    <button onClick={() => approve(item.id)} style={{ background: '#00e5a0', color: '#0a0014', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✓ Zatwierdź
                    </button>
                  ) : (
                    <button onClick={() => unapprove(item.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,238,255,0.5)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cofnij zatwierdzenie
                    </button>
                  )}
                  <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
