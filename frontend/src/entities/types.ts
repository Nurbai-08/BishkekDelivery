export type Role = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'COURIER' | 'ADMIN'
export type Status =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'
export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  pages: number
}
export interface Cuisine {
  id: string
  name: string
  slug: string
  image_url: string
}
export interface Restaurant {
  id: string
  city_id: string
  name: string
  slug: string
  description: string
  cover_url: string
  logo_url: string
  image_source: string
  image_attribution: string
  address_text: string
  rating: string
  review_count: number
  minimum_order: string
  base_delivery_fee: string
  estimated_delivery_min: number
  estimated_delivery_max: number
  is_open: boolean
  is_active: boolean
  is_verified: boolean
  is_featured: boolean
  is_demo: boolean
  cuisines: Cuisine[]
}
export interface Product {
  id: string
  restaurant_id: string
  menu_category_id: string
  name: string
  slug: string
  description: string
  price: string
  weight_value: number | null
  weight_unit: string
  image_url: string
  image_source: string
  image_attribution: string
  is_available: boolean
  is_featured: boolean
}
export interface Category {
  id: string
  restaurant_id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}
export interface Menu {
  categories: Category[]
  products: Product[]
}
export interface User {
  id: string
  email: string | null
  first_name: string
  last_name: string
  phone: string | null
  role: Role
  is_blocked: boolean
}
export interface City {
  id: string
  name: string
  country: string
  timezone: string
}
export interface AddressInput {
  city_id: string
  label: string
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  comment: string
  is_default: boolean
}
export interface Address extends AddressInput {
  id: string
}
export interface CartInput {
  restaurant_id: string
  items: { product_id: string; quantity: number }[]
}
export interface QuoteLine {
  product_id: string
  product_name: string
  product_image_url: string
  unit_price: string
  quantity: number
  total_price: string
}
export interface Quote {
  items: QuoteLine[]
  subtotal: string
  delivery_fee: string
  discount: string
  total: string
}
export interface Order extends Quote {
  id: string
  order_number: string
  restaurant_id: string
  restaurant_name: string
  courier_id: string | null
  status: Status
  address_snapshot: Record<string, string>
  contact_phone: string
  payment_method: 'CASH' | 'CARD_ON_DELIVERY'
  payment_status: string
  customer_comment: string
  created_at: string
  delivered_at: string | null
  history: { id: string; from_status: Status | null; to_status: Status; created_at: string }[]
}
export interface OrderCreate extends CartInput {
  delivery_address_id: string
  contact_phone: string
  payment_method: 'CASH' | 'CARD_ON_DELIVERY'
  customer_comment: string
  idempotency_key: string
  expected_total: string
}
export interface Review {
  id: string
  order_id: string
  restaurant_id: string
  author_name: string
  rating: number
  comment: string
  created_at: string
}
export interface Courier {
  user_id: string
  vehicle_type: 'WALK' | 'BICYCLE' | 'SCOOTER' | 'CAR'
  is_online: boolean
  is_verified: boolean
}
export interface AvailableDelivery {
  id: string
  order_number: string
  restaurant_name: string
  pickup_address: string
  delivery_area: string
  delivery_fee: string
}
