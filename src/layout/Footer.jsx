import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-b from-violet-400 via-purple-500 to-indigo-500 text-white overflow-hidden">
      {/* Línea curva decorativa en el costado izquierdo */}
   

      {/* Contenido del footer */}
      <div className="relative z-20 flex flex-col md:flex-row justify-center items-center text-center h-24 px-6">
        <h4 className="text-sm md:text-base">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-semibold">Nuvio Software</span>
        </h4>
        <h4 className="text-sm md:text-base md:ml-4 mt-2 md:mt-0 text-white/90">
          Todos los derechos reservados.
        </h4>
      </div>
    </footer>
  );
};

export default Footer;
