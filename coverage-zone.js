/* Zones géographiques P-SmartKing */

/** Zone démo : noyau du centre-ville (Place d'Armes / Square Dorchester). */
window.PSMARTKING_DEMO_ZONE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Cœur du centre-ville" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.569, 45.505],
            [-73.563, 45.506],
            [-73.557, 45.506],
            [-73.553, 45.503],
            [-73.554, 45.5],
            [-73.56, 45.498],
            [-73.566, 45.499],
            [-73.569, 45.502],
            [-73.569, 45.505],
          ],
        ],
      },
    },
  ],
};
