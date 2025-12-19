import Categories from '../components/Categories'
import CustomPrinting from '../components/CustomPrinting'
import Home from '../components/Home'
import IndustriesWeServe from '../components/IndustriesWeServe'
import QualitySection from '../components/QualitySection'


const HomePage = () => {
  return (
    <div className="w-full">
        <Home/>
        <Categories/>
        <QualitySection/>
        <IndustriesWeServe/>
        <CustomPrinting/>
    </div>
  )
}

export default HomePage