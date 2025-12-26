# NOTES

- Implementarea folosește date mock/stub pentru profil, obiecte, match-uri, chat și swap-uri. Acestea sunt gestionate prin context (`AppStateProvider`) și pot fi înlocuite cu Surse Supabase reale atunci când sunt configurate cheile din `.env`.
- Integrarea AI este expusă printr-un endpoint `/api/ai` care folosește Hugging Face doar dacă este setată `HUGGINGFACE_API_KEY`. În lipsă, răspunde cu fallback manual.
- Harta este un placeholder atunci când `NEXT_PUBLIC_MAPS_TOKEN` nu este prezentă; UI nu blochează restul fluxurilor.
- Cloudinary și alte servicii sunt raportate în UI doar prin feature toggles și nu rulează fără configurare.
- Badge-urile Free/Premium/Platinum sunt prezentate în UI conform spec-ului, dar logica de facturare/upgrade este simulată și nu efectuează plăți.
