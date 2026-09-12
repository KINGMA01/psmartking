/* Zones géographiques P-SmartKing */

/** Zone démo : centre-ville de Montréal (contour simplifié). */
window.PSMARTKING_DEMO_ZONE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Centre-ville de Montréal" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.592, 45.5145],
            [-73.568, 45.5175],
            [-73.542, 45.514],
            [-73.528, 45.504],
            [-73.532, 45.492],
            [-73.552, 45.487],
            [-73.572, 45.488],
            [-73.59, 45.496],
            [-73.592, 45.5145],
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
