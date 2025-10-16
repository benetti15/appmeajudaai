import React, { Suspense, lazy, memo, useMemo, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading para componentes pesados
export const LazyDashboard = lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));
export const LazyChat = lazy(() => import('@/pages/Chat'));
export const LazyMap = lazy(() => import('@/pages/MapView'));

// Component de fallback para lazy loading
export const LoadingFallback = memo(() => (
  <Card className="p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </Card>
));

// Error boundary fallback
export const ErrorFallback = memo(({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <Card className="p-6 text-center">
    <h2 className="text-lg font-semibold text-destructive mb-2">Ops! Algo deu errado</h2>
    <p className="text-muted-foreground mb-4">
      {error.message || 'Ocorreu um erro inesperado.'}
    </p>
    <button 
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      Tentar novamente
    </button>
  </Card>
));

// Higher-order component para lazy loading com error boundary
export const withLazyLoading = (LazyComponent: React.LazyExoticComponent<any>) => {
  return memo((props: any) => (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// Hook para otimizar re-renders
export const useOptimizedCallback = (callback: Function, dependencies: any[]) => {
  return useCallback(callback, dependencies);
};

// Hook para memoização de valores computados
export const useOptimizedMemo = (factory: () => any, dependencies: any[]) => {
  return useMemo(factory, dependencies);
};

// Component otimizado para listas grandes
interface OptimizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  getItemKey: (item: any, index: number) => string;
  className?: string;
}

export const OptimizedList = memo<OptimizedListProps>(({ 
  items, 
  renderItem, 
  getItemKey, 
  className 
}) => {
  const memoizedItems = useMemo(() => 
    items.map((item, index) => ({
      key: getItemKey(item, index),
      element: renderItem(item, index)
    })), [items, renderItem, getItemKey]
  );

  return (
    <div className={className}>
      {memoizedItems.map(({ key, element }) => (
        <div key={key}>{element}</div>
      ))}
    </div>
  );
});

// Component para lazy loading de imagens
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const LazyImage = memo<LazyImageProps>(({ 
  src, 
  alt, 
  className, 
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcnJlZ2FuZG8uLi48L3RleHQ+PC9zdmc+"
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <img
      src={hasError ? placeholder : src}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
});

// Service Worker para cache
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Performance monitoring
export const performanceMonitor = {
  mark: (name: string) => {
    if ('performance' in window) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`Performance: ${name} took ${measure.duration}ms`);
        return measure.duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return null;
  }
};