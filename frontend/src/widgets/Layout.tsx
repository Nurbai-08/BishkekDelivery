import {
  ArrowUpRight,
  Bike,
  ChevronDown,
  Heart,
  Home,
  MapPin,
  Search,
  ShoppingBag,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { config } from '../shared/config'
import { cartCount, cartTotal, selectCart } from '../entities/cart'
import { money } from '../shared/lib/format'
import { api } from '../entities/api'
import { Modal } from '../shared/ui/Modal'
import { useAuth } from '../features/Auth'

export function Layout() {
  const cart = useSelector(selectCart),
    auth = useAuth(),
    navigate = useNavigate(),
    location = useLocation()
  const [addressOpen, setAddressOpen] = useState(false)
  const addresses = api.useAddressesQuery(undefined, { skip: !auth.signedIn })
  const { data: settings } = api.useConfigQuery()
  const selectedAddress = addresses.data?.find((address) => address.is_default) || addresses.data?.[0]
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  const nameParts = config.appName.split(' ')
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label={`${config.appName} — главная`}>
            <span className="brand-mark">
              <UtensilsCrossed size={25} />
            </span>
            <span>
              {nameParts[0]}
              <small>{nameParts.slice(1).join(' ') || 'Delivery'}</small>
            </span>
          </Link>
          <span className="header-divider" />
          <button className="location-button" onClick={() => setAddressOpen(true)}>
            <MapPin size={20} />
            <span>
              <small>Доставляем в Бишкеке</small>
              <strong>
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.house}`
                  : 'Укажите адрес доставки'}
              </strong>
            </span>
            <ChevronDown size={16} />
          </button>
          <div className="header-actions">
            <NavLink className="header-link" to="/orders" aria-label="Заказы">
              <ShoppingBag size={20} />
              <span>Заказы</span>
            </NavLink>
            <NavLink className="icon-button desktop-favorite" to="/favorites" aria-label="Избранное">
              <Heart size={21} />
            </NavLink>
            <NavLink className="header-link profile-link" to="/profile" aria-label="Профиль">
              <UserRound size={20} />
              <span>{auth.user?.first_name || (auth.signedIn ? 'Профиль' : 'Войти')}</span>
            </NavLink>
            <Link className="header-cart" to="/cart">
              <ShoppingBag size={19} />
              <span>Корзина</span>
              <b>{cartCount(cart)}</b>
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer container">
        <div className="footer-top">
          <div>
            <Link className="footer-brand" to="/">
              {config.appName}
              <ArrowUpRight size={20} />
            </Link>
            <p>Вкусный город. Ближе, чем кажется.</p>
          </div>
          <span className="footer-city">
            <MapPin size={17} /> Бишкек, Кыргызстан
          </span>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {config.appName}
          </span>
          {settings?.demo_catalog && <span>Демонстрационный каталог · рестораны вымышлены</span>}
          <span>Сделано для вашего аппетита</span>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Главная навигация">
        <NavLink to="/" end>
          <Home size={21} />
          <span>Главная</span>
        </NavLink>
        <NavLink to="/search">
          <Search size={21} />
          <span>Поиск</span>
        </NavLink>
        <NavLink to="/orders">
          <ShoppingBag size={21} />
          <span>Заказы</span>
        </NavLink>
        <NavLink to="/favorites">
          <Heart size={21} />
          <span>Любимое</span>
        </NavLink>
        <NavLink to="/profile">
          <UserRound size={21} />
          <span>Профиль</span>
        </NavLink>
      </nav>
      {cart.items.length > 0 && !['/cart', '/checkout'].includes(location.pathname) && (
        <Link className="floating-cart" to="/cart">
          <span>
            <ShoppingBag size={20} /> Корзина · {cartCount(cart)}
          </span>
          <b>{money(cartTotal(cart))}</b>
        </Link>
      )}
      {addressOpen && (
        <Modal title="Куда доставить?" onClose={() => setAddressOpen(false)}>
          <div className="location-intro">
            <Bike size={32} />
            <p>Пока работаем в Бишкеке. Сохраните адрес в профиле — и он будет под рукой при оформлении.</p>
          </div>
          {selectedAddress && (
            <p className="notice">
              {selectedAddress.street}, {selectedAddress.house}
            </p>
          )}
          <button
            className="button full"
            onClick={() => {
              setAddressOpen(false)
              navigate('/profile')
            }}
          >
            Указать адрес
          </button>
        </Modal>
      )}
    </>
  )
}
