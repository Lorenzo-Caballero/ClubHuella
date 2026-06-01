import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100"
    >
      <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <motion.div
            whileHover={{ opacity: 0.7 }}
            className="flex flex-col leading-none"
          >
            <span className="text-xl font-black tracking-tight text-neutral-900">
              ClubHuella
            </span>

            <span className="text-[9px] uppercase tracking-[0.35em] text-neutral-400 font-bold mt-1">
              Pet Edition
            </span>
          </motion.div>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            "Diseños",
            "Cómo funciona",
            "Colección",
          ].map((item) => (
            <motion.a
              key={item}
              href="#"
              whileHover={{ y: -2 }}
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition"
            >
              {item}
            </motion.a>
          ))}
        </nav>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="h-11 px-6 rounded-full bg-neutral-900 text-white text-sm font-semibold"
        >
          Crear diseño
        </motion.button>
      </div>
    </motion.header>
  );
}