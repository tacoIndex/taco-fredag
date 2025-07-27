import type { AppType } from "next/app";

import { ErrorBoundary } from "~/components/ErrorBoundary";
import { api } from "~/utils/api";

import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
};

export default api.withTRPC(MyApp);
