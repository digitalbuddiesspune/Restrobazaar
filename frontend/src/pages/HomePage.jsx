import React from 'react'
import Home from './Home'
import Categories from './Categories'
import WhyChooseUs from './WhyChooseUs'
import WhyChooseUs1 from './WhyChooseUs1'
import PackagingCategories from './PackagingCategories'
import CustomPrinting from './CustomPrinting'


const HomePage = () => {
  return (
    <div>
        <Home/>
        <Categories/>
        {/* <WhyChooseUs/> */}
        <WhyChooseUs1/>
        <PackagingCategories/>
        <CustomPrinting/>
    </div>
  )
}

export default HomePage