export default function CustomPrinting() {
  const features = [
    {
      title: "Custom logo printing",
      description:
        "Get your logo, brand colors, and messaging printed on containers, bags, cups, and more.",
    },
    {
      title: "Food-grade ink & materials",
      description:
        "All printing uses food-safe, non-toxic inks and materials that meet health standards.",
    },
    {
      title: "Ideal for takeaway, delivery & dine-in branding",
      description:
        "Perfect for building brand recognition across all customer touchpoints.",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 ">
          <div className="inline-block ">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full">
              Brand Packaging
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-heading font-bold text-gray-900 mt-4 md:mt-6 leading-tight">
            Custom Printing &{" "}
            <span className="text-red-600">Brand Packaging</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-600 font-semibold leading-relaxed font-body">
            Want your brand on every order?
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8 mb-10 md:mb-12 lg:mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center mb-6 transition-colors duration-300">
                <svg
                  className="w-7 h-7 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-body">
                {feature.description}
              </p>
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
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-100 mb-4 md:mb-6">
              Stand out and build brand recall with{" "}
              <span className="text-red-500">professional packaging.</span>
            </h2>
            <p className="text-white text-sm sm:text-base md:text-lg mt-4 md:mt-6 max-w-2xl mx-auto font-body">
              Transform your packaging into a powerful marketing tool that
              reinforces your brand identity with every order.
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
