import { useState, useEffect } from 'react';

const CITY_STORAGE_KEY = 'selectedCity';
const CITIES = ['Pune', 'Nagpur', 'Mumbai', 'Ahmedabad', 'Other'];

const CitySelectionPopup = ({ onCitySelect }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Other');

  useEffect(() => {
    // Check if user has already selected a city
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY);
    if (!savedCity) {
      // Show popup if no city is selected
      setShowPopup(true);
    } else {
      // Notify parent component about the saved city
      if (onCitySelect) {
        onCitySelect(savedCity);
      }
    }
  }, [onCitySelect]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const handleSubmit = () => {
    // Save selected city to localStorage
    localStorage.setItem(CITY_STORAGE_KEY, selectedCity);
    setShowPopup(false);
    
    // Notify parent component
    if (onCitySelect) {
      onCitySelect(selectedCity);
    }
    
    // Reload the page to apply the filter
    window.location.reload();
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Select Your City
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Choose your city to see products available in your area
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`w-full py-3 px-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedCity === city
                  ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg">{city}</span>
                {selectedCity === city && (
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
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </button>

        {selectedCity === 'Other' && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Selecting "Other" will show all available products
          </p>
        )}
      </div>
    </div>
  );
};

export default CitySelectionPopup;
export { CITY_STORAGE_KEY, CITIES };

