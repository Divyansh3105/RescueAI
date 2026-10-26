import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sessionKey } from './auth/session';
import { ApiError } from './lib/api';
import './index.css';
import App from './App.tsx';

// RULES.md -> State Management: server data comes only from TanStack Query.
const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 anywhere means the session ended: mark signed out so RequireRole sends the
    // user to /login with a way back.
    onError: (error, query) => {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        query.queryKey[0] !== sessionKey[0]
      ) {
        queryClient.setQueryData(sessionKey, null);
      }
    },
  }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
