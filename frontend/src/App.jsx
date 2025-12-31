import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isVendorAdminRoute = location.pathname.startsWith("/vendor");

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && !isVendorAdminRoute && <Header />}
      <Outlet />
      {!isAdminRoute && !isVendorAdminRoute && <Footer />}
    </>
  );
}

export default App;
