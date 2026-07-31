import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

const STORAGE_KEY = 'clubhuella.cart.v1';

/* Las imágenes generadas pueden venir como data:URL de varios MB.
   Guardarlas en localStorage revienta la cuota, así que solo
   persistimos URLs http(s). */
const isPersistableImage = (image) =>
  typeof image === 'string' && !image.startsWith('data:');

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return undefined;

    return { items: parsed.items };
  } catch {
    return undefined;
  }
}

function saveCart(cart) {
  try {
    const items = cart.items.map((item) => ({
      ...item,
      image: isPersistableImage(item.image) ? item.image : null,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    /* cuota llena o storage deshabilitado: seguimos sin persistir */
  }
}

const preloadedCart = loadCart();

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: preloadedCart ? { cart: preloadedCart } : undefined,
});

let lastCart = store.getState().cart;
store.subscribe(() => {
  const cart = store.getState().cart;
  if (cart === lastCart) return;
  lastCart = cart;
  saveCart(cart);
});

export default store;
