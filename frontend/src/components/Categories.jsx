import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useApiQueries';

export const categoryCards = [
  {
    title: "Containers",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png",
  },
  {
    title: "Plates & Bowls",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969490/35ea9123-90d9-408e-98c3-09dbbd553dfa.png",
  },
  {
    title: "Bags (Paper)",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969647/bb944066-f0bb-4b1d-91ae-2449d78fafce.png",
  },
  {
    title: "Spoon & Straw",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969936/9cb72c90-349a-4925-9043-d198c085f055.png",
  },
  {
    title: "Wrappers & Papers",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765970120/f53f7fcf-99a2-497a-9467-080ee54ae876.png",
  },
  {
    title: "Glasses & Bottles",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972166/770db29a-4788-425a-b128-7c8b0a127401.png",
  },
  {
    title: "House Keeping",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972358/4369232f-0a83-430e-ac92-4465abb9d1c7.png",
  },
  {
    title: "Takeaway Boxes",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972626/79aebae9-492c-4bf6-b270-ee8c15a2ad9d.png",
  },
  {
    title: "Gloves & Caps",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972744/e17c9bba-8cc6-4f2d-8b3d-b1e988b21855.png",
  },
  {
    title: "Tissue Papers & Rolls",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972776/95ccdc6f-d560-4256-8a4e-70d101a990fd.png",
  },
  {
    title: "Veg/Non-Veg Taps",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973873/d1d0ad8e-9b12-4528-94cd-a3f6aa4d6291.png",
  },
  {
    title: "Bakery",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973212/3b4ce4e3-8f26-4774-a5fd-d1f799997cc8.png",
  },
  {
    title: "Handi & Kulhads",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973695/5d210c26-e213-4328-9509-bd36ccddfc01.png",
  },
  {
    title: "Sachet",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973749/71f88642-1956-4bd6-97be-df4ccea0217d.png",
  },
  {
    title: "Customize Printing Products",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765974091/d7a83287-839b-4dc1-887f-8f37121c22d8.png",
  },
];

// Helper function to convert title to URL slug
export const titleToSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const Categories = () => {
  // Use TanStack Query to fetch categories with caching
  // Categories are cached for 30 minutes and won't refetch on every page visit
  const { data: categoriesResponse, isLoading: loading, error: categoriesError } = useCategories(
    {},
    {
      staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
      gcTime: 60 * 60 * 1000, // 1 hour - keep in cache for 1 hour
    }
  );

  // Process categories - filter active and sort by priority
  const categories = useMemo(() => {
    if (!categoriesResponse?.success || !categoriesResponse?.data) return [];
    return categoriesResponse.data
      .filter(cat => cat.isActive !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [categoriesResponse]);

  // Extract error message
  const error = categoriesError 
    ? (categoriesError.response?.data?.message || 'Error loading categories. Please try again later.')
    : null;

  return (
    <section className="bg-gray-50 py-8 md:py-12 lg:py-16">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-red-600 font-semibold mb-2">
              Shop by Category
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold font-poppins text-gray-900">
              Explore our categories
            </h2>
            <p className="mt-2 text-xs sm:text-base md:text-lg font-body text-gray-600 max-w-2xl">
              Quick access to all supply categories for your restaurant and
              catering needs.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading categories...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">No categories available</div>
          </div>
        ) : (
          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category._id || category.slug}
                to={`/category/${category.slug || titleToSlug(category.name)}`}
                className="group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={category.image || 'https://via.placeholder.com/300x200?text=Category'}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Category';
                    }}
                  />
                </div>
                <div className="p-2 md:p-2">
                  <h3 className="line-clamp-1 text-[10px] sm:text-sm font-heading font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
