/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Convierte los imports de barril en imports directos: menos módulos que
    // compilar en desarrollo y menos JavaScript en el cliente.
    // Nota: no incluir @tanstack/react-query, rompe la recolección de páginas.
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // NEXT_PUBLIC_API_URL no se declara aquí a propósito: Next ya incrusta las
  // variables NEXT_PUBLIC_* desde .env.local, y duplicarlo hacía que el valor
  // quedara fijado en el config en lugar de leerse del entorno.
};

export default nextConfig;
