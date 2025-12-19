const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-800 mb-6">
          Terms of Service
        </h1>
        <div className="max-w-4xl prose prose-lg">
          <p className="text-base sm:text-lg font-body text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-4 text-base font-body text-gray-600">
            <p>
              Please read these Terms of Service carefully before using RestroBazaar's website and services.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Acceptance of Terms
            </h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Use License
            </h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on RestroBazaar's website for personal, non-commercial transitory viewing only.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Contact Us
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@restrobazaar.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;


