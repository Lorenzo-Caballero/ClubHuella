import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import CartButton from '../components/CartButton';
import usePageMeta from '../hooks/usePageMeta';
import { TSHIRT_PRICE } from '../config/env';
import { styleColorAvailability } from '../config/styleColors';

/* Fotos de estilo reutilizadas como muestras reales de producto */
import vogueImg     from '../assets/styles/vogue.jpg';
import retroImg     from '../assets/styles/retro.jpg';
import polaroidImg  from '../assets/styles/polaroid.jpg';
import granuladoImg from '../assets/styles/granulado.jpg';
import streetImg    from '../assets/styles/street.jpg';
import cleanLookImg from '../assets/styles/clean-look.jpg';
import heroGiftImg from '../assets/hero-regalo-club-huella.jpg';

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
  { slug: 'vogue',      name: 'Vogue',      image: vogueImg },
  { slug: 'streetwear', name: 'Street',     image: streetImg },
  { slug: 'rap-tee',    name: 'Retro',      image: retroImg },
  { slug: 'retro',      name: 'Granulado',  image: granuladoImg },
  { slug: 'collage',    name: 'Clean Look', image: cleanLookImg },
  { slug: 'minimal',    name: 'Polaroid',   image: polaroidImg },
].map((style) => ({ ...style, availability: styleColorAvailability(style.slug) }));

const STEPS = [
  { n: '01', emoji: '🎨', title: 'Personalizá tu remera', desc: 'Elegí el estilo, el nombre, el talle y el color compatible.' },
  { n: '02', emoji: '📸', title: 'Creá la vista previa', desc: 'Subí su foto y mirá cómo queda antes de decidirte.' },
  { n: '03', emoji: '📦', title: 'Recibila como prefieras', desc: 'Cotizá el envío o elegí el retiro gratuito en Mar del Plata.' },
];

const formatPrice = (price) => '$' + price.toLocaleString('es-AR');

/* Fotos reales de refugios para la sección "Nuestra causa".
   Cuando las tengas: importalas arriba y sumalas a este array —
   la sección se acomoda sola (1 foto = panorámica, 2+ = grilla). */
const REFUGIO_FOTOS = [];

const NAV_LINKS = [
  { label: 'Comprar', href: '#precio', detail: 'Precio y vista previa', icon: '✦', desktop: false },
  { label: 'Estilos', href: '#estilos', detail: 'Elegí el diseño que más se parece a su personalidad', icon: '🎨', desktop: true },
  { label: 'Cómo funciona', href: '#como-funciona', detail: 'Así se crea tu remera', icon: '01', desktop: true },
  { label: 'Envíos y pagos', href: '#compra', detail: 'Entrega y compra segura', icon: '📦', desktop: true },
  { label: 'Nuestra causa', href: '#causa', detail: 'El impacto detrás de cada compra', icon: '🐾', desktop: false },
  { label: 'Ayuda', href: '#faq', detail: 'Respuestas a tus preguntas', icon: '?', desktop: true },
];

const FAQS = [
  {
    q: '¿Qué es Club Huella?',
    a: 'Club Huella es una marca argentina de remeras personalizadas a partir de la foto de tu perro o gato. Creamos un diseño único para llevar su historia y destinamos el 10% de las ganancias a refugios de animales.',
  },
  {
    q: '¿Club Huella es una ONG de mascotas?',
    a: 'Club Huella no es una ONG: es una marca de indumentaria con causa animal. Destinamos el 10% de las ganancias a refugios y protectoras de animales de Argentina, para apoyar su trabajo con perros y gatos sin hogar.',
  },
  {
    q: '¿Cómo puedo hacer una donación de mascotas o ayudar a un refugio en Argentina?',
    a: 'Una forma simple es comprando una remera personalizada de tu mascota en Club Huella: destinamos el 10% de las ganancias a refugios y protectoras de animales de Argentina.',
  },
  {
    q: '¿Qué estilos de remeras de mascotas hay disponibles?',
    a: 'Hoy podés elegir entre Vogue, Street, Retro, Granulado, Clean Look y Polaroid. Todos parten de la foto de tu perro o gato.',
  },
  {
    q: '¿Hacen envíos de las remeras a todo Argentina?',
    a: 'Sí, hacemos envíos a todo el país. También podés retirar tu remera personalizada en sucursal si estás en Mar del Plata.',
  },
];

/* ============================================================
   HEADER  (menú hamburguesa funcional)
   ============================================================ */
const MobileMenu = ({ onClose }) =>
  /* Portal a <body>: el header usa backdrop-blur (y <main> puede tener
     transform por framer-motion), lo que convierte al header en containing
     block y hacía que el drawer fixed quedara pegado/superpuesto al home. */
  createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#171717]/40 backdrop-blur-sm z-[90] md:hidden"
      />
      <motion.div
        role="dialog"
        aria-label="Menú"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
        className="fixed top-0 left-0 bottom-0 w-72 max-w-[80%] bg-[#FBF9F4] z-[100] md:hidden p-6 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <span className="font-black tracking-[0.18em] text-neutral-900">
            CLUBHUELLA<span className="text-[#C2410C]">.</span>
          </span>
          <button aria-label="Cerrar menú" onClick={onClose} className="p-2 -mr-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mb-5">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8D3414]">Explorá la tienda</span>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">Una remera hecha con su foto, para llevarlo siempre cerca.</p>
        </div>
        <nav aria-label="Navegación de la tienda" className="flex-1 overflow-y-auto -mx-2 px-2">
          {NAV_LINKS.map((l, i) => (
            <motion.a
              key={l.href}
              href={l.href}
              onClick={onClose}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex items-center gap-3 py-3.5 border-b border-neutral-900/10 group"
            >
              <span className="w-9 h-9 shrink-0 rounded-xl bg-white border border-neutral-900/10 flex items-center justify-center text-sm font-bold text-[#8D3414]">{l.icon}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-neutral-900 group-hover:text-[#8D3414]">{l.label}</span>
                <span className="block mt-0.5 text-xs leading-snug text-neutral-500">{l.detail}</span>
              </span>
            </motion.a>
          ))}
        </nav>
        <div className="pt-5 mt-3 border-t border-neutral-900/10">
          <a
            href="/crear"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 bg-[#C2410C] text-white py-4 rounded-full font-bold text-sm shadow-lg shadow-[#C2410C]/20"
          >
            Diseñar mi remera <span aria-hidden="true">→</span>
          </a>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Vista previa gratis · 10% de las ganancias para refugios</p>
        </div>
      </motion.div>
    </>,
    document.body
  );

const Header = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F4]/85 backdrop-blur-md border-b border-neutral-900/10">
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
        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-neutral-700">
          {NAV_LINKS.filter((l) => l.desktop).map((l) => (
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

        <div className="flex items-center gap-1 -mr-2">
          <a
            href="/crear"
            className="hidden md:inline-flex items-center bg-neutral-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide hover:bg-[#262626] transition"
          >
            Crear remera
          </a>
          <CartButton />
        </div>
      </div>

      {/* Drawer mobile (renderizado fuera del header, ver MobileMenu) */}
      <AnimatePresence>
        {open && <MobileMenu onClose={() => setOpen(false)} />}
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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-col items-center text-center md:items-start md:text-left"
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 text-sm md:text-base font-bold tracking-[0.08em] uppercase text-[#8D3414] mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
            Un regalo único para quien ama a su mascota
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-black leading-[1.02] tracking-tight text-5xl md:text-6xl text-neutral-900"
          >
            Tu mascota,{' '}
            <span className="italic font-serif font-light text-[#8D3414]">siempre cerca.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 text-neutral-700 text-lg md:text-xl max-w-lg leading-relaxed"
          >
            Una remera única a partir de su foto: un regalo para emocionar y llevar con vos una historia que importa.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <a
              href="/crear"
              className="group inline-flex items-center justify-center gap-2 bg-[#C2410C] text-white px-8 py-4 rounded-full font-semibold text-base tracking-wide shadow-lg shadow-[#C2410C]/30 hover:shadow-xl hover:shadow-[#C2410C]/50 hover:bg-[#B23A0A] active:scale-[0.98] transition-all duration-300"
            >
              Diseñar una remera única
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#estilos" className="text-base font-bold underline underline-offset-4 text-neutral-700 px-2 py-2">
              Ver estilos
            </a>
          </motion.div>

          <motion.p variants={fadeUp} custom={4} className="mt-5 max-w-lg text-base md:text-lg font-medium leading-relaxed text-neutral-600">
            Primero ves cómo queda. Decidís si querés comprarla después.
          </motion.p>
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
              src={heroGiftImg}
              alt="Escena ilustrativa de regalo: una persona recibe una remera con el retrato de su perro"
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
              <div className="text-sm md:text-base font-black text-neutral-900">10% de las ganancias para refugios</div>
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
      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="mb-10 md:mb-14 text-center md:text-left">
        <span className="text-sm font-bold tracking-[0.12em] uppercase text-[#8D3414]">Así de simple</span>
        <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Tu remera, en tres simples pasos.</h2>
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
            className="relative text-center md:text-left"
          >
            <div className="text-5xl mb-3">{s.emoji}</div>
            <span className="block text-[10px] font-black tracking-[0.3em] uppercase text-[#C2410C] mb-1.5">
              Paso {s.n}
            </span>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{s.title}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 text-center md:text-left">
        <a
          href="/crear"
          className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#262626] active:scale-[0.98] transition"
        >
          Crear mi diseño gratis
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
    <section id="estilos" className="scroll-mt-20 bg-[#FBF9F4] py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-5 md:px-8">
      <div className="flex items-end justify-between mb-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#C2410C]">Estilos disponibles</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Elegí su estilo.</h2>
          <p className="mt-2 text-base text-neutral-700 max-w-md leading-relaxed">Algunos estilos están disponibles en ambos colores. Vas a ver el diseño antes de pagar.</p>
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
            className="group block rounded-2xl overflow-hidden border border-neutral-200 bg-white"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#e5e5e5]">
              <img
                src={s.image}
                alt={`Estilo ${s.name}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-neutral-900 font-bold text-sm">{s.name}</span>
                <span className="shrink-0 bg-[#FBF9F4] text-neutral-900 w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                </span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-[#8D3414]">{s.availability}</div>
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
    <section id="causa" className="scroll-mt-20 relative bg-[#0a0a0a] text-white py-20 md:py-28 overflow-hidden">
    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
    <div className="relative max-w-4xl mx-auto px-5 md:px-8 text-center">
      <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
        <span className="inline-block text-6xl md:text-7xl mb-6">🐾</span>
        <span className="block text-[11px] font-bold tracking-[0.3em] uppercase text-[#F97316] mb-4">Moda solidaria · Donación a refugios de animales de Argentina</span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] mb-6 text-white">
          El 10% de las ganancias
          <br />
          <span className="italic font-serif font-light text-[#d4d4d4]">se destina a refugios.</span>
        </h2>
        <p className="text-[#a3a3a3] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Club Huella no nació solo para celebrar a tu mascota. Destinamos el 10% de las ganancias
          a refugios y protectoras de animales de Argentina. Cuando tengamos las primeras ventas,
          vamos a compartir el impacto y las organizaciones acompañadas. No somos una ONG: somos
          una marca de indumentaria con una causa animal.
        </p>

        {REFUGIO_FOTOS.length > 0 && (
          <div className={`mt-10 mx-auto gap-3 ${REFUGIO_FOTOS.length === 1 ? 'max-w-lg' : 'grid grid-cols-3 max-w-2xl'}`}>
            {REFUGIO_FOTOS.map((foto, i) => (
              <img
                key={i}
                src={foto}
                alt="Animales en un refugio de Argentina esperando una familia"
                loading="lazy"
                className={`rounded-2xl object-cover w-full shadow-2xl shadow-black/40 ${REFUGIO_FOTOS.length === 1 ? 'aspect-[3/2]' : 'aspect-square'}`}
              />
            ))}
          </div>
        )}

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
    { icon: '👀', title: 'Primero la vista previa', desc: 'Conocés el diseño antes de decidir. No pagás para verlo.' },
    { icon: '✦', title: 'Algodón pesado · 240 g', desc: 'Remera oversized con estampa DTF premium.' },
    { icon: '🚚', title: 'Envío a tu medida', desc: 'Cotizás por código postal o retirás gratis en Mar del Plata.' },
    { icon: '🔒', title: 'Pago protegido', desc: 'El pago se procesa en Mercado Pago.' },
  ];
  return (
    <section id="compra" className="scroll-mt-20 bg-white py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#8D3414]">Comprá con tranquilidad</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Todo claro antes de decidir.</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-neutral-900/10 bg-[#FBF9F4] p-5 text-left"
          >
            <div className="text-3xl mb-3">{it.icon}</div>
            <h3 className="font-bold text-neutral-900 mb-1.5">{it.title}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{it.desc}</p>
          </motion.div>
        ))}
        </div>
      </div>
      </section>
  );
};

/* ============================================================
   PRECIO  (visible en la portada, después de presentar el producto)
   ============================================================ */
const PriceOffer = () => (
  <section id="precio" className="scroll-mt-20 bg-white py-14 md:py-20">
    <div className="max-w-5xl mx-auto px-5 md:px-8">
      <div className="rounded-3xl border border-[#E7D3C7] bg-[#F7EEE7] p-7 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#8D3414]">Tu remera personalizada</span>
          <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">Una historia única, hecha para llevar.</h2>
          <p className="mt-3 text-base md:text-lg leading-relaxed text-neutral-700">Vas a ver la vista previa antes de decidir. El envío se calcula según tu destino antes del pago.</p>
        </div>
        <div className="shrink-0 md:text-right">
          <div className="text-base font-semibold text-neutral-700">Precio por remera</div>
          <div className="mt-1 text-4xl font-black tracking-tight text-neutral-900">{formatPrice(TSHIRT_PRICE)}</div>
          <a href="/crear" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-6 py-3.5 text-base font-bold text-white hover:bg-[#A83F21] transition">
            Empezar mi diseño
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>
    </div>
  </section>
);

/* ============================================================
   FAQ  (contenido visible, en espejo con el FAQPage JSON-LD de
   public/index.html — sumá o editá preguntas en ambos lugares)
   ============================================================ */
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-[#FBF9F4] py-16 md:py-24 border-t border-neutral-900/10">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="mb-10">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#C2410C]">Preguntas frecuentes</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
            Remeras de mascotas, dudas resueltas.
          </h2>
        </motion.div>

        <div className="flex flex-col divide-y divide-neutral-900/10 border-t border-b border-neutral-900/10">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div key={item.q} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} transition={{ delay: i * 0.05 }}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-bold text-neutral-900 text-sm md:text-base">{item.q}</span>
                  <span className={`shrink-0 w-6 h-6 rounded-full border border-neutral-900/20 flex items-center justify-center transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden text-sm text-neutral-600 leading-relaxed pb-5 pr-9"
                    >
                      {item.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
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
          Diseño a medida · vista previa gratis
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
        <p className="mt-5 text-xs text-white/90">Remera {formatPrice(TSHIRT_PRICE)} · envío calculado según tu destino antes de pagar.</p>
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
      <nav aria-label="Enlaces del sitio" className="flex flex-wrap items-center justify-center gap-6 text-sm">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
        ))}
      </nav>
      <span className="text-xs">© {new Date().getFullYear()} ClubHuella · 10% de las ganancias para refugios</span>
    </div>
  </footer>
);

/* ============================================================
   HOME
   ============================================================ */
const Home = () => {
  usePageMeta({
    title: 'Remeras Personalizadas con la Foto de tu Mascota | Club Huella®',
    description:
      'Remeras personalizadas con la foto de tu perro o gato, con un diseño único hecho en Argentina. El 10% de las ganancias se destina a refugios y protectoras de animales.',
  });

  return (
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
    <PriceOffer />
    <Cause />
    <Trust />
    <FAQ />
    <FinalCTA />
    <Footer />
  </motion.main>
  );
};

export default Home;
