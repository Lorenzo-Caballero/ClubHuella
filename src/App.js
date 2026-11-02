import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import CreateFlow from "./pages/CreateFlow";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";
import AdminAccess from "./pages/admin/AdminAccess";
import { trackPixelEvent } from "./lib/metaPixel";

const App = () => {
  const location = useLocation();
  const pageLocation = `${location.pathname}${location.search}`;

  useEffect(() => {
    // The base Pixel is initialized once in index.html. In an SPA, send a
    // PageView whenever the visible route changes after that initialization.
    if (!location.pathname.startsWith('/admin')) {
      trackPixelEvent('PageView');
    }
  }, [pageLocation, location.pathname]);

  return (
    <AnimatePresence exitBeforeEnter>
      <Routes location={location} key={`${location.pathname}${location.search}`}>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CreateFlow />} />
        <Route path="/gracias" element={<Gracias />} />
        <Route path="/admin" element={<Navigate to="/admin-pedidos" replace />} />
        <Route path="/admin-pedidos" element={<AdminAccess />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
