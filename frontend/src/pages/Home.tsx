import {
  ArrowDown,
  ArrowRight,
  Bike,
  Clock3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../entities/api'
import { RestaurantCard } from '../widgets/RestaurantCard'
import { FoodImage } from '../shared/ui/FoodImage'
import { EmptyState, ErrorState, Loading, Pagination } from '../shared/ui/State'

export default function Home() {
  const [params, setParams] = useSearchParams(),
    location = useLocation()
  const query = params.get('search') || '',
    cuisine = params.get('cuisine') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [search, setSearch] = useState(query),
    [showFilters, setShowFilters] = useState(false)
  const cuisines = api.useCuisinesQuery()
  const places = api.useRestaurantsQuery({
    search: query || undefined,
    cuisine: cuisine || undefined,
    sort: params.get('sort') || 'popular',
    rating: params.has('rating') ? 4 : undefined,
    delivery_time: params.has('fast') ? 30 : undefined,
    page,
    limit: 9,
  })
  const featured = api.useRestaurantsQuery({ limit: 1 })
  useEffect(() => {
    setSearch(query)
  }, [query])
  useEffect(() => {
    if (search === query) return
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params)
      if (search.trim()) next.set('search', search.trim())
      else next.delete('search')
      next.delete('page')
      setParams(next, { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [search, query, params, setParams])
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }
  const hero = featured.data?.items[0],
    searching = location.pathname === '/search'
  const active = query || cuisine || params.has('rating') || params.has('fast')
  return (
    <div className="home-page">
      <div className="page-eyebrow">
        <span className="live-dot" />
        ВАШ ГОРОД НА ВКУС
      </div>
      <div className="home-heading">
        <div>
          <h1>
            {searching ? (
              'Что найдём вкусного?'
            ) : (
              <>
                Бишкек, <span>приятного аппетита.</span>
              </>
            )}
          </h1>
          <p>Любимые места и новые вкусы — с доставкой до вашей двери.</p>
        </div>
        <span className="city-sign">
          Еда. Город. Вы.<span>42.8746° N · 74.5698° E</span>
        </span>
      </div>
      <form
        className="search-bar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          filter('search', search.trim())
        }}
      >
        <Search size={23} />
        <label className="sr-only" htmlFor="food-search">
          Найти ресторан или блюдо
        </label>
        <input
          id="food-search"
          autoFocus={searching}
          placeholder="Ресторан, блюдо или любимая кухня"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button
            className="icon-button"
            type="button"
            aria-label="Очистить поиск"
            onClick={() => setSearch('')}
          >
            <X size={19} />
          </button>
        )}
        <button className="search-submit" type="submit">
          Найти
          <ArrowRight size={18} />
        </button>
      </form>
      <section className="cuisine-section" aria-label="Кухни">
        <button
          className={`cuisine-item all-cuisines ${!cuisine ? 'active' : ''}`}
          onClick={() => filter('cuisine', '')}
        >
          <span className="cuisine-picture">
            <UtensilsCrossed size={29} />
          </span>
          <span>Всё меню</span>
        </button>
        {cuisines.data?.map((item) => (
          <button
            className={`cuisine-item ${cuisine === item.slug ? 'active' : ''}`}
            key={item.id}
            onClick={() => filter('cuisine', item.slug)}
          >
            <span className="cuisine-picture">
              <FoodImage src={item.image_url} alt="" />
            </span>
            <span>{item.name}</span>
          </button>
        ))}
        {cuisines.isLoading && <div className="skeleton cuisine-skeleton" />}
      </section>
      {!active && !searching && (
        <section className="hero-grid">
          <div className="hero-main">
            <div className="hero-copy">
              <span className="hero-eyebrow">
                <Sparkles size={15} />
                МАЛЕНЬКИЙ ПОВОД ДЛЯ РАДОСТИ
              </span>
              <h2>
                Хороший день
                <br />
                начинается
                <br />с <em>вкусного.</em>
              </h2>
              <p>
                Выбирайте, что хочется сегодня.
                <br />
                Всё остальное мы берём на себя.
              </p>
              <a className="button dark" href="#restaurants">
                Выбрать ресторан
                <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-photo">
              <FoodImage
                src={hero?.cover_url || ''}
                alt={hero ? 'Кухня ' + hero.name : 'Кухня Бишкека'}
                eager
              />
              <div className="photo-stamp">
                ЕСТЬ
                <br />
                <b>ПОВОД</b>
                <span>ПОРАДОВАТЬ СЕБЯ</span>
              </div>
            </div>
          </div>
          <div className="hero-side">
            <span className="mini-label">БОЛЬШЕ ВРЕМЕНИ ДЛЯ ВАС</span>
            <div className="bike-art">
              <Bike strokeWidth={1.3} />
              <span className="route-line" />
            </div>
            <h3>
              Ваш обед.
              <br />
              Без лишних планов.
            </h3>
            <p>
              От любимого ресторана
              <br />
              до вашей двери.
            </p>
            <button
              className="text-link"
              onClick={() => {
                filter('fast', '1')
                document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Доставим быстрее
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}
      <section id="restaurants" className="catalog-section">
        <div className="section-heading">
          <div>
            <span className="mini-label">МЕСТА, КОТОРЫЕ СТОИТ ОТКРЫТЬ</span>
            <h2>
              {query
                ? `Результаты поиска`
                : cuisine
                  ? cuisines.data?.find((item) => item.slug === cuisine)?.name || 'Рестораны'
                  : 'Что будете сегодня?'}{' '}
              <span className="result-count">{places.data?.total ?? '…'}</span>
            </h2>
          </div>
          <button
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={18} />
            Фильтры
          </button>
        </div>
        <div className="filter-row">
          <button
            className={`chip ${!params.has('fast') && !params.has('rating') ? 'active' : ''}`}
            onClick={() => {
              const next = new URLSearchParams(params)
              next.delete('fast')
              next.delete('rating')
              next.delete('page')
              setParams(next)
            }}
          >
            Все рестораны
          </button>
          <button
            className={`chip ${params.has('fast') ? 'active' : ''}`}
            onClick={() => filter('fast', params.has('fast') ? '' : '1')}
          >
            <Clock3 size={16} />
            До 30 минут
          </button>
          <button
            className={`chip ${params.has('rating') ? 'active' : ''}`}
            onClick={() => filter('rating', params.has('rating') ? '' : '4')}
          >
            <Sparkles size={16} />
            Высокий рейтинг
          </button>
          <label className="sort-label">
            <span>Сначала</span>
            <select
              aria-label="Сортировка ресторанов"
              value={params.get('sort') || 'popular'}
              onChange={(event) => filter('sort', event.target.value)}
            >
              <option value="popular">Рекомендуемые</option>
              <option value="delivery">Быстрые</option>
              <option value="rating">С лучшим рейтингом</option>
              <option value="fee">Дешевле доставка</option>
            </select>
          </label>
        </div>
        {showFilters && (
          <div className="filter-panel">
            <p>
              Поиск работает по названиям ресторанов, блюд и кухонь. Быстрая доставка — до 30 минут, высокий
              рейтинг — от 4,0.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setSearch('')
                setParams({})
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        )}
        {places.isLoading ? (
          <Loading cards />
        ) : places.error ? (
          <ErrorState error={places.error} retry={places.refetch} />
        ) : places.data?.items.length ? (
          <div
            className={`restaurant-grid ${places.isFetching ? 'fetching' : ''}`}
            aria-busy={places.isFetching}
          >
            {places.data.items.map((restaurant, index) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState title="Пока ничего не нашлось" text="Попробуйте другое блюдо или сбросьте фильтры." />
        )}
        <Pagination
          page={page}
          pages={places.data?.pages || 0}
          onChange={(value) => {
            const next = new URLSearchParams(params)
            next.set('page', String(value))
            setParams(next)
            document.getElementById('restaurants')?.scrollIntoView()
          }}
        />
      </section>
      <div className="service-strip">
        <span>
          <UtensilsCrossed />
          На любой аппетит
        </span>
        <span>
          <Bike />
          Прямо до вашей двери
        </span>
        <span>
          <ShieldCheck />
          Оплата при получении
        </span>
        <a href="#main">
          Наверх
          <ArrowDown className="rotate" size={17} />
        </a>
      </div>
    </div>
  )
}
