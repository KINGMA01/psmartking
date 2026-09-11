/* Copie en site-config.js */
window.PSMARTKING_SITE_CONFIG = {
  /* Production Vercel : /api/waitlist (défaut). Ou URL Formspree / webhook Zapier. */
  waitlistEndpoint: "/api/waitlist",
};

/*
 * Variables Vercel (dashboard → Settings → Environment Variables) :
 *
 * GOOGLE_MAPS_API_KEY          — carte couverture + démo essayer.html
 * PARKSMART_API_URL            — backend ParkSmart (ex. https://api.psmartking.com)
 * WAITLIST_WEBHOOK_URL         — ou RESEND_API_KEY + WAITLIST_NOTIFY_EMAIL
 */
