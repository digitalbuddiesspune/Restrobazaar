import { useState, useEffect } from 'react';
import { cityAPI } from '../utils/api';
import { detectUserLocationCity, isLocationInSelectedCity } from '../utils/location';
import NotDeliverablePopup from './NotDeliverablePopup';

const CITY_STORAGE_KEY = 'selectedCity';
const CITY_ID_KEY = 'selectedCityId';
const LOCATION_PROMPT_SKIPPED_KEY = 'locationPromptSkipped';

const CitySelectionPopup = ({ onCitySelect }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [askingLocation, setAskingLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [pendingCity, setPendingCity] = useState(null);
  const [isNewCitySelection, setIsNewCitySelection] = useState(false);
  const [showNotDeliverable, setShowNotDeliverable] = useState(false);
  const [locationCity, setLocationCity] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await cityAPI.getServiceableCities();
        if (response.success && response.data) {
          setCities(response.data);

          const savedCityId = localStorage.getItem(CITY_ID_KEY);
          const savedCityName = localStorage.getItem(CITY_STORAGE_KEY);

          if (savedCityId && savedCityName) {
            const savedCity = response.data.find((city) => city._id === savedCityId);
            if (savedCity) {
              if (onCitySelect) {
                onCitySelect(savedCityName);
              }
              const hasLocation = sessionStorage.getItem('userLocationInfo');
              const skipped = sessionStorage.getItem(LOCATION_PROMPT_SKIPPED_KEY);
              if (!hasLocation && !skipped) {
                setPendingCity(savedCity);
                setIsNewCitySelection(false);
                setAskingLocation(true);
              }
            } else {
              setShowPopup(true);
            }
          } else {
            setShowPopup(true);
          }
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [onCitySelect]);

  const applyCitySelection = (city, { reload = true } = {}) => {
    localStorage.setItem(CITY_STORAGE_KEY, city.displayName);
    localStorage.setItem(CITY_ID_KEY, city._id);
    setShowPopup(false);
    setAskingLocation(false);

    if (onCitySelect) {
      onCitySelect(city.displayName);
    }

    window.dispatchEvent(new Event('cityChange'));
    if (reload) {
      window.location.reload();
    }
  };

  const handleCityChange = (e) => {
    const selectedCityId = e.target.value;
    if (!selectedCityId) return;

    const city = cities.find((c) => c._id === selectedCityId);
    if (!city) return;

    setPendingCity(city);
    setIsNewCitySelection(true);
    setShowPopup(false);
    setAskingLocation(true);
    setLocationError('');
  };

  const handleAllowLocation = async () => {
    if (!pendingCity) return;

    setLocationLoading(true);
    setLocationError('');

    try {
      const { locationInfo } = await detectUserLocationCity({ forceRefresh: true });
      const detected =
        locationInfo.city || locationInfo.locality || locationInfo.region || '';
      setLocationCity(detected);

      const matches = isLocationInSelectedCity(locationInfo, pendingCity.displayName);
      if (!matches) {
        setAskingLocation(false);
        setShowNotDeliverable(true);
        return;
      }

      sessionStorage.removeItem(LOCATION_PROMPT_SKIPPED_KEY);
      applyCitySelection(pendingCity, { reload: isNewCitySelection });
    } catch (error) {
      setLocationError(error.message || 'Please allow location access to continue.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSkipLocationForNow = () => {
    // Allow browsing; checkout still requires a matching location
    sessionStorage.setItem(LOCATION_PROMPT_SKIPPED_KEY, '1');
    if (pendingCity && isNewCitySelection) {
      applyCitySelection(pendingCity, { reload: true });
    } else {
      setAskingLocation(false);
      setPendingCity(null);
    }
  };

  const handleNotDeliverableClose = () => {
    setShowNotDeliverable(false);
    setPendingCity(null);
    setIsNewCitySelection(false);
    // If they already had a city saved, just dismiss; otherwise re-open city picker
    const savedCityId = localStorage.getItem(CITY_ID_KEY);
    if (!savedCityId) {
      setShowPopup(true);
    }
  };

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 backdrop-blur-md backdrop-brightness-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Select Your City
              </h2>
              <p className="text-gray-600 text-sm">
                Choose your city to see products available in your area
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="mb-4">
                {cities.length > 0 ? (
                  <select
                    onChange={handleCityChange}
                    defaultValue=""
                    className="w-full py-3 px-4 rounded-lg border-2 border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                    }}
                  >
                    <option value="" disabled>
                      Select a city
                    </option>
                    {cities.map((city) => (
                      <option key={city._id} value={city._id}>
                        {city.displayName}
                        {city.state ? ` (${city.state})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-center text-gray-500 py-4">No cities available</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {askingLocation && (
        <div className="fixed inset-0 backdrop-blur-md backdrop-brightness-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Allow location access
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              We use your current location to confirm delivery is available in{' '}
              <span className="font-medium text-gray-800">
                {pendingCity?.displayName || 'your selected city'}
              </span>
              .
            </p>

            {locationError && (
              <p className="text-sm text-red-600 mb-3">{locationError}</p>
            )}

            <button
              type="button"
              onClick={handleAllowLocation}
              disabled={locationLoading}
              className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60 mb-2"
            >
              {locationLoading ? 'Detecting location…' : 'Allow location'}
            </button>
            <button
              type="button"
              onClick={handleSkipLocationForNow}
              disabled={locationLoading}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Continue without location
            </button>
          </div>
        </div>
      )}

      <NotDeliverablePopup
        isOpen={showNotDeliverable}
        onClose={handleNotDeliverableClose}
        selectedCity={pendingCity?.displayName}
        locationCity={locationCity}
      />
    </>
  );
};

export default CitySelectionPopup;
export { CITY_STORAGE_KEY, CITY_ID_KEY };
