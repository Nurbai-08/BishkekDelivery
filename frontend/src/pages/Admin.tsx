import { useState } from 'react'
import { operations } from '../entities/operationsApi'
import type { Role } from '../entities/types'
import { api } from '../entities/api'
import { OperationalOrder } from '../widgets/OperationalOrder'
import { ErrorState, InlineError, Loading, Pagination } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'
import { Field } from '../shared/ui/Field'
import { Modal } from '../shared/ui/Modal'
import { CreateRestaurant } from '../features/CreateRestaurant'

export default function AdminPage() {
  const [tab, setTab] = useState('restaurants'),
    [page, setPage] = useState(1)
  const tabs = [
    ['restaurants', 'Рестораны'],
    ['users', 'Пользователи'],
    ['couriers', 'Курьеры'],
    ['orders', 'Заказы'],
    ['cuisines', 'Кухни'],
  ]
  return (
    <div className="standard-page">
      <span className="mini-label">УПРАВЛЕНИЕ СЕРВИСОМ</span>
      <h1>Кабинет администратора</h1>
      <div className="button-row">
        <CreateRestaurant />
      </div>
      <nav className="dashboard-tabs">
        {tabs.map(([key, name]) => (
          <button
            className={`chip ${tab === key ? 'active' : ''}`}
            key={key}
            onClick={() => {
              setTab(key)
              setPage(1)
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      {tab === 'restaurants' ? (
        <Restaurants page={page} setPage={setPage} />
      ) : tab === 'users' ? (
        <Users page={page} setPage={setPage} />
      ) : tab === 'couriers' ? (
        <Couriers page={page} setPage={setPage} />
      ) : tab === 'orders' ? (
        <Orders page={page} setPage={setPage} />
      ) : (
        <Cuisines />
      )}
    </div>
  )
}
interface Pager {
  page: number
  setPage: (page: number) => void
}

function Restaurants({ page, setPage }: Pager) {
  const query = operations.useAdminRestaurantsQuery(page),
    [moderate, state] = operations.useModerateRestaurantMutation()
  const [ownerTarget, setOwnerTarget] = useState(''),
    [ownerId, setOwnerId] = useState('')
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={query.refetch} />
  return (
    <>
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
      <div className="dashboard-table">
        {query.data?.items.map((item) => (
          <div className="dashboard-row" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p>
                {item.is_verified ? 'Подтверждён' : 'На проверке'} · {item.is_active ? 'Активен' : 'Отключён'}
              </p>
            </div>
            <div className="button-row">
              {!item.is_verified && (
                <button
                  className="button"
                  disabled={state.isLoading}
                  onClick={() => void moderate({ id: item.id, is_verified: true })}
                >
                  Одобрить
                </button>
              )}
              <button
                className="button secondary"
                disabled={state.isLoading}
                onClick={() => void moderate({ id: item.id, is_active: !item.is_active })}
              >
                {item.is_active ? 'Отключить' : 'Включить'}
              </button>
              <button
                className="button secondary"
                disabled={state.isLoading}
                onClick={() => void moderate({ id: item.id, is_featured: !item.is_featured })}
              >
                {item.is_featured ? 'Убрать рекомендацию' : 'Рекомендовать'}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setOwnerTarget(item.id)
                  setOwnerId('')
                }}
              >
                Назначить владельца
              </button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} pages={query.data?.pages || 0} onChange={setPage} />
      {ownerTarget && (
        <Modal title="Назначить владельца" onClose={() => setOwnerTarget('')}>
          <p>Укажите ID пользователя с ролью RESTAURANT_OWNER из раздела пользователей.</p>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const result = await moderate({ id: ownerTarget, owner_id: ownerId })
              if ('data' in result) setOwnerTarget('')
            }}
          >
            <Field
              label="ID пользователя"
              required
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
            />
            <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
            <button className="button" disabled={state.isLoading}>
              Назначить
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}

function Users({ page, setPage }: Pager) {
  const query = operations.useAdminUsersQuery(page),
    [update, state] = operations.useAdminUserMutation()
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={query.refetch} />
  return (
    <>
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
      <div className="dashboard-table">
        {query.data?.items.map((user) => (
          <div className="dashboard-row" key={user.id}>
            <div>
              <strong>{user.first_name || user.email || 'Пользователь'}</strong>
              <p>
                {user.email}
                <br />
                ID: {user.id}
              </p>
            </div>
            <select
              aria-label={`Роль ${user.email}`}
              value={user.role}
              disabled={user.role === 'ADMIN' || state.isLoading}
              onChange={(event) => void update({ id: user.id, role: event.target.value as Role })}
            >
              {['CUSTOMER', 'RESTAURANT_OWNER', 'COURIER', 'ADMIN'].map((role) => (
                <option value={role} key={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              className="button secondary"
              disabled={user.role === 'ADMIN' || state.isLoading}
              onClick={() => void update({ id: user.id, is_blocked: !user.is_blocked })}
            >
              {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
          </div>
        ))}
      </div>
      <Pagination page={page} pages={query.data?.pages || 0} onChange={setPage} />
    </>
  )
}

function Couriers({ page, setPage }: Pager) {
  const query = operations.useAdminCouriersQuery(page),
    [approve, state] = operations.useApproveCourierMutation()
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={query.refetch} />
  return (
    <>
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
      {!query.data?.items.length && <p className="notice">Курьеры пока не зарегистрированы.</p>}
      <div className="dashboard-table">
        {query.data?.items.map((item) => (
          <div className="dashboard-row" key={item.user_id}>
            <div>
              <strong>{item.vehicle_type}</strong>
              <p>
                {item.user_id}
                <br />
                {item.is_verified ? 'Подтверждён' : 'На проверке'}
              </p>
            </div>
            <button
              className="button"
              disabled={state.isLoading}
              onClick={() => void approve({ id: item.user_id, is_verified: !item.is_verified })}
            >
              {item.is_verified ? 'Отозвать одобрение' : 'Одобрить'}
            </button>
          </div>
        ))}
      </div>
      <Pagination page={page} pages={query.data?.pages || 0} onChange={setPage} />
    </>
  )
}

function Orders({ page, setPage }: Pager) {
  const query = operations.useAdminOrdersQuery(page)
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={query.refetch} />
  return (
    <>
      <div className="dashboard-grid">
        {query.data?.items.map((order) => (
          <OperationalOrder key={order.id} order={order} />
        ))}
      </div>
      {!query.data?.items.length && <p className="notice">Заказов пока нет.</p>}
      <Pagination page={page} pages={query.data?.pages || 0} onChange={setPage} />
    </>
  )
}

function Cuisines() {
  const query = api.useCuisinesQuery(),
    [create, state] = operations.useCreateCuisineMutation()
  const [name, setName] = useState(''),
    [slug, setSlug] = useState('')
  return (
    <div className="profile-grid">
      <section className="panel">
        <h2>Типы кухни</h2>
        {query.isLoading ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={query.refetch} />
        ) : (
          query.data?.map((item) => (
            <p className="saved-address" key={item.id}>
              {item.name} · {item.slug}
            </p>
          ))
        )}
      </section>
      <section className="panel">
        <h2>Добавить кухню</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const result = await create({ name, slug })
            if ('data' in result) {
              setName('')
              setSlug('')
            }
          }}
        >
          <Field
            label="Название"
            minLength={2}
            maxLength={100}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Field
            label="Код (латиница)"
            pattern="[a-z0-9-]+"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
          <button className="button" disabled={state.isLoading}>
            Добавить
          </button>
        </form>
      </section>
    </div>
  )
}
