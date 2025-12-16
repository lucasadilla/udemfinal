import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '../styles/globals.css';
import { ArticlesProvider } from '../context/ArticlesContext';
import { MantineProvider } from '@mantine/core';
import Head from 'next/head';
import Script from 'next/script';
import { SWRConfig } from 'swr';
import Footer from '../components/Footer';
import SponsorsBar from '../components/Sponsors';
import { Analytics } from "@vercel/analytics/react";
import { interFont } from '../lib/fonts';


export default function MyApp({ Component, pageProps }) {
  return (
    <div className={interFont.variable}>
      <MantineProvider>
        <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 2000,
          refreshInterval: 0,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
        }}
      >
        <ArticlesProvider>
            <Head>
              <link rel="icon" href="/images/favicon.PNG" sizes="any" type="image/png" />
              <link rel="shortcut icon" href="/images/favicon.PNG" />
              <link rel="apple-touch-icon" href="/images/favicon.PNG" sizes="180x180" />
            </Head>
            <Analytics />
            {/* Analytics is already optimized by Vercel, but we can use Script for other third-party scripts if needed */}
            <div className="flex-wrapper">
            <Component {...pageProps} />
            <div>
              <SponsorsBar />
              <Footer />
            </div>
          </div>
        </ArticlesProvider>
      </SWRConfig>
    </MantineProvider>
    </div>
  );
}

