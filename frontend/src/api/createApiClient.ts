import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/types/common'

type TokenGetter = () => string | null
type TokenSetter = (token: string) => void
type LogoutFn = () => void

interface CreateApiClientOptions {
  refreshPath: string
  getToken: TokenGetter
  setToken: TokenSetter
  logout: LogoutFn
  loginPath: string
}

export function createApiClient({
  refreshPath,
  getToken,
  setToken,
  logout,
  loginPath,
}: CreateApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  })

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  let isRefreshing = false
  let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
  }> = []

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
    failedQueue = []
  }

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status === 401 && original && !original._retry) {
        if (original.url?.includes(refreshPath)) {
          logout()
          window.location.href = loginPath
          return Promise.reject(error)
        }

        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
        }

        original._retry = true
        isRefreshing = true

        try {
          const { data } = await axios.post(
            `${API_BASE_URL}${refreshPath}`,
            {},
            { withCredentials: true },
          )
          const newToken = data.data.access_token as string
          setToken(newToken)
          processQueue(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshError) {
          processQueue(refreshError)
          logout()
          window.location.href = loginPath
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    },
  )

  return api
}
