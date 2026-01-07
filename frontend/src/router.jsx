import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "./App";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsOfService from "./pages/TermsOfService";

import Categories from "./components/Categories";
import CustomPrinting from "./components/CustomPrinting";
import HomePage from "./pages/HomePage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import VendorLogin from "./pages/VendorLogin";
import VendorAdminDashboard from "./pages/VendorAdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Account from "./pages/Account";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import SearchResults from "./pages/SearchResults";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<HomePage />} />
      <Route path="categories" element={<Categories />} />
      <Route path="category/:categorySlug/:productId" element={<ProductDetail />} />
      <Route path="category/:slug" element={<Category />} />
      <Route path="product/:productId" element={<ProductDetail />} />
      <Route path="search" element={<SearchResults />} />
      <Route path="custom-printing" element={<CustomPrinting />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="privacy-policy" element={<PrivacyPolicy />} />
      <Route path="terms-of-service" element={<TermsOfService />} />
      <Route path="refund-policy" element={<RefundPolicy />} />
      <Route path="shipping-policy" element={<ShippingPolicy />} />
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="account" element={<Account />} />
      <Route path="cart" element={<Cart />} />
      <Route path="wishlist" element={<Wishlist />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="orders" element={<Orders />} />
      <Route path="super_admin/login" element={<SuperAdminLogin />} />
      <Route path="admin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="vendor/login" element={<VendorLogin />} />
      <Route path="vendor/dashboard" element={<VendorDashboard />} />
      <Route path="vendor/dashboard/old" element={<VendorAdminDashboard />} />
    </Route>
  )
);
export default router;
