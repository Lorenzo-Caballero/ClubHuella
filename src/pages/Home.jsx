import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* Fotos de estilo reutilizadas como muestras reales de producto */
import vogueImg     from '../assets/styles/vogue.jpg';
import retroImg     from '../assets/styles/retro.jpg';
import polaroidImg  from '../assets/styles/polaroid.jpg';
import granuladoImg from '../assets/styles/granulado.jpg';
import streetImg    from '../assets/styles/street.jpg';
import cleanLookImg from '../assets/styles/clean-look.jpg';
import heroModeloImg from '../assets/styles/hero-modelo.jpg';

/* ============================================================
   VARIANTS
   ============================================================ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { x: '-100vw', transition: { ease: 'easeInOut' } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* ============================================================
   DATA
   ============================================================ */
const STYLE_PREVIEWS = [
  { slug: 'vogue',      name: 'Vogue',      tag: 'Editorial', image: vogueImg },
  { slug: 'streetwear', name: 'Street',     tag: 'Urbano',    image: streetImg },
  { slug: 'rap-tee',    name: 'Retro',      tag: 'Bootleg',   image: retroImg },
  { slug: 'retro',      name: 'Granulado',  tag: 'Riso',      image: granuladoImg },
  { slug: 'collage',    name: 'Clean Look', tag: 'Mixtape',   image: cleanLookImg },
  { slug: 'minimal',    name: 'Polaroid',   tag: 'Polaroid',  image: polaroidImg },
];

const STEPS = [
  { n: '01', title: 'Elegí un estilo', desc: 'Vogue, retro, street… cada uno transforma a tu mascota distinto.' },
  { n: '02', title: 'Subí una foto',   desc: 'Una foto clara de tu compañero. La IA hace el resto.' },
  { n: '03', title: 'Vista previa',    desc: 'Mirás el diseño antes de pagar. Si no te enamora, no compras.' },
];

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Estilos',       href: '#estilos' },
  { label: 'Nuestra causa', href: '#causa' },
];

/* ============================================================
   HEADER  (menú hamburguesa funcional)
   ============================================================ */
const Header = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-[#FBF9F4]/85 backdrop-blur-md border-b border-neutral-900/10">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="md:hidden flex flex-col gap-1.5 p-2 -ml-2"
        >
          <span className="block w-5 h-0.5 bg-neutral-900" />
          <span className="block w-5 h-0.5 bg-neutral-900" />
          <span className="block w-5 h-0.5 bg-neutral-900" />
        </button>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-700">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-neutral-900 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-black tracking-[0.18em] text-lg text-neutral-900"
        >
          CLUBHUELLA<span className="text-[#C2410C]">.</span>
        </a>

        <a
          href="/crear"
          className="hidden md:inline-flex items-center bg-neutral-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide hover:bg-[#262626] transition"
        >
          Crear remera
        </a>

        {/* Carrito (mobile) */}
        <a href="/" aria-label="Inicio" className="md:hidden relative p-2 -mr-2 text-neutral-900">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 7h12l-1.2 10.4a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L6 7Z" />
            <path d="M9 7a3 3 0 1 1 6 0" />
          </svg>
        </a>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-[#171717]/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
              className="fixed top-0 left-0 bottom-0 w-72 max-w-[80%] bg-[#FBF9F4] z-50 md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-black tracking-[0.18em] text-neutral-900">
                  CLUBHUELLA<span className="text-[#C2410C]">.</span>
                </span>
                <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="p-2 -mr-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((l, i) => (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="py-3 text-lg font-semibold text-neutral-800 border-b border-neutral-900/10"
                  >
                    {l.label}
                  </motion.a>
                ))}
              </nav>
              <a
                href="/crear"
                onClick={() => setOpen(false)}
                className="mt-auto inline-flex items-center justify-center bg-neutral-900 text-white py-4 rounded-full font-semibold text-sm"
              >
                Crear mi remera
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

/* ============================================================
   HERO
   ============================================================ */
const Hero = () => (
  <section className="relative overflow-hidden bg-[#FBF9F4]">
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 pb-12 md:pt-16 md:pb-20">
      <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        {/* Texto */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] uppercase text-[#C2410C] mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
            Edición personalizada con IA
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-black leading-[1] tracking-tight text-3xl md:text-5xl text-neutral-900"
          >
            Tu mascota,{' '}
            <span className="italic font-serif font-light text-neutral-500">en una remera única.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 text-neutral-600 text-sm md:text-base max-w-sm leading-relaxed"
          >
            Subí una foto, elegí un estilo y la IA hace el resto. Vista previa gratis antes de pagar.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/crear"
              className="group inline-flex items-center justify-center gap-2 bg-[#C2410C] text-white px-8 py-4 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-[#C2410C]/30 hover:shadow-xl hover:shadow-[#C2410C]/50 hover:bg-[#B23A0A] active:scale-[0.98] transition-all duration-300"
            >
              Crear mi remera
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#estilos" className="text-sm font-bold underline underline-offset-4 text-neutral-700 px-2 py-2">
              Ver estilos
            </a>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-3 text-xs text-neutral-500">
            <div className="flex -space-x-2">
              <img src={polaroidImg} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#FBF9F4]" />
              <img src={streetImg} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#FBF9F4]" />
              <img src={vogueImg} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#FBF9F4]" />
            </div>
            <span className="font-medium">+1.200 mascotas ya tienen la suya</span>
          </motion.div>
        </motion.div>

        {/* Imagen protagonista (clickeable -> CreateFlow) */}
        <motion.a
          href="/crear"
          aria-label="Crear mi remera"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="group relative block"
        >
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl shadow-neutral-900/10">
            <img
              src={heroModeloImg}
              alt="Modelo con remera personalizada de mascota"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* hint de click */}
            <div className="absolute inset-0 bg-[#171717]/0 group-hover:bg-[#171717]/10 transition-colors" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/95 backdrop-blur text-neutral-900 px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap shadow-lg">
              Crear la mía →
            </div>
          </div>
          {/* Tarjeta flotante */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute -bottom-4 -left-3 md:-left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">🐾</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#a3a3a3] font-bold">Cada compra</div>
              <div className="text-sm font-black text-neutral-900">dona 10% a refugios</div>
            </div>
          </motion.div>
        </motion.a>
      </div>
    </div>
  </section>
);

/* ============================================================
   CÓMO FUNCIONA
   ============================================================ */
const HowItWorks = () => (
  <section id="como-funciona" className="bg-white py-16 md:py-24">
    <div className="max-w-5xl mx-auto px-5 md:px-8">
      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="mb-10 md:mb-14">
        <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#C2410C]">Simple de verdad</span>
        <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">En 3 pasos, 2 minutos.</h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="text-5xl font-black text-[#e5e5e5] mb-3">{s.n}</div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{s.title}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12">
        <a
          href="/crear"
          className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#262626] active:scale-[0.98] transition"
        >
          Empezar ahora
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   ESTILOS  (clickeables -> /crear?estilo=slug -> paso 2)
   ============================================================ */
const StylesSection = () => (
  <section id="estilos" className="bg-[#FBF9F4] py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-5 md:px-8">
      <div className="flex items-end justify-between mb-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#C2410C]">Estilos disponibles</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Elegí el vibe.</h2>
          <p className="mt-2 text-sm text-neutral-600 max-w-sm">Tocá un estilo y te llevamos directo a subir la foto de tu mascota.</p>
        </motion.div>
        <a href="/crear" className="text-xs font-bold underline underline-offset-4 hidden sm:inline shrink-0">Ver todos</a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {STYLE_PREVIEWS.map((s, i) => (
          <motion.a
            key={s.slug}
            href={`/crear?estilo=${s.slug}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: (i % 3) * 0.06, duration: 0.45 }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#e5e5e5]"
          >
            <img
              src={s.image}
              alt={`Estilo ${s.name}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-neutral-900 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
              {s.tag}
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between">
              <span className="text-white font-bold text-sm">{s.name}</span>
              <span className="opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all bg-white text-neutral-900 w-7 h-7 rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

/* ============================================================
   CAUSA  (misión social 10%)
   ============================================================ */
const Cause = () => (
  <section id="causa" className="relative bg-[#0a0a0a] text-white py-20 md:py-28 overflow-hidden">
    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
    <div className="relative max-w-4xl mx-auto px-5 md:px-8 text-center">
      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
        <span className="inline-block text-6xl md:text-7xl mb-6">🐾</span>
        <span className="block text-[11px] font-bold tracking-[0.3em] uppercase text-[#F97316] mb-4">Nuestra causa</span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] mb-6 text-white">
          El 10% de cada compra
          <br />
          <span className="italic font-serif font-light text-[#a3a3a3]">ayuda a los que todavía esperan un hogar.</span>
        </h2>
        <p className="text-[#a3a3a3] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          ClubHuella no nació solo para celebrar a tu mascota. Cada remera financia comida,
          refugio y rescate de animales que aún buscan su familia. Tu recuerdo se convierte en
          el comienzo de otra historia.
        </p>
        <a
          href="/crear"
          className="mt-10 inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#f5f5f5] active:scale-[0.98] transition"
        >
          Crear y ayudar
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   GARANTÍAS  (vende confianza)
   ============================================================ */
const Trust = () => {
  const items = [
    { icon: '👀', title: 'Vista previa gratis', desc: 'Ves tu diseño antes de pagar. Cero sorpresas.' },
    { icon: '✨', title: 'Calidad premium',     desc: 'Estampado sobre oversized de algodón pesado.' },
    { icon: '🚚', title: 'Envíos a todo el país', desc: 'Te llega a casa o lo retirás en sucursal.' },
  ];
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-5 md:px-8 grid sm:grid-cols-3 gap-8">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08 }}
            className="text-center sm:text-left"
          >
            <div className="text-3xl mb-3">{it.icon}</div>
            <h3 className="font-bold text-neutral-900 mb-1.5">{it.title}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ============================================================
   FINAL CTA
   ============================================================ */
const FinalCTA = () => (
  <section className="relative bg-[#C2410C] text-white py-20 md:py-28 overflow-hidden">
    <div className="relative max-w-3xl mx-auto px-5 md:px-8 text-center">
      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
        <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-white/70">
          2 minutos · vista previa antes de pagar
        </span>
        <h2 className="mt-4 text-4xl md:text-6xl font-black tracking-tight leading-[1]">
          Convertí a tu mascota
          <br />
          <span className="italic font-serif font-light text-white/80">en algo único.</span>
        </h2>
        <a
          href="/crear"
          className="mt-8 inline-flex items-center justify-center gap-2 bg-white text-[#C2410C] px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#f5f5f5] active:scale-[0.98] transition"
        >
          Crear mi remera
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <p className="mt-5 text-xs text-white/70">Y ayudás a un refugio con cada compra 🐾</p>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   FOOTER
   ============================================================ */
const Footer = () => (
  <footer className="bg-[#0a0a0a] text-[#a3a3a3] py-12">
    <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <span className="font-black tracking-[0.18em] text-white">
        CLUBHUELLA<span className="text-[#C2410C]">.</span>
      </span>
      <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
        ))}
      </nav>
      <span className="text-xs">© {new Date().getFullYear()} ClubHuella · 10% para refugios</span>
    </div>
  </footer>
);

/* ============================================================
   HOME
   ============================================================ */
const Home = () => (
  <motion.main
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="bg-[#FBF9F4] text-neutral-900 font-sans antialiased"
  >
    <Header />
    <Hero />
    <HowItWorks />
    <StylesSection />
    <Cause />
    <Trust />
    <FinalCTA />
    <Footer />
  </motion.main>
);

export default Home;
