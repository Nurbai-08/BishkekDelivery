import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

export function FoodImage({
  src,
  alt,
  eager = false,
  className = '',
}: {
  src: string
  alt: string
  eager?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`food-placeholder ${className}`} role="img" aria-label={`${alt}: фото пока нет`}>
      <UtensilsCrossed size={32} />
      <span>Готовим с заботой</span>
    </div>
  )
}
