import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Roulette from "./pages/Roullette";
import TablaListaEspera from "./pages/TablaListaEspera";
import Sorteo from "./pages/Sorteo"
import HomeProduct from "./pages/HomeProduct";
const AppGames = () => {
  const location = useLocation();

  return (
    <AnimatePresence exitBeforeEnter>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeProduct />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppGames;
