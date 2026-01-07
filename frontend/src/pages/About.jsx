const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Content Wrapper with Decorative Elements - Only in content area, not footer */}
      <div className="relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute top-1/2 right-20 w-96 h-96 bg-red-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-red-100 rounded-full opacity-45 blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-red-100 rounded-full opacity-30 blur-3xl"></div>
        </div>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 rounded-full mb-4 font-heading">
              Our Story
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
              About <span className="text-red-600">RestroBazaar</span>
            </h1>
          </div>

          {/* Main Content Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 border border-red-100 relative overflow-hidden">
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600 rounded-full -ml-24 -mb-24"></div>
              </div>

              <div className="relative z-10 prose prose-lg max-w-none">
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                  RestroBazaar is a one-stop destination for high-quality food packaging solutions designed specifically for restaurants, cloud kitchens, cafés, bakeries, and food brands. We understand that packaging is not just a container—it's a reflection of your brand, hygiene standards, and customer experience.
                </p>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-body">
                  Founded with the vision to simplify sourcing for the food industry, RestroBazaar brings together a wide range of reliable, cost-effective, and food-grade packaging materials under one digital platform. Whether you are a growing cloud kitchen or an established restaurant chain, we ensure you get the right packaging—on time, every time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Note Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl shadow-lg p-6 sm:p-8 lg:p-12 border border-red-100 relative overflow-hidden">
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600 rounded-full -ml-24 -mb-24"></div>
              </div>

              <div className="relative z-10">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-100 rounded-full mb-4 font-heading">
                    Founder's Note
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-6 text-gray-900">
                    A Message from Our Team
                  </h2>
                </div>

                <div className="space-y-6">
                  <p className="text-base sm:text-lg leading-relaxed text-gray-700 font-body">
                    At RestroBazaar, we started with a simple idea — to make food packaging sourcing easier and more reliable for food businesses. Having closely observed the challenges faced by restaurants and cloud kitchens, we built RestroBazaar as a platform that saves time, reduces hassle, and delivers consistent quality.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed text-gray-700 font-body">
                    Our focus remains on trust, transparency, and long-term partnerships with our customers.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-red-200">
                  <p className="text-lg sm:text-xl font-heading font-semibold text-gray-900">
                    — Team RestroBazaar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 rounded-full mb-4 font-heading">
              What We Stand For
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Our Core <span className="text-red-600">Values</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at RestroBazaar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Trust Card */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-red-100 hover:border-red-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Decorative gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4 text-center">Trust</h3>
                <p className="text-gray-600 font-body leading-relaxed text-center">
                  Building reliable partnerships through consistent quality and transparent communication.
                </p>
              </div>
            </div>

            {/* Transparency Card */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-red-100 hover:border-red-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Decorative gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4 text-center">Transparency</h3>
                <p className="text-gray-600 font-body leading-relaxed text-center">
                  Clear pricing, honest communication, and open dialogue with every customer.
                </p>
              </div>
            </div>

            {/* Partnership Card */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-red-100 hover:border-red-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Decorative gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:to-red-100/30 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4 text-center">Partnership</h3>
                <p className="text-gray-600 font-body leading-relaxed text-center">
                  Committed to long-term relationships that grow with your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}

export default About

