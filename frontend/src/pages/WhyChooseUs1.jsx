export default function WhyChooseUs1() {
  const highlights = [
    "Wide range of food packaging categories",
    "Bulk & wholesale pricing",
    "Custom printing & branding support",
    "Food-grade & quality assured products",
    "Fast delivery across Maharashtra & Ahmedabad",
    "Dedicated support for restaurants & cloud kitchens",
  ];

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
      title: "Bulk Orders Made Easy",
      description: "Competitive B2B pricing, flexible quantities, GST billing, and reliable stock availability — ideal for growing food businesses.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      title: "Custom Printing & Branding",
      description: "Build brand recall with logo-printed containers, bags, cups, and takeaway packaging using food-grade materials.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      title: "Quality & Food Safety",
      description: "All products are food-grade, hygienic, durable, and designed to maintain food quality during storage and delivery.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      title: "Strong Local Presence",
      description: "Serving top cities across Maharashtra and Ahmedabad with faster delivery and dependable logistics support.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

return (
    <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            {/* Heading Section */}
            <div className="text-center max-w-4xl mx-auto mb-20">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50 px-5 py-2 rounded-full mb-6 shadow-sm">
                    <span className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" />
                    <span className="text-red-600 font-semibold text-sm tracking-wide uppercase">Why Choose Us</span>
                </div>
                
                <h2 className="text-5xl sm:text-6xl lg:text-5xl font-heading font-semibold text-gray-900 leading-tight mb-6">
                    Why Choose{" "}
                    <span className="relative inline-block">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                            RestroBazaar
                        </span>
                        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-full" />
                    </span>
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                    Your trusted B2B packaging partner for restaurants, cloud kitchens,
                    cafés, bakeries, and food businesses.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start mb-20">
                {/* Left Content - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Glass Card with Content */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl" />
                            <p className="text-lg text-gray-700 leading-relaxed relative z-10">
                                At <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">RestroBazaar</span>,
                                we understand the operational needs of food businesses. From
                                containers and takeaway boxes to custom-printed packaging, we
                                provide everything you need under one roof — reliably, affordably,
                                and at scale.
                            </p>
                        </div>
                    </div>

                    {/* Checkmark List */}
                    <div className="space-y-4">
                        {highlights.map((item, index) => (
                            <div 
                                key={index} 
                                className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/60 hover:backdrop-blur-xl transition-all duration-300 hover:-translate-x-2 border border-transparent hover:border-gray-200/50"
                            >
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
                                    <div className="relative bg-gradient-to-br from-red-600 to-orange-500 text-white w-7 h-7 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-gray-800 font-medium text-base leading-relaxed pt-0.5">
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Cards - Takes 3 columns */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="group relative"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Glow Effect */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`} />
                            
                            {/* Card */}
                            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl transition-all duration-500 hover:-translate-y-2 h-full">
                                {/* Icon Container */}
                                <div className={`inline-flex bg-gradient-to-br ${feature.gradient} w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-2xl shadow-gray-900/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <div className="text-white">
                                        {feature.icon}
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 transition-all duration-300">
                                    {feature.title}
                                </h3>
                                
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 transition-all duration-300">
                                    {feature.title}
                                </h3>
                                
                                <p className="text-gray-600 leading-relaxed font-body">
                                    {feature.description}
                                </p>
                                {/* Decorative Corner */}
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-3xl transition-opacity group-hover:opacity-10`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium CTA Section */}
            <div className="relative">
                {/* Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-[2.5rem] opacity-0 blur-2xl group-hover:opacity-20 transition-opacity" />
                
                {/* Main CTA Card */}
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2.5rem] p-12 sm:p-16 shadow-2xl overflow-hidden">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                    </div>
                    
                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full mb-6">
                            <svg className="w-4 h-4 text-orange-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-white/90 font-semibold text-sm tracking-wide">Premium B2B Partner</span>
                        </div>
                        
                        <h3 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                            Packaging That Powers<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-400">
                                Your Food Business
                            </span>
                        </h3>
                        
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                            From daily essentials to custom branding, RestroBazaar helps food
                            businesses operate smoothly and scale confidently.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button className="group relative bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_auto] hover:bg-right text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-500 shadow-2xl overflow-hidden">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Get Bulk Quote
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </button>
                            
                            <button className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:-translate-y-1 shadow-xl">
                                <span className="flex items-center justify-center gap-2">
                                    Talk to Expert
                                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style jsx>{`
            @keyframes shimmer {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
        `}</style>
    </section>
);
}