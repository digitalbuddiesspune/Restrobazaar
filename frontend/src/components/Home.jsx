import React from 'react';
import HeroSlider from './HeroSlider';

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Slider */}
      <HeroSlider
        slides={[
          {
            desktop: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1765977603/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_3_hlv0eh.svg',
            alt: 'TickNTrack - Premium Shoes & Watches Collection',
          },
          {
            desktop: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766408022/33772651-2581-4408-bd07-e03a3741673c.png',
            alt: 'TickNTrack - Premium Collection',
          },
          {
            desktop: 'https://res.cloudinary.com/debhhnzgh/image/upload/v1766126874/RestoBazaar-all_products_npuqtv.png',
            alt: 'Festive Offer - TickNTrack',
          },
        ]}
        mobileSrc="https://res.cloudinary.com/debhhnzgh/image/upload/v1765977544/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_1080_x_1080_px_1_zbleyf.svg"
      />
    </div>
  );
};

export default Home;

