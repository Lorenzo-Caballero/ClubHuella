import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 py-20">
        {/* Top */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black tracking-tight leading-none"
            >
              Convertimos
              <br />
              mascotas en
              <br />
              piezas únicas.
            </motion.h2>

            <p className="mt-6 text-neutral-500 max-w-md leading-relaxed">
              Diseños creados con inteligencia artificial y terminados
              para impresión premium sobre remeras oversized.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] font-bold text-neutral-400 mb-5">
                Navegación
              </h3>

              <div className="space-y-3">
                <a
                  href="#"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  Inicio
                </a>

                <a
                  href="#"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  Diseños
                </a>

                <a
                  href="#"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  Crear remera
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] font-bold text-neutral-400 mb-5">
                Contacto
              </h3>

              <div className="space-y-3">
                <a
                  href="mailto:hola@clubhuella.com"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  hola@clubhuella.com
                </a>

                <a
                  href="#"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  Instagram
                </a>

                <a
                  href="#"
                  className="block font-medium text-neutral-700 hover:text-black transition"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 my-14" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
          <div>
            <div className="font-black text-xl tracking-tight">
              ClubHuella
            </div>

            <div className="text-xs text-neutral-500 mt-1">
              Diseños únicos para mascotas únicas.
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-900 transition">
              Términos
            </a>

            <a href="#" className="hover:text-neutral-900 transition">
              Privacidad
            </a>

            <span>
              © {new Date().getFullYear()} ClubHuella
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}