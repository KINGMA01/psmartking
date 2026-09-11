/**
 * Démo carte interactive — segments ParkSmart via /api/demo (proxy Vercel).
 * Coque « app web » : recherche d'adresse, carte, panneau détail enrichi.
 */

const DEMO_CENTER = { lat: 45.5019, lng: -73.5674 };
const DEMO_RADIUS_KM = 1;
const DEMO_LIMIT = 180;
const DEMO_DEBOUNCE_MS = 450;
const DEMO_MTL_BIAS = { radius: 42000, center: { lat: 45.508, lng: -73.668 } };

let demoMap = null;
let demoPolylines = [];
let demoLoadTimer = 0;
let demoBusy = false;
let demoSessionToken = null;
let demoSearchMarker = null;
let demoSuggestTimer = 0;
let demoSuggestActive = -1;
let demoSuggestItems = [];

function demoLang() {
  return document.documentElement.lang === "en" ? "en" : "fr";
}

function demoCopy(key) {
  const table = {
    fr: {
      loading: "Chargement de la voirie…",
      error: "Démo indisponible pour le moment. Reviens plus tard ou rejoins la liste d'attente.",
      empty: "Aucun tronçon dans cette zone. Déplace la carte vers le centre-ville.",
      pick: "Touche un tronçon coloré pour voir les règles.",
      sideLeft: "côté gauche",
      sideRight: "côté droit",
      canPark: "Stationnement autorisé",
      cannotPark: "Stationnement interdit ou payant",
      confidence: "Fiabilité",
      schedule: "Horaires",
      reason: "Motif",
      nextChange: "Prochain changement",
      searchEmpty: "Entre une adresse à Montréal.",
      searchNotFound: "Adresse introuvable. Vérifie l'orthographe.",
    },
    en: {
      loading: "Loading street segments…",
      error: "Demo unavailable right now. Try again later or join the waitlist.",
      empty: "No segments in this view. Pan toward downtown Montreal.",
      pick: "Tap a colored street segment to see the rules.",
      sideLeft: "left side",
      sideRight: "right side",
      canPark: "Parking allowed",
      cannotPark: "No parking or paid parking",
      confidence: "Confidence",
      schedule: "Schedule",
      reason: "Reason",
      nextChange: "Next change",
      searchEmpty: "Enter a Montreal address.",
      searchNotFound: "Address not found. Check spelling.",
    },
  };
  return (table[demoLang()] || table.fr)[key] || key;
}

function demoApiUrl(path, params) {
  const u = new URL("/api/demo", window.location.origin);
  u.searchParams.set("path", path);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") u.searchParams.set(k, String(v));
  });
  return u.toString();
}

function segmentIdFromItem(item) {
  if (item.segment_id) return item.segment_id;
  const parts = String(item.id || "").split("|");
  return parts[0] || item.id;
}

function sideLabel(side) {
  return side === "left" ? demoCopy("sideLeft") : demoCopy("sideRight");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function demoLocale() {
  return demoLang() === "en" ? "en-CA" : "fr-CA";
}

function formatSlotTime(value) {
  const str = String(value || "").trim();
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(demoLocale(), {
        hour: "numeric",
        minute: "2-digit",
        hour12: demoLang() === "en",
      });
    }
  }
  return str;
}

function formatDateTime(value) {
  const str = String(value || "").trim();
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(demoLocale(), {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: demoLang() === "en",
      });
    }
  }
  return str;
}

function setDemoStatus(text, kind) {
  const el = document.querySelector("[data-demo-status]");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.kind = kind || "";
}

function setDemoDetail(html) {
  const el = document.querySelector("[data-demo-detail]");
  if (!el) return;
  el.innerHTML = html || `<p class="demo-detail-placeholder">${demoCopy("pick")}</p>`;
  document.querySelector("[data-demo-sheet]")?.classList.toggle("has-detail", Boolean(html));
}

function clearDemoPolylines() {
  demoPolylines.forEach((line) => line.setMap(null));
  demoPolylines = [];
}

async function fetchDemoPolylines(center) {
  const res = await fetch(
    demoApiUrl("segments/polylines", {
      latitude: center.lat,
      longitude: center.lng,
      radius: DEMO_RADIUS_KM,
      limit: DEMO_LIMIT,
      split_stalls: false,
    }),
  );
  if (!res.ok) throw new Error("load");
  return res.json();
}

function drawDemoPolylines(items) {
  clearDemoPolylines();
  if (!window.google || !demoMap) return;
  const maps = google.maps;
  (items || []).forEach((item) => {
    if (!Array.isArray(item.coords) || item.coords.length < 2) return;
    const path = item.coords.map(([lat, lng]) => ({ lat: Number(lat), lng: Number(lng) }));
    const line = new maps.Polyline({
      path,
      strokeColor: item.color || "#64748b",
      strokeWeight: 6,
      strokeOpacity: 0.92,
      clickable: true,
      map: demoMap,
      zIndex: item.can_park ? 2 : 4,
    });
    line.addListener("click", () => void showDemoDetail(item));
    demoPolylines.push(line);
  });
}

function formatSchedule(slots) {
  const list = Array.isArray(slots) ? slots.slice(0, 4) : [];
  if (!list.length) return "";
  const rows = list
    .map((slot) => {
      const start = formatSlotTime(slot.start);
      const end = formatSlotTime(slot.end);
      const time = end ? `${escapeHtml(start)} – ${escapeHtml(end)}` : escapeHtml(start);
      const label = escapeHtml(slot.label_fr || slot.status || "");
      return `<li><span class="demo-schedule-time">${time}</span><span class="demo-schedule-label">${label}</span></li>`;
    })
    .join("");
  return `<div class="demo-schedule"><p class="demo-schedule-title">${demoCopy("schedule")}</p><ul>${rows}</ul></div>`;
}

function formatForbiddenReason(reason) {
  if (!reason || !reason.label) return "";
  const sub = reason.sublabel ? `<span class="demo-reason-sub">${escapeHtml(reason.sublabel)}</span>` : "";
  return `<p class="demo-reason"><strong>${demoCopy("reason")}:</strong> ${escapeHtml(reason.label)} ${sub}</p>`;
}

function nextChangeLine(d) {
  const at = d.next_can_park_at || d.next_cannot_park_at || d.next_change_at;
  if (!at) return "";
  return `<p class="demo-detail-meta"><strong>${demoCopy("nextChange")}:</strong> ${escapeHtml(formatDateTime(at))}</p>`;
}

async function showDemoDetail(item) {
  setDemoDetail(`<p class="demo-detail-loading">${demoCopy("loading")}</p>`);
  const segmentId = segmentIdFromItem(item);
  const tStart = item.t_start != null ? item.t_start : 0;
  const tEnd = item.t_end != null ? item.t_end : 1;
  try {
    const res = await fetch(
      demoApiUrl("segments/chunk-detail", {
        segment_id: segmentId,
        side: item.side || "right",
        t_start: tStart,
        t_end: tEnd,
      }),
    );
    if (!res.ok) throw new Error("detail");
    const d = await res.json();
    const label = d.status_label_fr || item.status_label_fr || item.status || "";
    const verdict = d.can_park ? demoCopy("canPark") : demoCopy("cannotPark");
    const badgeClass = d.can_park ? "is-ok" : "is-no";
    const confidence =
      d.confidence_label && d.confidence > 0
        ? `<p class="demo-detail-meta"><strong>${demoCopy("confidence")}:</strong> ${escapeHtml(d.confidence_label)} (${d.confidence}%)</p>`
        : "";
    setDemoDetail(`
      <p class="demo-detail-street">${escapeHtml(d.street_name || item.street_name || "")}</p>
      <p class="demo-detail-side">${sideLabel(d.side || item.side)}</p>
      <p class="demo-verdict-badge ${badgeClass}">${escapeHtml(verdict)}</p>
      <p class="demo-detail-status" style="color:${escapeHtml(d.color || item.color || "#64748b")}">${escapeHtml(label)}</p>
      ${formatForbiddenReason(d.forbidden_reason)}
      ${nextChangeLine(d)}
      ${confidence}
      ${formatSchedule(d.schedule)}
    `);
  } catch {
    setDemoDetail(`<p class="demo-detail-error">${demoCopy("error")}</p>`);
  }
}

async function reloadDemoPolylines() {
  if (!demoMap || demoBusy) return;
  demoBusy = true;
  setDemoStatus(demoCopy("loading"), "loading");
  try {
    const center = demoMap.getCenter();
    const items = await fetchDemoPolylines({ lat: center.lat(), lng: center.lng() });
    drawDemoPolylines(items);
    if (!items.length) setDemoStatus(demoCopy("empty"), "empty");
    else setDemoStatus("", "");
  } catch {
    clearDemoPolylines();
    setDemoStatus(demoCopy("error"), "error");
  } finally {
    demoBusy = false;
  }
}

function scheduleDemoReload() {
  window.clearTimeout(demoLoadTimer);
  demoLoadTimer = window.setTimeout(() => void reloadDemoPolylines(), DEMO_DEBOUNCE_MS);
}

function demoPlacesLang() {
  return demoLang() === "en" ? "en-CA" : "fr-CA";
}

async function demoLoadPlaces() {
  if (!window.google?.maps?.importLibrary) throw new Error("maps");
  return google.maps.importLibrary("places");
}

function demoResetSession(Places) {
  if (Places?.AutocompleteSessionToken) {
    demoSessionToken = new Places.AutocompleteSessionToken();
  }
}

async function demoSuggestAddresses(query) {
  const Places = await demoLoadPlaces();
  if (!demoSessionToken && Places.AutocompleteSessionToken) {
    demoSessionToken = new Places.AutocompleteSessionToken();
  }
  const { suggestions } = await Places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    includedRegionCodes: ["ca"],
    locationBias: DEMO_MTL_BIAS,
    language: demoPlacesLang(),
    region: "ca",
    sessionToken: demoSessionToken,
  });
  return Array.isArray(suggestions) ? suggestions : [];
}

function demoPredictionLabel(prediction) {
  const text = prediction?.text;
  const raw = text && typeof text === "object" && text.text ? text.text : String(text || "");
  return raw.replace(/, Canada$/i, "").trim();
}

async function demoPlaceToCoords(prediction) {
  const place = typeof prediction.toPlace === "function" ? prediction.toPlace() : prediction;
  await place.fetchFields({ fields: ["location", "formattedAddress"] });
  await demoLoadPlaces().then(demoResetSession);
  const loc = place.location;
  const lat = typeof loc.lat === "function" ? loc.lat() : loc?.lat;
  const lng = typeof loc.lng === "function" ? loc.lng() : loc?.lng;
  return {
    lat,
    lng,
    label: String(place.formattedAddress || "").replace(/, Canada$/i, "").trim(),
  };
}

function hideDemoSuggest() {
  const list = document.querySelector("[data-demo-suggest]");
  if (list) list.hidden = true;
  demoSuggestActive = -1;
  demoSuggestItems = [];
}

function showDemoSuggest(items) {
  const list = document.querySelector("[data-demo-suggest]");
  if (!list) return;
  demoSuggestItems = items;
  demoSuggestActive = -1;
  if (!items.length) {
    list.hidden = true;
    return;
  }
  list.innerHTML = items
    .map((item, i) => {
      const pred = item.placePrediction;
      const label = demoPredictionLabel(pred);
      return `<li><button type="button" class="coverage-suggest-item" data-demo-suggest-idx="${i}" role="option">${escapeHtml(label)}</button></li>`;
    })
    .join("");
  list.hidden = false;
}

async function demoGoToAddress(query) {
  const q = String(query || "").trim();
  if (!q) {
    setDemoStatus(demoCopy("searchEmpty"), "empty");
    return;
  }
  setDemoStatus(demoCopy("loading"), "loading");
  try {
    const suggestions = await demoSuggestAddresses(q);
    const pred = suggestions[0]?.placePrediction;
    if (!pred) {
      setDemoStatus(demoCopy("searchNotFound"), "error");
      return;
    }
    const hit = await demoPlaceToCoords(pred);
    if (hit.lat == null || hit.lng == null) throw new Error("coords");
    const input = document.querySelector("[data-demo-search-input]");
    if (input) input.value = hit.label || q;
    hideDemoSuggest();
    demoMap.panTo({ lat: hit.lat, lng: hit.lng });
    demoMap.setZoom(16);
    if (demoSearchMarker) demoSearchMarker.setMap(null);
    demoSearchMarker = new google.maps.Marker({
      map: demoMap,
      position: { lat: hit.lat, lng: hit.lng },
      title: hit.label,
    });
    await reloadDemoPolylines();
  } catch {
    setDemoStatus(demoCopy("searchNotFound"), "error");
  }
}

function initDemoSearch() {
  const form = document.querySelector("[data-demo-search]");
  const input = document.querySelector("[data-demo-search-input]");
  const list = document.querySelector("[data-demo-suggest]");
  if (!form || !input || !list) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void demoGoToAddress(input.value);
  });

  input.addEventListener("input", () => {
    window.clearTimeout(demoSuggestTimer);
    const q = input.value.trim();
    if (q.length < 3) {
      hideDemoSuggest();
      return;
    }
    demoSuggestTimer = window.setTimeout(async () => {
      try {
        const suggestions = await demoSuggestAddresses(q);
        showDemoSuggest(suggestions.slice(0, 5));
      } catch {
        hideDemoSuggest();
      }
    }, 220);
  });

  list.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-demo-suggest-idx]");
    if (!btn) return;
    const idx = Number(btn.dataset.demoSuggestIdx);
    const pred = demoSuggestItems[idx]?.placePrediction;
    if (!pred) return;
    void demoPlaceToCoords(pred).then((hit) => {
      input.value = hit.label || demoPredictionLabel(pred);
      hideDemoSuggest();
      demoMap.panTo({ lat: hit.lat, lng: hit.lng });
      demoMap.setZoom(16);
      if (demoSearchMarker) demoSearchMarker.setMap(null);
      demoSearchMarker = new google.maps.Marker({
        map: demoMap,
        position: { lat: hit.lat, lng: hit.lng },
      });
      void reloadDemoPolylines();
    });
  });

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) hideDemoSuggest();
  });
}

async function initDemoMap() {
  const mount = document.getElementById("demo-map");
  if (!mount || !window.google?.maps) return;

  const { Map } = await google.maps.importLibrary("maps");
  demoMap = new Map(mount, {
    center: DEMO_CENTER,
    zoom: 15,
    disableDefaultUI: false,
    gestureHandling: "greedy",
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  demoMap.addListener("idle", scheduleDemoReload);

  document.querySelector("[data-demo-recenter]")?.addEventListener("click", () => {
    demoMap.panTo(DEMO_CENTER);
    demoMap.setZoom(15);
    scheduleDemoReload();
  });

  setDemoDetail("");
  initDemoSearch();
  await reloadDemoPolylines();
}

function refreshDemoCopy() {
  const detail = document.querySelector("[data-demo-detail]");
  const placeholder = detail?.querySelector(".demo-detail-placeholder");
  if (placeholder) placeholder.textContent = demoCopy("pick");
}

window.initDemoMap = initDemoMap;
window.refreshDemoCopy = refreshDemoCopy;
