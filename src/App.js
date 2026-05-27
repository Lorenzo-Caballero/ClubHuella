import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "./store/actions/products-actions";
import { AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";

import MainNavigation from "./layout/MainNavigation";
import Footer from "./layout/Footer";

import HomeRedirect from "./components/auth/HomeRedirect";
import { AuthProvider } from "./components/context/AuthContext";
import CreateFlow from "./pages/CreateFlow";



const clientID =
  "417226731712-f3l82nhqgsmcla4hu7ooamsk63cqi5vt.apps.googleusercontent.com";

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdmin = useSelector((state) => state.auth.isAdmin);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  return (
    <GoogleOAuthProvider clientId={clientID}>
      <AuthProvider>
       

        <AnimatePresence exitBeforeEnter>
          <Routes location={location} key={location.pathname}>
            <Route element={<HomeRedirect />}>
              <Route path="/" element={<Home />} />
              <Route path="/FAQ" element={<FAQ />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

  
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
