import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const courseDays = [
  {
    title: "Día 1 – Teoría",
    content: `
      - Materiales
      - Bioseguridad
      - Agujas
      - Máquinas
      - Mobiliario
      - Historia del tatuaje
      - Estilos de tatuajes
      - Stencil / transfers
      - Apps de diseños
      - Biología de la piel
      - Cómo armar un setup
      - Técnicas básicas: líneas, relleno, sombras
    `,
  },
  {
    title: "Día 2 – Práctica",
    content: `
      - Repaso general de teoría
      - Armado de mesa (setup)
      - Crear un stencil
      - Colocar un stencil correctamente
      - Práctica en piel sintética: línea, relleno, sombra
      - Corrección alumno por alumno
      - Revisión de errores comunes
    `,
  },
  {
    title: "Día 3 – Acción",
    content: `
      - Armado del setup
      - Tatuaje en vivo hecho por la tatuadora
      - Tatuaje de los alumnos (opcional)
      - Corrección personalizada
      - Cómo cotizar un tatuaje
      - Trato con el cliente
      - Cuidados post-tatuaje
      - Fotografía y video para redes
      - Entrega de diplomas
    `,
  },
];

const CourseContent = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gradient-to-b from-[#fffdf9] via-[#fef9f3] to-[#f8f3ed] py-24 px-6 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#2c2c2c]">
          Contenido del Curso
        </h2>
        <p className="text-base md:text-lg text-[#5c504b] mt-4">
          Descubre el contenido detallado de nuestro curso presencial de tres días de duración.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {courseDays.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <button
              onClick={() => toggleDropdown(index)}
              className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-[#fef9f3] transition-colors duration-200"
            >
              <h3 className="text-lg md:text-xl font-semibold text-[#3b2f2a]">
                {day.title}
              </h3>
              <span
                className={`text-xl transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="px-6 pb-6 text-[#5c504b] text-sm md:text-base"
                >
                  <ul className="list-disc pl-5 space-y-1 whitespace-pre-line">
                    {day.content.trim().split("\n").map((line, i) => (
                      <li key={i}>{line.trim()}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CourseContent;
