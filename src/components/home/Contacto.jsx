import React from "react";
import { motion } from "framer-motion";

const Contacto = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br  from-[#faf3ff] to-[#f5e7ff] py-24 px-6 md:px-12 lg:px-20">
      {/* Fondo animado con burbujas suaves */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-violet-200 opacity-40 blur-2xl"
            style={{
              width: `${100 + i * 20}px`,
              height: `${100 + i * 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 10 + i * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Contenido principal */}
      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-[#3a0151] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Ponete en <span className="text-[#c35fff]">contacto</span> con nosotros
        </motion.h2>

        <motion.p
          className="text-[#6c1395] mb-12 text-base md:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          ¿Tenés una idea? ¿Querés impulsar tu negocio? Escribinos y nos pondremos en contacto lo antes posible.
        </motion.p>

        <motion.form
          className="grid grid-cols-1 gap-6 text-left bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-[0_0_20px_#dea7ff] border border-[#dea7ff]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label className="block text-[#5c1679] font-medium mb-2" htmlFor="nombre">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              required
              className="w-full px-4 py-3 border border-[#dea7ff] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[#5c1679] font-medium mb-2" htmlFor="email">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 border border-[#dea7ff] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[#5c1679] font-medium mb-2" htmlFor="mensaje">
              Mensaje
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows="5"
              required
              className="w-full px-4 py-3 border border-[#dea7ff] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-white"
            ></textarea>
          </div>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-gradient-to-r from-[#dea7ff] to-[#eaceff] border border-[#dea7ff] text-[#6c1395] px-6 py-3 rounded-full shadow-[0_0_20px_#dea7ff] hover:shadow-xl transition"
            >
              📬 Enviar mensaje
            </motion.button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default Contacto;
