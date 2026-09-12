/**
 * Masque gris + zone bleue centre-ville, et test point-dans-polygone partagé.
 */
(function (global) {
  const MASK = { north: 45.72, south: 45.38, east: -73.45, west: -73.98 };
  const overlayRefs = new WeakMap();

  function ringFromGeo(geojson) {
    const feat = geojson?.features?.[0];
    return feat?.geometry?.coordinates?.[0] || [];
  }

  function ringContains(ring, lat, lng) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi;
      if (hit) inside = !inside;
    }
    return inside;
  }

  function pointInPolygonCoords(coords, lat, lng) {
    if (!coords || !coords.length) return false;
    if (!ringContains(coords[0], lat, lng)) return false;
    for (let i = 1; i < coords.length; i += 1) {
      if (ringContains(coords[i], lat, lng)) return false;
    }
    return true;
  }

  function pointInGeo(geojson, lat, lng) {
    if (!geojson) return null;
    const feats = geojson.features || [];
    for (const feat of feats) {
      const geom = feat.geometry;
      if (!geom) continue;
      if (geom.type === "Polygon" && pointInPolygonCoords(geom.coordinates, lat, lng)) return true;
      if (geom.type === "MultiPolygon") {
        if (geom.coordinates.some((poly) => pointInPolygonCoords(poly, lat, lng))) return true;
      }
    }
    return false;
  }

  function activeZoneGeo() {
    return global.PSMARTKING_DEMO_ZONE || global.PSMARTKING_COVERAGE_ZONE || null;
  }

  function pointInActiveZone(lat, lng) {
    const geo = activeZoneGeo();
    if (!geo) return null;
    return pointInGeo(geo, lat, lng);
  }

  function latLngRing(ring) {
    return ring.map(([lng, lat]) => ({ lat, lng }));
  }

  function clearZoneOverlay(map) {
    const items = overlayRefs.get(map);
    if (items) items.forEach((poly) => poly.setMap(null));
    overlayRefs.delete(map);
  }

  function applyZoneOverlay(map, geojson) {
    if (!map || !global.google?.maps) return;
    clearZoneOverlay(map);
    const ring = ringFromGeo(geojson || activeZoneGeo());
    if (!ring.length) return;

    const inner = latLngRing(ring);
    const outer = [
      { lat: MASK.north, lng: MASK.west },
      { lat: MASK.north, lng: MASK.east },
      { lat: MASK.south, lng: MASK.east },
      { lat: MASK.south, lng: MASK.west },
    ];
    const hole = inner.slice().reverse();

    const mask = new google.maps.Polygon({
      paths: [outer, hole],
      fillColor: "#475569",
      fillOpacity: 0.42,
      strokeWeight: 0,
      clickable: false,
      map,
      zIndex: 1,
    });

    const zone = new google.maps.Polygon({
      paths: inner,
      fillColor: "#4169E1",
      fillOpacity: 0.14,
      strokeColor: "#2a47c9",
      strokeWeight: 2,
      clickable: false,
      map,
      zIndex: 2,
    });

    overlayRefs.set(map, [mask, zone]);
  }

  function fitMapToZone(map, geojson, padding) {
    const ring = ringFromGeo(geojson || activeZoneGeo());
    if (!ring.length || !map) return;
    const bounds = new google.maps.LatLngBounds();
    ring.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    if (!bounds.isEmpty()) map.fitBounds(bounds, padding || 48);
  }

  global.pskZone = {
    activeZoneGeo,
    pointInActiveZone,
    pointInGeo,
    applyZoneOverlay,
    clearZoneOverlay,
    fitMapToZone,
    ringFromGeo,
  };
})(window);
