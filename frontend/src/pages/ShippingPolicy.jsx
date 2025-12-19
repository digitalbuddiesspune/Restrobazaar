const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-800 mb-6">
          Shipping Policy
        </h1>
        <div className="max-w-4xl prose prose-lg">
          <p className="text-base sm:text-lg font-body text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="space-y-4 text-base font-body text-gray-600">
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
  );
};

export default ShippingPolicy;

