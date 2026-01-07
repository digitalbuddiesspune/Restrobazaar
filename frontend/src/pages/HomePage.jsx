import { useState } from 'react'
import Categories from '../components/Categories'
import CustomPrinting from '../components/CustomPrinting'
import Home from '../components/Home'
import IndustriesWeServe from '../components/IndustriesWeServe'
import QualitySection from '../components/QualitySection'
import Testimonials from '../components/Testimonials'
import CitySelectionPopup from '../components/CitySelectionPopup'
import FAQ from '../components/FAQ'


const HomePage = () => {
  const [selectedCity, setSelectedCity] = useState(null);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  return (
    <div className="w-full">
        <CitySelectionPopup onCitySelect={handleCitySelect} />
        <Home/>
        <Categories/>
        <QualitySection/>
        <IndustriesWeServe/>
        <CustomPrinting/>
        <Testimonials/>
        <FAQ />
    </div>
  )
}

export default HomePage