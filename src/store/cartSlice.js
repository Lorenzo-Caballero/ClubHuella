import { createSlice, createSelector, nanoid } from '@reduxjs/toolkit';
import { TSHIRT_PRICE } from '../config/env';

/* ============================================================
   CARRITO — Redux Toolkit
   ------------------------------------------------------------
   Un item del carrito representa una remera personalizada:
     {
       id, disenoId, name, style, styleName,
       color, colorName, size, price, qty,
       image,      // URL absoluta para mostrar (http o data:)
       imagenUrl,  // ruta cruda devuelta por el backend (para rearmar el pedido)
     }
   ============================================================ */

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: {
      reducer(state, action) {
        const item = action.payload;
        // Mismo diseño + mismo talle + mismo color ⇒ sumamos cantidad
        const existing = state.items.find(
          (i) =>
            i.disenoId != null &&
            i.disenoId === item.disenoId &&
            i.size === item.size &&
            i.color === item.color
        );

        if (existing) {
          existing.qty += item.qty;
          return;
        }

        state.items.push(item);
      },
      prepare(item = {}) {
        return {
          payload: {
            id: item.id ?? nanoid(),
            disenoId: item.disenoId ?? null,
            name: item.name ?? '',
            style: item.style ?? '',
            styleName: item.styleName ?? '',
            color: item.color ?? '',
            colorName: item.colorName ?? '',
            size: item.size ?? '',
            image: item.image ?? null,
            imagenUrl: item.imagenUrl ?? '',
            price: Number(item.price) > 0 ? Number(item.price) : TSHIRT_PRICE,
            qty: Number(item.qty) > 0 ? Number(item.qty) : 1,
          },
        };
      },
    },

    removeItem(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },

    setQty(state, action) {
      const { id, qty } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      if (qty <= 0) {
        state.items = state.items.filter((i) => i.id !== id);
        return;
      }
      item.qty = qty;
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, setQty, clearCart } = cartSlice.actions;

/* ── Selectores ──────────────────────────────────────────── */

export const selectCartItems = (state) => state.cart.items;

export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((acc, i) => acc + i.qty, 0)
);

export const selectCartSubtotal = createSelector([selectCartItems], (items) =>
  items.reduce((acc, i) => acc + i.price * i.qty, 0)
);

/** Último item agregado — es el que arranca el checkout. */
export const selectLastCartItem = (state) =>
  state.cart.items[state.cart.items.length - 1] ?? null;

/** Solo se puede ir a pagar si hay items y todos tienen su diseño generado. */
export const selectCanCheckout = createSelector([selectCartItems], (items) =>
  items.length > 0 &&
  items.every((i) => Boolean(i.disenoId || i.imagenUrl || i.image))
);

export default cartSlice.reducer;
