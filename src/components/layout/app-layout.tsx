import * as React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Droplets, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileTopBar } from '@/components/layout/mobile-topbar';
import { fullWidth, railWidth } from '@/components/layout/nav-items';
import { Sidebar } from '@/components/layout/sidebar';
import { useBusiness } from '@/hooks/use-catalog';
import { setCurrencySign } from '@/lib/format';

const COLLAPSED_KEY = 'lavadero.sidebar.collapsed';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  // Preferencia de sidebar colapsado (solo aplica en escritorio)
  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === '1');
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1');
      return !prev;
    });
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isLoading && user?.role === 'OPERATOR') {
      const allowed = ['/dashboard', '/ordenes', '/reportes', '/configuracion'];
      const isAllowed = allowed.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));
      if (!isAllowed) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, user, location.pathname, navigate]);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Droplets className="size-6" aria-hidden />
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando plataforma...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CurrencySync />

      {/* Escritorio: riel + panel */}
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      {/* Móvil: cabecera compacta */}
      <MobileTopBar />

      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-width)]"
        style={
          {
            '--sidebar-width': `${collapsed ? railWidth : fullWidth}px`,
          } as React.CSSProperties
        }
      >
        {/* Escritorio: buscador y acciones */}
        <Header />

        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
          {/* La animación de entrada solo en escritorio: en móvil desplazar
              todo el contenido en cada navegación se siente lento. */}
          <div className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-6 lg:animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Móvil: barra inferior con pestañas y botón de acción */}
      <MobileNav />
    </div>
  );
}

/** Aplica el signo de moneda configurado por el negocio a los formateadores. */
function CurrencySync() {
  const { data } = useBusiness();

  React.useEffect(() => {
    if (data?.currencySign) setCurrencySign(data.currencySign);
  }, [data?.currencySign]);

  return null;
}
