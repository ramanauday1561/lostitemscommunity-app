import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Document shell for the static web export. Expo Router renders every route
 * inside this, so the title, favicon and theme colour live here.
 */
/**
 * Every deploy replaces the whole site, so a tab (or cached index.html) from
 * before it points at script chunks that no longer exist. When a lazy chunk
 * fails to load, reload once to pick up the new build; the guard stops a
 * genuine outage from looping.
 */
const RELOAD_ON_STALE_CHUNK = `
(function () {
  function stale(m) { return /Loading module .* failed|ChunkLoadError|Loading chunk/i.test(String(m || '')); }
  function reloadOnce() {
    try {
      var last = Number(sessionStorage.getItem('stale-chunk-reload') || 0);
      if (Date.now() - last < 60000) return;
      sessionStorage.setItem('stale-chunk-reload', String(Date.now()));
    } catch (e) {}
    location.reload();
  }
  window.addEventListener('unhandledrejection', function (e) {
    if (stale(e.reason && (e.reason.message || e.reason))) reloadOnce();
  });
  window.addEventListener('error', function (e) { if (stale(e.message)) reloadOnce(); });
})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Lost Items Community</title>
        <meta
          name="description"
          content="Report what you've found, search for what you've lost, and be part of a caring community."
        />
        <meta name="theme-color" content="#F2F2F0" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Home-screen install on iPhone: full screen, with the app's own name under the icon. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Lost Items" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script dangerouslySetInnerHTML={{ __html: RELOAD_ON_STALE_CHUNK }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#F2F2F0}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
