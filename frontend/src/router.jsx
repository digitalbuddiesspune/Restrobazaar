import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from './App'
import About from './pages/About'
import Contact from './pages/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import RefundPolicy from './pages/RefundPolicy'
import ShippingPolicy from './pages/ShippingPolicy'

import Categories from './components/Categories'
import CustomPrinting from './components/CustomPrinting'
import HomePage from './pages/HomePage'
import SignIn from './pages/SignIn'
import CategoryDetail from './pages/CategoryDetail'
import AllProducts from './pages/AllProducts'



const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<App/>}>
            <Route index element={<HomePage/>} />
            <Route path='categories' element={<Categories/>} />
            <Route path='all-products' element={<AllProducts/>} />
            <Route path='category/:categorySlug' element={<CategoryDetail/>} />
            <Route path='category/:categorySlug/:subcategorySlug' element={<CategoryDetail/>} />
            <Route path='custom-printing' element={<CustomPrinting/>} />
           
            <Route path='about' element={<About/>} />
            <Route path='contact' element={<Contact/>} />
            <Route path='signin' element={<SignIn/>} />
            <Route path='privacy-policy' element={<PrivacyPolicy/>} />
            <Route path='terms-of-service' element={<TermsOfService/>} />
            <Route path='refund-policy' element={<RefundPolicy/>} />
            <Route path='shipping-policy' element={<ShippingPolicy/>} />
        </Route>
    )
)
export default router;