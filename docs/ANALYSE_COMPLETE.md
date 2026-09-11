# Analyse complète — Site P-SmartKing

> **Chemin :** `C:\Users\Adiar\P_SmartKing - Site Web`  
> **App mobile :** `C:\Users\Adiar\parksmart` (repo interne ParkSmart)  
> **Domaine :** [psmartking.com](https://psmartking.com)  
> **Date :** septembre 2026

---

## 1. Vue d'ensemble

| Projet | Rôle |
|--------|------|
| **Site web** | Marketing, liste d'attente, démo limitée, SEO, pages légales |
| **App ParkSmart** | Produit Expo/RN + backend FastAPI — marque store **P_SmartKing** |

Les deux projets sont **séparés en git** (`KINGMA01/psmartking` vs `parksmart`) mais partagent la même vision produit.

---

## 2. Stack site web

- HTML/CSS/JS vanilla — **pas de build**
- Hébergement **Vercel** (`vercel.json`, fonctions `api/`)
- i18n FR/EN via objet `COPY` dans `app.js`
- Google Maps (couverture + démo segments)
- Design : Sora + Plus Jakarta Sans, palette `--royal #4169E1`

---

## 3. Pages & routes

| Page | URL | Statut |
|------|-----|--------|
| Accueil | `/` | ✅ Complet |
| Comment ça marche | `/comment` | ✅ |
| Fonctionnalités | `/fonctionnalites` | ✅ |
| **Essayer la carte** | `/essayer` | ✅ **Nouveau — démo API** |
| À propos | `/a-propos` | ✅ |
| FAQ | `/faq` | ✅ |
| Liste d'attente | `/liste-attente` | ✅ |
| Contact | `/contact` | ✅ |
| **Confidentialité** | `/confidentialite` | ✅ **Nouveau** |
| **Conditions** | `/conditions` | ✅ **Nouveau** |
| 404 | `/404` | ✅ |

---

## 4. Intégration app (démo)

### Architecture

```
Visiteur → psmartking.com/essayer.html
         → Google Maps (polylignes)
         → GET /api/demo?path=segments/polylines  (Vercel)
         → PARKSMART_API_URL/api/segments/polylines  (backend ParkSmart)
```

### Limites démo (volontaires)

| Limite | Valeur |
|--------|--------|
| Rayon | 1 km |
| Polylignes max | 180 |
| Écriture | Aucune (pas de signalement, compte, minuteur) |
| Zone | Centre-ville Montréal (pan libre) |
| Rate limit proxy | 40 req/min/IP |

### Fichiers clés

- `essayer.html` — page démo
- `demo-map.js` — carte + clic tronçon
- `api/demo.js` — proxy Vercel sécurisé

### Config Vercel requise

```
PARKSMART_API_URL=https://votre-backend-parksmart.com
GOOGLE_MAPS_API_KEY=...
WAITLIST_WEBHOOK_URL=...  (ou Resend)
```

Backend ParkSmart :

```
ALLOWED_ORIGINS=https://psmartking.com,https://www.psmartking.com,parksmart://
```

---

## 5. Lacunes comblées (cette passe)

- ✅ Page démo interactive (`essayer.html`)
- ✅ Proxy API read-only
- ✅ Pages légales site (confidentialité, conditions)
- ✅ Liens nav « Essayer la carte »
- ✅ CTA accueil → démo au lieu de simple capture statique

---

## 6. Lacunes restantes (actions manuelles)

| Priorité | Item |
|----------|------|
| P0 | Déployer backend + `PARKSMART_API_URL` sur Vercel |
| P0 | Relecture avocat pages légales (FR/EN) |
| P1 | Google Search Console (`meta verification` vide) |
| P1 | Harmoniser sitemap (clean URLs vs `.html`) |
| P1 | Lier app `EXPO_PUBLIC_PRIVACY_URL` → `https://psmartking.com/confidentialite.html` |
| P2 | Badges App Store / Play (post-lancement) |
| P2 | Corriger marquee (Kirkland, Beaconsfield hors île stricte) |
| P2 | Supprimer assets orphelins (`badge-google-play.png`) |
| P3 | Analytics privacy-friendly (Plausible?) |

---

## 7. Relation marques

| Contexte | Nom |
|----------|-----|
| Site public | **P-SmartKing** |
| App store | **P_SmartKing** / `com.parksmart.app` |
| Repo technique | **parksmart** |

---

## 8. Équipe (page À propos)

- **MA** — Expo, React Native, TypeScript, carte
- **Adam** — Données ouvertes Montréal, pipeline
- **Noella** — Marketing, réseaux, liste d'attente

Éditeur légal : **DnK Vision** — psmartking@dnkvision.com

---

## 9. Prochaines étapes produit

1. Tester démo en local : `npm run dev` + backend ParkSmart + `PARKSMART_API_URL` simulé
2. Beta privée → liste d'attente existante
3. Stores → liens croisés site ↔ app (voir `parksmart/docs/APP_STORE_SUBMISSION.md`)

Voir aussi : [`INTEGRATION_APP_PARKSMART.md`](./INTEGRATION_APP_PARKSMART.md)
