const RefundPolicy = () => {
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
                Returns & <span className="text-red-600">Refund Policy</span>
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
                    Returns are accepted only in case of damaged or incorrect products received. Customers must notify us within 48 hours of delivery with proper evidence.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    At RestroBazaar, we want you to be completely satisfied with your purchase. This Refund Policy outlines our procedures for returns and refunds.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Return Conditions
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Returns are accepted only in case of damaged or incorrect products received. All return requests must be made within 48 hours of delivery. Products must be in their original condition and packaging to be eligible for return.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Notification Requirements
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Customers must notify us within 48 hours of delivery with proper evidence, including photographs of the damaged or incorrect product, order number, and a detailed description of the issue. This helps us process your return request quickly and efficiently.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Refund Process
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Once we receive and inspect your returned item, we will process your refund within 5-7 business days to your original payment method. The refund amount will be credited to the same account or card used for the original purchase.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Return Shipping
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    For damaged or incorrect products, we will arrange for return shipping at no cost to you. Please do not ship the product back until you receive return authorization and instructions from our customer support team.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Non-Returnable Items
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    Custom-printed items, personalized products, and items that have been used or opened (unless damaged or incorrect) are generally not eligible for return. Please contact us if you have questions about specific products.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Contact Us
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-body">
                    For questions about returns or refunds, please contact us at{" "}
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

export default RefundPolicy;


