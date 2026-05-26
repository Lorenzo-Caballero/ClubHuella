import React from "react";
import { motion } from "framer-motion";
import { FiMonitor, FiMessageSquare, FiSend, FiCloud } from "react-icons/fi";

const servicios = [
  {
    icon: <FiMonitor size={32} />,
    titulo: "Diseño Web Profesional",
    descripcion: "Creamos sitios adaptados a tu marca y con diseño moderno, rápidos y optimizados.",
  },
  {
    icon: <FiMessageSquare size={32} />,
    titulo: "Chatbot con IA",
    descripcion: "Tu web tendrá un asistente inteligente que responde preguntas y redirige a ventas.",
  },
  {
    icon: <FiSend size={32} />,
    titulo: "Redirección a WhatsApp",
    descripcion: "Llevamos a tus visitantes directo a tu WhatsApp para convertir más.",
  },
  {
    icon: <FiCloud size={32} />,
    titulo: "Hosting Incluido",
    descripcion: "Tu sitio estará online desde el primer día, sin que tengas que preocuparte por nada.",
  },
];

const Servicios = () => {
  return (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 md:px-12 min-h-screen bg-gradient-to-br from-[#faf3ff] to-[#f5e7ff]">
      {/* Fondo animado de burbujas violetas */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-violet-300 opacity-20 blur-3xl"
            style={{
              width: `${90 + i * 30}px`,
              height: `${90 + i * 30}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 16 + i * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Título principal */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3a0151] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Nuestros <span className="text-[#c35fff]">Servicios</span>
        </motion.h2>
        <motion.p
          className="text-[#6c1395] text-base sm:text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Todo lo que necesitás para tener una presencia online sólida y profesional.
        </motion.p>
      </div>

      {/* Grilla responsiva: 2 columnas en celulares, 4 en escritorio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {servicios.map((servicio, index) => (
          <motion.div
            key={index}
            className="bg-white/30 backdrop-blur-lg p-5 sm:p-6 rounded-2xl border border-white/40 shadow-[0_0_20px_#dea7ff] hover:shadow-[0_0_30px_#a855f7] transition duration-300 text-left"
            whileHover={{ y: -6 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="text-[#6c1395] mb-3">{servicio.icon}</div>
            <h3 className="text-sm sm:text-base font-semibold text-[#5c1679] mb-2">
              {servicio.titulo}
            </h3>
            <p className="text-xs sm:text-sm text-[#3a0151] leading-relaxed">
              {servicio.descripcion}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Servicios;
