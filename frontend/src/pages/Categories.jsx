const categoryCards = [
  {
    title: "Containers",
    image:
      "https://images.unsplash.com/photo-1616680214083-1b7f1b1dcf50?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Plates & Bowls",
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Bags (Paper)",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Spoon & Straw",
    image:
      "https://images.unsplash.com/photo-1533777324565-a040eb52fac1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Wrappers & Papers",
    image:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Glasses & Bottles",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "House Keeping",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Takeaway Boxes",
    image:
      "https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Gloves & Caps",
    image:
      "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Tissue Papers & Rolls",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Veg/Non-Veg Taps",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Bakery",
    image:
      "https://images.unsplash.com/photo-1483691278019-cb7253bee49f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Handi & Kulhads",
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Sachet",
    image:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Customize Printing Products",
    image:
      "https://images.unsplash.com/photo-1508873699372-7aeab60b44a7?auto=format&fit=crop&w=1200&q=80",
  },
];

const Categories = () => {
  return (
    <section className="bg-white">
      <div className="px-6 py-14">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
              Shop by Category
            </p>
            <h2 className="text-3xl font-heading font-bold text-gray-900">
              Explore our categories
            </h2>
            <p className="mt-2 text-base font-inter text-gray-600 max-w-2xl">
              Quick access to all supply categories for your restaurant and
              catering needs.
            </p>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categoryCards.map((card) => (
            <div
              key={card.title}
              className="group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xs md:text-sm lg:text-lg font-heading font-semibold text-gray-900">
                  {card.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
