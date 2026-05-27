import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    x: '-100vw',
    transition: { ease: 'easeInOut' },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' },
  }),
};

const PREVIEW_STYLES = [
  { slug: 'vogue',      name: 'Vogue',      tag: 'Editorial' },
  { slug: 'streetwear', name: 'Streetwear', tag: 'Urbano' },
  { slug: 'rap-tee',    name: 'Rap Tee',    tag: 'Bootleg' },
  { slug: 'minimal',    name: 'Minimal',    tag: 'Línea' },
];

/* ============================================================
   HEADER
   ============================================================ */
const Header = () => (
  <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-neutral-100">
    <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
      <button aria-label="Menú" className="md:hidden flex flex-col gap-1.5 p-2 -ml-2">
        <span className="block w-5 h-0.5 bg-neutral-900" />
        <span className="block w-5 h-0.5 bg-neutral-900" />
        <span className="block w-5 h-0.5 bg-neutral-900" />
      </button>
      <a href="/" className="absolute left-1/2 -translate-x-1/2 font-black tracking-[0.2em] text-lg">
        PETTEE<span className="text-neutral-400">.</span>
      </a>
      <a href="/carrito" aria-label="Carrito" className="relative p-2 -mr-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 7h12l-1.2 10.4a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L6 7Z" />
          <path d="M9 7a3 3 0 1 1 6 0" />
        </svg>
      </a>
    </div>
  </header>
);

/* ============================================================
   HERO
   ============================================================ */
const Hero = () => (
  <section className="relative overflow-hidden bg-white">
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-12 pb-10 md:pt-20 md:pb-16">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
        <motion.span
          variants={fadeUp}
          custom={0}
          className="block text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-500 mb-5"
        >
          ✦ Edición personalizada con IA
        </motion.span>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="font-black leading-[0.95] tracking-tight text-5xl md:text-7xl text-neutral-900 max-w-3xl"
        >
          Tu mascota.
          <br />
          <span className="italic font-serif font-light text-neutral-500">Una remera única.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="mt-6 text-neutral-600 text-base md:text-lg max-w-md leading-relaxed"
        >
          Elegí un estilo, subí una foto y nuestra IA crea un diseño personalizado en
          una oversized negra premium.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-8">
          <a
            href="/crear"
            className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-neutral-800 active:scale-[0.98] transition"
          >
            Crear mi remera
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </motion.div>

        <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-3 text-xs text-neutral-500">
          <div className="flex -space-x-2">
            <span className="w-6 h-6 rounded-full bg-neutral-300 border-2 border-white" />
            <span className="w-6 h-6 rounded-full bg-neutral-400 border-2 border-white" />
            <span className="w-6 h-6 rounded-full bg-neutral-500 border-2 border-white" />
          </div>
          <span>+1.200 mascotas con su remera</span>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   STYLES PREVIEW
   ============================================================ */
const StylesPreview = () => (
  <section className="bg-white pb-16 md:pb-24">
    <div className="max-w-5xl mx-auto px-5 md:px-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-500">
            Estilos disponibles
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">
            Algunos vibes.
          </h2>
        </div>
        <a href="/crear" className="text-xs font-bold underline underline-offset-4 hidden sm:inline">
          Ver todos
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PREVIEW_STYLES.map((s, i) => (
          <motion.a
            key={s.slug}
            href={`/crear?estilo=${s.slug}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group relative rounded-2xl overflow-hidden bg-neutral-100 aspect-[4/5]"
          >
            <div className="absolute inset-4 bg-neutral-900 rounded-xl flex items-center justify-center">
              <span className="text-white/30 text-[9px] tracking-[0.3em] uppercase font-bold">
                {s.name}
              </span>
            </div>
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-neutral-900 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
              {s.tag}
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="text-white font-bold text-sm">{s.name}</div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

/* ============================================================
   FINAL CTA
   ============================================================ */
const FinalCTA = () => (
  <section className="bg-neutral-950 text-white py-20 md:py-28">
    <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-500">
          2 minutos · vista previa antes de pagar
        </span>
        <h2 className="mt-4 text-4xl md:text-6xl font-black tracking-tight leading-[1]">
          Empezá tu{' '}
          <span className="italic font-serif font-light text-neutral-400">diseño.</span>
        </h2>
        <a
          href="/crear"
          className="mt-8 inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-neutral-100 active:scale-[0.98] transition"
        >
          Crear mi remera
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   HOME
   ============================================================ */
const Home = () => {
  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-white text-neutral-900 font-sans antialiased"
    >
      <Header />
      <Hero />
      <StylesPreview />
      <FinalCTA />
    </motion.main>
  );
};

export default Home;