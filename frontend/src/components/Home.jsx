import React from "react";
import HeroSlider from "./HeroSlider";

const Home = () => {
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
      
      {/* FAQ Section */}
     
    </div>
  );
};

export default Home;
