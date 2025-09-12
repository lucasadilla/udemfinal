import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '../styles/globals.css';
import { ArticlesProvider } from '../context/ArticlesContext';
import { MantineProvider } from '@mantine/core';
import Footer from '../components/Footer';
import SponsorsBar from '../components/Sponsors';

export default function MyApp({ Component, pageProps }) {
  return (
    <MantineProvider>
      <ArticlesProvider>
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

