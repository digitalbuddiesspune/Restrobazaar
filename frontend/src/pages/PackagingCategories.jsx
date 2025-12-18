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
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full">
              Our Products
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mt-6 leading-tight">
            Wide Range of{" "}
            <span className="text-red-600">Packaging Categories</span>
          </h1>
          <p className="mt-6 text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-body">
            We offer an extensive selection of high-quality food packaging and
            restaurant essentials
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
            backgroundImage: `url('https://res.cloudinary.com/debhhnzgh/image/upload/v1766041251/1467_oiy7co.jpg')`,
          }}
          className="
    bg-white
    rounded-3xl
    p-12
    border
    border-gray-200
    shadow-lg
    text-center
    bg-no-repeat
    bg-cover
    lg:bg-fill
  "
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-100 mb-4">
            Whether you run a small cafe or a large food chain,{" "}
            <span className="text-red-600">we've got you covered.</span>
          </h2>
          <p className="text-gray-100 text-base sm:text-lg mt-6 max-w-2xl mx-auto font-body">
            From daily essentials to custom branding solutions, find everything
            you need for your food business in one place.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 font-body">
              Explore Categories
            </button>
            <button className="bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-red-600 text-gray-800 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 font-body">
              Get Quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
