import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface RouterContextValue {
  path: string;
  search: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [locationState, setLocationState] = useState(() => ({
    path: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  useEffect(() => {
    const onPopState = () => {
      setLocationState({
        path: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setLocationState({
      path: url.pathname,
      search: url.search,
    });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <RouterContext.Provider value={{ path: locationState.path, search: locationState.search, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}
