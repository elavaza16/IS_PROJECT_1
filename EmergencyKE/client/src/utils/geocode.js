/**
 * Converts GPS coordinates into a human-readable place name
 * using OpenStreetMap's free Nominatim reverse geocoding API.
 * Returns a fallback "lat, lng" string if the lookup fails.
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!res.ok) throw new Error('Geocoding failed');

    const data = await res.json();

    if (data?.display_name) {
      // Trim to the most useful first 3-4 parts of the address
      const parts = data.display_name.split(',').map(p => p.trim());
      return parts.slice(0, 4).join(', ');
    }

    throw new Error('No address found');
  } catch {
    // Fallback — raw coordinates if lookup fails (offline, rate limit, etc.)
    return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
  }
}