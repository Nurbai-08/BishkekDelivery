import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { z } from 'zod'
import type { CartInput, Product } from './types'

const lineSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  name: z.string(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  image_url: z.string(),
  quantity: z.number().int().min(1).max(99),
})
const cartSchema = z.object({
  restaurantId: z.string(),
  restaurantName: z.string(),
  items: z.array(lineSchema).max(50),
})
export type CartLine = z.infer<typeof lineSchema>
export type CartState = z.infer<typeof cartSchema>
export const emptyCart: CartState = { restaurantId: '', restaurantName: '', items: [] }

export function loadCart(): CartState {
  try {
    const parsed = cartSchema.safeParse(JSON.parse(localStorage.getItem('bd-cart-v1') || 'null'))
    if (!parsed.success) return emptyCart
    const cart = parsed.data
    if (cart.items.some((item) => item.restaurant_id !== cart.restaurantId)) return emptyCart
    if (new Set(cart.items.map((item) => item.id)).size !== cart.items.length) return emptyCart
    return cart
  } catch {
    return emptyCart
  }
}

const slice = createSlice({
  name: 'cart',
  initialState: emptyCart,
  reducers: {
    add: (
      state,
      { payload }: PayloadAction<{ product: Product; restaurantName: string; replace?: boolean }>,
    ) => {
      if (!payload.product.is_available) return
      if (state.items.length && state.restaurantId !== payload.product.restaurant_id && !payload.replace)
        return
      if (payload.replace) state.items = []
      state.restaurantId = payload.product.restaurant_id
      state.restaurantName = payload.restaurantName
      const existing = state.items.find((item) => item.id === payload.product.id)
      if (existing) existing.quantity = Math.min(99, existing.quantity + 1)
      else if (state.items.length < 50) state.items.push({ ...payload.product, quantity: 1 })
    },
    quantity: (state, { payload }: PayloadAction<{ id: string; value: number }>) => {
      if (!Number.isInteger(payload.value)) return
      state.items = state.items.flatMap((item) =>
        item.id !== payload.id
          ? [item]
          : payload.value > 0
            ? [{ ...item, quantity: Math.min(payload.value, 99) }]
            : [],
      )
      if (!state.items.length) {
        state.restaurantId = ''
        state.restaurantName = ''
      }
    },
    clear: () => emptyCart,
  },
})
export const cartActions = slice.actions
export const cartReducer = slice.reducer
export const selectCart = (state: { cart: CartState }) => state.cart
export const cartInput = (cart: CartState): CartInput => ({
  restaurant_id: cart.restaurantId,
  items: cart.items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
})
export const cartCount = (cart: CartState) => cart.items.reduce((sum, item) => sum + item.quantity, 0)
export const cartTotal = (cart: CartState) =>
  cart.items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity, 0) / 100
