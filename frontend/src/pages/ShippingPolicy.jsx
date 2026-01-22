const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 w-full overflow-x-hidden">
      {/* Content Wrapper with Decorative Elements */}
      <div className="relative w-full min-h-screen">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none z-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute top-1/2 right-20 w-96 h-96 bg-red-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-red-100 rounded-full opacity-45 blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-red-100 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute bottom-20 left-0 w-80 h-80 bg-red-100 rounded-full opacity-35 blur-3xl"></div>
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-red-100 rounded-full opacity-30 blur-3xl"></div>
        </div>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <span className="inline-block px-3 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 rounded-full mb-4 font-heading">
                Legal Information
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
                Shipping <span className="text-red-600">Policy</span>
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
                
                <div className="relative z-10 space-y-4 text-base font-body text-gray-600">
                  <p>
                    RestroBazaar is committed to delivering your orders quickly and safely. This Shipping Policy outlines our delivery procedures and timelines.
                  </p>
                  <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
                    Shipping Methods
                  </h2>
                  <p>
                    We offer standard and express shipping options. Standard shipping typically takes 5-7 business days, while express shipping takes 2-3 business days.
                  </p>
                  <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
                    Shipping Costs
                  </h2>
                  <p>
                    Shipping costs are calculated at checkout based on your location and selected shipping method. Free shipping is available on orders over $100.
                  </p>
                  <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
                    Contact Us
                  </h2>
                  <p>
                    For shipping inquiries, please contact us at support@restrobazaar.com
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

export default ShippingPolicy;


