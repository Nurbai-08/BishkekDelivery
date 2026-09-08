import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Check, Plus } from 'lucide-react'
import { cartActions, selectCart } from '../entities/cart'
import type { Product } from '../entities/types'
import { Modal } from '../shared/ui/Modal'

export function AddToCart({
  product,
  restaurantName,
  closed = false,
}: {
  product: Product
  restaurantName: string
  closed?: boolean
}) {
  const dispatch = useDispatch()
  const cart = useSelector(selectCart)
  const [confirm, setConfirm] = useState(false)
  const count = cart.items.find((item) => item.id === product.id)?.quantity || 0
  const add = (replace = false) => {
    dispatch(cartActions.add({ product, restaurantName, replace }))
    setConfirm(false)
  }
  return (
    <>
      <button
        className={`add-button ${count ? 'added' : ''}`}
        disabled={!product.is_available || closed || count >= 99}
        aria-label={`Добавить ${product.name}`}
        onClick={() =>
          cart.items.length && cart.restaurantId !== product.restaurant_id ? setConfirm(true) : add()
        }
      >
        {count ? (
          <>
            <Check size={18} />
            {count}
          </>
        ) : (
          <Plus size={20} />
        )}
      </button>
      <span className="sr-only" role="status">
        {count > 0 ? `${product.name}: в корзине ${count}` : ''}
      </span>
      {confirm && (
        <Modal title="Заменить корзину?" onClose={() => setConfirm(false)}>
          <p>
            В корзине уже есть блюда из «{cart.restaurantName}». Очистить её и добавить блюдо из «
            {restaurantName}»?
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={() => setConfirm(false)}>
              Отмена
            </button>
            <button className="button" onClick={() => add(true)}>
              Очистить и добавить
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
