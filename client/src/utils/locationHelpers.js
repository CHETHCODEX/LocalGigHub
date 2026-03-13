export const fallbackCityCoordinates = {
  downtown: { lat: 40.7128, lng: -74.006 },
  uptown: { lat: 40.8116, lng: -73.9442 },
  midtown: { lat: 40.758, lng: -73.9857 },
  brooklyn: { lat: 40.6782, lng: -73.9442 },
  queens: { lat: 40.7282, lng: -73.7949 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
};

export const getCoordinatesFromGig = (gig) => {
  const coordinates = gig?.geoLocation?.coordinates;
  if (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates[0] &&
    coordinates[1]
  ) {
    return { lng: coordinates[0], lat: coordinates[1] };
  }

  const cityKey = (gig?.geoLocation?.city || gig?.location || "")
    .trim()
    .toLowerCase();
  return fallbackCityCoordinates[cityKey] || null;
};

export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) {
    return "Distance unavailable";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
};

export const formatTravelTime = (travel) => {
  if (!travel) {
    return "Travel time unavailable";
  }

  const walk = `${travel.walkingMinutes} min walk`;
  const drive = `${travel.drivingMinutes} min drive`;
  return `${walk} · ${drive}`;
};
