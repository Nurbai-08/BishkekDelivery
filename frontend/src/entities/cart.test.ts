import { describe, expect, it } from 'vitest'
import { cartActions, cartReducer, cartTotal, emptyCart } from './cart'
import type { Product } from './types'

const product: Product = {
  id: 'p1',
  restaurant_id: 'r1',
  menu_category_id: 'c1',
  name: 'Ролл',
  slug: 'roll',
  description: '',
  price: '420.10',
  image_url: '',
  image_source: 'SYSTEM',
  image_attribution: '',
  weight_value: 250,
  weight_unit: 'г',
  is_available: true,
  is_featured: false,
}
const add = (item = product, replace = false) =>
  cartActions.add({ product: item, restaurantName: 'Restaurant', replace })
describe('cart', () => {
  it('combines quantities and calculates money without accumulating binary fractions', () => {
    let state = cartReducer(emptyCart, add())
    state = cartReducer(state, add())
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)
    expect(cartTotal(state)).toBe(840.2)
  })
  it('requires explicit replacement for a different restaurant', () => {
    const state = cartReducer(emptyCart, add())
    const other = { ...product, id: 'p2', restaurant_id: 'r2' }
    expect(cartReducer(state, add(other))).toEqual(state)
    const replaced = cartReducer(state, add(other, true))
    expect(replaced.restaurantId).toBe('r2')
    expect(replaced.items).toHaveLength(1)
    expect(replaced.items[0].id).toBe('p2')
  })
  it('clears the restaurant when the last item is removed', () => {
    const state = cartReducer(emptyCart, add())
    expect(cartReducer(state, cartActions.quantity({ id: product.id, value: 0 }))).toEqual(emptyCart)
  })
  it('rejects unavailable products and caps quantities', () => {
    expect(cartReducer(emptyCart, add({ ...product, is_available: false }))).toEqual(emptyCart)
    const state = cartReducer(emptyCart, add())
    expect(cartReducer(state, cartActions.quantity({ id: product.id, value: 150 })).items[0].quantity).toBe(
      99,
    )
  })
})
