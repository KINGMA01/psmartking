/* Clé Google Maps (visible côté site : restreins-la par URL dans Google Cloud).
   APIs à activer ET à autoriser sur cette clé :
   Maps JavaScript API + Places API (New).
   Colle la clé entre les guillemets, un seul endroit. */
window.PSMARTKING_GOOGLE_MAPS_API_KEY = "AIzaSyBG7T4dHyGlgAAmYQ0MATS_7xsBeBxnuo0";

window.gm_authFailure = function () {
  const holder = document.getElementById("coverage-map");
  if (!holder) return;
  holder.innerHTML =
    '<p class="coverage-map-fallback">Ta clé Google bloque Maps JavaScript API. Dans Google Cloud → Identifiants → cette clé → Restrictions d’API, ajoute <strong>Maps JavaScript API</strong> et <strong>Places API (New)</strong>. Active-les aussi dans Bibliothèque d’API, attends une minute, puis recharge.</p>';
};
