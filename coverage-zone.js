/* Zones géographiques P-SmartKing */

/** Zone démo : cœur du centre-ville (~50 % de la zone précédente). */
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
            [-73.576, 45.508],
            [-73.564, 45.510],
            [-73.551, 45.509],
            [-73.544, 45.503],
            [-73.546, 45.497],
            [-73.558, 45.494],
            [-73.570, 45.495],
            [-73.576, 45.501],
            [-73.576, 45.508],
          ],
        ],
      },
    },
  ],
};

/** Zone couverte au lancement : île de Montréal (contour simplifié). */
window.PSMARTKING_COVERAGE_ZONE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Île de Montréal" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.972, 45.528],
            [-73.965, 45.492],
            [-73.948, 45.462],
            [-73.915, 45.438],
            [-73.872, 45.425],
            [-73.82, 45.422],
            [-73.765, 45.428],
            [-73.705, 45.442],
            [-73.655, 45.462],
            [-73.605, 45.488],
            [-73.555, 45.512],
            [-73.505, 45.532],
            [-73.478, 45.555],
            [-73.482, 45.582],
            [-73.505, 45.608],
            [-73.545, 45.632],
            [-73.595, 45.652],
            [-73.655, 45.665],
            [-73.72, 45.672],
            [-73.785, 45.668],
            [-73.845, 45.655],
            [-73.905, 45.635],
            [-73.955, 45.605],
            [-73.978, 45.568],
            [-73.972, 45.528],
          ],
        ],
      },
    },
  ],
};
