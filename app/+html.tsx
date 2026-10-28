import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style>{`
          html, body, #root { height: 100%; background-color: #0A0A0A; }
          /* Sotto i 16px Safari/Chrome mobile fanno zoom automatico al focus sui campi */
          input, select, textarea { font-size: 16px !important; }
          /* Smartphone: meno spazio vuoto sopra il contenuto (vedi lib/compatto.ts). Desktop invariato */
          @media (max-width: 600px) {
            [data-compatto="home"] { margin-top: 0 !important; }
            [data-compatto="header"] { margin-top: 0 !important; }
            [data-compatto="indietro"] { margin-bottom: 12px !important; }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
