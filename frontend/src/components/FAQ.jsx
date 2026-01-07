import React, { useState } from "react";

const faqData = [
  {
    question: "Do you supply packaging for bulk orders?",
    answer: "Yes, we support bulk and repeat orders for restaurants and cloud kitchens.",
  },
  {
    question: "Are your products food-safe?",
    answer: "Absolutely. All our products are food-grade and meet safety standards.",
  },
  {
    question: "Do you provide customized packaging?",
    answer: "Yes, we offer customized packaging solutions for branding requirements.",
  },
  {
    question: "Do you offer eco-friendly packaging options?",
    answer: "Yes, sustainable and eco-friendly packaging options are available.",
  },
  {
    question: "Who can buy from RestroBazaar?",
    answer: "Restaurants, cafés, cloud kitchens, bakeries, and food service businesses.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-50 py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 rounded-full mb-4 font-heading">
            FAQs
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold font-poppins text-gray-900">
            Frequently Asked <span className="text-red-600">Questions</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base md:text-lg font-body text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 md:px-8 md:py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm lg:text-base font-semibold text-gray-900 font-heading pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-red-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 py-4 md:px-8 md:pb-5">
                  <p className="text-sm md:text-base text-gray-600 font-body leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

