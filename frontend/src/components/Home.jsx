import React from "react";
import HeroSlider from "./HeroSlider";

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Slider */}
      <HeroSlider
        slides={[
           {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1766486888/Artboard_1_4x-100_ns3ryn.jpg",
            alt: "RestroBanner1",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1765977603/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_3_hlv0eh.svg",
            alt: "Restrobanner2",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1766658673/Brown_and_Beige_Scrapbook_Collage_India_Video_1920_x_600_px_6_tgp3ti.png",
            alt: "Restrobanner3",
          },
        
         
        ]}
        mobileSrc="https://res.cloudinary.com/debhhnzgh/image/upload/v1766925734/IMG_20251228_181115_c6o3io.png"
      />
    </div>
  );
};

export default Home;
