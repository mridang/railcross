/**
 * CORS policy for the whole app. Railcross is server-rendered HTML plus a GitHub
 * webhook (server to server), so no other website needs to read its responses from
 * a browser. Every cross-origin origin is denied and credentials are never allowed,
 * which replaces the library default of reflecting any origin with credentials.
 */
export const corsOptions = {
  origin: false,
  credentials: false,
} as const;
