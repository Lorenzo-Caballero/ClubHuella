import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import Luciana from "./Luciana1.jpg";

const CoursePriceInfo = () => {
  // Número de WhatsApp con mensaje
  const phoneNumber = "5492235453354";
  const message = "Hola Luciana! Te hablo desde tu página web! Quiero inscribirme al curso de tatuajes!";
  const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
  const scrollToPrice = () => {
    const priceSection = document.getElementById("lista-espera");
    if (priceSection) {
      priceSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="precio"
      className="bg-gradient-to-br from-white via-neutral-100 to-white py-16 px-4 sm:px-8 md:px-12 text-[#2c2c2c] font-serif"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto w-full max-w-4xl bg-white/90 backdrop-blur-md rounded-3xl shadow-xl px-6 sm:px-10 py-12"
      >
        {/* Imagen flotante */}
        <div className="absolute -top-12 left-6 sm:left-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md overflow-hidden">
          <img
            src={Luciana}
            alt="Tatuadora"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contenido principal */}
        <div className="pl-0 sm:pl-40">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-[#2c2c2c]">
            Valor del curso
          </h2>

          {/* Precios */}
          <div className="space-y-3 text-base sm:text-lg text-[#2c2c2c]">
            <p>
              <span className="font-bold">• Lista:</span>{" "}
              <span className="font-bold text-[#2c2c2c]">$260mil</span>{" "}
              <span className="ml-1 text-base font-normal">
                hasta en 3 sin interés (todas las tarjetas) pago virtual.
              </span>
            </p>
            <p>
              <span className="font-bold">• 20% off en efectivo/transferencia:</span>{" "}
              <span className="italic font-semibold text-[#2c2c2c]">$208mil.</span>
            </p>
          </div>

          {/* Condiciones */}
          <ul className="mt-6 space-y-3 text-sm sm:text-base text-[#3b2f2a]">
            <li>
              <FaCheckCircle className="inline mr-2 text-green-600" />
              <span className="italic">Pago con tarjeta</span>: se abona la{" "}
              <span className="font-bold">totalidad</span> para reservar.
            </li>
            <li>
              <FaCheckCircle className="inline mr-2 text-green-600" />
              <span className="italic">Pago en efectivo o por transferencia</span>: se abona el{" "}
              <span className="font-bold">50%</span> para reservar y el restante{" "}
              <span className="font-bold">antes</span> de iniciar el curso.
            </li>
          </ul>

          {/* Cupos */}
          <p className="italic font-semibold mt-6 text-sm sm:text-base text-[#2c2c2c]">
            Cupos limitados: 8 personas por curso.
          </p>

          {/* CTA botón */}
          <div className="mt-10 flex justify-center">
            <a
              onClick={scrollToPrice}
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border-2 border-[#9f7042] text-[#9f7042] rounded-full font-semibold hover:bg-[#9f7042] hover:text-white transition"
            >
              Quiero ser parte
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CoursePriceInfo;
