import { useState } from 'react'
import { api } from '../entities/api'
import { RestaurantCard } from '../widgets/RestaurantCard'
import { EmptyState, ErrorState, Loading, Pagination } from '../shared/ui/State'

export default function FavoritesPage() {
  const [page, setPage] = useState(1)
  const favorites = api.useFavoritesQuery(page)
  return (
    <div className="standard-page">
      <span className="mini-label">СОХРАНЕНО С ЛЮБОВЬЮ</span>
      <h1>Любимые места</h1>
      <p className="muted">Те самые рестораны, к которым хочется возвращаться.</p>
      {favorites.isLoading ? (
        <Loading cards />
      ) : favorites.error ? (
        <ErrorState error={favorites.error} retry={favorites.refetch} />
      ) : !favorites.data?.items.length ? (
        <EmptyState
          title="Пока нет избранных ресторанов"
          text="Нажмите на сердечко у любимого места — и оно появится здесь."
        />
      ) : (
        <>
          <div className="restaurant-grid">
            {favorites.data.items.map((place) => (
              <RestaurantCard key={place.id} restaurant={place} />
            ))}
          </div>
          <Pagination page={page} pages={favorites.data.pages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
