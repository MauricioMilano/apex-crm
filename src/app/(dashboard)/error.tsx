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
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-red-950 border border-red-800 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
        <p className="text-red-300 mb-4 font-mono text-sm">{error.message}</p>
        <pre className="text-xs text-red-400 bg-red-950/50 p-3 rounded overflow-auto max-h-64 mb-4">
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
