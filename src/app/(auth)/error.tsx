'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold text-destructive/80 mb-2">Something went wrong</h2>
        <p className="text-destructive/60 mb-4 font-mono text-sm">{error.message}</p>
        <pre className="text-xs text-destructive/80 bg-destructive/10 p-3 rounded overflow-auto max-h-64 mb-4">
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
