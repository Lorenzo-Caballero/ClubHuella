import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config/env';
import { trackPixelEventOnce } from '../lib/metaPixel';
import usePageMeta from '../hooks/usePageMeta';

/* ============================================================
   GRACIAS — página de retorno del checkout de Mercado Pago
   ------------------------------------------------------------
   Mercado Pago (Checkout Pro) redirige acá según cómo esté
   configurado `back_urls` en el backend (payments_envios.php,
   fuera de este repo). Lee los query params estándar que MP
   agrega automáticamente:
     ?status=approved|pending|rejected...
     &payment_id=...
     &external_reference=...
     &merchant_order_id=...

   Para que el evento "Purchase" de Meta Pixel tenga el monto real,
   el backend debería agregar además `&total=<monto>` (y opcional
   `&pedido_id=<id>`) al armar la success back_url. Si no están,
   igual trackeamos Purchase (sin value) para no perder el evento,
   y probamos completar el monto pidiéndolo a pedidos.php.
   ============================================================ */

function StatusIcon({ variant }) {
  if (variant === 'success') {
    return (
      <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4">
          <path d="M5 12l5 5 9-11" />
        </svg>
      </div>
    );
  }
  if (variant === 'pending') {
    return (
      <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 3" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M6 6l12 12M18 6l-6 6-6 6" />
      </svg>
    </div>
  );
}

const Gracias = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderTotal, setOrderTotal] = useState(null);

  const status = (searchParams.get('status') || searchParams.get('collection_status') || '').toLowerCase();
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id') || '';
  const externalReference = searchParams.get('external_reference') || '';
  const merchantOrderId = searchParams.get('merchant_order_id') || '';
  const pedidoId = searchParams.get('pedido_id') || externalReference || '';
  const totalParam = searchParams.get('total');

  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'in_process';
  const isFailure = status === 'rejected' || status === 'failure' || status === 'cancelled';
  const hasStatus = isApproved || isPending || isFailure;

  const variant = isApproved ? 'success' : isPending ? 'pending' : 'failure';

  usePageMeta({
    title: isApproved
      ? '¡Gracias por tu compra! | Club Huella'
      : isPending
        ? 'Pago en revisión | Club Huella'
        : 'Resultado de tu pago | Club Huella',
    // Página transaccional (retorno de Mercado Pago): sin valor de búsqueda,
    // se excluye del índice para no competir con las páginas de contenido.
    robots: 'noindex, nofollow',
  });

  // Dedupe key: preferimos payment_id (único por transacción de MP);
  // si no viniera, usamos merchant_order_id o pedido_id como respaldo.
  const dedupeId = paymentId || merchantOrderId || pedidoId;

  // Best-effort: si el backend no mandó ?total=, intentamos completar el
  // monto real consultando la API de pedidos de este repo. Si falla o el
  // pedido no existe con ese id, seguimos igual: el Purchase se trackea
  // sin `value` antes que no trackearse.
  useEffect(() => {
    if (totalParam || !pedidoId || !/^\d+$/.test(pedidoId)) return;
    let cancelled = false;

    fetch(`${API_BASE_URL}/backend/api/pedidos.php?id=${pedidoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.total) setOrderTotal(Number(data.total));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [pedidoId, totalParam]);

  useEffect(() => {
    if (!isApproved || !dedupeId) return;

    const value = totalParam ? Number(totalParam) : orderTotal ?? undefined;

    trackPixelEventOnce('Purchase', dedupeId, {
      value,
      currency: 'ARS',
      content_type: 'product',
      order_id: pedidoId || merchantOrderId || paymentId,
    });
  }, [isApproved, dedupeId, totalParam, orderTotal, pedidoId, merchantOrderId, paymentId]);

  const heading = useMemo(() => {
    if (isApproved) return '¡Listo! Tu pedido está en marcha.';
    if (isPending) return 'Tu pago está en revisión.';
    if (isFailure) return 'No pudimos procesar el pago.';
    return '¡Gracias!';
  }, [isApproved, isPending, isFailure]);

  const message = useMemo(() => {
    if (isApproved) return 'Ya recibimos tu pago. Te avisamos por WhatsApp o email cuando tu remera entre en producción.';
    if (isPending) return 'Mercado Pago está confirmando tu pago. Te avisamos apenas se acredite — no hace falta que hagas nada más.';
    if (isFailure) return 'El pago no se completó. Podés intentarlo de nuevo cuando quieras, tu diseño sigue guardado.';
    return 'Volviste de Mercado Pago. Si acabás de pagar, en unos minutos vas a recibir la confirmación.';
  }, [isApproved, isPending, isFailure]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center max-w-sm"
      >
        <StatusIcon variant={variant} />

        <h1 className="text-2xl font-black tracking-tight mb-2">{heading}</h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-8">{message}</p>

        {(paymentId || pedidoId) && (
          <div className="mb-8 px-4 py-2 rounded-full bg-neutral-100 text-[11px] font-bold tracking-wide text-neutral-500">
            Pedido #{pedidoId || paymentId}
          </div>
        )}

        <div className="flex gap-3 w-full">
          {isFailure ? (
            <button
              onClick={() => navigate('/crear?paso=envio')}
              className="flex-1 h-12 rounded-full bg-neutral-900 text-white font-semibold text-sm"
            >
              Reintentar pago
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="flex-1 h-12 rounded-full bg-neutral-900 text-white font-semibold text-sm"
            >
              Volver a la tienda
            </button>
          )}
        </div>

        {!hasStatus && (
          <p className="mt-6 text-[11px] text-neutral-400 leading-relaxed">
            Si tenés dudas sobre tu compra, escribinos y te ayudamos.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Gracias;
