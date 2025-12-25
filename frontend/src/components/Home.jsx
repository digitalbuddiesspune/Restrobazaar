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
            alt: "Festive Offer - TickNTrack",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1765977603/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_3_hlv0eh.svg",
            alt: "TickNTrack - Premium Shoes & Watches Collection",
          },
          {
            desktop:
              "https://res.cloudinary.com/debhhnzgh/image/upload/v1766658673/Brown_and_Beige_Scrapbook_Collage_India_Video_1920_x_600_px_6_tgp3ti.png",
            alt: "TickNTrack - Premium Collection",
          },
        
         
        ]}
        mobileSrc="https://res.cloudinary.com/debhhnzgh/image/upload/v1765977544/Red_And_Orange_Elegant_Collection_Launch_Banner_1920_x_600_mm_1080_x_1080_px_1_zbleyf.svg"
      />
    </div>
  );
};

export default Home;
