import { baseApi } from '../shared/api/baseApi'
import type {
  AvailableDelivery,
  Category,
  Courier,
  Cuisine,
  Menu,
  Order,
  Page,
  Product,
  Restaurant,
  Role,
  Status,
  User,
} from './types'

export interface ProductWrite {
  restaurant_id: string
  menu_category_id: string
  name: string
  slug: string
  description: string
  price: string
  is_available: boolean
}

export const operations = baseApi.injectEndpoints({
  endpoints: (build) => ({
    merchantMenu: build.query<Menu, string>({
      query: (id) => `/merchant/restaurants/${id}/menu`,
      providesTags: ['Catalog'],
    }),
    createRestaurant: build.mutation<
      Restaurant,
      {
        city_id: string
        owner_id: string
        name: string
        slug: string
        address_text: string
        phone: string
        cuisine_ids: string[]
        base_delivery_fee: string
      }
    >({
      query: (body) => ({ url: '/admin/restaurants', method: 'POST', body }),
      invalidatesTags: ['Admin', 'Catalog'],
    }),
    merchantRestaurants: build.query<Page<Restaurant>, void>({
      query: () => '/merchant/restaurants',
      providesTags: ['Catalog'],
    }),
    merchantOrders: build.query<Page<Order>, number>({
      query: (page) => `/merchant/orders?page=${page}`,
      providesTags: ['Orders'],
    }),
    changeStatus: build.mutation<Order, { id: string; status: Status; actor: 'merchant' | 'courier' }>({
      query: ({ id, status, actor }) => ({
        url: actor === 'merchant' ? `/merchant/orders/${id}/status` : `/courier/deliveries/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),
    updateRestaurant: build.mutation<Restaurant, { id: string; is_open: boolean }>({
      query: ({ id, ...body }) => ({ url: `/merchant/restaurants/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Catalog'],
    }),
    createProduct: build.mutation<Product, ProductWrite>({
      query: (body) => ({ url: '/merchant/products', method: 'POST', body }),
      invalidatesTags: ['Catalog'],
    }),
    updateProduct: build.mutation<
      Product,
      { id: string; price?: string; name?: string; description?: string; is_available?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/merchant/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Catalog'],
    }),
    deleteProduct: build.mutation<void, string>({
      query: (id) => ({ url: `/merchant/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Catalog'],
    }),
    createCategory: build.mutation<
      Category,
      { restaurant_id: string; name: string; slug: string; sort_order: number }
    >({
      query: (body) => ({ url: '/merchant/categories', method: 'POST', body }),
      invalidatesTags: ['Catalog'],
    }),
    uploadProduct: build.mutation<Product, { id: string; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData()
        body.append('file', file)
        return { url: `/merchant/products/${id}/image`, method: 'POST', body }
      },
      invalidatesTags: ['Catalog'],
    }),
    courier: build.query<Courier | null, void>({
      query: () => '/courier/profile',
      providesTags: ['Courier'],
    }),
    saveCourier: build.mutation<Courier, Pick<Courier, 'vehicle_type' | 'is_online'>>({
      query: (body) => ({ url: '/courier/profile', method: 'PUT', body }),
      invalidatesTags: ['Courier'],
    }),
    available: build.query<Page<AvailableDelivery>, number>({
      query: (page) => `/courier/available?page=${page}`,
      providesTags: ['Orders'],
    }),
    deliveries: build.query<Page<Order>, number>({
      query: (page) => `/courier/deliveries?page=${page}`,
      providesTags: ['Orders'],
    }),
    acceptDelivery: build.mutation<Order, string>({
      query: (id) => ({ url: `/courier/deliveries/${id}/accept`, method: 'POST' }),
      invalidatesTags: ['Orders'],
    }),
    adminUsers: build.query<Page<User>, number>({
      query: (page) => `/admin/users?page=${page}`,
      providesTags: ['Admin'],
    }),
    adminRestaurants: build.query<Page<Restaurant>, number>({
      query: (page) => `/admin/restaurants?page=${page}`,
      providesTags: ['Admin'],
    }),
    adminOrders: build.query<Page<Order>, number>({
      query: (page) => `/admin/orders?page=${page}`,
      providesTags: ['Orders'],
    }),
    adminCouriers: build.query<Page<Courier>, number>({
      query: (page) => `/admin/couriers?page=${page}`,
      providesTags: ['Admin'],
    }),
    moderateRestaurant: build.mutation<
      Restaurant,
      { id: string; is_active?: boolean; is_verified?: boolean; is_featured?: boolean; owner_id?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/restaurants/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Admin', 'Catalog'],
    }),
    adminUser: build.mutation<User, { id: string; role?: Role; is_blocked?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Admin'],
    }),
    approveCourier: build.mutation<Courier, { id: string; is_verified: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/couriers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Admin'],
    }),
    createCuisine: build.mutation<Cuisine, { name: string; slug: string }>({
      query: (body) => ({ url: '/admin/cuisines', method: 'POST', body }),
      invalidatesTags: ['Catalog'],
    }),
  }),
})
