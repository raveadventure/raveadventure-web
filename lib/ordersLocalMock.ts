// Lokalny mock operacji na tabeli `orders`, używany TYLKO gdy .env.local ma placeholder Supabase.
// Zamiast prawdziwego klienta Supabase odpytuje /api/dev-orders (patrz app/api/dev-orders/route.ts),
// które trzyma zamówienia w pliku .dev-orders/orders.json. Kształt zwracanych obiektów ({data,
// error}) naśladuje odpowiedzi supabase-js, żeby w miejscach wywołania trzeba było zmienić
// jak najmniej kodu. Usunąć razem z app/api/dev-orders/, gdy podłączymy prawdziwe środowisko.

export function isSupabasePlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export async function mockInsertOrder(fields: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Insert failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Insert failed' } }
  }
}

export async function mockListOrders() {
  try {
    const res = await fetch('/api/dev-orders')
    const data = await res.json()
    return { data: res.ok ? data : [], error: res.ok ? null : { message: data?.error || 'List failed' } }
  } catch (e: any) {
    return { data: [], error: { message: e?.message || 'List failed' } }
  }
}

export async function mockGetOrder(id: string) {
  const { data, error } = await mockListOrders()
  if (error) return { data: null, error }
  const order = (data || []).find((o: any) => o.id === id)
  return { data: order || null, error: order ? null : { message: 'Order not found' } }
}

export async function mockUpdateOrder(id: string, updates: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-orders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Update failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Update failed' } }
  }
}

export async function mockDeleteOrder(id: string) {
  try {
    const res = await fetch(`/api/dev-orders?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    return { error: res.ok ? null : { message: data?.error || 'Delete failed' } }
  } catch (e: any) {
    return { error: { message: e?.message || 'Delete failed' } }
  }
}
