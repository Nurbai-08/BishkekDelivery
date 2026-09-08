import { Link } from 'react-router-dom'
import { operations } from '../entities/operationsApi'
import { statuses } from '../entities/status'
import type { Order, Status } from '../entities/types'
import { dateTime, money } from '../shared/lib/format'
import { InlineError } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'

const transitions: Partial<Record<Status, Status>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  COURIER_ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'DELIVERING',
  DELIVERING: 'DELIVERED',
}
const actions: Partial<Record<Status, string>> = {
  CONFIRMED: 'Принять заказ',
  PREPARING: 'Начать готовить',
  READY_FOR_PICKUP: 'Готов к выдаче',
  PICKED_UP: 'Заказ забрал',
  DELIVERING: 'Везу клиенту',
  DELIVERED: 'Доставлен, оплата получена',
}

export function OperationalOrder({ order, actor }: { order: Order; actor?: 'merchant' | 'courier' }) {
  const [change, state] = operations.useChangeStatusMutation()
  const next = transitions[order.status]
  const allowed =
    actor === 'merchant'
      ? ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)
      : actor === 'courier' && ['COURIER_ASSIGNED', 'PICKED_UP', 'DELIVERING'].includes(order.status)
  return (
    <article className="dashboard-card">
      <span className={`status-badge status-${order.status}`}>{statuses[order.status]}</span>
      <Link to={`/orders/${order.id}`}>
        <h3>{order.restaurant_name}</h3>
      </Link>
      <p className="muted">
        {order.order_number}
        <br />
        {dateTime(order.created_at)}
      </p>
      {order.items.map((item) => (
        <p key={item.product_id}>
          {item.product_name} × {item.quantity}
        </p>
      ))}
      <p>
        <strong>{money(order.total)}</strong> ·{' '}
        {order.payment_method === 'CASH' ? 'Наличные' : 'Картой при получении'}
      </p>
      {actor === 'courier' && (
        <p>
          {order.address_snapshot.street}, {order.address_snapshot.house}, кв.{' '}
          {order.address_snapshot.apartment}
          <br />
          <a href={`tel:${order.contact_phone}`}>{order.contact_phone}</a>
        </p>
      )}
      {order.customer_comment && <p className="notice">{order.customer_comment}</p>}
      {allowed && next && actor && (
        <button
          className="button"
          disabled={state.isLoading}
          onClick={() => void change({ id: order.id, status: next, actor })}
        >
          {state.isLoading ? 'Обновляем…' : actions[next]}
        </button>
      )}
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
    </article>
  )
}
