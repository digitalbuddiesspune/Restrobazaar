const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-800 mb-6">
          Refund Policy
        </h1>
        <div className="max-w-4xl prose prose-lg">
          <p className="text-base sm:text-lg font-body text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-4 text-base font-body text-gray-600">
            <p>
              At RestroBazaar, we want you to be completely satisfied with your purchase. This Refund Policy outlines our procedures for returns and refunds.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Return Period
            </h2>
            <p>
              You have 30 days from the date of delivery to return items for a full refund, provided they are in their original condition and packaging.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Refund Process
            </h2>
            <p>
              Once we receive and inspect your returned item, we will process your refund within 5-7 business days to your original payment method.
            </p>
            <h2 className="text-2xl font-heading font-semibold text-gray-800 mt-8 mb-4">
              Contact Us
            </h2>
            <p>
              For questions about returns or refunds, please contact us at support@restrobazaar.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;

