import './globals.css';

export const metadata = {
  title: 'FinMate AI — Your Personal Finance Mentor',
  description: 'Smart financial planning with FIRE calculator, Tax Wizard, Portfolio X-Ray, AI Advisor, and Couple Mode. Made for India 🇮🇳',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
