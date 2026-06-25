/**
 * The marketing home page served at `GET /`.
 *
 * Kept as a single self-contained HTML string so the Worker can return it
 * without a filesystem, a view engine, or a static-asset binding. Styling is
 * pulled from CDNs at render time (Tailwind, Google Fonts), so there is no
 * build step for the page itself.
 */
export const HOME_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Railcross — merge windows for GitHub</title>
<meta name="description" content="Railcross locks your default branch on a schedule and unlocks it again, so nothing merges outside the window you choose." />
<link rel="canonical" href="https://railcross.apps.mrida.ng/" />
<meta name="theme-color" content="#fbfbfa" />
<meta name="robots" content="index, follow" />
<link rel="icon" type="image/png" href="https://avatars.githubusercontent.com/in/823576?v=4" />
<link rel="apple-touch-icon" href="https://avatars.githubusercontent.com/in/823576?v=4" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Railcross" />
<meta property="og:url" content="https://railcross.apps.mrida.ng/" />
<meta property="og:title" content="Railcross — merge windows for GitHub" />
<meta property="og:description" content="Locks your default branch on a schedule and unlocks it again, so nothing merges outside your window." />
<meta property="og:image" content="https://railcross.apps.mrida.ng/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Railcross — lock the branch out of hours." />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Railcross — merge windows for GitHub" />
<meta name="twitter:description" content="Locks your default branch on a schedule and unlocks it again, so nothing merges outside your window." />
<meta name="twitter:image" content="https://railcross.apps.mrida.ng/og.png" />

<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/app.css" />
<style>body{-webkit-font-smoothing:antialiased}.display{font-optical-sizing:auto}</style>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Railcross","applicationCategory":"DeveloperApplication","operatingSystem":"GitHub","description":"A GitHub App that locks your default branch on a schedule and unlocks it again, enforcing merge windows.","url":"https://railcross.apps.mrida.ng/","author":{"@type":"Person","name":"Mridang Agarwalla","url":"https://github.com/mridang"},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
</script>
</head>
<body class="font-sans bg-[#fbfbfa] text-zinc-900 antialiased">
  <div class="min-h-screen flex flex-col">
    <header class="mx-auto w-full max-w-4xl px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="https://avatars.githubusercontent.com/in/823576?v=4" class="h-7 w-7 rounded-md ring-1 ring-zinc-200" alt="Railcross" />
        <span class="text-sm font-medium tracking-tight">Railcross</span>
      </div>
      <a href="https://github.com/apps/railcross" class="text-sm text-zinc-500 hover:text-zinc-900 transition">Install on GitHub &rarr;</a>
    </header>
    <main class="mx-auto w-full max-w-4xl px-8 flex-1 grid md:grid-cols-2 gap-14 items-center pb-20">
      <div>
        <h1 class="font-display display text-6xl font-semibold leading-[1.05] tracking-[-0.01em]">Lock the branch <em class="italic text-amber-700">out of hours.</em></h1>
        <p class="mt-7 text-[17px] leading-relaxed text-zinc-600 max-w-sm">Railcross locks your default branch on a schedule and unlocks it again &mdash; so nothing merges outside the window you choose. No bots, no CI changes.</p>
        <div class="mt-9 flex items-center gap-4">
          <a href="https://github.com/apps/railcross" class="rounded-full bg-zinc-900 px-7 py-3 text-sm font-medium text-white hover:bg-zinc-700 transition">Install</a>
          <a href="https://github.com/mridang/railcrossapp" class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition">View source</a>
        </div>
      </div>
      <div class="rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div class="px-7 pt-7"><div class="font-mono text-[11px] uppercase tracking-widest text-zinc-400">merge window</div><div class="mt-2 font-display display text-2xl font-medium">main &middot; acme/web</div></div>
        <div class="mt-5 px-7 space-y-3 text-sm">
          <div class="flex items-center justify-between"><span class="text-zinc-500">Lock</span><span class="font-mono text-[13px]">18:00</span></div>
          <div class="flex items-center justify-between"><span class="text-zinc-500">Unlock</span><span class="font-mono text-[13px]">09:00</span></div>
          <div class="flex items-center justify-between"><span class="text-zinc-500">Timezone</span><span class="font-mono text-[13px]">Europe/London</span></div>
        </div>
        <div class="mt-5 border-t border-dashed border-zinc-200 px-7 py-5 flex items-center justify-between"><span class="text-sm text-zinc-500">Status</span><span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 ring-1 ring-amber-200"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>Locked until 09:00</span></div>
      </div>
    </main>
  </div>
</body>
</html>`;
