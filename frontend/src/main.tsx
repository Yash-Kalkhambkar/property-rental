import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@/lib/queryClient'
import { useOwnerAuthStore } from '@/stores/ownerAuthStore'
import { useTenantAuthStore } from '@/stores/tenantAuthStore'
import '@/styles/globals.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Restore persisted sessions before first render
useOwnerAuthStore.getState().hydrate()
useTenantAuthStore.getState().hydrate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'glass-owner text-owner-text border border-white/10',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
