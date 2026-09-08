import { baseApi } from '../shared/api/baseApi'
import type {
  Address,
  AddressInput,
  CartInput,
  City,
  Cuisine,
  Menu,
  Order,
  OrderCreate,
  Page,
  Quote,
  Restaurant,
  Review,
  User,
} from './types'

export interface CatalogFilters {
  search?: string
  cuisine?: string
  rating?: number
  delivery_time?: number
  sort?: string
  page?: number
  limit?: number
}

export const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    config: build.query<{ demo_catalog: boolean; auth_configured: boolean }, void>({
      query: () => '/config',
    }),
    cities: build.query<City[], void>({ query: () => '/cities' }),
    cuisines: build.query<Cuisine[], void>({ query: () => '/cuisines', providesTags: ['Catalog'] }),
    restaurants: build.query<Page<Restaurant>, CatalogFilters>({
      query: (params) => ({ url: '/restaurants', params }),
      providesTags: ['Catalog'],
    }),
    restaurant: build.query<Restaurant, string>({
      query: (id) => `/restaurants/${id}`,
      providesTags: ['Catalog'],
    }),
    menu: build.query<Menu, string>({ query: (id) => `/restaurants/${id}/menu`, providesTags: ['Catalog'] }),
    reviews: build.query<Page<Review>, { id: string; page?: number }>({
      query: ({ id, page = 1 }) => `/restaurants/${id}/reviews?page=${page}`,
      providesTags: ['Reviews'],
    }),
    me: build.query<User, void>({ query: () => '/auth/me', providesTags: ['Profile'] }),
    profile: build.mutation<User, Pick<User, 'first_name' | 'last_name'> & { phone: string }>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
    addresses: build.query<Address[], void>({ query: () => '/addresses', providesTags: ['Addresses'] }),
    createAddress: build.mutation<Address, AddressInput>({
      query: (body) => ({ url: '/addresses', method: 'POST', body }),
      invalidatesTags: ['Addresses'],
    }),
    favorites: build.query<Page<Restaurant>, number>({
      query: (page) => `/favorites?page=${page}&limit=100`,
      providesTags: ['Favorites'],
    }),
    favorite: build.mutation<void, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/favorites/${id}`, method: active ? 'PUT' : 'DELETE' }),
      invalidatesTags: ['Favorites'],
    }),
    quote: build.query<Quote, CartInput>({
      query: (body) => ({ url: '/cart/validate', method: 'POST', body }),
      keepUnusedDataFor: 0,
    }),
    createOrder: build.mutation<Order, OrderCreate>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),
    orders: build.query<Page<Order>, number>({
      query: (page) => `/orders/me?page=${page}`,
      providesTags: ['Orders'],
    }),
    order: build.query<Order, string>({ query: (id) => `/orders/${id}`, providesTags: ['Orders'] }),
    cancelOrder: build.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Orders'],
    }),
    review: build.mutation<Review, { order_id: string; rating: number; comment: string }>({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Reviews', 'Catalog'],
    }),
  }),
})
