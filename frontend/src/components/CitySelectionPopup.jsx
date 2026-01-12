import { useState, useEffect } from 'react';
import { cityAPI } from '../utils/api';

const CITY_STORAGE_KEY = 'selectedCity';
const CITY_ID_KEY = 'selectedCityId';

const CitySelectionPopup = ({ onCitySelect }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleCityChange = (e) => {
    const selectedCityId = e.target.value;
    if (!selectedCityId) return;
    
    const city = cities.find(c => c._id === selectedCityId);
    if (!city) return;
    
    // Save selected city to localStorage
    localStorage.setItem(CITY_STORAGE_KEY, city.displayName);
    localStorage.setItem(CITY_ID_KEY, city._id);
    setShowPopup(false);
    
    // Notify parent component
    if (onCitySelect) {
      onCitySelect(city.displayName);
    }
    
    // Dispatch event to notify Header
    window.dispatchEvent(new Event('cityChange'));
    
    // Reload the page to apply the filter
    window.location.reload();
  };

  if (!showPopup) return null;

  return (
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
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" disabled>
                  Select a city
                </option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.displayName}{city.state ? ` (${city.state})` : ''}
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
  );
};

export default CitySelectionPopup;
export { CITY_STORAGE_KEY, CITY_ID_KEY };


