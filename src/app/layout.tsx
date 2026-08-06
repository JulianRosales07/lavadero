import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

// Las familias tipográficas se definen en globals.css (--font-sans / --font-mono)
// con un stack del sistema, así la build no depende de descargar fuentes.

export const metadata: Metadata = {
  title: {
    default: 'Lavadero · Administración',
    template: '%s · Lavadero',
  },
  description:
    'Plataforma para administrar la operación diaria de un lavadero de vehículos: órdenes, cobros, evidencias y reportes.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Permite usar las áreas seguras (notch, barra de gestos) en móvil
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
