const PrivacyPolicy = () => {
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
                Privacy <span className="text-red-600">Policy</span>
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
                    RestroBazaar respects your privacy. Any personal information shared on our website is used only for order processing, customer support, and service improvement. We do not sell or misuse customer data.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Information We Collect
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    We collect information that you provide directly to us, such as when you create an account, place an order, or contact us for support. This may include your name, email address, phone number, shipping address, payment information, and any other information you choose to provide.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    How We Use Your Information
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    We use the information we collect to process your orders, communicate with you about your orders and our services, respond to your inquiries, improve our website and services, send you marketing communications (with your consent), and comply with legal obligations.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Information Sharing
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website, conducting our business, or serving our users, as long as those parties agree to keep this information confidential.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Data Security
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Your Rights
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6 font-body">
                    You have the right to access, update, or delete your personal information at any time. You can also opt-out of receiving marketing communications from us by following the unsubscribe instructions in our emails or by contacting us directly.
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    Contact Us
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-body">
                    If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default PrivacyPolicy;


