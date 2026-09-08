import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Check, MapPin, Plus } from 'lucide-react'
import { api } from '../entities/api'
import { cartActions, cartInput, selectCart } from '../entities/cart'
import { AddressForm } from '../features/AddressForm'
import { useAuth } from '../features/Auth'
import { Field } from '../shared/ui/Field'
import { EmptyState, ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'
import { money } from '../shared/lib/format'
import type { OrderCreate } from '../entities/types'

const schema = z.object({
  contact_phone: z.string().regex(/^\+996\d{9}$/, 'Формат: +996555123456'),
  payment_method: z.enum(['CASH', 'CARD_ON_DELIVERY']),
  customer_comment: z.string().max(1000),
})
type Form = z.infer<typeof schema>

export default function CheckoutPage() {
  const cart = useSelector(selectCart),
    dispatch = useDispatch(),
    navigate = useNavigate(),
    auth = useAuth()
  const addresses = api.useAddressesQuery(),
    quote = api.useQuoteQuery(cartInput(cart), { skip: !cart.items.length, refetchOnMountOrArgChange: true })
  const [createOrder, result] = api.useCreateOrderMutation()
  const [addressId, setAddressId] = useState(''),
    [newAddress, setNewAddress] = useState(false),
    [step, setStep] = useState(1)
  const attempt = useRef<{ body: string; key: string } | null>(null)
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact_phone: auth.user?.phone || '+996',
      payment_method: 'CASH',
      customer_comment: '',
    },
  })
  const selected =
    addresses.data?.find((address) => address.id === addressId) ||
    addresses.data?.find((address) => address.is_default) ||
    addresses.data?.[0]
  if (!cart.items.length)
    return <EmptyState title="Корзина пуста" text="Сначала выберите блюда в меню ресторана." />
  const placeOrder = async (data: Form) => {
    if (!selected || !quote.data || quote.isFetching) return
    const body = {
      ...cartInput(cart),
      ...data,
      delivery_address_id: selected.id,
      expected_total: quote.data.total,
    }
    const fingerprint = JSON.stringify(body)
    if (attempt.current?.body !== fingerprint)
      attempt.current = { body: fingerprint, key: crypto.randomUUID() }
    const payload: OrderCreate = { ...body, idempotency_key: attempt.current.key }
    try {
      const order = await createOrder(payload).unwrap()
      dispatch(cartActions.clear())
      navigate(`/orders/${order.id}`, { replace: true })
    } catch {
      setStep(1)
      void quote.refetch()
    }
  }
  return (
    <div className="standard-page">
      <Link to="/cart" className="back-link">
        <ArrowLeft size={18} />В корзину
      </Link>
      <h1>Почти у вашей двери</h1>
      <div className="checkout-steps">
        <span className={step === 1 ? 'current' : 'done'}>
          <b>{step > 1 ? <Check size={16} /> : '1'}</b>Доставка
        </span>
        <i />
        <span className={step === 2 ? 'current' : ''}>
          <b>2</b>Проверка заказа
        </span>
      </div>
      <div className="checkout-grid">
        <div className="panel">
          <form
            onSubmit={form.handleSubmit(async (data) => {
              if (step === 1) setStep(2)
              else await placeOrder(data)
            })}
            id="checkout-form"
            noValidate
          >
            {step === 1 ? (
              <>
                <h2>Куда доставить?</h2>
                {addresses.isLoading ? (
                  <Loading />
                ) : addresses.error ? (
                  <ErrorState error={addresses.error} retry={addresses.refetch} />
                ) : (
                  <div className="address-options">
                    {addresses.data?.map((address) => (
                      <label
                        className={`address-option ${selected?.id === address.id ? 'selected' : ''}`}
                        key={address.id}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          value={address.id}
                          checked={selected?.id === address.id}
                          onChange={() => setAddressId(address.id)}
                        />
                        <MapPin size={20} />
                        <span>
                          <strong>{address.label}</strong>
                          {address.street}, {address.house}
                          {address.apartment && `, кв. ${address.apartment}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <button className="text-link" type="button" onClick={() => setNewAddress(!newAddress)}>
                  <Plus size={17} />
                  Добавить адрес
                </button>
                <Field
                  label="Телефон для связи"
                  type="tel"
                  autoComplete="tel"
                  {...form.register('contact_phone')}
                  error={form.formState.errors.contact_phone?.message}
                />
                <Field
                  label="Комментарий к заказу"
                  {...form.register('customer_comment')}
                  error={form.formState.errors.customer_comment?.message}
                />
                <fieldset className="payment-options">
                  <legend>Оплата при получении</legend>
                  <label>
                    <input type="radio" value="CASH" {...form.register('payment_method')} />
                    Наличными
                  </label>
                  <label>
                    <input type="radio" value="CARD_ON_DELIVERY" {...form.register('payment_method')} />
                    Картой курьеру
                  </label>
                </fieldset>
              </>
            ) : (
              <>
                <h2>Всё верно?</h2>
                <p className="notice">
                  <strong>
                    {selected?.street}, {selected?.house}
                  </strong>
                  <br />
                  {form.getValues('contact_phone')}
                  <br />
                  {form.getValues('payment_method') === 'CASH'
                    ? 'Оплата наличными при получении'
                    : 'Картой курьеру при получении'}
                </p>
                {quote.data?.items.map((item) => (
                  <div className="summary-line" key={item.product_id}>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <strong>{money(item.total_price)}</strong>
                  </div>
                ))}
                <button type="button" className="text-link" onClick={() => setStep(1)}>
                  Изменить данные
                </button>
              </>
            )}
            <InlineError>{result.error ? errorMessage(result.error) : ''}</InlineError>
          </form>
          {step === 1 && (newAddress || addresses.data?.length === 0) && (
            <div className="new-address">
              <h3>Новый адрес</h3>
              <AddressForm
                onSaved={(address) => {
                  setAddressId(address.id)
                  setNewAddress(false)
                }}
              />
            </div>
          )}
        </div>
        <aside className="summary-card">
          <h2>{cart.restaurantName}</h2>
          {quote.isFetching ? (
            <Loading />
          ) : quote.error ? (
            <ErrorState error={quote.error} retry={quote.refetch} />
          ) : (
            quote.data && (
              <>
                <div className="summary-line">
                  <span>Блюда</span>
                  <strong>{money(quote.data.subtotal)}</strong>
                </div>
                <div className="summary-line">
                  <span>Доставка</span>
                  <strong>{money(quote.data.delivery_fee)}</strong>
                </div>
                <div className="summary-total">
                  <span>Итого</span>
                  <strong>{money(quote.data.total)}</strong>
                </div>
              </>
            )
          )}
          <button
            type="submit"
            form="checkout-form"
            className="button full"
            disabled={!selected || !quote.data || !!quote.error || quote.isFetching || result.isLoading}
          >
            {result.isLoading ? 'Оформляем…' : step === 1 ? 'Проверить заказ' : 'Подтвердить заказ'}
          </button>
          <p className="summary-note">
            {step === 1
              ? 'На следующем шаге проверьте состав и сумму заказа.'
              : 'Ресторан начнёт готовить после подтверждения заказа.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
