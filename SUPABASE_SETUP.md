# Supabase — uruchom te dwa polecenia w SQL Editor

## 1. Tabela zamówień
Wejdź w Supabase → SQL Editor → New query → wklej i kliknij Run:

```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  theme text not null,
  name text not null,
  email text not null,
  phone text,
  address text not null,
  card_text text,
  notes text,
  photo_url text,
  status text default 'new'
);
```

## 2. Storage bucket na zdjęcia
Wejdź w Supabase → Storage → New bucket:
- Nazwa: order-photos
- Public bucket: TAK (zaznacz)

## 3. Polityki dostępu do Storage
SQL Editor → New query → wklej i Run:

```sql
create policy "Anyone can upload photos"
on storage.objects for insert
with check (bucket_id = 'order-photos');

create policy "Anyone can view photos"
on storage.objects for select
using (bucket_id = 'order-photos');
```

Gotowe! Strona może teraz zapisywać zamówienia i zdjęcia.
