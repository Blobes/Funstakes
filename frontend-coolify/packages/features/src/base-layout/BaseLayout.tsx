"use server";

import { Providers } from "./Providers";
import React from "react";

export async function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                (function() {
                  try {
                    const mode = localStorage.getItem('mui-mode') || 'dark';
                    const bg = mode === 'dark' ? '#11131B' : '#ffffff'; 
                    document.documentElement.style.setProperty('--app-bg', bg);
                  } catch (e) {}
                })();
              `,
          }}
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701,900,901&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <noscript>You need to enable JavaScript to run this app!</noscript>
      </body>
    </html>
  );
}
