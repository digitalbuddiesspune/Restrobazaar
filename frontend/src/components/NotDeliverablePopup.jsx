/**
 * Small popup shown when GPS city does not match the selected service city.
 */
const NotDeliverablePopup = ({
  isOpen,
  onClose,
  selectedCity,
  locationCity,
  message = 'Not deliverable in your current location',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="not-deliverable-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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

        <h3
          id="not-deliverable-title"
          className="text-base font-semibold text-gray-900 mb-1"
        >
          {message}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {locationCity && selectedCity ? (
            <>
              You are currently in <span className="font-medium text-gray-800">{locationCity}</span>,
              but shopping for <span className="font-medium text-gray-800">{selectedCity}</span>.
              Please change your city or move to a deliverable area.
            </>
          ) : (
            'We cannot deliver to your current location for the selected city.'
          )}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default NotDeliverablePopup;
