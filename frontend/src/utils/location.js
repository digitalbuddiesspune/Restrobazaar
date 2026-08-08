const LOCATION_CITY_KEY = 'userLocationCity';
const LOCATION_COORDS_KEY = 'userLocationCoords';
const LOCATION_TS_KEY = 'userLocationTimestamp';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Request browser geolocation permission and return coordinates.
 */
export const requestUserLocation = () => {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported by this browser'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to access your location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please allow location access to place orders.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable. Please try again.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Please try again.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
};

/**
 * Reverse-geocode coordinates to a city name (no API key required).
 */
export const reverseGeocodeCity = async (lat, lng) => {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to detect your city from location');
  }

  const data = await response.json();
  const adminNames = (data.localityInfo?.administrative || [])
    .map((item) => item.name)
    .filter(Boolean);

  const candidates = [
    data.city,
    data.locality,
    data.principalSubdivision,
    ...adminNames,
  ].filter(Boolean);

  return {
    city: data.city || data.locality || adminNames[0] || '',
    locality: data.locality || '',
    region: data.principalSubdivision || '',
    candidates,
    raw: data,
  };
};

/**
 * Fuzzy match detected location against the manually selected city.
 */
export const isLocationInSelectedCity = (locationInfo, selectedCityName) => {
  const selected = normalize(selectedCityName);
  if (!selected || !locationInfo) return false;

  const candidates = [
    locationInfo.city,
    locationInfo.locality,
    locationInfo.region,
    ...(locationInfo.candidates || []),
  ]
    .map(normalize)
    .filter(Boolean);

  return candidates.some(
    (candidate) =>
      candidate === selected ||
      candidate.includes(selected) ||
      selected.includes(candidate)
  );
};

const cacheLocation = (coords, locationInfo) => {
  try {
    sessionStorage.setItem(LOCATION_CITY_KEY, locationInfo.city || locationInfo.locality || '');
    sessionStorage.setItem(LOCATION_COORDS_KEY, JSON.stringify(coords));
    sessionStorage.setItem(LOCATION_TS_KEY, String(Date.now()));
    sessionStorage.setItem('userLocationInfo', JSON.stringify(locationInfo));
  } catch {
    // ignore storage errors
  }
};

export const getCachedLocationInfo = () => {
  try {
    const ts = Number(sessionStorage.getItem(LOCATION_TS_KEY) || 0);
    if (!ts || Date.now() - ts > CACHE_TTL_MS) return null;
    const raw = sessionStorage.getItem('userLocationInfo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Resolve current location city (uses short-lived cache).
 */
export const detectUserLocationCity = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    const cached = getCachedLocationInfo();
    if (cached) return { locationInfo: cached, fromCache: true };
  }

  const coords = await requestUserLocation();
  const locationInfo = await reverseGeocodeCity(coords.lat, coords.lng);
  cacheLocation(coords, locationInfo);
  return { locationInfo, coords, fromCache: false };
};

/**
 * Verify that the user's GPS city matches the selected service city.
 * Returns { ok, reason, locationCity, selectedCity }.
 */
export const verifyDeliveryForSelectedCity = async (selectedCityName, options = {}) => {
  const selectedCity = selectedCityName || localStorage.getItem('selectedCity');
  if (!selectedCity) {
    return {
      ok: false,
      reason: 'no_selected_city',
      message: 'Please select a city before placing an order.',
      selectedCity: null,
      locationCity: null,
    };
  }

  try {
    const { locationInfo } = await detectUserLocationCity(options);
    const ok = isLocationInSelectedCity(locationInfo, selectedCity);
    const locationCity =
      locationInfo.city || locationInfo.locality || locationInfo.region || 'your area';

    if (!ok) {
      return {
        ok: false,
        reason: 'city_mismatch',
        message: 'Not deliverable in your current location',
        selectedCity,
        locationCity,
        locationInfo,
      };
    }

    return {
      ok: true,
      reason: 'match',
      message: '',
      selectedCity,
      locationCity,
      locationInfo,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'location_error',
      message: error.message || 'Unable to verify your location',
      selectedCity,
      locationCity: null,
    };
  }
};

export { LOCATION_CITY_KEY, LOCATION_COORDS_KEY };
