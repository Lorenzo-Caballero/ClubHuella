import React from "react";
import { motion } from "framer-motion";
import heroImage from "../../assets/Nuvio.png";

const gradientAnimation = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 15,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Fondo base más oscuro para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#b23ef7] to-[#c35fff] -z-20" />

      {/* Fondo violeta circular animado */}
      <motion.div
        className="hidden md:block absolute w-[180vw] h-[180vw] -left-[90vw] -top-[90vw] rounded-full -z-10 backdrop-blur-2xl border border-white/10"
        style={{
          opacity: 0.15,
          backgroundSize: "300% 300%",
          backgroundImage:
            "linear-gradient(135deg, rgba(213, 123, 255, 0.3), rgba(175, 108, 230, 0.3), rgba(192, 132, 252, 0.3), rgba(213, 123, 255, 0.3))",
        }}
      />

      {/* Curva SVG para dividir los fondos con gradiente pastel */}
      <svg
        className="absolute top-0 right-0 h-full w-[35%] -z-10 hidden sm:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pastelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5e7ff" />
            <stop offset="100%" stopColor="#faf3ff" />
          </linearGradient>
        </defs>
        <path
          d="M 0 0 C 25 20, 25 80, 0 100 L 100 100 L 100 0 Z"
          fill="url(#pastelGradient)"
        />
      </svg>

      {/* Contenido */}
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20 flex flex-col-reverse sm:flex-col-reverse md:flex-row items-center justify-between gap-10 sm:gap-14 md:gap-16 z-10 py-12 sm:py-20">
        {/* Texto */}
        <motion.div
          className="text-center md:text-left max-w-2xl text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-base sm:text-lg font-medium mb-4 pt-8 text-[#3a0151]">
            ⚡️ <span className="text-white font-semibold">Nuvio</span> es tu socio digital
          </h3>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-[#3a0151]">Mostrá tu negocio</span>
            <br /> al mundo de forma profesional.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#3a0151] mb-8 leading-relaxed">
            Somos un equipo de desarrollo web en Argentina que te ayuda a dar el salto digital:
            páginas modernas, chatbot inteligente y redirección a WhatsApp en un solo paquete.
            Simple, accesible y potente.
          </p>

          <div className="flex gap-4 justify-center md:justify-start">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://wa.me/542232345678"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-[#dea7ff] to-[#eaceff] border border-[#dea7ff] text-[#6c1395] px-6 py-3 rounded-full shadow-[0_0_20px_#dea7ff] hover:shadow-xl transition"
            >
              🚀 Trabajá con Nosotros
            </motion.a>
          </div>
        </motion.div>

        {/* Imagen del logo visible solo en pantallas grandes */}
        <motion.div
          className="hidden lg:flex w-full md:w-1/2 justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img
            src={heroImage}
            alt="Chatbot de Nuvio"
            className="w-[70%] sm:w-[60%] md:w-full max-w-[300px] lg:max-w-xl pl-20 lg:scale-[2.00] drop-shadow-2xl transition-transform duration-500"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
