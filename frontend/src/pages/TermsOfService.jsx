const TermsOfService = () => {
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
                Legal Information
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
                Terms & <span className="text-red-600">Conditions</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>
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
                    All products sold on RestroBazaar are intended for commercial use. Prices, availability, and delivery timelines may change without prior notice. Orders once confirmed cannot be canceled unless stated otherwise.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Please read these Terms of Service carefully before using RestroBazaar's website and services.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Acceptance of Terms
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Product Information
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    All products displayed on RestroBazaar are intended for commercial use by restaurants, cloud kitchens, cafés, bakeries, and food businesses. Product images and descriptions are for illustrative purposes and may vary slightly from the actual product.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Pricing and Availability
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Prices, product availability, and delivery timelines are subject to change without prior notice. We reserve the right to modify or discontinue any product or service at any time. All prices are displayed in the currency specified on the website.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Order Cancellation
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Once an order is confirmed, it cannot be canceled unless stated otherwise in the product description or as per our cancellation policy. Please review your order carefully before confirming your purchase.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Limitation of Liability
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    RestroBazaar shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Contact Us
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-body">
                    If you have any questions about these Terms of Service, please contact us at{" "}
                    <a href="mailto:support@restrobazaar.com" className="text-red-600 hover:text-red-700 underline">
                      support@restrobazaar.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;


