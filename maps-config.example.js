/* Copie en maps-config.js pour le dev local.
   Production : définis GOOGLE_MAPS_API_KEY dans les variables Vercel (servie via /api/config).
   Restreins la clé par domaine dans Google Cloud. */
window.PSMARTKING_GOOGLE_MAPS_API_KEY = "";

window.gm_authFailure = function () {
  const holder = document.getElementById("coverage-map");
  if (!holder) return;
  holder.innerHTML =
    '<p class="coverage-map-fallback">La clé Google Maps n\'a pas pu charger la carte. Vérifie Maps JavaScript API et Places API (New).</p>';
};
