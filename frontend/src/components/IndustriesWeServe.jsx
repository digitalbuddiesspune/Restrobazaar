import { useEffect, useRef, useState } from 'react';

const industries = [
  {
    id: 1,
    name: 'Household Supply',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766063975/6dd07844-262c-48ab-849d-2260f03bf7b9.png',
  },
  {
    id: 2,
    name: 'Cloud Kitchen',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766062995/c3817246-47a0-4c48-a66e-120099356b54.png',
  },
  {
    id: 3,
    name: 'Bakery',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766060009/f4496f0e-58c1-4bda-9e4d-9561c01d9efc.png',
  },
  {
    id: 4,
    name: 'Catering Services',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766061568/5e8cc28a-e115-411f-96b5-76c55dabda45.png',
  },
  {
    id: 5,
    name: 'Sweet Shop',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766060148/32807156-ab45-4d55-a9e5-27520a626dfd.png',
  },
  {
    id: 6,
    name: 'Restaurant',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766063511/0deeafed-28b8-4c18-8951-3892b2f25e2a.png',
  },
  {
    id: 7,
    name: 'Food Corner',
    image: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766063692/84dc9dca-2913-4ec3-9818-a0850ae69de0.png',
  },
];

const IndustriesWeServe = () => {
  const carouselRef = useRef(null);
  const [itemsPerView, setItemsPerView] = useState(6);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(6);
      } else if (window.innerWidth >= 768) {
        setItemsPerView(4);
      } else if (window.innerWidth >= 640) {
        setItemsPerView(3);
      } else {
        setItemsPerView(2);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Continuous scrolling animation
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let animationId;
    let position = 0;
    const speed = 1; // Adjust speed (pixels per frame)

    const animate = () => {
      position -= speed;
      
      // Get the first item to calculate width
      const firstItem = carousel.querySelector('.carousel-item');
      if (!firstItem) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      const itemWidth = firstItem.offsetWidth;
      const totalWidth = itemWidth * industries.length;
      
      // Reset position when we've scrolled one full set of items
      if (Math.abs(position) >= totalWidth) {
        position = 0;
      }
      
      carousel.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [itemsPerView]);

  // Duplicate items multiple times for seamless infinite loop
  const duplicatedIndustries = [...industries, ...industries, ...industries];

  return (
    <section className="bg-white py-14 px-6">
      <div className="container mx-auto">
        {/* Title and Description */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-4">
            Industries we Serve
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-4xl mx-auto">
            RestroBazaar caters to a wide range of industries, which include brands from the{' '}
            <strong>Cloud Kitchen</strong>, <strong>Restaurants</strong>, <strong>Bakeries</strong>,{' '}
            <strong>Sweet Shops</strong>, <strong>Catering Services</strong>,{' '}
            <strong>Household Supply</strong>, <strong>Medical and Hygiene</strong>, and more. At{' '}
            <strong>RestroBazaar</strong>, we provide the best quality{' '}
            <strong>food packaging boxes and products</strong>.
          </p>
        </div>

        {/* Industries Carousel */}
        <div className="relative overflow-hidden">
          <div
            ref={carouselRef}
            className="flex"
            style={{
              willChange: 'transform',
            }}
          >
            {duplicatedIndustries.map((industry, index) => (
              <div
                key={`${industry.id}-${index}`}
                className="carousel-item flex-shrink-0 px-3"
                style={{
                  width: `${100 / itemsPerView}%`,
                  minWidth: `${100 / itemsPerView}%`,
                }}
              >
                <div className="flex flex-col items-center justify-center p-3">
                  {/* Industry Image */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 mb-3 flex items-center justify-center">
                    <img
                      src={industry.image}
                      alt={industry.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  {/* Industry Name */}
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 text-center">
                    {industry.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustriesWeServe;
