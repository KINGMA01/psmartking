# P-SmartKing

Site de l’application P-SmartKing : se garer à Montréal sans y passer sa journée.

## En local

Ouvre `index.html` via un serveur HTTP, par exemple :

```bash
python -m http.server 4180
```

Puis va sur http://127.0.0.1:4180/

## Google Maps

La clé se trouve dans `maps-config.js`. Dans Google Cloud, restreins-la par URL (domaine Vercel et, plus tard, psmartking.com) et autorise **Maps JavaScript API** et **Places API (New)**.
