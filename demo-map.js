/**
 * Démo carte interactive — mockup iPhone, zone centre-ville uniquement.
 */

const DEMO_CENTER = { lat: 45.5019, lng: -73.5674 };
const DEMO_RADIUS_KM = 1;
const DEMO_LIMIT = 180;
const DEMO_DEBOUNCE_MS = 450;

let demoMap = null;
let demoPolylines = [];
let demoLoadTimer = 0;
let demoBusy = false;
let demoResizeTimer = 0;

function demoLang() {
  return document.documentElement.lang === "en" ? "en" : "fr";
}

function demoCopy(key) {
  const table = {
    fr: {
      loading: "Chargement de la voirie…",
      error: "Démo indisponible pour le moment. Reviens plus tard ou rejoins la liste d'attente.",
      empty: "Aucun tronçon ici. Déplace la carte vers le centre-ville.",
      pick: "Touche un tronçon coloré pour voir les règles.",
      pickHint: "Touche un tronçon coloré pour voir les règles.",
      outsideZone: "Hors zone démo. Reviens au centre-ville ou cherche une adresse sur l'accueil.",
      sideLeft: "côté gauche",
      sideRight: "côté droit",
      canPark: "Stationnement autorisé",
      cannotPark: "Stationnement interdit ou payant",
      confidence: "Fiabilité",
      schedule: "Horaires",
      reason: "Motif",
      nextChange: "Prochain changement",
      close: "Fermer",
    },
    en: {
      loading: "Loading street segments…",
      error: "Demo unavailable right now. Try again later or join the waitlist.",
      empty: "No segments here. Pan toward downtown Montreal.",
      pick: "Tap a colored street segment to see the rules.",
      pickHint: "Tap a colored street segment to see the rules.",
      outsideZone: "Outside the demo zone. Return downtown or search on the home page.",
      sideLeft: "left side",
      sideRight: "right side",
      canPark: "Parking allowed",
      cannotPark: "No parking or paid parking",
      confidence: "Confidence",
      schedule: "Schedule",
      reason: "Reason",
      nextChange: "Next change",
      close: "Close",
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

function isInDemoZone(lat, lng) {
  const pip = window.pskZone?.pointInDemoZone(lat, lng);
  return pip !== false;
}

function setDemoStatus(text, kind) {
  const el = document.querySelector("[data-demo-status]");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.kind = kind || "";
  el.hidden = !text;
}

function openDemoSheet() {
  const sheet = document.querySelector("[data-demo-sheet]");
  const prompt = document.querySelector("[data-demo-prompt]");
  if (sheet) {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  }
  prompt?.classList.add("is-hidden");
}

function closeDemoSheet() {
  const sheet = document.querySelector("[data-demo-sheet]");
  const prompt = document.querySelector("[data-demo-prompt]");
  const detail = document.querySelector("[data-demo-detail]");
  if (sheet) {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
  }
  if (detail) detail.innerHTML = "";
  prompt?.classList.remove("is-hidden");
}

function setDemoDetail(html, options) {
  const el = document.querySelector("[data-demo-detail]");
  if (!el) return;
  const open = options?.open !== false;
  if (html) {
    el.innerHTML = html;
    if (open) openDemoSheet();
  } else {
    closeDemoSheet();
  }
}

function showOutsideZone() {
  clearDemoPolylines();
  setDemoStatus(demoCopy("outsideZone"), "outside");
  setDemoDetail(`<p class="demo-detail-outside">${escapeHtml(demoCopy("outsideZone"))}</p>`);
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
      strokeWeight: 5,
      strokeOpacity: 0.92,
      clickable: true,
      map: demoMap,
      zIndex: item.can_park ? 2 : 4,
    });
    line.addListener("click", (event) => {
      if (event?.stop) event.stop();
      void showDemoDetail(item);
    });
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
  setDemoStatus("", "");
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
  const center = demoMap.getCenter();
  const lat = center.lat();
  const lng = center.lng();
  if (!isInDemoZone(lat, lng)) {
    showOutsideZone();
    return;
  }
  demoBusy = true;
  try {
    const items = await fetchDemoPolylines({ lat, lng });
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

function checkDemoMapView() {
  if (!demoMap) return;
  const center = demoMap.getCenter();
  if (!center) return;
  if (!isInDemoZone(center.lat(), center.lng())) showOutsideZone();
}

function triggerDemoMapResize() {
  if (!demoMap || !window.google?.maps?.event) return;
  window.google.maps.event.trigger(demoMap, "resize");
  demoMap.setCenter(demoMap.getCenter() || DEMO_CENTER);
}

function scheduleDemoMapResize() {
  window.clearTimeout(demoResizeTimer);
  demoResizeTimer = window.setTimeout(triggerDemoMapResize, 120);
}

async function initDemoMap() {
  const mount = document.getElementById("demo-map");
  if (!mount || !window.google?.maps) return;

  const { Map } = await google.maps.importLibrary("maps");
  demoMap = new Map(mount, {
    center: DEMO_CENTER,
    zoom: 15,
    disableDefaultUI: true,
    gestureHandling: "greedy",
    clickableIcons: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    restriction: {
      latLngBounds: { north: 45.65, south: 45.45, east: -73.5, west: -73.78 },
      strictBounds: false,
    },
  });

  const geo = window.pskZone?.demoZoneGeo?.();
  if (geo && window.pskZone?.applyZoneOverlay) {
    window.pskZone.applyZoneOverlay(demoMap, geo);
  }

  demoMap.addListener("idle", () => {
    scheduleDemoReload();
    checkDemoMapView();
  });

  demoMap.addListener("click", (event) => {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    if (!isInDemoZone(lat, lng)) {
      showOutsideZone();
      return;
    }
    closeDemoSheet();
    setDemoStatus("", "");
  });

  document.querySelector("[data-demo-recenter]")?.addEventListener("click", () => {
    demoMap.panTo(DEMO_CENTER);
    demoMap.setZoom(15);
    closeDemoSheet();
    setDemoStatus("", "");
    scheduleDemoReload();
  });

  document.querySelector("[data-demo-close]")?.addEventListener("click", () => {
    closeDemoSheet();
    setDemoStatus("", "");
  });

  window.addEventListener("resize", scheduleDemoMapResize);
  if (window.ResizeObserver) {
    const stage = document.querySelector(".demo-phone-map-stage");
    if (stage) new ResizeObserver(scheduleDemoMapResize).observe(stage);
  }

  closeDemoSheet();
  triggerDemoMapResize();
  await reloadDemoPolylines();
}

function refreshDemoCopy() {
  const prompt = document.querySelector("[data-demo-prompt]");
  if (prompt) prompt.textContent = demoCopy("pickHint");
  const closeBtn = document.querySelector("[data-demo-close]");
  if (closeBtn) closeBtn.setAttribute("aria-label", demoCopy("close"));
  const status = document.querySelector("[data-demo-status]");
  if (status?.dataset.kind === "outside") status.textContent = demoCopy("outsideZone");
}

window.initDemoMap = initDemoMap;
window.refreshDemoCopy = refreshDemoCopy;
