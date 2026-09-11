# P-SmartKing — Site marketing

Site officiel de l'application **P-SmartKing** (stationnement à Montréal).

- **Production :** [psmartking.com](https://psmartking.com)
- **App mobile :** repo séparé `parksmart` (Expo / FastAPI)

## En local

```bash
npm install
npm run dev
```

Ouvre [http://127.0.0.1:4180](http://127.0.0.1:4180)

## Démo carte (`essayer.html`)

La page **Essayer la carte** appelle l'API ParkSmart via le proxy Vercel `/api/demo`.

En local, sans backend :

1. Lance le backend ParkSmart (`npm run backend` dans le repo app)
2. Sur Vercel preview, définis `PARKSMART_API_URL=http://127.0.0.1:8000` **ou** teste après déploiement

## Config

| Fichier | Usage |
|---------|--------|
| `maps-config.js` | Clé Google Maps locale (copie depuis `maps-config.example.js`) |
| `site-config.js` | Endpoint liste d'attente |

## Vercel — variables d'environnement

| Variable | Obligatoire |
|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Oui (carte) |
| `PARKSMART_API_URL` | Oui (démo essayer) |
| `WAITLIST_WEBHOOK_URL` ou `RESEND_API_KEY` | Recommandé |

## Documentation

- [`docs/ANALYSE_COMPLETE.md`](docs/ANALYSE_COMPLETE.md) — analyse projet
- [`docs/INTEGRATION_APP_PARKSMART.md`](docs/INTEGRATION_APP_PARKSMART.md) — lien site ↔ app

## Google Maps

Restreins la clé par domaine (`psmartking.com`, localhost) et active **Maps JavaScript API** + **Places API (New)**.
