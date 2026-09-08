import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../entities/api'
import type { Address } from '../entities/types'
import { Field } from '../shared/ui/Field'
import { ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'

const schema = z.object({
  label: z.string().trim().max(50, 'Не больше 50 символов'),
  street: z.string().trim().min(2, 'Введите название улицы или микрорайона').max(200),
  house: z.string().trim().min(1, 'Укажите номер дома, например 25 или 25А').max(30),
  apartment: z.string().max(30),
  entrance: z.string().max(30),
  floor: z.string().max(30),
  comment: z.string().max(1000),
  is_default: z.boolean(),
})
type Form = z.infer<typeof schema>

export function AddressForm({ onSaved }: { onSaved?: (address: Address) => void }) {
  const cities = api.useCitiesQuery(),
    [save, state] = api.useCreateAddressMutation()
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: 'Дом',
      street: '',
      house: '',
      apartment: '',
      entrance: '',
      floor: '',
      comment: '',
      is_default: true,
    },
  })
  if (cities.isLoading) return <Loading />
  if (cities.error) return <ErrorState error={cities.error} retry={cities.refetch} />
  const city = cities.data?.[0]
  if (!city) return <p className="notice">Доставка пока недоступна. Город ещё не настроен.</p>
  const submit = async (data: Form) => {
    try {
      const address = await save({ ...data, label: data.label || 'Дом', city_id: city.id }).unwrap()
      form.reset()
      onSaved?.(address)
    } catch {
      /* RTK Query exposes the error inline below. */
    }
  }
  return (
    <form className="address-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="address-intro">
        <strong>Куда доставить в Бишкеке?</strong>
        <p>Заполните улицу и номер дома. Поля со звёздочкой обязательны.</p>
      </div>
      <Field
        label="Как назвать этот адрес"
        placeholder="Например, Дом или Работа"
        hint="Название для вашего списка адресов. Можно оставить «Дом»."
        {...form.register('label')}
        error={form.formState.errors.label?.message}
      />
      <div className="form-row">
        <Field
          label="Улица или микрорайон *"
          placeholder="Например, ул. Токтогула"
          required
          autoComplete="address-line1"
          {...form.register('street')}
          error={form.formState.errors.street?.message}
        />
        <Field
          label="Номер дома *"
          placeholder="Например, 25А"
          required
          {...form.register('house')}
          error={form.formState.errors.house?.message}
        />
      </div>
      <p className="address-details-note">
        Детали для курьера — необязательно. Для частного дома эти поля можно пропустить.
      </p>
      <div className="form-row three">
        <Field
          label="Квартира / офис"
          placeholder="12"
          {...form.register('apartment')}
          error={form.formState.errors.apartment?.message}
        />
        <Field
          label="Подъезд"
          placeholder="2"
          {...form.register('entrance')}
          error={form.formState.errors.entrance?.message}
        />
        <Field
          label="Этаж"
          placeholder="3"
          {...form.register('floor')}
          error={form.formState.errors.floor?.message}
        />
      </div>
      <Field
        label="Как вас найти (необязательно)"
        placeholder="Вход со двора, код домофона 12"
        hint="Добавьте ориентир или инструкцию, чтобы курьер быстрее нашёл вход."
        {...form.register('comment')}
        error={form.formState.errors.comment?.message}
      />
      <label className="checkbox-label">
        <input type="checkbox" {...form.register('is_default')} />
        Выбирать этот адрес при оформлении заказа
      </label>
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
      <button className="button" disabled={state.isLoading}>
        {state.isLoading ? 'Сохраняем…' : 'Сохранить адрес'}
      </button>
    </form>
  )
}
