import newRequest from "./newRequest";

export const getCurrentBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  });

export const fetchGigsByLocation = async ({
  category,
  search,
  lat,
  lng,
  maxDistanceKm,
  status = "open",
}) => {
  const response = await newRequest.get("/gigs", {
    params: {
      ...(category ? { cat: category } : {}),
      ...(search ? { search } : {}),
      ...(lat && lng ? { lat, lng } : {}),
      ...(maxDistanceKm ? { maxDistanceKm } : {}),
      status,
    },
  });
  return response.data;
};

export const fetchGigRouteInfo = async (gigId, location) => {
  const response = await newRequest.get(`/gigs/${gigId}/route-info`, {
    params: location,
  });
  return response.data;
};

export const updateLocationPreferences = async (userId, payload) => {
  const response = await newRequest.put(
    `/users/${userId}/location-preferences`,
    payload,
  );
  return response.data;
};

export const fetchAreaAlerts = async (userId) => {
  const response = await newRequest.get(`/users/${userId}/area-alerts`);
  return response.data;
};
