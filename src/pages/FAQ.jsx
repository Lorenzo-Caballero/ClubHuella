import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "¿Cuál es el valor del curso y formas de pago?",
    answer: `El valor de lista es de $260mil. Podés pagar hasta en 3 cuotas sin interés con tarjeta (pago virtual). Si pagás en efectivo o por transferencia, tenés un 20% de descuento y pagás $208mil.`,
  },
  {
    question: "¿Cómo es la reserva y cuándo se paga?",
    answer: `Si pagás con tarjeta, se abona el total para reservar. Si pagás en efectivo/transferencia, abonás el 50% para reservar y el resto antes de iniciar el curso.`,
  },
  {
    question: "¿Cuántos cupos hay por curso?",
    answer: `El curso tiene un cupo máximo de 8 personas.`,
  },
  {
    question: "¿Qué incluye el Día 1? - Teoría",
    answer: `Veremos materiales, bioseguridad, agujas, máquinas, mobiliario, historia del tatuaje, estilos, stencil/transfers, apps de diseño, biología de la piel, cómo armar el setup y técnicas básicas.`,
  },
  {
    question: "¿Qué se hace el Día 2? - Práctica",
    answer: `Repasamos teoría, armamos la mesa, creamos y colocamos stencil, practicamos línea/relleno/sombra en piel sintética, y se corrige alumno por alumno.`,
  },
  {
    question: "¿Qué sucede el Día 3? - Acción",
    answer: `Armamos el setup, se realiza un tatuaje en vivo por la tatuadora, los alumnos pueden tatuar (opcional), corrección personalizada, cómo cotizar, trato con el cliente, cuidados post, foto/video y entrega de diplomas.`,
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const Chevron = ({ isOpen }) => (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="#9f7042"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <section
      className="min-h-screen bg-gradient-to-br from-white via-[#fef9f4] to-[#f3eee9] px-6 sm:px-10 pt-[120px] sm:pt-[140px] pb-16"
      id="faq"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-[#1f1f1f] mb-10">
          Preguntas Frecuentes
        </h2>
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white border border-[#e5d9cf] rounded-2xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center px-6 py-4 text-left"
              >
                <span className="text-base sm:text-lg font-semibold text-[#2c2c2c]">
                  {faq.question}
                </span>
                <Chevron isOpen={openIndex === index} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4 text-[#4b4b4b]"
                  >
                    <p className="text-sm sm:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
