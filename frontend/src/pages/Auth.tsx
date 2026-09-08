import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Mail, UtensilsCrossed } from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { firebaseAuth } from '../shared/lib/firebase'
import { useAuth } from '../features/Auth'
import { Field } from '../shared/ui/Field'
import { InlineError } from '../shared/ui/State'

const schema = z.object({
  email: z.email('Укажите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов').max(128),
  name: z.string().max(100),
})
type Form = z.infer<typeof schema>

function authError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/email-already-in-use': 'Этот email уже зарегистрирован. Попробуйте войти.',
    'auth/popup-closed-by-user': 'Вход через Google отменён.',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
    'auth/network-request-failed': 'Проверьте подключение к интернету.',
    'auth/operation-not-allowed': 'Этот способ входа ещё не включён.',
  }
  return messages[code] || 'Не удалось войти. Проверьте данные и попробуйте ещё раз.'
}

export default function AuthPage() {
  const auth = useAuth(),
    [params] = useSearchParams()
  const [registerMode, setRegisterMode] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' },
  })
  const requested = params.get('returnTo') || '/profile'
  const returnTo =
    requested.startsWith('/') &&
    !requested.startsWith('//') &&
    !requested.includes('\\') &&
    !requested.startsWith('/auth')
      ? requested
      : '/profile'
  if (auth.ready && auth.signedIn) return <Navigate to={returnTo} replace />
  const submit = async (data: Form) => {
    if (!firebaseAuth) return
    setError('')
    setBusy(true)
    try {
      if (registerMode) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password)
        if (data.name) await updateProfile(credential.user, { displayName: data.name })
      } else await signInWithEmailAndPassword(firebaseAuth, data.email, data.password)
    } catch (issue) {
      setError(authError(issue))
    } finally {
      setBusy(false)
    }
  }
  const google = async () => {
    if (!firebaseAuth) return
    setError('')
    setBusy(true)
    try {
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
    } catch (issue) {
      setError(authError(issue))
    } finally {
      setBusy(false)
    }
  }
  const reset = async () => {
    if (!firebaseAuth) return
    if (!(await form.trigger('email'))) return
    setBusy(true)
    setError('')
    try {
      await sendPasswordResetEmail(firebaseAuth, form.getValues('email'))
      setNotice('Если аккаунт существует, письмо для восстановления отправлено.')
    } catch (issue) {
      setError(authError(issue))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} />В каталог
      </Link>
      <div className="auth-grid">
        <div className="auth-story">
          <span className="brand-mark">
            <UtensilsCrossed />
          </span>
          <span className="mini-label">ВАШ ВКУСНЫЙ УГОЛОК ГОРОДА</span>
          <h1>
            Хорошо,
            <br />
            когда вас
            <br />
            <em>помнят.</em>
          </h1>
          <p>
            Любимые рестораны, сохранённые адреса
            <br />и все заказы — в одном месте.
          </p>
        </div>
        <div className="auth-card">
          <span className="mini-label">РАДЫ ВАС ВИДЕТЬ</span>
          <h2>{registerMode ? 'Давайте знакомиться' : 'С возвращением'}</h2>
          <p className="muted">
            {registerMode
              ? 'Создайте аккаунт и откройте свой вкус Бишкека.'
              : 'Войдите, чтобы заказать что-нибудь вкусное.'}
          </p>
          {!firebaseAuth && (
            <p className="notice">
              Вход ещё не подключён: владельцу проекта нужно настроить Firebase. Каталог и корзина доступны.
            </p>
          )}
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            {registerMode && (
              <Field
                label="Ваше имя"
                autoComplete="given-name"
                {...form.register('name')}
                error={form.formState.errors.name?.message}
              />
            )}
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
            <Field
              label="Пароль"
              type="password"
              autoComplete={registerMode ? 'new-password' : 'current-password'}
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />
            <InlineError>{error}</InlineError>
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
            <button className="button full" disabled={busy || !firebaseAuth}>
              {busy ? 'Подождите…' : registerMode ? 'Создать аккаунт' : 'Войти'}
              <ArrowRight size={18} />
            </button>
          </form>
          {!registerMode && (
            <button
              className="text-link reset-link"
              disabled={busy || !firebaseAuth}
              onClick={() => void reset()}
            >
              Забыли пароль?
            </button>
          )}
          <div className="or-divider">
            <span>или</span>
          </div>
          <button
            className="button secondary full"
            disabled={busy || !firebaseAuth}
            onClick={() => void google()}
          >
            <Mail size={18} />
            Продолжить с Google
          </button>
          <p className="auth-switch">
            {registerMode ? 'Уже есть аккаунт?' : 'Впервые у нас?'}{' '}
            <button
              onClick={() => {
                setRegisterMode(!registerMode)
                setError('')
              }}
            >
              {registerMode ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
