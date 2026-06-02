import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage,
  FiMapPin,
  FiAlertCircle,
  FiArrowLeft,
  FiGift,
  FiTruck,
} from 'react-icons/fi';
import { MdOutlineStorefront } from 'react-icons/md';

/* ============================================================
   SHIPPING STEP — Club Huella
   
   Flujo:
     1. Usuario elige Envío a domicilio  → completa form → cotiza → elige carrier → onNext()
     2. Usuario elige Retiro en tienda   → completa nombre → onNext() (sin cotización)

   Props:
     data         → { style, name, color, size, photo }
     generated    → resultado de la API (id, imagen_generada, etc.)
     onNext       → fn(shippingData) — avanza al PaymentStep
     onBack       → fn() — vuelve al ResultStep
   ============================================================ */

const PRICE_TSHIRT = 42990;
const RATE_URL     = 'https://clubhuella.com/payments_envios.php?action=rate';

/* ── UI Primitives ─────────────────────────────────────────── */

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
        Cotizando envío...
      </>
    ) : children}
  </button>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ── Field / Input ─────────────────────────────────────────── */

const Field = ({ label, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-bold tracking-[0.22em] uppercase text-neutral-500">
        {label}
      </label>
      {hint && <span className="text-[10px] text-neutral-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputCls =
  'w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:bg-white outline-none rounded-2xl px-4 py-3.5 text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 transition-colors';

const Input = React.forwardRef(({ value, onChange, placeholder, type = 'text', maxLength, inputMode }, ref) => (
  <input
    ref={ref}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    maxLength={maxLength}
    inputMode={inputMode}
    className={inputCls}
  />
));
Input.displayName = 'Input';

/* ── Selector de método de envío ───────────────────────────── */

const ShippingOption = ({ id, selected, onClick, icon: Icon, title, subtitle, badge }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`flex-1 relative flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 transition-all text-center ${
      selected
        ? 'border-neutral-900 bg-neutral-900 text-white'
        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
    }`}
  >
    <Icon
      size={24}
      className={selected ? 'text-white' : 'text-neutral-600'}
    />
    <div>
      <div className={`font-bold text-sm tracking-tight ${selected ? 'text-white' : 'text-neutral-900'}`}>
        {title}
      </div>
      <div className={`text-[11px] mt-0.5 ${selected ? 'text-neutral-400' : 'text-neutral-500'}`}>
        {subtitle}
      </div>
    </div>
    {badge && (
      <span className={`absolute top-2.5 right-2.5 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
        selected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
      }`}>
        {badge}
      </span>
    )}
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-2.5 left-2.5 w-5 h-5 bg-white rounded-full flex items-center justify-center"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5">
          <path d="M5 12l5 5 9-11" />
        </svg>
      </motion.div>
    )}
  </button>
);

/* ── Carrier Card (resultado de cotización) ────────────────── */

const CarrierCard = ({ carrier, selected, onClick }) => {
  const label = `${carrier.carrier?.toUpperCase() ?? '—'} · ${carrier.service ?? ''}`;
  const days  = carrier.estimatedDelivery ?? '3 a 5 días hábiles';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
        selected
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-200 bg-white hover:border-neutral-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          selected ? 'bg-white/10' : 'bg-neutral-100'
        }`}>
          <FiTruck
            size={18}
            className={selected ? 'text-white' : 'text-neutral-500'}
          />
        </div>
        <div>
          <div className={`font-bold text-sm tracking-tight ${selected ? 'text-white' : 'text-neutral-900'}`}>
            {label}
          </div>
          <div className={`text-[11px] mt-0.5 ${selected ? 'text-neutral-400' : 'text-neutral-500'}`}>
            {days}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`font-black text-base ${selected ? 'text-white' : 'text-neutral-900'}`}>
          ${Number(carrier.price).toLocaleString('es-AR')}
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
          selected ? 'border-white bg-white' : 'border-neutral-300'
        }`}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5">
              <path d="M5 12l5 5 9-11" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};

/* ── Vista retiro en tienda ────────────────────────────────── */

const StorePickupView = () => (
  <div className="space-y-4">
    <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-50">
      {/* mapa decorativo */}
      <div className="relative h-36 bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 144">
          {[18, 54, 90, 126].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#555" strokeWidth="1" />
          ))}
          {[40, 90, 140, 190, 240, 290, 340].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="144" stroke="#555" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-neutral-900 shadow-xl flex items-center justify-center">
            <FiMapPin size={20} className="text-white" />
          </div>
          <span className="bg-white text-neutral-900 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
            Club Huella
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-2">Punto de retiro</div>
        <div className="font-black text-lg tracking-tight text-neutral-900">Club Huella</div>
        <div className="text-sm text-neutral-600 mt-1">
          Av. Héctor Jara 22, Mar del Plata<br />Buenos Aires, Argentina
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[11px] font-bold text-neutral-700">Lunes a viernes · 10 a 19 hs</span>
        </div>
        <a
          href="https://maps.google.com/?q=Av.+Héctor+Jara+22,+Mar+del+Plata"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition"
        >
          <FiMapPin size={13} />
          Ver en Google Maps
        </a>
      </div>
    </div>

    {/* Sin costo de envío */}
    <div className="p-4 bg-neutral-900 text-white rounded-2xl flex items-start gap-3">
      <FiGift size={18} className="text-white flex-shrink-0 mt-0.5" />
      <div>
        <div className="text-[11px] font-black tracking-wide">Sin costo de envío</div>
        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
          Retirá gratis. Te avisamos por WhatsApp cuando esté lista (2–3 días hábiles).
        </p>
      </div>
    </div>
  </div>
);

/* ── Resumen de precio ─────────────────────────────────────── */

const PriceSummary = ({ shipCost }) => {
  const total = PRICE_TSHIRT + (shipCost ?? 0);
  return (
    <div className="bg-neutral-50 rounded-2xl divide-y divide-neutral-200 border border-neutral-200">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm text-neutral-600">Remera personalizada</span>
        <span className="text-sm font-semibold">${PRICE_TSHIRT.toLocaleString('es-AR')}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm text-neutral-600">Envío</span>
        <span className={`text-sm font-semibold ${!shipCost ? 'text-green-600' : ''}`}>
          {shipCost == null ? '—' : shipCost === 0 ? 'Gratis' : `$${shipCost.toLocaleString('es-AR')}`}
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-black text-neutral-900">Total</span>
        <span className="font-black text-lg text-neutral-900">
          {shipCost == null ? '—' : `$${total.toLocaleString('es-AR')}`}
        </span>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

const ShippingStep = ({ data, generated, onNext, onBack }) => {
  const [method, setMethod]                   = useState('domicilio');
  const [form, setForm]                       = useState({
    recipientName: '',
    phone:         '',
    street:        '',
    streetNumber:  '',
    apt:           '',
    extra:         '',
    postalCode:    '',
    city:          '',
    province:      '',
  });
  const [pickupName, setPickupName]           = useState('');
  const [rates, setRates]                     = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [rateLoading, setRateLoading]         = useState(false);
  const [rateError, setRateError]             = useState('');

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (['postalCode', 'city', 'street'].includes(key)) {
      setRates(null);
      setSelectedCarrier(null);
      setRateError('');
    }
  };

  const homeFormComplete =
    form.recipientName.trim() &&
    form.phone.trim() &&
    form.street.trim() &&
    form.streetNumber.trim() &&
    form.postalCode.trim().length >= 4 &&
    form.city.trim() &&
    form.province;

  const handleRate = useCallback(async () => {
    setRateLoading(true);
    setRateError('');
    setRates(null);
    setSelectedCarrier(null);

    try {
      const body = {
        cp:        form.postalCode.trim(),
        nombre:    form.recipientName.trim(),
        telefono:  form.phone.trim(),
        direccion: `${form.street.trim()} ${form.streetNumber.trim()}${form.apt ? ` ${form.apt}` : ''}`.trim(),
        ciudad:    form.city.trim(),
      };

      const res  = await fetch(RATE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No pudimos cotizar el envío. Verificá el código postal.');
      }
      if (!json.data?.length) {
        throw new Error('No hay opciones de envío para esa dirección.');
      }

      setRates(json.data);
    } catch (err) {
      setRateError(err.message);
    } finally {
      setRateLoading(false);
    }
  }, [form]);

  const canContinue =
    method === 'tienda'
      ? pickupName.trim().length > 0
      : homeFormComplete && selectedCarrier != null;

  const handleContinue = () => {
    if (method === 'tienda') {
      onNext({
        type:          'tienda',
        cost:          0,
        total:         PRICE_TSHIRT,
        recipientName: pickupName.trim(),
        pickupAddress: 'Av. Héctor Jara 22, Mar del Plata',
      });
    } else {
      const cost  = Math.round(selectedCarrier.price);
      const total = PRICE_TSHIRT + cost;
      onNext({
        type:          'domicilio',
        cost,
        total,
        carrier:       selectedCarrier.carrier,
        service:       selectedCarrier.service,
        recipientName: form.recipientName.trim(),
        phone:         form.phone.trim(),
        street:        form.street.trim(),
        streetNumber:  form.streetNumber.trim(),
        apt:           form.apt.trim(),
        extra:         form.extra.trim(),
        postalCode:    form.postalCode.trim(),
        city:          form.city.trim(),
        province:      form.province,
        address:       `${form.street} ${form.streetNumber}${form.apt ? ` ${form.apt}` : ''}, ${form.city}, ${form.province} (${form.postalCode})`,
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col pt-24 pb-44 px-5 max-w-2xl mx-auto w-full">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-7"
      >
        <span className="block text-[11px] font-bold tracking-[0.25em] uppercase text-neutral-500 mb-3">
          07 · Entrega
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 leading-[1.05]">
          ¿Cómo recibís<br />tu remera?
        </h1>
        <p className="mt-3 text-neutral-500 text-[15px] leading-relaxed">
          Elegí envío a domicilio o retiro en el local sin costo.
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col gap-6">

        {/* Tabs de método */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-3"
        >
          <ShippingOption
            id="domicilio"
            selected={method === 'domicilio'}
            onClick={setMethod}
            icon={FiPackage}
            title="Envío"
            subtitle="A tu puerta"
            badge="Cotizar"
          />
          <ShippingOption
            id="tienda"
            selected={method === 'tienda'}
            onClick={setMethod}
            icon={MdOutlineStorefront}
            title="Retiro"
            subtitle="En el local"
            badge="Gratis"
          />
        </motion.div>

        {/* Contenido por método */}
        <AnimatePresence mode="wait">
          {method === 'domicilio' ? (

            <motion.div
              key="domicilio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              {/* Destinatario */}
              <div>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  Destinatario
                </div>
                <div className="space-y-3">
                  <Field label="Nombre completo">
                    <Input
                      value={form.recipientName}
                      onChange={(e) => updateForm('recipientName', e.target.value)}
                      placeholder="Ej. Valentina García"
                      maxLength={60}
                    />
                  </Field>
                  <Field label="Teléfono">
                    <Input
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="Ej. 2235001234"
                      inputMode="tel"
                      maxLength={20}
                    />
                  </Field>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  Dirección de entrega
                </div>
                <div className="space-y-3">
                  <Field label="Calle">
                    <Input
                      value={form.street}
                      onChange={(e) => updateForm('street', e.target.value)}
                      placeholder="Ej. Av. Independencia"
                      maxLength={80}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número">
                      <Input
                        value={form.streetNumber}
                        onChange={(e) => updateForm('streetNumber', e.target.value)}
                        placeholder="1234"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </Field>
                    <Field label="Piso / Depto." hint="opcional">
                      <Input
                        value={form.apt}
                        onChange={(e) => updateForm('apt', e.target.value)}
                        placeholder="3° B"
                        maxLength={20}
                      />
                    </Field>
                  </div>

                  <Field label="Información adicional" hint="opcional">
                    <Input
                      value={form.extra}
                      onChange={(e) => updateForm('extra', e.target.value)}
                      placeholder="Entre calles, referencia, etc."
                      maxLength={120}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Código postal"
                      hint={
                        <a
                          href="http://www.correoargentino.com.ar/formularios/cpa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-900 underline underline-offset-2 font-semibold text-[10px]"
                        >
                          No sé mi CP
                        </a>
                      }
                    >
                      <Input
                        value={form.postalCode}
                        onChange={(e) => updateForm('postalCode', e.target.value)}
                        placeholder="7600"
                        inputMode="numeric"
                        maxLength={8}
                      />
                    </Field>
                    <Field label="Ciudad">
                      <Input
                        value={form.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        placeholder="Mar del Plata"
                        maxLength={60}
                      />
                    </Field>
                  </div>

                  <Field label="Provincia">
                    <div className="relative">
                      <select
                        value={form.province}
                        onChange={(e) => updateForm('province', e.target.value)}
                        className={`${inputCls} appearance-none pr-10`}
                      >
                        <option value="">Seleccioná...</option>
                        {[
                          'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
                          'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
                          'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz',
                          'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán',
                        ].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Botón cotizar */}
              {homeFormComplete && !rates && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PrimaryButton onClick={handleRate} loading={rateLoading} disabled={rateLoading}>
                    {!rateLoading && (
                      <>
                        <FiTruck size={17} />
                        Ver opciones de envío
                      </>
                    )}
                  </PrimaryButton>
                </motion.div>
              )}

              {/* Error cotización */}
              {rateError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
                >
                  <FiAlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{rateError}</p>
                    <button
                      type="button"
                      onClick={handleRate}
                      className="mt-2 text-[12px] font-bold text-red-700 underline underline-offset-2"
                    >
                      Reintentar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Resultados cotización */}
              {rates && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400">
                      Opciones de envío
                    </div>
                    <button
                      type="button"
                      onClick={() => { setRates(null); setSelectedCarrier(null); }}
                      className="text-[11px] font-bold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
                    >
                      Cambiar dirección
                    </button>
                  </div>
                  {rates.map((c, i) => (
                    <CarrierCard
                      key={`${c.carrier}-${c.service}-${i}`}
                      carrier={c}
                      selected={selectedCarrier?.carrier === c.carrier && selectedCarrier?.service === c.service}
                      onClick={() => setSelectedCarrier(c)}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>

          ) : (

            /* Retiro en tienda */
            <motion.div
              key="tienda"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <StorePickupView />
              <Field label="Tu nombre completo">
                <Input
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Ej. Valentina García"
                  maxLength={60}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resumen precio */}
        <PriceSummary
          shipCost={
            method === 'tienda'
              ? 0
              : selectedCarrier
                ? Math.round(selectedCarrier.price)
                : null
          }
        />

      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur z-30">
        <div className="max-w-2xl mx-auto space-y-3">
          <PrimaryButton onClick={handleContinue} disabled={!canContinue}>
            Ir al pago <ArrowRight />
          </PrimaryButton>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm font-semibold text-neutral-400 hover:text-neutral-700 transition flex items-center justify-center gap-1.5"
          >
            <FiArrowLeft size={14} />
            Volver al diseño
          </button>
        </div>
      </div>

    </div>
  );
};

export default ShippingStep;
export { PRICE_TSHIRT };