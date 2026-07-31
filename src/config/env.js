/* ============================================================
   CONFIG CENTRAL — leída desde variables de entorno (.env)
   ------------------------------------------------------------
   Create React App inyecta en build todas las vars que empiecen
   con REACT_APP_. Si falta alguna, se usa el fallback para que
   la app no explote en un entorno mal configurado.

   Importante: todo lo que viva acá viaja al navegador. Los
   secretos (access token de Mercado Pago, credenciales de la
   API de generación) deben quedarse en el backend PHP.
   ============================================================ */

const readString = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

const readNumber = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const stripTrailingSlash = (url) => url.replace(/\/+$/, '');
const withLeadingSlash = (path) => (path.startsWith('/') ? path : `/${path}`);

export const API_BASE_URL = stripTrailingSlash(
  readString('REACT_APP_API_BASE_URL', 'https://clubhuella.com')
);

/** Endpoint de generación / regeneración de diseños */
export const DESIGNS_URL = `${API_BASE_URL}${withLeadingSlash(
  readString('REACT_APP_DESIGNS_ENDPOINT', '/disenos.php')
)}`;

/** Endpoint de cotización de envíos, pagos y CRUD de pedidos */
export const PAYMENTS_URL = `${API_BASE_URL}${withLeadingSlash(
  readString('REACT_APP_PAYMENTS_ENDPOINT', '/payments_envios.php')
)}`;

export const RATE_URL = `${PAYMENTS_URL}?action=rate`;
export const PAY_URL = `${PAYMENTS_URL}?action=pagar`;

export const GENERATION_TIMEOUT_MS = readNumber('REACT_APP_GENERATION_TIMEOUT_MS', 150_000);
export const REQUEST_TIMEOUT_MS = readNumber('REACT_APP_REQUEST_TIMEOUT_MS', 30_000);

export const TSHIRT_PRICE = readNumber('REACT_APP_TSHIRT_PRICE', 42_990);

export const PICKUP = {
  address:    readString('REACT_APP_PICKUP_ADDRESS', 'Av. Héctor Jara 22'),
  city:       readString('REACT_APP_PICKUP_CITY', 'Mar del Plata'),
  postalCode: readString('REACT_APP_PICKUP_POSTAL_CODE', '7600'),
};

export const PICKUP_FULL_ADDRESS = `${PICKUP.address}, ${PICKUP.city}`;

/** Convierte una ruta relativa devuelta por el backend en URL absoluta. */
export function assetUrl(path) {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
