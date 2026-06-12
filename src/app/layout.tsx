import { Providers } from './providers';
import '../index.css';

export const metadata = {
  title: 'AppForge',
  description: 'Convert websites to native apps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
