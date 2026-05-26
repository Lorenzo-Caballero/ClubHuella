import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Dia1 from "./Dia1.jpg";
import Dia2 from "./DIA2.jpg";
import Dia3 from "./imagen11.jpg";
import "./WhatYouLearn.css";

const cardData = [
  {
    title: "Día 1: Teoría y Fundamentos",
    description:
      "Todo lo que necesitás saber antes de tatuar: bioseguridad, máquinas, agujas, piel, armado de setup, estilos, historia, diseño y técnicas básicas de línea, relleno y sombra.",
    image: Dia1,
  },
  {
    title: "Día 2: Práctica Guiada",
    description:
      "Repasamos teoría, armás tu mesa, preparás el stencil y trabajás en piel sintética. Trazos supervisados, correcciones personalizadas y detección de errores comunes.",
    image: Dia2,
  },
  {
    title: "Día 3: Primer Tatuaje",
    description:
      "Tatuaje en vivo, tu primer tatuaje opcional, ajustes finales de técnica, cómo presupuestar, trato al cliente, cuidados post y creación de contenido para redes. Cierre con diploma.",
    image: Dia3,
  },
];

const WhatYouLearn = () => {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollPos, setLastScrollPos] = useState(window.pageYOffset);

  useEffect(() => {
    setIsVisible(inView);
  }, [inView]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      document.documentElement.classList.toggle(
        "scroll-up",
        currentScrollPos < lastScrollPos
      );
      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollPos]);

  return (
    <section
      ref={ref}
      className="bg-gradient-to-b from-[#fffdf9] via-[#fef9f3] to-[#f8f3ed] py-20 px-4 md:px-10"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2c2c2c]">
          ¿Qué aprenderás?
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {cardData.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col card-animate"
          >
            <div className="h-60 sm:h-64 w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-lg sm:text-xl font-semibold text-[#3b2f2a] mb-3">
                {item.title}
              </h3>
              <p className="text-[#5c504b] text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatYouLearn;
