import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { SessionProvider } from '@/auth/SessionContext'
import { modeAuthentification } from '@/auth/session'
import './index.css'

// MSW : uniquement en développement et jamais en mode Google, sinon les appels
// `/api/*` seraient interceptés et le vrai backend ne serait jamais joint.
const mocksActifs =
  import.meta.env.DEV &&
  import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
  modeAuthentification() === 'mock';

if (mocksActifs) {
  import('./mocks/browser').then(({ worker }) => {
    worker.start();
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)