'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <SimpleTooltip label={isDark ? 'Modo claro' : 'Modo oscuro'}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      >
        {mounted ? isDark ? <Sun /> : <Moon /> : <span className="size-4" />}
      </Button>
    </SimpleTooltip>
  );
}
