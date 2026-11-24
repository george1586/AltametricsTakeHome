import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { store } from './store/store.ts';
import { ProtectedRoute } from './routes/ProtectedRoute.tsx';
import { AppLayout } from './components/AppLayout.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { InvoicesPage } from './features/invoices/InvoicePage.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/invoices', element: <InvoicesPage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/invoices" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);