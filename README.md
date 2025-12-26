## Swaply Next.js app

Implementare completă conform `docs/SWAPLY_MASTER_SPEC.md`, cu fluxurile Home / Login / Profile / Objects / Match / Chat / Change / Info și fallback-uri grațioase când lipsesc servicii externe.

## Cum rulezi local

```bash
# instalează dependențele
npm ci

# rulează dev server
npm run dev

# build de producție
npm run build
```

Aplicatia pornește pe [http://localhost:3000](http://localhost:3000).

### Variabile de mediu

Configurează `.env` pe baza `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — conexiune Supabase (RLS ON).
- `HUGGINGFACE_API_KEY` — pentru sugestii AI server-side (fallback manual dacă lipsește).
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — afișează status Cloudinary în UI.
- `NEXT_PUBLIC_MAPS_TOKEN` — activează harta reală; fără token se afișează placeholder.
- `NEXT_PUBLIC_HF_ENABLED` — forțează UI să marcheze AI ca activ/inactiv.

Nu expune secrete în client; cheile fără prefix `NEXT_PUBLIC_` trebuie folosite exclusiv server-side.
