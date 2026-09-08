import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from '../config'
import { firebaseAuth } from '../lib/firebase'
export { errorMessage } from './errorMessage'

const rawQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: async (headers) => {
    await firebaseAuth?.authStateReady()
    const token = await firebaseAuth?.currentUser?.getIdToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extra) => {
    try {
      return await rawQuery(args, api, extra)
    } catch {
      return { error: { status: 'CUSTOM_ERROR', error: 'Не удалось подтвердить вход. Войдите повторно.' } }
    }
  },
  tagTypes: ['Profile', 'Addresses', 'Favorites', 'Orders', 'Catalog', 'Reviews', 'Courier', 'Admin'],
  endpoints: () => ({}),
})
