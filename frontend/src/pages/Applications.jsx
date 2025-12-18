const applications = [
  {
    title: "Food Delivery & Takeaway",
    description: "Durable containers, bags, and cutlery for hot and cold food in transit.",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Catering & Events",
    description: "Bulk-friendly plates, bowls, and hygiene products for high-volume service.",
    image:
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cafeterias & Corporate Dining",
    description: "Daily-use disposables and tissue solutions for offices and institutions.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Bakeries & Cafés",
    description: "Boxes, liners, and cups to present pastries, desserts, and beverages.",
    image:
      "https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Beverage Shops",
    description: "Ripple cups, lids, and straws for coffee, tea, shakes, and cold brews.",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Street Food & Quick Service",
    description: "Compact packaging, sachets, and sturdy carry bags for fast turnover.",
    image:
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Housekeeping & Cleaning",
    description: "Gloves, caps, tissues, and cleaning rolls to maintain hygiene standards.",
    image:
      "https://images.unsplash.com/photo-1581579186983-74cd677b4506?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Grocery & Retail",
    description: "Paper bags, zip locks, and jars for organized and eco-conscious retailing.",
    image:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Custom Branding",
    description: "Printed bags and boxes to showcase your brand across every order.",
    image:
      "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1200&q=80",
  },
];

const Applications = () => {
  return (
    <section className="bg-white min-h-screen">
      <div className="px-6 py-14">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
              Product Applications
            </p>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Where our products excel
            </h1>
            <p className="mt-2 text-base font-inter text-gray-600 max-w-3xl">
              Explore the most common use-cases for our packaging, hygiene, and service products across food and retail businesses.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {applications.map((item) => (
            <div
              key={item.title}
              className="group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-heading font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm font-inter text-gray-700 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Applications;



