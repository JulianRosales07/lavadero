'use client';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const authenticated = await login(email, password);
      toast.success(`Bienvenido, ${authenticated.name}`);
      if (authenticated.role === 'SUPER_ADMIN') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón de Modo Claro / Oscuro Flotante */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border/80 bg-background/80 p-1 shadow-md backdrop-blur-md transition-all hover:bg-background">
        <ThemeToggle />
      </div>

      {/* ══ MÓVIL (< lg) ══ */}
      <div className="flex min-h-screen flex-col bg-background text-foreground lg:hidden">
        {/* Cabecera Azul con Video */}
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-12 text-center"
          style={{
            minHeight: '38vh',
          }}
        >
          {/* Video de Fondo Móvil */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/lavautos.mp4" type="video/mp4" />
          </video>

          {/* Overlay Gradiente Azul */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(26, 111, 212, 0.85) 0%, rgba(30, 144, 255, 0.80) 55%, rgba(86, 180, 255, 0.85) 100%)',
            }}
          />

          <div
            className="pointer-events-none absolute -left-10 -top-10 size-56 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-3 text-white">
            <div className="flex size-24 items-center justify-center rounded-full bg-white/95 p-2.5 shadow-lg ring-4 ring-white/40 backdrop-blur-md">
              <img src="/DetailOps.png" alt="DetailOps" className="size-full object-contain" />
            </div>
            <span className="text-3xl font-bold tracking-tight">DetailOps</span>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 w-full leading-none" aria-hidden>
            <svg viewBox="0 0 375 80" preserveAspectRatio="none" className="block h-16 w-full text-background fill-current">
              <path d="M0,40 C60,75 120,10 187,45 C254,80 310,15 375,40 L375,80 L0,80 Z" fill="rgba(255,255,255,0.18)" />
              <path d="M0,58 C50,42 110,68 187,55 C264,42 320,66 375,50 L375,80 L0,80 Z" />
            </svg>
          </div>
        </div>

        {/* Formulario Móvil */}
        <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-6">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Iniciar sesión</h2>
              <p className="mt-2 text-base text-muted-foreground">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email-m" className="text-base font-medium text-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email-m"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@detailops.com"
                  className="h-12 rounded-xl border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-m" className="text-base font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password-m"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-border bg-card px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-3 h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:opacity-95 text-white"
                style={{ background: 'linear-gradient(135deg, #1e90ff, #56b4ff)' }}
                loading={submitting}
              >
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ══ ESCRITORIO (≥ lg) ══ */}
      <div className="hidden min-h-screen lg:flex bg-background text-foreground">
        {/* Panel Izquierdo con Video de Fondo */}
        <div
          className="relative flex w-[44%] flex-col items-center justify-center overflow-hidden"
          style={{ background: '#1a6fd4' }}
        >
          {/* Video de Fondo Escritorio */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/lavautos.mp4" type="video/mp4" />
          </video>

          {/* Overlay con Gradiente Azul y Transparencia */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(26, 111, 212, 0.82) 0%, rgba(30, 144, 255, 0.74) 55%, rgba(86, 180, 255, 0.78) 100%)',
            }}
          />

          {/* Círculos de luz decorativos */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -right-10 top-1/3 size-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }}
          />

          {/* Logo y texto con glassmorphism */}
          <div className="relative z-10 flex flex-col items-center gap-7 px-10 text-center text-white">
            <div className="flex size-28 items-center justify-center rounded-full bg-transparent p-3.5 shadow-2xl ring-4 ring-white/50 backdrop-blur-md transition-transform hover:scale-105 duration-300">
              <img src="/DetailOps1.png" alt="DetailOps" className="size-full object-contain" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-md">DetailOps</h1>
              <p className="max-w-sm text-base leading-relaxed text-blue-50 drop-shadow-sm">
                Administra tu negocio de detailing y autolavado de manera sencilla. Órdenes, clientes, cobros y reportes en un solo lugar.
              </p>
            </div>

            <div className="mt-2 flex gap-2.5">
              <span className="size-2.5 rounded-full bg-white shadow-sm opacity-90" />
              <span className="size-2.5 rounded-full bg-white opacity-40" />
              <span className="size-2.5 rounded-full bg-white opacity-40" />
            </div>
          </div>

          {/* Olas inferiores */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full" aria-hidden>
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="block h-28 w-full">
              <path d="M0,60 C80,110 150,10 250,60 C350,110 420,10 500,60 L500,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
              <path d="M0,80 C100,30 200,110 300,70 C400,30 460,90 500,60 L500,120 L0,120 Z" fill="rgba(255,255,255,0.20)" />
            </svg>
          </div>

          {/* Curva divisor dinámica hacia el formulario */}
          <div className="pointer-events-none absolute -right-1 bottom-0 top-0 w-24" aria-hidden>
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" className="block h-full w-full text-background fill-current">
              <path
                d="M100,0 L40,0 C15,130 65,260 30,390 C-5,520 60,650 25,740 C10,775 40,800 100,800 Z"
              />
            </svg>
          </div>
        </div>

        {/* Panel Derecho */}
        <div className="flex flex-1 items-center justify-center bg-background px-12">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Iniciar sesión</h2>
              <p className="mt-2 text-base text-muted-foreground">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium text-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@detailops.com"
                  className="h-12 rounded-xl border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-border bg-card px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-3 h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:opacity-95 text-white"
                style={{ background: 'linear-gradient(135deg, #1e90ff, #56b4ff)' }}
                loading={submitting}
              >
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
