import { describe, expect, it } from 'vitest'
import { errorMessage } from './errorMessage'

describe('API error messages', () => {
  it('explains incomplete Firebase Admin configuration', () => {
    expect(errorMessage({ status: 503, data: { error: { code: 'AUTH_NOT_CONFIGURED' } } })).toContain(
      'после подключения Firebase Admin',
    )
  })
  it('handles an empty proxy error response', () => {
    expect(errorMessage({ status: 'PARSING_ERROR', originalStatus: 500, data: '' })).toContain(
      'Сервер временно недоступен',
    )
  })
  it('preserves actionable token and domain errors', () => {
    expect(errorMessage({ status: 'CUSTOM_ERROR', error: 'Войдите повторно.' })).toBe('Войдите повторно.')
    expect(errorMessage({ status: 422, data: { error: { message: 'Проверьте адрес' } } })).toBe(
      'Проверьте адрес',
    )
  })
})
