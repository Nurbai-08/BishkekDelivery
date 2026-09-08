import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useDispatch } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { firebaseAuth } from '../shared/lib/firebase'
import { baseApi } from '../shared/api/baseApi'
import { api } from '../entities/api'
import type { Role, User } from '../entities/types'
import { ErrorState, Loading } from '../shared/ui/State'

interface AuthContextValue {
  ready: boolean
  signedIn: boolean
  user?: User
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue>({ ready: false, signedIn: false, logout: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const [identity, setIdentity] = useState({ ready: !firebaseAuth, uid: '' })
  const profile = api.useMeQuery(undefined, { skip: !identity.uid })
  useEffect(() => {
    if (!firebaseAuth) return
    return onAuthStateChanged(firebaseAuth, (user) => {
      dispatch(baseApi.util.resetApiState())
      setIdentity({ ready: true, uid: user?.uid || '' })
    })
  }, [dispatch])
  const logout = async () => {
    if (firebaseAuth) await signOut(firebaseAuth)
  }
  return (
    <AuthContext.Provider
      value={{
        ready: identity.ready && !profile.isLoading,
        signedIn: !!identity.uid,
        user: profile.data,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Shared hook and its provider form one authentication feature.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function Protected({ roles }: { roles?: Role[] }) {
  const auth = useAuth()
  const location = useLocation()
  const profile = api.useMeQuery(undefined, { skip: !auth.signedIn })
  if (!auth.ready) return <Loading />
  if (!auth.signedIn)
    return (
      <Navigate to={`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
    )
  if (profile.error)
    return (
      <ErrorState error={profile.error} retry={profile.refetch}>
        <button className="text-link" onClick={() => void auth.logout()}>
          Выйти из аккаунта
        </button>
      </ErrorState>
    )
  if (roles && auth.user && !roles.includes(auth.user.role))
    return (
      <div className="state-box">
        <h1>Нет доступа</h1>
        <p>Этот раздел доступен для другой роли.</p>
      </div>
    )
  return <Outlet />
}
