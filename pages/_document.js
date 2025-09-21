// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* Pretendard Variable (CDN) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
        />
        {/* iOS PWA 등 메타(선택) */}
        <meta name="theme-color" content="#10b981" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
