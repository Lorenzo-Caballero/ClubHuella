import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <section className="relative overflow-hidden min-h-screen bg-gradient-to-br  from-[#f5e7ff] to-[#faf3ff] py-24 px-4 sm:px-6 md:px-12 lg:px-20">
      {/* Fondo animado con burbujas */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-violet-200 opacity-30 blur-2xl"
            style={{
              width: `${80 + i * 25}px`,
              height: `${80 + i * 25}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 12 + i * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Contenido principal */}
      <div className="relative z-10 container mx-auto max-w-6xl text-center">
        {/* Título */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3a0151] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Sobre <span className="text-[#c35fff]">Nosotros</span>
        </motion.h2>

        {/* Descripción corta */}
        <motion.p
          className="text-[#6c1395] text-base sm:text-lg mb-12 leading-relaxed px-2 sm:px-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Somos un equipo apasionado por el diseño web y la tecnología. Ayudamos a empresas a mejorar su presencia
          digital con soluciones modernas, eficientes y personalizadas.
        </motion.p>

        {/* Secciones destacadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 text-left bg-white/30 backdrop-blur-lg p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_0_20px_#dea7ff] border border-white/50">
          {/* Misión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-[#5c1679] mb-3">🎯 Nuestra misión</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              Brindar soluciones digitales creativas y funcionales que permitan a nuestros clientes destacarse en un
              mundo cada vez más conectado.
            </p>
          </motion.div>

          {/* Visión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-[#5c1679] mb-3">🔭 Nuestra visión</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              Ser referentes en innovación digital, creando experiencias que generen impacto real y valor a largo
              plazo.
            </p>
          </motion.div>

          {/* Valores */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-[#5c1679] mb-3">💡 Nuestros valores</h3>
            <ul className="list-disc list-inside text-gray-700 text-base space-y-2">
              <li>Compromiso con la calidad</li>
              <li>Transparencia y comunicación</li>
              <li>Creatividad e innovación</li>
              <li>Trabajo en equipo</li>
            </ul>
          </motion.div>

          {/* Experiencia */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-[#5c1679] mb-3">📈 Nuestra experiencia</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              Con más de 5 años en el rubro, hemos trabajado con pymes, profesionales y emprendimientos de distintas
              industrias, llevando sus ideas al siguiente nivel digital.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
