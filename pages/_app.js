// pages/_app.js
import "../styles/globals.css";
import { useRouter } from "next/router";
import Header from "../components/Header";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const hideHeader = router.pathname === "/"; // 랜딩에서만 헤더 숨김

  return (
    <>
      {!hideHeader && <Header />}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
