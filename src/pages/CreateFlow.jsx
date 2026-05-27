import React, { useState,useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================================
   CONFIG
   ============================================================ */

const API_URL = 'https://clubhuella.com/disenos.php';
const SERVER_BASE_URL = 'https://clubhuella.com';

// Timeout en ms para la generación (2.5 min — Gemini puede tardar)
const GENERATION_TIMEOUT_MS = 150_000;

const STEPS = [
  { id: 'style',      label: 'Estilo' },
  { id: 'name',       label: 'Nombre' },
  { id: 'size',       label: 'Talle' },
  { id: 'upload',     label: 'Foto' },
  { id: 'summary',    label: 'Resumen' },
  { id: 'generating', label: 'Generando' },
  { id: 'result',     label: 'Resultado' },
];

const STYLES = [
  { slug: 'vogue',       name: 'Vogue',       tag: 'Editorial',  desc: 'Portada de revista. Limpio, tipográfico.' },
  { slug: 'retro',       name: 'Retro',       tag: '90s',        desc: 'Colores lavados, energía vintage.' },
  { slug: 'streetwear',  name: 'Streetwear',  tag: 'Urbano',     desc: 'Tipografías gruesas, actitud.' },
  { slug: 'college',     name: 'College',     tag: 'Varsity',    desc: 'Arcos, año de fundación.' },
  { slug: 'collage',     name: 'Collage',     tag: 'Mixed',      desc: 'Múltiples tomas, recortes, capas.' },
  { slug: 'minimal',     name: 'Minimal',     tag: 'Línea',      desc: 'Un trazo. Cero ruido.' },
  { slug: 'anime',       name: 'Anime',       tag: 'Kawaii',     desc: 'Ilustración japonesa.' },
  { slug: 'rap-tee',     name: 'Rap Tee',     tag: 'Bootleg',    desc: 'Bordes ardientes. 90s.' },
];

const SIZES = [
  { id: 'S',  chest: '54cm', length: '70cm' },
  { id: 'M',  chest: '56cm', length: '72cm' },
  { id: 'L',  chest: '58cm', length: '74cm' },
  { id: 'XL', chest: '60cm', length: '76cm' },
];

const PRICE = 42990;

/* ============================================================
   API CLIENT
   ============================================================ */

async function apiRequest(path, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (networkErr) {
    clearTimeout(timerId);
    if (networkErr.name === 'AbortError') {
      throw new Error('La generación tardó demasiado. El servidor puede estar ocupado. Intentá de nuevo.');
    }
    console.error('[apiRequest] network error:', networkErr);
    throw new Error(
      'No pudimos conectar con el servidor. Revisá tu conexión o intentá más tarde.'
    );
  }

  clearTimeout(timerId);

  // Capturar el texto crudo antes de parsear para poder debuggear
  const rawText = await response.text();

  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch {
    console.error('[apiRequest] respuesta no es JSON:', rawText.slice(0, 500));
    if (!response.ok) {
      throw new Error(`Error ${response.status}: el servidor devolvió una respuesta inesperada.`);
    }
    // Si el status es ok pero no es JSON, algo raro pasó
    throw new Error('El servidor devolvió una respuesta inesperada. Revisá los logs del servidor.');
  }

  if (!response.ok || (json && json.error)) {
    const errMsg = json?.error || `Error ${response.status}`;
    console.error('[apiRequest] error response:', json);
    throw new Error(errMsg);
  }

  return json;
}

/* ============================================================
   UTILS — Resuelve la URL de la imagen generada
   ============================================================ */

function resolveImageSrc(imagenGenerada, imagenUrl) {
  if (imagenGenerada && imagenGenerada.startsWith('data:')) {
    return imagenGenerada;
  }
  if (imagenGenerada && imagenGenerada.length > 0) {
    // Puede ser una ruta relativa
    return `${SERVER_BASE_URL}/${imagenGenerada}`;
  }
  if (imagenUrl) {
    return `${SERVER_BASE_URL}/${imagenUrl}`;
  }
  return null;
}

/* ============================================================
   UTILS — iOS / archivos
   ============================================================ */

async function fileToCompressedDataURL(file, maxSize = 1600, quality = 0.9) {
  let bitmap = null;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    bitmap = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });

    if (!bitmap) {
      return { dataUrl, fileName: file.name, size: file.size };
    }
  }

  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  return {
    dataUrl,
    fileName: file.name.replace(/\.[^.]+$/, '.jpg'),
    size: dataUrl.length,
  };
}

/* ============================================================
   PROGRESS BAR
   ============================================================ */
const ProgressBar = ({ current, total, onBack, onClose }) => {
  const pct = ((current + 1) / total) * 100;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-b border-neutral-100">
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            disabled={current === 0}
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full disabled:opacity-30 hover:bg-neutral-100 transition"
            aria-label="Anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-neutral-500">
            Paso {current + 1} <span className="text-neutral-300">/</span> {total}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="h-[3px] w-full bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neutral-900 rounded-full"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </header>
  );
};

/* ============================================================
   STEP LAYOUT
   ============================================================ */
const StepLayout = ({ eyebrow, title, subtitle, children, footer }) => (
  <div className="min-h-[100dvh] flex flex-col pt-24 pb-6 px-5 max-w-2xl mx-auto w-full">
    <div className="mb-7">
      {eyebrow && (
        <span className="block text-[11px] font-bold tracking-[0.25em] uppercase text-neutral-500 mb-3">
          {eyebrow}
        </span>
      )}
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 leading-[1.05]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-neutral-500 text-[15px] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>

    <div className="flex-1 flex flex-col">{children}</div>

    {footer && (
      <div className="pt-6 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent">
        {footer}
      </div>
    )}
  </div>
);

const PrimaryButton = ({ children, onClick, disabled, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full h-14 rounded-full bg-neutral-900 text-white font-semibold text-[15px] tracking-wide flex items-center justify-center gap-2 disabled:bg-neutral-200 disabled:text-neutral-400 hover:bg-neutral-800 active:scale-[0.985] transition"
  >
    {children}
  </button>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ============================================================
   STEP 1 — ESTILO
   ============================================================ */
const StyleStep = ({ value, onChange, onNext }) => (
  <StepLayout
    eyebrow="01 · Estilo visual"
    title="Elegí tu vibe."
    subtitle="Cada estilo cambia completamente la energía del diseño."
    footer={
      <PrimaryButton onClick={onNext} disabled={!value}>
        Continuar <ArrowRight />
      </PrimaryButton>
    }
  >
    <div className="grid grid-cols-2 gap-3">
      {STYLES.map((s, i) => {
        const active = value === s.slug;
        return (
          <motion.button
            key={s.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.035, duration: 0.4, ease: 'easeOut' }}
            onClick={() => onChange(s.slug)}
            className={`group relative text-left rounded-2xl overflow-hidden border transition-all ${
              active
                ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-2'
                : 'border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="aspect-[4/5] bg-white relative overflow-hidden">
              <div className="absolute inset-4 bg-white border border-neutral-200 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-neutral-900 text-[10px] tracking-[0.28em] uppercase font-black">
                  {s.name}
                </span>
                <span className="mt-2 w-10 h-[1px] bg-neutral-300" />
                <span className="mt-2 text-neutral-400 text-[8px] tracking-[0.25em] uppercase font-bold">
                  Pet Edition
                </span>
              </div>
              <div className="absolute top-3 left-3 bg-neutral-900 text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
                {s.tag}
              </div>
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-neutral-900 rounded-full flex items-center justify-center"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                </motion.div>
              )}
            </div>
            <div className="p-3 bg-white">
              <div className="font-bold text-sm tracking-tight">{s.name}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                {s.desc}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  </StepLayout>
);

/* ============================================================
   STEP 2 — NOMBRE
   ============================================================ */
const NameStep = ({ value, onChange, onNext }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <StepLayout
      eyebrow="02 · Tu mascota"
      title="¿Cómo se llama?"
      subtitle="Vamos a usar el nombre integrado en el diseño."
      footer={
        <PrimaryButton onClick={onNext} disabled={!value.trim()}>
          Continuar <ArrowRight />
        </PrimaryButton>
      }
    >
      <div className="flex-1 flex flex-col justify-center pb-10">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && value.trim() && onNext()}
            placeholder="Ej. Milanesa"
            maxLength={20}
            className="w-full bg-transparent border-0 border-b-2 border-neutral-200 focus:border-neutral-900 outline-none text-4xl md:text-5xl font-black tracking-tight pb-4 placeholder:text-neutral-300 transition-colors"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
            <span>Solo letras y espacios</span>
            <span>{value.length}/20</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: value ? 1 : 0 }}
          className="mt-10 p-5 bg-neutral-50 rounded-2xl"
        >
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-2">
            Así se verá
          </div>
          <div className="font-black text-2xl tracking-tight text-neutral-900 uppercase">
            {value || '—'}
          </div>
        </motion.div>
      </div>
    </StepLayout>
  );
};

/* ============================================================
   STEP 3 — TALLE
   ============================================================ */
const SizeStep = ({ value, onChange, onNext }) => (
  <StepLayout
    eyebrow="03 · Calce"
    title="Elegí tu talle."
    subtitle="Fit oversized. Si dudás entre dos, andá por el más chico."
    footer={
      <PrimaryButton onClick={onNext} disabled={!value}>
        Continuar <ArrowRight />
      </PrimaryButton>
    }
  >
    <div className="space-y-2.5">
      {SIZES.map((s, i) => {
        const active = value === s.id;
        return (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            onClick={() => onChange(s.id)}
            className={`w-full px-5 py-5 rounded-2xl border transition-all flex items-center justify-between text-left ${
              active
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-5">
              <span className="text-3xl font-black tracking-tight w-10">{s.id}</span>
              <div>
                <div className={`text-[11px] font-bold tracking-[0.2em] uppercase ${active ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Pecho · Largo
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {s.chest} · {s.length}
                </div>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
              active ? 'border-white bg-white' : 'border-neutral-300'
            }`}>
              {active && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                  <path d="M5 12l5 5 9-11" />
                </svg>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  </StepLayout>
);

/* ============================================================
   STEP 4 — UPLOAD
   ============================================================ */
const UploadStep = ({ value, onChange, onNext }) => {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError('');

    const looksLikeImage =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);

    if (!looksLikeImage) {
      setError('Ese archivo no parece una imagen.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('La imagen es muy pesada (máx 25MB).');
      return;
    }

    setLoading(true);
    try {
      const result = await fileToCompressedDataURL(file, 1600, 0.9);
      onChange({
        file,
        preview: result.dataUrl,
        name: result.fileName,
      });
    } catch (err) {
      console.error(err);
      setError('No pudimos procesar la imagen. Probá con otra foto.');
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <StepLayout
      eyebrow="04 · Foto de tu mascota"
      title="Subí una foto."
      subtitle="Buena luz, fondo simple y la cara visible."
      footer={
        <PrimaryButton onClick={onNext} disabled={!value || loading}>
          {loading ? 'Procesando...' : 'Continuar'}
          {!loading && <ArrowRight />}
        </PrimaryButton>
      }
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !value && !loading && fileRef.current?.click()}
        className={`relative aspect-square w-full rounded-3xl border-2 border-dashed transition-all overflow-hidden ${
          loading ? 'border-neutral-400 bg-neutral-50' :
          drag    ? 'border-neutral-900 bg-neutral-50 scale-[0.99]' :
          value   ? 'border-neutral-900' :
                    'border-neutral-300 hover:border-neutral-500 bg-neutral-50 cursor-pointer'
        }`}
      >
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-900 rounded-full" />
            <div className="mt-4 text-sm font-semibold">Procesando imagen...</div>
          </div>
        ) : value ? (
          <>
            <img src={value.preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold tracking-wide hover:bg-white">
              Cambiar
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M12 16V4M5 11l7-7 7 7M4 20h16" />
              </svg>
            </div>
            <div className="font-bold text-base">Subí una foto</div>
            <div className="text-xs text-neutral-500 mt-1">JPG · PNG · HEIC (iPhone) · hasta 25MB</div>
          </div>
        )}
      </div>

      {!value && !loading && (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => fileRef.current?.click()} className="h-12 rounded-full border border-neutral-300 bg-white text-sm font-semibold hover:border-neutral-900 transition flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 15l-5-5L5 19" /></svg>
            Galería
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()} className="h-12 rounded-full border border-neutral-300 bg-white text-sm font-semibold hover:border-neutral-900 transition flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h3l2-3h8l2 3h3v12H3z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Cámara
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">{error}</div>
      )}
    </StepLayout>
  );
};

/* ============================================================
   STEP 5 — SUMMARY
   ============================================================ */
const SummaryStep = ({ data, onNext, onEdit }) => {
  const styleName = STYLES.find((s) => s.slug === data.style)?.name || '—';

  const rows = [
    { label: 'Estilo',  value: styleName,                step: 0 },
    { label: 'Nombre',  value: data.name,                step: 1 },
    { label: 'Talle',   value: data.size,                step: 2 },
    { label: 'Foto',    value: data.photo?.name || '—',  step: 3 },
  ];

  return (
    <StepLayout
      eyebrow="05 · Confirmar"
      title="Revisá antes de generar."
      subtitle="Cuando confirmes, nuestra IA creará tu diseño. Puede tardar hasta 2 minutos."
      footer={
        <PrimaryButton onClick={onNext}>
          Generar diseño
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
          </svg>
        </PrimaryButton>
      }
    >
      {data.photo && (
        <div className="mb-5 aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-100">
          <img src={data.photo.preview} alt="Tu mascota" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-neutral-50 rounded-2xl divide-y divide-neutral-200">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between p-4">
            <div>
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-500">{r.label}</div>
              <div className="font-semibold mt-0.5 truncate max-w-[180px]">{r.value}</div>
            </div>
            <button onClick={() => onEdit(r.step)} className="text-xs font-bold text-neutral-900 underline underline-offset-4">
              Editar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 bg-neutral-900 text-white rounded-2xl flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <p className="text-xs leading-relaxed text-neutral-300">
          La generación es única e irrepetible. Si no te gusta el resultado, podés regenerarlo una vez sin costo.
        </p>
      </div>
    </StepLayout>
  );
};

/* ============================================================
   STEP 6 — GENERATING
   ============================================================ */
const GENERATION_PHASES = [
  'Analizando tu mascota',
  'Identificando raza y características',
  'Estudiando referencias del estilo',
  'Generando composición',
  'Limpiando el fondo blanco',
  'Preparando diseño final',
];

const GeneratingStep = ({ data, onDone, onError }) => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const calledRef = useRef(false);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase((p) => (p < GENERATION_PHASES.length - 1 ? p + 1 : p));
    }, 2200);

    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 0.35 : p));
    }, 80);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const fetchDesign = async () => {
      try {
        const json = await apiRequest(
          '?recurso=generar',
          {
            method: 'POST',
            body: JSON.stringify({
              estilo: data.style,
              nombre: data.name,
              talle:  data.size,
              imagen: data.photo.preview,
            }),
          },
          GENERATION_TIMEOUT_MS
        );

        // Verificar que la respuesta tiene imagen
        if (!json.imagen_generada && !json.imagen_url) {
          throw new Error('El servidor no devolvió imagen. Intentá de nuevo.');
        }

        setProgress(100);
        setTimeout(() => onDone(json), 600);
      } catch (err) {
        console.error('[GeneratingStep] error:', err);
        onError(err.message || 'Error generando el diseño. Intentá de nuevo.');
      }
    };

    fetchDesign();
  }, [data, onDone, onError]);

  return (
    <div className="fixed inset-0 bg-white text-neutral-900 flex flex-col z-50 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #f5f5f5 0%, transparent 50%), radial-gradient(circle at 80% 70%, #eeeeee 0%, transparent 50%)`,
        }}
      />

      <div className="flex-1 flex items-center justify-center relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-48 h-48"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-100 via-neutral-200 to-white blur-2xl opacity-80" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-white to-neutral-200 blur-xl opacity-90" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute inset-8 rounded-full border border-neutral-200" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} className="absolute inset-12 rounded-full border border-neutral-300" />
        </motion.div>
      </div>

      <div className="p-8 pb-12 max-w-md mx-auto w-full">
        <div className="mb-6">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
            Creando algo único
          </div>
          <AnimatePresence mode="wait">
            <motion.h2
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-2xl md:text-3xl font-black tracking-tight"
            >
              {GENERATION_PHASES[phase]}<span className="text-neutral-400">.</span>
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="h-[2px] w-full bg-neutral-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-neutral-900 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="mt-3 flex justify-between text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">
          <span>Procesando</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   STEP 7 — RESULT
   ============================================================ */
const ResultStep = ({ data, generated, onRegenerate, onBuy, regenerating }) => {
  const styleName = STYLES.find((s) => s.slug === data.style)?.name || '—';

  const imageSrc = resolveImageSrc(
    generated?.imagen_generada,
    generated?.imagen_url
  );

  return (
    <div className="min-h-[100dvh] pt-24 pb-32 px-5 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-2 text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-500">
          ✦ Diseño único · No reproducible
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.02]">
          {data.name?.toUpperCase() || 'TU MASCOTA'}
          <br />
          <span className="italic font-serif font-light text-neutral-500">edición {styleName.toLowerCase()}.</span>
        </h1>

        {(generated?.especie || generated?.raza) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {generated.especie && generated.especie !== 'otro' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold tracking-wide uppercase text-neutral-600">
                {generated.especie === 'perro' ? '🐕' : '🐈'} {generated.especie}
              </span>
            )}
            {generated.raza && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold tracking-wide uppercase text-neutral-600">
                {generated.raza}
              </span>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 w-full bg-white border border-neutral-200 rounded-3xl overflow-hidden relative shadow-sm"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`Diseño de ${data.name}`}
            className="w-full h-auto block"
            onError={(e) => {
              // Si falla la URL, intentar con data base64 si está disponible
              console.error('Error cargando imagen desde URL, revisando fallback...');
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="aspect-square w-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-neutral-500 text-sm mb-2">No se pudo cargar la imagen.</div>
              <div className="text-neutral-600 text-xs">El diseño fue generado pero no se pudo mostrar. Intentá regenerar.</div>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-neutral-900 text-white backdrop-blur rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase">
          Listo
        </div>

        {regenerating && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full" />
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-7"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-500">Remera oversized · Negra</div>
            <div className="text-3xl font-black mt-1">${PRICE.toLocaleString('es-AR')}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-500">Talle</div>
            <div className="font-black text-2xl mt-1">{data.size}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { l: 'Estilo',  v: styleName },
            { l: 'Tela',    v: 'Algodón 240g' },
            { l: 'Estampa', v: 'DTF premium' },
            { l: 'Envío',   v: '3 a 5 días' },
          ].map((d) => (
            <div key={d.l} className="p-4 bg-neutral-50 rounded-2xl">
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-500">{d.l}</div>
              <div className="text-sm font-semibold mt-1">{d.v}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="mt-6 w-full text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 disabled:opacity-50 transition"
        >
          {regenerating ? 'Regenerando...' : '↻ Regenerar diseño (1 gratis)'}
        </button>
      </motion.div>

      <div className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur">
        <div className="max-w-2xl mx-auto">
          <PrimaryButton onClick={onBuy}>
            Agregar — ${PRICE.toLocaleString('es-AR')}
            <ArrowRight />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ERROR SCREEN
   ============================================================ */
const ErrorScreen = ({ message, onRetry, onClose }) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
    </div>
    <h2 className="text-2xl font-black tracking-tight mb-2">Algo falló.</h2>
    <p className="text-neutral-500 text-sm max-w-sm leading-relaxed mb-8">
      {message || 'No pudimos generar tu diseño. Probemos otra vez.'}
    </p>
    <div className="flex gap-3 w-full max-w-xs">
      <button onClick={onClose} className="flex-1 h-12 rounded-full border border-neutral-300 font-semibold text-sm">
        Cerrar
      </button>
      <button onClick={onRetry} className="flex-1 h-12 rounded-full bg-neutral-900 text-white font-semibold text-sm">
        Reintentar
      </button>
    </div>
  </div>
);

/* ============================================================
   CREATE FLOW — controlador principal
   ============================================================ */
const slideVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.3 } }),
};

const CreateFlow = ({ initialStyle = '', onClose = () => {} }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState({
    style: initialStyle,
    name: '',
    size: '',
    photo: null,
  });
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const goTo = useCallback((i) => {
    setDirection(i > stepIndex ? 1 : -1);
    setStepIndex(i);
  }, [stepIndex]);

  const nextStep = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setDirection(1);
      setStepIndex((s) => s + 1);
    }
  }, [stepIndex]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((s) => s - 1);
    } else {
      onClose();
    }
  }, [stepIndex, onClose]);

  const update = (key) => (value) => setData((d) => ({ ...d, [key]: value }));

  const handleGenerated = useCallback((result) => {
    setGenerated(result);
    setDirection(1);
    setStepIndex(STEPS.findIndex((s) => s.id === 'result'));
  }, []);

  const handleError = useCallback((msg) => {
    setError(msg);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!generated?.id) return;
    setRegenerating(true);
    try {
      const json = await apiRequest(
        `?recurso=regenerar&id=${generated.id}`,
        { method: 'POST' },
        GENERATION_TIMEOUT_MS
      );
      setGenerated((g) => ({ ...g, ...json }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }, [generated]);

  const handleRetry = () => {
    setError(null);
    setStepIndex(STEPS.findIndex((s) => s.id === 'summary'));
  };

  const currentStep = STEPS[stepIndex].id;
  const showProgress = currentStep !== 'generating' && currentStep !== 'result' && !error;

  const screen = useMemo(() => {
    if (error) {
      return <ErrorScreen message={error} onRetry={handleRetry} onClose={onClose} />;
    }

    switch (currentStep) {
      case 'style':
        return <StyleStep value={data.style} onChange={update('style')} onNext={nextStep} />;
      case 'name':
        return <NameStep value={data.name} onChange={update('name')} onNext={nextStep} />;
      case 'size':
        return <SizeStep value={data.size} onChange={update('size')} onNext={nextStep} />;
      case 'upload':
        return <UploadStep value={data.photo} onChange={update('photo')} onNext={nextStep} />;
      case 'summary':
        return <SummaryStep data={data} onNext={nextStep} onEdit={goTo} />;
      case 'generating':
        return <GeneratingStep data={data} onDone={handleGenerated} onError={handleError} />;
      case 'result':
        return (
          <ResultStep
            data={data}
            generated={generated}
            onRegenerate={handleRegenerate}
            onBuy={onClose}
            regenerating={regenerating}
          />
        );
      default:
        return null;
    }
  }, [currentStep, data, generated, error, regenerating, nextStep, goTo, onClose, handleGenerated, handleError, handleRegenerate]);

  return (
    <div className="min-h-[100dvh] bg-white text-neutral-900 font-sans antialiased">
      {showProgress && (
        <ProgressBar
          current={stepIndex}
          total={STEPS.length}
          onBack={prevStep}
          onClose={onClose}
        />
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={error ? 'error' : currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {screen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreateFlow;