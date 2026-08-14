'use client';

import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { GlobalSearch } from '@/components/layout/global-search';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/components/auth-provider';

/**
 * Cabecera de escritorio: buscador global y acciones rápidas.
 * En móvil se usa MobileTopBar + MobileNav.
 */
export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md lg:flex sm:px-6">
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        {user?.role !== 'OPERATOR' && (
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/ordenes/nueva">
              <Plus />
              Nueva orden
            </Link>
          </Button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
