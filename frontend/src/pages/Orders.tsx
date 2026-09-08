import { useState } from 'react'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../entities/api'
import { statuses } from '../entities/status'
import { dateTime, money } from '../shared/lib/format'
import { EmptyState, ErrorState, Loading, Pagination } from '../shared/ui/State'

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const orders = api.useOrdersQuery(page)
  return (
    <div className="standard-page">
      <span className="mini-label">ВАША ВКУСНАЯ ИСТОРИЯ</span>
      <h1>Мои заказы</h1>
      {orders.isLoading ? (
        <Loading />
      ) : orders.error ? (
        <ErrorState error={orders.error} retry={orders.refetch} />
      ) : !orders.data?.items.length ? (
        <EmptyState
          title="Первый заказ ещё впереди"
          text="Найдите любимое блюдо — а мы сохраним вашу вкусную историю здесь."
        />
      ) : (
        <>
          <div className="orders-list">
            {orders.data.items.map((order) => (
              <Link className="order-card" to={`/orders/${order.id}`} key={order.id}>
                <div className="order-icon">
                  <ShoppingBag />
                </div>
                <div>
                  <span className="mini-label">{order.order_number}</span>
                  <h3>{order.restaurant_name}</h3>
                  <p>
                    {dateTime(order.created_at)} · {order.items.length} поз.
                  </p>
                </div>
                <span className={`status-badge status-${order.status}`}>{statuses[order.status]}</span>
                <strong>{money(order.total)}</strong>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
          <Pagination page={page} pages={orders.data.pages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
