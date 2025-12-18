export default function WhyChooseUs() {
  const highlights = [
    "Wide range of food packaging categories",
    "Bulk & wholesale pricing",
    "Custom printing & branding support",
    "Food-grade & quality assured products",
    "Fast delivery across Maharashtra & Ahmedabad",
    "Dedicated support for restaurants & cloud kitchens",
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white text-[#111] py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full">
              Why Choose Us
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mt-6 leading-tight">
            Why Choose <span className="text-red-600">RestroBazaar</span>
          </h2>
          <p className="mt-6 text-gray-600 text-lg sm:text-xl leading-relaxed">
            Your trusted B2B packaging partner for restaurants, cloud kitchens,
            cafés, bakeries, and food businesses.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <p className="text-gray-700 text-lg leading-relaxed">
                At <span className="font-semibold text-gray-900">RestroBazaar</span>,
                we understand the operational needs of food businesses. From
                containers and takeaway boxes to custom-printed packaging, we
                provide everything you need under one roof — reliably, affordably,
                and at scale.
              </p>
            </div>

            <ul className="space-y-5">
              {highlights.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 group hover:bg-white p-4 rounded-xl transition-all duration-300"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                    <svg
                      className="text-red-600 w-5 h-5 group-hover:text-white transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <span className="text-gray-800 text-base sm:text-lg font-inter pt-1 group-hover:text-gray-900 transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center mb-4 transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                Bulk Orders Made Easy
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Competitive B2B pricing, flexible quantities, GST billing, and
                reliable stock availability — ideal for growing food businesses.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center mb-4 transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                Custom Printing & Branding
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Build brand recall with logo-printed containers, bags, cups, and
                takeaway packaging using food-grade materials.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center mb-4 transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                Quality & Food Safety
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                All products are food-grade, hygienic, durable, and designed to
                maintain food quality during storage and delivery.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 flex items-center justify-center mb-4 transition-colors duration-300">
                <svg
                  className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-3">
                Strong Local Presence
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Serving top cities across Maharashtra and Ahmedabad with faster
                delivery and dependable logistics support.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-red-50 to-gray-50 rounded-3xl p-12 border border-gray-200 shadow-lg">
            <h3 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900">
              Packaging That Powers Your Food Business
            </h3>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              From daily essentials to custom branding, RestroBazaar helps food
              businesses operate smoothly and scale confidently.
            </p>

            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                Get Bulk Quote
              </button>
              <button className="bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-red-600 text-gray-800 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1">
                Talk to Expert
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
