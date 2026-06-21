import type { AxiosError } from 'axios'

interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosError = error as AxiosError<{ detail?: string | ValidationError[] }>
  const detail = axiosError.response?.data?.detail

  if (!detail) return fallback
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d.msg).join(', ')
  }

  return fallback
}
