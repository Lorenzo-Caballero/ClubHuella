/* ============================================================
   Meta Pixel — helper de tracking
   ------------------------------------------------------------
   El pixel base se carga en public/index.html.
   Este helper solo envuelve fbq('track', ...) de forma segura,
   por si el script no cargó (bloqueadores de ads, sin pixel ID
   configurado, etc.) para que nunca rompa el checkout.
   ============================================================ */

export function trackPixelEvent(eventName, params = {}, options) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return false;
  try {
    window.fbq('track', eventName, params, options);
    return true;
  } catch (err) {
    console.error('[metaPixel] error trackeando', eventName, err);
    return false;
  }
}

/**
 * Trackea un evento una sola vez por id (evita duplicar Purchase si el
 * usuario refresca la página de gracias o vuelve atrás/adelante).
 */
export function trackPixelEventOnce(eventName, dedupeId, params) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function' || !dedupeId) return false;
  const storageKey = `ch_pixel_${eventName}_${dedupeId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return false;
  } catch {
    // sessionStorage no disponible (modo privado, etc.): el Pixel sigue funcionando.
  }

  const tracked = trackPixelEvent(eventName, params, { eventID: String(dedupeId) });
  if (!tracked) return false;
  try {
    sessionStorage.setItem(storageKey, '1');
  } catch {
    // Sin storage no podemos deduplicar entre refrescos, pero el evento ya salió.
  }
  return true;
}
