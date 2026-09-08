import { ArrowRight, CircleAlert, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/baseApi'

export function Loading({ cards = false }: { cards?: boolean }) {
  return (
    <div role="status" aria-label="Загрузка" className={cards ? 'restaurant-grid' : 'loading-stack'}>
      {Array.from({ length: cards ? 6 : 3 }, (_, i) => (
        <div key={i} className={`skeleton ${cards ? 'skeleton-card' : 'skeleton-line'}`} />
      ))}
      <span className="sr-only">Загружаем…</span>
    </div>
  )
}
export function ErrorState({
  error,
  retry,
  children,
}: {
  error: unknown
  retry?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="state-box error-state" role="alert">
      <CircleAlert size={30} />
      <h3>Не получилось загрузить</h3>
      <p>{errorMessage(error)}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Попробовать ещё раз
        </button>
      )}
      {children}
    </div>
  )
}
export function EmptyState({
  title,
  text,
  link = '/',
  action = 'Найти рестораны',
}: {
  title: string
  text: string
  link?: string
  action?: string
}) {
  return (
    <div className="state-box">
      <div className="state-icon">
        <UtensilsCrossed size={30} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to={link}>
        {action}
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
export function InlineError({ children }: { children: React.ReactNode }) {
  return children ? (
    <p role="alert" className="inline-error">
      <CircleAlert size={18} />
      {children}
    </p>
  ) : null
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  if (pages <= 1) return null
  return (
    <nav className="pagination" aria-label="Страницы">
      <button className="button secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Назад
      </button>
      <span>
        {page} / {pages}
      </span>
      <button className="button secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Далее
      </button>
    </nav>
  )
}
