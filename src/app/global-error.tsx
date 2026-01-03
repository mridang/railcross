'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Error - Railcross</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '3.75rem',
                fontWeight: 'bold',
                color: '#1f2937',
              }}
            >
              Error
            </h1>
            <p
              style={{
                marginTop: '1rem',
                fontSize: '1.25rem',
                color: '#4b5563',
              }}
            >
              Something went wrong
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: '1.5rem',
                display: 'inline-block',
                borderRadius: '0.375rem',
                backgroundColor: '#2563eb',
                padding: '0.5rem 1rem',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
