import React from "react";

const features = [
  {
    title: "Cost-Effective Single-Use Solutions",
    description: "Premium quality at competitive pricing.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.57.393A9.065 9.065 0 0121 18.5M5 14.5l-1.57.393A9.065 9.065 0 003 18.5m15.75-4.196v5.714a2.25 2.25 0 01-.659 1.591L15 22.5m-10.5 0l-1.57-.393A9.065 9.065 0 013 18.5m15.75-4.196V18.5"
        />
      </svg>
    ),
    accentColor: "green",
  },
  {
    title: "Eco-Conscious Packaging",
    description: "Sustainable, biodegradable choices.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
    ),
    accentColor: "emerald",
  },
  {
    title: "Professional Brand Presentation",
    description: "Clean, premium visual appeal.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.75 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
    accentColor: "purple",
  },
  {
    title: "Durable, Leak-Proof & Reliable",
    description: "Strong, spill-resistant build.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    accentColor: "orange",
  },
];

const accentColors = {
  green: {
    icon: "bg-green-600 text-white",
    border: "border-green-200 group-hover:border-green-300",
    accent: "group-hover:shadow-green-200",
  },
  emerald: {
    icon: "bg-emerald-600 text-white",
    border: "border-emerald-200 group-hover:border-emerald-300",
    accent: "group-hover:shadow-emerald-200",
  },
  purple: {
    icon: "bg-purple-600 text-white",
    border: "border-purple-200 group-hover:border-purple-300",
    accent: "group-hover:shadow-purple-200",
  },
  orange: {
    icon: "bg-orange-600 text-white",
    border: "border-orange-200 group-hover:border-orange-300",
    accent: "group-hover:shadow-orange-200",
  },
};

const QualitySection = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 rounded-full mb-4 font-heading">
            Quality Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-heading">
            Why Choose <span className="text-red-600">RestroBazaar</span>{" "}
            Packaging
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-body">
            High-quality, hygienic, and reliable food packaging solutions
            trusted by food businesses across all scales.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {features.map((item, index) => {
            const colors = accentColors[item.accentColor];

            return (
              <article
                key={index}
                className={`group relative bg-white border-2 ${colors.border} rounded-xl p-3 sm:p-5 md:p-6 transition-all duration-300 hover:shadow-lg ${colors.accent} h-full flex flex-col`}
              >
                {/* Icon */}
                <div className="mb-3 sm:mb-4 flex justify-center">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${colors.icon} rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105`}
                  >
                    {item.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm  text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom accent bar */}
                <div
                  className={`mt-4 h-0.5 w-0 transition-all duration-300 group-hover:w-full ${
                    item.accentColor === "green"
                      ? "bg-green-600"
                      : item.accentColor === "emerald"
                      ? "bg-emerald-600"
                      : item.accentColor === "purple"
                      ? "bg-purple-600"
                      : "bg-orange-600"
                  }`}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QualitySection;
