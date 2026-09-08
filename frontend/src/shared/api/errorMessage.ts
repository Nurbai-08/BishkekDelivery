export function errorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Не удалось выполнить действие. Попробуйте ещё раз.'
  if ('data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'error' in data) {
      const detail = data.error
      if (detail && typeof detail === 'object') {
        if ('code' in detail && detail.code === 'AUTH_NOT_CONFIGURED')
          return 'Вход в Firebase выполнен, но серверная проверка аккаунта ещё не настроена. Профиль станет доступен после подключения Firebase Admin.'
        if ('message' in detail && typeof detail.message === 'string') return detail.message
      }
    }
  }
  if ('status' in error) {
    const status =
      error.status === 'PARSING_ERROR' && 'originalStatus' in error ? error.originalStatus : error.status
    if (
      status === 'FETCH_ERROR' ||
      status === 'TIMEOUT_ERROR' ||
      (typeof status === 'number' && status >= 500)
    )
      return 'Сервер временно недоступен. Попробуйте ещё раз через некоторое время.'
    if (status === 401) return 'Сессия истекла. Выйдите из аккаунта и войдите снова.'
    if (status === 403) return 'Доступ к этому разделу ограничен.'
    if (status === 'CUSTOM_ERROR' && 'error' in error && typeof error.error === 'string') return error.error
  }
  if ('message' in error && typeof error.message === 'string') return error.message
  return 'Не удалось выполнить действие. Попробуйте ещё раз.'
}
