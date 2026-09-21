import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Document shell for the static web export. Expo Router renders every route
 * inside this, so the title, favicon and theme colour live here.
 */
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#F2F2F0}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
