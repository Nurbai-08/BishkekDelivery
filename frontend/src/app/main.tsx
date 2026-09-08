import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { RouterProvider } from 'react-router-dom'
import { baseApi } from '../shared/api/baseApi'
import { cartReducer, loadCart } from '../entities/cart'
import { AuthProvider } from '../features/Auth'
import { router } from './router'
import { config } from '../shared/config'
import '@fontsource-variable/manrope'
import '../shared/styles/tokens.css'
import '../shared/styles/base.css'
import '../shared/styles/catalog.css'
import '../shared/styles/pages.css'
import '../shared/styles/responsive.css'

const store = configureStore({
  reducer: { cart: cartReducer, [baseApi.reducerPath]: baseApi.reducer },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  preloadedState: { cart: loadCart() },
})
let previousCart = store.getState().cart
store.subscribe(() => {
  const cart = store.getState().cart
  if (cart === previousCart) return
  previousCart = cart
  try {
    localStorage.setItem('bd-cart-v1', JSON.stringify(cart))
  } catch {
    window.dispatchEvent(new Event('cart-storage-unavailable'))
  }
})
setupListeners(store.dispatch)
document.title = `${config.appName} — вкусный город рядом`
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
)
