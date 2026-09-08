import { ArrowUpRight, Bike, Clock3, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Restaurant } from '../entities/types'
import { Favorite } from '../features/Favorite'
import { FoodImage } from '../shared/ui/FoodImage'
import { money } from '../shared/lib/format'

export function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-cover">
        <Link to={`/restaurants/${restaurant.id}`} tabIndex={-1} aria-hidden="true">
          <FoodImage src={restaurant.cover_url} alt={`Кухня ${restaurant.name}`} eager={index < 3} />
        </Link>
        <span className={`cover-badge ${!restaurant.is_open ? 'closed' : ''}`}>
          {!restaurant.is_open
            ? 'Сейчас закрыто'
            : restaurant.is_featured
              ? 'Стоит попробовать'
              : restaurant.estimated_delivery_max <= 30
                ? 'Быстрая доставка'
                : 'Открывайте новое'}
        </span>
        <Favorite id={restaurant.id} />
        <span className="time-badge">
          <Clock3 size={14} />
          {restaurant.estimated_delivery_min}–{restaurant.estimated_delivery_max} мин
        </span>
      </div>
      <div className="restaurant-title">
        <Link to={`/restaurants/${restaurant.id}`}>
          <h3>{restaurant.name}</h3>
        </Link>
        <span className="rating">
          <Star size={15} fill="currentColor" />
          {restaurant.review_count ? Number(restaurant.rating).toFixed(1) : 'Новый'}
        </span>
      </div>
      <p className="restaurant-cuisines">
        {restaurant.cuisines.map((cuisine) => cuisine.name).join(' · ')}
        <span> · {restaurant.is_demo ? 'Демо' : 'Бишкек'}</span>
      </p>
      <div className="restaurant-meta">
        <span>
          <Bike size={17} />
          Доставка {money(restaurant.base_delivery_fee)}
        </span>
        <Link
          to={`/restaurants/${restaurant.id}`}
          className="menu-link"
          aria-label={`Меню ${restaurant.name}`}
        >
          <ArrowUpRight size={19} />
        </Link>
      </div>
    </article>
  )
}
