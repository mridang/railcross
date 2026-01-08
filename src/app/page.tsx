import { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import SetupPage from './app/page';

export const metadata: Metadata = {
  title: 'Railcross - GitHub Branch Protection Scheduler',
  description:
    'Automatically lock and unlock branch protection to enforce merge windows for your teams.',
  robots: 'noindex, nofollow',
};

export default async function LandingPage() {
  const headerList = await headers();
  const initialUrl =
    headerList.get('x-opennext-initial-url') ||
    headerList.get('next-url') ||
    '/';
  const isAppPath =
    initialUrl === '/app' ||
    initialUrl.startsWith('/app?') ||
    initialUrl.startsWith('/app/');

  // If this request was for /app but got routed here, render the schedules UI.
  if (isAppPath) {
    return <SetupPage />;
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script src="/js/tailwind.3.4.5.js" strategy="beforeInteractive" />
      </head>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-14 md:flex-row md:items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-300 ring-1 ring-slate-700">
                <span>Railcross</span>
                <span className="size-1 rounded-full bg-emerald-400" />
                <span>Branch windows on autopilot</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Automatically lock branches outside merge windows.
              </h1>
              <p className="text-lg text-slate-200 md:text-xl">
                Choose lock/unlock times per repository. Railcross will toggle
                GitHub branch protection for your default branches so merges
                only happen when you want them to.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <form action="/auth/login" method="POST">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
                  >
                    Install &amp; Sign in with GitHub
                  </button>
                </form>
                <a
                  href="/app"
                  className="text-sm font-semibold text-slate-200 underline decoration-slate-500 underline-offset-4 hover:text-white"
                >
                  Already set up? View schedules
                </a>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-2 ring-1 ring-slate-700">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Enforces GitHub branch protection
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-2 ring-1 ring-slate-700">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Per-repo lock/unlock schedules
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-2 ring-1 ring-slate-700">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Works across org installations
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-2xl shadow-slate-900/60 ring-1 ring-slate-700/50">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="inline-block size-2 rounded-full bg-emerald-400" />
                    Live preview
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Default Branch
                  </span>
                </div>
                <div className="space-y-4 text-sm text-slate-200">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Lock window</span>
                      <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">
                        19:00 UTC
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300">
                      Branch protection locks outside working hours.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Unlock window</span>
                      <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">
                        07:00 UTC
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300">
                      Merges open automatically when the workday starts.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Org / repos</span>
                      <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200">
                        Auto-discovered
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300">
                      We read your installations to find the repos you granted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
