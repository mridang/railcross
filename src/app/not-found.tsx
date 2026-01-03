export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/js/tailwind.3.4.5.js" />
      </head>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="mt-4 text-xl text-gray-600">Page not found</p>
            <a
              href="/"
              className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
