import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Restaurant Owner",
      location: "Mumbai, Maharashtra",
      image:
        "https://ui-avatars.com/api/?name=Rajesh+Kumar&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "RestroBazaar has been a game-changer for my restaurant. The quality of products is exceptional and delivery is always on time. Highly recommended!",
    },
    {
      name: "Priya Sharma",
      role: "Catering Manager",
      location: "Delhi, NCR",
      image:
        "https://ui-avatars.com/api/?name=Priya+Sharma&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "The variety of products available is amazing. From containers to custom printing, everything we need is in one place with top-notch customer service!",
    },
    {
      name: "Amit Patel",
      role: "Cafe Owner",
      location: "Ahmedabad, Gujarat",
      image:
        "https://ui-avatars.com/api/?name=Amit+Patel&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "Best supplier we've worked with! The prices are competitive and quality never disappoints. Our customers absolutely love the eco-friendly packaging options.",
    },
    {
      name: "Kavita Reddy",
      role: "Hotel Manager",
      location: "Bangalore, Karnataka",
      image:
        "https://ui-avatars.com/api/?name=Kavita+Reddy&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "RestroBazaar understands the needs of the hospitality industry perfectly. Their products are reliable and the bulk ordering process is completely seamless.",
    },
    {
      name: "Vikram Singh",
      role: "Food Truck Owner",
      location: "Pune, Maharashtra",
      image:
        "https://ui-avatars.com/api/?name=Vikram+Singh&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "As a food truck owner, I need quality supplies at affordable prices. RestroBazaar delivers exactly that and the custom printing feature is a great bonus!",
    },
    {
      name: "Anjali Desai",
      role: "Event Caterer",
      location: "Surat, Gujarat",
      image:
        "https://ui-avatars.com/api/?name=Anjali+Desai&background=ef4444&color=fff&size=128",
      rating: 5,
      text: "The packaging solutions are perfect for our events with professional appearance and great quality. RestroBazaar has become our trusted go-to supplier!",
    },
  ];

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

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const settingsMobile = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
   
  };

  return (
    <section className="bg-gray-50 py-12 md:py-16 lg:py-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold mb-2">
            What Our Customers Say
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-gray-900 mb-4">
            Customer Testimonials
          </h2>
          <p className="text-sm sm:text-base md:text-lg font-body text-gray-600 max-w-2xl mx-auto">
            Hear from restaurant owners and catering professionals who trust
            RestroBazaar for their supply needs.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative px-4 md:px-8">
          <Slider {...(window.innerWidth < 768 ? settingsMobile : settings)}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="px-3">
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
                      <h4 className="text-base font-heading font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm font-body text-gray-600">
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
