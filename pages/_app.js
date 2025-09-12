import '../styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { ArticlesProvider } from '../context/ArticlesContext';
import { MantineProvider } from '@mantine/core';
import Footer from '../components/Footer';

export default function MyApp({ Component, pageProps }) {
  return (
    <MantineProvider>
      <ArticlesProvider>
        <div className="flex-wrapper">
          <Component {...pageProps} />
          <Footer />
        </div>
      </ArticlesProvider>
    </MantineProvider>
  );
}

