import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import { assetUrl } from '../config/env';

import {
  selectCartItems,
  selectCartCount,
  selectCartSubtotal,
  selectCanCheckout,
  removeItem,
  setQty,
  clearCart,
} from '../store/cartSlice';

/* ============================================================
   CARRITO — botón + panel lateral
   El panel se monta con createPortal en <body>: el header tiene
   backdrop-blur y eso crea un containing block que rompe el
   position:fixed de los hijos (se superponía con el contenido).
   ============================================================ */

const CartLine = ({ item, onRemove, onQty }) => {
  // Cada item muestra SU diseño (nunca el de otro item del carrito).
  const image = item.image || (item.imagenUrl ? assetUrl(item.imagenUrl) : null);

  return (
  <div className="flex gap-3 py-4 border-b border-neutral-900/10">
    <div className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-900/10 bg-white flex-shrink-0">
      {image ? (
        <img src={image} alt={`Diseño de ${item.name}`} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-lg">🐾</div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="font-black uppercase tracking-tight text-neutral-900 truncate">
        {item.name || 'Mi mascota'}
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
        {[item.styleName || item.style, item.colorName || item.color, item.size && `Talle ${item.size}`]
          .filter(Boolean)
          .join(' · ')}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center border border-neutral-900/15 rounded-full overflow-hidden">
          <button
            type="button"
            aria-label="Restar unidad"
            onClick={() => onQty(item.qty - 1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-900/5"
          >
            −
          </button>
          <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
          <button
            type="button"
            aria-label="Sumar unidad"
            onClick={() => onQty(item.qty + 1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-900/5"
          >
            +
          </button>
        </div>
        <span className="text-sm font-bold text-neutral-900">
          ${(item.price * item.qty).toLocaleString('es-AR')}
        </span>
      </div>
    </div>

    <button
      type="button"
      onClick={onRemove}
      aria-label={`Quitar ${item.name || 'item'} del carrito`}
      className="self-start p-1 -mr-1 text-neutral-400 hover:text-neutral-900 transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
  );
};

const CartPanel = ({ onClose }) => {
  const dispatch    = useDispatch();
  const items       = useSelector(selectCartItems);
  const subtotal    = useSelector(selectCartSubtotal);
  // Solo se puede pagar si el diseño ya fue generado.
  const canCheckout = useSelector(selectCanCheckout);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#171717]/40 backdrop-blur-sm z-[90]"
      />
      <motion.aside
        role="dialog"
        aria-label="Carrito"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
        className="fixed top-0 right-0 bottom-0 w-[22rem] max-w-[88%] bg-[#FBF9F4] z-[100] flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900/10">
          <span className="font-black tracking-[0.18em] text-sm text-neutral-900">TU CARRITO</span>
          <button aria-label="Cerrar carrito" onClick={onClose} className="p-2 -mr-2 text-neutral-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <span className="text-4xl mb-4">🛒</span>
              <p className="text-sm text-neutral-600 max-w-[15rem]">
                Todavía no agregaste ninguna remera. Creá el diseño de tu mascota y sumalo acá.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                onRemove={() => dispatch(removeItem(item.id))}
                onQty={(qty) => dispatch(setQty({ id: item.id, qty }))}
              />
            ))
          )}
        </div>

        <div className="border-t border-neutral-900/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-neutral-500">Subtotal</span>
            <span className="font-black text-lg text-neutral-900">
              ${subtotal.toLocaleString('es-AR')}
            </span>
          </div>
          {items.length > 0 && (
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              El envío se calcula en el siguiente paso.
            </p>
          )}

          {canCheckout ? (
            <>
              <a
                href="/crear?paso=envio"
                className="group w-full inline-flex items-center justify-center gap-2 bg-[#C2410C] text-white py-4 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-[#C2410C]/30 hover:bg-[#B23A0A] active:scale-[0.98] transition-all"
              >
                Finalizar compra · ${subtotal.toLocaleString('es-AR')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="/crear"
                className="w-full inline-flex items-center justify-center border border-neutral-900/15 text-neutral-900 py-3 rounded-full font-semibold text-sm hover:border-neutral-900 transition"
              >
                Crear otra remera
              </a>
              <p className="text-[10px] text-neutral-400 text-center">
                🐾 10% de tu compra va a refugios · Pago seguro con Mercado Pago
              </p>
            </>
          ) : (
            <>
              <a
                href="/crear"
                className="w-full inline-flex items-center justify-center bg-neutral-900 text-white py-3.5 rounded-full font-semibold text-sm hover:bg-[#262626] transition"
              >
                Crear mi remera
              </a>
              {items.length > 0 && (
                <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
                  Para poder pagar, primero terminá de generar el diseño de tu mascota.
                </p>
              )}
            </>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearCart())}
              className="w-full text-center text-xs font-semibold text-neutral-400 hover:text-neutral-900 transition"
            >
              Vaciar carrito
            </button>
          )}
        </div>
      </motion.aside>
    </>,
    document.body
  );
};

const CartButton = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const count = useSelector(selectCartCount);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Carrito (${count} ${count === 1 ? 'item' : 'items'})`}
        onClick={() => setOpen(true)}
        className={`relative p-2 text-neutral-900 ${className}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 7h12l-1.2 10.4a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L6 7Z" />
          <path d="M9 7a3 3 0 1 1 6 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C2410C] text-white text-[10px] font-black flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && <CartPanel onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default CartButton;
