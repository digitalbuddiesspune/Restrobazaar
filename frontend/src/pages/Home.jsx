import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const AUTOPLAY_MS = 5000; // 5 seconds

const studyAbroadLarge01 =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764092033/StudyAbroad_b7xuen.svg";
const schoolCollegeLarge =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764092032/School_College_lme1u3.svg";
const ImmigrationLarge =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764092034/Immigration_Visa_Service_dy8lly.svg";

const Complete_Your_Education_Large =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1763968234/OnlineEduFinal_juripw.svg";
const attestationApostileLarge =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764337543/Attestation_Final_ldq7gv.svg";
const LegacyLarge =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764842033/LAGECY_whqymj.svg";

// --------------------------------------------------------------------------------------------------------------
const studyAbroad =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764256883/studyAbroad_ayku52.png";
const schoolCollege =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764256915/School_gvifp9.svg";
const immigrationAndVisa =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764256896/Immigration_bciqd9.svg";
const attestationApostile =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764321263/Attastation_Mobile_View_xxxeb0.svg";
const career =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1761898214/Blue_And_White_Creative_Study_Abroad_In_Korea_Instagram_Post_1920_x_600_px_1080_x_1080_px_2_azrwlc.png";
const secondBanner =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1763967905/Education_p3i0ru.svg";
const newFirst =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764012447/Gemini_Generated_Image_f3wp8bf3wp8bf3wp_trikfk.png";
const first =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764310937/Legacy_jjwjkc.png";
const second =
  "https://res.cloudinary.com/dtaitsw4r/image/upload/v1764832199/Cources_Banner_Mobile_usgigp.svg";
const MobileScreenBanners = [
  // first,
  second,
  secondBanner,
  schoolCollege,
  studyAbroad,
  immigrationAndVisa,
  attestationApostile,
];

const LargeScreenBanners = [
  LegacyLarge,
  Complete_Your_Education_Large,
  schoolCollegeLarge,
  studyAbroadLarge01,
  ImmigrationLarge,
  attestationApostileLarge,
];

// Category cards data (images hosted on Unsplash)


export default function Home() {
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef(null);
  const [isLarge, setIsLarge] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches
  );

  const touchActive = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const SWIPE_THRESHOLD = 40;

  const banners = useMemo(
    () => (isLarge ? LargeScreenBanners : MobileScreenBanners),
    [isLarge]
  );

  // Detect screen size changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e) => setIsLarge(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Clear existing timer
  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Schedule next slide
  const scheduleNext = useCallback(() => {
    clearTimer();
    if (isHovering || touchActive.current) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, AUTOPLAY_MS);
  }, [banners.length, isHovering]);

  // Controls
  const nextBanner = useCallback(() => {
    clearTimer();
    setCurrent((prev) => (prev + 1) % banners.length);
    scheduleNext();
  }, [banners.length, scheduleNext]);

  const prevBanner = useCallback(() => {
    clearTimer();
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
    scheduleNext();
  }, [banners.length, scheduleNext]);

  const gotoIndex = (i) => {
    clearTimer();
    setCurrent(i);
    scheduleNext();
  };

  // Autoplay start + cleanup
  useEffect(() => {
    scheduleNext();
    return () => clearTimer();
  }, [current, scheduleNext]);

  // Swipe gestures
  const onTouchStart = (e) => {
    if (!e.touches?.length) return;
    touchActive.current = true;
    clearTimer();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (!e.touches?.length) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      dx < 0 ? nextBanner() : prevBanner();
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const onTouchEnd = () => {
    touchActive.current = false;
    scheduleNext();
  };

  return (
    <>
      <section
        className="relative w-full overflow-hidden h-[55vh] lg:h-[70vh]"
        onMouseEnter={() => {
          setIsHovering(true);
          clearTimer();
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          scheduleNext();
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides */}
        <div className="absolute inset-0 border-b border-b-[#D4D4D4]">
          {banners.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Banner ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover shrink-0 grow-0 basis-full transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={prevBanner}
          aria-label="Previous"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#2B2B2B]/30 hover:bg-[#2B2B2B]/50 text-white items-center justify-center"
        >
          ❮
        </button>
        <button
          onClick={nextBanner}
          aria-label="Next"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#2B2B2B]/30 hover:bg-[#2B2B2B]/50 text-white items-center justify-center"
        >
          ❯
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => gotoIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === current ? "bg-white" : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </section>

    
    </>
  );
}