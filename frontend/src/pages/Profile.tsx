import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowUpRight, LogOut, MapPin, Plus, UserRound } from 'lucide-react'
import { api } from '../entities/api'
import { useAuth } from '../features/Auth'
import { AddressForm } from '../features/AddressForm'
import { Field } from '../shared/ui/Field'
import { ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'

const schema = z.object({
  first_name: z.string().min(1, 'Укажите имя').max(100),
  last_name: z.string().max(100),
  phone: z.string().regex(/^\+996\d{9}$/, 'Формат: +996555123456'),
})
type Form = z.infer<typeof schema>

export default function ProfilePage() {
  const auth = useAuth(),
    addresses = api.useAddressesQuery(),
    [update, state] = api.useProfileMutation()
  const [adding, setAdding] = useState(false),
    [logoutError, setLogoutError] = useState('')
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: auth.user?.first_name || '',
      last_name: auth.user?.last_name || '',
      phone: auth.user?.phone || '+996',
    },
  })
  const dashboard =
    auth.user?.role === 'ADMIN'
      ? '/admin'
      : auth.user?.role === 'RESTAURANT_OWNER'
        ? '/merchant'
        : auth.user?.role === 'COURIER'
          ? '/courier'
          : null
  return (
    <div className="standard-page">
      <span className="mini-label">ВСЁ ВАШЕ — ЗДЕСЬ</span>
      <div className="section-heading">
        <h1>Личный кабинет</h1>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await auth.logout()
            } catch {
              setLogoutError('Не удалось выйти. Попробуйте ещё раз.')
            }
          }}
        >
          <LogOut size={17} />
          Выйти
        </button>
      </div>
      <InlineError>{logoutError}</InlineError>
      {dashboard && (
        <Link className="dashboard-link" to={dashboard}>
          Перейти в рабочий кабинет
          <ArrowUpRight size={20} />
        </Link>
      )}
      <div className="profile-grid">
        <section className="panel">
          <div className="profile-avatar">
            <UserRound size={28} />
          </div>
          <h2>О вас</h2>
          <p className="muted">{auth.user?.email}</p>
          <form
            onSubmit={form.handleSubmit((data) => {
              void update(data)
            })}
            noValidate
          >
            <Field
              label="Имя"
              autoComplete="given-name"
              {...form.register('first_name')}
              error={form.formState.errors.first_name?.message}
            />
            <Field
              label="Фамилия"
              autoComplete="family-name"
              {...form.register('last_name')}
              error={form.formState.errors.last_name?.message}
            />
            <Field
              label="Телефон"
              type="tel"
              autoComplete="tel"
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />
            <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
            {state.isSuccess && (
              <p className="notice" role="status">
                Профиль сохранён
              </p>
            )}
            <button className="button" disabled={state.isLoading}>
              {state.isLoading ? 'Сохраняем…' : 'Сохранить изменения'}
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Ваши адреса</h2>
            <MapPin size={22} />
          </div>
          {addresses.isLoading ? (
            <Loading />
          ) : addresses.error ? (
            <ErrorState error={addresses.error} retry={addresses.refetch} />
          ) : addresses.data?.length ? (
            addresses.data.map((address) => (
              <article className="saved-address" key={address.id}>
                <strong>
                  {address.label}
                  {address.is_default && <span className="small-badge">Основной</span>}
                </strong>
                <p>
                  {address.street}, {address.house}
                  {address.apartment && `, кв. ${address.apartment}`}
                </p>
              </article>
            ))
          ) : (
            <p className="muted">Дом, работа или любимое место — сохраните адрес для быстрого заказа.</p>
          )}
          <button className="text-link" onClick={() => setAdding(!adding)}>
            <Plus size={18} />
            Добавить адрес
          </button>
          {adding && (
            <div className="new-address">
              <AddressForm onSaved={() => setAdding(false)} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
