import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from './App'
import About from './pages/About'
import Contact from './pages/Contact'

import Categories from './components/Categories'
import CustomPrinting from './components/CustomPrinting'
import HomePage from './pages/HomePage'
import SignIn from './pages/SignIn'



const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<App/>}>
            <Route index element={<HomePage/>} />
            <Route path='categories' element={<Categories/>} />
            <Route path='custom-printing' element={<CustomPrinting/>} />
           
            <Route path='about' element={<About/>} />
            <Route path='contact' element={<Contact/>} />
            <Route path='signin' element={<SignIn/>} />
        </Route>
    )
)
export default router;