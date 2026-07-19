import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

/* ⚠️ PONÉ ACÁ TU WHATSAPP REAL (formato: 549 + código de área sin 0 + número sin 15)
   Ej: Mar del Plata 223 -> 5492235001234 */
const WHATSAPP = "5492235377936"
const WHATSAPP_MSG = "¡Hola! Acabo de hacer un pedido en Club Huella y tengo una consulta.";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const Gracias = () => {
  const [params] = useSearchParams();
  const nombre = (params.get("nombre") || "").trim();
  const tipo = params.get("tipo") || "domicilio";
  const esRetiro = tipo === "tienda";

  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

  return (
    <div className="min-h-[100dvh] bg-[#FBF9F4] text-neutral-900 flex flex-col">
      {/* Wordmark */}
      <div className="pt-8 pb-2 text-center">
        <Link to="/" className="text-sm font-black tracking-[0.2em]">
          CLUBHUELLA<span className="text-[#C2410C]">.</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="w-full max-w-lg text-center flex flex-col items-center py-10"
        >
          {/* Check */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="w-16 h-16 rounded-full bg-[#C2410C] flex items-center justify-center mb-7 shadow-lg shadow-[#C2410C]/20"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 6" />
            </svg>
          </motion.div>

          {/* Título */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]"
          >
            ¡Gracias por tu compra!
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 text-neutral-600 text-base md:text-lg leading-relaxed max-w-md"
          >
            {nombre
              ? <>Ya nos ponemos manos a la obra con la remera de <span className="font-semibold text-neutral-900">{nombre}</span>.</>
              : <>Ya nos ponemos manos a la obra con tu remera.</>}
            {" "}
            {esRetiro
              ? "Te avisamos apenas esté lista para que pases a retirarla."
              : "Te enviamos el seguimiento del envío por email."}
          </motion.p>

          {/* Causa */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex items-start gap-3 text-left bg-emerald-50 border border-emerald-100 rounded-2xl p-4 max-w-md"
          >
            <span className="text-xl leading-none">🐾</span>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Con esta compra <span className="font-bold">ayudaste a un refugio de animales</span>. Un pedacito de tu remera se convierte en comida y abrigo para otra huella. Gracias por ser parte.
            </p>
          </motion.div>

          {/* CTA principal — seguir vendiendo */}
          <motion.div variants={fadeUp} custom={4} className="mt-9 w-full flex flex-col items-center gap-4">
            <Link
              to="/crear"
              className="inline-flex items-center gap-2 bg-[#C2410C] text-white px-8 py-4 rounded-full font-bold text-base hover:bg-[#9A3412] transition shadow-lg shadow-[#C2410C]/20"
            >
              Crear otra remera
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            <Link to="/" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition">
              Volver al inicio
            </Link>
          </motion.div>

          {/* Contacto discreto */}
          <motion.p
            variants={fadeUp}
            custom={5}
            className="mt-10 text-xs text-neutral-400"
          >
            ¿Alguna duda con tu pedido?{" "}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#C2410C] hover:underline"
            >
              Escribinos por WhatsApp
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Gracias;
