import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/solid";
import { motion, AnimatePresence } from "framer-motion";
import HambergurMenu from "../assets/HambergurMenu.svg";
import Logo from "../assets/Nuvio.png";
import GoogleAuthModal from "./GoogleAuthModal"; // 👈 importar modal

const MainNavigation = () => {
  const [showNav, setShowNav] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false); // 👈 controlar modal login

  const calculateCartQuantity = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  useEffect(() => {
    setCartQuantity(calculateCartQuantity());
    const handleStorageChange = () => setCartQuantity(calculateCartQuantity());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navHandler = () => setShowNav(!showNav);

  return (
    <div className="w-full">
      {/* Navbar fijo */}
      <div className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#f5e7ff] to-[#faf3ff]  shadow-[0_0_20px_#dea7ff]">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 h-[70px]">
          {/* Logo */}
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
            className="flex items-center"
          >
            <NavLink to="/">
              <img
                src={Logo}
                alt="Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
              />
            </NavLink>
          </motion.div>

          {/* Menú Desktop */}
          <ul className="hidden md:flex items-center gap-6 text-[#c35fff] font-semibold text-base lg:text-lg">
            <li>
              <NavLink to="/" className="hover:text-[#dea7ff] transition">
                Inicio
              </NavLink>
            </li>
            <li>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-lg bg-[#c35fff] text-white hover:bg-[#a546e0] transition"
              >
                Iniciar sesión
              </button>
            </li>
          </ul>

          {/* Menú hamburguesa móvil */}
          <div className="md:hidden flex items-center">
            <button onClick={navHandler} className="focus:outline-none">
              {showNav ? (
                <XIcon className="w-6 h-6 text-gray-700" />
              ) : (
                <img src={HambergurMenu} alt="Menu" className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {showNav && (
        <motion.ul
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden fixed top-[70px] left-0 w-full bg-white shadow-md z-40 py-4 px-6"
        >
          <li className="border-b py-2">
            <NavLink
              to="/"
              onClick={navHandler}
              className="block text-gray-700 font-semibold"
            >
              Inicio
            </NavLink>
          </li>
          <li className="border-b py-2">
            <button
              onClick={() => {
                setShowLoginModal(true);
                navHandler();
              }}
              className="w-full text-left block text-gray-700 font-semibold"
            >
              Iniciar sesión
            </button>
          </li>
        </motion.ul>
      )}

      {/* Modal de Login */}
      <AnimatePresence>
        {showLoginModal && (
          <GoogleAuthModal onClose={() => setShowLoginModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainNavigation;
