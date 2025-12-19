export default function PackagingCategories() {
  const categories = [
    "Containers & Takeaway Boxes",
    "Plates, Bowls, Glasses & Bottles",
    "Paper Bags, Wrappers & Food Papers",
    "Spoons, Straws, Gloves & Caps",
    "Bakery Packaging & Kulhads",
    "Tissues, Housekeeping & Hygiene Products",
    "Veg / Non-Veg Taps & Sachets",
    "Customized Printing Products for Branding",
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-8 md:py-12 lg:py-16">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 md:mb-12 lg:mb-16">
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full">
              Our Products
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mt-4 md:mt-6 leading-tight">
            Wide Range of{" "}
            <span className="text-red-600">Packaging Categories</span>
          </h1>
          <p className="mt-4 md:mt-6 text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto font-body">
            We offer an extensive selection of high-quality food packaging and
            restaurant essentials
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-10 md:mb-12 lg:mb-16">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center shrink-0 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-heading font-semibold text-gray-900 leading-relaxed">
                    {category}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div
          style={{
            backgroundImage: `url('https://res.cloudinary.com/debhhnzgh/image/upload/v1766044565/ecofriendly-food-packaging-items-paper-cups-plates-containers-catering-street-fast_baydeb.jpg')`,
          }}
          className="relative rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 border border-gray-200 shadow-lg text-center bg-no-repeat bg-cover bg-center overflow-hidden"
        >
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/50 rounded-2xl md:rounded-3xl"></div>

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white mb-3 md:mb-4">
              Whether you run a small cafe or a large food chain,{" "}
              <span className="text-red-600">we've got you covered.</span>
            </h2>
            <p className="text-white text-sm sm:text-base md:text-lg mt-4 md:mt-6 max-w-2xl mx-auto font-body">
              From daily essentials to custom branding solutions, find
              everything you need for your food business in one place.
            </p>
            <div className="mt-6 sm:mt-8 md:mt-10 flex justify-center gap-3 sm:gap-4 flex-wrap">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 font-body">
                Explore Categories
              </button>
              <button className="bg-white hover:bg-gray-50 border-2 border-white hover:border-red-600 text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 font-body">
                Get Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

