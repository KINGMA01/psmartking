export default function handler(_req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
    mapsKey: process.env.GOOGLE_MAPS_API_KEY || process.env.PSMARTKING_GOOGLE_MAPS_API_KEY || "",
  });
}
