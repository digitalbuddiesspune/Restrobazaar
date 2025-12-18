import React from 'react'
import Home from './Home'
import Categories from './Categories'
import WhyChooseUs from './WhyChooseUs'
import WhyChooseUs1 from './WhyChooseUs1'
import PackagingCategories from './PackagingCategories'
import CustomPrinting from './CustomPrinting'
import IndustriesWeServe from '../components/IndustriesWeServe'


const HomePage = () => {
  return (
    <div>
        <Home/>
        <Categories/>
        <IndustriesWeServe/>
        {/* <WhyChooseUs/> */}
        <WhyChooseUs1/>
        <PackagingCategories/>
        <CustomPrinting/>
    </div>
  )
}

export default HomePage