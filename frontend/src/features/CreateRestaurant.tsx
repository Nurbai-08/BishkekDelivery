import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../entities/api'
import { operations } from '../entities/operationsApi'
import { Modal } from '../shared/ui/Modal'
import { Field } from '../shared/ui/Field'
import { ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'

const schema = z.object({
  name: z.string().min(2, 'Укажите название').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Латиница, цифры и дефисы'),
  owner_id: z.string().uuid('Укажите ID владельца'),
  address_text: z.string().min(3, 'Укажите адрес').max(400),
  phone: z.string().regex(/^\+996\d{9}$/, 'Формат: +996555123456'),
  cuisine_id: z.string().uuid('Выберите кухню'),
  base_delivery_fee: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Укажите сумму'),
})
type Form = z.infer<typeof schema>

export function CreateRestaurant() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="button" onClick={() => setOpen(true)}>
        Добавить ресторан
      </button>
      {open && <RestaurantForm onClose={() => setOpen(false)} />}
    </>
  )
}

function RestaurantForm({ onClose }: { onClose: () => void }) {
  const cities = api.useCitiesQuery(),
    cuisines = api.useCuisinesQuery()
  const [save, state] = operations.useCreateRestaurantMutation()
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      owner_id: '',
      address_text: '',
      phone: '+996',
      cuisine_id: '',
      base_delivery_fee: '100',
    },
  })
  return (
    <Modal title="Новый ресторан" onClose={onClose}>
      {cities.isLoading || cuisines.isLoading ? (
        <Loading />
      ) : cities.error || cuisines.error ? (
        <ErrorState
          error={cities.error || cuisines.error}
          retry={() => {
            void cities.refetch()
            void cuisines.refetch()
          }}
        />
      ) : (
        <form
          onSubmit={form.handleSubmit(async (data) => {
            const city = cities.data?.[0]
            if (!city) return
            const { cuisine_id, ...values } = data
            const result = await save({ ...values, city_id: city.id, cuisine_ids: [cuisine_id] })
            if ('data' in result) onClose()
          })}
          noValidate
        >
          <p className="muted">
            После создания ресторан появится на проверке. Сначала назначьте владельцу роль в разделе
            пользователей.
          </p>
          <Field label="Название" {...form.register('name')} error={form.formState.errors.name?.message} />
          <Field
            label="Код (латиница)"
            {...form.register('slug')}
            error={form.formState.errors.slug?.message}
          />
          <Field
            label="ID владельца"
            {...form.register('owner_id')}
            error={form.formState.errors.owner_id?.message}
          />
          <Field
            label="Адрес ресторана"
            {...form.register('address_text')}
            error={form.formState.errors.address_text?.message}
          />
          <Field label="Телефон" {...form.register('phone')} error={form.formState.errors.phone?.message} />
          <Field
            label="Стоимость доставки, сом"
            {...form.register('base_delivery_fee')}
            error={form.formState.errors.base_delivery_fee?.message}
          />
          <div className="field">
            <label htmlFor="restaurant-cuisine">Кухня</label>
            <select id="restaurant-cuisine" {...form.register('cuisine_id')}>
              <option value="">Выберите кухню</option>
              {cuisines.data?.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {form.formState.errors.cuisine_id && (
              <span className="field-error">{form.formState.errors.cuisine_id.message}</span>
            )}
          </div>
          <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
          <button className="button full" disabled={state.isLoading || !cities.data?.length}>
            Создать ресторан
          </button>
        </form>
      )}
    </Modal>
  )
}
