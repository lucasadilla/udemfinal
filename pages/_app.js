import '../styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { ArticlesProvider } from '../context/ArticlesContext';
import { MantineProvider } from '@mantine/core';

export default function MyApp({ Component, pageProps }) {
  return (
    <MantineProvider>
      <ArticlesProvider>
        <Component {...pageProps} />
      </ArticlesProvider>
    </MantineProvider>
  );
}

