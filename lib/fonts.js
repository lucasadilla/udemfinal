// Optimize font loading with next/font
// Since Corbel is a system font (Windows), we use a system font stack
// This ensures optimal font loading with proper fallbacks
import { Inter } from 'next/font/google';

// Use Inter as a modern alternative with system font fallbacks
// This provides better cross-platform support and optimization
export const interFont = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading - show fallback until font loads
  variable: '--font-inter',
  fallback: ['Corbel', 'Georgia', 'serif'], // Fallback to Corbel and system fonts
});

// System font variable for CSS
export const systemFont = {
  variable: '--font-system',
  className: 'font-system',
};

