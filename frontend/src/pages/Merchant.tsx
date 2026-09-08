import { useState } from 'react'
import { operations } from '../entities/operationsApi'
import { MenuEditor } from '../features/MenuEditor'
import { OperationalOrder } from '../widgets/OperationalOrder'
import { EmptyState, ErrorState, InlineError, Loading, Pagination } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'

export default function MerchantPage() {
  const [tab, setTab] = useState('orders'),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState('')
  const places = operations.useMerchantRestaurantsQuery(),
    orders = operations.useMerchantOrdersQuery(page)
  const [update, state] = operations.useUpdateRestaurantMutation()
  const place = places.data?.items.find((item) => item.id === selected) || places.data?.items[0]
  return (
    <div className="standard-page">
      <span className="mini-label">КАБИНЕТ РЕСТОРАНА</span>
      <h1>Всё готово к хорошему дню</h1>
      {places.isLoading ? (
        <Loading />
      ) : places.error ? (
        <ErrorState error={places.error} retry={places.refetch} />
      ) : !place ? (
        <EmptyState
          title="Ресторан ещё не назначен"
          text="Администратор должен связать ваш аккаунт с рестораном."
          link="/profile"
          action="В профиль"
        />
      ) : (
        <>
          <div className="dashboard-row" style={{ marginTop: 24 }}>
            <div>
              <h3>{place.name}</h3>
              <p>{place.is_open ? 'Принимаем заказы' : 'Приём заказов приостановлен'}</p>
            </div>
            {places.data && places.data.items.length > 1 && (
              <select
                aria-label="Ресторан"
                value={place.id}
                onChange={(event) => setSelected(event.target.value)}
              >
                {places.data.items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
            <button
              className="button secondary"
              disabled={state.isLoading}
              onClick={() => void update({ id: place.id, is_open: !place.is_open })}
            >
              {place.is_open ? 'Приостановить заказы' : 'Открыть ресторан'}
            </button>
          </div>
          <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
          <nav className="dashboard-tabs">
            {[
              ['orders', 'Заказы'],
              ['menu', 'Меню'],
            ].map(([key, name]) => (
              <button className={`chip ${tab === key ? 'active' : ''}`} key={key} onClick={() => setTab(key)}>
                {name}
              </button>
            ))}
          </nav>
          {tab === 'menu' ? (
            <MenuEditor restaurantId={place.id} />
          ) : orders.isLoading ? (
            <Loading />
          ) : orders.error ? (
            <ErrorState error={orders.error} retry={orders.refetch} />
          ) : !orders.data?.items.length ? (
            <EmptyState
              title="Новых заказов пока нет"
              text="Заказы ваших ресторанов появятся здесь."
              link="/merchant"
              action="Кабинет ресторана"
            />
          ) : (
            <>
              <div className="section-heading">
                <h2>Заказы всех ваших ресторанов</h2>
                <button className="button secondary" onClick={() => void orders.refetch()}>
                  Обновить
                </button>
              </div>
              <div className="dashboard-grid">
                {orders.data.items.map((order) => (
                  <OperationalOrder key={order.id} order={order} actor="merchant" />
                ))}
              </div>
              <Pagination page={page} pages={orders.data.pages} onChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  )
}
