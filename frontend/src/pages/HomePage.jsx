import React from 'react'
import Home from '../components/Home'
import Categories from '../components/Categories'
import WhyChooseUs1 from '../components/WhyChooseUs1'
import PackagingCategories from '../components/PackagingCategories'
import CustomPrinting from '../components/CustomPrinting'
import IndustriesWeServe from '../components/IndustriesWeServe'


const HomePage = () => {
  return (
    <div className="w-full">
        <Home/>
        <Categories/>
        <IndustriesWeServe/>
        <WhyChooseUs1/>
        <PackagingCategories/>
        <CustomPrinting/>
    </div>
  )
}

export default HomePage