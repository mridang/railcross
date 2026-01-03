import { cookies } from 'next/headers';

export default async function TestPage() {
  const cookieStore = await cookies();
  const jwtCookie = cookieStore.get('jwt');
  const jwtSecret = process.env.JWT_SECRET;

  return (
    <html lang="en">
      <body>
        <pre>
          {JSON.stringify(
            {
              hasJwtCookie: !!jwtCookie,
              jwtLength: jwtCookie?.value?.length || 0,
              hasJwtSecret: !!jwtSecret,
              secretLength: jwtSecret?.length || 0,
            },
            null,
            2,
          )}
        </pre>
      </body>
    </html>
  );
}
