import { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useTestimonials } from "../hooks/useApiQueries";

const Testimonials = () => {
  // Use TanStack Query for caching and data fetching
  // Testimonials are cached for 30 minutes and won't refetch on every page visit
  const {
    data: testimonialsData,
    isLoading: loading,
    error: queryError,
    refetch: fetchTestimonials,
  } = useTestimonials(
    {
      status: "true", // Only fetch active testimonials
      limit: 100, // Fetch up to 100 testimonials
    },
    {
      staleTime: 30 * 60 * 1000, // 30 minutes - testimonials don't change often (same as Categories)
      gcTime: 60 * 60 * 1000, // 1 hour - keep in cache for 1 hour (same as Categories)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Use cached data if available
    }
  );

  // Map API response to component format
  const testimonials =
    testimonialsData?.data?.map((testimonial) => ({
      name: testimonial.name,
      role: testimonial.businessType,
      location: testimonial.location,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        testimonial.name
      )}&background=ef4444&color=fff&size=128`,
      rating: 5, // Default rating since not in API
      text: testimonial.review,
    })) || [];

  // Format error message
  const error = queryError
    ? "Failed to load testimonials. Please try again later."
    : null;

  // Detect screen size for responsive settings
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const StarIcon = ({ filled }) => (
    <svg
      className={`w-5 h-5 ${filled ? "text-yellow-400" : "text-gray-300"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  // Custom arrow components
  const PrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 bg-white rounded-full shadow-lg p-3 hover:bg-red-50 transition-colors duration-200 group"
      aria-label="Previous testimonials"
    >
      <svg
        className="w-6 h-6 text-gray-700 group-hover:text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );

  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 bg-white rounded-full shadow-lg p-3 hover:bg-red-50 transition-colors duration-200 group"
      aria-label="Next testimonials"
    >
      <svg
        className="w-6 h-6 text-gray-700 group-hover:text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );

  // Desktop Settings - Display 4 slides
  const settingsDesktop = {
    dots: true,
    infinite: testimonials.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: testimonials.length > 4,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  // Mobile Settings - Display 1 slide
  const settingsMobile = {
    dots: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: testimonials.length > 1,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false, // Hide arrows on mobile
  };

  // Use mobile settings if screen is mobile, otherwise use desktop
  const settings = isMobile ? settingsMobile : settingsDesktop;

  return (
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}

        <div className="text-center mb-10 md:mb-12">

          <div className="inline-block mb-2 lg:mb-4 ">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full">
              What Our Customers Say
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-heading font-bold text-gray-900 mb-2 md:mb-4">
            Customer Testimonials
          </h2>
          <p className="text-sm sm:text-lg  font-body font-medium text-gray-600 max-w-2xl mx-auto">
            Hear from restaurant owners and catering professionals who trust
            RestroBazaar for their supply needs.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative  md:px-8 ">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600">Loading testimonials...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchTestimonials}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No testimonials available at the moment.</p>
            </div>
          ) : (
            <Slider {...settings}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="px-3 mb-2">
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 md:p-8 h-full flex flex-col">
                    {/* Quote Icon */}
                    <div className="mb-4">
                      <svg
                        className="w-10 h-10 text-red-100"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} filled={i < testimonial.rating} />
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-sm sm:text-base font-body text-gray-700 mb-6 leading-relaxed grow">
                      "{testimonial.text}"
                    </p>

                    {/* Customer Info */}
                    <div className="flex items-center pt-4 border-t border-gray-100 mt-auto">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4 object-cover shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-heading font-semibold text-gray-900">
                          {testimonial.name}
                        </h4>
                        <p className="text-xs font-body text-gray-600">
                          {testimonial.role}
                        </p>
                        <p className="text-xs font-body text-gray-500 mt-1">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>

        {/* Custom styles for slick dots */}
        <style>{`
          .slick-dots {
            bottom: -50px;
          }
          .slick-dots li button:before {
            color: #ef4444;
            font-size: 12px;
          }
          .slick-dots li.slick-active button:before {
            color: #ef4444;
          }
          .slick-slide > div {
            height: 100%;
          }
          .slick-slide {
            height: auto;
          }
          .slick-list {
            margin: 0 -12px;
          }
          .slick-track {
            display: flex;
            align-items: stretch;
          }
          .slick-slide > div {
            height: 100%;
            display: flex;
          }
        `}</style>
      </div>
    </section>
  );
};

export default Testimonials;
