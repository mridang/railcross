import { FunctionalComponent, render } from '@mridang/nestjs-defaults';

const ExpiredPage: FunctionalComponent = () => {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
        <meta charset="UTF-8" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Log in</title>
        <meta name="robots" content="noindex, nofollow" />
        <script src="/static/js/tailwind.3.4.5.js"></script>
      </head>
      <body>
        <div className="h-screen w-screen bg-gray-400">
          {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
          <div className="h-modal fixed inset-0 z-50 grid size-full place-items-center justify-center backdrop-blur-sm">
            <div className="container relative m-auto px-6">
              <div className="m-auto md:w-7/12">
                <div className="rounded-md bg-white shadow-xl dark:bg-gray-800">
                  <div className="p-8">
                    <div className="space-y-4">
                      <div className="w-16">
                        <img src="/static/icon.svg" alt="Logo" />
                      </div>
                      <h2 className="mb-8 text-2xl font-bold text-cyan-900 dark:text-white">
                        Your session expired.
                        <br />
                        Log back in to continue
                      </h2>
                    </div>
                    <form method="POST" action="/auth/reauthenticate">
                      <input type="hidden" name="_csrf" value="{{csrfToken}}" />
                      <div className="mt-10 grid space-y-4">
                        <button
                          className="group h-12 rounded-md border-2 border-gray-300 px-6 transition duration-300 hover:border-blue-400 focus:bg-blue-50 active:bg-blue-100"
                          type="submit"
                        >
                          <div className="relative flex items-center justify-center space-x-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              className="absolute left-0 w-5 text-gray-700"
                              viewBox="0 0 16 16"
                            >
                              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                            </svg>
                            <span className="block w-max text-sm font-semibold tracking-wide text-gray-700 transition duration-300 group-hover:text-blue-600 sm:text-base dark:text-white">
                              Continue with Github
                            </span>
                          </div>
                        </button>
                      </div>
                    </form>
                    <div className="mt-14 space-y-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      <p className="text-xs">
                        By proceeding, you agree to our
                        <button className="underline">Terms of Use</button>
                        and confirm you have read our
                        <button className="underline">
                          Privacy and Cookie Statement
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default () => render(<ExpiredPage />);
