# RaveAdventure Web

Strona zamówień personalizowanych kart festiwalowych.

## Stack
- Next.js 14 + TypeScript
- Supabase (baza danych + storage na zdjęcia)
- Vercel (hosting)

## Konfiguracja

1. Stwórz plik `.env.local` w głównym folderze:
```
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj-klucz-anon
```

2. Uruchom SQL z pliku `SUPABASE_SETUP.md` w panelu Supabase.

3. Uruchom lokalnie:
```bash
npm install
npm run dev
```

Strona działa na http://localhost:3000
