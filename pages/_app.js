import '../styles/globals.css';
import { ArticlesProvider } from '../context/ArticlesContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <ArticlesProvider>
      <Component {...pageProps} />
    </ArticlesProvider>
  );
}

