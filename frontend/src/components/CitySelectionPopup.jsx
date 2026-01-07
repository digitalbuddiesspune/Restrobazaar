import { useState, useEffect } from 'react';
import { cityAPI } from '../utils/api';

const CITY_STORAGE_KEY = 'selectedCity';
const CITY_ID_KEY = 'selectedCityId';

const CitySelectionPopup = ({ onCitySelect }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    // Fetch cities from API
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await cityAPI.getServiceableCities();
        if (response.success && response.data) {
          setCities(response.data);
          
          // Check if user has already selected a city
          const savedCityId = localStorage.getItem(CITY_ID_KEY);
          const savedCityName = localStorage.getItem(CITY_STORAGE_KEY);
          
          if (savedCityId && savedCityName) {
            // Find the saved city in the fetched cities
            const savedCity = response.data.find(city => city._id === savedCityId);
            if (savedCity) {
              setSelectedCity(savedCity);
              // Notify parent component about the saved city
              if (onCitySelect) {
                onCitySelect(savedCityName);
              }
            } else {
              // Saved city not found, show popup
              setShowPopup(true);
            }
          } else {
            // No city selected, show popup
            setShowPopup(true);
          }
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Show popup even if API fails
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [onCitySelect]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const handleSubmit = () => {
    if (!selectedCity) return;
    
    // Save selected city to localStorage
    localStorage.setItem(CITY_STORAGE_KEY, selectedCity.displayName);
    localStorage.setItem(CITY_ID_KEY, selectedCity._id);
    setShowPopup(false);
    
    // Notify parent component
    if (onCitySelect) {
      onCitySelect(selectedCity.displayName);
    }
    
    // Dispatch event to notify Header
    window.dispatchEvent(new Event('cityChange'));
    
    // Reload the page to apply the filter
    window.location.reload();
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
          <>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cities.length > 0 ? (
                cities.map((city) => (
                  <button
                    key={city._id}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedCity?._id === city._id
                        ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{city.displayName}</span>
                        {city.state && (
                          <span className="text-xs text-gray-500 ml-2">({city.state})</span>
                        )}
                      </div>
                      {selectedCity?._id === city._id && (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No cities available</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedCity}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CitySelectionPopup;
export { CITY_STORAGE_KEY, CITY_ID_KEY };


