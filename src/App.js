import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import CreateFlow from "./pages/CreateFlow";
import NotFound from "./pages/NotFound";


import HomeRedirect from "./components/auth/HomeRedirect";
import { AuthProvider } from "./components/context/AuthContext";
import CreateFlow from "./pages/CreateFlow";



const clientID =
  "417226731712-f3l82nhqgsmcla4hu7ooamsk63cqi5vt.apps.googleusercontent.com";

const App = () => {
  const location = useLocation();

  return (
    <GoogleOAuthProvider clientId={clientID}>
      <AuthProvider>
       

        <AnimatePresence exitBeforeEnter>
          <Routes location={location} key={location.pathname}>
            <Route element={<HomeRedirect />}>
              <Route path="/" element={<Home />} />
              <Route path="/crear" element={<CreateFlow />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

  
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
