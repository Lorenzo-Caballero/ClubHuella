/* ============================================================
   Meta Pixel — helper de tracking
   ------------------------------------------------------------
   El pixel base (fbq + PageView) se carga en public/index.html.
   Este helper solo envuelve fbq('track', ...) de forma segura,
   por si el script no cargó (bloqueadores de ads, sin pixel ID
   configurado, etc.) para que nunca rompa el checkout.
   ============================================================ */

export function trackPixelEvent(eventName, params) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq('track', eventName, params);
  } catch (err) {
    console.error('[metaPixel] error trackeando', eventName, err);
  }
}

/**
 * Trackea un evento una sola vez por id (evita duplicar Purchase si el
 * usuario refresca la página de gracias o vuelve atrás/adelante).
 */
export function trackPixelEventOnce(eventName, dedupeId, params) {
  if (typeof window === 'undefined') return;
  const storageKey = `ch_pixel_${eventName}_${dedupeId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — trackeamos igual.
  }
  trackPixelEvent(eventName, params);
}
