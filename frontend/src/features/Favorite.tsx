import { Heart } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../entities/api'
import { useAuth } from './Auth'
import { errorMessage } from '../shared/api/baseApi'

export function Favorite({ id }: { id: string }) {
  const auth = useAuth(),
    navigate = useNavigate(),
    location = useLocation()
  const { data } = api.useFavoritesQuery(1, { skip: !auth.signedIn })
  const [toggle, state] = api.useFavoriteMutation()
  const active = data?.items.some((place) => place.id === id) || false
  return (
    <>
      <button
        className={`favorite-button ${active ? 'selected' : ''}`}
        aria-label={active ? 'Удалить из избранного' : 'Добавить в избранное'}
        aria-pressed={active}
        disabled={state.isLoading}
        onClick={() => {
          if (!auth.signedIn) navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`)
          else void toggle({ id, active: !active })
        }}
      >
        <Heart size={20} fill={active ? 'currentColor' : 'none'} />
      </button>
      {state.error && (
        <span className="card-error" role="alert">
          {errorMessage(state.error)}
        </span>
      )}
    </>
  )
}
