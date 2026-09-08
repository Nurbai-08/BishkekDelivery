import { ArrowLeft, Bike, Clock3, MapPin, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../entities/api'
import { AddToCart } from '../features/AddToCart'
import { Favorite } from '../features/Favorite'
import { FoodImage } from '../shared/ui/FoodImage'
import { EmptyState, ErrorState, Loading, Pagination } from '../shared/ui/State'
import { dateTime, money } from '../shared/lib/format'

export default function RestaurantPage() {
  const { id = '' } = useParams()
  const place = api.useRestaurantQuery(id),
    menu = api.useMenuQuery(id)
  const [reviewPage, setReviewPage] = useState(1)
  const reviews = api.useReviewsQuery({ id, page: reviewPage })
  if (place.isLoading) return <Loading />
  if (place.error) return <ErrorState error={place.error} retry={place.refetch} />
  const restaurant = place.data
  if (!restaurant) return null
  return (
    <div className="restaurant-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={18} />
        Все рестораны
      </Link>
      <section className="restaurant-banner">
        <FoodImage src={restaurant.cover_url} alt={`Кухня ${restaurant.name}`} eager />
        <div className="restaurant-banner-shade" />
        <div className="restaurant-banner-copy">
          <span className="hero-eyebrow">
            {restaurant.cuisines.map((item) => item.name).join(' · ')}
            {restaurant.is_demo && ' · Демо-ресторан'}
          </span>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.description}</p>
        </div>
        <Favorite id={id} />
      </section>
      <div className="restaurant-info">
        <span>
          <Star size={18} />
          {restaurant.review_count
            ? `${Number(restaurant.rating).toFixed(1)} · ${restaurant.review_count} отзывов`
            : 'Новый ресторан'}
        </span>
        <span>
          <Clock3 size={19} />
          {restaurant.estimated_delivery_min}–{restaurant.estimated_delivery_max} мин
        </span>
        <span>
          <Bike size={19} />
          {money(restaurant.base_delivery_fee)}
        </span>
        <span>
          <MapPin size={19} />
          {restaurant.address_text}
        </span>
      </div>
      {!restaurant.is_open && (
        <p className="notice">Ресторан сейчас закрыт. Можно посмотреть меню и вернуться позже.</p>
      )}
      <nav className="menu-tabs" aria-label="Категории меню">
        {menu.data?.categories.map((category) => (
          <a className="chip" key={category.id} href={`#category-${category.id}`}>
            {category.name}
          </a>
        ))}
        <a className="chip" href="#reviews">
          Отзывы
        </a>
      </nav>
      {menu.isLoading ? (
        <Loading cards />
      ) : menu.error ? (
        <ErrorState error={menu.error} retry={menu.refetch} />
      ) : !menu.data?.products.length ? (
        <EmptyState title="Меню скоро появится" text="Ресторан ещё добавляет свои блюда." />
      ) : (
        menu.data.categories.map((category) => (
          <section className="menu-section" key={category.id} id={`category-${category.id}`}>
            <div className="section-heading">
              <h2>{category.name}</h2>
              <span className="muted">Приготовим после заказа</span>
            </div>
            <div className="product-grid">
              {menu.data.products
                .filter((product) => product.menu_category_id === category.id)
                .map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      <FoodImage src={product.image_url} alt={product.name} />
                      {product.is_featured && <span className="cover-badge">Выбор кухни</span>}
                    </div>
                    <div className="product-copy">
                      <div className="product-price">
                        {money(product.price)}
                        <span>
                          {product.weight_value} {product.weight_unit}
                        </span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="product-bottom">
                        <span>{product.is_available ? 'Готовим с заботой' : 'Нет в наличии'}</span>
                        <AddToCart
                          product={product}
                          restaurantName={restaurant.name}
                          closed={!restaurant.is_open}
                        />
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))
      )}
      <section id="reviews" className="reviews-section">
        <h2>Впечатления гостей</h2>
        {reviews.isLoading ? (
          <Loading />
        ) : reviews.error ? (
          <ErrorState error={reviews.error} retry={reviews.refetch} />
        ) : reviews.data?.items.length ? (
          <>
            <div className="review-grid">
              {reviews.data.items.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="restaurant-title">
                    <strong>{review.author_name}</strong>
                    <span className="rating">
                      <Star size={15} fill="currentColor" />
                      {review.rating}
                    </span>
                  </div>
                  <p>{review.comment || 'Оценка без комментария'}</p>
                  <small>{dateTime(review.created_at)}</small>
                </article>
              ))}
            </div>
            <Pagination page={reviewPage} pages={reviews.data.pages} onChange={setReviewPage} />
          </>
        ) : (
          <p className="muted">Пока нет отзывов. После доставки вы сможете поделиться впечатлениями.</p>
        )}
      </section>
      {restaurant.image_attribution && (
        <p className="image-attribution">Фото обложки: {restaurant.image_attribution}</p>
      )}
    </div>
  )
}
