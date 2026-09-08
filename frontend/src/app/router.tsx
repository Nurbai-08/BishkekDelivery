import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../widgets/Layout'
import { Protected } from '../features/Auth'
import { EmptyState, Loading } from '../shared/ui/State'
import Home from '../pages/Home'

const Restaurant = lazy(() => import('../pages/Restaurant'))
const Cart = lazy(() => import('../pages/Cart'))
const Auth = lazy(() => import('../pages/Auth'))
const Checkout = lazy(() => import('../pages/Checkout'))
const Orders = lazy(() => import('../pages/Orders'))
const OrderDetails = lazy(() => import('../pages/OrderDetails'))
const Favorites = lazy(() => import('../pages/Favorites'))
const Profile = lazy(() => import('../pages/Profile'))
const Merchant = lazy(() => import('../pages/Merchant'))
const Courier = lazy(() => import('../pages/Courier'))
const Admin = lazy(() => import('../pages/Admin'))
const wrap = (element: React.ReactNode) => <Suspense fallback={<Loading />}>{element}</Suspense>

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: (
      <div className="container">
        <EmptyState title="Страница не загрузилась" text="Вернитесь в каталог и попробуйте снова." />
      </div>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/search', element: <Home /> },
      { path: '/restaurants/:id', element: wrap(<Restaurant />) },
      { path: '/cart', element: wrap(<Cart />) },
      { path: '/auth', element: wrap(<Auth />) },
      {
        element: <Protected />,
        children: [
          { path: '/profile', element: wrap(<Profile />) },
          { path: '/favorites', element: wrap(<Favorites />) },
          { path: '/orders', element: wrap(<Orders />) },
          { path: '/orders/:id', element: wrap(<OrderDetails />) },
        ],
      },
      {
        element: <Protected roles={['CUSTOMER']} />,
        children: [{ path: '/checkout', element: wrap(<Checkout />) }],
      },
      {
        element: <Protected roles={['RESTAURANT_OWNER']} />,
        children: [{ path: '/merchant', element: wrap(<Merchant />) }],
      },
      {
        element: <Protected roles={['COURIER']} />,
        children: [{ path: '/courier', element: wrap(<Courier />) }],
      },
      { element: <Protected roles={['ADMIN']} />, children: [{ path: '/admin', element: wrap(<Admin />) }] },
      {
        path: '*',
        element: (
          <EmptyState
            title="Эта страница не в меню"
            text="Кажется, такого адреса нет. Вернёмся к вкусному?"
          />
        ),
      },
    ],
  },
])
