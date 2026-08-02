// Lokalny mock tabeli `reviews` — używany TYLKO gdy .env.local ma placeholder Supabase (patrz
// isSupabasePlaceholder()). Trzyma opinie w pliku JSON przez app/api/dev-reviews, żeby formularz
// opinii + panel moderacji dało się przetestować lokalnie bez połączenia z produkcyjnym Supabase.
// Usunąć razem z lib/devReviewsStore.ts i app/api/dev-reviews, gdy podłączymy prawdziwe środowisko.

export function isSupabasePlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export type ReviewItem = {
  id: string
  created_at: string
  name: string
  rating: number
  content: string
  quote: string | null
  photo_url: string | null
  approved: boolean
  lang: 'pl' | 'en'
}

export async function mockListReviews() {
  try {
    const res = await fetch('/api/dev-reviews')
    const data = await res.json()
    return { data: res.ok ? data : [], error: res.ok ? null : { message: data?.error || 'List failed' } }
  } catch (e: any) {
    return { data: [], error: { message: e?.message || 'List failed' } }
  }
}

export async function mockInsertReview(fields: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Insert failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Insert failed' } }
  }
}

export async function mockUpdateReview(id: string, updates: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-reviews', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Update failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Update failed' } }
  }
}

export async function mockDeleteReview(id: string) {
  try {
    const res = await fetch(`/api/dev-reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    return { error: res.ok ? null : { message: data?.error || 'Delete failed' } }
  } catch (e: any) {
    return { error: { message: e?.message || 'Delete failed' } }
  }
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function mockUploadReviewFile(file: Blob): Promise<string> {
  return fileToDataUrl(file)
}

// Kompresja zdjęcia do opinii przed uploadem (ten sam wzorzec co compressImage w admin/page.tsx,
// bez watermarku — to nie jest projekt karty, tylko zdjęcie dołączone przez klienta do opinii).
export async function compressReviewPhoto(file: File, maxWidth = 1000, quality = 0.8): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
  const scale = Math.min(1, maxWidth / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Kompresja nie powiodła się')), 'image/jpeg', quality)
  })
}
