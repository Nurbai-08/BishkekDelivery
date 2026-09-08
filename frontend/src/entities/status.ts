import type { Status } from './types'
export const statuses: Record<Status, string> = {
  PENDING: 'Заказ создан',
  CONFIRMED: 'Ресторан принял',
  PREPARING: 'Готовится',
  READY_FOR_PICKUP: 'Готов к выдаче',
  COURIER_ASSIGNED: 'Курьер назначен',
  PICKED_UP: 'Курьер забрал',
  DELIVERING: 'В пути к вам',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}
export const steps = Object.keys(statuses).filter((status) => status !== 'CANCELLED') as Status[]
export const isActive = (status: Status) => status !== 'DELIVERED' && status !== 'CANCELLED'
