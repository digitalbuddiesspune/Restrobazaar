const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-800 mb-6">
          Privacy Policy
        </h1>
        <div className="max-w-4xl prose prose-lg">
          <p className="text-base sm:text-lg font-body text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-4 text-base font-body text-gray-600">
            <p>
              At RestroBazaar, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us, such as when you create an account, place an order, or contact us for support.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              How We Use Your Information
            </h2>
            <p>
              We use the information we collect to process your orders, communicate with you, and improve our services.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@restrobazaar.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

