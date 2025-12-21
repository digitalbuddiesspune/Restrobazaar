import Categories from '../components/Categories'
import CustomPrinting from '../components/CustomPrinting'
import Home from '../components/Home'
import IndustriesWeServe from '../components/IndustriesWeServe'
import QualitySection from '../components/QualitySection'
import Testimonials from '../components/Testimonials'


const HomePage = () => {
  return (
    <div className="w-full">
        <Home/>
        <Categories/>
        <QualitySection/>
        <IndustriesWeServe/>
        <CustomPrinting/>
        <Testimonials/>
    </div>
  )
}

export default HomePage