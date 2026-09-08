import { useState } from 'react'
import { Bike } from 'lucide-react'
import { operations } from '../entities/operationsApi'
import { OperationalOrder } from '../widgets/OperationalOrder'
import { EmptyState, ErrorState, InlineError, Loading, Pagination } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'
import { money } from '../shared/lib/format'

export default function CourierPage() {
  const [tab, setTab] = useState('available'),
    [page, setPage] = useState(1)
  const profile = operations.useCourierQuery(),
    [save, saveState] = operations.useSaveCourierMutation()
  const available = operations.useAvailableQuery(page, {
      skip: !profile.data?.is_verified || tab !== 'available',
    }),
    deliveries = operations.useDeliveriesQuery(page)
  const [accept, state] = operations.useAcceptDeliveryMutation()
  return (
    <div className="standard-page">
      <span className="mini-label">КАБИНЕТ КУРЬЕРА</span>
      <h1>Город ждёт вас</h1>
      {profile.isLoading ? (
        <Loading />
      ) : profile.error ? (
        <ErrorState error={profile.error} retry={profile.refetch} />
      ) : (
        <>
          <div className="dashboard-row" style={{ marginTop: 24 }}>
            <div>
              <h3>
                <Bike size={24} />
                {profile.data?.is_online ? 'Вы на линии' : 'Вы не на линии'}
              </h3>
              <p>{profile.data?.is_verified ? 'Аккаунт подтверждён' : 'Ожидаем одобрения администратора'}</p>
            </div>
            <button
              className="button"
              disabled={saveState.isLoading}
              onClick={() =>
                void save({
                  vehicle_type: profile.data?.vehicle_type || 'BICYCLE',
                  is_online: !profile.data?.is_online,
                })
              }
            >
              {profile.data?.is_online ? 'Завершить смену' : 'Выйти на линию'}
            </button>
          </div>
          <InlineError>
            {saveState.error ? errorMessage(saveState.error) : state.error ? errorMessage(state.error) : ''}
          </InlineError>
          <nav className="dashboard-tabs">
            <button
              className={`chip ${tab === 'available' ? 'active' : ''}`}
              onClick={() => {
                setTab('available')
                setPage(1)
              }}
            >
              Доступные доставки
            </button>
            <button
              className={`chip ${tab === 'mine' ? 'active' : ''}`}
              onClick={() => {
                setTab('mine')
                setPage(1)
              }}
            >
              Мои доставки
            </button>
            <button
              className="chip"
              onClick={() => {
                void deliveries.refetch()
                if (profile.data?.is_verified && tab === 'available') void available.refetch()
              }}
            >
              Обновить
            </button>
          </nav>
          {tab === 'available' ? (
            !profile.data?.is_verified ? (
              <p className="notice">Администратор проверит профиль перед первой доставкой.</p>
            ) : available.isLoading ? (
              <Loading />
            ) : available.error ? (
              <ErrorState error={available.error} retry={available.refetch} />
            ) : !available.data?.items.length ? (
              <EmptyState
                title="Пока нет готовых заказов"
                text="Доступные доставки появятся, когда ресторан закончит приготовление."
                link="/courier"
                action="Кабинет курьера"
              />
            ) : (
              <>
                <div className="dashboard-grid">
                  {available.data.items.map((item) => (
                    <article className="dashboard-card" key={item.id}>
                      <h3>{item.restaurant_name}</h3>
                      <p>Забрать: {item.pickup_address}</p>
                      <p>Район доставки: {item.delivery_area}</p>
                      <p>Стоимость доставки: {money(item.delivery_fee)}</p>
                      <button
                        className="button"
                        disabled={state.isLoading || !profile.data?.is_online}
                        onClick={async () => {
                          const result = await accept(item.id)
                          if ('data' in result) setTab('mine')
                        }}
                      >
                        Принять доставку
                      </button>
                    </article>
                  ))}
                </div>
                <Pagination page={page} pages={available.data.pages} onChange={setPage} />
              </>
            )
          ) : deliveries.isLoading ? (
            <Loading />
          ) : deliveries.error ? (
            <ErrorState error={deliveries.error} retry={deliveries.refetch} />
          ) : !deliveries.data?.items.length ? (
            <p className="notice">Вы ещё не приняли ни одной доставки.</p>
          ) : (
            <>
              <div className="dashboard-grid">
                {deliveries.data.items.map((order) => (
                  <OperationalOrder key={order.id} order={order} actor="courier" />
                ))}
              </div>
              <Pagination page={page} pages={deliveries.data.pages} onChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  )
}
