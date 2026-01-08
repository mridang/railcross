import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Session Expired - Railcross',
  robots: 'noindex, nofollow',
};

export default function ReauthenticatePage() {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script src="/js/tailwind.3.4.5.js" strategy="beforeInteractive" />
      </head>
      <body>
        <div className="flex h-screen w-screen items-center justify-center bg-gray-400">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
            <h1 className="mb-4 text-2xl font-bold">Session Expired</h1>
            <p className="mb-6 text-gray-600">
              Your session has expired or you need to authenticate. Please click
              the button below to log in with GitHub.
            </p>
            <form action="/auth/login" method="POST">
              <button
                type="submit"
                className="w-full rounded bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              >
                Authenticate with GitHub
              </button>
            </form>
          </div>
        </div>
      </body>
    </html>
  );
}
