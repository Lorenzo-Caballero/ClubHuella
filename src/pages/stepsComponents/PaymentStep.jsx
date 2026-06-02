import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCreditCard,
  FiSmartphone,
  FiDollarSign,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiShield,
  FiAlertCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import {
  MdOutlineStorefront,
  MdOutlineLocalShipping,
} from 'react-icons/md';
import { BsBank2 } from 'react-icons/bs';
import { RiShirtLine } from 'react-icons/ri';
import MercadoLogo from '../../assets/MercadoLogo.png';

const PAY_URL = 'https://clubhuella.com/payments_envios.php?action=pagar';

const STYLES_MAP = {
  vogue:      'Vogue',
  retro:      'Granulado',
  streetwear: 'Street',
  college:    'College',
  collage:    'Clean Look',
  minimal:    'Polaroid',
  anime:      'Anime',
  'rap-tee':  'Retro',
};

const COLORS_MAP = {
  blanca: 'Blanca',
  negra:  'Negra',
};

const PrimaryButton = ({ children, onClick, disabled, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full h-14 rounded-full bg-neutral-900 text-white font-semibold text-[15px] tracking-wide flex items-center justify-center gap-2.5 disabled:bg-neutral-200 disabled:text-neutral-400 hover:bg-neutral-800 active:scale-[0.985] transition"
  >
    {loading ? (
      <>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full flex-shrink-0"
        />
        Iniciando pago...
      </>
    ) : children}
  </button>
);

const SecurityBadge = () => (
  <div className="flex items-center justify-center gap-2 text-neutral-400">
    <FiShield size={12} />
    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Pago seguro · Mercado Pago</span>
    <FiShield size={12} />
  </div>
);

const PaymentBadge = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-xl">
    <Icon size={15} className="text-neutral-600 flex-shrink-0" />
    <span className="text-[11px] font-bold text-neutral-700">{label}</span>
  </div>
);

function resolveDesignSrc(generated) {
  if (!generated) return null;
  const raw = generated.imagen_generada || generated.imagen_url;
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return `https://clubhuella.com/${raw}`;
}

const PaymentStep = ({ data, generated, shippingData, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const styleName = STYLES_MAP[data?.style]  || data?.style  || '—';
  const colorName = COLORS_MAP[data?.color]  || data?.color  || '—';
  const isPickup  = shippingData?.type === 'tienda';
  const shipCost  = shippingData?.cost  ?? 0;
  const total     = shippingData?.total ?? 42990;
  const designSrc = resolveDesignSrc(generated);

  const addressLine = isPickup
    ? 'Av. Héctor Jara 22, Mar del Plata'
    : shippingData?.address || [
        shippingData?.street,
        shippingData?.streetNumber,
        shippingData?.apt,
        shippingData?.city,
        shippingData?.province,
      ].filter(Boolean).join(', ');

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = {
        carrier:   isPickup ? 'retiro_tienda'   : (shippingData.carrier  ?? ''),
        service:   isPickup ? 'retiro_en_local'  : (shippingData.service  ?? ''),
        price:     shipCost,
        nombre:    shippingData.recipientName ?? '',
        telefono:  isPickup ? '' : (shippingData.phone ?? ''),
        direccion: isPickup
          ? 'Av. Héctor Jara 22'
          : `${shippingData.street ?? ''} ${shippingData.streetNumber ?? ''}${shippingData.apt ? ` ${shippingData.apt}` : ''}`.trim(),
        ciudad:    isPickup ? 'Mar del Plata' : (shippingData.city ?? ''),
        cp:        isPickup ? '7600'          : (shippingData.postalCode ?? ''),
        estilo:         data?.style ?? '',
        nombre_mascota: data?.name  ?? '',
        color:          data?.color ?? '',
        talle:          data?.size  ?? '',
        imagen_url:     generated?.imagen_url ?? '',
        diseno_id:      generated?.id ?? '',
        precio_remera:  42990,
        precio_envio:   shipCost,
        total,
        tipo_entrega:   shippingData.type,
        provincia:      shippingData.province ?? '',
      };

      const res  = await fetch(PAY_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.ok || !json.init_point) {
        throw new Error(json.error || 'No pudimos iniciar el pago. Intentá de nuevo.');
      }

      window.location.href = json.init_point;

    } catch (err) {
      console.error('[PaymentStep]', err);
      setError(err.message || 'Algo falló. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col pt-24 pb-48 px-5 max-w-2xl mx-auto w-full">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-7"
      >
        <span className="block text-[11px] font-bold tracking-[0.25em] uppercase text-neutral-500 mb-3">
          08 · Pago
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 leading-[1.05]">
          Resumen y pago.
        </h1>
        <p className="mt-3 text-neutral-500 text-[15px] leading-relaxed">
          Revisá todo antes de pagar. Vas a ser redirigido a Mercado Pago.
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col gap-5">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden"
        >
          <div className="px-4 pt-4 pb-1">
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400">
              Tu pedido
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-4 border-b border-neutral-200">
            {designSrc ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
                <img src={designSrc} alt="Diseño" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center border border-neutral-200">
                <RiShirtLine size={22} className="text-neutral-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-black text-neutral-900 truncate uppercase tracking-tight">
                {data?.name || 'Mi mascota'}
              </div>
              <div className="text-[12px] text-neutral-500 mt-0.5">
                {styleName} · {colorName} · Talle {data?.size}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Algodón 240g · DTF premium
              </div>
            </div>
            <div className="font-semibold text-sm flex-shrink-0">
              $42.990
            </div>
          </div>

          <div className="flex items-start justify-between px-4 py-4 border-b border-neutral-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {isPickup
                  ? <MdOutlineStorefront size={16} className="text-neutral-600" />
                  : <MdOutlineLocalShipping size={16} className="text-neutral-600" />
                }
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {isPickup
                    ? 'Retiro en tienda'
                    : `${shippingData?.carrier?.toUpperCase() ?? 'Envío'} · ${shippingData?.service ?? ''}`}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 max-w-[200px]">
                  {addressLine}
                </div>
                {shippingData?.recipientName && (
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Para: {shippingData.recipientName}
                  </div>
                )}
              </div>
            </div>
            <div className={`font-semibold text-sm flex-shrink-0 ${shipCost === 0 ? 'text-green-600' : ''}`}>
              {shipCost === 0 ? 'Gratis' : `$${shipCost.toLocaleString('es-AR')}`}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-4 bg-white">
            <span className="font-black text-neutral-900">Total a pagar</span>
            <span className="font-black text-xl text-neutral-900">${total.toLocaleString('es-AR')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4"
        >
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
            Métodos de pago aceptados
          </div>
          <div className="flex flex-wrap gap-2">
            <PaymentBadge icon={FiCreditCard}  label="Tarjeta crédito" />
            <PaymentBadge icon={BsBank2}        label="Tarjeta débito" />
            <PaymentBadge icon={FiSmartphone}  label="Cuenta MP" />
            <PaymentBadge icon={FiDollarSign}  label="Transferencia" />
            <PaymentBadge icon={FiShoppingBag} label="Efectivo" />
          </div>
          <p className="mt-3 text-[11px] text-neutral-400 leading-relaxed">
            Hasta 12 cuotas sin interés según banco. Procesamiento seguro a cargo de Mercado Pago.
          </p>
        </motion.div>

        {shippingData?.recipientName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="flex items-center gap-3 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl"
          >
            <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
              <FiUser size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400">
                {isPickup ? 'Retira' : 'Destinatario'}
              </div>
              <div className="font-semibold text-sm text-neutral-900 truncate mt-0.5">
                {shippingData.recipientName}
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] font-bold text-neutral-900 underline underline-offset-4 flex-shrink-0"
            >
              Editar
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
          >
            <FiAlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">{error}</p>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="text-[11px] text-neutral-400 text-center leading-relaxed px-4"
        >
          Al confirmar aceptás los{' '}
          <a href="/terminos" className="underline underline-offset-2 hover:text-neutral-700">
            términos y condiciones
          </a>{' '}
          de Club Huella. Los diseños son únicos e irrepetibles.
        </motion.p>

      </div>

      <div className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur z-30">
        <div className="max-w-2xl mx-auto space-y-3">
          <PrimaryButton onClick={handlePay} loading={loading}>
            {!loading && (
              <>
                {/* ✅ Logo importado desde archivo local */}
                <img
                  src={MercadoLogo}
                  alt="Mercado Pago"
                  className="w-9 h-9 object-contain flex-shrink-0"
                />
                Pagar ${total.toLocaleString('es-AR')} con Mercado Pago
              </>
            )}
          </PrimaryButton>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full text-center text-sm font-semibold text-neutral-400 hover:text-neutral-700 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
          >
            <FiArrowLeft size={14} />
            Volver al envío
          </button>
          <SecurityBadge />
        </div>
      </div>

    </div>
  );
};

export default PaymentStep;