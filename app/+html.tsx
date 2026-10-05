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
  // A plain reload can be answered from the browser's cache (GitHub Pages lets pages be cached for 10 minutes), so
  // go to the same address with a throwaway query: the browser has never seen that URL and must ask the server.
  function freshPage(tag) {
    var u = new URL(location.href);
    u.searchParams.set('v', tag);
    location.replace(u.toString());
  }
  function stale(m) { return /Loading module .* failed|ChunkLoadError|Loading chunk/i.test(String(m || '')); }
  function reloadOnce() {
    try {
      var last = Number(sessionStorage.getItem('stale-chunk-reload') || 0);
      if (Date.now() - last < 60000) return;
      sessionStorage.setItem('stale-chunk-reload', String(Date.now()));
    } catch (e) {}
    freshPage('chunk' + Date.now());
  }
  window.addEventListener('unhandledrejection', function (e) {
    if (stale(e.reason && (e.reason.message || e.reason))) reloadOnce();
  });
  window.addEventListener('error', function (e) { if (stale(e.message)) reloadOnce(); });
})();`;

/**
 * Update check. Each deploy writes /version.json (see deploy-web.yml) and bakes the same id into this page. When the
 * server's id differs -- on load, and again whenever the app comes back to the foreground -- this tab (or installed
 * app) is running an old build, so it fetches the new one. Skipped in local builds (id 'dev'), and tried once per id
 * so a bad deploy can't cause a reload loop.
 */
const BUILD_ID = process.env.EXPO_PUBLIC_BUILD_ID || 'dev';
const CHECK_FOR_UPDATE = `
(function () {
  var BUILD = ${JSON.stringify(BUILD_ID)};
  if (BUILD === 'dev') return;
  var lastCheck = 0;
  function check() {
    if (Date.now() - lastCheck < 30000) return;
    lastCheck = Date.now();
    fetch('/version.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (!v || !v.id || v.id === BUILD) return;
      try {
        if (sessionStorage.getItem('update-tried') === v.id) return;
        sessionStorage.setItem('update-tried', v.id);
      } catch (e) {}
      var u = new URL(location.href);
      u.searchParams.set('v', v.id.slice(0, 12));
      location.replace(u.toString());
    }).catch(function () {});
  }
  check();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
  // Tidy the throwaway query once the new build is up.
  if (/[?&]v=/.test(location.search)) {
    var clean = new URL(location.href); clean.searchParams.delete('v');
    history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
  }
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
        <script dangerouslySetInnerHTML={{ __html: CHECK_FOR_UPDATE }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#F2F2F0}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
