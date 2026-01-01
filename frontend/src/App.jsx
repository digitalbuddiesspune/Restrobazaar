import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Modal from "./components/Modal";
import SignInModal from "./pages/SignInModal";
import SignUpModal from "./pages/SignUpModal";
import SuperAdminLoginModal from "./pages/SuperAdminLoginModal";
import VendorLoginModal from "./pages/VendorLoginModal";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isVendorAdminRoute = location.pathname.startsWith("/vendor");

  // Modal state management
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [showVendorLogin, setShowVendorLogin] = useState(false);

  // Check URL for modal routes
  useEffect(() => {
    if (location.pathname === "/signin") {
      setShowSignIn(true);
      navigate("/", { replace: true });
    } else if (location.pathname === "/signup") {
      setShowSignUp(true);
      navigate("/", { replace: true });
    } else if (location.pathname === "/super_admin/login") {
      setShowSuperAdminLogin(true);
      navigate("/", { replace: true });
    } else if (location.pathname === "/vendor/login") {
      setShowVendorLogin(true);
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  const closeSignIn = () => {
    setShowSignIn(false);
  };

  const closeSignUp = () => {
    setShowSignUp(false);
  };

  const closeSuperAdminLogin = () => {
    setShowSuperAdminLogin(false);
  };

  const closeVendorLogin = () => {
    setShowVendorLogin(false);
  };

  // Expose modal functions to window for Header component
  useEffect(() => {
    window.openSignInModal = () => setShowSignIn(true);
    window.openSignUpModal = () => setShowSignUp(true);
    window.openSuperAdminLoginModal = () => setShowSuperAdminLogin(true);
    window.openVendorLoginModal = () => setShowVendorLogin(true);
    
    return () => {
      delete window.openSignInModal;
      delete window.openSignUpModal;
      delete window.openSuperAdminLoginModal;
      delete window.openVendorLoginModal;
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && !isVendorAdminRoute && <Header />}
      <Outlet />
      {!isAdminRoute && !isVendorAdminRoute && <Footer />}
      
      {/* Login Modals */}
      <Modal isOpen={showSignIn} onClose={closeSignIn}>
        <SignInModal onClose={closeSignIn} onSwitchToSignUp={() => { setShowSignIn(false); setShowSignUp(true); }} />
      </Modal>
      
      <Modal isOpen={showSignUp} onClose={closeSignUp}>
        <SignUpModal onClose={closeSignUp} onSwitchToSignIn={() => { setShowSignUp(false); setShowSignIn(true); }} />
      </Modal>
      
      <Modal isOpen={showSuperAdminLogin} onClose={closeSuperAdminLogin}>
        <SuperAdminLoginModal onClose={closeSuperAdminLogin} />
      </Modal>
      
      <Modal isOpen={showVendorLogin} onClose={closeVendorLogin}>
        <VendorLoginModal onClose={closeVendorLogin} />
      </Modal>
    </>
  );
}

export default App;
