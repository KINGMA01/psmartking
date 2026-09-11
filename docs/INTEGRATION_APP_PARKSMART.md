# Intégration site ↔ app ParkSmart

## URLs à aligner

| Usage | URL site | Variable app |
|-------|----------|--------------|
| Privacy | `https://psmartking.com/confidentialite.html` | `EXPO_PUBLIC_PRIVACY_URL` |
| CGU | `https://psmartking.com/conditions.html` | `EXPO_PUBLIC_TERMS_URL` |
| Support | `psmartking@dnkvision.com` | `EXPO_PUBLIC_SUPPORT_EMAIL` |
| Démo web | `https://psmartking.com/essayer.html` | — |
| Liste d'attente | `https://psmartking.com/liste-attente.html` | — |

## Backend

Le site **ne duplique pas** la logique métier : la démo appelle le même API que l'app :

- `GET /api/segments/polylines`
- `GET /api/segments/chunk-detail`

Proxy Vercel : `/api/demo` (rate limit, allowlist paths).

## Couleurs segments (alignement visuel)

| Statut | Hex app | Usage site démo |
|--------|---------|-----------------|
| Autorisé | `#22c55e` | Légende démo |
| Interdit | `#ef4444` | Légende démo |
| Payant | `#4589c9` | Via API `color` |
| À vérifier | `#64748b` | Légende démo |

## Ce qui n'est PAS dans la démo web

- Auth / compte
- Minuteur / notifications
- Signalements / bugs
- Scan panneau / AR
- Parkings structurés (couche séparée)
- Navigation turn-by-turn

Ces features restent **app-only** jusqu'à décision produit.
