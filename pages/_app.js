import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '../styles/globals.css';
import { ArticlesProvider } from '../context/ArticlesContext';
import { MantineProvider } from '@mantine/core';
import Footer from '../components/Footer';
import SponsorsBar from '../components/Sponsors';
import { Analytics } from "@vercel/analytics/react"
import Head from 'next/head';


export default function MyApp({ Component, pageProps }) {
  return (
    <MantineProvider>
      <ArticlesProvider>
          <Head>
              <link rel="icon" href="/favicon.PNG"/>
          </Head>
          <Analytics />
          <div className="flex-wrapper">
          <Component {...pageProps} />
          <div>
            <SponsorsBar />
            <Footer />
          </div>
        </div>
      </ArticlesProvider>
    </MantineProvider>
  );
}

