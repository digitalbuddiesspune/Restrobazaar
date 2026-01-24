import React, { useState, useRef, useEffect } from "react";
import HeroSlider from "./HeroSlider";

const Home = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const scrollContainerRef = useRef(null);
  const timerRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  
  const mobileBanners = [
    {
      src: "https://res.cloudinary.com/debhhnzgh/image/upload/v1768310507/a0ce3721-87d7-40a5-a833-2bb76357c351.png",
      alt: "Mobile Banner 1"
    },
    {
      src: "https://res.cloudinary.com/debhhnzgh/image/upload/v1768376637/Artboard_1_copy4x-100_1_kk6o4k.jpg",
      alt: "Mobile Banner 2"
    }
    
  ];

  const scrollToBanner = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const bannerWidth = container.clientWidth;
    container.scrollTo({
      left: index * bannerWidth,
      behavior: 'smooth'
    });
  };

  const startAutoScroll = () => {
    if (mobileBanners.length <= 1) return;
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      if (!isUserScrollingRef.current) {
        setCurrentBanner((prev) => {
          const next = (prev + 1) % mobileBanners.length;
          scrollToBanner(next);
          return next;
        });
      }
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Handle scroll events to detect user interaction
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const bannerWidth = container.clientWidth;
      const currentIndex = Math.round(scrollLeft / bannerWidth);
      setCurrentBanner(currentIndex);
    };

    // Handle touch start to pause auto-scroll
    const handleTouchStart = () => {
      isUserScrollingRef.current = true;
      stopAutoScroll();
    };

    // Handle touch end to resume auto-scroll
    const handleTouchEnd = () => {
      setTimeout(() => {
        isUserScrollingRef.current = false;
        startAutoScroll();
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    // Start auto-scroll
    startAutoScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      stopAutoScroll();
    };
  }, []);

  return (
    <div className="w-full">
      {/* Hero Slider */}
      <HeroSlider
        slides={[
          {
            desktop:"https://res.cloudinary.com/debhhnzgh/image/upload/v1768073779/Artboard_1_copy_24x-100_1_eetqrq.jpg",
            alt:"RestroBanner4",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1767119600/Artboard_1_4x-100_2__11zon_ps5omm.jpg",
            alt: "RestroBanner1",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1765977603/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_3_hlv0eh.svg",
            alt: "Restrobanner2",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1767420951/Artboard_1_copy4x-100_glxul7.jpg",
            alt: "Restrobanner3",
          },
        ]}
        mobileSrc="https://res.cloudinary.com/debhhnzgh/image/upload/v1768310507/a0ce3721-87d7-40a5-a833-2bb76357c351.png"
      />
      
      {/* Mobile Banners - Horizontal Scroll with Auto-scroll */}
      <div className="md:hidden block w-full relative">
        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto scrollbar-hide"
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          <div className="flex gap-0" style={{ width: 'max-content' }}>
            {mobileBanners.map((banner, index) => (
              <div key={index} style={{ scrollSnapAlign: 'start' }} className="flex-shrink-0">
                <img 
                  src={banner.src} 
                  alt={banner.alt} 
                  className="w-screen h-auto object-cover block" 
                  loading="lazy" 
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Dots Indicator */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-10">
          {mobileBanners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCurrentBanner(index);
                scrollToBanner(index);
                stopAutoScroll();
                setTimeout(() => startAutoScroll(), 2000);
              }}
              className={`${index === currentBanner ? 'w-8 bg-white/90' : 'w-4 bg-white/50'} h-1.5 rounded-full transition-all`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {/* FAQ Section */}
     
    </div>
  );
};

export default Home;
