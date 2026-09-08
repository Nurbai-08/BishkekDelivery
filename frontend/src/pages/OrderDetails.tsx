import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, Check, MapPin, Star } from 'lucide-react'
import { api } from '../entities/api'
import { isActive, statuses, steps } from '../entities/status'
import { dateTime, money } from '../shared/lib/format'
import { ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'
import { Modal } from '../shared/ui/Modal'

export default function OrderDetails() {
  const { id = '' } = useParams()
  const [poll, setPoll] = useState(15000)
  const query = api.useOrderQuery(id, { pollingInterval: poll, skipPollingIfUnfocused: true })
  const [cancel, cancelState] = api.useCancelOrderMutation(),
    [review, reviewState] = api.useReviewMutation()
  const [confirm, setConfirm] = useState(false),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState('')
  useEffect(() => {
    if (query.data && !isActive(query.data.status)) setPoll(0)
  }, [query.data])
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={query.refetch} />
  const order = query.data
  if (!order) return null
  return (
    <div className="standard-page">
      <Link className="back-link" to="/orders">
        <ArrowLeft size={18} />
        Мои заказы
      </Link>
      <span className="mini-label">{order.order_number}</span>
      <h1>{statuses[order.status]}</h1>
      <p className="muted">
        {order.restaurant_name} · {dateTime(order.created_at)}
      </p>
      <div className="checkout-grid">
        <div>
          <section className="panel">
            <div className="section-heading">
              <h2>От кухни до вашей двери</h2>
              <Bike size={28} />
            </div>
            <ol className="timeline">
              {steps.map((status) => {
                const event = order.history.find((item) => item.to_status === status)
                return (
                  <li
                    key={status}
                    className={`${event ? 'complete' : ''} ${order.status === status ? 'current' : ''}`}
                  >
                    <span className="timeline-dot">{event && <Check size={15} />}</span>
                    <div>
                      <strong>{statuses[status]}</strong>
                      {event && <small>{dateTime(event.created_at)}</small>}
                    </div>
                  </li>
                )
              })}
            </ol>
            {order.status === 'CANCELLED' && (
              <p className="notice">Заказ отменён. Приготовление и доставка остановлены.</p>
            )}
            {order.status === 'PENDING' && (
              <button className="button secondary" onClick={() => setConfirm(true)}>
                Отменить заказ
              </button>
            )}
            <InlineError>{cancelState.error ? errorMessage(cancelState.error) : ''}</InlineError>
          </section>
          {order.status === 'DELIVERED' && (
            <section className="panel review-form">
              <h2>Как всё прошло?</h2>
              {reviewState.isSuccess ? (
                <p className="notice" role="status">
                  Спасибо! Ваш отзыв опубликован.
                </p>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void review({ order_id: id, rating, comment })
                  }}
                >
                  <fieldset className="stars">
                    <legend>Оцените ресторан</legend>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className={value <= rating ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          checked={rating === value}
                          onChange={() => setRating(value)}
                          aria-label={`${value} из 5`}
                        />
                        <Star size={27} fill={value <= rating ? 'currentColor' : 'none'} />
                      </label>
                    ))}
                  </fieldset>
                  <div className="field">
                    <label htmlFor="review-comment">Ваши впечатления</label>
                    <textarea
                      id="review-comment"
                      maxLength={2000}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </div>
                  <InlineError>{reviewState.error ? errorMessage(reviewState.error) : ''}</InlineError>
                  <button className="button" disabled={reviewState.isLoading}>
                    {reviewState.isLoading ? 'Публикуем…' : 'Оставить отзыв'}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
        <aside className="summary-card">
          <h2>Состав заказа</h2>
          {order.items.map((item) => (
            <div className="summary-line" key={item.product_id}>
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <strong>{money(item.total_price)}</strong>
            </div>
          ))}
          <div className="summary-line">
            <span>Доставка</span>
            <strong>{money(order.delivery_fee)}</strong>
          </div>
          <div className="summary-total">
            <span>Итого</span>
            <strong>{money(order.total)}</strong>
          </div>
          <p className="address-summary">
            <MapPin size={19} />
            <span>
              {order.address_snapshot.street}, {order.address_snapshot.house}
              {order.address_snapshot.apartment && `, кв. ${order.address_snapshot.apartment}`}
              <br />
              {order.contact_phone}
            </span>
          </p>
          <p className="muted">
            {order.payment_method === 'CASH' ? 'Наличными' : 'Картой курьеру'} ·{' '}
            {order.payment_status === 'PAID' ? 'Оплачено' : 'При получении'}
          </p>
          {order.customer_comment && <p>{order.customer_comment}</p>}
        </aside>
      </div>
      {confirm && (
        <Modal title="Отменить заказ?" onClose={() => setConfirm(false)}>
          <p>Заказ можно отменить, пока ресторан его не принял.</p>
          <div className="button-row">
            <button className="button secondary" onClick={() => setConfirm(false)}>
              Оставить заказ
            </button>
            <button
              className="button danger"
              disabled={cancelState.isLoading}
              onClick={async () => {
                await cancel(id)
                setConfirm(false)
              }}
            >
              Отменить заказ
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
