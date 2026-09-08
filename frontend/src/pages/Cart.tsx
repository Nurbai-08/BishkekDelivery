import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { api } from '../entities/api'
import { cartActions, cartInput, cartTotal, selectCart } from '../entities/cart'
import { FoodImage } from '../shared/ui/FoodImage'
import { EmptyState, ErrorState, Loading } from '../shared/ui/State'
import { money } from '../shared/lib/format'

export default function CartPage() {
  const cart = useSelector(selectCart),
    dispatch = useDispatch()
  const quote = api.useQuoteQuery(cartInput(cart), {
    skip: !cart.items.length,
    refetchOnMountOrArgChange: true,
  })
  if (!cart.items.length)
    return (
      <EmptyState
        title="Тут пока ничего вкусного"
        text="Самое время заглянуть в меню и найти что-нибудь по душе."
      />
    )
  return (
    <div className="standard-page">
      <Link className="back-link" to={`/restaurants/${cart.restaurantId}`}>
        <ArrowLeft size={18} />
        Вернуться в меню
      </Link>
      <div className="section-heading">
        <div>
          <span className="mini-label">ВАШ ВЫБОР</span>
          <h1>Корзина</h1>
          <p className="muted">Из ресторана «{cart.restaurantName}»</p>
        </div>
      </div>
      <div className="checkout-grid">
        <div className="cart-lines">
          {cart.items.map((item) => (
            <article className="cart-line" key={item.id}>
              <FoodImage src={item.image_url} alt={item.name} />
              <div className="cart-line-name">
                <h3>{item.name}</h3>
                <p>{money(item.price)}</p>
              </div>
              <div className="quantity">
                <button
                  aria-label={`Уменьшить ${item.name}`}
                  onClick={() => dispatch(cartActions.quantity({ id: item.id, value: item.quantity - 1 }))}
                >
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button
                  disabled={item.quantity >= 99}
                  aria-label={`Увеличить ${item.name}`}
                  onClick={() => dispatch(cartActions.quantity({ id: item.id, value: item.quantity + 1 }))}
                >
                  <Plus size={16} />
                </button>
              </div>
              <strong>{money(Number(item.price) * item.quantity)}</strong>
              <button
                className="icon-button muted"
                aria-label={`Удалить ${item.name}`}
                onClick={() => dispatch(cartActions.quantity({ id: item.id, value: 0 }))}
              >
                <Trash2 size={18} />
              </button>
            </article>
          ))}
          <Link className="text-link" to={`/restaurants/${cart.restaurantId}`}>
            <Plus size={18} />
            Добавить ещё что-нибудь
          </Link>
        </div>
        <aside className="summary-card">
          <h2>Ваш заказ</h2>
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
                {Number(quote.data.subtotal) !== cartTotal(cart) && (
                  <p className="notice">Цены обновились. Итог рассчитан по актуальному меню.</p>
                )}
                <Link className="button full" to="/checkout">
                  К оформлению
                  <ArrowRight size={18} />
                </Link>
                <p className="summary-note">
                  Оплата при получении.
                  <br />
                  Всё просто, всё прозрачно.
                </p>
              </>
            )
          )}
        </aside>
      </div>
    </div>
  )
}
