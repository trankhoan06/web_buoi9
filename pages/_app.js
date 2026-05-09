import { SessionProvider } from "next-auth/react";

/**
 * _app.js: Bọc toàn bộ ứng dụng trong SessionProvider
 * để mọi trang đều có thể dùng useSession() hook.
 */
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
