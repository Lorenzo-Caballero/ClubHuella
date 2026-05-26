import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import "./overview.css";
import luciana from "./Luciana1.jpg";

const Overview = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollPos, setLastScrollPos] = useState(window.pageYOffset);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

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
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="overview-container w-full min-h-screen flex items-center bg-gradient-to-b from-[#fffdf9] via-[#fef9f3] to-[#f8f3ed] px-4 py-10 md:py-20 text-[#2c3e50]"
    >
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-center gap-10 w-full">
        
        {/* TEXTO IZQUIERDA */}
        <div className="w-full lg:w-2/3 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-serif text-[#2c2c2c] mb-3 leading-tight">
            ¿Quién soy?
          </h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-[#2c2c2c] mb-4 tracking-tight font-serif">
            Luciana Avalos
          </h3>
          <h4 className="text-xl md:text-2xl text-[#5c504b] italic mb-6 font-light font-serif">
            Tatuadora Línea Fina y <span className="italic">MicroRealismo</span>
          </h4>
          <p className="text-base md:text-lg text-[#5c504b] leading-7 font-normal max-w-2xl mx-auto lg:mx-0">
            Soy <strong>Luciana Avalos</strong>, tatuadora profesional con <strong>4 años de experiencia</strong>.
            Mi pasión es transformar ideas en tatuajes delicados que perduren en el tiempo.
            <br /><br />
            A lo largo de este recorrido aprendí que tatuar es mucho más que técnica: es empatía, dedicación
            y conexión con cada persona que decide confiar en mi trabajo.
            <br /><br />
            Quiero ayudarte a superar tus inseguridades, compartirte lo que me hubiera gustado saber al comenzar
            y acompañarte en tu propio proceso artístico con seguridad y estilo propio.
          </p>

      
        </div>

        {/* IMAGEN DERECHA */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-full lg:w-1/3 flex justify-center"
        >
          <img
            src={luciana}
            alt="Luciana Avalos"
            className="rounded-full shadow-lg w-80 h-80 object-cover border-[6px] border-[#fef3e7] transition-transform duration-300"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
